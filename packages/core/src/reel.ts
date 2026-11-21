import type { RandomInt } from "./random.ts";

/** Cantidad de nombres que recorre el carrete, incluido el resultado final. */
export const REEL_LENGTH = 36;
/** Posiciones antes del final en que el resultado pasa como "casi acierto". */
const NEAR_MISS_OFFSET = 4;

/**
 * Tira de nombres para la ruleta (RF-8, RF-9, RF-15). Solo contiene a los demás
 * participantes, nunca repite un nombre seguido, termina en el resultado real y lo
 * hace pasar poco antes del final como "casi acierto". El resultado no se decide aquí.
 */
export const buildReel =
  (randomInt: RandomInt) =>
  (result: string, others: readonly string[], length: number = REEL_LENGTH): readonly string[] => {
    const pool = others.includes(result) ? others : [...others, result];
    const isForced = (index: number): boolean =>
      index === length - 1 || index === length - 1 - NEAR_MISS_OFFSET;
    // Se construye desde el final hacia atrás para que el "casi acierto" siempre encaje,
    // incluso con solo dos nombres que deben alternarse.
    const pick = (index: number, following: string | undefined): string => {
      if (isForced(index)) return result;
      const candidates = pool.filter(
        (name) => name !== following && !(isForced(index - 1) && name === result),
      );
      return candidates[randomInt(candidates.length)] ?? result;
    };
    const reel: string[] = [];
    for (let index = length - 1; index >= 0; index--) reel.unshift(pick(index, reel[0]));
    return Object.freeze(reel);
  };
