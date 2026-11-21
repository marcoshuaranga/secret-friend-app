import type { RandomInt } from "./random.ts";
import { err, ok, type Result } from "./result.ts";

export const MIN_PARTICIPANTS = 3;
export const MAX_PARTICIPANTS = 50;
const MAX_ATTEMPTS = 10_000;

export interface Assignment {
  readonly giver: string;
  readonly receiver: string;
}

export type DrawError =
  | { readonly kind: "too_few_participants"; readonly min: number; readonly received: number }
  | { readonly kind: "too_many_participants"; readonly max: number; readonly received: number }
  | { readonly kind: "duplicate_participants" }
  | { readonly kind: "draw_failed" };

const shuffled =
  (randomInt: RandomInt) =>
  (items: readonly string[]): readonly string[] => {
    const copy = [...items];
    for (let i = copy.length - 1; i > 0; i--) {
      const j = randomInt(i + 1);
      const a = copy[i];
      const b = copy[j];
      if (a === undefined || b === undefined) continue;
      copy[i] = b;
      copy[j] = a;
    }
    return copy;
  };

const hasFixedPoint = (original: readonly string[], permuted: readonly string[]): boolean =>
  original.some((name, index) => name === permuted[index]);

const validate = (participants: readonly string[]): DrawError | undefined => {
  if (participants.length < MIN_PARTICIPANTS)
    return { kind: "too_few_participants", min: MIN_PARTICIPANTS, received: participants.length };
  if (participants.length > MAX_PARTICIPANTS)
    return { kind: "too_many_participants", max: MAX_PARTICIPANTS, received: participants.length };
  if (new Set(participants).size !== participants.length) return { kind: "duplicate_participants" };
  return undefined;
};

/**
 * Sorteo sin puntos fijos (derangement), uniforme entre todos los repartos válidos:
 * se baraja por Fisher-Yates y se descarta si alguien se toca a sí mismo (~1/e de éxito).
 * Función pura: la aleatoriedad se inyecta.
 */
export const draw =
  (randomInt: RandomInt) =>
  (participants: readonly string[]): Result<readonly Assignment[], DrawError> => {
    const invalid = validate(participants);
    if (invalid) return err(invalid);

    const shuffle = shuffled(randomInt);
    for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
      const receivers = shuffle(participants);
      if (!hasFixedPoint(participants, receivers)) {
        return ok(
          Object.freeze(
            participants.map((giver, index) =>
              Object.freeze({ giver, receiver: receivers[index] ?? giver }),
            ),
          ),
        );
      }
    }
    return err({ kind: "draw_failed" });
  };
