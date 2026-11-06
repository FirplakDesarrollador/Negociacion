import {
  CORTE, G25_AND, G25_INV, G25_OCQ, MESES, NM, R26_RESTO, R26_TOT, SK, VIEWS,
} from './data'
import { fmtP } from './format'
import type { Dim26, ScenarioSnap, Totals, ViewKey } from './types'

export const isR = (mi: number) => mi <= CORTE

export function kgM(si: number, mi: number, kgT: number[]): number {
  return isR(mi) ? (SK[si].rk[mi] || 0) : kgT[si]
}

export function realPrevP(si: number, mi: number): number {
  for (let j = mi - 1; j >= 0; j--) {
    const p = SK[si].rp[j]
    if (p != null) return p
  }
  return SK[si].pa
}

export function lastReal(si: number): number {
  return realPrevP(si, CORTE + 1)
}

export function negP(si: number, mi: number, negPct: number[][]): number | null {
  if (isR(mi)) return SK[si].rp[mi]
  let p = lastReal(si)
  for (let j = CORTE + 1; j <= mi; j++) p = p * (1 + negPct[si][j] / 100)
  return Math.round(p)
}

export function prevNegP(si: number, mi: number, negPct: number[][]): number {
  if (isR(mi)) return realPrevP(si, mi)
  return mi === CORTE + 1 ? lastReal(si) : (negP(si, mi - 1, negPct) as number)
}

export function aImp(si: number, mi: number, andP: number[][], kgT: number[]): number {
  return kgM(si, mi, kgT) * (andP[si][mi] - SK[si].pa)
}

export function nImp(si: number, mi: number, negPct: number[][], kgT: number[]): number {
  const p = negP(si, mi, negPct)
  return p == null ? 0 : kgM(si, mi, kgT) * (p - SK[si].pa)
}

export function nIncr(si: number, mi: number, negPct: number[][], kgT: number[]): number {
  const p = negP(si, mi, negPct)
  return p == null ? 0 : kgM(si, mi, kgT) * (p - prevNegP(si, mi, negPct))
}

export function aStep(si: number, mi: number, andP: number[][]): number {
  const prev = mi === 0 ? SK[si].pa : andP[si][mi - 1]
  return (andP[si][mi] / prev - 1) * 100
}

export function aCum(si: number, mi: number, andP: number[][]): number {
  return (andP[si][mi] / SK[si].pa - 1) * 100
}

export function nStep(si: number, mi: number, negPct: number[][]): number | null {
  if (!isR(mi)) return negPct[si][mi]
  const p = negP(si, mi, negPct)
  return p == null ? null : (p / prevNegP(si, mi, negPct) - 1) * 100
}

export function nCum(si: number, mi: number, negPct: number[][]): number | null {
  const p = negP(si, mi, negPct)
  return p == null ? null : (p / SK[si].pa - 1) * 100
}

export function andRealAt(si: number, m: number): number {
  const p = SK[si].rp[m]
  return p != null ? p : realPrevP(si, m)
}

export function vm(view: ViewKey): number[] {
  const v = VIEWS[view]
  const r: number[] = []
  for (let i = v.a; i <= v.b; i++) r.push(i)
  return r
}

export function sum(a: number[]): number {
  return a.reduce((x, y) => x + y, 0)
}

export function totals(view: ViewKey, andP: number[][], negPct: number[][], kgT: number[]): Totals {
  let tA = 0, tN = 0, tL = 0, open = 0
  vm(view).forEach((mi) => {
    if (!isR(mi)) open++
    SK.forEach((_, si) => {
      tA += aImp(si, mi, andP, kgT)
      tN += nImp(si, mi, negPct, kgT)
      if (!isR(mi)) tL += kgT[si] * (andP[si][mi] - lastReal(si))
    })
  })
  return { tA, tN, tV: tA - tN, tL, open }
}

export function dim26(negPct: number[][], kgT: number[]): Dim26 {
  let sim = 0
  const nOpen = Math.max(0, 11 - CORTE)
  for (let mi = CORTE + 1; mi <= 11; mi++) {
    SK.forEach((_, si) => {
      sim += kgT[si] * (negP(si, mi, negPct) as number)
    })
  }
  const resto = (R26_RESTO / (CORTE + 1)) * nOpen
  return { tot: R26_TOT + sim + resto, sim, resto }
}

export function d25(): number {
  return G25_AND + G25_INV + G25_OCQ
}

export function chartData(view: ViewKey, andP: number[][], negPct: number[][], kgT: number[]) {
  const m = vm(view)
  return {
    labels: m.map((mi) => MESES[mi]),
    realFlags: m.map(isR),
    bars: SK.map((_, si) => m.map((mi) => Math.round(aImp(si, mi, andP, kgT) / 1e5) / 10)),
    line: m.map((mi) => Math.round(sum(SK.map((_, si) => nImp(si, mi, negPct, kgT))) / 1e5) / 10),
    months: m,
  }
}

export function describeScenario(negPct: number[][]): string {
  const info = SK.map((s, si) => {
    const p: number[] = []
    for (let mi = CORTE + 1; mi < NM; mi++) p.push(Math.round(negPct[si][mi] * 100) / 100)
    return {
      name: s.n,
      same: new Set(p.map((x) => x.toFixed(2))).size === 1,
      val: p[0],
      min: Math.min(...p),
      max: Math.max(...p),
    }
  })
  const g = info.every((s) => s.same && Math.abs(s.val - info[0].val) < 0.01)
  if (g) {
    return info[0].val === 0
      ? 'Meses simulados al último precio real pagado'
      : `${fmtP(info[0].val, 1)} incremental/mes en todos los SKU`
  }
  return info
    .map((s) =>
      s.same
        ? `${s.name}: ${fmtP(s.val, 1)}/mes`
        : `${s.name}: ${fmtP(s.min, 1)} a ${fmtP(s.max, 1)}/mes`,
    )
    .join(' · ')
}

export function snapState(
  negPct: number[][],
  andP: number[][],
  kgT: number[],
  ocqP: number[],
): ScenarioSnap {
  return {
    negPct: negPct.map((a) => [...a]),
    andP: andP.map((a) => [...a]),
    kgT: [...kgT],
    ocqP: [...ocqP],
    desc: describeScenario(negPct),
  }
}

export function skuSharePct(): number {
  return SK.reduce((a, s) => a + s.sh, 0)
}
