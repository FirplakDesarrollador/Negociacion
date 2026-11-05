// lib/simulador/calculations.ts

import { Sku, EstadoSimulacion, CORTE } from './types'

export function obtenerUltimoPrecioReal(sku: Sku, corte: number): number {
  for (let j = corte; j >= 0; j--) {
    const p = sku.preciosReales[j]
    if (p != null) return p
  }
  return sku.precioBaseMar26
}

export function calcularPrecioNegociado(
  sku: Sku,
  skuIndex: number,
  mesIndex: number,
  estado: EstadoSimulacion
): number | null {
  if (mesIndex <= estado.corte) {
    return sku.preciosReales[mesIndex] ?? null
  }

  let precio = obtenerUltimoPrecioReal(sku, estado.corte)
  for (let j = estado.corte + 1; j <= mesIndex; j++) {
    const pct = estado.porcentajesNegociados[skuIndex]?.[j] ?? 0
    precio = precio * (1 + pct / 100)
  }
  return Math.round(precio)
}

export function kgDelMes(sku: Sku, skuIndex: number, mesIndex: number, estado: EstadoSimulacion): number {
  if (mesIndex <= estado.corte) {
    return sku.kgReales[mesIndex] ?? 0
  }
  return estado.kgSimulados[skuIndex] ?? sku.kgSimuladoDefault
}

export function impactoAndercol(
  sku: Sku,
  skuIndex: number,
  mesIndex: number,
  estado: EstadoSimulacion
): number {
  const kg = kgDelMes(sku, skuIndex, mesIndex, estado)
  const precioProp = estado.preciosPropuestos[skuIndex][mesIndex]
  return kg * (precioProp - sku.precioBaseMar26)
}

export function impactoNegociado(
  sku: Sku,
  skuIndex: number,
  mesIndex: number,
  estado: EstadoSimulacion
): number {
  const kg = kgDelMes(sku, skuIndex, mesIndex, estado)
  const precioNeg = calcularPrecioNegociado(sku, skuIndex, mesIndex, estado)
  if (precioNeg == null) return 0
  return kg * (precioNeg - sku.precioBaseMar26)
}

export function avoidance(
  sku: Sku,
  skuIndex: number,
  mesIndex: number,
  estado: EstadoSimulacion
): number {
  return impactoAndercol(sku, skuIndex, mesIndex, estado) - impactoNegociado(sku, skuIndex, mesIndex, estado)
}

export function totalesDeVista(
  skus: Sku[],
  meses: number[],
  estado: EstadoSimulacion
) {
  let totalAndercol = 0
  let totalNegociado = 0

  for (const mi of meses) {
    skus.forEach((sku, si) => {
      totalAndercol += impactoAndercol(sku, si, mi, estado)
      totalNegociado += impactoNegociado(sku, si, mi, estado)
    })
  }

  return {
    totalAndercol,
    totalNegociado,
    avoidance: totalAndercol - totalNegociado,
  }
}
