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
    Building2
} from 'lucide-react'

// Define interfaces for history data
interface HistoryItem {
    id: number
    fecha_cambio: string
    precio_anterior: number
    precio_nuevo: number
    ahorro_generado: number
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

    // Filtered Data: history is already filtered by supplier in loadHistory
    const filteredHistory = history.filter(item => {
        const matchesProduct = selectedProduct === 'Todos' || item.Neg_productos?.descripcion === selectedProduct

        const itemDate = new Date(item.fecha_cambio).toLocaleDateString('es-CO', { month: 'long', year: 'numeric' })
        const matchesDate = selectedDate === 'Todas' || itemDate === selectedDate

        return matchesProduct && matchesDate
    })

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
                        <div className="relative">
                            <select
                                value={selectedSupplier}
                                onChange={(e) => setSelectedSupplier(e.target.value)}
                                className="appearance-none bg-white border border-slate-300 rounded-lg py-2 pl-4 pr-10 text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#254153] focus:border-transparent shadow-sm min-w-[200px]"
                            >
                                <option value="Todos">Todos los Proveedores</option>
                                {suppliers.map(s => {
                                    const supplierNameValue = s.proveedor || s.nombre || s.razon_social || s.nit || s.id
                                    return (
                                        <option key={s.id || s.nit || s._ui_id} value={supplierNameValue}>
                                            {s.proveedor || s.nombre}
                                        </option>
                                    )
                                })}
                            </select>
                        </div>
                        <div className="relative">
                            <select
                                value={selectedProduct}
                                onChange={(e) => setSelectedProduct(e.target.value)}
                                className="appearance-none bg-white border border-slate-300 rounded-lg py-2 pl-4 pr-10 text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#254153] focus:border-transparent shadow-sm"
                            >
                                <option value="Todos">Todos los Productos</option>
                                {uniqueProducts.map(p => (
                                    <option key={p} value={p}>{p}</option>
                                ))}
                            </select>
                        </div>
                        <div className="relative">
                            <select
                                value={selectedDate}
                                onChange={(e) => setSelectedDate(e.target.value)}
                                className="appearance-none bg-white border border-slate-300 rounded-lg py-2 pl-4 pr-10 text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#254153] focus:border-transparent shadow-sm"
                            >
                                <option value="Todas">Todas las Fechas</option>
                                {uniqueDates.map(d => (
                                    <option key={d} value={d} className="capitalize">{d}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>

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
                                        <th className="px-6 py-4">Fecha / Hora</th>
                                        <th className="px-6 py-4">Proveedor</th>
                                        <th className="px-6 py-4">Producto</th>
                                        <th className="px-6 py-4 text-right">Precio Anterior</th>
                                        <th className="px-6 py-4 text-right">Nuevo Precio</th>
                                        <th className="px-6 py-4 text-right">Impacto</th>
                                        <th className="px-6 py-4 text-right">Ahorro Generado</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {filteredHistory.map((item) => {
                                        const isReduction = item.precio_nuevo < item.precio_anterior
                                        const diff = item.precio_anterior - item.precio_nuevo

                                        return (
                                            <tr key={item.id} className="hover:bg-slate-50 transition-colors">
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
                                                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-600 mt-1">
                                                        {item.Neg_productos?.tipo || 'N/A'}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-right text-slate-500 font-mono">
                                                    {formatCurrency(item.precio_anterior)}
                                                </td>
                                                <td className="px-6 py-4 text-right font-bold text-[#254153] font-mono">
                                                    {formatCurrency(item.precio_nuevo)}
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <span className={`inline-flex items-center gap-1 font-medium text-sm ${isReduction ? 'text-emerald-600' : 'text-rose-600'}`}>
                                                        {isReduction ? <TrendingDown className="w-4 h-4" /> : <TrendingUp className="w-4 h-4" />}
                                                        {formatCurrency(Math.abs(diff))}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <span className="font-bold text-emerald-600">
                                                        {formatCurrency(item.ahorro_generado || 0)}
                                                    </span>
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
