'use client'

import { useState, useMemo } from 'react'
import { SKUS, crearEstadoInicial } from './data'
import { MESES, CORTE, NM } from './types'
import {
  calcularPrecioNegociado,
  kgDelMes,
  impactoAndercol,
  impactoNegociado,
  avoidance,
  totalesDeVista,
} from './calculations'

export default function SimuladorCompleto() {
  const [estado, setEstado] = useState(crearEstadoInicial())
  const [abiertos, setAbiertos] = useState<Record<number, boolean>>({ 2: true })

  // Calculadora rápida
  const [calcSku, setCalcSku] = useState('2')
  const [calcValor, setCalcValor] = useState('')
  const [calcModo, setCalcModo] = useState<'cop' | 'pct'>('cop')
  const [calcDesde, setCalcDesde] = useState(CORTE + 1)

  const toggle = (si: number) => setAbiertos(prev => ({ ...prev, [si]: !prev[si] }))

  const cambiarPct = (si: number, mi: number, valor: number) => {
    const nuevo = { ...estado, porcentajesNegociados: estado.porcentajesNegociados.map(a => [...a]) }
    nuevo.porcentajesNegociados[si][mi] = valor
    setEstado(nuevo)
  }

  const cambiarKg = (si: number, valor: number) => {
    const nuevo = { ...estado, kgSimulados: [...estado.kgSimulados] }
    nuevo.kgSimulados[si] = Math.max(0, valor)
    setEstado(nuevo)
  }

  const mesesVista = useMemo(() => Array.from({ length: NM }, (_, i) => i), [])

  const resumen = useMemo(() => {
    return mesesVista.map(mi => {
      let and = 0, neg = 0
      SKUS.forEach((sku, si) => {
        and += impactoAndercol(sku, si, mi, estado)
        neg += impactoNegociado(sku, si, mi, estado)
      })
      return { mi, and, neg, av: and - neg }
    })
  }, [estado, mesesVista])

  const totales = useMemo(() => totalesDeVista(SKUS, mesesVista, estado), [estado, mesesVista])

  // Calculadora
  const calcResult = useMemo(() => {
    const val = parseFloat(calcValor)
    if (isNaN(val) || val === 0) return null
    const list = calcSku === 'all' ? SKUS.map((_, i) => i) : [parseInt(calcSku)]
    return list.map(si => {
      const sku = SKUS[si]
      const last = sku.preciosReales[CORTE] ?? sku.precioBaseMar26
      const aumento = calcModo === 'cop' ? val : last * val / 100
      const kg = estado.kgSimulados[si]
      const impactoMes = kg * aumento
      const nMeses = NM - calcDesde
      return {
        nombre: sku.name,
        last,
        aumento,
        pct: (aumento / last) * 100,
        precioNuevo: last + aumento,
        kg,
        impactoMes,
        impactoTotal: impactoMes * nMeses,
      }
    })
  }, [calcSku, calcValor, calcModo, calcDesde, estado])

  return (
    <div style={{ padding: 20, fontFamily: 'system-ui', background: '#f1f3f6', minHeight: '100vh' }}>
      <h1 style={{ marginBottom: 4 }}>Simulador Andercol 2026</h1>
      <p style={{ color: '#6b7280', marginBottom: 20 }}>
        Datos reales hasta {MESES[CORTE]} · Desde {MESES[CORTE + 1]} se simula
      </p>

      {/* Calculadora rápida */}
      <div style={{ background: '#fff', border: '1px solid #dde1e9', borderLeft: '4px solid #d97706', borderRadius: 8, padding: 16, marginBottom: 20 }}>
        <h3 style={{ margin: '0 0 12px', fontSize: 15 }}>Calculadora rápida de aumento</h3>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'end' }}>
          <label style={{ fontSize: 12 }}>SKU<br />
            <select value={calcSku} onChange={e => setCalcSku(e.target.value)} style={{ padding: 6 }}>
              {SKUS.map((s, i) => <option key={s.id} value={i}>{s.name}</option>)}
              <option value="all">Todos los SKU</option>
            </select>
          </label>
          <label style={{ fontSize: 12 }}>Aumento COP/kg<br />
            <input type="number" step="10" placeholder="ej. 1000" value={calcModo === 'cop' ? calcValor : ''} onChange={e => { setCalcModo('cop'); setCalcValor(e.target.value) }} style={{ width: 100, padding: 6 }} />
          </label>
          <span style={{ paddingBottom: 6 }}>o</span>
          <label style={{ fontSize: 12 }}>Aumento %<br />
            <input type="number" step="0.1" placeholder="ej. 5" value={calcModo === 'pct' ? calcValor : ''} onChange={e => { setCalcModo('pct'); setCalcValor(e.target.value) }} style={{ width: 80, padding: 6 }} />
          </label>
          <label style={{ fontSize: 12 }}>Desde<br />
            <select value={calcDesde} onChange={e => setCalcDesde(parseInt(e.target.value))} style={{ padding: 6 }}>
              {MESES.slice(CORTE + 1).map((m, i) => <option key={m} value={CORTE + 1 + i}>{m}</option>)}
            </select>
          </label>
        </div>
        {calcResult && (
          <div style={{ marginTop: 12, overflowX: 'auto' }}>
            <table style={{ width: '100%', fontSize: 12, borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#f7f8fa' }}>
                  <th style={{ textAlign: 'left', padding: 6 }}>SKU</th>
                  <th style={{ padding: 6 }}>Último precio</th>
                  <th style={{ padding: 6 }}>Aumento</th>
                  <th style={{ padding: 6 }}>Precio nuevo</th>
                  <th style={{ padding: 6 }}>Impacto/mes</th>
                  <th style={{ padding: 6 }}>Impacto total</th>
                </tr>
              </thead>
              <tbody>
                {calcResult.map((r, i) => (
                  <tr key={i}>
                    <td style={{ padding: 6 }}>{r.nombre}</td>
                    <td style={{ padding: 6, textAlign: 'right', fontFamily: 'monospace' }}>{r.last.toLocaleString('es-CO')}</td>
                    <td style={{ padding: 6, textAlign: 'right', fontFamily: 'monospace' }}>+{r.aumento.toLocaleString('es-CO')} ({r.pct.toFixed(1)}%)</td>
                    <td style={{ padding: 6, textAlign: 'right', fontFamily: 'monospace' }}>{r.precioNuevo.toLocaleString('es-CO')}</td>
                    <td style={{ padding: 6, textAlign: 'right', fontFamily: 'monospace' }}>{(r.impactoMes / 1e6).toFixed(1)} M</td>
                    <td style={{ padding: 6, textAlign: 'right', fontFamily: 'monospace' }}>{(r.impactoTotal / 1e6).toFixed(1)} M</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* SKUs desplegables */}
      {SKUS.map((sku, si) => {
        const abierto = !!abiertos[si]
        return (
          <div key={sku.id} style={{ background: '#fff', border: '1px solid #dde1e9', borderRadius: 12, marginBottom: 12, overflow: 'hidden', borderLeft: sku.esObjetivo ? '4px solid #2563eb' : undefined }}>
            <div onClick={() => toggle(si)} style={{ padding: '12px 16px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10, background: abierto ? '#f7f8fa' : '#fff' }}>
              <span style={{ fontWeight: 700 }}>{sku.name}</span>
              <span style={{ fontSize: 12, color: '#6b7280' }}>Ref. {sku.ref}</span>
              {sku.esObjetivo && <span style={{ fontSize: 11, background: '#eff6ff', color: '#2563eb', padding: '2px 8px', borderRadius: 20 }}>★ Objetivo</span>}
              <span style={{ marginLeft: 'auto', fontSize: 13, color: '#6b7280' }}>{abierto ? '▲' : '▼'}</span>
            </div>
            {abierto && (
              <div style={{ padding: '0 16px 16px' }}>
                {sku.nota && <p style={{ fontSize: 12, color: '#6b7280', margin: '8px 0', padding: '6px 10px', background: '#f7f8fa', borderLeft: '3px solid #b8bfcc' }}>{sku.nota}</p>}
                <div style={{ margin: '10px 0', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <label style={{ fontSize: 12 }}>Kg/mes desde {MESES[CORTE + 1]}:</label>
                  <input type="number" min={0} value={estado.kgSimulados[si]} onChange={e => cambiarKg(si, parseInt(e.target.value) || 0)} style={{ width: 90, padding: '4px 6px', fontFamily: 'monospace' }} />
                </div>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                    <thead>
                      <tr style={{ background: '#e8ecf0' }}>
                        <th style={{ textAlign: 'left', padding: '6px 8px' }}>Mes</th>
                        <th style={{ padding: '6px 8px' }}>Kg</th>
                        <th style={{ padding: '6px 8px' }}>Base</th>
                        <th style={{ padding: '6px 8px', background: '#fef2f2' }}>Precio And.</th>
                        <th style={{ padding: '6px 8px', background: '#eff6ff' }}>% Neg.</th>
                        <th style={{ padding: '6px 8px', background: '#eff6ff' }}>Precio Neg.</th>
                        <th style={{ padding: '6px 8px', background: '#f0fdf4' }}>Avoidance</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Array.from({ length: NM }, (_, mi) => {
                        const esReal = mi <= CORTE
                        const kg = kgDelMes(sku, si, mi, estado)
                        const precioNeg = calcularPrecioNegociado(sku, si, mi, estado)
                        const av = avoidance(sku, si, mi, estado)
                        return (
                          <tr key={mi} style={{ background: esReal ? '#eceef2' : undefined }}>
                            <td style={{ padding: '5px 8px', fontWeight: 600 }}>{MESES[mi]} {esReal && '🔒'}</td>
                            <td style={{ padding: '5px 8px', textAlign: 'right', fontFamily: 'monospace' }}>{kg.toLocaleString('es-CO')}</td>
                            <td style={{ padding: '5px 8px', textAlign: 'right', fontFamily: 'monospace' }}>{sku.precioBaseMar26.toLocaleString('es-CO')}</td>
                            <td style={{ padding: '5px 8px', textAlign: 'right', fontFamily: 'monospace', background: '#fff8f0' }}>{estado.preciosPropuestos[si][mi].toLocaleString('es-CO')}</td>
                            <td style={{ padding: '5px 8px', textAlign: 'center' }}>
                              {esReal ? '—' : <input type="number" step="0.1" value={estado.porcentajesNegociados[si][mi]} onChange={e => cambiarPct(si, mi, parseFloat(e.target.value) || 0)} style={{ width: 70, fontFamily: 'monospace', textAlign: 'right' }} />}
                            </td>
                            <td style={{ padding: '5px 8px', textAlign: 'right', fontFamily: 'monospace', fontWeight: esReal ? 700 : 400 }}>{precioNeg != null ? precioNeg.toLocaleString('es-CO') : '—'}</td>
                            <td style={{ padding: '5px 8px', textAlign: 'right', fontFamily: 'monospace', background: '#f0fdf4', color: av > 50000 ? '#16a34a' : av < -50000 ? '#dc2626' : '#6b7280' }}>{(av / 1e6).toFixed(1)} M</td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )
      })}

      {/* Resumen consolidado */}
      <div style={{ background: '#fff', border: '1px solid #dde1e9', borderRadius: 12, padding: 16, marginTop: 8 }}>
        <h3 style={{ margin: '0 0 12px', fontSize: 15 }}>Resumen mensual consolidado (M COP vs base Mar-26)</h3>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
            <thead>
              <tr style={{ background: '#f7f8fa' }}>
                <th style={{ textAlign: 'left', padding: '6px 8px' }}>Concepto</th>
                {MESES.map((m, i) => <th key={m} style={{ padding: '6px 8px', background: i <= CORTE ? '#e5e7eb' : undefined }}>{m}</th>)}
                <th style={{ padding: '6px 8px' }}>Total</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style={{ padding: '6px 8px', fontWeight: 600 }}>Propuesta Andercol</td>
                {resumen.map(r => <td key={r.mi} style={{ padding: '6px 8px', textAlign: 'right', fontFamily: 'monospace', background: r.mi <= CORTE ? '#f1f2f5' : undefined }}>{(r.and / 1e6).toFixed(1)}</td>)}
                <td style={{ padding: '6px 8px', textAlign: 'right', fontFamily: 'monospace', fontWeight: 700 }}>{(totales.totalAndercol / 1e6).toFixed(1)}</td>
              </tr>
              <tr>
                <td style={{ padding: '6px 8px', fontWeight: 600 }}>Negociado</td>
                {resumen.map(r => <td key={r.mi} style={{ padding: '6px 8px', textAlign: 'right', fontFamily: 'monospace', background: r.mi <= CORTE ? '#f1f2f5' : undefined }}>{(r.neg / 1e6).toFixed(1)}</td>)}
                <td style={{ padding: '6px 8px', textAlign: 'right', fontFamily: 'monospace', fontWeight: 700 }}>{(totales.totalNegociado / 1e6).toFixed(1)}</td>
              </tr>
              <tr>
                <td style={{ padding: '6px 8px', fontWeight: 600, color: '#16a34a' }}>Avoidance</td>
                {resumen.map(r => <td key={r.mi} style={{ padding: '6px 8px', textAlign: 'right', fontFamily: 'monospace', background: r.mi <= CORTE ? '#f1f2f5' : undefined, color: r.av > 0 ? '#16a34a' : r.av < 0 ? '#dc2626' : undefined }}>{(r.av / 1e6).toFixed(1)}</td>)}
                <td style={{ padding: '6px 8px', textAlign: 'right', fontFamily: 'monospace', fontWeight: 700, color: totales.avoidance >= 0 ? '#16a34a' : '#dc2626' }}>{(totales.avoidance / 1e6).toFixed(1)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
