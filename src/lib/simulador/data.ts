// lib/simulador/data.ts

import { Sku, CORTE, NM } from './types'

export const SKUS: Sku[] = [
  {
    id: '4891',
    name: 'RESINA FV 4891',
    ref: '9057232',
    precioBaseMar26: 11052,
    share: 14.6,
    esObjetivo: false,
    kgSimuladoDefault: 5188,
    nota: 'OCQ ref. 3700 en compra activa desde May-26. Andercol bajó a 9.000 en Sep-26.',
    kgReales: [5290,5980,5980,5520,2300,5750,5980,5290,3450],
    preciosReales: [11052,11052,11052,11052,11954,11954,11954,11117,9000],
    preciosPropuestosOriginales: [null,null,null,11494,11954,12432,12432,12432,12432,12432,12432,12432,12432,12432,12432,12432],
  },
  {
    id: 'm202',
    name: 'CRISTALAN M202',
    ref: '9056967',
    precioBaseMar26: 10569,
    share: 53.4,
    esObjetivo: false,
    kgSimuladoDefault: 22202,
    nota: 'Propuesta Andercol: −4,64% Abr, +2% May, +4% Jun (10.714). OCQ ref. 4709 en evaluación.',
    kgReales: [12420,25990,20721,11040,18400,20930,28290,20930,23000],
    preciosReales: [10569,10569,10569,10100,10302,10508,10508,10193,9887],
    preciosPropuestosOriginales: [null,null,null,10100,10302,10714,10714,10714,10714,10714,10714,10714,10714,10714,10714,10714],
  },
  {
    id: '898gc',
    name: 'GELCOAT BLANCO 898GC',
    ref: '9057071',
    precioBaseMar26: 18050,
    share: 29.6,
    esObjetivo: true,
    kgSimuladoDefault: 6371,
    nota: '★ Objetivo principal. Propuesta Andercol: +12,5% acumulado Abr–Jun (20.304).',
    kgReales: [4720,7320,6840,6540,4340,6240,8540,5380,6940],
    preciosReales: [18050,18050,18050,18050,18321,18687,18687,18126,18126],
    preciosPropuestosOriginales: [null,null,null,18772,19523,20304,20304,20304,20304,20304,20304,20304,20304,20304,20304,20304],
  },
  {
    id: '2870',
    name: 'RESINA 2870 MOLDES',
    ref: '9056846',
    precioBaseMar26: 18928,
    share: 0.5,
    esObjetivo: false,
    kgSimuladoDefault: 0,
    nota: 'Compra poco frecuente. Kg simulados en 0: digita Kg/mes solo si planeas comprar.',
    kgReales: [0,460,0,460,0,0,0,0,0],
    preciosReales: [null,18928,null,18928,null,null,null,null,null],
    preciosPropuestosOriginales: [null,null,null,19496,20081,20683,20683,20683,20683,20683,20683,20683,20683,20683,20683,20683],
  },
  {
    id: '889g1',
    name: 'GELCOAT 889G1',
    ref: '9056915',
    precioBaseMar26: 25458,
    share: 0.7,
    esObjetivo: false,
    kgSimuladoDefault: 0,
    nota: 'Compra poco frecuente. Kg simulados en 0: digita Kg/mes solo si planeas comprar.',
    kgReales: [0,0,0,440,0,0,0,440,0],
    preciosReales: [null,null,null,25458,null,null,null,26943,null],
    preciosPropuestosOriginales: [null,null,null,26476,27535,28637,28637,28637,28637,28637,28637,28637,28637,28637,28637,28637],
  },
]

export function crearEstadoInicial() {
  return {
    corte: CORTE,
    kgSimulados: SKUS.map(s => s.kgSimuladoDefault),
    preciosPropuestos: SKUS.map(s =>
      s.preciosPropuestosOriginales.map(v => v ?? s.precioBaseMar26)
    ),
    porcentajesNegociados: SKUS.map(() => Array(NM).fill(0)),
  }
}
