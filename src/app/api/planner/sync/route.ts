import { NextResponse } from 'next/server'

interface CompromisoInput {
    id: number
    compromiso: string
    responsable: string
    fecha: string
    estado: string
    comentario?: string
}

function toDeterministicGuid(id: number): string {
    const hexId = Math.max(0, Number(id) || 0).toString(16).padStart(12, '0').slice(-12)
    return `00000000-0000-4000-8000-${hexId}`
}

function extractTokenRoles(accessToken: string): string[] {
    try {
        const parts = accessToken.split('.')
        if (parts.length < 2) return []
        const payloadJson = Buffer.from(parts[1], 'base64url').toString('utf8')
        const payload = JSON.parse(payloadJson)
        return Array.isArray(payload.roles) ? payload.roles : []
    } catch {
        return []
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json()
        const compromisos: CompromisoInput[] = Array.isArray(body.compromisos) ? body.compromisos : []
        const reviewDate: string = body.reviewDate || new Date().toISOString().split('T')[0]

        const tenantId = process.env.MICROSOFT_TENANT_ID || 'fa1de04f-4780-4d83-a942-93c7ae8dee9d'
        const clientId = process.env.MICROSOFT_CLIENT_ID || '26c2227e-2ebe-4075-9f76-3cfa2cfe1bcf'
        const clientSecret = process.env.MICROSOFT_CLIENT_SECRET || ''
        const taskId = process.env.MICROSOFT_PLANNER_TASK_ID || '2wWpIG7OAkiUmiHmvd8vA2QAPssG'

        if (!clientSecret) {
            return NextResponse.json(
                {
                    ok: false,
                    error: 'Falta configurar MICROSOFT_CLIENT_SECRET en las variables de entorno (.env.local)'
                },
                { status: 400 }
            )
        }

        // 1. Obtener Access Token en Microsoft Entra ID (OAuth2 Client Credentials)
        const tokenUrl = `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`
        const tokenParams = new URLSearchParams({
            client_id: clientId,
            client_secret: clientSecret,
            scope: 'https://graph.microsoft.com/.default',
            grant_type: 'client_credentials'
        })

        const tokenRes = await fetch(tokenUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: tokenParams.toString(),
            cache: 'no-store'
        })

        const tokenData = await tokenRes.json()

        if (!tokenRes.ok || !tokenData.access_token) {
            const rawError = tokenData.error_description || tokenData.error || 'Error de autenticación con Microsoft Entra ID'
            return NextResponse.json(
                {
                    ok: false,
                    error: `Error autenticando en Entra ID: ${rawError}`
                },
                { status: 401 }
            )
        }

        const accessToken = tokenData.access_token
        const tokenRoles = extractTokenRoles(accessToken)

        // 2. Obtener detalles actuales de la tarea en Planner (necesario para el header If-Match @odata.etag)
        const detailsUrl = `https://graph.microsoft.com/v1.0/planner/tasks/${taskId}/details`
        const detailsRes = await fetch(detailsUrl, {
            method: 'GET',
            headers: {
                Authorization: `Bearer ${accessToken}`,
                Accept: 'application/json'
            },
            cache: 'no-store'
        })

        const detailsData = await detailsRes.json()

        if (!detailsRes.ok) {
            const graphErr = detailsData?.error?.message || JSON.stringify(detailsData)
            const rolesInfo = tokenRoles.length > 0 ? tokenRoles.join(', ') : 'Ninguno'
            return NextResponse.json(
                {
                    ok: false,
                    error: `No se pudo leer la tarea de Planner (${detailsRes.status}). Permisos actuales en AGENTE PERFORMANCE: [${rolesInfo}]. Se requiere "Tasks.ReadWrite.All" (Aplicación). Detalle: ${graphErr}`
                },
                { status: detailsRes.status }
            )
        }

        const etag = detailsData['@odata.etag']
        const existingChecklist = detailsData.checklist || {}

        // Filtrar compromisos que tengan texto
        const validCompromisos = compromisos.filter(c => c.compromiso && c.compromiso.trim().length > 0)

        // 3. Construir objeto checklist (máximo 20 ítems permitidos por Microsoft Planner por tarea)
        const checklistPayload: Record<string, any> = {}
        const activeGuids = new Set<string>()

        validCompromisos.slice(0, 20).forEach((item) => {
            const guid = toDeterministicGuid(item.id)
            activeGuids.add(guid)

            const prefix = `[${item.responsable || 'S/R'} | ${item.fecha || 'S/F'}] `
            const cleanText = item.compromiso.trim().replace(/\s+/g, ' ')
            const commentSuffix = item.comentario?.trim() ? ` (${item.comentario.trim()})` : ''
            // Microsoft Planner exige máximo 100 caracteres por ítem de checklist
            const fullTitle = `${prefix}${cleanText}${commentSuffix}`.slice(0, 100)

            checklistPayload[guid] = {
                '@odata.type': '#microsoft.graph.plannerChecklistItem',
                title: fullTitle,
                isChecked: item.estado === 'Realizado'
            }
        })

        // Limpiar ítems antiguos generados por la app que hayan sido eliminados
        Object.keys(existingChecklist).forEach(existingGuid => {
            if (existingGuid.startsWith('00000000-0000-4000-8000-') && !activeGuids.has(existingGuid)) {
                checklistPayload[existingGuid] = null
            }
        })

        // 4. Construir resumen detallado en las Notas (description) de la tarea
        const descriptionLines = [
            `📅 Última Foto MCI: ${reviewDate}`,
            `Total compromisos: ${validCompromisos.length}`,
            `----------------------------------------`,
            ...validCompromisos.map((c, idx) => {
                const statusIcon = c.estado === 'Realizado' ? '✅' : c.estado === 'En proceso' ? '🔄' : '⏳'
                const comment = c.comentario?.trim() ? ` | Nota: ${c.comentario.trim()}` : ''
                return `${idx + 1}. ${statusIcon} [${c.estado}] ${c.compromiso.trim()} — Resp: ${c.responsable} — Fecha: ${c.fecha}${comment}`
            })
        ]

        const patchPayload = {
            description: descriptionLines.join('\n'),
            previewType: 'checklist',
            checklist: checklistPayload
        }

        // 5. Actualizar detalles de la tarea en Microsoft Planner
        const patchRes = await fetch(detailsUrl, {
            method: 'PATCH',
            headers: {
                Authorization: `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
                'If-Match': etag
            },
            body: JSON.stringify(patchPayload)
        })

        if (!patchRes.ok) {
            const patchErrData = await patchRes.json().catch(() => ({}))
            const patchErrMsg = patchErrData?.error?.message || `HTTP ${patchRes.status}`
            const rolesInfo = tokenRoles.length > 0 ? tokenRoles.join(', ') : 'Ninguno'
            return NextResponse.json(
                {
                    ok: false,
                    error: `Error al actualizar la tarea en Planner (${patchRes.status}): ${patchErrMsg}. Permisos de aplicación detectados en AGENTE PERFORMANCE: [${rolesInfo}]. Asegúrate de que tenga "Tasks.ReadWrite.All" con consentimiento de administrador concedido.`
                },
                { status: patchRes.status }
            )
        }

        return NextResponse.json({
            ok: true,
            syncedCount: Math.min(validCompromisos.length, 20),
            totalCount: validCompromisos.length,
            taskId
        })
    } catch (error: any) {
        console.error('Error syncing to Microsoft Planner:', error)
        return NextResponse.json(
            {
                ok: false,
                error: error?.message || 'Error interno al sincronizar con Microsoft Planner'
            },
            { status: 500 }
        )
    }
}
