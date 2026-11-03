import { NextResponse } from 'next/server'

interface CompromisoInput {
    id: number
    compromiso: string
    responsable: string
    fecha: string
    estado: string
    comentario?: string
}

interface StoredToken {
    accessToken?: string
    refreshToken?: string
    expiresAt?: number
}

const TENANT_ID = process.env.MICROSOFT_TENANT_ID || 'fa1de04f-4780-4d83-a942-93c7ae8dee9d'
const CLIENT_ID = process.env.MICROSOFT_CLIENT_ID || '26c2227e-2ebe-4075-9f76-3cfa2cfe1bcf'
const TASK_ID = process.env.MICROSOFT_PLANNER_TASK_ID || '2wWpIG7OAkiUmiHmvd8vA2QAPssG'
const DELEGATED_SCOPE = 'https://graph.microsoft.com/Tasks.ReadWrite https://graph.microsoft.com/Tasks.ReadWrite.Shared offline_access'

function toDeterministicGuid(id: number): string {
    const hexId = Math.max(0, Number(id) || 0).toString(16).padStart(12, '0').slice(-12)
    return `00000000-0000-4000-8000-${hexId}`
}

function buildTokenPayload(tokenData: any, fallbackRefreshToken?: string): StoredToken {
    const expiresAt = Date.now() + (Number(tokenData.expires_in || 3600) - 120) * 1000
    return {
        accessToken: tokenData.access_token,
        refreshToken: tokenData.refresh_token || fallbackRefreshToken || '',
        expiresAt
    }
}

async function requestTokenWithOptionalSecret(
    tokenUrl: string,
    baseParams: Record<string, string>,
    clientSecret?: string
) {
    // Intento 1: como cliente público (estándar para Device Code / Delegado)
    const params1 = new URLSearchParams(baseParams)
    const res1 = await fetch(tokenUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: params1.toString(),
        cache: 'no-store'
    })
    const data1 = await res1.json()

    if (res1.ok && data1.access_token) {
        return { ok: true, data: data1 }
    }

    // Si Entra ID exige client_secret (AADSTS7000218) y está en variable de entorno, reintentar con client_secret
    const errText = String(data1.error_description || data1.error || '')
    if (clientSecret && (errText.includes('AADSTS7000218') || errText.includes('client_secret'))) {
        const params2 = new URLSearchParams({ ...baseParams, client_secret: clientSecret })
        const res2 = await fetch(tokenUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: params2.toString(),
            cache: 'no-store'
        })
        const data2 = await res2.json()
        return { ok: res2.ok && Boolean(data2.access_token), data: data2 }
    }

    return { ok: false, data: data1 }
}

