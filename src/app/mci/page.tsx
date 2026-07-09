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

const dimensiones = ['Financiera', 'Costo', 'Estratégica', 'Riesgo', 'Calidad']

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
    { id: 1, fecha: '2026-02-12', responsable: 'Nalle', tipo: 'Outbound', descripcion: 'Cotización inicial de cajas de cartón' },
    { id: 2, fecha: '2026-02-19', responsable: 'Alejo', tipo: 'Iniciativa propia', descripcion: 'Estudio de costos de resinas' },
    { id: 3, fecha: '2026-02-26', responsable: 'Isabel', tipo: 'Outbound', descripcion: 'Cotización de PVC Foamboard' },
    { id: 4, fecha: '2026-03-05', responsable: 'Cata', tipo: 'Iniciativa propia', descripcion: 'Evaluación de tarifas de fletes' }
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
    moneyImpact?: number
}

interface Cotizacion {
    id: number
    fecha: string
    responsable: string
    tipo: string
    descripcion: string
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
                try {
                    const parsed = JSON.parse(saved)
                    if (Array.isArray(parsed)) {
                        return parsed.map((item: any) => ({
                            ...item,
                            dimension: item.dimension === 'Operativa' ? 'Costo' : item.dimension,
                            moneyImpact: item.moneyImpact || 0
                        }))
                    }
                } catch (e) { console.error(e) }
            }
        }
        const today = new Date().toISOString().split('T')[0]
        return baseInitiatives.map((item, index) => ({
            ...item,
            state: 'Sin iniciar',
            dimension: dimensiones[index % dimensiones.length] === 'Operativa' ? 'Costo' : dimensiones[index % dimensiones.length],
            objective: objetivos[index % objetivos.length],
            startDate: today,
            endDate: '',
            moneyImpact: 0
        }))
    })

    // 2. STATE FOR COTIZACIONES (PREDICTIVA 2)
    const [cotizaciones, setCotizaciones] = useState<Cotizacion[]>(() => {
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem('mci_cotizaciones')
            if (saved) {
                try {
                    const parsed = JSON.parse(saved)
                    if (Array.isArray(parsed)) {
                        return parsed.map((item: any) => ({
                            id: item.id,
                            fecha: item.fecha || item.startDate || '2026-02-12',
                            responsable: item.responsable || 'Nalle',
                            tipo: item.tipo || 'Outbound',
                            descripcion: item.descripcion || item.name || 'Cotización de proveedor'
                        }))
                    }
                } catch (e) { console.error(e) }
            }
        }
        return baseCotizaciones
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

    // --- SNAPSHOTS (PHOTOS) LOGIC FOR MCI SNAPSHOTS ---
    const [initiativesSnapshots, setInitiativesSnapshots] = useState<any[]>(() => {
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem('mci_initiatives_snapshots')
            if (saved) {
                try {
                    const parsed = JSON.parse(saved)
                    if (Array.isArray(parsed)) {
                        return parsed.map((snap: any) => ({
                            ...snap,
                            items: Array.isArray(snap.items) ? snap.items.map((item: any) => ({
                                ...item,
                                dimension: item.dimension === 'Operativa' ? 'Costo' : item.dimension,
                                moneyImpact: item.moneyImpact || 0
                            })) : []
                        }))
                    }
                } catch (e) { console.error(e) }
            }
        }
        return []
    })

    const [cotizacionesSnapshots, setCotizacionesSnapshots] = useState<any[]>(() => {
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem('mci_cotizaciones_snapshots')
            if (saved) {
                try {
                    const parsed = JSON.parse(saved)
                    if (Array.isArray(parsed)) {
                        return parsed.map((snap: any) => ({
                            ...snap,
                            items: Array.isArray(snap.items) ? snap.items.map((item: any) => ({
                                id: item.id,
                                fecha: item.fecha || item.startDate || snap.date || '2026-02-12',
                                responsable: item.responsable || 'Nalle',
                                tipo: item.tipo || 'Outbound',
                                descripcion: item.descripcion || item.name || 'Cotización de proveedor'
                            })) : []
                        }))
                    }
                } catch (e) { console.error(e) }
            }
        }
        return []
    })

    const [compromisosSnapshots, setCompromisosSnapshots] = useState<any[]>(() => {
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem('mci_compromisos_snapshots')
            if (saved) {
                try { return JSON.parse(saved) } catch (e) { console.error(e) }
            }
        }
        return []
    })

    // Active/Selected Snapshot filters
    const [selectedSnapshotPred1, setSelectedSnapshotPred1] = useState<string>('active')
    const [selectedSnapshotPred2, setSelectedSnapshotPred2] = useState<string>('active')
    const [selectedSnapshotCompromisos, setSelectedSnapshotCompromisos] = useState<string>('active')

    // Dates for saving snapshots
    const [reviewDatePred1, setReviewDatePred1] = useState(() => new Date().toISOString().split('T')[0])
    const [reviewDatePred2, setReviewDatePred2] = useState(() => new Date().toISOString().split('T')[0])
    const [reviewDateCompromisos, setReviewDateCompromisos] = useState(() => new Date().toISOString().split('T')[0])

    // Sync snapshots to localstorage
    useEffect(() => {
        localStorage.setItem('mci_initiatives_snapshots', JSON.stringify(initiativesSnapshots))
    }, [initiativesSnapshots])

    useEffect(() => {
        localStorage.setItem('mci_cotizaciones_snapshots', JSON.stringify(cotizacionesSnapshots))
    }, [cotizacionesSnapshots])

    useEffect(() => {
        localStorage.setItem('mci_compromisos_snapshots', JSON.stringify(compromisosSnapshots))
    }, [compromisosSnapshots])

    // Snapshot actions
    const handleSaveSnapshotPred1 = () => {
        if (!reviewDatePred1) return alert('Por favor selecciona una fecha.')
        const exists = initiativesSnapshots.some(s => s.date === reviewDatePred1)
        if (exists && !confirm(`Ya existe una foto para la fecha ${reviewDatePred1}. ¿Deseas sobrescribirla?`)) return
        setInitiativesSnapshots(prev => {
            const filtered = prev.filter(s => s.date !== reviewDatePred1)
            return [...filtered, { date: reviewDatePred1, items: JSON.parse(JSON.stringify(initiatives)) }].sort((a, b) => b.date.localeCompare(a.date))
        })
        setSelectedSnapshotPred1(reviewDatePred1)
        alert('Foto guardada correctamente.')
    }

    const handleDeleteSnapshotPred1 = (date: string) => {
        if (confirm(`¿Estás seguro de eliminar la foto del ${date}?`)) {
            setInitiativesSnapshots(prev => prev.filter(s => s.date !== date))
            setSelectedSnapshotPred1('active')
        }
    }

    const handleSaveSnapshotPred2 = () => {
        if (!reviewDatePred2) return alert('Por favor selecciona una fecha.')
        const exists = cotizacionesSnapshots.some(s => s.date === reviewDatePred2)
        if (exists && !confirm(`Ya existe una foto para la fecha ${reviewDatePred2}. ¿Deseas sobrescribirla?`)) return
        setCotizacionesSnapshots(prev => {
            const filtered = prev.filter(s => s.date !== reviewDatePred2)
            return [...filtered, { date: reviewDatePred2, items: JSON.parse(JSON.stringify(cotizaciones)) }].sort((a, b) => b.date.localeCompare(a.date))
        })
        setSelectedSnapshotPred2(reviewDatePred2)
        alert('Foto guardada correctamente.')
    }

    const handleDeleteSnapshotPred2 = (date: string) => {
        if (confirm(`¿Estás seguro de eliminar la foto del ${date}?`)) {
            setCotizacionesSnapshots(prev => prev.filter(s => s.date !== date))
            setSelectedSnapshotPred2('active')
        }
    }

    const handleSaveSnapshotCompromisos = () => {
        if (!reviewDateCompromisos) return alert('Por favor selecciona una fecha.')
        const exists = compromisosSnapshots.some(s => s.date === reviewDateCompromisos)
        if (exists && !confirm(`Ya existe una foto para la fecha ${reviewDateCompromisos}. ¿Deseas sobrescribirla?`)) return
        setCompromisosSnapshots(prev => {
            const filtered = prev.filter(s => s.date !== reviewDateCompromisos)
            return [...filtered, { date: reviewDateCompromisos, items: JSON.parse(JSON.stringify(compromisos)) }].sort((a, b) => b.date.localeCompare(a.date))
        })
        setSelectedSnapshotCompromisos(reviewDateCompromisos)
        alert('Foto guardada correctamente.')
    }

    const handleDeleteSnapshotCompromisos = (date: string) => {
        if (confirm(`¿Estás seguro de eliminar la foto del ${date}?`)) {
            setCompromisosSnapshots(prev => prev.filter(s => s.date !== date))
            setSelectedSnapshotCompromisos('active')
        }
    }

    // Current views (active or snapshot)
    const currentInitiatives = useMemo(() => {
        if (selectedSnapshotPred1 === 'active') return initiatives
        const snap = initiativesSnapshots.find(s => s.date === selectedSnapshotPred1)
        return snap ? snap.items : []
    }, [initiatives, initiativesSnapshots, selectedSnapshotPred1])

    const initiativeStats = useMemo(() => {
        const total = currentInitiatives.length
        const p1 = currentInitiatives.filter((i: Initiative) => Number(i.priority) === 1).length
        const p2 = currentInitiatives.filter((i: Initiative) => Number(i.priority) === 2).length
        const p3 = currentInitiatives.filter((i: Initiative) => Number(i.priority) === 3).length
        const totalMoney = currentInitiatives.reduce((acc: number, curr: Initiative) => acc + (curr.moneyImpact || 0), 0)

        return { total, p1, p2, p3, totalMoney }
    }, [currentInitiatives])
    const currentCotizaciones = useMemo(() => {
        if (selectedSnapshotPred2 === 'active') return cotizaciones
        const snap = cotizacionesSnapshots.find(s => s.date === selectedSnapshotPred2)
        return snap ? snap.items : []
    }, [cotizaciones, cotizacionesSnapshots, selectedSnapshotPred2])

    const getTargetQuotations = (toDateStr: string) => {
        const startDate = new Date('2026-02-12T00:00:00')
        const endDate = new Date(toDateStr + 'T00:00:00')
        if (endDate < startDate) return 0
        const diffTime = endDate.getTime() - startDate.getTime()
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))
        return Math.floor(diffDays / 7) + 1
    }

    const cotizacionesStats = useMemo(() => {
        const selectedDate = selectedSnapshotPred2 === 'active' ? reviewDatePred2 : selectedSnapshotPred2
        const target = getTargetQuotations(selectedDate)
        // Count cotizaciones whose date is less than or equal to selectedDate
        const realCount = currentCotizaciones.filter((c: Cotizacion) => c.fecha <= selectedDate).length
        const status = realCount >= target ? 'Cumpliendo' : 'No cumpliendo'
        return { target, real: realCount, status }
    }, [currentCotizaciones, selectedSnapshotPred2, reviewDatePred2])

    const currentCompromisos = useMemo(() => {
        if (selectedSnapshotCompromisos === 'active') return compromisos
        const snap = compromisosSnapshots.find(s => s.date === selectedSnapshotCompromisos)
        return snap ? snap.items : []
    }, [compromisos, compromisosSnapshots, selectedSnapshotCompromisos])

    // Filters & Sorting for Predictiva 1
    const [sortConfig, setSortConfig] = useState<{ key: string, direction: 'asc' | 'desc' } | null>(null)
    const [filters, setFilters] = useState<Record<string, string>>({})

    // Filters & Sorting for Predictiva 2
    const [cotSortConfig, setCotSortConfig] = useState<{ key: string, direction: 'asc' | 'desc' } | null>(null)
    const [cotFilters, setCotFilters] = useState<Record<string, string>>({})

    const handleUpdate = (id: number, field: string, value: any) => {
        setInitiatives(prev => prev.map(item => {
            if (item.id !== id) return item;
            const updated = { ...item, [field]: value };
            if (field === 'state' && value === 'cerrada ganada' && !updated.endDate) {
                updated.endDate = new Date().toISOString().split('T')[0];
            }
            return updated;
        }))
    }

    const handleAddInitiative = () => {
        const today = new Date().toISOString().split('T')[0]
        const newId = initiatives.length > 0 ? Math.max(...initiatives.map(i => i.id)) + 1 : 1
        const newItem = {
            id: newId,
            priority: 1,
            name: 'Nueva Iniciativa',
            state: 'Sin iniciar',
            dimension: dimensiones[0],
            objective: objetivos[0],
            startDate: today,
            endDate: '',
            moneyImpact: 0
        }
        setInitiatives(prev => [newItem, ...prev])
    }

    const handleDeleteInitiative = (id: number) => {
        if (confirm('¿Estás seguro de eliminar esta iniciativa?')) {
            setInitiatives(prev => prev.filter(i => i.id !== id))
        }
    }

    const handleUpdateCotizacion = (id: number, field: string, value: string) => {
        setCotizaciones(prev => prev.map(item => {
            if (item.id !== id) return item;
            return { ...item, [field]: value };
        }))
    }

    const handleAddCotizacion = () => {
        const defaultDate = reviewDatePred2 || new Date().toISOString().split('T')[0]
        const newId = cotizaciones.length > 0 ? Math.max(...cotizaciones.map(c => c.id)) + 1 : 1
        const newItem = {
            id: newId,
            fecha: defaultDate,
            responsable: 'Nalle',
            tipo: 'Outbound',
            descripcion: 'Nueva cotización'
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
        let result = [...currentInitiatives];
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
    }, [currentInitiatives, sortConfig, filters]);

    const totalMoneyImpact = useMemo(() => {
        return filteredAndSortedData.reduce((acc: number, curr: Initiative) => acc + (curr.moneyImpact || 0), 0)
    }, [filteredAndSortedData])

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
        let result = [...currentCotizaciones];
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
    }, [currentCotizaciones, cotSortConfig, cotFilters]);

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

                {/* Initiatives Calculator / Summary Panel */}
                {activeTab === 'pred1' && (
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
                        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm flex flex-col justify-center">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Iniciativas</span>
                            <span className="text-2xl font-black text-[#254153] mt-1">{initiativeStats.total}</span>
                        </div>
                        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm flex flex-col justify-center border-l-4 border-l-rose-500">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Prioridad 1</span>
                            <span className="text-2xl font-black text-rose-600 mt-1">{initiativeStats.p1}</span>
                        </div>
                        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm flex flex-col justify-center border-l-4 border-l-amber-500">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Prioridad 2</span>
                            <span className="text-2xl font-black text-amber-600 mt-1">{initiativeStats.p2}</span>
                        </div>
                        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm flex flex-col justify-center border-l-4 border-l-emerald-500">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Prioridad 3</span>
                            <span className="text-2xl font-black text-emerald-600 mt-1">{initiativeStats.p3}</span>
                        </div>
                        <div className="bg-[#254153] rounded-xl p-4 border border-[#1c3240] shadow-sm flex flex-col justify-center text-white col-span-2 md:col-span-1">
                            <span className="text-[10px] font-bold text-slate-300 uppercase tracking-wider">Impacto Total ($)</span>
                            <span className="text-lg font-black text-emerald-400 mt-1 truncate">
                                {new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(initiativeStats.totalMoney)}
                            </span>
                        </div>
                    </div>
                )}

                {/* Cotizaciones Calculator / Summary Panel */}
                {activeTab === 'pred2' && (
                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-6">
                        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm flex flex-col justify-center">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Fecha de Corte</span>
                            <span className="text-lg font-black text-[#254153] mt-1">
                                {selectedSnapshotPred2 === 'active' ? reviewDatePred2 : selectedSnapshotPred2}
                            </span>
                        </div>
                        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm flex flex-col justify-center border-l-4 border-l-[#254153]">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Meta Acumulada</span>
                            <span className="text-2xl font-black text-[#254153] mt-1">{cotizacionesStats.target}</span>
                        </div>
                        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm flex flex-col justify-center border-l-4 border-l-indigo-500">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Real Acumulado</span>
                            <span className="text-2xl font-black text-indigo-600 mt-1">{cotizacionesStats.real}</span>
                        </div>
                        <div className={`rounded-xl p-4 border shadow-sm flex flex-col justify-center text-white ${
                            cotizacionesStats.status === 'Cumpliendo' 
                                ? 'bg-emerald-600 border-emerald-700' 
                                : 'bg-rose-600 border-rose-700'
                        }`}>
                            <span className="text-[10px] font-bold text-white/80 uppercase tracking-wider">Estado de Medida</span>
                            <span className="text-xl font-black mt-1 flex items-center gap-1.5">
                                {cotizacionesStats.status === 'Cumpliendo' ? (
                                    <>
                                        <CheckCircle2 className="w-5 h-5" /> Cumpliendo
                                    </>
                                ) : (
                                    <>
                                        <AlertCircle className="w-5 h-5" /> No Cumpliendo
                                    </>
                                )}
                            </span>
                        </div>
                    </div>
                )}

                {/* Tab Content */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden min-h-[400px]">
                    {/* PREDICTIVA 1 (DESARROLLO DE INICIATIVAS) */}
                    {activeTab === 'pred1' && (
                        <div>
                            <div className="bg-slate-50 p-6 border-b border-slate-200 flex flex-col md:flex-row gap-4 items-center justify-between">
                                <div>
                                    <h3 className="text-xl font-bold text-[#254153]">Desarrollo de iniciativas</h3>
                                    <p className="text-sm text-slate-500">Gestión y seguimiento de estado</p>
                                </div>
                                <div className="flex flex-col sm:flex-row items-center gap-4 w-full md:w-auto">
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs font-bold text-slate-600">Revisión Semanal:</span>
                                        <select
                                            value={selectedSnapshotPred1}
                                            onChange={(e) => setSelectedSnapshotPred1(e.target.value)}
                                            className="text-xs font-bold uppercase tracking-wider px-3 py-2 rounded-lg border border-slate-200 bg-white cursor-pointer outline-none focus:ring-1 focus:ring-[#254153]"
                                        >
                                            <option value="active">Edición Activa</option>
                                            {initiativesSnapshots.map(snap => (
                                                <option key={snap.date} value={snap.date}>Revisión - {snap.date}</option>
                                            ))}
                                        </select>
                                        {selectedSnapshotPred1 !== 'active' && (
                                            <button
                                                onClick={() => handleDeleteSnapshotPred1(selectedSnapshotPred1)}
                                                className="text-xs text-rose-500 hover:text-rose-700 font-bold ml-1 cursor-pointer"
                                                title="Eliminar esta foto histórica"
                                            >
                                                Eliminar
                                            </button>
                                        )}
                                    </div>
                                    
                                    {selectedSnapshotPred1 === 'active' ? (
                                        <div className="flex items-center gap-2">
                                            <input
                                                type="date"
                                                value={reviewDatePred1}
                                                onChange={(e) => setReviewDatePred1(e.target.value)}
                                                className="text-xs font-medium px-2 py-1.5 rounded border border-slate-200 bg-white outline-none focus:border-[#254153]"
                                            />
                                            <button
                                                onClick={handleSaveSnapshotPred1}
                                                className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer"
                                            >
                                                Guardar Foto
                                            </button>
                                            <button
                                                onClick={handleAddInitiative}
                                                className="bg-[#254153] hover:bg-[#1a2f3d] text-white px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center gap-1 shadow-sm"
                                            >
                                                <Plus className="w-3.5 h-3.5" /> Agregar Iniciativa
                                            </button>
                                        </div>
                                    ) : (
                                        <button
                                            onClick={() => setSelectedSnapshotPred1('active')}
                                            className="bg-[#254153] hover:bg-[#1a2f3d] text-white px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer"
                                        >
                                            Volver a Edición
                                        </button>
                                    )}
                                    
                                    <div className="text-xs text-slate-500 bg-white px-3 py-1.5 rounded-lg border border-slate-200 shadow-sm font-medium">
                                        Mostrando {filteredAndSortedData.length} registros
                                    </div>
                                </div>
                            </div>

                            {selectedSnapshotPred1 !== 'active' && (
                                <div className="bg-amber-50 border-b border-amber-100 px-6 py-3 flex items-center justify-between text-amber-800 text-xs font-semibold">
                                    <span className="flex items-center gap-2">
                                        <AlertCircle className="w-4 h-4 text-amber-600" />
                                        Modo Histórico: Estás viendo la foto del {selectedSnapshotPred1}. Los campos están bloqueados.
                                    </span>
                                    <button 
                                        onClick={() => setSelectedSnapshotPred1('active')}
                                        className="text-indigo-600 hover:underline cursor-pointer"
                                    >
                                        Ir al flujo activo
                                    </button>
                                </div>
                            )}

                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse whitespace-nowrap">
                                    <thead>
                                        <tr className="bg-white border-b border-slate-100">
                                            {/* Nueva columna de Impacto en dinero */}
                                            <th className="px-3 py-4 align-top w-40">
                                                <div className="flex flex-col gap-2">
                                                    <div className="text-[10px] font-black text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded border border-emerald-100 text-center truncate" title="Total Impacto">
                                                        {new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(totalMoneyImpact)}
                                                    </div>
                                                    <button 
                                                        onClick={() => handleSort('moneyImpact')} 
                                                        className="flex items-center gap-1 font-bold text-slate-500 hover:text-slate-800 transition-colors uppercase text-xs tracking-wider text-left"
                                                    >
                                                        Impacto ($)
                                                        <ArrowUpDown className="w-3 h-3 opacity-50" />
                                                    </button>
                                                    <input 
                                                        type="text" 
                                                        placeholder="Filtrar..." 
                                                        value={filters['moneyImpact'] || ''}
                                                        onChange={(e) => handleFilterChange('moneyImpact', e.target.value)}
                                                        className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#254153]/10 bg-slate-50 focus:bg-white transition-all"
                                                    />
                                                </div>
                                            </th>
                                            <Th label="Prioridad" sortKey="priority" width="w-24" />
                                            <Th label="Iniciativa" sortKey="name" width="min-w-[200px]" />
                                            <Th label="Dimensión" sortKey="dimension" />
                                            <Th label="Objetivo" sortKey="objective" />
                                            <Th label="Fecha Inicio" sortKey="startDate" />
                                            <Th label="Fecha Fin" sortKey="endDate" />
                                            <Th label="Duración (días)" sortKey="duration" />
                                            <Th label="Estado" sortKey="state" width="w-48" />
                                            <th className="px-3 py-4 w-12 text-center text-xs font-bold text-slate-400 uppercase tracking-wider">Acciones</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {filteredAndSortedData.map((item) => (
                                            <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                                                {/* Celda editable para Impacto en dinero */}
                                                <td className="px-3 py-4 align-middle w-40">
                                                    <input 
                                                        type="number" 
                                                        placeholder="0"
                                                        value={item.moneyImpact || ''} 
                                                        onChange={(e) => handleUpdate(item.id, 'moneyImpact', e.target.value === '' ? 0 : Number(e.target.value))}
                                                        disabled={selectedSnapshotPred1 !== 'active'}
                                                        className="w-full text-xs font-semibold px-2.5 py-1.5 rounded border border-slate-200 bg-white text-right disabled:bg-slate-50 focus:outline-none focus:border-[#254153] disabled:text-slate-500"
                                                    />
                                                </td>
                                                <td className="px-3 py-4 text-center align-middle">
                                                    <select
                                                        value={item.priority}
                                                        onChange={(e) => handleUpdate(item.id, 'priority', Number(e.target.value))}
                                                        disabled={selectedSnapshotPred1 !== 'active'}
                                                        className={`inline-flex items-center justify-center w-12 h-8 rounded text-sm font-bold border focus:outline-none focus:ring-1 focus:ring-[#254153] disabled:opacity-80 disabled:cursor-not-allowed ${getPriorityColor(Number(item.priority))}`}
                                                    >
                                                        <option value="1">1</option>
                                                        <option value="2">2</option>
                                                        <option value="3">3</option>
                                                    </select>
                                                </td>
                                                <td className="px-3 py-4 align-middle">
                                                    <textarea
                                                        value={item.name}
                                                        onChange={(e) => handleUpdate(item.id, 'name', e.target.value)}
                                                        disabled={selectedSnapshotPred1 !== 'active'}
                                                        title={item.name}
                                                        rows={2}
                                                        className="w-full font-semibold text-slate-700 bg-transparent hover:bg-slate-100/50 focus:bg-white border border-transparent focus:border-slate-200 px-2 py-1 outline-none rounded transition-all min-w-[200px] resize-none text-xs leading-normal disabled:bg-transparent disabled:text-slate-500"
                                                    />
                                                </td>
                                                <td className="px-3 py-4 align-middle">
                                                    <select 
                                                        value={item.dimension} 
                                                        onChange={(e) => handleUpdate(item.id, 'dimension', e.target.value)}
                                                        disabled={selectedSnapshotPred1 !== 'active'}
                                                        title={item.dimension}
                                                        className="w-full text-xs font-medium px-2 py-1.5 rounded border border-slate-200 bg-white disabled:bg-slate-50 disabled:text-slate-500"
                                                    >
                                                        {dimensiones.map(d => <option key={d} value={d}>{d}</option>)}
                                                    </select>
                                                </td>
                                                <td className="px-3 py-4 align-middle">
                                                    <select 
                                                        value={item.objective} 
                                                        onChange={(e) => handleUpdate(item.id, 'objective', e.target.value)}
                                                        disabled={selectedSnapshotPred1 !== 'active'}
                                                        title={item.objective}
                                                        className="w-full text-xs font-medium px-2 py-1.5 rounded border border-slate-200 bg-white min-w-[180px] whitespace-normal disabled:bg-slate-50 disabled:text-slate-500"
                                                    >
                                                        {objetivos.map(o => <option key={o} value={o}>{o}</option>)}
                                                    </select>
                                                </td>
                                                <td className="px-3 py-4 align-middle">
                                                    <input 
                                                        type="date" 
                                                        value={item.startDate} 
                                                        onChange={(e) => handleUpdate(item.id, 'startDate', e.target.value)}
                                                        disabled={selectedSnapshotPred1 !== 'active'}
                                                        className="w-full text-xs font-medium px-2 py-1.5 rounded border border-slate-200 bg-white disabled:bg-slate-50 disabled:text-slate-500"
                                                    />
                                                </td>
                                                <td className="px-3 py-4 align-middle">
                                                    <input 
                                                        type="date" 
                                                        value={item.endDate} 
                                                        onChange={(e) => handleUpdate(item.id, 'endDate', e.target.value)}
                                                        className={`w-full text-xs font-medium px-2 py-1.5 rounded border ${item.state !== 'cerrada ganada' || selectedSnapshotPred1 !== 'active' ? 'bg-slate-100 text-slate-400 border-transparent' : 'bg-white border-slate-200'}`}
                                                        disabled={item.state !== 'cerrada ganada' || selectedSnapshotPred1 !== 'active'}
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
                                                        disabled={selectedSnapshotPred1 !== 'active'}
                                                        className={`w-full appearance-none outline-none text-xs font-bold uppercase tracking-wider px-3 py-2 rounded-lg cursor-pointer transition-colors border-2 border-transparent hover:border-slate-200 focus:border-[#254153] disabled:cursor-not-allowed ${getStateColor(item.state)}`}
                                                    >
                                                        {states.map(s => (
                                                            <option key={s} value={s}>{s}</option>
                                                        ))}
                                                    </select>
                                                </td>
                                                <td className="px-3 py-4 text-center align-middle">
                                                    <button
                                                        onClick={() => handleDeleteInitiative(item.id)}
                                                        disabled={selectedSnapshotPred1 !== 'active'}
                                                        className="p-1.5 text-rose-500 hover:bg-rose-50 rounded transition-colors cursor-pointer disabled:opacity-40 disabled:hover:bg-transparent disabled:cursor-not-allowed"
                                                        title="Eliminar iniciativa"
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

                    {/* PREDICTIVA 2 (COTIZACIONES) */}
                    {activeTab === 'pred2' && (
                        <div>
                            <div className="bg-slate-50 p-6 border-b border-slate-200 flex flex-col md:flex-row gap-4 items-center justify-between">
                                <div>
                                    <h3 className="text-xl font-bold text-[#254153]">Cotizaciones de proveedores</h3>
                                    <p className="text-sm text-slate-500">Gestión de cotizaciones y negociaciones predictivas</p>
                                </div>
                                <div className="flex flex-col sm:flex-row items-center gap-4 w-full md:w-auto">
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs font-bold text-slate-600">Revisión Semanal:</span>
                                        <select
                                            value={selectedSnapshotPred2}
                                            onChange={(e) => setSelectedSnapshotPred2(e.target.value)}
                                            className="text-xs font-bold uppercase tracking-wider px-3 py-2 rounded-lg border border-slate-200 bg-white cursor-pointer outline-none focus:ring-1 focus:ring-[#254153]"
                                        >
                                            <option value="active">Edición Activa</option>
                                            {cotizacionesSnapshots.map(snap => (
                                                <option key={snap.date} value={snap.date}>Revisión - {snap.date}</option>
                                            ))}
                                        </select>
                                        {selectedSnapshotPred2 !== 'active' && (
                                            <button
                                                onClick={() => handleDeleteSnapshotPred2(selectedSnapshotPred2)}
                                                className="text-xs text-rose-500 hover:text-rose-700 font-bold ml-1 cursor-pointer"
                                                title="Eliminar esta foto histórica"
                                            >
                                                Eliminar
                                            </button>
                                        )}
                                    </div>
                                    
                                    {selectedSnapshotPred2 === 'active' ? (
                                        <div className="flex items-center gap-2">
                                            <input
                                                type="date"
                                                value={reviewDatePred2}
                                                onChange={(e) => setReviewDatePred2(e.target.value)}
                                                className="text-xs font-medium px-2 py-1.5 rounded border border-slate-200 bg-white outline-none focus:border-[#254153]"
                                            />
                                            <button
                                                onClick={handleSaveSnapshotPred2}
                                                className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer"
                                            >
                                                Guardar Foto
                                            </button>
                                            <button
                                                onClick={handleAddCotizacion}
                                                className="bg-[#254153] hover:bg-[#1a2f3d] text-white px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center gap-1 shadow-sm"
                                            >
                                                <Plus className="w-3.5 h-3.5" /> Agregar Cotización
                                            </button>
                                        </div>
                                    ) : (
                                        <button
                                            onClick={() => setSelectedSnapshotPred2('active')}
                                            className="bg-[#254153] hover:bg-[#1a2f3d] text-white px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer"
                                        >
                                            Volver a Edición
                                        </button>
                                    )}
                                    
                                    <div className="text-xs text-slate-500 bg-white px-3 py-1.5 rounded-lg border border-slate-200 shadow-sm font-medium">
                                        Mostrando {filteredAndSortedCotizaciones.length} registros
                                    </div>
                                </div>
                            </div>

                            {selectedSnapshotPred2 !== 'active' && (
                                <div className="bg-amber-50 border-b border-amber-100 px-6 py-3 flex items-center justify-between text-amber-800 text-xs font-semibold">
                                    <span className="flex items-center gap-2">
                                        <AlertCircle className="w-4 h-4 text-amber-600" />
                                        Modo Histórico: Estás viendo la foto del {selectedSnapshotPred2}. Los campos están bloqueados.
                                    </span>
                                    <button 
                                        onClick={() => setSelectedSnapshotPred2('active')}
                                        className="text-indigo-600 hover:underline cursor-pointer"
                                    >
                                        Ir al flujo activo
                                    </button>
                                </div>
                            )}

                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse whitespace-nowrap">
                                    <thead>
                                        <tr className="bg-white border-b border-slate-100">
                                            <CotTh label="Fecha" sortKey="fecha" width="w-40" />
                                            <CotTh label="Responsable" sortKey="responsable" width="w-48" />
                                            <CotTh label="Tipo/Origen" sortKey="tipo" width="w-48" />
                                            <CotTh label="Descripción" sortKey="descripcion" width="min-w-[300px]" />
                                            <th className="px-3 py-4 w-12 text-center text-xs font-bold text-slate-400 uppercase tracking-wider">Acciones</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {filteredAndSortedCotizaciones.map((item: Cotizacion) => (
                                            <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                                                <td className="px-3 py-4 align-middle w-40">
                                                    <input 
                                                        type="date" 
                                                        value={item.fecha} 
                                                        onChange={(e) => handleUpdateCotizacion(item.id, 'fecha', e.target.value)}
                                                        disabled={selectedSnapshotPred2 !== 'active'}
                                                        className="w-full text-xs font-medium px-2 py-1.5 rounded border border-slate-200 bg-white disabled:bg-slate-50 disabled:text-slate-500 focus:outline-none focus:border-[#254153]"
                                                    />
                                                </td>
                                                <td className="px-3 py-4 align-middle w-48">
                                                    <select 
                                                        value={item.responsable} 
                                                        onChange={(e) => handleUpdateCotizacion(item.id, 'responsable', e.target.value)}
                                                        disabled={selectedSnapshotPred2 !== 'active'}
                                                        title={item.responsable}
                                                        className="w-full text-xs font-medium px-2 py-1.5 rounded border border-slate-200 bg-white disabled:bg-slate-50 disabled:text-slate-500 focus:outline-none focus:border-[#254153]"
                                                    >
                                                        <option value="Nalle">Nalle</option>
                                                        <option value="Alejo">Alejo</option>
                                                        <option value="Isabel">Isabel</option>
                                                        <option value="Cata">Cata</option>
                                                    </select>
                                                </td>
                                                <td className="px-3 py-4 align-middle w-48">
                                                    <select 
                                                        value={item.tipo} 
                                                        onChange={(e) => handleUpdateCotizacion(item.id, 'tipo', e.target.value)}
                                                        disabled={selectedSnapshotPred2 !== 'active'}
                                                        title={item.tipo}
                                                        className="w-full text-xs font-medium px-2 py-1.5 rounded border border-slate-200 bg-white disabled:bg-slate-50 disabled:text-slate-500 focus:outline-none focus:border-[#254153]"
                                                    >
                                                        <option value="Outbound">Outbound</option>
                                                        <option value="Iniciativa propia">Iniciativa propia</option>
                                                    </select>
                                                </td>
                                                <td className="px-3 py-4 align-middle">
                                                    <textarea
                                                        value={item.descripcion}
                                                        onChange={(e) => handleUpdateCotizacion(item.id, 'descripcion', e.target.value)}
                                                        disabled={selectedSnapshotPred2 !== 'active'}
                                                        title={item.descripcion}
                                                        rows={2}
                                                        className="w-full font-semibold text-slate-700 bg-transparent hover:bg-slate-100/50 focus:bg-white border border-transparent focus:border-slate-200 px-2 py-1 outline-none rounded transition-all min-w-[300px] resize-none text-xs leading-normal disabled:bg-transparent disabled:text-slate-500"
                                                    />
                                                </td>
                                                <td className="px-3 py-4 text-center align-middle">
                                                    <button
                                                        onClick={() => handleDeleteCotizacion(item.id)}
                                                        disabled={selectedSnapshotPred2 !== 'active'}
                                                        className="p-1.5 text-rose-500 hover:bg-rose-50 rounded transition-colors cursor-pointer disabled:opacity-40 disabled:hover:bg-transparent disabled:cursor-not-allowed"
                                                        title="Eliminar cotización"
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
                            <div className="bg-slate-50 p-6 border-b border-slate-200 flex flex-col md:flex-row gap-4 items-center justify-between">
                                <div>
                                    <h3 className="text-xl font-bold text-[#254153]">Compromisos Semanales</h3>
                                    <p className="text-sm text-slate-500">Planificación de acciones clave para esta semana</p>
                                </div>
                                <div className="flex flex-col sm:flex-row items-center gap-4 w-full md:w-auto">
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs font-bold text-slate-600">Revisión Semanal:</span>
                                        <select
                                            value={selectedSnapshotCompromisos}
                                            onChange={(e) => setSelectedSnapshotCompromisos(e.target.value)}
                                            className="text-xs font-bold uppercase tracking-wider px-3 py-2 rounded-lg border border-slate-200 bg-white cursor-pointer outline-none focus:ring-1 focus:ring-[#254153]"
                                        >
                                            <option value="active">Edición Activa</option>
                                            {compromisosSnapshots.map(snap => (
                                                <option key={snap.date} value={snap.date}>Revisión - {snap.date}</option>
                                            ))}
                                        </select>
                                        {selectedSnapshotCompromisos !== 'active' && (
                                            <button
                                                onClick={() => handleDeleteSnapshotCompromisos(selectedSnapshotCompromisos)}
                                                className="text-xs text-rose-500 hover:text-rose-700 font-bold ml-1 cursor-pointer"
                                                title="Eliminar esta foto histórica"
                                            >
                                                Eliminar
                                            </button>
                                        )}
                                    </div>
                                    
                                    {selectedSnapshotCompromisos === 'active' ? (
                                        <div className="flex items-center gap-2">
                                            <input
                                                type="date"
                                                value={reviewDateCompromisos}
                                                onChange={(e) => setReviewDateCompromisos(e.target.value)}
                                                className="text-xs font-medium px-2 py-1.5 rounded border border-slate-200 bg-white outline-none focus:border-[#254153]"
                                            />
                                            <button
                                                onClick={handleSaveSnapshotCompromisos}
                                                className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer"
                                            >
                                                Guardar Foto
                                            </button>
                                        </div>
                                    ) : (
                                        <button
                                            onClick={() => setSelectedSnapshotCompromisos('active')}
                                            className="bg-[#254153] hover:bg-[#1a2f3d] text-white px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer"
                                        >
                                            Volver a Edición
                                        </button>
                                    )}

                                    <div className="text-xs text-slate-500 bg-white px-3 py-1.5 rounded-lg border border-slate-200 shadow-sm font-medium">
                                        Total: {currentCompromisos.length} compromisos
                                    </div>
                                    {selectedSnapshotCompromisos === 'active' && (
                                        <button
                                            onClick={handleAddCompromiso}
                                            className="bg-[#254153] hover:bg-[#1a2f3d] text-white px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 shadow-sm cursor-pointer"
                                        >
                                            <Plus className="w-3.5 h-3.5" /> Agregar Compromiso
                                        </button>
                                    )}
                                </div>
                            </div>

                            {selectedSnapshotCompromisos !== 'active' && (
                                <div className="bg-amber-50 border-b border-amber-100 px-6 py-3 flex items-center justify-between text-amber-800 text-xs font-semibold">
                                    <span className="flex items-center gap-2">
                                        <AlertCircle className="w-4 h-4 text-amber-600" />
                                        Modo Histórico: Estás viendo la foto del {selectedSnapshotCompromisos}. Los campos están bloqueados.
                                    </span>
                                    <button 
                                        onClick={() => setSelectedSnapshotCompromisos('active')}
                                        className="text-indigo-600 hover:underline cursor-pointer"
                                    >
                                        Ir al flujo activo
                                    </button>
                                </div>
                            )}

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
                                        {currentCompromisos.map((item: Compromiso) => (
                                            <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                                                <td className="px-6 py-4 text-center align-middle">
                                                    <select
                                                        value={item.estado}
                                                        onChange={(e) => handleUpdateCompromiso(item.id, 'estado', e.target.value)}
                                                        disabled={selectedSnapshotCompromisos !== 'active'}
                                                        className={`text-xs font-bold uppercase tracking-wider px-2.5 py-1.5 rounded-lg cursor-pointer outline-none border border-transparent transition-all disabled:cursor-not-allowed ${
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
                                                        disabled={selectedSnapshotCompromisos !== 'active'}
                                                        className="w-full font-medium text-slate-700 bg-transparent hover:bg-slate-100/50 focus:bg-white border border-transparent focus:border-slate-200 px-3 py-2 outline-none rounded transition-all min-w-[300px] disabled:bg-transparent"
                                                    />
                                                </td>
                                                <td className="px-6 py-4 align-middle">
                                                    <select
                                                        value={item.responsable}
                                                        onChange={(e) => handleUpdateCompromiso(item.id, 'responsable', e.target.value)}
                                                        disabled={selectedSnapshotCompromisos !== 'active'}
                                                        className="w-full text-sm font-semibold text-slate-700 px-3 py-2 rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-1 focus:ring-[#254153] disabled:bg-slate-50 disabled:text-slate-500"
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
                                                        disabled={selectedSnapshotCompromisos !== 'active'}
                                                        className="w-full text-sm font-medium text-slate-700 px-3 py-2 rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-1 focus:ring-[#254153] disabled:bg-slate-50 disabled:text-slate-500"
                                                    />
                                                </td>
                                                <td className="px-6 py-4 text-center align-middle">
                                                    <button
                                                        onClick={() => handleDeleteCompromiso(item.id)}
                                                        disabled={selectedSnapshotCompromisos !== 'active'}
                                                        className="p-1.5 text-rose-500 hover:bg-rose-50 rounded transition-colors cursor-pointer disabled:opacity-40 disabled:hover:bg-transparent disabled:cursor-not-allowed"
                                                        title="Eliminar compromiso"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                        {currentCompromisos.length === 0 && (
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
