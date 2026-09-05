/**
 * CasaControle - Módulo de Precisão Numérica e Aritmética Segura
 * 
 * Evita erros clássicos de ponto flutuante do JavaScript (ex: 0.1 + 0.2 = 0.30000000000000004)
 * e garante que estoques e valores financeiros não sofram deriva matemática.
 */

/**
 * Arredonda um número para um número especificado de casas decimais com precisão.
 */
export function roundPrecision(num: number, decimals: number = 3): number {
  if (isNaN(num) || !isFinite(num)) return 0;
  const factor = Math.pow(10, decimals);
  return Math.round((num + Number.EPSILON) * factor) / factor;
}

/**
 * Adição segura com controle de casas decimais.
 */
export function safeAdd(a: number, b: number, decimals: number = 3): number {
  return roundPrecision(Number(a || 0) + Number(b || 0), decimals);
}

/**
 * Subtração segura com controle de casas decimais.
 */
export function safeSub(a: number, b: number, decimals: number = 3): number {
  return roundPrecision(Number(a || 0) - Number(b || 0), decimals);
}

/**
 * Multiplicação segura.
 */
export function safeMul(a: number, b: number, decimals: number = 3): number {
  return roundPrecision(Number(a || 0) * Number(b || 0), decimals);
}

/**
 * Divisão segura evitando divisão por zero.
 */
export function safeDiv(a: number, b: number, fallback: number = 0, decimals: number = 3): number {
  const divisor = Number(b);
  if (isNaN(divisor) || divisor === 0) return fallback;
  return roundPrecision(Number(a || 0) / divisor, decimals);
}

/**
 * Garante que um valor nunca seja menor que zero (para controle rígido de estoque).
 */
export function clampNonNegative(num: number, decimals: number = 3): number {
  const rounded = roundPrecision(num, decimals);
  return rounded < 0 ? 0 : rounded;
}

/**
 * Verifica se um valor é um número válido e positivo.
 */
export function isValidPositiveNumber(val: any): boolean {
  const num = Number(val);
  return !isNaN(num) && isFinite(num) && num > 0;
}
