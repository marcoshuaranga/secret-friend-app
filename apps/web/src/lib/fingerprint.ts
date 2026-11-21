/**
 * Huella del navegador, sin librerías. Solo es una pista para sugerirle sus eventos al
 * organizador que perdió su cookie: nunca autoriza nada (dos teléfonos iguales coinciden).
 */
const canvasSignal = (): string => {
  const canvas = document.createElement("canvas");
  canvas.width = 220;
  canvas.height = 30;
  const ctx = canvas.getContext("2d");
  if (!ctx) return "";
  ctx.textBaseline = "top";
  ctx.font = "16px 'Arial'";
  ctx.fillStyle = "#f60";
  ctx.fillRect(100, 1, 62, 20);
  ctx.fillStyle = "#069";
  ctx.fillText("Amigo secreto 🎁", 2, 15);
  return canvas.toDataURL();
};

const webglSignal = (): string => {
  const gl = document.createElement("canvas").getContext("webgl");
  if (!gl) return "";
  const info = gl.getExtension("WEBGL_debug_renderer_info");
  return info
    ? `${gl.getParameter(info.UNMASKED_VENDOR_WEBGL)}|${gl.getParameter(info.UNMASKED_RENDERER_WEBGL)}`
    : "";
};

const signals = (): readonly unknown[] => [
  Intl.DateTimeFormat().resolvedOptions().timeZone,
  navigator.languages.join(","),
  navigator.platform,
  navigator.hardwareConcurrency,
  (navigator as Navigator & { deviceMemory?: number }).deviceMemory,
  navigator.maxTouchPoints,
  screen.width,
  screen.height,
  screen.colorDepth,
  window.devicePixelRatio,
  canvasSignal(),
  webglSignal(),
];

const toHex = (buffer: ArrayBuffer): string =>
  [...new Uint8Array(buffer)].map((b) => b.toString(16).padStart(2, "0")).join("");

let cached: Promise<string | undefined> | undefined;

export const fingerprint = (): Promise<string | undefined> => {
  cached ??= (async () => {
    try {
      const data = new TextEncoder().encode(JSON.stringify(signals()));
      return toHex(await crypto.subtle.digest("SHA-256", data));
    } catch {
      return undefined;
    }
  })();
  return cached;
};
