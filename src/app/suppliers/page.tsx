'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/utils/supabase/client'
import { Search, Building2, ChevronRight, Users, LayoutGrid, List } from 'lucide-react'

export default function SuppliersListPage() {
    const router = useRouter()
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
    const [searchTerm, setSearchTerm] = useState('')
    const [suppliers, setSuppliers] = useState<any[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetchSuppliers()
    }, [])

    const fetchSuppliers = async () => {
        try {
            const { data, error } = await supabase
                .from('Neg_query_proveedores')
                .select('*')

            if (data) {
                // Enforce a stable ID
                const safeData = data.map((s: any, idx: number) => ({
                    ...s,
                    _ui_id: s.id || s.nit || s.NIT || s.codigo || `temp-id-${idx}`
                }))
                setSuppliers(safeData)
            }
        } catch (error) {
            console.error('Error fetching suppliers:', error)
        } finally {
            setLoading(false)
        }
    }

    const filteredSuppliers = suppliers.filter(s =>
        (s.proveedor || s.nombre || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (s.nit || '').toString().includes(searchTerm)
    )

    return (
        <div className="min-h-screen bg-slate-50 text-slate-900 font-sans pb-12">
            {/* Navbar */}
            <nav className="bg-white border-b border-slate-200 sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16">
                        <h1 className="text-xl font-bold text-[#254153]">Directorio de Proveedores</h1>
                        <div className="flex gap-2">
                            <button onClick={() => setViewMode('grid')} className={`p-2 rounded-lg ${viewMode === 'grid' ? 'bg-[#254153]/10 text-[#254153]' : 'text-slate-400'}`}>
                                <LayoutGrid className="w-5 h-5" />
                            </button>
                            <button onClick={() => setViewMode('list')} className={`p-2 rounded-lg ${viewMode === 'list' ? 'bg-[#254153]/10 text-[#254153]' : 'text-slate-400'}`}>
                                <List className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                </div>
            </nav>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

                {/* Search Header */}
                <div className="mb-8">
                    <div className="relative max-w-xl">
                        <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 h-5 w-5" />
                        <input
                            type="text"
                            placeholder="Buscar proveedor por nombre o NIT..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-12 pr-4 py-4 rounded-xl border-none ring-1 ring-slate-200 focus:ring-2 focus:ring-[#254153] shadow-sm text-base"
                        />
                    </div>
                </div>

                {/* Content */}
                {loading ? (
                    <div className="text-center py-20"><p className="text-slate-400">Cargando proveedores...</p></div>
                ) : (
                    <div className={viewMode === 'grid' ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" : "space-y-4"}>
                        {filteredSuppliers.map((supplier) => (
                            <div
                                key={supplier._ui_id}
                                onClick={() => router.push(`/suppliers/${supplier._ui_id}`)} // Go to Dashboard
                                className={`bg-white border border-slate-200 hover:border-[#254153]/40 hover:shadow-md transition-all cursor-pointer group ${viewMode === 'grid' ? 'rounded-2xl p-6 flex flex-col justify-between h-48' : 'rounded-xl p-4 flex items-center justify-between'
                                    }`}
                            >
                                <div className="flex items-start gap-4">
                                    <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center group-hover:bg-[#254153]/10 group-hover:text-[#254153] transition-colors">
                                        <Building2 className="w-6 h-6 text-slate-400 group-hover:text-[#254153]" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-slate-800 text-lg leading-tight group-hover:text-[#254153] mb-1">
                                            {supplier.proveedor || supplier.nombre || 'Nombre no disponible'}
                                        </h3>
                                        <span className="inline-block px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-500">
                                            NIT: {supplier.nit || supplier.id || 'N/A'}
                                        </span>
                                    </div>
                                </div>

                                {viewMode === 'grid' ? (
                                    <div className="flex items-center justify-between mt-auto pt-4 border-t border-slate-100">
                                        <span className="text-xs font-medium text-slate-400 flex items-center gap-1">
                                            <Users className="w-3 h-3" />
                                            Ver Dashboard
                                        </span>
                                        <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center group-hover:bg-[#254153] group-hover:text-white transition-all">
                                            <ChevronRight className="w-4 h-4" />
                                        </div>
                                    </div>
                                ) : (
                                    <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-[#254153]" />
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </main>
        </div>
    )
}
