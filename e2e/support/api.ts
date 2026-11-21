import type { APIRequestContext } from "playwright";
import { api } from "./contract.ts";

export interface ApiResponse {
  readonly status: number;
  readonly body: unknown;
}

export interface EventInput {
  readonly name: string;
  readonly participants: readonly string[];
  readonly date?: string;
  readonly budget?: string;
}

type Headers = Readonly<Record<string, string>>;

const bearer = (token: string | undefined): Headers =>
  token === undefined ? {} : { authorization: `Bearer ${token}` };

const toResponse = async (response: {
  status(): number;
  text(): Promise<string>;
}): Promise<ApiResponse> => {
  const raw = await response.text();
  return { status: response.status(), body: raw === "" ? null : JSON.parse(raw) };
};

/** HTTP calls against the deployed Worker; `headers` carries the test clock when set. */
export const apiClient = (http: APIRequestContext, headers: () => Headers) => ({
  createEvent: async (input: EventInput) =>
    toResponse(await http.post(api.events, { data: input, headers: headers() })),
  getEvent: async (token: string) =>
    toResponse(await http.get(api.event(token), { headers: headers() })),
  claim: async (token: string, name: string) =>
    toResponse(await http.post(api.claim(token), { data: { name }, headers: headers() })),
  result: async (token: string, deviceToken?: string) =>
    toResponse(
      await http.get(api.result(token), { headers: { ...headers(), ...bearer(deviceToken) } }),
    ),
  release: async (token: string, name: string, adminKey?: string) =>
    toResponse(
      await http.post(api.release(token), {
        data: { name },
        headers: { ...headers(), ...bearer(adminKey) },
      }),
    ),
});

export type ApiClient = ReturnType<typeof apiClient>;
