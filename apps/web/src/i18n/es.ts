import type { ApiErrorCode } from "@secret-friend/contract";

/** Textos de la interfaz. Centralizados para poder traducir en el futuro. */
export const t = {
  appName: "Amigo secreto",
  tagline: "Organiza tu amigo secreto en un minuto. Sin cuentas ni descargas.",
  create: "Crear evento",
  myEvents: "Mis eventos",
  created: "Organizo",
  joined: "Participo",
  administer: "Administrar",
  open: "Abrir",
  asName: (name: string) => `Eres ${name}`,
  recoveryTitle: "¿Organizaste alguno de estos eventos?",
  recoveryHint:
    "Reconocimos este dispositivo. Escribe la contraseña de organizador para recuperar el panel.",
  password: "Contraseña de organizador",
  enter: "Entrar",
  loading: "Cargando…",
  copy: "Copiar enlace",
  copied: "¡Copiado!",
  share: "Compartir",
  shareText: (name: string) => `Únete al amigo secreto "${name}" y descubre a quién le regalas:`,
  date: "Fecha del intercambio",
  budget: "Presupuesto sugerido",
  pickYourName: "Toca tu nombre",
  pickHint: "Así sabremos quién eres en este dispositivo.",
  taken: "Tomado",
  confirmName: (name: string) => `¿Eres ${name}?`,
  confirmHint: "Solo puedes elegir un nombre y no podrás cambiarlo desde este dispositivo.",
  yes: "Sí, soy yo",
  cancel: "Cancelar",
  swipe: "Tira hacia abajo",
  spin: "Girar",
  spinOnce: "Solo puedes girar una vez.",
  youGiftTo: "Le regalas a",
  addToCalendar: "Agregar al calendario",
  openInBrowser:
    "Consejo: si abriste el enlace desde WhatsApp u otra app, ábrelo en tu navegador para que te recuerde.",
  sound: "Sonido",
  imOrganizer: "Soy el organizador",
  backHome: "Volver al inicio",
} as const;

export const errorText: Readonly<Record<ApiErrorCode | "NETWORK", string>> = {
  INVALID_INPUT: "Revisa los datos marcados.",
  NOT_FOUND: "Este enlace no existe o el evento ya venció.",
  NAME_TAKEN:
    "Ese nombre ya fue elegido desde otro dispositivo. Si eres tú (por ejemplo, desde otro navegador), pídele al organizador que lo libere.",
  ALREADY_CLAIMED: "Ya elegiste otro nombre en este evento desde este dispositivo.",
  NOT_CLAIMED: "Primero elige tu nombre.",
  UNAUTHORIZED: "Contraseña incorrecta.",
  TOO_MANY_ATTEMPTS: "Demasiados intentos. Vuelve a intentarlo en una hora.",
  NETWORK: "No hay conexión. Revisa tu internet e inténtalo de nuevo.",
};
