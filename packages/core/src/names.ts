/**
 * Clave de comparación de un nombre: sin tildes, sin distinguir mayúsculas y con
 * espacios colapsados. "Aná  López" y "ana lopez" son el mismo participante.
 */
export const nameKey = (name: string): string =>
  name
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLocaleLowerCase("es")
    .trim()
    .replace(/\s+/g, " ");

export const hasUniqueNames = (names: readonly string[]): boolean =>
  new Set(names.map(nameKey)).size === names.length;
