export type Json =
  | null
  | boolean
  | number
  | string
  | readonly Json[]
  | { readonly [key: string]: Json };

export const isObject = (value: unknown): value is { readonly [key: string]: Json } =>
  typeof value === "object" && value !== null && !Array.isArray(value);

export const field = (value: unknown, key: string): Json | undefined =>
  isObject(value) ? value[key] : undefined;

export const text = (value: unknown, key: string): string => {
  const found = field(value, key);
  if (typeof found !== "string")
    throw new Error(`expected "${key}" to be a string in ${JSON.stringify(value)}`);
  return found;
};

export interface Assignment {
  readonly giver: string;
  readonly receiver: string;
}

/** Every `{ giver, receiver }` pair found anywhere inside a JSON value. */
export const assignmentsIn = (value: unknown): readonly Assignment[] => {
  if (Array.isArray(value)) return value.flatMap(assignmentsIn);
  if (!isObject(value)) return [];
  const own =
    typeof value.giver === "string" && typeof value.receiver === "string"
      ? [{ giver: value.giver, receiver: value.receiver }]
      : [];
  return [...own, ...Object.values(value).flatMap(assignmentsIn)];
};

export const parseJson = (raw: string): unknown => {
  try {
    return JSON.parse(raw);
  } catch {
    return raw;
  }
};
