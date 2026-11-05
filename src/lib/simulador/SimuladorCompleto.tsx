'use client'

import { useCallback, useMemo, useState } from 'react'
import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  ReferenceArea,
} from 'recharts'
import {
  CORTE,
  FECHA_CORTE,
  G25_AND,
  MESES,
  MIX_NOTE,
  NM,
  OCQ,
  R26_TOT,
  SK,
  SLMAX,
  SLMIN,
  VIEWS,
  initialAndP,
  initialKgT,
  initialNegPct,
  initialOcqP,
} from './data'
import {
  aCum,
  aImp,
  aStep,
  andRealAt,
  chartData as buildChartData,
  d25,
  dim26,
  isR,
  kgM,
  lastReal,
  nCum,
  nImp,
  nIncr,
  nStep,
  negP,
  prevNegP,
  skuSharePct,
  snapState,
  sum,
  totals,
  vm,
} from './calculations'
import { big, bigS, cc, ccA, colP, colPc, cp, fmtC, fmtM, fmtP, num } from './format'
import type { ScenarioSnap, ViewKey } from './types'
import './simulador.css'

type ScenKey = 'A' | 'B' | 'C'

function clone2(a: number[][]) {
  return a.map((r) => [...r])
}

export default function SimuladorCompleto() {
  const [view, setView] = useState<ViewKey>('y26')
  const [kgT, setKgT] = useState(initialKgT)
  const [andP, setAndP] = useState(initialAndP)
  const [negPct, setNegPct] = useState(initialNegPct)
  const [ocqP, setOcqP] = useState(initialOcqP)
  const [scenarios, setScenarios] = useState<Record<ScenKey, ScenarioSnap | null>>({
    A: null,
    B: null,
    C: null,
  })
  const [activeScen, setActiveScen] = useState<ScenKey | null>(null)
  const [openSkus, setOpenSkus] = useState<Record<number, boolean>>(() => {
    const o: Record<number, boolean> = {}
    SK.forEach((s, si) => {
      o[si] = !!s.hl
    })
    return o
  })
  const [globalPct, setGlobalPct] = useState('0')
  const [skuPcts, setSkuPcts] = useState<Record<number, string>>({})
  const [calcSku, setCalcSku] = useState(String(SK.findIndex((s) => s.hl)))
  const [calcCop, setCalcCop] = useState('')
  const [calcPct, setCalcPct] = useState('')
  const [calcFrom, setCalcFrom] = useState(CORTE + 1)
  const [calcMode, setCalcMode] = useState<'cop' | 'pct'>('cop')
  const [isReadOnly, setIsReadOnly] = useState(false)
  const [exportDate, setExportDate] = useState('')

  const clearScen = () => setActiveScen(null)

  const t = useMemo(() => totals(view, andP, negPct, kgT), [view, andP, negPct, kgT])
  const d = useMemo(() => dim26(negPct, kgT), [negPct, kgT])
  const d25v = d25()
  const months = useMemo(() => vm(view), [view])
  const chart = useMemo(() => buildChartData(view, andP, negPct, kgT), [view, andP, negPct, kgT])

  const chartRows = useMemo(() => {
    return chart.labels.map((label, i) => {
      const row: Record<string, string | number | boolean> = {
        label,
        negociado: chart.line[i],
        real: chart.realFlags[i],
      }
      SK.forEach((s, si) => {
        row[s.n] = chart.bars[si][i]
      })
      return row
    })
  }, [chart])

  const realBand = useMemo(() => {
    const idxs = chart.realFlags.map((r, i) => (r ? i : -1)).filter((i) => i >= 0)
    if (!idxs.length) return null
    return { x1: chart.labels[idxs[0]], x2: chart.labels[idxs[idxs.length - 1]] }
  }, [chart])

  const onAndP = (si: number, mi: number, val: string) => {
    const p = Math.round(parseFloat(val))
    if (!(p > 0)) return
    setAndP((prev) => {
      const next = clone2(prev)
      for (let j = mi; j < NM; j++) next[si][j] = p
      return next
    })
    clearScen()
  }

  const onAndPct = (si: number, mi: number, val: string) => {
    const pct = parseFloat(val)
    if (Number.isNaN(pct)) return
    const prevP = mi === 0 ? SK[si].pa : andP[si][mi - 1]
    const p = Math.round(prevP * (1 + pct / 100))
    setAndP((cur) => {
      const next = clone2(cur)
      for (let j = mi; j < NM; j++) next[si][j] = p
      return next
    })
    clearScen()
  }

  const onSl = (si: number, mi: number, val: string) => {
    const v = parseFloat(val) || 0
    setNegPct((prev) => {
      const next = clone2(prev)
      next[si][mi] = v
      return next
    })
    clearScen()
  }

  const onPt = (si: number, mi: number, val: string) => {
    const v = parseFloat(val)
    if (Number.isNaN(v)) return
    setNegPct((prev) => {
      const next = clone2(prev)
      next[si][mi] = v
      return next
    })
    clearScen()
  }

  const onPr = (si: number, mi: number, val: string) => {
    const npv = parseFloat(val)
    if (!(npv > 0)) return
    const base = prevNegP(si, mi, negPct)
    setNegPct((prev) => {
      const next = clone2(prev)
      next[si][mi] = (npv / base - 1) * 100
      return next
    })
    clearScen()
  }

  const onKg = (si: number, val: string) => {
    setKgT((prev) => {
      const next = [...prev]
      next[si] = Math.max(0, parseInt(val, 10) || 0)
      return next
    })
    clearScen()
  }

  const applyPctToSku = (si: number, pct: number, base?: number[][]) => {
    const src = base ? clone2(base) : clone2(negPct)
    for (let mi = CORTE + 1; mi < NM; mi++) src[si][mi] = pct
    return src
  }

  const applyGlobal = () => {
    const pct = parseFloat(globalPct) || 0
    let next = clone2(negPct)
    SK.forEach((_, si) => {
      next = applyPctToSku(si, pct, next)
    })
    setNegPct(next)
    clearScen()
  }

  const applySkuPct = (si: number) => {
    const pct = parseFloat(skuPcts[si] || '') || 0
    setNegPct(applyPctToSku(si, pct))
    clearScen()
  }

  const resetSku = (si: number) => {
    setNegPct(applyPctToSku(si, 0))
    clearScen()
  }

  const resetAll = () => {
    let next = clone2(negPct)
    SK.forEach((_, si) => {
      next = applyPctToSku(si, 0, next)
    })
    setNegPct(next)
    clearScen()
  }

  const onOcq = (i: number, val: string) => {
    const p = parseFloat(val)
    if (!(p > 0)) return
    setOcqP((prev) => {
      const next = [...prev]
      next[i] = p
      return next
    })
  }

  const saveScen = (l: ScenKey) => {
    const snap = snapState(negPct, andP, kgT, ocqP)
    setScenarios((prev) => ({ ...prev, [l]: snap }))
    setActiveScen(l)
  }

  const restoreScen = (l: ScenKey) => {
    const s = scenarios[l]
    if (!s) return
    setNegPct(clone2(s.negPct))
    setAndP(clone2(s.andP))
    setKgT([...s.kgT])
    if (s.ocqP) setOcqP([...s.ocqP])
    setActiveScen(l)
  }

  const scenTotals = (st: ScenarioSnap) => totals(view, st.andP, st.negPct, st.kgT)

  const exportNew = useCallback(async () => {
    const ds = new Date().toLocaleDateString('es-CO', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    })
    const st = {
      ro: true,
      date: ds,
      view,
      kgT,
      andP,
      negPct,
      ocqP,
      scenarios,
      activeScen,
    }
    const json = JSON.stringify(st).replace(/</g, '\\u003c')
    try {
      const res = await fetch('/simulador-andercol-export.html')
      let html = await res.text()
      const marker = 'let BAKED=null;/*BAKED_END*/'
      if (!html.includes(marker)) {
        alert('No se pudo generar el archivo de solo lectura.')
        return
      }
      html = html.replace(marker, `let BAKED=${json};/*BAKED_END*/`)
      const blob = new Blob([html], { type: 'text/html;charset=utf-8' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'Neg_andercol_readonly.html'
      document.body.appendChild(a)
      a.click()
      setTimeout(() => {
        URL.revokeObjectURL(url)
        document.body.removeChild(a)
      }, 1000)
      setExportDate(ds)
    } catch {
      alert('No se pudo generar el archivo de solo lectura.')
    }
  }, [view, kgT, andP, negPct, ocqP, scenarios, activeScen])

  const toggleMode = () => {
    setIsReadOnly((v) => !v)
  }

  const calcRows = useMemo(() => {
    const val = parseFloat(calcMode === 'cop' ? calcCop : calcPct)
    if (Number.isNaN(val) || val === 0) return null
    const list = calcSku === 'all' ? SK.map((_, si) => si) : [parseInt(calcSku, 10)]
    const n26 = Math.max(0, 11 - calcFrom + 1)
    const nH = NM - calcFrom
    const rows = list.map((si) => {
      const last = lastReal(si)
      const dlt = calcMode === 'cop' ? val : (last * val) / 100
      const kg = kgT[si]
      const m = kg * dlt
      return {
        si,
        last,
        d: dlt,
        pct: (dlt / last) * 100,
        np: last + dlt,
        kg,
        m,
        i26: m * n26,
        iH: m * nH,
        iA: m * 12,
      }
    })
    return { rows, n26, nH, from: calcFrom }
  }, [calcSku, calcCop, calcPct, calcFrom, calcMode, kgT])

  const onCalcCop = (v: string) => {
    setCalcMode('cop')
    setCalcCop(v)
    if (calcSku !== 'all') {
      const si = parseInt(calcSku, 10)
      const last = lastReal(si)
      const dlt = parseFloat(v)
      if (!Number.isNaN(dlt) && dlt !== 0) setCalcPct(((dlt / last) * 100).toFixed(2))
      else setCalcPct('')
    } else setCalcPct('')
  }

  const onCalcPctIn = (v: string) => {
    setCalcMode('pct')
    setCalcPct(v)
    if (calcSku !== 'all') {
      const si = parseInt(calcSku, 10)
      const last = lastReal(si)
      const pct = parseFloat(v)
      if (!Number.isNaN(pct) && pct !== 0) setCalcCop(String(Math.round((last * pct) / 100)))
      else setCalcCop('')
    } else setCalcCop('')
  }

  const fM = (v: number) => (Math.abs(v) < 5e4 ? '—' : fmtM(v))

  return (
    <div className={`sa-root${isReadOnly ? ' ro-mode' : ''}`}>
      <div className="ro-bar" style={{ display: isReadOnly || exportDate ? 'flex' : 'none' }}>
        <span className="lbl">{isReadOnly ? '🔒 SOLO LECTURA' : '✏️ MODO EDICIÓN'}</span>
        <span>
          · Neg_andercol_readonly · Generado: <span>{exportDate}</span> ·
        </span>
        <button className="ro-btn" type="button" onClick={toggleMode}>
          {isReadOnly ? '🔓 Desbloquear para edición' : '🔒 Volver a solo lectura'}
        </button>
      </div>
      {!isReadOnly && exportDate ? (
        <div id="edit-bar" style={{ display: 'flex' }}>
          <span>✏️ MODO EDICIÓN — ajusta los valores y exporta una nueva versión de solo lectura</span>
          <button className="btn btn-gn" type="button" onClick={exportNew}>
            📥 Exportar nueva versión de solo lectura
          </button>
        </div>
      ) : null}

      <div className="w">
        <div className="hd">
          <div className="hd-left">
            <p className="hd-m">Informe interno &nbsp;·&nbsp; Comité de Negociación &nbsp;·&nbsp; Confidencial</p>
            <h1>
              Negociación ANDERCOL SAS — Simulador de escenarios 2026{' '}
              <span className="corte">Datos reales al {FECHA_CORTE}</span>
            </h1>
          </div>
          <button
            className="btn"
            id="exp-main"
            type="button"
            style={{
              background: '#1e293b',
              color: '#fff',
              flexShrink: 0,
              marginTop: 4,
              fontSize: 13,
              padding: '8px 16px',
            }}
            onClick={exportNew}
          >
            📥 Exportar informe de solo lectura
          </button>
        </div>

        <div className="vbar">
          <span className="vbar-l">Vista:</span>
          <button type="button" className={`vbtn${view === 'y26' ? ' on' : ''}`} onClick={() => setView('y26')}>
            Año 2026 completo
          </button>
          <button type="button" className={`vbtn${view === 'ytd' ? ' on' : ''}`} onClick={() => setView('ytd')}>
            Año corrido (Ene → {MESES[CORTE]})
          </button>
          <button type="button" className={`vbtn${view === 'hz' ? ' on' : ''}`} onClick={() => setView('hz')}>
            Horizonte negociación (Abr-26 → Abr-27)
          </button>
          <span className="vbar-n">KPIs, tablas y gráfica se recalculan según la vista</span>
        </div>

        <div className="kpig">
          <div className="kpic">
            <div className="kpil">Gasto 2025 — Andercol</div>
            <div className="kpiv">{big(G25_AND)}</div>
            <div className="kpis">COP · año completo · BI Compras 1</div>
          </div>
          <div className="kpic bl">
            <div className="kpil">Dimensión negocio compuestos 2025</div>
            <div className="kpiv">{big(d25v)}</div>
            <div className="kpis">Andercol + Invesa + OCQ · año completo</div>
          </div>
          <div className="kpic dk">
            <div className="kpil">Dimensión negocio compuestos 2026</div>
            <div className="kpiv">{big(d.tot)}</div>
            <div className="kpis">
              Real Ene–{MESES[CORTE].slice(0, 3)} <b>{big(R26_TOT)}</b> + simulado {MESES[CORTE + 1].slice(0, 3)}
              –Dic <b>{big(d.sim + d.resto)}</b> · {fmtP((d.tot / d25v - 1) * 100, 1)} vs 2025
            </div>
          </div>
          <div className="kpic">
            <div className="kpil">SKUs en negociación</div>
            <div className="kpiv">5 SKUs</div>
            <div className="kpis">
              {skuSharePct().toFixed(1)}% del gasto Andercol Ene–{MESES[CORTE].slice(0, 3)} 2026
            </div>
          </div>
          <div className="kpic rd">
            <div className="kpil">Propuesta Andercol · {VIEWS[view].s}</div>
            <div className="kpiv">{bigS(t.tA)}</div>
            <div className="kpis">Impacto vs precio base Mar-26</div>
          </div>
          <div className="kpic">
            <div className="kpil">Negociado · {VIEWS[view].s}</div>
            <div
              className="kpiv"
              style={{ color: t.tN > 5e4 ? 'var(--rd)' : t.tN < -5e4 ? 'var(--gn)' : 'var(--tx)' }}
            >
              {bigS(t.tN)}
            </div>
            <div className="kpis">Impacto real + simulado vs base Mar-26</div>
          </div>
          <div className="kpic gn">
            <div className="kpil">Avoidance generado · {VIEWS[view].s}</div>
            <div className="kpiv" style={{ color: t.tV >= 0 ? 'var(--gn)' : 'var(--rd)' }}>
              {bigS(t.tV)}
            </div>
            <div className="kpis">Propuesta Andercol − negociado</div>
          </div>
          <div className="kpic">
            <div className="kpil">Impacto último aumento propuesto</div>
            <div
              className="kpiv"
              style={{
                color: !t.open
                  ? 'var(--t2)'
                  : t.tL > 5e4
                    ? 'var(--rd)'
                    : t.tL < -5e4
                      ? 'var(--gn)'
                      : 'var(--tx)',
              }}
            >
              {t.open ? bigS(t.tL) : '—'}
            </div>
            <div className="kpis">
              {t.open
                ? `(Propuesta − último precio pagado) × kg · ${t.open} meses simulados de la vista`
                : 'La vista no tiene meses simulados'}
            </div>
          </div>
        </div>

        <div className="sec">
          <div className="stl">Calculadora rápida de aumento — ¿cuánto nos cuesta si Andercol sube el precio?</div>
          <div className="calc-box">
            <div className="cbar">
              <label>
                SKU
                <select value={calcSku} onChange={(e) => setCalcSku(e.target.value)}>
                  {SK.map((s, si) => (
                    <option key={s.r} value={si}>
                      {s.n}
                    </option>
                  ))}
                  <option value="all">Todos los SKU</option>
                </select>
              </label>
              <label>
                Aumento COP/kg
                <input type="number" step="10" placeholder="ej. 1000" value={calcCop} onChange={(e) => onCalcCop(e.target.value)} />
              </label>
              <span className="c-o">o</span>
              <label>
                Aumento %
                <input type="number" step="0.1" placeholder="ej. 5" value={calcPct} onChange={(e) => onCalcPctIn(e.target.value)} />
              </label>
              <label>
                Aplica desde
                <select value={calcFrom} onChange={(e) => setCalcFrom(parseInt(e.target.value, 10))}>
                  {Array.from({ length: NM - CORTE - 1 }, (_, i) => CORTE + 1 + i).map((mi) => (
                    <option key={mi} value={mi}>
                      {MESES[mi]}
                    </option>
                  ))}
                </select>
              </label>
              <button
                className="c-clr"
                type="button"
                onClick={() => {
                  setCalcCop('')
                  setCalcPct('')
                }}
              >
                ✕ Limpiar
              </button>
            </div>
            <div className="sw">
              <table className="sumt">
                {!calcRows ? (
                  <tbody>
                    <tr>
                      <td style={{ fontWeight: 400, color: 'var(--t2)' }}>
                        Escribe un aumento en COP/kg o en % para ver el impacto.
                      </td>
                    </tr>
                  </tbody>
                ) : (
                  <>
                    <thead>
                      <tr>
                        <th>SKU</th>
                        <th>Último precio pagado</th>
                        <th>Aumento COP/kg</th>
                        <th>Aumento %</th>
                        <th>Precio nuevo</th>
                        <th>Kg/mes simulado</th>
                        <th>Impacto por mes</th>
                        <th>
                          {MESES[calcRows.from]} → Dic-26 ({calcRows.n26} m)
                        </th>
                        <th>
                          {MESES[calcRows.from]} → {MESES[NM - 1]} ({calcRows.nH} m)
                        </th>
                        <th>Anualizado (12 m)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {calcRows.rows.map((r) => (
                        <tr key={r.si}>
                          <td>{SK[r.si].n}</td>
                          <td>{num(r.last)}</td>
                          <td className={cp(r.d)}>
                            {r.d > 0 ? '+' : ''}
                            {num(r.d)}
                          </td>
                          <td className={cp(r.pct)}>{fmtP(r.pct, 2)}</td>
                          <td className="c-hi">{num(r.np)}</td>
                          <td>{num(r.kg)}</td>
                          <td className={`${cc(r.m)} c-hi`}>{fM(r.m)}</td>
                          <td className={cc(r.i26)}>{calcRows.n26 ? fM(r.i26) : '—'}</td>
                          <td className={cc(r.iH)}>{fM(r.iH)}</td>
                          <td className={cc(r.iA)}>{fM(r.iA)}</td>
                        </tr>
                      ))}
                      {calcRows.rows.length > 1 ? (
                        <tr>
                          <td>TOTAL</td>
                          <td></td>
                          <td></td>
                          <td></td>
                          <td></td>
                          <td>{num(sum(calcRows.rows.map((r) => r.kg)))}</td>
                          <td className={cc(sum(calcRows.rows.map((r) => r.m)))}>{fM(sum(calcRows.rows.map((r) => r.m)))}</td>
                          <td className={cc(sum(calcRows.rows.map((r) => r.i26)))}>
                            {calcRows.n26 ? fM(sum(calcRows.rows.map((r) => r.i26))) : '—'}
                          </td>
                          <td className={cc(sum(calcRows.rows.map((r) => r.iH)))}>{fM(sum(calcRows.rows.map((r) => r.iH)))}</td>
                          <td className={cc(sum(calcRows.rows.map((r) => r.iA)))}>{fM(sum(calcRows.rows.map((r) => r.iA)))}</td>
                        </tr>
                      ) : null}
                    </tbody>
                  </>
                )}
              </table>
            </div>
            <p className="oht">
              {calcRows
                ? `Base: último precio real pagado a Andercol. Kg = Kg/mes simulado de cada SKU (encabezado del simulador). Es una consulta: no modifica tablas, KPIs ni escenarios.${
                    calcRows.rows.filter((r) => r.kg === 0).length
                      ? ' Sin kg simulados (impacto 0): ' +
                        calcRows.rows
                          .filter((r) => r.kg === 0)
                          .map((r) => SK[r.si].n)
                          .join(', ') +
                        '.'
                      : ''
                  }`
                : ''}
            </p>
          </div>
        </div>

        <div className="sec">
          <div className="stl">Simulador de negociación por SKU — precio por mes</div>
          <div className="sub">
            <b>
              Ene-26 → {MESES[CORTE]}
            </b>{' '}
            = datos reales de BI Compras 1 (filas grises 🔒, no editables). <b>Desde {MESES[CORTE + 1]}</b> se
            simula: el precio negociado parte del último precio real pagado y el % neg. se compone mes a mes.
            Columnas Andercol en <b style={{ color: 'var(--or)' }}>naranja</b> = editables; al cambiar un mes, los
            siguientes toman el mismo valor. El campo Kg/mes del encabezado solo afecta los meses simulados. Base de
            impacto = precio Mar-26 (antes del aumento).
            <br />
            <span style={{ color: 'var(--t3)' }}>{MIX_NOTE}</span>
          </div>
          <div className="logic-badge">⛓ % neg. = incremento mensual compuesto sobre el precio del mes anterior</div>

          <div className="gbar">
            <span className="gbar-lbl">Aplicar % incremental global (meses simulados):</span>
            <input
              className="g-pct"
              type="number"
              value={globalPct}
              step="0.1"
              placeholder="%"
              onChange={(e) => setGlobalPct(e.target.value)}
            />
            <button className="btn btn-bl" type="button" onClick={applyGlobal}>
              ▶ Aplicar a todos
            </button>
            <button className="btn btn-dk" type="button" onClick={resetAll}>
              ↺ Resetear todo
            </button>
            <span className="gbar-sep" />
            <button className="btn btn-gn" type="button" onClick={() => saveScen('A')}>
              💾 Guardar Escenario A
            </button>
            <button className="btn btn-or" type="button" onClick={() => saveScen('B')}>
              💾 Guardar Escenario B
            </button>
            <button className="btn btn-pu" type="button" onClick={() => saveScen('C')}>
              💾 Guardar Escenario C
            </button>
          </div>

          <div className="scn-g">
            {(['A', 'B', 'C'] as ScenKey[]).map((l) => {
              const sc = scenarios[l]
              const colors = { A: 'var(--gn)', B: 'var(--or)', C: 'var(--pu)' }
              const clsExtra = sc ? ({ A: 'scna', B: 'scnb', C: 'scnc2' } as const)[l] : ''
              const tt = sc ? scenTotals(sc) : null
              return (
                <div
                  key={l}
                  className={`scnc ${clsExtra}${activeScen === l && sc ? ' active-scen' : ''}`}
                  onClick={() => restoreScen(l)}
                >
                  <div className="scn-hd">
                    <span className="scn-lbl" style={{ color: colors[l] }}>
                      ■ Escenario {l}
                    </span>
                  </div>
                  {!sc ? (
                    <div className="scn-empty">Sin guardar aún</div>
                  ) : (
                    <div>
                      <div className="scn-nums">
                        <span>
                          Andercol: <b style={{ color: 'var(--rd)' }}>{fmtM(tt!.tA, 0)}</b>
                        </span>
                        <span>
                          Negociado: <b>{fmtM(tt!.tN, 0)}</b>
                        </span>
                        <span>
                          Avoidance: <b style={{ color: 'var(--gn)' }}>{fmtM(tt!.tV, 0)}</b>
                        </span>
                        <span style={{ color: 'var(--t3)' }}>({VIEWS[view].s})</span>
                      </div>
                      <div className="scn-desc">{sc.desc}</div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          <div id="sim">
            {SK.map((s, si) => {
              const m = months
              const ta = sum(m.map((mi) => aImp(si, mi, andP, kgT)))
              const tn = sum(m.map((mi) => nImp(si, mi, negPct, kgT)))
              const tni = sum(m.map((mi) => nIncr(si, mi, negPct, kgT)))
              const tv = ta - tn
              const tk = sum(m.map((mi) => kgM(si, mi, kgT)))
              const open = !!openSkus[si]
              return (
                <div key={s.r} className={`sc${s.hl ? ' fcs' : ''}`}>
                  <div className="sh" onClick={() => setOpenSkus((prev) => ({ ...prev, [si]: !prev[si] }))}>
                    <span className="sdot" style={{ background: s.col }} />
                    <span className="snm">{s.n}</span>
                    <span className="srf">Ref. {s.r}</span>
                    {s.hl ? <span className="bfcs">★ Objetivo</span> : null}
                    <span className="ssp">{s.sh.toFixed(1)}% gasto And. 2026</span>
                    <span className="shsep" />
                    <span className="hsum">
                      <span className={`hbdg ${ta > 5e4 ? 'r' : ta < -5e4 ? 'g' : 'n'}`}>And: {fmtM(ta, 0)}</span>
                      <span className={`hbdg ${tn > 5e4 ? 'r' : tn < -5e4 ? 'g' : 'n'}`}>Neg: {fmtM(tn, 0)}</span>
                      <span className={`hbdg ${tv > 5e4 ? 'g' : tv < -5e4 ? 'r' : 'n'}`}>Av: {fmtM(tv, 0)}</span>
                    </span>
                    <div className="kgw" onClick={(e) => e.stopPropagation()}>
                      <label className="kgl" htmlFor={`ki${si}`}>
                        Kg/mes desde {MESES[CORTE + 1]}:
                      </label>
                      <input
                        className="kgi"
                        type="number"
                        id={`ki${si}`}
                        step={50}
                        min={0}
                        value={kgT[si]}
                        onChange={(e) => onKg(si, e.target.value)}
                      />
                    </div>
                    <button
                      className="btn-sm"
                      type="button"
                      style={{ marginLeft: 4 }}
                      onClick={(e) => {
                        e.stopPropagation()
                        resetSku(si)
                      }}
                    >
                      ↺ Resetear
                    </button>
                    <span className={`tgl${open ? ' op' : ''}`}>▼</span>
                  </div>
                  <div className={`sb${open ? ' op' : ''}`}>
                    {s.nt ? <div className="snota">{s.nt}</div> : null}
                    <div className="sku-gbar">
                      <span style={{ fontSize: 11, color: 'var(--t2)', whiteSpace: 'nowrap' }}>
                        Aplicar % incremental a los meses simulados de este SKU:
                      </span>
                      <input
                        className="sg-pct"
                        type="number"
                        step="0.1"
                        placeholder="%"
                        value={skuPcts[si] || ''}
                        onChange={(e) => setSkuPcts((p) => ({ ...p, [si]: e.target.value }))}
                      />
                      <button
                        className="btn btn-bl"
                        type="button"
                        style={{ padding: '4px 10px', fontSize: 11 }}
                        onClick={() => applySkuPct(si)}
                      >
                        ▶ Aplicar
                      </button>
                    </div>
                    <table className="skt">
                      <thead>
                        <tr>
                          <th rowSpan={2} style={{ textAlign: 'left' }}>
                            Mes
                          </th>
                          <th rowSpan={2}>Kg/mes</th>
                          <th rowSpan={2}>Precio base Mar-26</th>
                          <th
                            colSpan={4}
                            style={{
                              textAlign: 'center',
                              background: '#fef2f2',
                              color: 'var(--rd)',
                              borderBottom: '1px solid #fca5a5',
                            }}
                          >
                            — Andercol (propuesta · editable desde {MESES[CORTE + 1]} 🖊) —
                          </th>
                          <th
                            colSpan={4}
                            style={{
                              textAlign: 'center',
                              background: '#eff6ff',
                              color: 'var(--bl)',
                              borderBottom: '1px solid #93c5fd',
                            }}
                          >
                            — Negociado (real 🔒 / simulado) —
                          </th>
                          <th
                            colSpan={3}
                            style={{
                              textAlign: 'center',
                              background: '#f0fdf4',
                              color: 'var(--gn)',
                              borderBottom: '1px solid #86efac',
                            }}
                          >
                            — Negociado (acumulado) —
                          </th>
                        </tr>
                        <tr>
                          <th>
                            % prop.
                            <br />
                            Andercol
                          </th>
                          <th>
                            Precio prop.
                            <br />
                            Andercol
                          </th>
                          <th>
                            % impacto
                            <br />
                            aumento
                          </th>
                          <th>Impacto And. (M)</th>
                          <th>Slider % neg</th>
                          <th>Precio neg.</th>
                          <th>% neg.</th>
                          <th>Impacto neg. (M)</th>
                          <th className="th-acum">% neg acum.</th>
                          <th className="th-acum">Imp. neg acum. (M)</th>
                          <th className="th-acum">Avoid. (M)</th>
                        </tr>
                      </thead>
                      <tbody>
                        {Array.from({ length: NM }, (_, mi) => {
                          if (!months.includes(mi)) return null
                          const lk = isR(mi)
                          const cls = `${lk ? 'lk' : ''}${mi === CORTE + 1 ? ' sep' : ''}`
                          const kg = kgM(si, mi, kgT)
                          const ap = andP[si][mi]
                          const as = aStep(si, mi, andP)
                          const ac = aCum(si, mi, andP)
                          const ai = aImp(si, mi, andP, kgT)
                          const npv = negP(si, mi, negPct)
                          const ns = nStep(si, mi, negPct)
                          const nc = nCum(si, mi, negPct)
                          const na = nImp(si, mi, negPct, kgT)
                          const ni = nIncr(si, mi, negPct, kgT)
                          const av = ai - na
                          const noBuy = lk && npv == null
                          return (
                            <tr key={mi} className={cls}>
                              <td>
                                {MESES[mi]}
                                {lk ? ' 🔒' : ''}
                              </td>
                              <td className={`mo ${lk ? (kg ? '' : 'cn') : ''}`}>{num(kg)}</td>
                              <td className="mo cn">{num(s.pa)}</td>
                              {lk ? (
                                <>
                                  <td className={`mo ${cp(as)}`}>{Math.abs(as) < 0.005 ? '—' : fmtP(as, 2)}</td>
                                  <td className={`mo ${ap > s.pa ? 'cr' : ap < s.pa ? 'cg' : 'cn'}`}>{num(ap)}</td>
                                </>
                              ) : (
                                <>
                                  <td className="td-and-edit">
                                    <input
                                      type="number"
                                      className="nin-and"
                                      step={0.1}
                                      defaultValue={as.toFixed(2)}
                                      key={`apt-${si}-${mi}-${as.toFixed(2)}`}
                                      style={{ color: colPc(as) }}
                                      onBlur={(e) => onAndPct(si, mi, e.target.value)}
                                    />
                                  </td>
                                  <td className="td-and-edit">
                                    <input
                                      type="number"
                                      className="nin-and"
                                      step={1}
                                      defaultValue={ap}
                                      key={`apr-${si}-${mi}-${ap}`}
                                      style={{ color: colP(ap, s.pa) }}
                                      onBlur={(e) => onAndP(si, mi, e.target.value)}
                                    />
                                  </td>
                                </>
                              )}
                              <td className={`mo ${cp(ac)}`}>{fmtP(ac, 2)}</td>
                              <td className={`mo ${cc(ai)}`}>{fmtC(ai)}</td>
                              {lk ? (
                                <>
                                  <td className="cn" style={{ textAlign: 'center' }}>
                                    🔒
                                  </td>
                                  <td className={`mo ${noBuy ? 'cn' : 'nreal'}`}>{noBuy ? '—' : num(npv as number)}</td>
                                  <td className={`mo ${cp(ns)}`}>
                                    {ns == null ? '—' : Math.abs(ns) < 0.005 ? '0.00%' : fmtP(ns, 2)}
                                  </td>
                                </>
                              ) : (
                                <>
                                  <td>
                                    <input
                                      type="range"
                                      className="rng"
                                      min={SLMIN}
                                      max={SLMAX}
                                      step={0.1}
                                      value={Math.max(SLMIN, Math.min(SLMAX, negPct[si][mi]))}
                                      onChange={(e) => onSl(si, mi, e.target.value)}
                                    />
                                  </td>
                                  <td>
                                    <input
                                      type="number"
                                      className="nin"
                                      min={0}
                                      step={1}
                                      defaultValue={npv ?? ''}
                                      key={`pr-${si}-${mi}-${npv}`}
                                      style={{ color: colP(npv as number, s.pa) }}
                                      onBlur={(e) => onPr(si, mi, e.target.value)}
                                    />
                                  </td>
                                  <td>
                                    <input
                                      type="number"
                                      className="nin"
                                      step={0.1}
                                      defaultValue={(+negPct[si][mi]).toFixed(2)}
                                      key={`pt-${si}-${mi}-${negPct[si][mi]}`}
                                      style={{ color: colPc(negPct[si][mi]) }}
                                      onBlur={(e) => onPt(si, mi, e.target.value)}
                                    />
                                  </td>
                                </>
                              )}
                              <td className={`mo ${noBuy ? 'cn' : cc(ni)}`}>{noBuy ? '—' : fmtC(ni)}</td>
                              <td className={`mo td-acum ${cp(nc)}`}>{nc == null ? '—' : fmtP(nc, 2)}</td>
                              <td className={`mo td-acum ${noBuy ? 'cn' : cc(na)}`}>{noBuy ? '—' : fmtC(na)}</td>
                              <td className={`mo td-acum ${noBuy ? 'cn' : ccA(av)}`}>{noBuy ? '—' : fmtC(av)}</td>
                            </tr>
                          )
                        })}
                        <tr className="tr">
                          <td>TOTAL · {VIEWS[view].s}</td>
                          <td className="mo">{num(tk)}</td>
                          <td colSpan={4}></td>
                          <td className={`mo ${cc(ta)}`}>{fmtM(ta)}</td>
                          <td colSpan={3}></td>
                          <td className={`mo ${cc(tni)}`}>{fmtM(tni)}</td>
                          <td className="td-acum"></td>
                          <td className={`mo td-acum ${cc(tn)}`}>{fmtM(tn)}</td>
                          <td className={`mo td-acum ${ccA(tv)}`}>{fmtM(tv)}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        <div className="sec">
          <div className="stl">Resumen mensual consolidado · {VIEWS[view].l} (M COP vs precio base Mar-26)</div>
          <div className="sw">
            <table className="sumt">
              <thead>
                <tr>
                  <th>Concepto</th>
                  {months.map((mi) => (
                    <th key={mi} className={isR(mi) ? 'lkh' : ''}>
                      {MESES[mi]}
                      {isR(mi) ? ' 🔒' : ''}
                    </th>
                  ))}
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>
                {(() => {
                  const aM = months.map((mi) => sum(SK.map((_, si) => aImp(si, mi, andP, kgT))))
                  const nM = months.map((mi) => sum(SK.map((_, si) => nImp(si, mi, negPct, kgT))))
                  const vM = aM.map((v, i) => v - nM[i])
                  const cell = (v: number, i: number, f: (n: number) => string) => (
                    <td key={i} className={`${f(v)}${isR(months[i]) ? ' lkc' : ''}`}>
                      {fmtC(v)}
                    </td>
                  )
                  return (
                    <>
                      <tr>
                        <td>Propuesta Andercol</td>
                        {aM.map((v, i) => cell(v, i, cc))}
                        <td className={cc(sum(aM))} style={{ fontWeight: 700 }}>
                          {fmtM(sum(aM), 0)}
                        </td>
                      </tr>
                      <tr>
                        <td>Negociado (real + simulado)</td>
                        {nM.map((v, i) => cell(v, i, cc))}
                        <td className={cc(sum(nM))} style={{ fontWeight: 700 }}>
                          {fmtM(sum(nM), 0)}
                        </td>
                      </tr>
                      <tr>
                        <td style={{ color: 'var(--gn)' }}>Avoidance generado</td>
                        {vM.map((v, i) => cell(v, i, ccA))}
                        <td className={ccA(sum(vM))} style={{ fontWeight: 700 }}>
                          {fmtM(sum(vM), 0)}
                        </td>
                      </tr>
                    </>
                  )
                })()}
              </tbody>
            </table>
          </div>
        </div>

        <div className="sec">
          <div className="stl">Composición del impacto mensual por SKU (M COP vs precio base Mar-26)</div>
          <p style={{ fontSize: 12, color: 'var(--t2)', marginBottom: 8 }}>
            Barras apiladas = propuesta Andercol por SKU. Línea negra = negociado (real hasta el corte, simulado
            después). La brecha es el <b>avoidance</b>. Zona gris = meses reales cerrados.
          </p>
          <div className="cleg">
            {SK.map((s) => (
              <span key={s.r}>
                <span className="cdot" style={{ background: s.col }} />
                {s.n}
              </span>
            ))}
            <span>
              <span
                style={{
                  display: 'inline-block',
                  width: 20,
                  height: 2.5,
                  background: '#18202e',
                  borderRadius: 2,
                  verticalAlign: 'middle',
                }}
              />{' '}
              Negociado (real + simulado)
            </span>
          </div>
          <div style={{ position: 'relative', height: 320, width: '100%' }}>
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={chartRows}>
                <CartesianGrid stroke="rgba(0,0,0,0.07)" />
                <XAxis dataKey="label" tick={{ fill: '#6b7280', fontSize: 10 }} />
                <YAxis
                  tick={{ fill: '#6b7280', fontSize: 11 }}
                  tickFormatter={(v: number) => `${v > 0 ? '+' : ''}${v}M`}
                  label={{
                    value: 'M COP vs precio base Mar-26',
                    angle: -90,
                    position: 'insideLeft',
                    fill: '#6b7280',
                    fontSize: 11,
                  }}
                />
                <Tooltip
                  formatter={(value, name) => {
                    const n = typeof value === 'number' ? value : Number(value)
                    return [`${n >= 0 ? '+' : ''}${n.toFixed(1)} M COP`, String(name)]
                  }}
                />
                {realBand ? (
                  <ReferenceArea x1={realBand.x1} x2={realBand.x2} fill="rgba(100,116,139,0.12)" strokeOpacity={0} />
                ) : null}
                {SK.map((s) => (
                  <Bar key={s.r} dataKey={s.n} stackId="A" fill={s.col + 'BB'} stroke={s.col} strokeWidth={0} />
                ))}
                <Line
                  type="monotone"
                  dataKey="negociado"
                  name="Negociado"
                  stroke="#18202e"
                  strokeWidth={2.5}
                  dot={{ r: 4, fill: '#18202e' }}
                  legendType="none"
                />
                <Legend content={() => null} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="sec">
          <div className="stl">Alternativa de suministro — OCQ</div>
          <div className="og">
            {OCQ.map((o, i) => {
              const si = o.si
              const aL = lastReal(si)
              const p = ocqP[i]
              const diff = p - aL
              const pct = (diff / aL) * 100
              const kgSim = kgT[si] * (NM - 1 - CORTE)
              const pot = (aL - p) * kgSim
              let capKg = 0
              let cap = 0
              o.buys.forEach((b) => {
                capKg += b.kg
                cap += b.kg * andRealAt(si, b.m) - b.pay
              })
              return (
                <div className="oc" key={o.ref}>
                  <div className="och">
                    <div>
                      <p>{o.lbl}</p>
                      <h3>OCQ — ref. {o.ref}</h3>
                    </div>
                    <span className={`bdg ${o.bdg[0]}`}>{o.bdg[1]}</span>
                  </div>
                  <div className="ocb">
                    <div className="or2">
                      <span className="ol">Precio OCQ ref. {o.ref} (COP/kg) 🖊</span>
                      <input
                        className="ocq-in"
                        type="number"
                        step={1}
                        value={p}
                        onChange={(e) => onOcq(i, e.target.value)}
                      />
                    </div>
                    <div className="or2">
                      <span className="ol">Último precio real Andercol ({MESES[CORTE]})</span>
                      <span className="ov">{num(aL)} COP/kg</span>
                    </div>
                    <div className="or2">
                      <span className="ol">Diferencia OCQ vs Andercol por kg</span>
                      <span className={`ov ${diff < 0 ? 'cg' : diff > 0 ? 'cr' : 'cn'}`}>
                        {(diff > 0 ? '+' : diff < 0 ? '−' : '') + num(Math.abs(diff))} · {fmtP(pct, 1)}
                      </span>
                    </div>
                    <div className="or2">
                      <span className="ol">
                        Kg simulados Andercol {MESES[CORTE + 1]} → {MESES[NM - 1]}
                      </span>
                      <span className="ov">{num(kgSim)} kg</span>
                    </div>
                    <div className="odv">
                      <div className="or2">
                        <span className="ol">Ahorro potencial si se cambia a OCQ</span>
                        <span className={`ov ${pot > 5e4 ? 'cg' : pot < -5e4 ? 'cr' : 'cn'}`} style={{ fontSize: 14 }}>
                          {bigS(pot)}
                        </span>
                      </div>
                      <div className="or2">
                        <span className="ol">Ahorro ya capturado Ene-26 → {MESES[CORTE]}</span>
                        <span className={`ov ${cap > 5e4 ? 'cg' : cap < -5e4 ? 'cr' : 'cn'}`} style={{ fontSize: 14 }}>
                          {bigS(cap)}
                        </span>
                      </div>
                      <p className="oht">
                        {num(capKg)} kg comprados a OCQ vs precio Andercol del mismo mes.
                        {pot < 0 ? ' OCQ hoy está por encima del último precio Andercol.' : ''}
                      </p>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        <div className="ft">
          Área de Compras &nbsp;·&nbsp; Uso interno y confidencial &nbsp;·&nbsp; Datos: BI Compras 1 al {FECHA_CORTE}
        </div>
      </div>
    </div>
  )
}