async function syncCompromisosToPlanner(
    accessToken: string,
    compromisos: CompromisoInput[],
    reviewDate: string
) {
    const detailsUrl = `https://graph.microsoft.com/v1.0/planner/tasks/${TASK_ID}/details`
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
        return {
            ok: false,
            status: detailsRes.status,
            error: `No se pudo leer la tarea de Planner (${detailsRes.status}): ${graphErr}`
        }
    }

    const etag = detailsData['@odata.etag']
    const existingChecklist = detailsData.checklist || {}
    const validCompromisos = compromisos.filter(c => c.compromiso && c.compromiso.trim().length > 0)

    const checklistPayload: Record<string, any> = {}
    const activeGuids = new Set<string>()

    validCompromisos.slice(0, 20).forEach((item) => {
        const guid = toDeterministicGuid(item.id)
        activeGuids.add(guid)

        const prefix = `[${item.responsable || 'S/R'} | ${item.fecha || 'S/F'}] `
        const cleanText = item.compromiso.trim().replace(/\s+/g, ' ')
        const commentSuffix = item.comentario?.trim() ? ` (${item.comentario.trim()})` : ''
        const fullTitle = `${prefix}${cleanText}${commentSuffix}`.slice(0, 100)

        checklistPayload[guid] = {
            '@odata.type': '#microsoft.graph.plannerChecklistItem',
            title: fullTitle,
            isChecked: item.estado === 'Realizado'
        }
    })

    Object.keys(existingChecklist).forEach(existingGuid => {
        if (existingGuid.startsWith('00000000-0000-4000-8000-') && !activeGuids.has(existingGuid)) {
            checklistPayload[existingGuid] = null
        }
    })

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
        return {
            ok: false,
            status: patchRes.status,
            error: `Error al actualizar la tarea en Planner (${patchRes.status}): ${patchErrMsg}`
        }
    }

    return {
        ok: true,
        status: 200,
        syncedCount: Math.min(validCompromisos.length, 20),
        totalCount: validCompromisos.length,
        taskId: TASK_ID
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json()
        const action: string = body.action || 'sync'
        const compromisos: CompromisoInput[] = Array.isArray(body.compromisos) ? body.compromisos : []
        const reviewDate: string = body.reviewDate || new Date().toISOString().split('T')[0]
        const stored: StoredToken = body.storedToken || {}
        const clientSecret = process.env.MICROSOFT_CLIENT_SECRET || undefined

        const tokenUrl = `https://login.microsoftonline.com/${TENANT_ID}/oauth2/v2.0/token`

        // ACCIÓN: Guardar token delegado directo (respaldo manual)
        if (action === 'save_manual_token' && body.manualToken) {
            const cleanToken = String(body.manualToken).trim().replace(/^Bearer\s+/i, '')
            const newToken = buildTokenPayload({ access_token: cleanToken, expires_in: 3600 }, stored.refreshToken)
            const syncRes = await syncCompromisosToPlanner(cleanToken, compromisos, reviewDate)
            return NextResponse.json({ ...syncRes, newToken }, { status: syncRes.status })
        }

        // ACCIÓN: Verificar si el usuario ya completó el inicio de sesión con Device Code
        if (action === 'poll_device_code' && body.deviceCode) {
            const tokenResult = await requestTokenWithOptionalSecret(
                tokenUrl,
                {
                    client_id: CLIENT_ID,
                    grant_type: 'urn:ietf:params:oauth:grant-type:device_code',
                    device_code: body.deviceCode
                },
                clientSecret
            )

            if (!tokenResult.ok) {
                const errCode = tokenResult.data?.error || ''
                if (errCode === 'authorization_pending' || errCode === 'slow_down') {
                    return NextResponse.json({ ok: false, pending: true })
                }
                return NextResponse.json(
                    {
                        ok: false,
                        pending: false,
                        error: tokenResult.data?.error_description || errCode || 'Error verificando inicio de sesión'
                    },
                    { status: 400 }
                )
            }

            const newToken = buildTokenPayload(tokenResult.data)
            const syncRes = await syncCompromisosToPlanner(tokenResult.data.access_token, compromisos, reviewDate)
            return NextResponse.json({ ...syncRes, newToken }, { status: syncRes.status })
        }

        // FLUJO NORMAL (action === 'sync'):
        // 1. Verificar si ya tenemos un Access Token delegado vigente o un Refresh Token guardado
        let validAccessToken: string | null = null
        let updatedToken: StoredToken | undefined = undefined

        if (stored.accessToken && stored.expiresAt && Date.now() < stored.expiresAt) {
            validAccessToken = stored.accessToken
        } else if (stored.refreshToken) {
            const refreshResult = await requestTokenWithOptionalSecret(
                tokenUrl,
                {
                    client_id: CLIENT_ID,
                    grant_type: 'refresh_token',
                    refresh_token: stored.refreshToken,
                    scope: DELEGATED_SCOPE
                },
                clientSecret
            )
            if (refreshResult.ok) {
                validAccessToken = refreshResult.data.access_token
                updatedToken = buildTokenPayload(refreshResult.data, stored.refreshToken)
            }
        }

        // 2. Si tenemos token delegado válido, sincronizar con Planner directamente
        if (validAccessToken) {
            const syncRes = await syncCompromisosToPlanner(validAccessToken, compromisos, reviewDate)
            if (syncRes.ok || syncRes.status !== 401) {
                return NextResponse.json(
                    updatedToken ? { ...syncRes, newToken: updatedToken } : syncRes,
                    { status: syncRes.status }
                )
            }
        }

        // 3. Si aún no hay sesión delegada iniciada, solicitar un Device Code a Microsoft Entra ID
        // usando el permiso delegado Tasks.ReadWrite ya aprobado en AGENTE PERFORMANCE
        const deviceCodeUrl = `https://login.microsoftonline.com/${TENANT_ID}/oauth2/v2.0/devicecode`
        const dcParams = new URLSearchParams({
            client_id: CLIENT_ID,
            scope: DELEGATED_SCOPE
        })

        const dcRes = await fetch(deviceCodeUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: dcParams.toString(),
            cache: 'no-store'
        })
        const dcData = await dcRes.json()

        if (!dcRes.ok || !dcData.device_code) {
            return NextResponse.json(
                {
                    ok: false,
                    error: dcData.error_description || dcData.error || 'No se pudo iniciar el flujo de autenticación delegada con Microsoft'
                },
                { status: 400 }
            )
        }

        return NextResponse.json({
            ok: false,
            needsAuth: true,
            userCode: dcData.user_code,
            deviceCode: dcData.device_code,
            verificationUri: dcData.verification_uri || 'https://login.microsoft.com/device',
            message: dcData.message
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
