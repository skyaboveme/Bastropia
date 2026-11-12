import { env } from 'cloudflare:workers';

export type SessionKv = {
  get(key: string, type: 'json'): Promise<unknown>;
  get(key: string): Promise<string | null>;
  put(key: string, value: string | ArrayBuffer, options?: { expirationTtl?: number }): Promise<unknown>;
  delete(key: string): Promise<unknown>;
  list(options?: {
    prefix?: string;
    cursor?: string;
  }): Promise<{ keys: { name: string }[]; list_complete?: boolean; cursor?: string }>;
};

export function sessionKv(): SessionKv | undefined {
  return (env as { SESSION?: SessionKv }).SESSION;
}
