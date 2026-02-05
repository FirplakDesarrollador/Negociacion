'use client'

import { useEffect, useState, useMemo, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/utils/supabase/client'
import html2canvas from 'html2canvas'
import jsPDF from 'jspdf'
import {
    ArrowLeft,
    TrendingDown,
    ShieldCheck,
    Calendar,
    Filter,
    ArrowUpRight,
    Users,
    Activity,
    Download
} from 'lucide-react'
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    LineChart,
    Line,
    Legend,
    Cell
} from 'recharts'

export default function BIVisualsPage() {
    const router = useRouter()
    const [loading, setLoading] = useState(true)
    const [exporting, setExporting] = useState(false)
    const reportRef = useRef<HTMLDivElement>(null)

    // Filters
    const now = new Date()
    const startOfYear = new Date(now.getFullYear(), 0, 1).toISOString().split('T')[0]
    const today = now.toISOString().split('T')[0]

    const [dateFrom, setDateFrom] = useState(startOfYear)
    const [dateTo, setDateTo] = useState(today)

    // Data
    const [history, setHistory] = useState<any[]>([])

    useEffect(() => {
        loadBIData()
    }, [])

    const loadBIData = async () => {
        setLoading(true)
        try {
            const { data, error } = await supabase
                .from('Neg_historial_precios')
                .select(`
                    *,
                    Neg_productos (
                        descripcion,
                        tipo,
                        supplier_name
                    )
                `)
                .order('fecha_cambio', { ascending: true })

            if (error) throw error
            setHistory(data || [])
        } catch (error) {
            console.error('Error loading BI data:', error)
        } finally {
            setLoading(false)
        }
    }

    const filteredData = useMemo(() => {
        return history.filter(item => {
            const date = item.fecha_cambio.split('T')[0]
            return date >= dateFrom && date <= dateTo
        })
    }, [history, dateFrom, dateTo])

    const kpis = useMemo(() => {
        let savingsValue = 0
        let avoidanceValue = 0
        let savingsCount = 0
        let avoidanceCount = 0

        filteredData.forEach(item => {
            if (item.Neg_productos?.tipo === 'Ahorro') {
                savingsValue += item.ahorro_generado || 0
                savingsCount++
            } else {
                avoidanceValue += item.ahorro_generado || 0
                avoidanceCount++
            }
        })

        return {
            savingsValue,
            avoidanceValue,
            savingsCount,
            avoidanceCount,
            totalNegotiations: filteredData.length
        }
    }, [filteredData])

    const topSuppliersData = useMemo(() => {
        const suppliers: Record<string, number> = {}
        filteredData.forEach(item => {
            const name = item.supplier_name || item.Neg_productos?.supplier_name || 'Desconocido'
            suppliers[name] = (suppliers[name] || 0) + (item.ahorro_generado || 0)
        })

        return Object.entries(suppliers)
            .map(([name, value]) => ({ name, value }))
            .sort((a, b) => b.value - a.value)
            .slice(0, 5)
    }, [filteredData])

    const monthlyTrendData = useMemo(() => {
        const months: Record<string, { name: string, ahorro: number, avoidance: number }> = {}

        filteredData.forEach(item => {
            const date = new Date(item.fecha_cambio)
            const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
            const monthName = date.toLocaleDateString('es-CO', { month: 'short', year: '2-digit' })

            if (!months[monthKey]) {
                months[monthKey] = { name: monthName, ahorro: 0, avoidance: 0 }
            }

            if (item.Neg_productos?.tipo === 'Ahorro') {
                months[monthKey].ahorro += item.ahorro_generado || 0
            } else {
                months[monthKey].avoidance += item.ahorro_generado || 0
            }
        })

        return Object.values(months)
    }, [filteredData])

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('es-CO', {
            style: 'currency',
            currency: 'COP',
            maximumFractionDigits: 0
        }).format(value)
    }

    const handleExportCSV = () => {
        if (filteredData.length === 0) return alert('No hay datos para exportar')

        // CSV Headers
        const headers = ['Fecha', 'Proveedor', 'Producto', 'Tipo', 'Precio Anterior', 'Precio Nuevo', 'Ahorro Generado']

        // CSV Rows
        const rows = filteredData.map(item => [
            new Date(item.fecha_cambio).toLocaleDateString('es-CO'),
            item.supplier_name || item.Neg_productos?.supplier_name || 'N/A',
            item.Neg_productos?.descripcion || 'Sin descripción',
            item.Neg_productos?.tipo || 'Ahorro',
            item.precio_anterior,
            item.precio_nuevo,
            item.ahorro_generado
        ])

        const csvContent = [
            headers.join(','),
            ...rows.map(row => row.join(','))
        ].join('\n')

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
        const url = URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.setAttribute('href', url)
        link.setAttribute('download', `Reporte_BI_${dateFrom}_al_${dateTo}.csv`)
        link.style.visibility = 'hidden'
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
    }

    const handleExportPDF = async () => {
        if (!reportRef.current) return
        if (filteredData.length === 0) return alert('No hay datos para exportar')

        setExporting(true)
        try {
            const element = reportRef.current

            // Temporary hide elements we don't want in PDF if necessary
            // For now, capture the whole thing

            const canvas = await html2canvas(element, {
                scale: 2,
                useCORS: true,
                logging: false,
                backgroundColor: '#f8fafc'
            })

            const imgData = canvas.toDataURL('image/png')
            const pdf = new jsPDF({
                orientation: 'portrait',
                unit: 'px',
                format: [canvas.width / 2, canvas.height / 2]
            })

            pdf.addImage(imgData, 'PNG', 0, 0, canvas.width / 2, canvas.height / 2)
            pdf.save(`Reporte_BI_Visual_${dateFrom}_al_${dateTo}.pdf`)
        } catch (error) {
            console.error('Error generating PDF:', error)
            alert('Error al generar el PDF visual')
        } finally {
            setExporting(false)
        }
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <Activity className="w-10 h-10 text-[#254153] animate-spin" />
                    <p className="text-slate-500 font-medium">Analizando datos maestros...</p>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-slate-50 text-slate-900 font-sans pb-20">
            {/* Navbar */}
            <nav className="bg-white border-b border-slate-200 sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16">
                        <div className="flex items-center gap-4">
                            <button
                                onClick={() => router.push('/')}
                                className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-500"
                            >
                                <ArrowLeft className="w-5 h-5" />
                            </button>
                            <div>
                                <h1 className="text-lg font-bold text-[#254153]">Business Intelligence</h1>
                                <p className="text-xs text-slate-500">Métricas de Rendimiento Global</p>
                            </div>
                        </div>
                    </div>
                </div>
            </nav>

            <main ref={reportRef} className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

                {/* Filters Row */}
                <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm mb-8 flex flex-col md:flex-row items-end gap-6">
                    <div className="flex-1 w-full">
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-2">
                            <Calendar className="w-3 h-3" /> Desde
                        </label>
                        <input
                            type="date"
                            value={dateFrom}
                            onChange={(e) => setDateFrom(e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#254153]/10"
                        />
                    </div>
                    <div className="flex-1 w-full">
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-2">
                            <Calendar className="w-3 h-3" /> Hasta
                        </label>
                        <input
                            type="date"
                            value={dateTo}
                            onChange={(e) => setDateTo(e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#254153]/10"
                        />
                    </div>
                    <div className="shrink-0 w-full md:w-auto">
                        <div className="p-3 bg-indigo-50 text-indigo-700 rounded-xl flex items-center gap-3">
                            <Filter className="w-5 h-5" />
                            <div className="text-sm">
                                <span className="font-bold">{filteredData.length}</span> registros filtrados
                            </div>
                        </div>
                    </div>
                </div>

                {/* KPI Cards Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
                        <div className="flex items-center justify-between mb-4">
                            <div className="p-2 bg-emerald-50 rounded-lg">
                                <TrendingDown className="w-6 h-6 text-emerald-600" />
                            </div>
                            <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full">
                                {kpis.savingsCount} Negs.
                            </span>
                        </div>
                        <p className="text-sm text-slate-500 font-medium mb-1">Ahorro Estimado</p>
                        <h3 className="text-2xl font-bold text-[#254153]">{formatCurrency(kpis.savingsValue)}</h3>
                    </div>

                    <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
                        <div className="flex items-center justify-between mb-4">
                            <div className="p-2 bg-amber-50 rounded-lg">
                                <ShieldCheck className="w-6 h-6 text-amber-600" />
                            </div>
                            <span className="text-xs font-bold text-amber-600 bg-amber-50 px-2 py-1 rounded-full">
                                {kpis.avoidanceCount} Negs.
                            </span>
                        </div>
                        <p className="text-sm text-slate-500 font-medium mb-1">Avoidance Estimado</p>
                        <h3 className="text-2xl font-bold text-[#254153]">{formatCurrency(kpis.avoidanceValue)}</h3>
                    </div>

                    <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
                        <div className="flex items-center justify-between mb-4">
                            <div className="p-2 bg-blue-50 rounded-lg">
                                <Users className="w-6 h-6 text-blue-600" />
                            </div>
                        </div>
                        <p className="text-sm text-slate-500 font-medium mb-1">Total Impacto</p>
                        <h3 className="text-2xl font-bold text-[#254153]">{formatCurrency(kpis.savingsValue + kpis.avoidanceValue)}</h3>
                    </div>

                    <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
                        <div className="flex items-center justify-between mb-4">
                            <div className="p-2 bg-indigo-50 rounded-lg">
                                <Activity className="w-6 h-6 text-indigo-600" />
                            </div>
                        </div>
                        <p className="text-sm text-slate-500 font-medium mb-1">Negociaciones Totales</p>
                        <h3 className="text-2xl font-bold text-[#254153]">{kpis.totalNegotiations}</h3>
                    </div>
                </div>

                {/* Charts Section */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">

                    {/* Monthly Trend Chart */}
                    <div className="bg-white rounded-2xl p-8 border border-slate-200 shadow-sm">
                        <div className="flex items-center justify-between mb-8">
                            <div>
                                <h3 className="text-lg font-bold text-[#254153]">Tendencia Mensual</h3>
                                <p className="text-sm text-slate-400">Evolución de ahorros vs avoidance</p>
                            </div>
                        </div>
                        <div className="h-[300px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={monthlyTrendData}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} dy={10} />
                                    <YAxis hide domain={['auto', 'auto']} />
                                    <Tooltip
                                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                                        formatter={(v: any) => [formatCurrency(v), '']}
                                    />
                                    <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px' }} />
                                    <Line
                                        type="monotone"
                                        dataKey="ahorro"
                                        name="Ahorro"
                                        stroke="#10b981"
                                        strokeWidth={3}
                                        dot={{ r: 4, fill: '#10b981', strokeWidth: 2, stroke: '#fff' }}
                                        activeDot={{ r: 6 }}
                                    />
                                    <Line
                                        type="monotone"
                                        dataKey="avoidance"
                                        name="Avoidance"
                                        stroke="#f59e0b"
                                        strokeWidth={3}
                                        dot={{ r: 4, fill: '#f59e0b', strokeWidth: 2, stroke: '#fff' }}
                                        activeDot={{ r: 6 }}
                                    />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Top Suppliers Ranking */}
                    <div className="bg-white rounded-2xl p-8 border border-slate-200 shadow-sm">
                        <div className="flex items-center justify-between mb-8">
                            <div>
                                <h3 className="text-lg font-bold text-[#254153]">Top 5 Proveedores</h3>
                                <p className="text-sm text-slate-400">Ranking por ahorro generado</p>
                            </div>
                            <div className="p-2 bg-indigo-50 rounded-lg">
                                <ArrowUpRight className="w-5 h-5 text-indigo-600" />
                            </div>
                        </div>
                        <div className="h-[300px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={topSuppliersData} layout="vertical" margin={{ left: 40 }}>
                                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                                    <XAxis type="number" hide />
                                    <YAxis
                                        type="category"
                                        dataKey="name"
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fill: '#475569', fontSize: 11, fontWeight: 500 }}
                                        width={100}
                                    />
                                    <Tooltip
                                        cursor={{ fill: '#f8fafc' }}
                                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                                        formatter={(v: any) => [formatCurrency(v), 'Ahorro']}
                                    />
                                    <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={25}>
                                        {topSuppliersData.map((_, index) => (
                                            <Cell key={`cell-${index}`} fill={index === 0 ? '#254153' : '#64748b'} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                </div>

                {/* Detailed Table (Optional, for completeness) */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                        <h3 className="font-bold text-[#254153]">Detalle de Negociaciones</h3>
                        <span className="text-xs font-semibold text-slate-400 uppercase tracking-tighter">Últimos registros</span>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-slate-50 text-slate-500 text-xs font-bold uppercase tracking-wider">
                                <tr>
                                    <th className="px-6 py-4">Fecha</th>
                                    <th className="px-6 py-4">Proveedor</th>
                                    <th className="px-6 py-4">Producto</th>
                                    <th className="px-6 py-4 text-right">Ahorro</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {filteredData.slice(-10).reverse().map((item, i) => (
                                    <tr key={i} className="hover:bg-slate-50 transition-colors">
                                        <td className="px-6 py-4 text-sm text-slate-600">
                                            {new Date(item.fecha_cambio).toLocaleDateString('es-CO')}
                                        </td>
                                        <td className="px-6 py-4 text-sm font-bold text-[#254153]">
                                            {item.supplier_name || item.Neg_productos?.supplier_name || 'NI'}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-slate-600">
                                            {item.Neg_productos?.descripcion}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <span className={`text-sm font-bold ${item.Neg_productos?.tipo === 'Ahorro' ? 'text-emerald-600' : 'text-amber-600'}`}>
                                                {formatCurrency(item.ahorro_generado)}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                                {filteredData.length === 0 && (
                                    <tr>
                                        <td colSpan={4} className="px-6 py-12 text-center text-slate-400 italic">
                                            No hay datos para el periodo seleccionado
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

            </main>
        </div>
    )
}
