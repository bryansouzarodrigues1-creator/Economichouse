/**
 * CasaControle - Módulo de Auditoria e Conversão Segura de Unidades
 * 
 * Regra estrita:
 * Apenas conversões métricas comprovadas (ex: kg <-> g, L <-> ml) são permitidas.
 * Unidades discretas (ex: unidade, pacote, caixa, dúzia) NUNCA são convertidas
 * arbitrariamente para peso ou volume.
 */

import { ProductUnit } from '../types';
import { roundPrecision } from './math';

export const VALID_UNITS: readonly ProductUnit[] = [
  'kg',
  'g',
  'L',
  'ml',
  'unidade',
  'pacote',
  'caixa',
  'rolo',
  'dúzia',
  'bandeja'
] as const;

export type UnitType = 'mass' | 'volume' | 'discrete';

const UNIT_CLASSIFICATION: Record<string, UnitType> = {
  kg: 'mass',
  g: 'mass',
  l: 'volume',
  ml: 'volume',
  unidade: 'discrete',
  pacote: 'discrete',
  caixa: 'discrete',
  rolo: 'discrete',
  dúzia: 'discrete',
  duzia: 'discrete',
  bandeja: 'discrete',
};

/**
 * Normaliza o texto da unidade para comparação consistente
 */
export function normalizeUnit(unit: string): string {
  if (!unit) return 'unidade';
  const clean = unit.trim().toLowerCase();
  if (clean === 'litro' || clean === 'litros' || clean === 'l') return 'L';
  if (clean === 'quilo' || clean === 'quilos' || clean === 'kilo' || clean === 'kg') return 'kg';
  if (clean === 'grama' || clean === 'gramas' || clean === 'g') return 'g';
  if (clean === 'mililitro' || clean === 'mililitros' || clean === 'ml') return 'ml';
  if (clean === 'un' || clean === 'und' || clean === 'unid' || clean === 'unidade' || clean === 'unidades') return 'unidade';
  if (clean === 'pct' || clean === 'pacote' || clean === 'pacotes') return 'pacote';
  if (clean === 'cx' || clean === 'caixa' || clean === 'caixas') return 'caixa';
  if (clean === 'duzia' || clean === 'dúzia' || clean === 'dúzias') return 'dúzia';
  if (clean === 'rolo' || clean === 'rolos') return 'rolo';
  if (clean === 'bandeja' || clean === 'bandejas') return 'bandeja';
  return unit.trim();
}

/**
 * Retorna se duas unidades são do mesmo tipo físico (ex: kg e g são massa)
 */
export function areUnitsCompatible(unitA: string, unitB: string): boolean {
  const normA = normalizeUnit(unitA).toLowerCase();
  const normB = normalizeUnit(unitB).toLowerCase();

  if (normA === normB) return true;

  const typeA = UNIT_CLASSIFICATION[normA];
  const typeB = UNIT_CLASSIFICATION[normB];

  if (!typeA || !typeB) return false;
  // Apenas massa e volume podem ser convertidos entre si
  return typeA === typeB && typeA !== 'discrete';
}

/**
 * Converte com segurança uma quantidade entre duas unidades compatíveis.
 * Retorna null se as unidades forem incompatíveis (ex: 5 kg para unidades).
 */
export function convertUnitQuantity(
  quantity: number,
  fromUnit: string,
  toUnit: string
): number | null {
  const normFrom = normalizeUnit(fromUnit);
  const normTo = normalizeUnit(toUnit);

  if (normFrom === normTo) {
    return roundPrecision(quantity, 3);
  }

  // Conversão de Massa: kg <-> g
  if (normFrom === 'kg' && normTo === 'g') {
    return roundPrecision(quantity * 1000, 3);
  }
  if (normFrom === 'g' && normTo === 'kg') {
    return roundPrecision(quantity / 1000, 3);
  }

  // Conversão de Volume: L <-> ml
  if (normFrom === 'L' && normTo === 'ml') {
    return roundPrecision(quantity * 1000, 3);
  }
  if (normFrom === 'ml' && normTo === 'L') {
    return roundPrecision(quantity / 1000, 3);
  }

  // Unidades incompatíveis (ex: dúzia para kg, unidade para pacote)
  return null;
}

/**
 * Formata amigavelmente a quantidade e a unidade respeitando discretos vs contínuos.
 */
export function formatUnitDisplay(qty: number, unit: string): string {
  const norm = normalizeUnit(unit);
  const isDiscrete = ['unidade', 'pacote', 'caixa', 'rolo', 'dúzia', 'bandeja'].includes(norm.toLowerCase());

  if (isDiscrete) {
    const formatted = Math.round(qty);
    return `${formatted} ${norm}${formatted > 1 && !norm.endsWith('s') && norm !== 'dúzia' ? 's' : ''}`;
  }

  // Decimal
  const rounded = roundPrecision(qty, 2);
  return `${rounded.toLocaleString('pt-BR')} ${norm}`;
}

export const PRODUCT_UNITS = VALID_UNITS;

/**
 * Retorna as unidades compatíveis para seleção em formulários de receitas
 */
export function getCompatibleUnits(unit: string): ProductUnit[] {
  const norm = normalizeUnit(unit).toLowerCase();
  const type = UNIT_CLASSIFICATION[norm];
  if (type === 'mass') {
    return ['kg', 'g'];
  }
  if (type === 'volume') {
    return ['L', 'ml'];
  }
  return [unit as ProductUnit, 'unidade'];
}
