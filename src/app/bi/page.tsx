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
    Download,
    Home,
    Hash
} from 'lucide-react'
import SearchableSelect from '@/components/SearchableSelect'
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
    const [selectedSupplier, setSelectedSupplier] = useState('All')
    const [selectedProduct, setSelectedProduct] = useState('All')
    const [selectedNegId, setSelectedNegId] = useState('All')

    // Data
    const [history, setHistory] = useState<any[]>([])

    const [ahorroEspecialReal, setAhorroEspecialReal] = useState<number>(() => {
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem('bi_ahorro_especial_real')
            if (saved) return Number(saved)
        }
        return 12000000
    })

    useEffect(() => {
        localStorage.setItem('bi_ahorro_especial_real', ahorroEspecialReal.toString())
    }, [ahorroEspecialReal])

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
            const supplierMatch = selectedSupplier === 'All' ||
                (item.supplier_name || item.Neg_productos?.supplier_name) === selectedSupplier
            const productMatch = selectedProduct === 'All' ||
                item.Neg_productos?.descripcion === selectedProduct
            const negIdMatch = selectedNegId === 'All' ||
                item.negociacion_id === selectedNegId

            return date >= dateFrom && date <= dateTo && supplierMatch && productMatch && negIdMatch
        })
    }, [history, dateFrom, dateTo, selectedSupplier, selectedProduct, selectedNegId])

    const filterOptions = useMemo(() => {
        const suppliers = new Set<string>()
        const products = new Set<string>()
        const negIds = new Set<string>()

        history.forEach(item => {
            const sName = item.supplier_name || item.Neg_productos?.supplier_name
            const pDesc = item.Neg_productos?.descripcion
            const nId = item.negociacion_id
            if (sName) suppliers.add(sName)
            if (pDesc) products.add(pDesc)
            if (nId) negIds.add(nId)
        })

        return {
            suppliers: Array.from(suppliers).sort(),
            products: Array.from(products).sort(),
            negIds: Array.from(negIds).sort()
        }
    }, [history])

    const kpis = useMemo(() => {
        let savingsValue = 0
        let avoidanceValue = 0
        let savingsCount = 0
        let avoidanceCount = 0

        filteredData.forEach(item => {
            const currentItemTipo = item.tipo || item.Neg_productos?.tipo || 'Ahorro'
            if (currentItemTipo === 'Ahorro') {
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

            const currentItemTipo = item.tipo || item.Neg_productos?.tipo || 'Ahorro'
            if (currentItemTipo === 'Ahorro') {
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

    const META_SAVING = 150000000
    const META_AVOIDANCE = 300000000
    const META_AHORRO_ESPECIAL = 20000000

    const savingProgressPercent = Math.min(100, Math.max(0, (kpis.savingsValue / META_SAVING) * 100))
    const savingProgressPercentRaw = (kpis.savingsValue / META_SAVING) * 100
    const savingRemaining = Math.max(0, META_SAVING - kpis.savingsValue)

    const avoidanceProgressPercent = Math.min(100, Math.max(0, (kpis.avoidanceValue / META_AVOIDANCE) * 100))
    const avoidanceProgressPercentRaw = (kpis.avoidanceValue / META_AVOIDANCE) * 100
    const avoidanceRemaining = Math.max(0, META_AVOIDANCE - kpis.avoidanceValue)

    const ahorroEspecialProgressPercent = Math.min(100, Math.max(0, (ahorroEspecialReal / META_AHORRO_ESPECIAL) * 100))
    const ahorroEspecialProgressPercentRaw = (ahorroEspecialReal / META_AHORRO_ESPECIAL) * 100
    const ahorroEspecialRemaining = Math.max(0, META_AHORRO_ESPECIAL - ahorroEspecialReal)

    const handleExportCSV = () => {
        if (filteredData.length === 0) return alert('No hay datos para exportar')

        // CSV Headers
        const headers = ['Fecha', 'Proveedor', 'Producto', 'Tipo', 'Precio Anterior', 'Precio Nuevo', 'Ahorro Generado']

        // CSV Rows
        const rows = filteredData.map(item => [
            new Date(item.fecha_cambio).toLocaleDateString('es-CO'),
            item.supplier_name || item.Neg_productos?.supplier_name || 'N/A',
            item.Neg_productos?.descripcion || 'Sin descripción',
            item.tipo || item.Neg_productos?.tipo || 'Ahorro',
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

            <main ref={reportRef} className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

                {/* Filters Row */}
                <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm mb-8 flex flex-col md:flex-row items-end gap-6">
                    <div className="flex-1 w-full max-w-[200px]">
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-2">
                            <Calendar className="w-3 h-3" /> Desde
                        </label>
                        <input
                            type="date"
                            value={dateFrom}
                            onChange={(e) => setDateFrom(e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#254153]/10"
                        />
                    </div>
                    <div className="flex-1 w-full max-w-[200px]">
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-2">
                            <Calendar className="w-3 h-3" /> Hasta
                        </label>
                        <input
                            type="date"
                            value={dateTo}
                            onChange={(e) => setDateTo(e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#254153]/10"
                        />
                    </div>
                    <div className="flex-1 w-full relative z-30">
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-2">
                            <Hash className="w-3 h-3" /> ID Neg
                        </label>
                        <SearchableSelect
                            value={selectedNegId}
                            onChange={setSelectedNegId}
                            options={['All', ...filterOptions.negIds].map(id => ({ value: id, label: id === 'All' ? 'Todos los IDs' : id }))}
                            searchPlaceholder="Buscar ID..."
                        />
                    </div>
                    <div className="flex-[1.5] w-full relative z-20">
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-2">
                            <Users className="w-3 h-3" /> Proveedor
                        </label>
                        <SearchableSelect
                            value={selectedSupplier}
                            onChange={setSelectedSupplier}
                            options={['All', ...filterOptions.suppliers].map(s => ({ value: s, label: s === 'All' ? 'Todos los proveedores' : s }))}
                            searchPlaceholder="Buscar proveedor..."
                        />
                    </div>
                    <div className="flex-[2] w-full relative z-10">
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-2">
                            <Activity className="w-3 h-3" /> Producto
                        </label>
                        <SearchableSelect
                            value={selectedProduct}
                            onChange={setSelectedProduct}
                            options={['All', ...filterOptions.products].map(p => ({ value: p, label: p === 'All' ? 'Todos los productos' : p }))}
                            searchPlaceholder="Buscar producto..."
                        />
                    </div>
                    <div className="shrink-0 w-full md:w-auto">
                        <div className="p-2.5 bg-indigo-50 text-indigo-700 rounded-xl flex items-center gap-3">
                            <Filter className="w-4 h-4" />
                            <div className="text-xs">
                                <span className="font-bold">{filteredData.length}</span> registros
                            </div>
                        </div>
                    </div>
                </div>

                {/* 2026 Strategic Goals Dashboard */}
                <div className="mb-8 bg-gradient-to-br from-slate-900 via-[#1b2b35] to-slate-900 rounded-3xl p-6 md:p-8 text-white shadow-xl relative overflow-hidden border border-slate-800">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>
                    <div className="absolute bottom-0 left-0 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none"></div>
                    
                    <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-6 mb-6">
                        <div>
                            <span className="text-emerald-400 text-xs font-bold uppercase tracking-widest bg-emerald-500/10 px-3 py-1.5 rounded-full">Metas Estratégicas 2026</span>
                            <h2 className="text-2xl md:text-3xl font-black mt-2 tracking-tight">Monitoreo de Objetivos Anuales</h2>
                            <p className="text-slate-400 text-sm mt-1 font-medium">Control de avance financiero en tiempo real de compras y negociaciones</p>
                        </div>
                        <div className="flex items-center gap-3">
                            <span className="text-[10px] uppercase font-bold text-slate-400 bg-white/5 px-3 py-2 rounded-lg border border-white/5">Periodo: Ene - Dic 2026</span>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 relative z-10">
                        {/* Goal 1: Savings */}
                        <div className="bg-white/5 rounded-2xl p-6 border border-white/10 relative overflow-hidden hover:border-emerald-500/30 hover:bg-white/10 transition-all duration-300 flex flex-col justify-between">
                            <div>
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="font-extrabold text-slate-200 tracking-wide text-xs uppercase flex items-center gap-2">
                                        <TrendingDown className="w-4 h-4 text-emerald-400" /> META AHORRO (SAVING)
                                    </h3>
                                    <span className={`text-sm font-black px-3 py-1.5 rounded-full border ${
                                        savingProgressPercentRaw >= 100 
                                            ? 'bg-emerald-500 text-slate-900 border-emerald-400 animate-pulse' 
                                            : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30 shadow-sm'
                                    }`}>
                                        {savingProgressPercentRaw >= 100 ? '✓ ALCANZADA' : `${savingProgressPercentRaw.toFixed(1)}%`}
                                    </span>
                                </div>
                                <div className="flex items-baseline gap-2 mb-2">
                                    <span className="text-4xl font-extrabold tracking-tight bg-gradient-to-r from-emerald-400 to-teal-200 bg-clip-text text-transparent">
                                        {formatCurrency(kpis.savingsValue)}
                                    </span>
                                    <span className="text-xs text-slate-400 font-bold uppercase">Llevamos</span>
                                </div>
                                <div className="text-xs text-slate-300 font-semibold mb-6 flex flex-wrap items-center gap-x-4 gap-y-1">
                                    <span>Meta Anual: <strong className="text-emerald-400">{formatCurrency(META_SAVING)}</strong></span>
                                    <span className="text-slate-500">|</span>
                                    {savingRemaining > 0 ? (
                                        <span>Falta: <strong className="text-rose-500">{formatCurrency(savingRemaining)}</strong></span>
                                    ) : (
                                        <span className="text-emerald-400 font-bold">¡Meta superada por {formatCurrency(Math.abs(META_SAVING - kpis.savingsValue))}!</span>
                                    )}
                                </div>
                            </div>
                            
                            <div>
                                <div className="flex items-center justify-between text-xs text-slate-400 font-bold mb-2">
                                    <span>Progreso</span>
                                    <span>{savingProgressPercentRaw.toFixed(1)}%</span>
                                </div>
                                <div className="w-full h-3 bg-white/5 rounded-full overflow-hidden border border-white/5 p-0.5">
                                    <div 
                                        className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full transition-all duration-1000 ease-out" 
                                        style={{ width: `${savingProgressPercent}%` }}
                                    ></div>
                                </div>
                                <p className="text-[11px] text-slate-400 mt-3 font-medium">
                                    {savingRemaining > 0 
                                        ? `Para alcanzar la meta de Ahorro nos falta el ${(100 - savingProgressPercentRaw).toFixed(1)}% del total presupuestado.` 
                                        : '¡Excelente desempeño! Se ha logrado completar la meta establecida para el periodo actual.'}
                                </p>
                            </div>
                        </div>

                        {/* Goal 2: Avoidance */}
                        <div className="bg-white/5 rounded-2xl p-6 border border-white/10 relative overflow-hidden hover:border-amber-500/30 hover:bg-white/10 transition-all duration-300 flex flex-col justify-between">
                            <div>
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="font-extrabold text-slate-200 tracking-wide text-xs uppercase flex items-center gap-2">
                                        <ShieldCheck className="w-4 h-4 text-amber-400" /> META EVITACIÓN (AVOIDANCE)
                                    </h3>
                                    <span className={`text-sm font-black px-3 py-1.5 rounded-full border ${
                                        avoidanceProgressPercentRaw >= 100 
                                            ? 'bg-amber-500 text-slate-900 border-amber-400 animate-pulse' 
                                            : 'bg-amber-500/20 text-amber-400 border-amber-500/30 shadow-sm'
                                    }`}>
                                        {avoidanceProgressPercentRaw >= 100 ? '✓ ALCANZADA' : `${avoidanceProgressPercentRaw.toFixed(1)}%`}
                                    </span>
                                </div>
                                <div className="flex items-baseline gap-2 mb-2">
                                    <span className="text-4xl font-extrabold tracking-tight bg-gradient-to-r from-amber-400 to-orange-200 bg-clip-text text-transparent">
                                        {formatCurrency(kpis.avoidanceValue)}
                                    </span>
                                    <span className="text-xs text-slate-400 font-bold uppercase">Llevamos</span>
                                </div>
                                <div className="text-xs text-slate-300 font-semibold mb-6 flex flex-wrap items-center gap-x-4 gap-y-1">
                                    <span>Meta Anual: <strong className="text-amber-400">{formatCurrency(META_AVOIDANCE)}</strong></span>
                                    <span className="text-slate-500">|</span>
                                    {avoidanceRemaining > 0 ? (
                                        <span>Falta: <strong className="text-rose-500">{formatCurrency(avoidanceRemaining)}</strong></span>
                                    ) : (
                                        <span className="text-amber-400 font-bold">¡Meta superada por {formatCurrency(Math.abs(META_AVOIDANCE - kpis.avoidanceValue))}!</span>
                                    )}
                                </div>
                            </div>
                            
                            <div>
                                <div className="flex items-center justify-between text-xs text-slate-400 font-bold mb-2">
                                    <span>Progreso</span>
                                    <span>{avoidanceProgressPercentRaw.toFixed(1)}%</span>
                                </div>
                                <div className="w-full h-3 bg-white/5 rounded-full overflow-hidden border border-white/5 p-0.5">
                                    <div 
                                        className="h-full bg-gradient-to-r from-amber-500 to-orange-400 rounded-full transition-all duration-1000 ease-out" 
                                        style={{ width: `${avoidanceProgressPercent}%` }}
                                    ></div>
                                </div>
                                <p className="text-[11px] text-slate-400 mt-3 font-medium">
                                    {avoidanceRemaining > 0 
                                        ? `Para alcanzar la meta de Avoidance nos falta el ${(100 - avoidanceProgressPercentRaw).toFixed(1)}% del total presupuestado.` 
                                        : '¡Excelente desempeño! Se ha logrado completar la meta establecida para el periodo actual.'}
                                </p>
                            </div>
                        </div>

                        {/* Goal 3: Ahorro Especial */}
                        <div className="bg-white/5 rounded-2xl p-6 border border-white/10 relative overflow-hidden hover:border-purple-500/30 hover:bg-white/10 transition-all duration-300 flex flex-col justify-between">
                            <div>
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="font-extrabold text-slate-200 tracking-wide text-xs uppercase flex items-center gap-2">
                                        <TrendingDown className="w-4 h-4 text-purple-400" /> META AHORRO ESPECIAL
                                    </h3>
                                    <span className={`text-sm font-black px-3 py-1.5 rounded-full border ${
                                        ahorroEspecialProgressPercentRaw >= 100 
                                            ? 'bg-purple-500 text-slate-900 border-purple-400 animate-pulse' 
                                            : 'bg-purple-500/20 text-purple-400 border-purple-500/30 shadow-sm'
                                    }`}>
                                        {ahorroEspecialProgressPercentRaw >= 100 ? '✓ ALCANZADA' : `${ahorroEspecialProgressPercentRaw.toFixed(1)}%`}
                                    </span>
                                </div>
                                <div className="flex items-baseline gap-2 mb-2">
                                    <div className="flex items-center gap-1">
                                        <span className="text-3xl font-extrabold text-purple-400">$</span>
                                        <input
                                            type="number"
                                            value={ahorroEspecialReal}
                                            onChange={(e) => setAhorroEspecialReal(Math.max(0, Number(e.target.value)))}
                                            className="bg-transparent border-b border-purple-500/30 focus:border-purple-500 text-3xl font-extrabold text-white tracking-tight w-48 outline-none focus:ring-0 py-0"
                                        />
                                    </div>
                                    <span className="text-xs text-slate-400 font-bold uppercase">Llevamos</span>
                                </div>
                                <div className="text-xs text-slate-300 font-semibold mb-6 flex flex-wrap items-center gap-x-4 gap-y-1">
                                    <span>Meta Anual: <strong className="text-purple-400">{formatCurrency(META_AHORRO_ESPECIAL)}</strong></span>
                                    <span className="text-slate-500">|</span>
                                    {ahorroEspecialRemaining > 0 ? (
                                        <span>Falta: <strong className="text-rose-500">{formatCurrency(ahorroEspecialRemaining)}</strong></span>
                                    ) : (
                                        <span className="text-purple-400 font-bold">¡Meta superada por {formatCurrency(Math.abs(META_AHORRO_ESPECIAL - ahorroEspecialReal))}!</span>
                                    )}
                                </div>
                            </div>
                            
                            <div>
                                <div className="flex items-center justify-between text-xs text-slate-400 font-bold mb-2">
                                    <span>Progreso</span>
                                    <span>{ahorroEspecialProgressPercentRaw.toFixed(1)}%</span>
                                </div>
                                <div className="w-full h-3 bg-white/5 rounded-full overflow-hidden border border-white/5 p-0.5">
                                    <div 
                                        className="h-full bg-gradient-to-r from-purple-500 to-indigo-400 rounded-full transition-all duration-1000 ease-out" 
                                        style={{ width: `${ahorroEspecialProgressPercent}%` }}
                                    ></div>
                                </div>
                                <p className="text-[11px] text-slate-400 mt-3 font-medium">
                                    {ahorroEspecialRemaining > 0 
                                        ? `Para alcanzar la meta de Ahorro Especial nos falta el ${(100 - ahorroEspecialProgressPercentRaw).toFixed(1)}% del total presupuestado.` 
                                        : '¡Excelente desempeño! Se ha logrado completar la meta establecida para el periodo actual.'}
                                </p>
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
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">

                    {/* Monthly Trend - Ahorro */}
                    <div className="bg-white rounded-2xl p-8 border border-slate-200 shadow-sm relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-1 h-full bg-emerald-500 opacity-20 group-hover:opacity-100 transition-opacity"></div>
                        <div className="flex items-center justify-between mb-2">
                            <div>
                                <h3 className="text-lg font-bold text-[#254153]">Ahorros Mensuales</h3>
                                <p className="text-sm text-slate-400">Volumen financiero de ahorro</p>
                            </div>
                        </div>
                        <div className="mb-6">
                            <span className="text-2xl font-black text-emerald-600">{formatCurrency(kpis.savingsValue)}</span>
                            <span className="text-[10px] text-slate-400 block font-bold uppercase tracking-tighter">Total en el periodo</span>
                        </div>
                        <div className="h-[300px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={monthlyTrendData}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 10 }} dy={10} />
                                    <YAxis
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fill: '#94a3b8', fontSize: 10 }}
                                        tickFormatter={(value) => value >= 1000000 ? `${(value / 1000000).toFixed(1)}M` : value >= 1000 ? `${(value / 1000).toFixed(0)}k` : value}
                                    />
                                    <Tooltip
                                        cursor={{ fill: '#f8fafc' }}
                                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                                        formatter={(v: any) => [formatCurrency(v), 'Ahorro']}
                                    />
                                    <Bar dataKey="ahorro" fill="#10b981" radius={[4, 4, 0, 0]} barSize={20} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Monthly Trend - Avoidance */}
                    <div className="bg-white rounded-2xl p-8 border border-slate-200 shadow-sm relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-1 h-full bg-amber-500 opacity-20 group-hover:opacity-100 transition-opacity"></div>
                        <div className="flex items-center justify-between mb-2">
                            <div>
                                <h3 className="text-lg font-bold text-[#254153]">Avoidance Mensual</h3>
                                <p className="text-sm text-slate-400">Volumen financiero detectado</p>
                            </div>
                        </div>
                        <div className="mb-6">
                            <span className="text-2xl font-black text-amber-600">{formatCurrency(kpis.avoidanceValue)}</span>
                            <span className="text-[10px] text-slate-400 block font-bold uppercase tracking-tighter">Total en el periodo</span>
                        </div>
                        <div className="h-[300px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={monthlyTrendData}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 10 }} dy={10} />
                                    <YAxis
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fill: '#94a3b8', fontSize: 10 }}
                                        tickFormatter={(value) => value >= 1000000 ? `${(value / 1000000).toFixed(1)}M` : value >= 1000 ? `${(value / 1000).toFixed(0)}k` : value}
                                    />
                                    <Tooltip
                                        cursor={{ fill: '#f8fafc' }}
                                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                                        formatter={(v: any) => [formatCurrency(v), 'Avoidance']}
                                    />
                                    <Bar dataKey="avoidance" fill="#f59e0b" radius={[4, 4, 0, 0]} barSize={20} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Top Suppliers Ranking */}
                    <div className="bg-white rounded-2xl p-8 border border-slate-200 shadow-sm relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-1 h-full bg-[#254153] opacity-20 group-hover:opacity-100 transition-opacity"></div>
                        <div className="flex items-center justify-between mb-2">
                            <div>
                                <h3 className="text-lg font-bold text-[#254153]">Top 5 Proveedores</h3>
                                <p className="text-sm text-slate-400">Ranking por ahorro total</p>
                            </div>
                        </div>
                        <div className="mb-6">
                            <span className="text-2xl font-black text-[#254153]">{formatCurrency(kpis.savingsValue + kpis.avoidanceValue)}</span>
                            <span className="text-[10px] text-slate-400 block font-bold uppercase tracking-tighter">Impacto total acumulado</span>
                        </div>
                        <div className="h-[300px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={topSuppliersData} layout="vertical" margin={{ left: 10, right: 20 }}>
                                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                                    <XAxis type="number" tickFormatter={(value) => value >= 1000000 ? `${(value / 1000000).toFixed(1)}M` : value >= 1000 ? `${(value / 1000).toFixed(0)}k` : value} axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 9 }} />
                                    <YAxis
                                        type="category"
                                        dataKey="name"
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fill: '#475569', fontSize: 10, fontWeight: 500 }}
                                        width={80}
                                    />
                                    <Tooltip
                                        cursor={{ fill: '#f8fafc' }}
                                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                                        formatter={(v: any) => [formatCurrency(v), 'Ahorro']}
                                    />
                                    <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={15}>
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
                                    <th className="px-6 py-4">ID Neg</th>
                                    <th className="px-6 py-4">Fecha</th>
                                    <th className="px-6 py-4">Proveedor</th>
                                    <th className="px-6 py-4">Producto</th>
                                    <th className="px-6 py-4">Tipo</th>
                                    <th className="px-6 py-4 text-right">Ahorro</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {filteredData.slice(-10).reverse().map((item, i) => (
                                    <tr key={i} className="hover:bg-slate-50 transition-colors">
                                        <td className="px-6 py-4">
                                            {item.negociacion_id ? (
                                                <button onClick={() => router.push(`/negotiation/${item.supplier_id}?neg_id=${item.negociacion_id}`)} className="text-[10px] font-mono font-bold text-[#254153] hover:text-white bg-blue-50 hover:bg-[#254153] px-2 py-1 rounded border border-blue-200 block truncate max-w-[100px] transition-colors cursor-pointer text-left" title={`Ir a negociación ${item.negociacion_id}`}>
                                                    {item.negociacion_id.split('-').slice(0, 2).join('-')}
                                                </button>
                                            ) : (
                                                <span className="text-[10px] text-slate-400 font-mono">N/A</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-slate-600 whitespace-nowrap">
                                            {new Date(item.fecha_cambio).toLocaleDateString('es-CO')}
                                        </td>
                                        <td className="px-6 py-4 text-sm font-bold text-[#254153]">
                                            {item.supplier_name || item.Neg_productos?.supplier_name || 'NI'}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-slate-600">
                                            {item.Neg_productos?.descripcion}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${(item.tipo || item.Neg_productos?.tipo || 'Ahorro') === 'Ahorro' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                                                }`}>
                                                {item.tipo || item.Neg_productos?.tipo || 'Ahorro'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <span className={`text-sm font-bold ${(item.tipo || item.Neg_productos?.tipo || 'Ahorro') === 'Ahorro' ? 'text-emerald-600' : 'text-amber-600'}`}>
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
