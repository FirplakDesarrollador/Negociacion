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
    Search
} from 'lucide-react'

import ProductNegotiationModal from '@/components/ProductNegotiationModal'
import BulkNegotiatorModal from '@/components/BulkNegotiatorModal'


export default function NegotiationPage({ params }: { params: Promise<{ id: string }> }) {
    // Unwrap params using React.use()
    const { id } = use(params)

    const router = useRouter()
    const [loading, setLoading] = useState(true)
    const [supplier, setSupplier] = useState<any>(null)
    const [supplierName, setSupplierName] = useState('Cargando...')
    const [products, setProducts] = useState<any[]>([])

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
    }, [id])

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

            // 2. Fetch Products from Neg_base
            // We search by Provedor or Codigo_provedor based on what was selected
            // 2. Fetch Products from Neg_base (Master)
            let { data: baseData, error: baseError } = await supabase
                .from('Neg_base')
                .select('*')
                .or(`Codigo_provedor.eq."${id}",Provedor.eq."${supplierData?.proveedor || id}"`)

            if (baseError) throw baseError

            // 3. Fetch Overrides from Neg_productos (Operational)
            // We search by stableId OR supplier_name for maximum persistence
            let opQuery = supabase.from('Neg_productos').select('*')

            if (supplierData?.proveedor) {
                opQuery = opQuery.or(`supplier_id.eq."${stableId}",supplier_name.eq."${supplierData.proveedor}"`)
            } else {
                opQuery = opQuery.eq('supplier_id', stableId)
            }

            let { data: operationalData } = await opQuery

            const initializedProducts = (baseData || []).map((p: any) => {
                const parseNumeric = (str: string | null) => {
                    if (!str) return 0
                    // Colombian format: 1.000.000,00 or 1.000.000
                    // Remove dots (thousands)
                    let clean = str.replace(/\./g, '')
                    // Replace comma with dot (decimal)
                    clean = clean.replace(/,/g, '.')
                    return parseFloat(clean) || 0
                }

                // Check for operational override
                const override = (operationalData || []).find(o => o.base_id == p.Id)

                const basePrice = parseNumeric(p.Precio)
                const currentPrice = override ? override.precio_actual : basePrice
                const quantity = override ? override.cantidad_mensual : parseNumeric(p.Cantidad)

                return {
                    id: p.Id, // We use base_id as the primary reference in the UI
                    db_id: override?.id, // Existing Neg_productos ID if any
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
                    codigo_articulo: p.Codigo_Articulo
                }
            })

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
            isDirty: true // Mark as explicitly negotiated
        }

        const updatedList = products.map(p => p.id === finalProduct.id ? finalProduct : p)
        setProducts(updatedList)
        calculateTotals(updatedList)
    }

    const handleApplyBulk = (settings: { percentage: number, type: 'Ahorro' | 'Avoidance' }) => {
        const newList = products.map(product => {
            const ahorroUnitario = product.precio_actual * (settings.percentage / 100)
            const precio_negociado = product.precio_actual - ahorroUnitario
            const ahorroTotal = ahorroUnitario * product.cantidad_mensual * (product.months || 12)

            return {
                ...product,
                precio_negociado: precio_negociado > 0 ? precio_negociado : 0,
                tipo: settings.type,
                ahorro_unitario: ahorroUnitario,
                ahorro_porcentaje: settings.percentage,
                ahorro_total: ahorroTotal,
                isDirty: true
            }
        })

        setProducts(newList)
        calculateTotals(newList)
        setIsBulkModalOpen(false)
    }

    const handleGlobalSave = async () => {
        // Filter products that have been negotiated (price changed or explicitly marked via modal)
        const changedProducts = products.filter(p => p.isDirty || p.precio_negociado !== p.precio_actual)

        if (changedProducts.length === 0) {
            alert('No hay cambios para guardar.')
            return
        }

        const confirmSave = window.confirm(`¿Estás seguro de actualizar ${changedProducts.length} productos?\nLos precios negociados se convertirán en los nuevos precios actuales.`)
        if (!confirmSave) return

        try {
            setLoading(true)

            // Resolve stable supplier identity for storage (Consistent with loadData)
            const stableSupplierId = supplier?.nit || supplier?.codigo || id

            for (const product of changedProducts) {
                // 1. Determine the master price to store
                // Only "Ahorro" (Hard Savings) updates the current price. 
                // "Avoidance" stays at the current price.
                const priceToStore = product.tipo === 'Ahorro' ? product.precio_negociado : product.precio_actual

                // 2. Upsert into Neg_productos (Operational)
                const { data: upsertData, error: upsertError } = await supabase
                    .from('Neg_productos')
                    .upsert({
                        base_id: product.id,
                        supplier_id: stableSupplierId,
                        supplier_name: supplierName, // Store Name for stable filtering
                        descripcion: product.descripcion,
                        precio_actual: priceToStore,
                        cantidad_mensual: product.cantidad_mensual,
                        tipo: product.tipo
                    }, {
                        onConflict: 'base_id, supplier_id'
                    })
                    .select()
                    .single()

                if (upsertError) throw upsertError

                // 2. Insert History Log
                const { error: historyError } = await supabase
                    .from('Neg_historial_precios')
                    .insert({
                        product_id: upsertData.id,
                        supplier_id: stableSupplierId,
                        supplier_name: supplierName, // Store Name for stable filtering
                        precio_anterior: product.precio_actual,
                        precio_nuevo: product.precio_negociado,
                        ahorro_generado: product.ahorro_total,
                        tipo: product.tipo,
                    })

                if (historyError) console.error('Error saving history for', product.id, historyError)
            }

            alert('Negociación guardada exitosamente.')

            // Reload data to reflect that "Current Price" is now the negotiated price
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
                                <h1 className="text-lg font-bold text-[#254153]">Gestión de Proveedores</h1>
                                <p className="text-xs text-slate-500">Negociación activa</p>
                            </div>
                        </div>
                        <button className="p-2 hover:bg-slate-100 rounded-full text-slate-400">
                            <MoreHorizontal className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            </nav>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

                {/* Supplier Header Information */}
                <div className="bg-white rounded-2xl p-8 border border-slate-200 shadow-sm mb-6 text-center">
                    <h2 className="text-3xl font-bold text-[#254153] mb-2">{supplierName}</h2>
                    <p className="text-slate-500 font-medium">Gestión de productos y negociación de precios</p>
                </div>

                {/* Products Section */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden mb-6">
                    <div className="p-6 border-b border-slate-200 flex flex-col md:flex-row items-center justify-between gap-4">
                        <div className="flex flex-col sm:flex-row items-center gap-4 w-full md:w-auto">
                            <h3 className="text-xl font-bold text-[#254153]">Productos y Servicios</h3>
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
                        <button
                            onClick={() => setIsBulkModalOpen(true)}
                            className="bg-[#254153] hover:bg-[#1a2f3d] text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors flex items-center gap-2 w-full md:w-auto justify-center"
                        >
                            <Calculator className="w-4 h-4" />
                            Negociador Masivo
                        </button>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider font-semibold border-b border-slate-200">
                                    <th className="px-6 py-4 w-1/3 min-w-[300px]">Descripción</th>
                                    <th className="px-6 py-4">Tipo</th>
                                    <th className="px-6 py-4 text-right">Precio Actual</th>
                                    <th className="px-6 py-4 text-right bg-blue-50/50">Precio Negociado</th>
                                    <th className="px-6 py-4 text-right">Ahorro %</th>
                                    <th className="px-6 py-4 text-right font-bold text-[#254153]">Total Estimado</th>
                                    <th className="px-6 py-4"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {filteredProducts.map((product) => (
                                    <tr
                                        key={product.id}
                                        onClick={() => handleOpenModal(product)}
                                        className="hover:bg-slate-50 transition-colors cursor-pointer group"
                                    >
                                        <td className="px-6 py-4 align-middle">
                                            <span className="font-medium text-slate-800 block mb-1 group-hover:text-[#254153] transition-colors">{product.descripcion}</span>
                                            <span className="text-xs text-slate-400">Cant. Mensual: {product.cantidad_mensual}</span>
                                        </td>
                                        <td className="px-6 py-4 align-middle">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${product.tipo === 'Ahorro' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                                                }`}>
                                                {product.tipo}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right text-slate-500 align-middle">
                                            {formatCurrency(product.precio_actual)}
                                        </td>
                                        <td className="px-6 py-4 text-right bg-blue-50/30 align-middle font-bold text-[#254153]">
                                            {formatCurrency(product.precio_negociado || product.precio_actual)}
                                        </td>
                                        <td className="px-6 py-4 text-right align-middle">
                                            <span className={`font-medium ${product.ahorro_porcentaje > 0 ? 'text-emerald-600' : 'text-slate-400'}`}>
                                                {formatPercentage(product.ahorro_porcentaje)}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right align-middle">
                                            <span className={`font-bold ${product.ahorro_total > 0 ? 'text-[#254153]' : 'text-slate-400'}`}>
                                                {formatCurrency(product.ahorro_total)}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right align-middle">
                                            <button className="text-blue-500 hover:scale-110 transition-transform opacity-0 group-hover:opacity-100">
                                                <Calculator className="w-5 h-5" />
                                            </button>
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
                            <p className="text-slate-500 text-sm font-semibold uppercase tracking-wide mb-1">Ahorro Total Estimado</p>
                            <h3 className="text-3xl font-bold text-emerald-600">{formatCurrency(totalSavings)}</h3>
                        </div>
                        <div className="p-4 bg-emerald-50 rounded-full">
                            <TrendingDown className="w-8 h-8 text-emerald-500" />
                        </div>
                    </div>

                    <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm flex items-center justify-between">
                        <div>
                            <p className="text-slate-500 text-sm font-semibold uppercase tracking-wide mb-1">Avoidance Total Estimado</p>
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
                    <button
                        onClick={() => router.push(`/negotiation/${id}/history`)}
                        className="flex-1 bg-white border-2 border-[#254153] text-[#254153] hover:bg-slate-50 font-bold py-3 px-6 rounded-xl transition-colors flex items-center justify-center gap-2"
                    >
                        <History className="w-5 h-5" />
                        Ver Historial
                    </button>
                    <button
                        onClick={handleGlobalSave}
                        className="flex-1 bg-[#254153] hover:bg-[#1a2f3d] text-white font-bold py-3 px-6 rounded-xl shadow-lg shadow-[#254153]/20 transition-all flex items-center justify-center gap-2 transform active:scale-[0.99]"
                    >
                        <Save className="w-5 h-5" />
                        Guardar Cambios
                    </button>
                </main>
            </div>
        </div>
    )
}
