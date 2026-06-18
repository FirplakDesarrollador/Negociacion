'use client'

import { useState, useMemo, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
    ArrowLeft,
    Home,
    Zap,
    Target,
    Activity,
    CalendarCheck,
    CheckCircle2,
    AlertCircle,
    ArrowUpDown,
    Plus,
    Trash2
} from 'lucide-react'

const objetivos = [
    'Nuevo proveedor para disminuir riesgo',
    'Nuevo proveedor eficiencia precio',
    'Nuevo producto para mejorar/corregir caracteristicas tecnicas',
    'Torbellino contigencia abastecimiento'
]

const dimensiones = ['Financiera', 'Operativa', 'Estratégica', 'Riesgo', 'Calidad']

const states = [
    'Sin iniciar',
    'standby',
    'en proceso',
    'cerrada ganada',
    'cerrada perdida'
]

const baseInitiatives = [
    { id: 1, priority: 2, name: 'nuevo proveedor deck' },
    { id: 2, priority: 2, name: 'Plywood' },
    { id: 3, priority: 3, name: 'PVC board' },
    { id: 4, priority: 1, name: 'Lamina de Carton corbox, carton col' },
    { id: 5, priority: 1, name: 'Cajas troqueladas carto colombia 60x...' },
    { id: 6, priority: 2, name: 'Pieamigo' },
    { id: 7, priority: 1, name: 'Limpiador Flowchem' },
    { id: 8, priority: 1, name: 'Flete terrestre' },
    { id: 9, priority: 1, name: 'EVA Marae' },
    { id: 10, priority: 1, name: 'PUR Marae' },
    { id: 11, priority: 1, name: 'Masa pulir 3m' },
    { id: 12, priority: 1, name: 'Riel Hafele montaje bajo' },
    { id: 13, priority: 1, name: 'Riel full extension 35 mediano' },
    { id: 14, priority: 1, name: 'Resina FV OCQ' },
    { id: 15, priority: 1, name: 'Resina MS OCQ' },
    { id: 16, priority: 1, name: 'Cromoterapias' },
    { id: 17, priority: 1, name: 'Cajas mueble elevado 48x38' },
    { id: 18, priority: 1, name: 'Zuncho' },
    { id: 19, priority: 1, name: 'Cromoterapia' },
]

const baseCotizaciones = [
    { id: 1, priority: 2, name: 'Cartan' },
    { id: 2, priority: 2, name: 'Kartonar' },
    { id: 3, priority: 1, name: 'Papelsa' },
    { id: 4, priority: 1, name: 'Indugevi' },
    { id: 5, priority: 1, name: 'Mediaprofili' },
    { id: 6, priority: 1, name: 'Metalisteria' },
    { id: 7, priority: 2, name: 'Forja y diseño' },
    { id: 8, priority: 1, name: 'Taller Reiven' },
    { id: 9, priority: 1, name: 'Mandala Metal' },
    { id: 10, priority: 1, name: 'Bosquema' },
    { id: 11, priority: 1, name: 'Muebles y madera la teca' },
    { id: 12, priority: 1, name: 'Manijas' },
    { id: 13, priority: 1, name: 'PVC Foamboard' },
    { id: 14, priority: 1, name: 'PVC Foamboard' },
    { id: 15, priority: 1, name: 'PVC Foamboard' },
    { id: 16, priority: 1, name: 'PVC Foamboard' },
    { id: 17, priority: 1, name: 'enteca' },
    { id: 18, priority: 1, name: 'Cajas y Empaques' },
    { id: 19, priority: 1, name: 'CajasPrint' },
    { id: 20, priority: 1, name: 'Mademor' },
    { id: 21, priority: 1, name: 'Unitexco' },
    { id: 22, priority: 1, name: 'Indugevi' },
    { id: 23, priority: 1, name: 'Sinu wood company' },
    { id: 24, priority: 1, name: 'Fletes' },
    { id: 25, priority: 1, name: 'Alea' },
    { id: 26, priority: 1, name: 'Industrias plastcas GR' },
    { id: 27, priority: 1, name: 'Flowchem' },
    { id: 28, priority: 1, name: 'Metalarias' },
    { id: 29, priority: 1, name: 'Maccana del Vecchio' },
    { id: 30, priority: 1, name: 'Hierro y Nogal' },
    { id: 31, priority: 1, name: 'Central estibas y huacales' },
    { id: 32, priority: 1, name: 'Madera y complemetos' },
    { id: 33, priority: 1, name: 'estibas y hucales metroantioquia' },
    { id: 34, priority: 1, name: 'Corbox (proveedor al frente de firplak)' },
    { id: 35, priority: 1, name: 'Serrano Gomez pino amarillo decks' },
    { id: 36, priority: 1, name: 'Sumitomo' },
    { id: 37, priority: 1, name: 'DTC' },
    { id: 38, priority: 1, name: 'Meaton' },
    { id: 39, priority: 1, name: 'Maxave' },
    { id: 40, priority: 1, name: 'Zuncho (GLOBAL SINTETICS)' },
    { id: 41, priority: 1, name: 'Carpas antioquia' },
    { id: 42, priority: 1, name: 'Sonoco' },
    { id: 43, priority: 1, name: 'United negociacion de peroxido mejor preci' },
    { id: 44, priority: 1, name: 'excala' },
    { id: 45, priority: 1, name: 'texcomercial' },
    { id: 46, priority: 1, name: 'Central de maderas' },
    { id: 47, priority: 1, name: 'Zuncho impar' },
    { id: 48, priority: 1, name: 'Stech' },
    { id: 49, priority: 1, name: 'Cinta' },
    { id: 50, priority: 1, name: 'Pelicula protector' },
    { id: 51, priority: 1, name: 'canto 2mm?' },
    { id: 52, priority: 1, name: 'strech solucione embalaje' },
    { id: 53, priority: 1, name: 'Strech burbuempaques interinsumos' },
    { id: 54, priority: 1, name: 'DISTRIBUIDORA SURTIR' },
    { id: 55, priority: 1, name: 'TUBOS Y EMPAQUES' },
    { id: 56, priority: 1, name: 'W A EMPAQUES' },
    { id: 57, priority: 1, name: 'Canastilla llaves, pop up desague bañera' },
    { id: 58, priority: 1, name: 'Poliplas' },
    { id: 59, priority: 1, name: 'interinsumos' },
    { id: 60, priority: 1, name: 'soco' },
    { id: 61, priority: 1, name: 'solcintas' }
]

