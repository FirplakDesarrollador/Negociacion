'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/utils/supabase/client'
import {
    Search,
    Building2,
    MapPin,
    ArrowRight,
    ArrowLeft,
    Filter,
    Loader2
} from 'lucide-react'

export default function SupplierSelectionPage() {
    const router = useRouter()
    const [loading, setLoading] = useState(true)
    const [suppliers, setSuppliers] = useState<any[]>([])
    const [searchTerm, setSearchTerm] = useState('')
    const [selectedSupplierId, setSelectedSupplierId] = useState<string | null>(null)

    useEffect(() => {
        const fetchSuppliers = async () => {
            try {
                // Fetching from the view/table specified by user
                const { data, error } = await supabase
                    .from('Neg_query_proveedores')
                    .select('*')

                if (error) throw error

                console.log('Suppliers Data:', data) // Debugging: Check column names

                // Ensure every supplier has a unique ID for the UI
                const safeData = (data || []).map((s: any, idx: number) => ({
                    ...s,
                    // Use existing ID or NIT, fallback to index-based string to guarantee uniqueness
                    _ui_id: s.id || s.nit || s.NIT || s.codigo || `temp-id-${idx}`
                }))

                setSuppliers(safeData)
            } catch (error) {
                console.error('Error fetching suppliers:', error)
            } finally {
                setLoading(false)
            }
        }

        fetchSuppliers()
    }, [])

    const filteredSuppliers = suppliers.filter(supplier => {
        // Adapt search to available fields. Assuming 'nombre', 'razon_social' or similar might exist.
        // We convert entire object values to string to search broadly if we don't know exact schema.
        const searchString = Object.values(supplier).join(' ').toLowerCase()
        return searchString.includes(searchTerm.toLowerCase())
    })


    const handleContinue = () => {
        if (selectedSupplierId) {
            router.push(`/negotiation/${selectedSupplierId}`)
        }
    }

    return (
        <div className="min-h-screen bg-slate-50 text-slate-900 font-sans">
            {/* Navbar Simplified for inner pages */}
            <nav className="bg-white border-b border-slate-200 sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center h-16 gap-4">
                        <button
                            onClick={() => router.back()}
                            className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-500"
                        >
                            <ArrowLeft className="w-5 h-5" />
                        </button>
                        <h1 className="text-xl font-bold text-[#254153]">Nueva Negociación</h1>
                    </div>
                </div>
            </nav>

            <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Header Section */}
                <div className="mb-8">
                    <h2 className="text-2xl font-bold text-[#254153] mb-2">Seleccione un Proveedor</h2>
                    <p className="text-slate-500">Busque y seleccione el proveedor con el que desea iniciar la negociación.</p>
                </div>

                {/* Search Bar */}
                <div className="mb-8 relative">
                    <div className="relative max-w-2xl">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Buscar por nombre, NIT o categoría..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-white border border-slate-200 rounded-xl py-4 pl-12 pr-4 shadow-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#254153]/20 focus:border-[#254153] transition-all"
                        />
                    </div>
                </div>

                {/* Content */}
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-20">
                        <Loader2 className="w-10 h-10 text-[#254153] animate-spin mb-4" />
                        <p className="text-slate-500">Cargando directorio de proveedores...</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-20">
                        {filteredSuppliers.length > 0 ? (
                            filteredSuppliers.map((supplier, index) => {
                                // Try to determine correct fields gracefully
                                const displayName = supplier.proveedor || supplier.nombre || supplier.razon_social || 'Nombre Desconocido';
                                const displayId = supplier._ui_id; // Use our safe ID
                                const realId = supplier.nit || supplier.id || supplier.codigo || 'N/A';
                                const displayCategory = supplier.categoria || supplier.sector || 'General';

                                return (
                                    <div
                                        key={supplier._ui_id} // Use stable unique ID
                                        onClick={() => setSelectedSupplierId(displayId)}
                                        className={`
                                            cursor-pointer rounded-xl p-5 border transition-all duration-200 relative overflow-hidden group
                                            ${selectedSupplierId === displayId
                                                ? 'bg-[#254153]/5 border-[#254153] ring-1 ring-[#254153]'
                                                : 'bg-white border-slate-200 hover:border-[#254153]/50 hover:shadow-md'
                                            }
                                        `}
                                    >
                                        <div className="flex items-start justify-between mb-4">
                                            <div className={`p-3 rounded-lg ${selectedSupplierId === displayId ? 'bg-[#254153] text-white' : 'bg-slate-100 text-slate-500 group-hover:bg-slate-200'} transition-colors`}>
                                                <Building2 className="w-6 h-6" />
                                            </div>
                                            {selectedSupplierId === displayId && (
                                                <div className="w-6 h-6 bg-[#254153] rounded-full flex items-center justify-center animate-in zoom-in">
                                                    <span className="text-white text-xs">✓</span>
                                                </div>
                                            )}
                                        </div>

                                        <h3 className="font-bold text-slate-800 mb-1 line-clamp-1">{displayName}</h3>
                                        <p className="text-xs text-slate-500 font-medium mb-3">ID: {realId}</p>

                                        <div className="flex items-center gap-2 mt-auto">
                                            <span className="px-2 py-1 rounded bg-slate-100 text-slate-600 text-[10px] font-medium uppercase tracking-wider">
                                                {displayCategory}
                                            </span>
                                        </div>
                                    </div>
                                )
                            })
                        ) : (
                            <div className="col-span-full py-12 text-center bg-white rounded-xl border border-slate-200 border-dashed">
                                <Filter className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                                <p className="text-slate-500 font-medium">No se encontraron proveedores</p>
                                <p className="text-sm text-slate-400">Intente con otro término de búsqueda</p>
                            </div>
                        )}
                    </div>
                )}
            </main>

            {/* Floating Action Buffer for Bottom */}
            <div className={`fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-slate-200 transition-transform duration-300 transform ${selectedSupplierId ? 'translate-y-0' : 'translate-y-full'}`}>
                <div className="max-w-5xl mx-auto flex items-center justify-between">
                    <div>
                        <p className="text-sm text-slate-500">Proveedor seleccionado</p>
                        <p className="font-bold text-[#254153]">{selectedSupplierId ? 'ID: ' + selectedSupplierId : ''}</p>
                    </div>
                    <button
                        onClick={handleContinue}
                        className="bg-[#254153] hover:bg-[#1a2f3d] text-white px-8 py-3 rounded-xl font-semibold shadow-lg shadow-[#254153]/20 flex items-center gap-2 transition-all"
                    >
                        Continuar
                        <ArrowRight className="w-4 h-4" />
                    </button>
                </div>
            </div>
        </div>
    )
}
