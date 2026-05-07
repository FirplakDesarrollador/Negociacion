'use client'

import { useState, useEffect } from 'react'
import { X, Calculator, DollarSign, Percent, Calendar, Package } from 'lucide-react'

interface Product {
    id: number
    descripcion: string
    precio_actual: number
    cantidad_mensual: number
    precio_negociado: number
    tipo: 'Ahorro' | 'Avoidance'
    // Additional fields that might come in handy
    months?: number
    porcentaje_base?: number
    porcentaje_negociado?: number
}

interface ProductNegotiationModalProps {
    isOpen: boolean
    onClose: () => void
    product: Product | null
    onSave: (updatedProduct: Product) => void
}

export default function ProductNegotiationModal({ isOpen, onClose, product, onSave }: ProductNegotiationModalProps) {
    const [negotiationType, setNegotiationType] = useState<'price' | 'percentage'>('price')
    const [negotiatedPrice, setNegotiatedPrice] = useState<number>(0)
    const [currentPrice, setCurrentPrice] = useState<number>(0)
    const [percentage, setPercentage] = useState<number>(0)
    const [consumption, setConsumption] = useState<number>(0)
    const [months, setMonths] = useState<number>(12) // Default to 1 year?
    const [savingsType, setSavingsType] = useState<'Ahorro' | 'Avoidance'>('Ahorro')
    const [basePercent, setBasePercent] = useState<number>(0)
    const [negPercent, setNegPercent] = useState<number>(0)

    useEffect(() => {
        if (product) {
            setCurrentPrice(product.precio_actual || 0)
            setNegotiatedPrice(product.precio_negociado || product.precio_actual)
            setConsumption(product.cantidad_mensual || 0)
            setSavingsType(product.tipo || 'Ahorro')
            setMonths(product.months || 12)

            // Calculate initial percentage based on current vs negotiated
            if (product.precio_actual > 0) {
                const initialSavings = product.precio_actual - (product.precio_negociado || product.precio_actual)
                const initialPercent = (initialSavings / product.precio_actual) * 100
                setPercentage(initialPercent > 0 ? initialPercent : 0)
            }
            
            setBasePercent(product.porcentaje_base || 0)
            setNegPercent(product.porcentaje_negociado || 0)
        }
    }, [product])

    // Synchronize functions instead of effects to prevent loop and handle Avoidance
    const updateFromPrice = (newPrice: number, current: number = currentPrice, bPercent: number = basePercent) => {
        setNegotiatedPrice(newPrice)
        if (current > 0) {
            const savingsAmount = current - newPrice
            const newPercent = (savingsAmount / current) * 100
            setPercentage(newPercent)
            
            if (savingsType === 'Avoidance') {
                setNegPercent(bPercent - newPercent)
            }
        }
    }

    const updateFromPercentage = (newPercent: number, current: number = currentPrice, bPercent: number = basePercent) => {
        setPercentage(newPercent)
        const savingsAmount = current * (newPercent / 100)
        const newPrice = current - savingsAmount
        setNegotiatedPrice(newPrice > 0 ? newPrice : 0)
        
        if (savingsType === 'Avoidance') {
             setNegPercent(bPercent - newPercent)
        }
    }

    const updateFromAvoidance = (bPercent: number, nPercent: number, current: number = currentPrice) => {
        setBasePercent(bPercent)
        setNegPercent(nPercent)
        
        const calcPercent = Math.max(0, bPercent - nPercent)
        setPercentage(calcPercent)
        
        const savingsAmount = current * (calcPercent / 100)
        const newPrice = current - savingsAmount
        setNegotiatedPrice(newPrice > 0 ? newPrice : 0)
    }

    const handleCurrentPriceChange = (newCurrentPrice: number) => {
        setCurrentPrice(newCurrentPrice)
        if (savingsType === 'Avoidance') {
            const calcPercent = Math.max(0, basePercent - negPercent)
            const savingsAmount = newCurrentPrice * (calcPercent / 100)
            const newPrice = newCurrentPrice - savingsAmount
            setNegotiatedPrice(newPrice > 0 ? newPrice : 0)
        } else {
            const savingsAmount = newCurrentPrice * (percentage / 100)
            const newPrice = newCurrentPrice - savingsAmount
            setNegotiatedPrice(newPrice > 0 ? newPrice : 0)
        }
    }

    if (!isOpen || !product) return null

    // Calculations
    const unitSavings = currentPrice - negotiatedPrice
    const totalSavings = unitSavings * consumption * months

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(value)
    }

    const handleSave = () => {
        onSave({
            ...product,
            precio_actual: currentPrice,
            precio_negociado: negotiatedPrice,
            cantidad_mensual: consumption,
            tipo: savingsType,
            months: months,
            porcentaje_base: basePercent,
            porcentaje_negociado: negPercent
        })
        onClose()
    }

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm transition-opacity">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-200">

                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-slate-100">
                    <div className="flex items-center gap-3">
                        <div className="bg-[#254153]/10 p-2 rounded-lg">
                            <Calculator className="w-6 h-6 text-[#254153]" />
                        </div>
                        <h2 className="text-xl font-bold text-[#254153]">Negociador de Producto</h2>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400 hover:text-slate-600">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <div className="p-6 space-y-8">

                    {/* 1. Datos del Producto */}
                    <div className="bg-slate-50 rounded-xl p-5 border border-slate-200">
                        <h3 className="text-sm font-bold text-[#254153] uppercase tracking-wide mb-4">Datos del Producto</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="text-xs text-slate-500 font-medium block mb-1">Descripción</label>
                                <div className="font-semibold text-slate-800 text-lg">{product.descripcion}</div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs text-slate-500 font-medium block mb-1">ID Producto</label>
                                    <div className="font-mono text-slate-600 bg-white px-3 py-1 rounded border border-slate-200 inline-block">#{product.id}</div>
                                </div>
                                <div>
                                    <label className="text-xs text-slate-500 font-medium block mb-1">Precio Actual (Unitario)</label>
                                    <div className="relative">
                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold">$</span>
                                        <input
                                            type="number"
                                            value={currentPrice}
                                            onChange={(e) => handleCurrentPriceChange(parseFloat(e.target.value) || 0)}
                                            className="w-full pl-7 pr-3 py-1 bg-white border border-[#254153]/20 rounded focus:ring-2 focus:ring-[#254153]/10 focus:border-[#254153] outline-none transition-all font-bold text-slate-900 text-lg"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* 2. Datos de Negociación */}
                    <div className="space-y-6">
                        <div className="flex items-center justify-between">
                            <h3 className="text-sm font-bold text-[#254153] uppercase tracking-wide">Datos de Negociación</h3>

                            {/* Toggle Type */}
                            <div className="flex bg-slate-100 p-1 rounded-lg">
                                <button
                                    onClick={() => setNegotiationType('price')}
                                    className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${negotiationType === 'price' ? 'bg-white text-[#254153] shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                                >
                                    <DollarSign className="w-4 h-4 inline mr-1" /> Precio
                                </button>
                                <button
                                    onClick={() => setNegotiationType('percentage')}
                                    className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${negotiationType === 'percentage' ? 'bg-white text-[#254153] shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                                >
                                    <Percent className="w-4 h-4 inline mr-1" /> Porcentaje
                                </button>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">

                            {/* Left Column: Price/Percent */}
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">
                                        {negotiationType === 'price' ? 'Precio Negociado (Nuevo)' : 'Porcentaje de Descuento'}
                                    </label>
                                    <div className="relative">
                                        {negotiationType === 'price' ? (
                                            <>
                                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">$</span>
                                                <input
                                                    type="number"
                                                    value={negotiatedPrice}
                                                    onChange={(e) => updateFromPrice(parseFloat(e.target.value) || 0)}
                                                    className="w-full pl-8 pr-4 py-3 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#254153] focus:border-[#254153] outline-none transition-all font-semibold text-lg"
                                                />
                                            </>
                                        ) : (
                                            <>
                                                <input
                                                    type="number"
                                                    value={percentage}
                                                    onChange={(e) => updateFromPercentage(parseFloat(e.target.value) || 0)}
                                                    className="w-full pl-4 pr-8 py-3 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#254153] focus:border-[#254153] outline-none transition-all font-semibold text-lg"
                                                />
                                                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">%</span>
                                            </>
                                        )}
                                    </div>
                                    {negotiationType === 'percentage' && savingsType !== 'Avoidance' && (
                                        <p className="text-xs text-slate-500 mt-1 text-right">
                                            Equivale a: <span className="font-semibold text-[#254153]">{formatCurrency(currentPrice * (1 - percentage / 100))}</span>
                                        </p>
                                    )}

                                    {savingsType === 'Avoidance' && (
                                        <div className="flex gap-4 mt-4">
                                            <div className="flex-1">
                                                <label className="block text-xs font-medium text-slate-700 mb-1">% Base</label>
                                                <div className="relative">
                                                    <input
                                                        type="number"
                                                        value={basePercent}
                                                        onChange={(e) => updateFromAvoidance(parseFloat(e.target.value) || 0, negPercent)}
                                                        className="w-full pl-3 pr-8 py-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#254153] outline-none transition-all"
                                                    />
                                                    <Percent className="absolute right-3 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400" />
                                                </div>
                                            </div>
                                            <div className="flex-1">
                                                <label className="block text-xs font-medium text-slate-700 mb-1">% Negociado</label>
                                                <div className="relative">
                                                    <input
                                                        type="number"
                                                        value={negPercent}
                                                        onChange={(e) => updateFromAvoidance(basePercent, parseFloat(e.target.value) || 0)}
                                                        className="w-full pl-3 pr-8 py-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#254153] outline-none transition-all"
                                                    />
                                                    <Percent className="absolute right-3 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400" />
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Tiempo (Meses)</label>
                                    <div className="relative">
                                        <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                                        <input
                                            type="number"
                                            value={months}
                                            onChange={(e) => setMonths(parseFloat(e.target.value) || 0)}
                                            className="w-full pl-10 pr-4 py-3 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#254153] focus:border-[#254153] outline-none transition-all"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Right Column: Consumption/Type */}
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Consumo Mensual (Unidades)</label>
                                    <div className="relative">
                                        <Package className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                                        <input
                                            type="number"
                                            value={consumption}
                                            onChange={(e) => setConsumption(parseFloat(e.target.value) || 0)}
                                            className="w-full pl-10 pr-4 py-3 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#254153] focus:border-[#254153] outline-none transition-all"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Tipo de Ahorro</label>
                                    <select
                                        value={savingsType}
                                        onChange={(e) => setSavingsType(e.target.value as any)}
                                        className="w-full px-4 py-3 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#254153] focus:border-[#254153] outline-none transition-all appearance-none"
                                    >
                                        <option value="Ahorro">Ahorro (Hard Savings)</option>
                                        <option value="Avoidance">Avoidance (Soft Savings)</option>
                                    </select>
                                </div>
                            </div>

                        </div>
                    </div>

                    {/* 3. Resultados */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
                        <div className="bg-emerald-400 rounded-xl p-6 text-white text-center shadow-lg shadow-emerald-400/20">
                            <p className="text-emerald-50 text-sm font-semibold uppercase tracking-wider mb-1">Ahorro Unitario</p>
                            <h4 className="text-3xl font-bold">{formatCurrency(unitSavings)}</h4>
                        </div>
                        <div className="bg-[#e78b60] rounded-xl p-6 text-white text-center shadow-lg shadow-orange-400/20">
                            <p className="text-orange-50 text-sm font-semibold uppercase tracking-wider mb-1">Ahorro Anual Proyectado</p>
                            <h4 className="text-3xl font-bold">{formatCurrency(totalSavings)}</h4>
                            <p className="text-xs text-orange-100 mt-2 opacity-80">(Unitario × Cantidad {consumption} × {months} Meses)</p>
                        </div>
                    </div>

                </div>

                {/* Footer Actions */}
                <div className="p-6 border-t border-slate-100 flex justify-end gap-3 bg-slate-50/50 rounded-b-2xl">
                    <button
                        onClick={onClose}
                        className="px-6 py-2.5 rounded-lg border border-slate-300 text-slate-700 font-medium hover:bg-slate-100 transition-colors"
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={handleSave}
                        className="px-8 py-2.5 rounded-lg bg-[#254153] hover:bg-[#1a2f3d] text-white font-bold shadow-lg shadow-[#254153]/20 transition-all transform active:scale-95"
                    >
                        Actualizar Producto
                    </button>
                </div>

            </div>
        </div>
    )
}
