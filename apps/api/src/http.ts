import type { ApiError, ApiErrorCode, ValidationIssue } from "@secret-friend/contract";
import type { Context } from "hono";
import type { ContentfulStatusCode } from "hono/utils/http-status";
import type { AppEnv } from "./env.ts";

const STATUS: Readonly<Record<ApiErrorCode, ContentfulStatusCode>> = {
  INVALID_INPUT: 400,
  UNAUTHORIZED: 401,
  NOT_CLAIMED: 403,
  NOT_FOUND: 404,
  NAME_TAKEN: 409,
  ALREADY_CLAIMED: 409,
  TOO_MANY_ATTEMPTS: 429,
};

export const fail = <E extends AppEnv>(
  c: Context<E>,
  error: ApiErrorCode,
  issues?: readonly ValidationIssue[],
): Response => c.json<ApiError>(issues ? { error, issues } : { error }, STATUS[error]);

/** Cuerpo JSON o `undefined` si no se puede leer; la validación decide después. */
export const readJson = async <E extends AppEnv>(c: Context<E>): Promise<unknown> => {
  try {
    return await c.req.json();
  } catch {
    return undefined;
  }
};
