'use client'

import { useEffect, useState, use } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/utils/supabase/client'
import {
    ArrowLeft,
    Calendar,
    TrendingDown,
    TrendingUp,
    FileText,
    Building2,
    Home
} from 'lucide-react'
import SearchableSelect from '@/components/SearchableSelect'

// Define interfaces for history data
interface HistoryItem {
    id: number
    fecha_cambio: string
    precio_anterior: number
    precio_nuevo: number
    ahorro_generado: number
    tipo?: string
    negociacion_id?: string
    porcentaje_base?: number
    porcentaje_negociado?: number
    comentarios?: string
    Neg_productos: {
        descripcion: string
        tipo: string
        supplier_id: string
        supplier_name?: string
    } | null
    supplier_name?: string
}

export default function NegotiationHistoryPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params)
    const router = useRouter()

    const [loading, setLoading] = useState(true)
    const [history, setHistory] = useState<HistoryItem[]>([])
    const [suppliers, setSuppliers] = useState<any[]>([])
    const [supplierName, setSupplierName] = useState('Cargando...')
    const [currentSupplierId, setCurrentSupplierId] = useState(id)

    // Filters State
    const [selectedSupplier, setSelectedSupplier] = useState(id)
    const [selectedProduct, setSelectedProduct] = useState('Todos')
    const [selectedDate, setSelectedDate] = useState('Todas')
    const [selectedNegId, setSelectedNegId] = useState('Todos')

    useEffect(() => {
        loadInitialData()
    }, [])

    const loadInitialData = async () => {
        setLoading(true)
        try {
            // 1. Fetch available suppliers
            const { data: sups } = await supabase.from('Neg_query_proveedores').select('*')
            if (sups) setSuppliers(sups)

            // 2. Resolve the stable ID for the initial filter
            let initialStableId = id
            let supplierData = sups?.find(s => s.nit == id || s.id == id || s.codigo == id)

            if (!supplierData && id.startsWith('temp-id-')) {
                const idx = parseInt(id.replace('temp-id-', ''))
                if (sups && sups[idx]) {
                    supplierData = sups[idx]
                }
            }

            if (supplierData) {
                // Prioritize name as the identifier for filtering
                initialStableId = supplierData.proveedor || supplierData.nombre || supplierData.razon_social || supplierData.nit || id
                setSelectedSupplier(initialStableId)
            } else {
                setSelectedSupplier(id)
            }

            // 3. Load history with the resolved ID
            // loadHistory uses selectedSupplier, so we pass it explicitly or wait for effect
            // In this version of the code, loadHistory is called below manually
            await loadHistory(initialStableId)
        } catch (err) {
            console.error(err)
        } finally {
            setLoading(false)
        }
    }

    const loadHistory = async (overrideId?: string) => {
        const targetId = overrideId || selectedSupplier
        try {
            // Update Supplier Name based on selection
            if (targetId === 'Todos') {
                setSupplierName('Todos los Proveedores')
            } else {
                const found = suppliers.find(s =>
                    s.nit == targetId || s.id == targetId || s.codigo == targetId || s._ui_id == targetId
                )
                if (found) {
                    setSupplierName(found.proveedor || found.nombre || found.razon_social || found.proveedor_nombre || 'Proveedor Seleccionado')
                } else {
                    setSupplierName(targetId.toString().startsWith('temp-id-') ? `Proveedor Seleccionado` : `Proveedor ${targetId}`)
                }
            }

            // 2. Fetch History
            // We want all history records where the product belongs to this supplier?
            // Or just fetch all history and filter by supplier ID if we can match it.
            // Since we can't easily filter by a deep relation in one go without shaping the query correctly:
            // "Neg_productos!inner(supplier_id)" ensures we only get rows that have a matching product.
            // NOTE: supabase-js syntax for foreign table filter
            // .eq('Neg_productos.supplier_id', id) might work if relation is set up right
            // but our ID is loose (might be NIT, might be internal ID).
            // For now, let's fetch a bit more and filter clientside if IDs don't match 1:1 on type (string vs int).

            // 2. Fetch History
            // We filter on the server if a specific supplier is selected for maximum reliability
            let query = supabase
                .from('Neg_historial_precios')
                .select(`
                    *,
                    Neg_productos (
                        descripcion,
                        tipo,
                        supplier_id,
                        supplier_name
                    )
                `)

            if (targetId !== 'Todos') {
                // Search by both ID and name for maximum reliability on server
                query = query.or(`supplier_id.eq."${targetId}",supplier_name.eq."${targetId}"`)
            }

            const { data: historyData, error } = await query.order('fecha_cambio', { ascending: false })

            if (error) throw error

            // 3. Resolve possible IDs for ONLY the target selection
            const possibleIds: string[] = [targetId]

            // Find the supplier object to get its alternate identities (NIT, Code)
            const foundSup = suppliers.find(s =>
                s.nit?.toString() === targetId ||
                s.id?.toString() === targetId ||
                s.codigo?.toString() === targetId ||
                s.proveedor === targetId
            )

            if (foundSup) {
                if (foundSup.nit) possibleIds.push(foundSup.nit.toString())
                if (foundSup.codigo) possibleIds.push(foundSup.codigo.toString())
                if (foundSup.proveedor) possibleIds.push(foundSup.proveedor)
            }

            // Clean up and deduplicate IDs
            const uniquePossibleIds = Array.from(new Set(possibleIds.filter(Boolean).map(i => i.toString())))

            // 5. Final Filtering
            const filteredData = (historyData || []).filter(h => {
                if (targetId === 'Todos') return true

                const itemSupplierId = (h as any).supplier_id?.toString()
                const itemSupplierName = (h as any).supplier_name?.toString()
                const joinedSupplierId = h.Neg_productos?.supplier_id?.toString()
                const joinedSupplierName = (h.Neg_productos as any)?.supplier_name?.toString()

                return uniquePossibleIds.includes(itemSupplierId) ||
                    uniquePossibleIds.includes(joinedSupplierId) ||
                    uniquePossibleIds.includes(itemSupplierName) ||
                    uniquePossibleIds.includes(joinedSupplierName)
            })

            console.log('History Debug:', {
                targetId,
                possibleIds,
                totalLoaded: historyData?.length,
                filtered: filteredData.length
            })

            setHistory(filteredData)

        } catch (error) {
            console.error('Error loading history:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleUpdateComment = async (id: number, val: string) => {
        try {
            const { error } = await supabase
                .from('Neg_historial_precios')
                .update({ comentarios: val })
                .eq('id', id)

            if (error) throw error

            setHistory(prev => prev.map(item => item.id === id ? { ...item, comentarios: val } : item))
        } catch (err) {
            console.error('Error al actualizar el comentario:', err)
        }
    }

    // Effect to reload history when supplier changes
    useEffect(() => {
        // We ensure we only trigger this after the initial mount logic or on user interaction
        if (suppliers.length > 0) {
            loadHistory()
        }
    }, [selectedSupplier])

    // Derived State for Filters
    const uniqueProducts = Array.from(new Set(history.map(item => item.Neg_productos?.descripcion).filter(Boolean))) as string[]

    // Create unique periods (Month Year) for date filter
    const uniqueDates = Array.from(new Set(history.map(item => {
        const d = new Date(item.fecha_cambio)
        return d.toLocaleDateString('es-CO', { month: 'long', year: 'numeric' })
    })))

    const uniqueNegIds = Array.from(new Set(history.map(item => item.negociacion_id).filter(Boolean))) as string[]

    // Filtered Data: history is already filtered by supplier in loadHistory
    const filteredHistory = history.filter(item => {
        const matchesProduct = selectedProduct === 'Todos' || item.Neg_productos?.descripcion === selectedProduct

        const itemDate = new Date(item.fecha_cambio).toLocaleDateString('es-CO', { month: 'long', year: 'numeric' })
        const matchesDate = selectedDate === 'Todas' || itemDate === selectedDate

        const matchesNegId = selectedNegId === 'Todos' || item.negociacion_id === selectedNegId

        return matchesProduct && matchesDate && matchesNegId
    })

    // Calculate Summary if a specific NegId is selected
    const summaryNeg = selectedNegId !== 'Todos' ? filteredHistory.reduce(
        (acc, curr) => {
            const tipo = curr.tipo || curr.Neg_productos?.tipo || 'Ahorro'
            if (tipo === 'Ahorro') acc.ahorro += Number(curr.ahorro_generado || 0)
            if (tipo === 'Avoidance') acc.avoidance += Number(curr.ahorro_generado || 0)
            return acc
        },
        { ahorro: 0, avoidance: 0 }
    ) : null

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(value)
    }

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('es-CO', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        })
    }

    return (
        <div className="min-h-screen bg-slate-50 text-slate-900 font-sans pb-12">
            {/* Navbar */}
            <nav className="bg-white border-b border-slate-200 sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16">
                        <div className="flex items-center gap-4">
                            <button
                                onClick={() => router.back()}
                                className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-500"
                            >
                                <ArrowLeft className="w-5 h-5" />
                            </button>
                            <div>
                                <h1 className="text-lg font-bold text-[#254153]">Historial de Negociaciones</h1>
                                <p className="text-xs text-slate-500">Registro de cambios de precios</p>
                            </div>
                            <div className="h-8 w-px bg-slate-200 mx-2"></div>
                            <button
                                onClick={() => router.push('/')}
                                className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-500 hover:text-[#254153] flex items-center gap-2"
                                title="Ir al Inicio"
                            >
                                <Home className="w-5 h-5" />
                                <span className="text-sm font-medium hidden sm:inline">Inicio</span>
                            </button>
                        </div>
                    </div>
                </div>
            </nav>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

                <div className="mb-8 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                    <div>
                        <h2 className="text-2xl font-bold text-[#254153] mb-1">{supplierName}</h2>
                        <p className="text-slate-500">Auditoría completa de cambios de tarifas y acuerdos.</p>
                    </div>

                    {/* Filters Area */}
                    <div className="flex flex-wrap gap-3">
                        <div className="relative min-w-[200px] z-40">
                            <SearchableSelect
                                value={selectedSupplier}
                                onChange={setSelectedSupplier}
                                options={[{value: 'Todos', label: 'Todos los Proveedores'}, ...suppliers.map(s => {
                                    const supplierNameValue = s.proveedor || s.nombre || s.razon_social || s.nit || s.id
                                    return {
                                        value: supplierNameValue,
                                        label: s.proveedor || s.nombre || supplierNameValue
                                    }
                                })]}
                                searchPlaceholder="Buscar proveedor..."
                            />
                        </div>
                        <div className="relative min-w-[200px] z-30">
                            <SearchableSelect
                                value={selectedProduct}
                                onChange={setSelectedProduct}
                                options={[{value: 'Todos', label: 'Todos los Productos'}, ...uniqueProducts.map(p => ({value: p, label: p}))]}
                                searchPlaceholder="Buscar producto..."
                            />
                        </div>
                        <div className="relative min-w-[200px] z-20">
                            <SearchableSelect
                                value={selectedDate}
                                onChange={setSelectedDate}
                                options={[{value: 'Todas', label: 'Todas las Fechas'}, ...uniqueDates.map(d => ({value: d, label: d}))]}
                                searchPlaceholder="Buscar fecha..."
                            />
                        </div>
                        <div className="relative min-w-[200px] z-10">
                            <SearchableSelect
                                value={selectedNegId}
                                onChange={setSelectedNegId}
                                options={[{value: 'Todos', label: 'Todos los ID Neg'}, ...uniqueNegIds.map(id => ({value: id, label: id}))]}
                                searchPlaceholder="Buscar ID..."
                            />
                        </div>
                    </div>
                </div>

                {summaryNeg && (
                    <div className="mb-6 bg-[#254153]/5 border border-[#254153]/10 rounded-xl p-6 flex flex-col sm:flex-row items-center justify-between gap-4 animate-in fade-in zoom-in duration-300">
                        <div>
                            <h3 className="text-lg font-bold text-[#254153]">Resumen de Negociación</h3>
                            <p className="text-sm text-slate-500 font-mono mt-1">ID: {selectedNegId}</p>
                        </div>
                        <div className="flex gap-6 bg-white p-4 rounded-lg border border-slate-200 shadow-sm">
                            <div className="text-right">
                                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Ahorro Total</p>
                                <p className="text-xl font-bold text-emerald-600">{formatCurrency(summaryNeg.ahorro)}</p>
                            </div>
                            <div className="w-px bg-slate-200"></div>
                            <div className="text-right">
                                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Avoidance Total</p>
                                <p className="text-xl font-bold text-amber-600">{formatCurrency(summaryNeg.avoidance)}</p>
                            </div>
                        </div>
                    </div>
                )}

                {loading ? (
                    <div className="text-center py-20 bg-white rounded-2xl shadow-sm border border-slate-200">
                        <p className="text-slate-400">Cargando historial...</p>
                    </div>
                ) : filteredHistory.length === 0 ? (
                    <div className="text-center py-20 bg-white rounded-2xl shadow-sm border border-slate-200">
                        <FileText className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-slate-900">No se encontraron registros</h3>
                        <p className="text-slate-500 max-w-sm mx-auto mt-2">
                            {history.length > 0 ? 'Intenta cambiar los filtros seleccionados.' : 'Aún no se han guardado negociaciones.'}
                        </p>
                    </div>
                ) : (
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider font-semibold border-b border-slate-200">
                                        <th className="px-6 py-4">ID Neg</th>
                                        <th className="px-6 py-4">Fecha / Hora</th>
                                        <th className="px-6 py-4">Proveedor</th>
                                        <th className="px-6 py-4">Producto</th>
                                        <th className="px-6 py-4 text-right">Precio Anterior</th>
                                        <th className="px-6 py-4 text-right">Nuevo Precio</th>
                                        <th className="px-6 py-4 text-right">Impacto</th>
                                        <th className="px-6 py-4 text-right">Consumo Mes Prom</th>
                                        <th className="px-6 py-4 text-right">Ahorro Generado</th>
                                        <th className="px-6 py-4">Comentarios</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {filteredHistory.map((item) => {
                                        const tipo = item.tipo || item.Neg_productos?.tipo || 'Ahorro'
                                        
                                        const displayPrecioAnterior = tipo === 'Avoidance' 
                                            ? item.precio_anterior * (1 + (item.porcentaje_base || 0) / 100) 
                                            : item.precio_anterior

                                        const displayPrecioNuevo = tipo === 'Avoidance' 
                                            ? item.precio_anterior * (1 + (item.porcentaje_negociado || 0) / 100) 
                                            : item.precio_nuevo

                                        const isReduction = displayPrecioNuevo < displayPrecioAnterior
                                        const diff = displayPrecioAnterior - displayPrecioNuevo

                                        return (
                                            <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    {item.negociacion_id ? (
                                                        <button 
                                                            onClick={() => setSelectedNegId(item.negociacion_id!)}
                                                            className="text-[10px] font-mono font-bold text-[#254153] bg-blue-50 hover:bg-blue-100 px-2 py-1 rounded border border-blue-200 transition-colors flex items-center justify-center max-w-[100px] truncate"
                                                            title={item.negociacion_id}
                                                        >
                                                            {item.negociacion_id.split('-').slice(0, 2).join('-')}
                                                        </button>
                                                    ) : (
                                                        <span className="text-[10px] text-slate-400 font-mono">N/A</span>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="flex items-center gap-2 text-slate-600">
                                                        <Calendar className="w-4 h-4 text-slate-400" />
                                                        <span className="text-sm font-medium">{formatDate(item.fecha_cambio)}</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="flex items-center gap-2">
                                                        <Building2 className="w-4 h-4 text-[#254153]" />
                                                        <span className="text-sm font-bold text-slate-700">
                                                            {(item as any).supplier_name || (item.Neg_productos as any)?.supplier_name || (selectedSupplier !== 'Todos' ? supplierName : 'N/A')}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className="block font-medium text-slate-800">{item.Neg_productos?.descripcion || 'Producto Eliminado'}</span>
                                                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider mt-1 ${tipo === 'Ahorro' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                                                        }`}>
                                                        {tipo}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-right text-slate-500 font-mono">
                                                    {formatCurrency(displayPrecioAnterior)}
                                                </td>
                                                <td className="px-6 py-4 text-right font-bold text-[#254153] font-mono">
                                                    {formatCurrency(displayPrecioNuevo)}
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <span className={`inline-flex items-center gap-1 font-medium text-sm ${isReduction ? 'text-emerald-600' : 'text-rose-600'}`}>
                                                        {isReduction ? <TrendingDown className="w-4 h-4" /> : <TrendingUp className="w-4 h-4" />}
                                                        {formatCurrency(Math.abs(diff))}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-right font-medium text-slate-700">
                                                    {(item as any).cantidad_mensual || '-'}
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <span className="font-bold text-emerald-600">
                                                        {formatCurrency(item.ahorro_generado || 0)}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 w-64 align-middle">
                                                    <input
                                                        type="text"
                                                        value={item.comentarios || ''}
                                                        onChange={(e) => {
                                                            setHistory(prev => prev.map(h => 
                                                                h.id === item.id ? { ...h, comentarios: e.target.value } : h
                                                            ))
                                                        }}
                                                        onBlur={(e) => handleUpdateComment(item.id, e.target.value)}
                                                        onKeyDown={(e) => {
                                                            if (e.key === 'Enter') {
                                                                (e.target as HTMLInputElement).blur()
                                                            }
                                                        }}
                                                        placeholder="Sin comentarios"
                                                        className="w-full text-xs px-2.5 py-1.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#254153] focus:border-[#254153] bg-slate-50 focus:bg-white transition-all text-slate-700 font-medium"
                                                    />
                                                </td>
                                            </tr>
                                        )
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </main>
        </div>
    )
}
