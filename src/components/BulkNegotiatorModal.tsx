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
    products: any[]
    onApply: (settings: { percentage: number, type: 'Ahorro' | 'Avoidance', skuConsumptions: Record<string, number>, months?: number }) => void
}

export default function BulkNegotiatorModal({ isOpen, onClose, products, onApply }: BulkNegotiatorModalProps) {
    const [savingsType, setSavingsType] = useState<'Ahorro' | 'Avoidance'>('Ahorro')
    const [basePercent, setBasePercent] = useState<string>('')
    const [negotiatedPercent, setNegotiatedPercent] = useState<string>('')
    const [consumption, setConsumption] = useState<string>('')
    const [skuConsumptions, setSkuConsumptions] = useState<Record<string, string>>({})
    const [months, setMonths] = useState<string>('')

    const calculatedPercentage = parseFloat(((parseFloat(basePercent) || 0) - (parseFloat(negotiatedPercent) || 0)).toFixed(2))

    const handleMasterConsumptionChange = (val: string) => {
        setConsumption(val)
        const newConsumptions: Record<string, string> = {}
        products?.forEach(p => {
            newConsumptions[p.id] = val
        })
        setSkuConsumptions(newConsumptions)
    }

    const handleSkuConsumptionChange = (id: string, val: string) => {
        setSkuConsumptions(prev => ({ ...prev, [id]: val }))
        setConsumption('')
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
                                <label className="text-sm font-semibold text-slate-700 block mb-1">% Base</label>
                                <div className="relative">
                                    <Percent className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                    <input
                                        type="number"
                                        value={basePercent}
                                        onChange={(e) => setBasePercent(e.target.value)}
                                        className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#254153]/10 focus:border-[#254153] outline-none transition-all font-bold text-slate-800"
                                        placeholder="0.0"
                                    />
                                </div>
                            </div>
                            <div className="flex-1">
                                <label className="text-sm font-semibold text-slate-700 block mb-1">% Negociado</label>
                                <div className="relative">
                                    <Percent className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                    <input
                                        type="number"
                                        value={negotiatedPercent}
                                        onChange={(e) => setNegotiatedPercent(e.target.value)}
                                        className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#254153]/10 focus:border-[#254153] outline-none transition-all font-bold text-[#254153]"
                                        placeholder="0.0"
                                    />
                                </div>
                            </div>
                        </div>

                         <div>
                            <label className="text-sm font-semibold text-slate-700 flex items-center gap-2 mb-2">
                                <Percent className="w-4 h-4 text-emerald-600" />
                                Porcentaje de Ahorro
                            </label>
                            <div className="relative">
                                <input
                                    type="number"
                                    value={calculatedPercentage}
                                    readOnly
                                    className="w-full pl-4 pr-12 py-3 bg-emerald-50 border border-emerald-200 rounded-xl outline-none transition-all font-bold text-lg text-emerald-700"
                                    placeholder="0.0"
                                />
                                <span className="absolute right-4 top-1/2 -translate-y-1/2 font-bold text-emerald-500">%</span>
                            </div>
                            <p className="text-[10px] text-slate-400 mt-2 uppercase font-bold tracking-wider">Resultado calculado automáticamente y aplicado al precio actual.</p>
                        </div>

                        {/* Consumption Inputs */}
                        <div className="flex gap-4 pt-2">
                            <div className="flex-1">
                                <label className="text-sm font-semibold text-slate-700 block mb-1">Consumo Mensual Maestro</label>
                                <input
                                    type="number"
                                    value={consumption}
                                    onChange={(e) => handleMasterConsumptionChange(e.target.value)}
                                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#254153]/10 focus:border-[#254153] outline-none transition-all font-medium text-slate-800"
                                    placeholder="Agrega a todos..."
                                />
                            </div>
                            <div className="flex-1">
                                <label className="text-sm font-semibold text-slate-700 block mb-1">Tiempo (Meses)</label>
                                <input
                                    type="number"
                                    value={months}
                                    onChange={(e) => setMonths(e.target.value)}
                                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#254153]/10 focus:border-[#254153] outline-none transition-all font-medium text-slate-800"
                                    placeholder="Opcional"
                                />
                            </div>
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

                    {/* SKU List */}
                    <div className="border border-slate-200 rounded-xl overflow-hidden bg-white">
                        <div className="bg-slate-50 px-4 py-2 border-b border-slate-200">
                            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Detalle del Consumo Mensual por SKU ({products?.length || 0})</h3>
                        </div>
                        <div className="max-h-56 overflow-y-auto divide-y divide-slate-100 p-2">
                            {products?.map(product => (
                                <div key={product.id} className="flex items-center justify-between p-2 hover:bg-slate-50 rounded-lg transition-colors gap-4">
                                    <div className="flex flex-col min-w-0 flex-1">
                                        <div className="flex items-center gap-2">
                                            <span className="text-[10px] font-mono font-medium text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200 shrink-0">
                                                {product.codigo_articulo || 'N/A'}
                                            </span>
                                            <span className="text-xs font-bold text-slate-700 truncate" title={product.descripcion}>{product.descripcion}</span>
                                        </div>
                                    </div>
                                    <div className="w-24 shrink-0 flex flex-col gap-1">
                                        <input
                                            type="number"
                                            value={skuConsumptions[product.id] ?? ''}
                                            onChange={(e) => handleSkuConsumptionChange(product.id, e.target.value)}
                                            className="w-full px-2 py-1.5 bg-white border border-slate-200 rounded-md focus:ring-2 focus:ring-[#254153]/10 focus:border-[#254153] outline-none transition-all text-xs font-medium text-slate-800 text-center"
                                            placeholder={String(product.cantidad_mensual)}
                                        />
                                        <span className="text-[8px] text-slate-400 text-center">Original: {product.cantidad_mensual}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
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
                            onClick={() => {
                                const parsedConsumptions: Record<string, number> = {}
                                products?.forEach(p => {
                                    const val = skuConsumptions[p.id]
                                    if (val && !isNaN(parseFloat(val))) {
                                        parsedConsumptions[p.id] = parseFloat(val)
                                    }
                                })

                                onApply({ 
                                    percentage: calculatedPercentage, 
                                    type: savingsType,
                                    skuConsumptions: parsedConsumptions,
                                    months: months ? parseFloat(months) : undefined 
                                })
                            }}
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
