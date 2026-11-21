/** Devuelve un entero uniforme en [0, maxExclusive). Se inyecta para poder probar con semillas. */
export type RandomInt = (maxExclusive: number) => number;

const UINT32_RANGE = 0x1_0000_0000;

/** Aleatoriedad criptográfica sin sesgo de módulo (rechazo). */
export const secureRandomInt: RandomInt = (maxExclusive) => {
  const limit = UINT32_RANGE - (UINT32_RANGE % maxExclusive);
  const buffer = new Uint32Array(1);
  for (;;) {
    crypto.getRandomValues(buffer);
    const value = buffer[0];
    if (value !== undefined && value < limit) return value % maxExclusive;
  }
};

/** Generador determinista (mulberry32) para pruebas reproducibles. */
export const seededRandomInt = (seed: number): RandomInt => {
  let state = seed >>> 0;
  const next = (): number => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / UINT32_RANGE;
  };
  return (maxExclusive) => Math.floor(next() * maxExclusive);
};
