'use client'

import { useEffect, useState, use } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/utils/supabase/client'
import {
    ArrowLeft,
    Save,
    History,
    MoreHorizontal,
    Calculator,
    TrendingDown,
    ShieldCheck,
    AlertCircle,
    Search,
    Home
} from 'lucide-react'

import ProductNegotiationModal from '@/components/ProductNegotiationModal'
import BulkNegotiatorModal from '@/components/BulkNegotiatorModal'


export default function NegotiationPage({ 
    params, 
    searchParams 
}: { 
    params: Promise<{ id: string }>,
    searchParams: Promise<{ neg_id?: string }> 
}) {
    // Unwrap params and searchParams using React.use()
    const { id } = use(params)
    const sParams = use(searchParams)
    const negId = sParams?.neg_id

    const router = useRouter()
    const [loading, setLoading] = useState(true)
    const [supplier, setSupplier] = useState<any>(null)
    const [supplierName, setSupplierName] = useState('Cargando...')
    const [products, setProducts] = useState<any[]>([])

    // Historical Mode State
    const [isHistoricalMode, setIsHistoricalMode] = useState(false)
    const [viewedNegId, setViewedNegId] = useState<string | null>(null)

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [isBulkModalOpen, setIsBulkModalOpen] = useState(false)
    const [selectedProduct, setSelectedProduct] = useState<any>(null)

    // Search and Filter State
    const [searchTerm, setSearchTerm] = useState('')

    // Totals
    const [totalSavings, setTotalSavings] = useState(0)
    const [totalAvoidance, setTotalAvoidance] = useState(0)

    useEffect(() => {
        loadData()
    }, [id, negId])

    const loadData = async () => {
        setLoading(true)
        try {
            // 1. Fetch Supplier Details
            let { data: supplierData } = await supabase
                .from('Neg_query_proveedores')
                .select('*')
                .or(`nit.eq."${id}",id.eq."${id}",codigo.eq."${id}"`)
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
                setSupplier(supplierData)
                const name = supplierData.proveedor || supplierData.nombre || supplierData.razon_social || supplierData.proveedor_nombre || `Proveedor ${id}`
                setSupplierName(name)
            } else {
                setSupplierName(`Proveedor ${id}`)
            }

            // Resolve the stable ID for database lookups (Negotiated products)
            const stableId = supplierData?.nit || supplierData?.codigo || id

            // 2. Fetch Products from Neg_base (Master)
            let { data: baseData, error: baseError } = await supabase
                .from('Neg_base')
                .select('*')
                .or(`Codigo_provedor.eq."${id}",Provedor.eq."${supplierData?.proveedor || id}"`)

            if (baseError) throw baseError

            let initializedProducts = []

            if (negId) {
                setIsHistoricalMode(true)
                setViewedNegId(negId)

                // Fetch historical overrides for this neg_id
                const { data: historicalData, error: histError } = await supabase
                    .from('Neg_historial_precios')
                    .select(`
                        *,
                        Neg_productos (
                            base_id
                        )
                    `)
                    .eq('negociacion_id', negId)

                if (histError) throw histError

                initializedProducts = (baseData || []).map((p: any) => {
                    const parseNumeric = (str: string | null) => {
                        if (!str) return 0
                        let clean = str.replace(/\./g, '')
                        clean = clean.replace(/,/g, '.')
                        return parseFloat(clean) || 0
                    }

                    const basePrice = parseNumeric(p.Precio)
                    const quantity = parseNumeric(p.Cantidad)

                    // Find match in historicalData
                    const hist = (historicalData || []).find(h => h.Neg_productos?.base_id == p.Id)

                    if (hist) {
                        const prevPrice = hist.precio_anterior
                        const newPrice = hist.precio_nuevo
                        const cant = hist.cantidad_mensual !== null && hist.cantidad_mensual >= 0 ? hist.cantidad_mensual : quantity
                        
                        const ahorroUnitario = prevPrice - newPrice
                        const ahorroPorcentaje = prevPrice > 0 ? (ahorroUnitario / prevPrice) * 100 : 0
                        const ahorroTotal = hist.ahorro_generado !== null && hist.ahorro_generado !== undefined 
                            ? Number(hist.ahorro_generado) 
                            : ahorroUnitario * cant * 12
                        
                        const computedMonths = (ahorroUnitario * cant) > 0 
                            ? Math.round(ahorroTotal / (ahorroUnitario * cant)) 
                            : 12

                        return {
                            id: p.Id,
                            db_id: hist.id,
                            descripcion: p.Descripcion_articulo || 'Sin descripción',
                            precio_actual: prevPrice,
                            precio_negociado: newPrice,
                            cantidad_mensual: cant,
                            tipo: hist.tipo || 'Ahorro',
                            ahorro_unitario: ahorroUnitario,
                            ahorro_porcentaje: ahorroPorcentaje,
                            ahorro_total: ahorroTotal,
                            months: computedMonths,
                            unidad: p.Unidad_de_medida,
                            codigo_articulo: p.Codigo_Articulo,
                            porcentaje_base: hist.porcentaje_base || 0,
                            porcentaje_negociado: hist.porcentaje_negociado || 0,
                            comentarios: hist.comentarios || ''
                        }
                    } else {
                        // Unmodified in this negotiation session
                        return {
                            id: p.Id,
                            descripcion: p.Descripcion_articulo || 'Sin descripción',
                            precio_actual: basePrice,
                            precio_negociado: basePrice,
                            cantidad_mensual: quantity,
                            tipo: 'Ahorro',
                            ahorro_unitario: 0,
                            ahorro_porcentaje: 0,
                            ahorro_total: 0,
                            months: 12,
                            unidad: p.Unidad_de_medida,
                            codigo_articulo: p.Codigo_Articulo,
                            porcentaje_base: 0,
                            porcentaje_negociado: 0,
                            comentarios: ''
                        }
                    }
                })
            } else {
                setIsHistoricalMode(false)
                setViewedNegId(null)

                // 3. Fetch Overrides from Neg_productos (Operational)
                let opQuery = supabase.from('Neg_productos').select('*')

                if (supplierData?.proveedor) {
                    opQuery = opQuery.or(`supplier_id.eq."${stableId}",supplier_name.eq."${supplierData.proveedor}"`)
                } else {
                    opQuery = opQuery.eq('supplier_id', stableId)
                }

                let { data: operationalData } = await opQuery

                initializedProducts = (baseData || []).map((p: any) => {
                    const parseNumeric = (str: string | null) => {
                        if (!str) return 0
                        let clean = str.replace(/\./g, '')
                        clean = clean.replace(/,/g, '.')
                        return parseFloat(clean) || 0
                    }

                    const basePrice = parseNumeric(p.Precio)
                    const override = (operationalData || []).find(o => o.base_id == p.Id)

                    const currentPrice = override ? override.precio_actual : basePrice
                    const quantity = override ? override.cantidad_mensual : parseNumeric(p.Cantidad)

                    return {
                        id: p.Id,
                        db_id: override?.id,
                        descripcion: p.Descripcion_articulo || 'Sin descripción',
                        precio_actual: currentPrice,
                        precio_negociado: currentPrice,
                        cantidad_mensual: quantity,
                        tipo: override?.tipo || 'Ahorro',
                        ahorro_unitario: 0,
                        ahorro_porcentaje: 0,
                        ahorro_total: 0,
                        months: 12,
                        unidad: p.Unidad_de_medida,
                        codigo_articulo: p.Codigo_Articulo,
                        porcentaje_base: override?.porcentaje_base || 0,
                        porcentaje_negociado: override?.porcentaje_negociado || 0,
                        comentarios: override?.comentarios || ''
                    }
                })
            }

            setProducts(initializedProducts)
            calculateTotals(initializedProducts)

        } catch (error) {
            console.error('Error loading data:', error)
        } finally {
            setLoading(false)
        }
    }

    const calculateTotals = (currentProducts: any[]) => {
        let savings = 0
        let avoidance = 0

        currentProducts.forEach(p => {
            if (p.tipo === 'Ahorro') {
                savings += p.ahorro_total
            } else if (p.tipo === 'Avoidance') {
                avoidance += p.ahorro_total
            }
        })

        setTotalSavings(savings)
        setTotalAvoidance(avoidance)
    }

    const handleOpenModal = (product: any) => {
        setSelectedProduct(product)
        setIsModalOpen(true)
    }

    const handleSaveProduct = (updatedProduct: any) => {
        const ahorroUnitario = updatedProduct.precio_actual - updatedProduct.precio_negociado
        const ahorroPorcentaje = updatedProduct.precio_actual > 0 ? (ahorroUnitario / updatedProduct.precio_actual) * 100 : 0
        const ahorroTotal = ahorroUnitario * updatedProduct.cantidad_mensual * (updatedProduct.months || 12)

        const finalProduct = {
            ...updatedProduct,
            ahorro_unitario: ahorroUnitario,
            ahorro_porcentaje: ahorroPorcentaje,
            ahorro_total: ahorroTotal,
            isDirty: true
        }

        const updatedList = products.map(p => p.id === finalProduct.id ? finalProduct : p)
        setProducts(updatedList)
        calculateTotals(updatedList)
    }

    const handleApplyBulk = (settings: { percentage: number, type: 'Ahorro' | 'Avoidance', skuConsumptions: Record<string, number>, months?: number, basePercent?: number, negotiatedPercent?: number, comments?: string }) => {
        const newList = products.map(product => {
            const basePriceForCalc = product.precio_actual
            const ahorroUnitario = basePriceForCalc * (settings.percentage / 100)

            const resultPrecioNegociado = basePriceForCalc - ahorroUnitario

            const skuVal = settings.skuConsumptions[product.id]
            const cantMensual = skuVal !== undefined && skuVal >= 0 ? skuVal : product.cantidad_mensual
            
            const numMonths = settings.months !== undefined && settings.months > 0 ? settings.months : (product.months || 12)

            const ahorroTotal = ahorroUnitario * cantMensual * numMonths

            return {
                ...product,
                precio_actual: basePriceForCalc,
                precio_negociado: resultPrecioNegociado > 0 ? resultPrecioNegociado : 0,
                tipo: settings.type,
                ahorro_unitario: ahorroUnitario,
                ahorro_porcentaje: settings.percentage,
                ahorro_total: ahorroTotal,
                cantidad_mensual: cantMensual,
                months: numMonths,
                porcentaje_base: settings.basePercent || 0,
                porcentaje_negociado: settings.negotiatedPercent || 0,
                comentarios: settings.comments !== undefined ? settings.comments : product.comentarios,
                isDirty: true
            }
        })

        setProducts(newList)
        calculateTotals(newList)
        setIsBulkModalOpen(false)
    }

    const handleGlobalSave = async () => {
        const changedProducts = products.filter(p => p.isDirty || p.precio_negociado !== p.precio_actual)

        if (changedProducts.length === 0) {
            alert('No hay cambios para guardar.')
            return
        }

        const confirmSave = window.confirm(`¿Estás seguro de actualizar ${changedProducts.length} productos?\nLos precios negociados se convertirán en los nuevos precios actuales.`)
        if (!confirmSave) return

        try {
            setLoading(true)

            const { data: existingIds } = await supabase
                .from('Neg_historial_precios')
                .select('negociacion_id')
                .not('negociacion_id', 'is', null)

            let nextId = 1
            if (existingIds && existingIds.length > 0) {
                let maxId = 0
                existingIds.forEach(row => {
                    const val = row.negociacion_id
                    if (val) {
                        const cleanVal = val.replace(/[^0-9]/g, '')
                        if (cleanVal) {
                            const num = parseInt(cleanVal, 10)
                            if (num > maxId && num < 1000000) { 
                                maxId = num
                            }
                        }
                    }
                })
                nextId = maxId + 1
            }

            const currentNegotiationId = nextId.toString()
            const stableSupplierId = supplier?.nit || supplier?.codigo || id

            for (const product of changedProducts) {
                const priceToStore = product.tipo === 'Ahorro' ? product.precio_negociado : product.precio_actual

                const { data: upsertData, error: upsertError } = await supabase
                    .from('Neg_productos')
                    .upsert({
                        base_id: product.id,
                        supplier_id: stableSupplierId,
                        supplier_name: supplierName,
                        descripcion: product.descripcion,
                        precio_actual: priceToStore,
                        cantidad_mensual: product.cantidad_mensual,
                        tipo: product.tipo,
                        porcentaje_base: product.porcentaje_base,
                        porcentaje_negociado: product.porcentaje_negociado,
                        comentarios: product.comentarios
                    }, {
                        onConflict: 'base_id, supplier_id'
                    })
                    .select()
                    .single()

                if (upsertError) throw upsertError

                const { error: historyError } = await supabase
                    .from('Neg_historial_precios')
                    .insert({
                        product_id: upsertData.id,
                        supplier_id: stableSupplierId,
                        supplier_name: supplierName,
                        precio_anterior: product.precio_actual,
                        precio_nuevo: product.precio_negociado,
                        ahorro_generado: product.ahorro_total,
                        tipo: product.tipo,
                        negociacion_id: currentNegotiationId,
                        porcentaje_base: product.porcentaje_base,
                        porcentaje_negociado: product.porcentaje_negociado,
                        comentarios: product.comentarios,
                        cantidad_mensual: product.cantidad_mensual
                    })

                if (historyError) console.error('Error saving history for', product.id, historyError)
            }

            alert('Negociación guardada exitosamente.')
            await loadData()

        } catch (error) {
            console.error('Error saving changes:', error)
            alert('Error al guardar cambios. Revisa la consola.')
        } finally {
            setLoading(false)
        }
    }

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(value)
    }

    const formatPercentage = (value: number) => {
        return `${value.toFixed(1)}%`
    }

    const filteredProducts = products.filter(product =>
        product.descripcion.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.codigo_articulo?.toLowerCase().includes(searchTerm.toLowerCase())
    )

    return (
        <div className="min-h-screen bg-slate-50 text-slate-900 font-sans pb-24">
            <ProductNegotiationModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                product={selectedProduct}
                onSave={handleSaveProduct}
            />

            <BulkNegotiatorModal
                isOpen={isBulkModalOpen}
                onClose={() => setIsBulkModalOpen(false)}
                products={products}
                onApply={handleApplyBulk}
            />

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
                                <h1 className="text-lg font-bold text-[#254153]">Gestión de Proveedor</h1>
                                <p className="text-xs text-slate-500">Negociador activo</p>
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
                        <button className="p-2 hover:bg-slate-100 rounded-full text-slate-400">
                            <MoreHorizontal className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            </nav>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

                {/* Historical Mode Banner */}
                {isHistoricalMode && (
                    <div className="bg-[#254153] text-white px-6 py-4 rounded-2xl mb-6 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm border border-slate-700 animate-in fade-in slide-in-from-top-4 duration-300">
                        <div className="flex items-center gap-3">
                            <div className="bg-white/10 p-2 rounded-xl">
                                <History className="w-6 h-6 text-blue-300" />
                            </div>
                            <div className="text-left">
                                <h3 className="font-bold">Visualizando Negociación Histórica</h3>
                                <p className="text-xs text-blue-200">ID Negociación: #{viewedNegId} • Modo Solo Lectura</p>
                            </div>
                        </div>
                        <div className="flex gap-3">
                            <button
                                onClick={() => router.push('/bi')}
                                className="bg-transparent hover:bg-white/10 border border-white/30 text-white font-bold text-xs py-2.5 px-4 rounded-xl transition-colors cursor-pointer"
                            >
                                Volver a BI
                            </button>
                            <button
                                onClick={() => router.push(`/negotiation/${id}`)}
                                className="bg-white hover:bg-slate-100 text-[#254153] font-bold text-xs py-2.5 px-4 rounded-xl transition-colors shadow-sm cursor-pointer"
                            >
                                Ir a Negociación Activa
                            </button>
                        </div>
                    </div>
                )}

                {/* Supplier Header Information */}
                <div className="bg-white rounded-2xl p-8 border border-slate-200 shadow-sm mb-6 text-center">
                    <h2 className="text-3xl font-bold text-[#254153] mb-2">{supplierName}</h2>
                    <p className="text-slate-500 font-medium">Gestión de negociación de precios</p>
                </div>

                {/* Products Section */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden mb-6">
                    <div className="p-6 border-b border-slate-200 flex flex-col md:flex-row items-center justify-between gap-4">
                        <div className="flex flex-col sm:flex-row items-center gap-4 w-full md:w-auto">
                            <h3 className="text-xl font-bold text-[#254153]">Productos o Servicios</h3>
                            <div className="relative w-full sm:w-64">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                <input
                                    type="text"
                                    placeholder="Buscar producto o código..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#254153]/10 focus:border-[#254153] transition-all"
                                />
                            </div>
                        </div>
                        {!isHistoricalMode && (
                            <button
                                onClick={() => setIsBulkModalOpen(true)}
                                className="bg-[#254153] hover:bg-[#1a2f3d] text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors flex items-center gap-2 w-full md:w-auto justify-center"
                            >
                                <Calculator className="w-4 h-4" />
                                Negociador Masivo
                            </button>
                        )}
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider font-semibold border-b border-slate-200">
                                    <th className="px-6 py-4 w-1/3 min-w-[300px]">Descripción</th>
                                    <th className="px-6 py-4">Código</th>
                                    <th className="px-6 py-4">Tipo</th>
                                    <th className="px-6 py-4 text-right">Precio Base</th>
                                    <th className="px-6 py-4 text-right bg-blue-50/50">Precio Negociado</th>
                                    <th className="px-6 py-4 text-right">Ahorro %</th>
                                    <th className="px-6 py-4 text-right">Consumo Mes Prom</th>
                                    <th className="px-6 py-4 text-right font-bold text-[#254153]">Total Estimado</th>
                                    <th className="px-6 py-4 w-48">Comments</th>
                                    <th className="px-6 py-4"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {filteredProducts.map((product) => (
                                    <tr
                                        key={product.id}
                                        onClick={isHistoricalMode ? undefined : () => handleOpenModal(product)}
                                        className={`transition-colors border-b border-slate-100 ${isHistoricalMode ? '' : 'hover:bg-slate-50 cursor-pointer group'}`}
                                    >
                                        <td className="px-6 py-4 align-middle">
                                            <span className="font-medium text-slate-800 block mb-1 group-hover:text-[#254153] transition-colors">{product.descripcion}</span>
                                            <span className="text-xs text-slate-400">Cant. Mensual: {product.cantidad_mensual}</span>
                                        </td>
                                        <td className="px-6 py-4 align-middle">
                                            <span className="text-xs font-mono font-medium text-slate-600 bg-slate-100 px-2.5 py-1.5 rounded-md border border-slate-200">
                                                {product.codigo_articulo || 'N/A'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 align-middle">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${product.tipo === 'Ahorro' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                                                }`}>
                                                {product.tipo}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right text-slate-500 align-middle">
                                            {formatCurrency(product.tipo === 'Avoidance' ? product.precio_actual * (1 + (product.porcentaje_base || 0) / 100) : product.precio_actual)}
                                        </td>
                                        <td className="px-6 py-4 text-right bg-blue-50/30 align-middle font-bold text-[#254153]">
                                            {formatCurrency(product.tipo === 'Avoidance' ? product.precio_actual * (1 + (product.porcentaje_negociado || 0) / 100) : (product.precio_negociado || product.precio_actual))}
                                        </td>
                                        <td className="px-6 py-4 text-right align-middle">
                                            <span className={`font-medium ${product.ahorro_porcentaje > 0 ? 'text-emerald-600' : 'text-slate-400'}`}>
                                                {formatPercentage(product.ahorro_porcentaje)}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right align-middle font-medium text-slate-700">
                                            {product.cantidad_mensual}
                                        </td>
                                        <td className="px-6 py-4 text-right align-middle">
                                            <span className={`font-bold ${product.ahorro_total > 0 ? 'text-[#254153]' : 'text-slate-400'}`}>
                                                {formatCurrency(product.ahorro_total)}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 align-middle" onClick={(e) => e.stopPropagation()}>
                                            {isHistoricalMode ? (
                                                <span className="text-xs text-slate-500">{product.comentarios || '-'}</span>
                                            ) : (
                                                <input
                                                    type="text"
                                                    value={product.comentarios || ''}
                                                    onChange={(e) => {
                                                        const updatedList = products.map(p => 
                                                            p.id === product.id ? { ...p, comentarios: e.target.value, isDirty: true } : p
                                                        )
                                                        setProducts(updatedList)
                                                    }}
                                                    placeholder="Añadir comentario..."
                                                    className="w-full text-xs px-2 py-1.5 border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-[#254153] focus:border-[#254153]"
                                                />
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-right align-middle">
                                            {!isHistoricalMode && (
                                                <button className="text-blue-500 hover:scale-110 transition-transform opacity-0 group-hover:opacity-100">
                                                    <Calculator className="w-5 h-5" />
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* KPI Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-20">
                    <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm flex items-center justify-between">
                        <div>
                            <p className="text-slate-500 text-sm font-semibold uppercase tracking-wide mb-1">
                                {isHistoricalMode ? 'Ahorro Registrado' : 'Ahorro Total Estimado'}
                            </p>
                            <h3 className="text-3xl font-bold text-emerald-600">{formatCurrency(totalSavings)}</h3>
                        </div>
                        <div className="p-4 bg-emerald-50 rounded-full">
                            <TrendingDown className="w-8 h-8 text-emerald-500" />
                        </div>
                    </div>

                    <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm flex items-center justify-between">
                        <div>
                            <p className="text-slate-500 text-sm font-semibold uppercase tracking-wide mb-1">
                                {isHistoricalMode ? 'Avoidance Registrado' : 'Avoidance Total Estimado'}
                            </p>
                            <h3 className="text-3xl font-bold text-amber-600">{formatCurrency(totalAvoidance)}</h3>
                        </div>
                        <div className="p-4 bg-amber-50 rounded-full">
                            <ShieldCheck className="w-8 h-8 text-amber-500" />
                        </div>
                    </div>
                </div>

            </main>

            {/* Bottom Actions Bar */}
            <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 p-4 shadow-[0_-4px_20px_-4px_rgba(0,0,0,0.1)] z-40">
                <main className="max-w-7xl mx-auto flex gap-4">
                    {isHistoricalMode ? (
                        <>
                            <button
                                onClick={() => router.push('/bi')}
                                className="flex-1 bg-white border-2 border-[#254153] text-[#254153] hover:bg-slate-50 font-bold py-3 px-6 rounded-xl transition-colors flex items-center justify-center gap-2 cursor-pointer"
                            >
                                Volver a BI
                            </button>
                            <button
                                onClick={() => router.push(`/negotiation/${id}`)}
                                className="flex-1 bg-[#254153] hover:bg-[#1a2f3d] text-white font-bold py-3 px-6 rounded-xl shadow-lg shadow-[#254153]/20 transition-all flex items-center justify-center gap-2 transform active:scale-[0.99] cursor-pointer"
                            >
                                Ir a Negociación Activa
                            </button>
                        </>
                    ) : (
                        <>
                            <button
                                onClick={() => router.push(`/negotiation/${id}/history`)}
                                className="flex-1 bg-white border-2 border-[#254153] text-[#254153] hover:bg-slate-50 font-bold py-3 px-6 rounded-xl transition-colors flex items-center justify-center gap-2 cursor-pointer"
                            >
                                <History className="w-5 h-5" />
                                Ver Historial
                            </button>
                            <button
                                onClick={handleGlobalSave}
                                className="flex-1 bg-[#254153] hover:bg-[#1a2f3d] text-white font-bold py-3 px-6 rounded-xl shadow-lg shadow-[#254153]/20 transition-all flex items-center justify-center gap-2 transform active:scale-[0.99] cursor-pointer"
                            >
                                <Save className="w-5 h-5" />
                                Guardar Cambios
                            </button>
                        </>
                    )}
                </main>
            </div>
        </div>
    )
}