interface Initiative {
    id: number
    priority: number
    name: string
    state: string
    dimension: string
    objective: string
    startDate: string
    endDate: string
}

interface Cotizacion {
    id: number
    priority: number
    name: string
    state: string
    dimension: string
    objective: string
    startDate: string
    endDate: string
}

interface Compromiso {
    id: number
    compromiso: string
    responsable: string
    fecha: string
    estado: string
}

export default function MCIPage() {
    const router = useRouter()
    const [activeTab, setActiveTab] = useState<'pred1' | 'pred2' | 'compromisos'>('pred1')
    
    // 1. STATE FOR INICIATIVAS (PREDICTIVA 1)
    const [initiatives, setInitiatives] = useState<Initiative[]>(() => {
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem('mci_initiatives')
            if (saved) {
                try { return JSON.parse(saved) } catch (e) { console.error(e) }
            }
        }
        const today = new Date().toISOString().split('T')[0]
        return baseInitiatives.map((item, index) => ({
            ...item,
            state: 'Sin iniciar',
            dimension: dimensiones[index % dimensiones.length],
            objective: objetivos[index % objetivos.length],
            startDate: today,
            endDate: ''
        }))
    })

    // 2. STATE FOR COTIZACIONES (PREDICTIVA 2)
    const [cotizaciones, setCotizaciones] = useState<Cotizacion[]>(() => {
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem('mci_cotizaciones')
            if (saved) {
                try { return JSON.parse(saved) } catch (e) { console.error(e) }
            }
        }
        const today = new Date().toISOString().split('T')[0]
        return baseCotizaciones.map((item, index) => ({
            ...item,
            state: 'Sin iniciar',
            dimension: dimensiones[index % dimensiones.length],
            objective: objetivos[index % objetivos.length],
            startDate: today,
            endDate: ''
        }))
    })

    // 3. STATE FOR COMPROMISOS
    const [compromisos, setCompromisos] = useState<Compromiso[]>(() => {
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem('mci_compromisos')
            if (saved) {
                try { return JSON.parse(saved) } catch (e) { console.error(e) }
            }
        }
        return [
            { id: 1, compromiso: 'definir impacto de ahorro en strech', responsable: 'Cata', fecha: '2026-06-11', estado: 'Pendiente' },
            { id: 2, compromiso: 'Reunión de alineación con proveedor Cartan', responsable: 'Alejo', fecha: '2026-06-15', estado: 'Realizado' },
            { id: 3, compromiso: 'Revisar cotizaciones de PVC Foamboard', responsable: 'Isabel', fecha: '2026-06-18', estado: 'En proceso' }
        ]
    })

    // Sync to LocalStorage
    useEffect(() => {
        localStorage.setItem('mci_initiatives', JSON.stringify(initiatives))
    }, [initiatives])

    useEffect(() => {
        localStorage.setItem('mci_cotizaciones', JSON.stringify(cotizaciones))
    }, [cotizaciones])

    useEffect(() => {
        localStorage.setItem('mci_compromisos', JSON.stringify(compromisos))
    }, [compromisos])

    // Filters & Sorting for Predictiva 1
    const [sortConfig, setSortConfig] = useState<{ key: string, direction: 'asc' | 'desc' } | null>(null)
    const [filters, setFilters] = useState<Record<string, string>>({})

    // Filters & Sorting for Predictiva 2
    const [cotSortConfig, setCotSortConfig] = useState<{ key: string, direction: 'asc' | 'desc' } | null>(null)
    const [cotFilters, setCotFilters] = useState<Record<string, string>>({})

    const handleUpdate = (id: number, field: string, value: string) => {
        setInitiatives(prev => prev.map(item => {
            if (item.id !== id) return item;
            const updated = { ...item, [field]: value };
            if (field === 'state' && value === 'cerrada ganada' && !updated.endDate) {
                updated.endDate = new Date().toISOString().split('T')[0];
            }
            return updated;
        }))
    }

    const handleUpdateCotizacion = (id: number, field: string, value: string) => {
        setCotizaciones(prev => prev.map(item => {
            if (item.id !== id) return item;
            const updated = { ...item, [field]: value };
            if (field === 'state' && value === 'cerrada ganada' && !updated.endDate) {
                updated.endDate = new Date().toISOString().split('T')[0];
            }
            return updated;
        }))
    }

    const handleAddCotizacion = () => {
        const today = new Date().toISOString().split('T')[0]
        const newId = cotizaciones.length > 0 ? Math.max(...cotizaciones.map(c => c.id)) + 1 : 1
        const newItem = {
            id: newId,
            priority: 1,
            name: 'Nueva Cotización / Proveedor',
            state: 'Sin iniciar',
            dimension: dimensiones[0],
            objective: objetivos[0],
            startDate: today,
            endDate: ''
        }
        setCotizaciones(prev => [newItem, ...prev])
    }

    const handleDeleteCotizacion = (id: number) => {
        if (confirm('¿Estás seguro de eliminar esta cotización?')) {
            setCotizaciones(prev => prev.filter(c => c.id !== id))
        }
    }

    const handleUpdateCompromiso = (id: number, field: string, value: string) => {
        setCompromisos(prev => prev.map(item => {
            if (item.id !== id) return item;
            return { ...item, [field]: value };
        }))
    }

    const handleAddCompromiso = () => {
        const today = new Date().toISOString().split('T')[0]
        const newId = compromisos.length > 0 ? Math.max(...compromisos.map(c => c.id)) + 1 : 1
        const newItem = {
            id: newId,
            compromiso: '',
            responsable: 'Isabel',
            fecha: today,
            estado: 'Pendiente'
        }
        setCompromisos(prev => [newItem, ...prev])
    }

    const handleDeleteCompromiso = (id: number) => {
        if (confirm('¿Estás seguro de eliminar este compromiso?')) {
            setCompromisos(prev => prev.filter(c => c.id !== id))
        }
    }

    const calculateDuration = (start: string, end: string) => {
        if (!start || !end) return '';
        const startDate = new Date(start);
        const endDate = new Date(end);
        const diffTime = endDate.getTime() - startDate.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
        return diffDays >= 0 ? diffDays : 0;
    }

    const getPriorityColor = (priority: number) => {
        switch (priority) {
            case 1: return 'bg-rose-100 text-rose-800 border-rose-200'
            case 2: return 'bg-amber-100 text-amber-800 border-amber-200'
            case 3: return 'bg-emerald-100 text-emerald-800 border-emerald-200'
            default: return 'bg-slate-100 text-slate-800 border-slate-200'
        }
    }

    const getStateColor = (state: string) => {
        switch (state) {
            case 'Sin iniciar': return 'bg-slate-100 text-slate-600'
            case 'standby': return 'bg-amber-100 text-amber-700'
            case 'en proceso': return 'bg-blue-100 text-blue-700'
            case 'cerrada ganada': return 'bg-emerald-100 text-emerald-700'
            case 'cerrada perdida': return 'bg-rose-100 text-rose-700'
            default: return 'bg-slate-100 text-slate-600'
        }
    }

    const handleSort = (key: string) => {
        let direction: 'asc' | 'desc' = 'asc';
        if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    }

    const handleFilterChange = (key: string, value: string) => {
        setFilters(prev => ({ ...prev, [key]: value }));
    }

    const filteredAndSortedData = useMemo(() => {
        let result = [...initiatives];
        Object.keys(filters).forEach(key => {
            if (filters[key]) {
                const filterValue = filters[key].toLowerCase();
                result = result.filter(item => {
                    let itemValue = (item as any)[key];
                    if (key === 'duration') {
                        itemValue = calculateDuration(item.startDate, item.endDate);
                    }
                    if (itemValue === null || itemValue === undefined) return false;
                    return itemValue.toString().toLowerCase().includes(filterValue);
                });
            }
        });

        if (sortConfig) {
            result.sort((a, b) => {
                let aValue = (a as any)[sortConfig.key];
                let bValue = (b as any)[sortConfig.key];
                if (sortConfig.key === 'duration') {
                    aValue = calculateDuration(a.startDate, a.endDate) || 0;
                    bValue = calculateDuration(b.startDate, b.endDate) || 0;
                }
                if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
                if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
                return 0;
            });
        }
        return result;
    }, [initiatives, sortConfig, filters]);

    const handleCotSort = (key: string) => {
        let direction: 'asc' | 'desc' = 'asc';
        if (cotSortConfig && cotSortConfig.key === key && cotSortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setCotSortConfig({ key, direction });
    }

    const handleCotFilterChange = (key: string, value: string) => {
        setCotFilters(prev => ({ ...prev, [key]: value }));
    }

    const filteredAndSortedCotizaciones = useMemo(() => {
        let result = [...cotizaciones];
        Object.keys(cotFilters).forEach(key => {
            if (cotFilters[key]) {
                const filterValue = cotFilters[key].toLowerCase();
                result = result.filter(item => {
                    let itemValue = (item as any)[key];
                    if (key === 'duration') {
                        itemValue = calculateDuration(item.startDate, item.endDate);
                    }
                    if (itemValue === null || itemValue === undefined) return false;
                    return itemValue.toString().toLowerCase().includes(filterValue);
                });
            }
        });

        if (cotSortConfig) {
            result.sort((a, b) => {
                let aValue = (a as any)[cotSortConfig.key];
                let bValue = (b as any)[cotSortConfig.key];
                if (cotSortConfig.key === 'duration') {
                    aValue = calculateDuration(a.startDate, a.endDate) || 0;
                    bValue = calculateDuration(b.startDate, b.endDate) || 0;
                }
                if (aValue < bValue) return cotSortConfig.direction === 'asc' ? -1 : 1;
                if (aValue > bValue) return cotSortConfig.direction === 'asc' ? 1 : -1;
                return 0;
            });
        }
        return result;
    }, [cotizaciones, cotSortConfig, cotFilters]);

    const Th = ({ label, sortKey, width }: { label: string, sortKey: string, width?: string }) => (
        <th className={`px-3 py-4 align-top ${width || 'auto'}`}>
            <div className="flex flex-col gap-2">
                <button 
                    onClick={() => handleSort(sortKey)} 
                    className="flex items-center gap-1 font-bold text-slate-500 hover:text-slate-800 transition-colors uppercase text-xs tracking-wider text-left"
                >
                    {label}
                    <ArrowUpDown className="w-3 h-3 opacity-50" />
                </button>
                <input 
                    type="text" 
                    placeholder="Filtrar..." 
                    value={filters[sortKey] || ''}
                    onChange={(e) => handleFilterChange(sortKey, e.target.value)}
                    className="w-full text-xs p-1.5 border border-slate-200 rounded outline-none focus:border-[#254153] font-normal bg-slate-50 focus:bg-white"
                />
            </div>
        </th>
    );

    const CotTh = ({ label, sortKey, width }: { label: string, sortKey: string, width?: string }) => (
        <th className={`px-3 py-4 align-top ${width || 'auto'}`}>
            <div className="flex flex-col gap-2">
                <button 
                    onClick={() => handleCotSort(sortKey)} 
                    className="flex items-center gap-1 font-bold text-slate-500 hover:text-slate-800 transition-colors uppercase text-xs tracking-wider text-left"
                >
                    {label}
                    <ArrowUpDown className="w-3 h-3 opacity-50" />
                </button>
                <input 
                    type="text" 
                    placeholder="Filtrar..." 
                    value={cotFilters[sortKey] || ''}
                    onChange={(e) => handleCotFilterChange(sortKey, e.target.value)}
                    className="w-full text-xs p-1.5 border border-slate-200 rounded outline-none focus:border-[#254153] font-normal bg-slate-50 focus:bg-white"
                />
            </div>
        </th>
    );

    return (
        <div className="min-h-screen bg-slate-50 text-slate-900 font-sans pb-24">
            {/* Navbar */}
            <nav className="bg-white border-b border-slate-200 sticky top-0 z-50 shadow-sm">
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
                                <h1 className="text-lg font-bold text-[#254153]">MCI</h1>
                                <p className="text-xs text-slate-500">Metas Crucialmente Importantes</p>
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

            <main className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
                
                {/* Header Information Card */}
                <div className="bg-white rounded-2xl p-8 border border-slate-200 shadow-sm mb-8 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-8 opacity-5">
                        <Zap className="w-48 h-48 text-amber-500" />
                    </div>
                    
                    <div className="relative z-10">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="bg-amber-100 p-3 rounded-xl">
                                <Zap className="w-8 h-8 text-amber-600" />
                            </div>
                            <div>
                                <h2 className="text-3xl font-bold text-[#254153]">¿Qué es una MCI?</h2>
                                <p className="text-slate-500 font-medium mt-1">Metodología de ejecución estratégica</p>
                            </div>
                        </div>

                        <div className="bg-amber-50 border border-amber-100 rounded-xl p-6 mb-8">
                            <p className="text-amber-900 text-lg leading-relaxed font-medium italic">
                                "MCI (Meta Crucialmente Importante), debe ser clara, medible y enfocada en resultados. No puedes enfocarte en demasiadas metas al mismo tiempo; una MCI debe ser 1 o 2 y muy claras."
                            </p>
                            <p className="text-amber-800 mt-4 text-sm bg-white/50 p-4 rounded-lg">
                                <span className="font-bold">Ejemplo:</span> Reducir el consumo diario de 3,000 a 2,500 calorías antes de X fecha. (Eso es el resultado final).
                            </p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
                                <div className="flex items-center gap-2 mb-3">
                                    <Target className="w-5 h-5 text-rose-500" />
                                    <h3 className="font-bold text-slate-800">Lag Measures</h3>
                                </div>
                                <p className="text-sm text-slate-600 leading-relaxed">
                                    Cómo mides el resultado final. No puedes decir simplemente "hoy voy a pesar menos", porque en el día a día eso no es accionable. Llevas una medición del resultado.
                                </p>
                            </div>
                            
                            <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
                                <div className="flex items-center gap-2 mb-3">
                                    <Activity className="w-5 h-5 text-blue-500" />
                                    <h3 className="font-bold text-slate-800">Lead Measures</h3>
                                </div>
                                <p className="text-sm text-slate-600 leading-relaxed">
                                    Medidas predictivas. Necesitas enfocarte en comportamientos que sí puedes controlar y que predicen el resultado.
                                </p>
                                <ul className="mt-3 space-y-1 text-xs text-slate-500 font-medium">
                                    <li>• Registrar todo lo que comes</li>
                                    <li>• Planear tus comidas</li>
                                    <li>• Evitar bebidas azucaradas</li>
                                    <li>• Comer máximo X calorías en cena</li>
                                    <li>• Hacer ejercicio X veces/semana</li>
                                </ul>
                            </div>

                            <div className="bg-[#254153] border border-[#1a2f3d] rounded-xl p-6 shadow-sm text-white">
                                <div className="flex items-center gap-2 mb-3">
                                    <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                                    <h3 className="font-bold">Resumen de Flujo</h3>
                                </div>
                                <p className="text-sm text-blue-100 leading-relaxed mb-4">
                                    Dejas de obsesionarte con el resultado... y te obsesionas con las acciones correctas.
                                </p>
                                <div className="space-y-2 text-xs font-medium">
                                    <div className="bg-white/10 p-2 rounded"><strong>MCI:</strong> A dónde vas</div>
                                    <div className="bg-white/10 p-2 rounded"><strong>Lag:</strong> Cómo mides el resultado</div>
                                    <div className="bg-white/10 p-2 rounded"><strong>Lead:</strong> Qué mueve el resultado</div>
                                    <div className="bg-white/10 p-2 rounded"><strong>Compromisos:</strong> Lo que haces esta semana</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex space-x-1 bg-slate-200/50 p-1 rounded-xl mb-6 overflow-x-auto">
                    <button
                        onClick={() => setActiveTab('pred1')}
                        className={`flex-1 min-w-[200px] py-3 px-4 rounded-lg text-sm font-bold transition-all ${
                            activeTab === 'pred1' 
                                ? 'bg-white text-[#254153] shadow-sm' 
                                : 'text-slate-500 hover:text-slate-700 hover:bg-white/50'
                        }`}
                    >
                        Predictiva 1 (Desarrollo)
                    </button>
                    <button
                        onClick={() => setActiveTab('pred2')}
                        className={`flex-1 min-w-[200px] py-3 px-4 rounded-lg text-sm font-bold transition-all ${
                            activeTab === 'pred2' 
                                ? 'bg-white text-[#254153] shadow-sm' 
                                : 'text-slate-500 hover:text-slate-700 hover:bg-white/50'
                        }`}
                    >
                        Predictiva 2 (Cotizaciones)
                    </button>
                    <button
                        onClick={() => setActiveTab('compromisos')}
                        className={`flex-1 min-w-[200px] py-3 px-4 rounded-lg text-sm font-bold transition-all ${
                            activeTab === 'compromisos' 
                                ? 'bg-white text-[#254153] shadow-sm' 
                                : 'text-slate-500 hover:text-slate-700 hover:bg-white/50'
                        }`}
                    >
                        Compromisos
                    </button>
                </div>

                {/* Tab Content */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden min-h-[400px]">
                    {/* PREDICTIVA 1 (DESARROLLO DE INICIATIVAS) */}
                    {activeTab === 'pred1' && (
                        <div>
                            <div className="bg-slate-50 p-6 border-b border-slate-200 flex items-center justify-between">
                                <div>
                                    <h3 className="text-xl font-bold text-[#254153]">Desarrollo de iniciativas</h3>
                                    <p className="text-sm text-slate-500">Gestión y seguimiento de estado</p>
                                </div>
                                <div className="text-xs text-slate-500 bg-white px-3 py-1.5 rounded-lg border border-slate-200 shadow-sm font-medium">
                                    Mostrando {filteredAndSortedData.length} registros
                                </div>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse whitespace-nowrap">
                                    <thead>
                                        <tr className="bg-white border-b border-slate-100">
                                            <Th label="Prioridad" sortKey="priority" width="w-24" />
                                            <Th label="Iniciativa" sortKey="name" width="min-w-[200px]" />
                                            <Th label="Dimensión" sortKey="dimension" />
                                            <Th label="Objetivo" sortKey="objective" />
                                            <Th label="Fecha Inicio" sortKey="startDate" />
                                            <Th label="Fecha Fin" sortKey="endDate" />
                                            <Th label="Duración (días)" sortKey="duration" />
                                            <Th label="Estado" sortKey="state" width="w-48" />
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {filteredAndSortedData.map((item) => (
                                            <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                                                <td className="px-3 py-4 text-center align-middle">
                                                    <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold border ${getPriorityColor(item.priority)}`}>
                                                        {item.priority}
                                                    </span>
                                                </td>
                                                <td className="px-3 py-4 align-middle">
                                                    <span className="font-semibold text-slate-700 whitespace-normal block min-w-[200px]">{item.name}</span>
                                                </td>
                                                <td className="px-3 py-4 align-middle">
                                                    <select 
                                                        value={item.dimension} 
                                                        onChange={(e) => handleUpdate(item.id, 'dimension', e.target.value)}
                                                        className="w-full text-xs font-medium px-2 py-1.5 rounded border border-slate-200 bg-white"
                                                    >
                                                        {dimensiones.map(d => <option key={d} value={d}>{d}</option>)}
                                                    </select>
                                                </td>
                                                <td className="px-3 py-4 align-middle">
                                                    <select 
                                                        value={item.objective} 
                                                        onChange={(e) => handleUpdate(item.id, 'objective', e.target.value)}
                                                        className="w-full text-xs font-medium px-2 py-1.5 rounded border border-slate-200 bg-white min-w-[180px] whitespace-normal"
                                                    >
                                                        {objetivos.map(o => <option key={o} value={o}>{o}</option>)}
                                                    </select>
                                                </td>
                                                <td className="px-3 py-4 align-middle">
                                                    <input 
                                                        type="date" 
                                                        value={item.startDate} 
                                                        onChange={(e) => handleUpdate(item.id, 'startDate', e.target.value)}
                                                        className="w-full text-xs font-medium px-2 py-1.5 rounded border border-slate-200 bg-white"
                                                    />
                                                </td>
                                                <td className="px-3 py-4 align-middle">
                                                    <input 
                                                        type="date" 
                                                        value={item.endDate} 
                                                        onChange={(e) => handleUpdate(item.id, 'endDate', e.target.value)}
                                                        className={`w-full text-xs font-medium px-2 py-1.5 rounded border ${item.state !== 'cerrada ganada' ? 'bg-slate-100 text-slate-400 border-transparent' : 'bg-white border-slate-200'}`}
                                                        disabled={item.state !== 'cerrada ganada'}
                                                    />
                                                </td>
                                                <td className="px-3 py-4 text-center align-middle">
                                                    <span className="text-sm font-bold text-[#254153]">
                                                        {calculateDuration(item.startDate, item.endDate) !== '' ? `${calculateDuration(item.startDate, item.endDate)}` : '-'}
                                                    </span>
                                                </td>
                                                <td className="px-3 py-4 align-middle">
                                                    <select
                                                        value={item.state}
                                                        onChange={(e) => handleUpdate(item.id, 'state', e.target.value)}
                                                        className={`w-full appearance-none outline-none text-xs font-bold uppercase tracking-wider px-3 py-2 rounded-lg cursor-pointer transition-colors border-2 border-transparent hover:border-slate-200 focus:border-[#254153] ${getStateColor(item.state)}`}
                                                    >
                                                        {states.map(s => (
                                                            <option key={s} value={s}>{s}</option>
                                                        ))}
                                                    </select>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* PREDICTIVA 2 (COTIZACIONES) */}
                    {activeTab === 'pred2' && (
                        <div>
                            <div className="bg-slate-50 p-6 border-b border-slate-200 flex items-center justify-between">
                                <div>
                                    <h3 className="text-xl font-bold text-[#254153]">Cotizaciones de proveedores</h3>
                                    <p className="text-sm text-slate-500">Gestión de cotizaciones y negociaciones predictivas</p>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="text-xs text-slate-500 bg-white px-3 py-1.5 rounded-lg border border-slate-200 shadow-sm font-medium">
                                        Mostrando {filteredAndSortedCotizaciones.length} registros
                                    </div>
                                    <button
                                        onClick={handleAddCotizacion}
                                        className="bg-[#254153] hover:bg-[#1a2f3d] text-white px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 shadow-sm cursor-pointer"
                                    >
                                        <Plus className="w-3.5 h-3.5" /> Agregar Cotización
                                    </button>
                                </div>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse whitespace-nowrap">
                                    <thead>
                                        <tr className="bg-white border-b border-slate-100">
                                            <CotTh label="Prioridad" sortKey="priority" width="w-24" />
                                            <CotTh label="Proveedor / Item" sortKey="name" width="min-w-[200px]" />
                                            <CotTh label="Dimensión" sortKey="dimension" />
                                            <CotTh label="Objetivo" sortKey="objective" />
                                            <CotTh label="Fecha Inicio" sortKey="startDate" />
                                            <CotTh label="Fecha Fin" sortKey="endDate" />
                                            <CotTh label="Duración (días)" sortKey="duration" />
                                            <CotTh label="Estado" sortKey="state" width="w-48" />
                                            <th className="px-3 py-4 w-12 text-center text-xs font-bold text-slate-400 uppercase tracking-wider">Acciones</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {filteredAndSortedCotizaciones.map((item) => (
                                            <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                                                <td className="px-3 py-4 text-center align-middle">
                                                    <select
                                                        value={item.priority}
                                                        onChange={(e) => handleUpdateCotizacion(item.id, 'priority', e.target.value)}
                                                        className={`inline-flex items-center justify-center w-12 h-8 rounded text-sm font-bold border focus:outline-none focus:ring-1 focus:ring-[#254153] ${getPriorityColor(Number(item.priority))}`}
                                                    >
                                                        <option value="1">1</option>
                                                        <option value="2">2</option>
                                                        <option value="3">3</option>
                                                    </select>
                                                </td>
                                                <td className="px-3 py-4 align-middle">
                                                    <input
                                                        type="text"
                                                        value={item.name}
                                                        onChange={(e) => handleUpdateCotizacion(item.id, 'name', e.target.value)}
                                                        className="w-full font-semibold text-slate-700 bg-transparent hover:bg-slate-100/50 focus:bg-white border border-transparent focus:border-slate-200 px-2.5 py-1.5 outline-none rounded transition-all min-w-[250px]"
                                                    />
                                                </td>
                                                <td className="px-3 py-4 align-middle">
                                                    <select 
                                                        value={item.dimension} 
                                                        onChange={(e) => handleUpdateCotizacion(item.id, 'dimension', e.target.value)}
                                                        className="w-full text-xs font-medium px-2 py-1.5 rounded border border-slate-200 bg-white"
                                                    >
                                                        {dimensiones.map(d => <option key={d} value={d}>{d}</option>)}
                                                    </select>
                                                </td>
                                                <td className="px-3 py-4 align-middle">
                                                    <select 
                                                        value={item.objective} 
                                                        onChange={(e) => handleUpdateCotizacion(item.id, 'objective', e.target.value)}
                                                        className="w-full text-xs font-medium px-2 py-1.5 rounded border border-slate-200 bg-white min-w-[180px] whitespace-normal"
                                                    >
                                                        {objetivos.map(o => <option key={o} value={o}>{o}</option>)}
                                                    </select>
                                                </td>
                                                <td className="px-3 py-4 align-middle">
                                                    <input 
                                                        type="date" 
                                                        value={item.startDate} 
                                                        onChange={(e) => handleUpdateCotizacion(item.id, 'startDate', e.target.value)}
                                                        className="w-full text-xs font-medium px-2 py-1.5 rounded border border-slate-200 bg-white"
                                                    />
                                                </td>
                                                <td className="px-3 py-4 align-middle">
                                                    <input 
                                                        type="date" 
                                                        value={item.endDate} 
                                                        onChange={(e) => handleUpdateCotizacion(item.id, 'endDate', e.target.value)}
                                                        className={`w-full text-xs font-medium px-2 py-1.5 rounded border ${item.state !== 'cerrada ganada' ? 'bg-slate-100 text-slate-400 border-transparent' : 'bg-white border-slate-200'}`}
                                                        disabled={item.state !== 'cerrada ganada'}
                                                    />
                                                </td>
                                                <td className="px-3 py-4 text-center align-middle">
                                                    <span className="text-sm font-bold text-[#254153]">
                                                        {calculateDuration(item.startDate, item.endDate) !== '' ? `${calculateDuration(item.startDate, item.endDate)}` : '-'}
                                                    </span>
                                                </td>
                                                <td className="px-3 py-4 align-middle">
                                                    <select
                                                        value={item.state}
                                                        onChange={(e) => handleUpdateCotizacion(item.id, 'state', e.target.value)}
                                                        className={`w-full appearance-none outline-none text-xs font-bold uppercase tracking-wider px-3 py-2 rounded-lg cursor-pointer transition-colors border-2 border-transparent hover:border-slate-200 focus:border-[#254153] ${getStateColor(item.state)}`}
                                                    >
                                                        {states.map(s => (
                                                            <option key={s} value={s}>{s}</option>
                                                        ))}
                                                    </select>
                                                </td>
                                                <td className="px-3 py-4 text-center align-middle">
                                                    <button
                                                        onClick={() => handleDeleteCotizacion(item.id)}
                                                        className="p-1.5 text-rose-500 hover:bg-rose-50 rounded transition-colors cursor-pointer"
                                                        title="Eliminar fila"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* COMPROMISOS */}
                    {activeTab === 'compromisos' && (
                        <div>
                            <div className="bg-slate-50 p-6 border-b border-slate-200 flex items-center justify-between">
                                <div>
                                    <h3 className="text-xl font-bold text-[#254153]">Compromisos Semanales</h3>
                                    <p className="text-sm text-slate-500">Planificación de acciones clave para esta semana</p>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="text-xs text-slate-500 bg-white px-3 py-1.5 rounded-lg border border-slate-200 shadow-sm font-medium">
                                        Total: {compromisos.length} compromisos
                                    </div>
                                    <button
                                        onClick={handleAddCompromiso}
                                        className="bg-[#254153] hover:bg-[#1a2f3d] text-white px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 shadow-sm cursor-pointer"
                                    >
                                        <Plus className="w-3.5 h-3.5" /> Agregar Compromiso
                                    </button>
                                </div>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse whitespace-nowrap">
                                    <thead>
                                        <tr className="bg-white border-b border-slate-100">
                                            <th className="px-6 py-4 w-20 text-xs font-bold text-slate-400 uppercase tracking-wider text-center">Estado</th>
                                            <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider min-w-[350px]">Compromiso</th>
                                            <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider w-48">Responsable</th>
                                            <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider w-48">Fecha Límite</th>
                                            <th className="px-6 py-4 w-12 text-center text-xs font-bold text-slate-400 uppercase tracking-wider">Acciones</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {compromisos.map((item) => (
                                            <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                                                <td className="px-6 py-4 text-center align-middle">
                                                    <select
                                                        value={item.estado}
                                                        onChange={(e) => handleUpdateCompromiso(item.id, 'estado', e.target.value)}
                                                        className={`text-xs font-bold uppercase tracking-wider px-2.5 py-1.5 rounded-lg cursor-pointer outline-none border border-transparent transition-all ${
                                                            item.estado === 'Realizado' 
                                                                ? 'bg-emerald-100 text-emerald-800' 
                                                                : item.estado === 'En proceso' 
                                                                ? 'bg-blue-100 text-blue-800' 
                                                                : 'bg-slate-100 text-slate-600'
                                                        }`}
                                                    >
                                                        <option value="Pendiente">Pendiente</option>
                                                        <option value="En proceso">En proceso</option>
                                                        <option value="Realizado">Realizado</option>
                                                    </select>
                                                </td>
                                                <td className="px-6 py-4 align-middle">
                                                    <input
                                                        type="text"
                                                        value={item.compromiso}
                                                        onChange={(e) => handleUpdateCompromiso(item.id, 'compromiso', e.target.value)}
                                                        placeholder="Describa el compromiso..."
                                                        className="w-full font-medium text-slate-700 bg-transparent hover:bg-slate-100/50 focus:bg-white border border-transparent focus:border-slate-200 px-3 py-2 outline-none rounded transition-all min-w-[300px]"
                                                    />
                                                </td>
                                                <td className="px-6 py-4 align-middle">
                                                    <select
                                                        value={item.responsable}
                                                        onChange={(e) => handleUpdateCompromiso(item.id, 'responsable', e.target.value)}
                                                        className="w-full text-sm font-semibold text-slate-700 px-3 py-2 rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-1 focus:ring-[#254153]"
                                                    >
                                                        <option value="Isabel">Isabel</option>
                                                        <option value="Nalle">Nalle</option>
                                                        <option value="Cata">Cata</option>
                                                        <option value="Alejo">Alejo</option>
                                                    </select>
                                                </td>
                                                <td className="px-6 py-4 align-middle">
                                                    <input
                                                        type="date"
                                                        value={item.fecha}
                                                        onChange={(e) => handleUpdateCompromiso(item.id, 'fecha', e.target.value)}
                                                        className="w-full text-sm font-medium text-slate-700 px-3 py-2 rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-1 focus:ring-[#254153]"
                                                    />
                                                </td>
                                                <td className="px-6 py-4 text-center align-middle">
                                                    <button
                                                        onClick={() => handleDeleteCompromiso(item.id)}
                                                        className="p-1.5 text-rose-500 hover:bg-rose-50 rounded transition-colors cursor-pointer"
                                                        title="Eliminar compromiso"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                        {compromisos.length === 0 && (
                                            <tr>
                                                <td colSpan={5} className="px-6 py-12 text-center text-slate-400 italic">
                                                    No hay compromisos creados para esta semana. ¡Haz clic en "Agregar Compromiso" para empezar!
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>

            </main>
        </div>
    )
}
