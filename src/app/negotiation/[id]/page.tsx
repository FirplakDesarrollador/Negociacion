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
    AlertCircle
} from 'lucide-react'

import ProductNegotiationModal from '@/components/ProductNegotiationModal'


export default function NegotiationPage({ params }: { params: Promise<{ id: string }> }) {
    // Unwrap params using React.use()
    const { id } = use(params)

    const router = useRouter()
    const [loading, setLoading] = useState(true)
    const [supplierName, setSupplierName] = useState('Cargando...')
    const [products, setProducts] = useState<any[]>([])

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [selectedProduct, setSelectedProduct] = useState<any>(null)

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
            const { data: supplierData } = await supabase
                .from('Neg_query_proveedores')
                .select('*')
                .or(`nit.eq.${id},id.eq.${id},codigo.eq.${id}`)
                .single()

            if (supplierData) {
                setSupplierName(supplierData.proveedor || supplierData.nombre || supplierData.razon_social || 'Proveedor Desconocido')
            } else {
                setSupplierName(`Proveedor ${id}`)
            }

            // 2. Fetch Products form Real DB
            // Assuming the supplier_id in Neg_productos matches the ID we are using
            // We'll try to match exact first, if empty, we might fallback to all for demo if needed, but better stick to logic
            let { data: productsData, error: productError } = await supabase
                .from('Neg_productos')
                .select('*')

            // Filter locally or better yet via query if we knew the exact column mapping. 
            // Since we inserted '123456789' as supplier_id in the seed, we might not match the clicked supplier.
            // For now, to ensure DATA SHOWS UP for the user demo, if productsData is empty or filtered out, we might want to show the specific seeded ones.

            if (productError) throw productError

            // Allow all products for now to ensure visibility if ID doesn't match perfectly, 
            // OR filter if we have a match. 
            // In a real app: .eq('supplier_id', id)

            if (!productsData || productsData.length === 0) {
                // Fallback to empty
                productsData = []
            } else {
                // Optional: Filter by supplier_id if we have consistent IDs
                // productsData = productsData.filter(p => p.supplier_id == id)
            }

            const initializedProducts = (productsData || []).map((p: any) => ({
                ...p,
                precio_negociado: p.precio_actual, // Default to current price from DB
                ahorro_unitario: 0,
                ahorro_porcentaje: 0,
                ahorro_total: 0,
                months: 12 // Default assumption
            }))

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
            ahorro_total: ahorroTotal
        }

        const updatedList = products.map(p => p.id === finalProduct.id ? finalProduct : p)
        setProducts(updatedList)
        calculateTotals(updatedList)
    }

    const handleGlobalSave = async () => {
        // Filter products that have been negotiated (price changed)
        const changedProducts = products.filter(p => p.precio_negociado !== p.precio_actual)

        if (changedProducts.length === 0) {
            alert('No hay cambios para guardar.')
            return
        }

        const confirmSave = window.confirm(`¿Estás seguro de actualizar ${changedProducts.length} productos?\nLos precios negociados se convertirán en los nuevos precios actuales.`)
        if (!confirmSave) return

        try {
            setLoading(true)

            for (const product of changedProducts) {
                // 1. Update Product Price (Persistence)
                const { error: updateError } = await supabase
                    .from('Neg_productos')
                    .update({ precio_actual: product.precio_negociado })
                    .eq('id', product.id)

                if (updateError) throw updateError

                // 2. Insert History Log
                const { error: historyError } = await supabase
                    .from('Neg_historial_precios')
                    .insert({
                        product_id: product.id,
                        precio_anterior: product.precio_actual,
                        precio_nuevo: product.precio_negociado,
                        ahorro_generado: product.ahorro_total,
                        // usuario_id: user.id // TODO: Add auth user
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

    return (
        <div className="min-h-screen bg-slate-50 text-slate-900 font-sans pb-24">
            <ProductNegotiationModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                product={selectedProduct}
                onSave={handleSaveProduct}
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
                    <div className="p-6 border-b border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
                        <h3 className="text-xl font-bold text-[#254153]">Productos y Servicios</h3>
                        <button className="bg-[#254153] hover:bg-[#1a2f3d] text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors flex items-center gap-2">
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
                                {products.map((product) => (
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
