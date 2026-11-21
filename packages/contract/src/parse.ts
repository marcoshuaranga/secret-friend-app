import { err, ok, type Result } from "@secret-friend/core";
import * as z from "zod/mini";

export interface ValidationIssue {
  readonly path: string;
  readonly message: string;
}

/** Valida en el borde y devuelve un valor (no lanza): `parseWith(schema)(entrada)`. */
export const parseWith =
  <S extends z.ZodMiniType>(schema: S) =>
  (input: unknown): Result<z.infer<S>, readonly ValidationIssue[]> => {
    const parsed = z.safeParse(schema, input);
    return parsed.success
      ? ok(parsed.data)
      : err(
          parsed.error.issues.map((issue) => ({
            path: issue.path.join("."),
            message: issue.message,
          })),
        );
  };
