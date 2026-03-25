'use client'

import { useState } from 'react'
import {
    X,
    Percent,
    ShieldCheck,
    TrendingDown,
    Zap,
    AlertCircle,
    DollarSign
} from 'lucide-react'

interface BulkNegotiatorModalProps {
    isOpen: boolean
    onClose: () => void
    onApply: (settings: { percentage: number, type: 'Ahorro' | 'Avoidance', targetPrice?: number }) => void
}

export default function BulkNegotiatorModal({ isOpen, onClose, onApply }: BulkNegotiatorModalProps) {
    const [percentage, setPercentage] = useState<string>('0')
    const [savingsType, setSavingsType] = useState<'Ahorro' | 'Avoidance'>('Ahorro')
    const [basePrice, setBasePrice] = useState<string>('')
    const [negotiatedPrice, setNegotiatedPrice] = useState<string>('')

    const handleBasePriceChange = (val: string) => {
        setBasePrice(val)
        const bp = parseFloat(val)
        const perc = parseFloat(percentage)
        if (!isNaN(bp) && bp > 0 && !isNaN(perc)) {
            const calculated = bp - (bp * (perc / 100))
            setNegotiatedPrice(calculated.toString())
        } else {
            setNegotiatedPrice('')
        }
    }

    const handlePercentageChange = (val: string) => {
        setPercentage(val)
        const perc = parseFloat(val)
        const bp = parseFloat(basePrice)
        if (!isNaN(bp) && bp > 0 && !isNaN(perc)) {
            const calculated = bp - (bp * (perc / 100))
            setNegotiatedPrice(calculated.toString())
        }
    }

    const handleNegotiatedPriceChange = (val: string) => {
        setNegotiatedPrice(val)
        const np = parseFloat(val)
        const bp = parseFloat(basePrice)
        if (!isNaN(np) && !isNaN(bp) && bp > 0) {
            const calculatedPerc = ((bp - np) / bp) * 100
            setPercentage(calculatedPerc.toFixed(2))
        }
    }

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
                    <p className="text-blue-100 text-sm">Aplica reglas simultaneamente a todos los productos.</p>
                </div>

                <div className="p-6 space-y-6">
                    {/* Pricing Inputs */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-4">
                            <div className="flex-1">
                                <label className="text-sm font-semibold text-slate-700 block mb-1">Precio Base</label>
                                <div className="relative">
                                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                    <input
                                        type="number"
                                        value={basePrice}
                                        onChange={(e) => handleBasePriceChange(e.target.value)}
                                        className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#254153]/10 focus:border-[#254153] outline-none transition-all font-bold text-slate-800"
                                        placeholder="Automático (por item)"
                                    />
                                </div>
                            </div>
                            <div className="flex-1">
                                <label className="text-sm font-semibold text-slate-700 block mb-1">Precio Negociado</label>
                                <div className="relative">
                                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                    <input
                                        type="number"
                                        value={negotiatedPrice}
                                        onChange={(e) => handleNegotiatedPriceChange(e.target.value)}
                                        className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#254153]/10 focus:border-[#254153] outline-none transition-all font-bold text-emerald-600"
                                        placeholder="Calculado"
                                    />
                                </div>
                            </div>
                        </div>

                        <div>
                            <label className="text-sm font-semibold text-slate-700 flex items-center gap-2 mb-2">
                                <Percent className="w-4 h-4 text-[#254153]" />
                                Porcentaje de Ahorro
                            </label>
                            <div className="relative">
                                <input
                                    type="number"
                                    value={percentage}
                                    onChange={(e) => handlePercentageChange(e.target.value)}
                                    className="w-full pl-4 pr-12 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#254153]/10 focus:border-[#254153] outline-none transition-all font-bold text-lg text-[#254153]"
                                    placeholder="0.0"
                                />
                                <span className="absolute right-4 top-1/2 -translate-y-1/2 font-bold text-slate-400">%</span>
                            </div>
                            <p className="text-[10px] text-slate-400 mt-2 uppercase font-bold tracking-wider">Si no se especifica Precio Base, el % se aplica al precio actual de cada ítem.</p>
                        </div>
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
                            onClick={() => onApply({ percentage: parseFloat(percentage) || 0, type: savingsType, targetPrice: basePrice ? parseFloat(basePrice) : undefined })}
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
