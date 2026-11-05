// lib/simulador/types.ts

export type Sku = {
  id: string
  name: string
  ref: string
  precioBaseMar26: number
  share: number
  esObjetivo: boolean
  kgSimuladoDefault: number
  nota?: string
  kgReales: (number | null)[]
  preciosReales: (number | null)[]
  preciosPropuestosOriginales: (number | null)[]
}

export type EstadoSimulacion = {
  corte: number
  kgSimulados: number[]
  preciosPropuestos: number[][]
  porcentajesNegociados: number[][]
}

export const MESES = [
  'Ene-26','Feb-26','Mar-26','Abr-26','May-26','Jun-26',
  'Jul-26','Ago-26','Sep-26','Oct-26','Nov-26','Dic-26',
  'Ene-27','Feb-27','Mar-27','Abr-27'
] as const

export const CORTE = 8 // Sep-26
export const NM = MESES.length
