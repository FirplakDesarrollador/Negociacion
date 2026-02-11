'use client'

import { useState } from 'react'
import {
    X,
    Percent,
    ShieldCheck,
    TrendingDown,
    Zap,
    AlertCircle
} from 'lucide-react'

interface BulkNegotiatorModalProps {
    isOpen: boolean
    onClose: () => void
    onApply: (settings: { percentage: number, type: 'Ahorro' | 'Avoidance' }) => void
}

export default function BulkNegotiatorModal({ isOpen, onClose, onApply }: BulkNegotiatorModalProps) {
    const [percentage, setPercentage] = useState<number>(0)
    const [savingsType, setSavingsType] = useState<'Ahorro' | 'Avoidance'>('Ahorro')

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 bg-[#254153]/40 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
                {/* Header */}
                <div className="bg-[#254153] p-6 text-white relative">
                    <button
                        onClick={onClose}
                        className="absolute right-4 top-4 p-2 hover:bg-white/10 rounded-full transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-white/10 rounded-lg">
                            <Zap className="w-6 h-6 text-yellow-400" />
                        </div>
                        <h2 className="text-xl font-bold">Negociador Masivo</h2>
                    </div>
                    <p className="text-blue-100 text-sm">Aplica condiciones a todos los productos del proveedor simultáneamente.</p>
                </div>

                <div className="p-6 space-y-6">
                    {/* Percentage Info */}
                    <div>
                        <label className="text-sm font-semibold text-slate-700 block mb-2 flex items-center gap-2">
                            <Percent className="w-4 h-4 text-[#254153]" />
                            Porcentaje de Ahorro Global
                        </label>
                        <div className="relative">
                            <input
                                type="number"
                                value={percentage}
                                onChange={(e) => setPercentage(parseFloat(e.target.value) || 0)}
                                className="w-full pl-4 pr-12 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#254153]/10 focus:border-[#254153] outline-none transition-all font-bold text-lg text-[#254153]"
                                placeholder="0.0"
                            />
                            <span className="absolute right-4 top-1/2 -translate-y-1/2 font-bold text-slate-400">%</span>
                        </div>
                        <p className="text-[10px] text-slate-400 mt-1 uppercase font-bold tracking-wider">Se aplicará sobre el precio actual de cada producto</p>
                    </div>

                    {/* Savings Type */}
                    <div>
                        <label className="text-sm font-semibold text-slate-700 block mb-3">Tipo de Impacto</label>
                        <div className="grid grid-cols-2 gap-3">
                            <button
                                onClick={() => setSavingsType('Ahorro')}
                                className={`flex items-center justify-center gap-2 p-3 rounded-xl border-2 transition-all font-bold ${savingsType === 'Ahorro'
                                    ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                                    : 'border-slate-100 bg-white text-slate-400 hover:border-slate-200'
                                    }`}
                            >
                                <TrendingDown className="w-4 h-4" />
                                Ahorro
                            </button>
                            <button
                                onClick={() => setSavingsType('Avoidance')}
                                className={`flex items-center justify-center gap-2 p-3 rounded-xl border-2 transition-all font-bold ${savingsType === 'Avoidance'
                                    ? 'border-amber-500 bg-amber-50 text-amber-700'
                                    : 'border-slate-100 bg-white text-slate-400 hover:border-slate-200'
                                    }`}
                            >
                                <ShieldCheck className="w-4 h-4" />
                                Avoidance
                            </button>
                        </div>
                    </div>

                    {/* Warning Box */}
                    <div className="bg-amber-50 border border-amber-100 rounded-xl p-4 flex gap-3">
                        <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
                        <p className="text-xs text-amber-700 leading-relaxed">
                            <span className="font-bold">¡Cuidado!</span> Esta acción reemplazará cualquier negociación individual que hayas realizado previamente en esta sesión para <span className="font-bold text-amber-900">todos</span> los productos de la lista.
                        </p>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3 pt-2">
                        <button
                            onClick={onClose}
                            className="flex-1 px-4 py-3 border-2 border-slate-200 text-slate-600 font-bold rounded-xl hover:bg-slate-50 transition-colors"
                        >
                            Cancelar
                        </button>
                        <button
                            onClick={() => onApply({ percentage, type: savingsType })}
                            className="flex-2 px-6 py-3 bg-[#254153] text-white font-bold rounded-xl hover:bg-[#1a2f3d] transition-all shadow-lg shadow-[#254153]/20"
                        >
                            Aplicar a Todo
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}
