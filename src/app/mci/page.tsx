'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
    ArrowLeft,
    Home,
    Zap,
    Target,
    Activity,
    CalendarCheck,
    CheckCircle2,
    AlertCircle
} from 'lucide-react'

// Initial Data
const initialInitiatives = [
    { id: 1, priority: 2, name: 'nuevo proveedor deck', state: 'Sin iniciar' },
    { id: 2, priority: 2, name: 'Plywood', state: 'Sin iniciar' },
    { id: 3, priority: 3, name: 'PVC board', state: 'Sin iniciar' },
    { id: 4, priority: 1, name: 'Mabe', state: 'Sin iniciar' },
    { id: 5, priority: 1, name: 'Lamina de Carton corbox, carton col', state: 'Sin iniciar' },
    { id: 6, priority: 1, name: 'Cajas troqueladas carto colombia 60x...', state: 'Sin iniciar' },
    { id: 7, priority: 2, name: 'Pieamigo', state: 'Sin iniciar' },
    { id: 8, priority: 1, name: 'Limpiador Flowchem', state: 'Sin iniciar' },
    { id: 9, priority: 1, name: 'Flete terrestre', state: 'Sin iniciar' },
    { id: 10, priority: 1, name: 'EVA Marae', state: 'Sin iniciar' },
    { id: 11, priority: 1, name: 'PUR Marae', state: 'Sin iniciar' },
    { id: 12, priority: 1, name: 'Masa pulir 3m', state: 'Sin iniciar' },
    { id: 13, priority: 1, name: 'Riel Hafele montaje bajo', state: 'Sin iniciar' },
    { id: 14, priority: 1, name: 'Riel full extension 35 mediano', state: 'Sin iniciar' },
    { id: 15, priority: 1, name: 'Resina FV OCQ', state: 'Sin iniciar' },
    { id: 16, priority: 1, name: 'Resina MS OCQ', state: 'Sin iniciar' },
    { id: 17, priority: 1, name: 'Cromoterapias', state: 'Sin iniciar' },
    { id: 18, priority: 1, name: 'Cajas mueble elevado 48x38', state: 'Sin iniciar' },
    { id: 19, priority: 1, name: 'Zuncho', state: 'Sin iniciar' },
    { id: 20, priority: 1, name: 'Cromoterapia', state: 'Sin iniciar' },
]

const states = [
    'Sin iniciar',
    'standby',
    'en proceso',
    'cerrada ganada',
    'cerrada perdida'
]

export default function MCIPage() {
    const router = useRouter()
    const [activeTab, setActiveTab] = useState<'pred1' | 'pred2' | 'compromisos'>('pred1')
    const [initiatives, setInitiatives] = useState(initialInitiatives)

    const handleStateChange = (id: number, newState: string) => {
        setInitiatives(prev => prev.map(item => 
            item.id === id ? { ...item, state: newState } : item
        ))
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

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                
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
                    {activeTab === 'pred1' && (
                        <div>
                            <div className="bg-slate-50 p-6 border-b border-slate-200 flex items-center justify-between">
                                <div>
                                    <h3 className="text-xl font-bold text-[#254153]">Desarrollo de iniciativas</h3>
                                    <p className="text-sm text-slate-500">Gestión y seguimiento de estado</p>
                                </div>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="bg-white text-slate-400 text-xs uppercase tracking-wider font-bold border-b border-slate-100">
                                            <th className="px-6 py-4 w-24 text-center">Prioridad</th>
                                            <th className="px-6 py-4">Iniciativa</th>
                                            <th className="px-6 py-4 w-48">Estado</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {initiatives.map((item) => (
                                            <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                                                <td className="px-6 py-4 text-center">
                                                    <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold border ${getPriorityColor(item.priority)}`}>
                                                        {item.priority}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className="font-semibold text-slate-700">{item.name}</span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <select
                                                        value={item.state}
                                                        onChange={(e) => handleStateChange(item.id, e.target.value)}
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

                    {activeTab === 'pred2' && (
                        <div className="flex flex-col items-center justify-center h-[400px] text-center p-8">
                            <div className="bg-amber-50 p-4 rounded-full mb-4">
                                <AlertCircle className="w-12 h-12 text-amber-500" />
                            </div>
                            <h3 className="text-2xl font-bold text-[#254153] mb-2">Coming Soon</h3>
                            <p className="text-slate-500 max-w-md">
                                The new quotations module is currently under development. Check back later for updates.
                            </p>
                        </div>
                    )}

                    {activeTab === 'compromisos' && (
                        <div className="flex flex-col items-center justify-center h-[400px] text-center p-8">
                            <div className="bg-blue-50 p-4 rounded-full mb-4">
                                <CalendarCheck className="w-12 h-12 text-blue-500" />
                            </div>
                            <h3 className="text-2xl font-bold text-[#254153] mb-2">Coming Soon</h3>
                            <p className="text-slate-500 max-w-md">
                                The weekly commitments tracking feature will be available shortly.
                            </p>
                        </div>
                    )}
                </div>

            </main>
        </div>
    )
}
