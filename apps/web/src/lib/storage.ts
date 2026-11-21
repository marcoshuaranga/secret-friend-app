/** `localStorage` solo para conveniencias; puede no estar disponible (modo privado, etc.). */
export const readFlag = (key: string): boolean => {
  try {
    return localStorage.getItem(key) === "1";
  } catch {
    return false;
  }
};

export const writeFlag = (key: string, value: boolean): void => {
  try {
    localStorage.setItem(key, value ? "1" : "0");
  } catch {
    // Sin almacenamiento: la preferencia dura lo que dure la página.
  }
};
