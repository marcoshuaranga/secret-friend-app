/** Archivo de calendario para el día del intercambio (sin el nombre del amigo secreto). */
export const icsFor = (eventName: string, isoDate: string, budget: string | null): string => {
  const day = isoDate.replaceAll("-", "");
  const description = budget ? `Presupuesto sugerido: ${budget}` : "";
  const escapeText = (text: string) =>
    text.replace(/[\\,;]/g, (c) => `\\${c}`).replace(/\n/g, "\\n");
  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Amigo secreto//ES",
    "BEGIN:VEVENT",
    `UID:${day}-${crypto.randomUUID()}@amigo-secreto`,
    `DTSTAMP:${new Date().toISOString().replace(/[-:]/g, "").replace(/\.\d+/, "")}`,
    `DTSTART;VALUE=DATE:${day}`,
    `SUMMARY:${escapeText(`Amigo secreto: ${eventName}`)}`,
    `DESCRIPTION:${escapeText(description)}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");
};

export const download = (filename: string, content: string, type: string): void => {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const link = Object.assign(document.createElement("a"), { href: url, download: filename });
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
};
