const encoder = new TextEncoder();

const toBase64Url = (bytes: Uint8Array): string =>
  btoa(String.fromCharCode(...bytes))
    .replaceAll("+", "-")
    .replaceAll("/", "_")
    .replace(/=+$/, "");

const toHex = (buffer: ArrayBuffer): string =>
  [...new Uint8Array(buffer)].map((byte) => byte.toString(16).padStart(2, "0")).join("");

/** Identificador o token aleatorio criptográfico, seguro para URL. 32 bytes = 256 bits. */
export const randomToken = (bytes = 32): string =>
  toBase64Url(crypto.getRandomValues(new Uint8Array(bytes)));

/** SHA-256 en hex: rápido, apto para tokens aleatorios largos (no para contraseñas). */
export const sha256 = async (text: string): Promise<string> =>
  toHex(await crypto.subtle.digest("SHA-256", encoder.encode(text)));

/** PBKDF2-SHA256 de la contraseña del organizador. */
export const hashPassword =
  (iterations: number) =>
  async (password: string, salt: string): Promise<string> => {
    const key = await crypto.subtle.importKey("raw", encoder.encode(password), "PBKDF2", false, [
      "deriveBits",
    ]);
    const bits = await crypto.subtle.deriveBits(
      { name: "PBKDF2", hash: "SHA-256", salt: encoder.encode(salt), iterations },
      key,
      256,
    );
    return toHex(bits);
  };

/** Comparación en tiempo constante para hashes de igual largo. */
export const safeEqual = (a: string, b: string): boolean => {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
};
