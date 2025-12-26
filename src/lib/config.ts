/**
 * Configurações do sistema
 */

// Treinadores que não devem aparecer no dashboard
// (ex: saíram da assessoria, são administrativos, etc.)
export const TREINADORES_EXCLUIDOS = [
  'Caio Lima',
  'Lucia da Silva Magalhães',
];

/**
 * Verifica se um treinador deve ser excluído
 */
export function isTreinadorExcluido(nome: string): boolean {
  const nomeNormalizado = nome.trim().toLowerCase();
  return TREINADORES_EXCLUIDOS.some(
    (excluido) => nomeNormalizado === excluido.toLowerCase()
  );
}
