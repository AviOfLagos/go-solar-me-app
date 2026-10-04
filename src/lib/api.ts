import * as SecureStore from "expo-secure-store";
import { API_BASE } from "./config";

const TOKEN_KEY = "gsm_token";

/** Every API error: a sentence to show, optional per-field hints, an optional machine code. */
export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public fields: Record<string, string> = {},
    public code?: string,
    public data: Record<string, unknown> = {},
  ) {
    super(message);
    this.name = "ApiError";
  }
}

let memToken: string | null | undefined;
let onUnauthorized: (() => void) | null = null;

export async function getToken() {
  if (memToken === undefined) memToken = await SecureStore.getItemAsync(TOKEN_KEY).catch(() => null);
  return memToken;
}
export async function setToken(token: string | null) {
  memToken = token;
  if (token) await SecureStore.setItemAsync(TOKEN_KEY, token);
  else await SecureStore.deleteItemAsync(TOKEN_KEY).catch(() => {});
}
/** Called once by the auth store: a 401 signs the user out (the cart is kept). */
export function setUnauthorizedHandler(fn: () => void) {
  onUnauthorized = fn;
}

type Opts = { method?: "GET" | "POST" | "PATCH" | "PUT" | "DELETE"; body?: unknown; auth?: boolean };

export async function api<T = Record<string, unknown>>(path: string, { method, body, auth = true }: Opts = {}): Promise<T> {
  const headers: Record<string, string> = { Accept: "application/json" };
  if (body !== undefined) headers["Content-Type"] = "application/json";
  const token = auth ? await getToken() : null;
  if (token) headers.Authorization = `Bearer ${token}`;
  let res: Response;
  try {
    res = await fetch(API_BASE + path, { method: method ?? (body !== undefined ? "POST" : "GET"), headers, body: body !== undefined ? JSON.stringify(body) : undefined });
  } catch {
    throw new ApiError("No connection. Check your internet and try again.", 0);
  }
  const json = (await res.json().catch(() => ({}))) as Record<string, unknown>;
  if (!res.ok) {
    if (res.status === 401 && token) onUnauthorized?.();
    const msg =
      typeof json.error === "string" ? json.error
      : res.status === 429 ? "Too many tries. Please wait a moment and try again."
      : res.status >= 500 ? "Something went wrong on our side. Please try again."
      : "Something went wrong. Please try again.";
    throw new ApiError(msg, res.status, (json.fields as Record<string, string>) ?? {}, json.code as string | undefined, json);
  }
  return json as T;
}

export const errorMessage = (e: unknown) => (e instanceof Error ? e.message : "Something went wrong. Please try again.");
