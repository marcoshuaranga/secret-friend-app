/** Utilidades mínimas de DOM para los scripts de página. */
export const $ = <T extends Element = HTMLElement>(
  selector: string,
  root: ParentNode = document,
): T => {
  const element = root.querySelector<T>(selector);
  if (!element) throw new Error(`Falta el elemento ${selector}`);
  return element;
};

export const show = (element: Element, visible = true): void => {
  element.toggleAttribute("hidden", !visible);
};

/** Crea un elemento con texto (nunca HTML: los nombres los escriben personas). */
export const el = <K extends keyof HTMLElementTagNameMap>(
  tag: K,
  props: Partial<Record<"className" | "textContent" | "href" | "type", string>> = {},
  children: readonly Node[] = [],
): HTMLElementTagNameMap[K] => {
  const element = document.createElement(tag);
  Object.assign(element, props);
  element.append(...children);
  return element;
};

export const tokenFromUrl = (): string => new URLSearchParams(location.search).get("t") ?? "";

export const eventUrl = (token: string): string =>
  `${location.origin}/e?t=${encodeURIComponent(token)}`;

export const formatDate = (iso: string): string =>
  new Date(`${iso}T12:00:00`).toLocaleDateString("es", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
