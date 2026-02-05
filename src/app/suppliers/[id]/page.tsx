'use client'

import { useEffect, useState, use } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/utils/supabase/client'
import {
    ArrowLeft,
    TrendingDown,
    ShieldCheck,
    Package,
    Calendar,
    TrendingUp,
    FileText,
    BarChart3
} from 'lucide-react'
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
    AreaChart,
    Area
} from 'recharts'

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
    } | null
}

export default function SupplierDashboardPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params)
    const router = useRouter()

    const [loading, setLoading] = useState(true)
    const [supplierName, setSupplierName] = useState('Cargando...')
    const [history, setHistory] = useState<HistoryItem[]>([])

    // KPIs
    const [totalSavings, setTotalSavings] = useState(0)
    const [totalAvoidance, setTotalAvoidance] = useState(0)
    const [productsNegotiated, setProductsNegotiated] = useState(0)

    // Chart State
    const [chartData, setChartData] = useState<any[]>([])
    const [selectedChartProduct, setSelectedChartProduct] = useState<string>('Todos')

    useEffect(() => {
        loadDashboardData()
    }, [id])

    const loadDashboardData = async () => {
        setLoading(true)
        try {
            // 1. Fetch Supplier Name
            let { data: supplierData } = await supabase
                .from('Neg_query_proveedores')
                .select('*')
                .or(`nit.eq.${id},id.eq.${id},codigo.eq.${id}`)
                .single()

            // Fallback: If no match and it's a temp ID, fetch all and find by index
            if (!supplierData && id.startsWith('temp-id-')) {
                const idx = parseInt(id.replace('temp-id-', ''))
                const { data: allSuppliers } = await supabase
                    .from('Neg_query_proveedores')
                    .select('*')

                if (allSuppliers && allSuppliers[idx]) {
                    supplierData = allSuppliers[idx]
                }
            }

            if (supplierData) {
                setSupplierName(supplierData.proveedor || supplierData.nombre || supplierData.razon_social || supplierData.proveedor_nombre || 'Proveedor Desconocido')
            } else {
                setSupplierName(`Proveedor ${id}`)
            }

            // 2. Fetch Full History for this supplier
            const { data: historyData, error } = await supabase
                .from('Neg_historial_precios')
                .select(`
                    *,
                    Neg_productos (
                        descripcion,
                        tipo,
                        supplier_id
                    )
                `)
                .order('fecha_cambio', { ascending: false })

            if (error) throw error

            // Fix: Filter by supplier_id to avoid data leakage
            // We compare the joined product's supplier_id with the current page param 'id'
            // We try both strict equality and loose equality since one might be string/number
            const validHistory = (historyData || []).filter(h => {
                if (!h.Neg_productos) return false
                return h.Neg_productos.supplier_id == id
            })

            setHistory(validHistory)

            // 3. Calculate KPIs from History
            let savings = 0
            let avoidance = 0
            const uniqueProductNames = new Set()

            validHistory.forEach(item => {
                const product = item.Neg_productos
                if (!product) return

                uniqueProductNames.add(product.descripcion)

                const ahorro = item.ahorro_generado || 0
                if (product.tipo === 'Ahorro') {
                    savings += ahorro
                } else if (product.tipo === 'Avoidance') {
                    avoidance += ahorro
                }
            })

            setTotalSavings(savings)
            setTotalAvoidance(avoidance)
            setProductsNegotiated(uniqueProductNames.size)

            // 4. Prepare Chart Data
            prepareChartData(validHistory)

        } catch (error) {
            console.error('Error loading dashboard:', error)
        } finally {
            setLoading(false)
        }
    }

    const prepareChartData = (data: HistoryItem[]) => {
        // Sort history by date ascending for the chart
        const sortedHistory = [...data].sort((a, b) =>
            new Date(a.fecha_cambio).getTime() - new Date(b.fecha_cambio).getTime()
        )

        const products = Array.from(new Set(sortedHistory.map(h => h.Neg_productos?.descripcion).filter(Boolean))) as string[]

        // If 'Todos' is selected, we might want to show an aggregate or something else.
        // But price evolution is usually better per product.
        // Let's filter by product if one is selected.
        const filtered = selectedChartProduct === 'Todos'
            ? sortedHistory
            : sortedHistory.filter(h => h.Neg_productos?.descripcion === selectedChartProduct)

        const chartPoints = filtered.map(h => ({
            fecha: new Date(h.fecha_cambio).toLocaleDateString('es-CO', { day: '2-digit', month: 'short' }),
            fullDate: new Date(h.fecha_cambio).toLocaleDateString('es-CO'),
            precio: h.precio_nuevo,
            producto: h.Neg_productos?.descripcion,
            ahorro: h.ahorro_generado
        }))

        setChartData(chartPoints)
    }

    // Effect to update chart when product selection changes
    useEffect(() => {
        if (history.length > 0) {
            prepareChartData(history)
        }
    }, [selectedChartProduct, history])

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(value)
    }

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('es-CO', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
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
                            <h1 className="text-lg font-bold text-[#254153]">Dashboard de Proveedor</h1>
                        </div>
                    </div>
                </div>
            </nav>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

                <div className="mb-8">
                    <h2 className="text-3xl font-bold text-[#254153] mb-2">{supplierName}</h2>
                    <p className="text-slate-500">Resumen general de rendimiento y acuerdos comerciales. <span className="text-xs font-medium text-slate-400 ml-2">Nota: Los ahorros se proyectan a 12 meses.</span></p>
                </div>

                {/* KPI Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    {/* Savings KPI */}
                    <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm relative overflow-hidden group hover:shadow-md transition-shadow">
                        <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-50 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110"></div>
                        <div className="relative z-10">
                            <p className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-2">Ahorro Anual Estimado</p>
                            <h3 className="text-3xl font-bold text-emerald-600 mb-1">{formatCurrency(totalSavings)}</h3>
                            <div className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                                <TrendingDown className="w-3 h-3" /> Acumulado
                            </div>
                        </div>
                    </div>

                    {/* Avoidance KPI */}
                    <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm relative overflow-hidden group hover:shadow-md transition-shadow">
                        <div className="absolute top-0 right-0 w-24 h-24 bg-amber-50 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110"></div>
                        <div className="relative z-10">
                            <p className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-2">Avoidance Anual Estimado</p>
                            <h3 className="text-3xl font-bold text-amber-600 mb-1">{formatCurrency(totalAvoidance)}</h3>
                            <div className="inline-flex items-center gap-1 text-xs font-medium text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">
                                <ShieldCheck className="w-3 h-3" /> Acumulado
                            </div>
                        </div>
                    </div>

                    {/* Products KPI */}
                    <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm relative overflow-hidden group hover:shadow-md transition-shadow">
                        <div className="absolute top-0 right-0 w-24 h-24 bg-blue-50 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110"></div>
                        <div className="relative z-10">
                            <p className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-2">Productos Negociados</p>
                            <h3 className="text-3xl font-bold text-[#254153] mb-1">{productsNegotiated}</h3>
                            <div className="inline-flex items-center gap-1 text-xs font-medium text-[#254153] bg-slate-100 px-2 py-0.5 rounded-full">
                                <Package className="w-3 h-3" /> Total Únicos
                            </div>
                        </div>
                    </div>
                </div>

                {/* Evolution Chart Section */}
                <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm mb-8">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-indigo-50 rounded-lg">
                                <BarChart3 className="w-5 h-5 text-indigo-600" />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-[#254153]">Evolución de Precios</h3>
                                <p className="text-xs text-slate-500">Histórico de variaciones por negociación</p>
                            </div>
                        </div>

                        <select
                            value={selectedChartProduct}
                            onChange={(e) => setSelectedChartProduct(e.target.value)}
                            className="bg-slate-50 border border-slate-200 text-slate-700 text-sm rounded-lg focus:ring-indigo-500 focus:border-indigo-500 block p-2.5 outline-none transition-all min-w-[200px]"
                        >
                            <option value="Todos">Todos los Productos</option>
                            {Array.from(new Set(history.map(h => h.Neg_productos?.descripcion).filter(Boolean))).map(p => (
                                <option key={p as string} value={p as string}>{p as string}</option>
                            ))}
                        </select>
                    </div>

                    <div className="h-[350px] w-full">
                        {chartData.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                                    <defs>
                                        <linearGradient id="colorPrecio" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#6366f1" stopOpacity={0.1} />
                                            <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                    <XAxis
                                        dataKey="fecha"
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fill: '#94a3b8', fontSize: 12 }}
                                        dy={10}
                                    />
                                    <YAxis
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fill: '#94a3b8', fontSize: 12 }}
                                        tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
                                    />
                                    <Tooltip
                                        contentStyle={{
                                            backgroundColor: '#fff',
                                            borderRadius: '12px',
                                            border: 'none',
                                            boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)'
                                        }}
                                        formatter={(value: any) => [formatCurrency(value), 'Precio']}
                                        labelStyle={{ fontWeight: 'bold', color: '#1e293b', marginBottom: '4px' }}
                                    />
                                    <Area
                                        type="monotone"
                                        dataKey="precio"
                                        stroke="#6366f1"
                                        strokeWidth={3}
                                        fillOpacity={1}
                                        fill="url(#colorPrecio)"
                                        dot={{ r: 4, fill: '#6366f1', strokeWidth: 2, stroke: '#fff' }}
                                        activeDot={{ r: 6, strokeWidth: 0 }}
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="h-full flex flex-col items-center justify-center text-slate-400">
                                <FileText className="w-12 h-12 mb-2 opacity-20" />
                                <p>No hay suficientes datos para generar el gráfico</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* History Section */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="p-6 border-b border-slate-200">
                        <h3 className="text-lg font-bold text-[#254153]">Historial Completo de Negociaciones</h3>
                    </div>

                    {history.length === 0 ? (
                        <div className="text-center py-16">
                            <FileText className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                            <p className="text-slate-500">No exiten registros históricos para este proveedor.</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider font-semibold border-b border-slate-200">
                                        <th className="px-6 py-4">Fecha</th>
                                        <th className="px-6 py-4">Producto</th>
                                        <th className="px-6 py-4 text-right">Anterior</th>
                                        <th className="px-6 py-4 text-right">Nuevo</th>
                                        <th className="px-6 py-4 text-right">Ahorro</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {history.map((item) => (
                                        <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                                            <td className="px-6 py-4 text-sm text-slate-600 whitespace-nowrap">
                                                <div className="flex items-center gap-2">
                                                    <Calendar className="w-3 h-3 text-slate-400" />
                                                    {formatDate(item.fecha_cambio)}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="block font-medium text-slate-800 text-sm">{item.Neg_productos?.descripcion}</span>
                                                <span className="text-xs text-slate-400">{item.Neg_productos?.tipo}</span>
                                            </td>
                                            <td className="px-6 py-4 text-right text-sm text-slate-500 font-mono">
                                                {formatCurrency(item.precio_anterior)}
                                            </td>
                                            <td className="px-6 py-4 text-right text-sm font-bold text-[#254153] font-mono">
                                                {formatCurrency(item.precio_nuevo)}
                                            </td>
                                            <td className="px-6 py-4 text-right text-sm font-bold text-emerald-600">
                                                {formatCurrency(item.ahorro_generado || 0)}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

            </main>
        </div>
    )
}
