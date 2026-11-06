export type ViewKey = 'y26' | 'ytd' | 'hz'

export type Sku = {
  n: string
  r: string
  pa: number
  col: string
  sh: number
  hl: boolean
  kgDef: number
  pp: (number | null)[]
  rk: number[]
  rp: (number | null)[]
  nt: string
}

export type OcqAlt = {
  si: number
  ref: string
  lbl: string
  bdg: [string, string]
  def: number
  buys: { m: number; kg: number; pay: number }[]
}

export type ViewDef = {
  l: string
  s: string
  a: number
  b: number
}

export type ScenarioSnap = {
  negPct: number[][]
  andP: number[][]
  kgT: number[]
  ocqP: number[]
  desc: string
}

export type Totals = {
  tA: number
  tN: number
  tV: number
  tL: number
  open: number
}

export type Dim26 = {
  tot: number
  sim: number
  resto: number
}

export type SimState = {
  view: ViewKey
  kgT: number[]
  andP: number[][]
  negPct: number[][]
  ocqP: number[]
  scenarios: Record<'A' | 'B' | 'C', ScenarioSnap | null>
  activeScen: 'A' | 'B' | 'C' | null
  openSkus: Record<number, boolean>
  globalPct: string
  skuPcts: Record<number, string>
  calcSku: string
  calcCop: string
  calcPct: string
  calcFrom: number
  calcMode: 'cop' | 'pct'
  isReadOnly: boolean
  exportDate: string
}
