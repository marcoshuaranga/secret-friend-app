import { type RandomInt, secureRandomInt } from "@secret-friend/core";
import { randomToken } from "./lib/crypto.ts";

/** Efectos inyectados: reloj, aleatoriedad y costo del hash de contraseñas. */
export interface Deps {
  readonly now: () => number;
  readonly randomInt: RandomInt;
  readonly randomToken: (bytes?: number) => string;
  readonly passwordIterations: number;
  /** `false` solo en pruebas sobre HTTP. */
  readonly secureCookies: boolean;
}

/**
 * Iteraciones de PBKDF2. workerd admite hasta 100.000, pero el plan gratuito da 10 ms
 * de CPU por solicitud; el límite de 5 intentos por hora compensa un costo moderado.
 */
export const PASSWORD_ITERATIONS = 10_000;

export const productionDeps: Deps = {
  now: Date.now,
  randomInt: secureRandomInt,
  randomToken,
  passwordIterations: PASSWORD_ITERATIONS,
  secureCookies: true,
};
