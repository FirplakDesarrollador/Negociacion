import type { OcqAlt, Sku, ViewDef, ViewKey } from './types'

export const MESES = [
  'Ene-26', 'Feb-26', 'Mar-26', 'Abr-26', 'May-26', 'Jun-26', 'Jul-26', 'Ago-26',
  'Sep-26', 'Oct-26', 'Nov-26', 'Dic-26', 'Ene-27', 'Feb-27', 'Mar-27', 'Abr-27',
] as const

export const NM = 16
export const CORTE = 8
export const FECHA_CORTE = '30-Sep-2026'
export const G25_AND = 5087163771.69
export const G25_INV = 459593952
export const G25_OCQ = 0
export const R26_TOT = 3665758793.85
export const R26_AND = 3500717593.85
export const R26_RESTO = 207434993.85
export const MIX_NOTE =
  'Meses con varios precios facturados (precio definido por Compras): M202 Ene, Feb, Mar y Abr · 4891 Abr · 898GC May y Ago.'
export const SLMIN = -10
export const SLMAX = 20

export const SK: Sku[] = [
  {
    n: 'RESINA FV 4891', r: '9057232', pa: 11052, col: '#2563eb', sh: 14.6, hl: false, kgDef: 5188,
    pp: [null, null, null, 11494, 11954, 12432, 12432, 12432, 12432, 12432, 12432, 12432, 12432, 12432, 12432, 12432],
    rk: [5290, 5980, 5980, 5520, 2300, 5750, 5980, 5290, 3450],
    rp: [11052, 11052, 11052, 11052, 11954, 11954, 11954, 11117, 9000],
    nt: 'OCQ ref. 3700 en compra activa desde May-26. Andercol bajó a 9.000 en Sep-26.',
  },
  {
    n: 'CRISTALAN M202', r: '9056967', pa: 10569, col: '#d97706', sh: 53.4, hl: false, kgDef: 22202,
    pp: [null, null, null, 10100, 10302, 10714, 10714, 10714, 10714, 10714, 10714, 10714, 10714, 10714, 10714, 10714],
    rk: [12420, 25990, 20721, 11040, 18400, 20930, 28290, 20930, 23000],
    rp: [10569, 10569, 10569, 10100, 10302, 10508, 10508, 10193, 9887],
    nt: 'Propuesta Andercol: −4,64% Abr, +2% May, +4% Jun (10.714). OCQ ref. 4709 en evaluación.',
  },
  {
    n: 'GELCOAT BLANCO 898GC', r: '9057071', pa: 18050, col: '#dc2626', sh: 29.6, hl: true, kgDef: 6371,
    pp: [null, null, null, 18772, 19523, 20304, 20304, 20304, 20304, 20304, 20304, 20304, 20304, 20304, 20304, 20304],
    rk: [4720, 7320, 6840, 6540, 4340, 6240, 8540, 5380, 6940],
    rp: [18050, 18050, 18050, 18050, 18321, 18687, 18687, 18126, 18126],
    nt: '★ Objetivo principal. Propuesta Andercol: +12,5% acumulado Abr–Jun (20.304).',
  },
  {
    n: 'RESINA 2870 MOLDES', r: '9056846', pa: 18928, col: '#059669', sh: 0.5, hl: false, kgDef: 0,
    pp: [null, null, null, 19496, 20081, 20683, 20683, 20683, 20683, 20683, 20683, 20683, 20683, 20683, 20683, 20683],
    rk: [0, 460, 0, 460, 0, 0, 0, 0, 0],
    rp: [null, 18928, null, 18928, null, null, null, null, null],
    nt: 'Compra poco frecuente. Kg simulados en 0: digita Kg/mes solo si planeas comprar.',
  },
  {
    n: 'GELCOAT 889G1', r: '9056915', pa: 25458, col: '#0891b2', sh: 0.7, hl: false, kgDef: 0,
    pp: [null, null, null, 26476, 27535, 28637, 28637, 28637, 28637, 28637, 28637, 28637, 28637, 28637, 28637, 28637],
    rk: [0, 0, 0, 440, 0, 0, 0, 440, 0],
    rp: [null, null, null, 25458, null, null, null, 26943, null],
    nt: 'Compra poco frecuente. Kg simulados en 0: digita Kg/mes solo si planeas comprar.',
  },
]

export const OCQ: OcqAlt[] = [
  {
    si: 1, ref: '4709', lbl: 'M202 → contratipo OCQ', bdg: ['bdgw', 'En evaluación'], def: 8500,
    buys: [{ m: 4, kg: 460, pay: 3910000 }, { m: 5, kg: 230, pay: 1955000 }],
  },
  {
    si: 0, ref: '3700', lbl: 'Resina 4891 → contratipo OCQ', bdg: ['bdgg', 'Ensayo exitoso'], def: 9050,
    buys: [
      { m: 2, kg: 230, pay: 1725000 }, { m: 4, kg: 440, pay: 3740000 }, { m: 5, kg: 1540, pay: 13904000 },
      { m: 6, kg: 2200, pay: 19965000 }, { m: 7, kg: 1540, pay: 13937000 }, { m: 8, kg: 2200, pay: 19910000 },
    ],
  },
]

export const VIEWS: Record<ViewKey, ViewDef> = {
  y26: { l: 'Año 2026 completo', s: 'Año 2026', a: 0, b: 11 },
  ytd: { l: `Año corrido · Ene-26 → ${MESES[CORTE]}`, s: 'Año corrido', a: 0, b: CORTE },
  hz: { l: 'Horizonte negociación · Abr-26 → Abr-27', s: 'Horizonte', a: 3, b: 15 },
}

export function initialAndP(): number[][] {
  return SK.map((s) => s.pp.map((v) => (v == null ? s.pa : v)))
}

export function initialNegPct(): number[][] {
  return SK.map(() => Array(NM).fill(0))
}

export function initialKgT(): number[] {
  return SK.map((s) => s.kgDef)
}

export function initialOcqP(): number[] {
  return OCQ.map((o) => o.def)
}
