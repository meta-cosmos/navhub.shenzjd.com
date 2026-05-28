import { lookup } from "node:dns/promises";
import { isIP } from "node:net";

const DEFAULT_MAX_REDIRECTS = 3;
const DEFAULT_MAX_BYTES = 1_000_000;

const BLOCKED_HOSTNAMES = new Set(["localhost", "metadata.google.internal"]);

export class UnsafeExternalUrlError extends Error {
  constructor(message = "不允许访问该地址") {
    super(message);
    this.name = "UnsafeExternalUrlError";
  }
}

export interface SafeFetchOptions {
  maxRedirects?: number;
}

function normalizeHostname(hostname: string): string {
  return hostname
    .replace(/^\[(.*)\]$/, "$1")
    .replace(/\.+$/, "")
    .toLowerCase();
}

function isBlockedHostname(hostname: string): boolean {
  const normalized = normalizeHostname(hostname);
  return BLOCKED_HOSTNAMES.has(normalized) || normalized.endsWith(".localhost");
}

function isBlockedIPv4(ip: string): boolean {
  const parts = ip.split(".").map((part) => Number(part));
  if (
    parts.length !== 4 ||
    parts.some((part) => !Number.isInteger(part) || part < 0 || part > 255)
  ) {
    return true;
  }

  const [a, b] = parts;
  return (
    a === 0 ||
    a === 10 ||
    a === 127 ||
    (a === 100 && b >= 64 && b <= 127) ||
    (a === 169 && b === 254) ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 168) ||
    (a === 198 && (b === 18 || b === 19)) ||
    a >= 224
  );
}

function isBlockedIPv6(ip: string): boolean {
  const normalized = normalizeHostname(ip);

  if (normalized.includes(".")) {
    const mappedIPv4 = normalized.split(":").at(-1);
    if (mappedIPv4 && isIP(mappedIPv4) === 4) {
      return isBlockedIPv4(mappedIPv4);
    }
  }

  return (
    normalized === "::" ||
    normalized === "::1" ||
    normalized.startsWith("fc") ||
    normalized.startsWith("fd") ||
    normalized.startsWith("fe8") ||
    normalized.startsWith("fe9") ||
    normalized.startsWith("fea") ||
    normalized.startsWith("feb") ||
    normalized.startsWith("ff")
  );
}

export function isBlockedIPAddress(address: string): boolean {
  const version = isIP(normalizeHostname(address));
  if (version === 4) return isBlockedIPv4(address);
  if (version === 6) return isBlockedIPv6(address);
  return true;
}

export async function assertSafeExternalUrl(url: URL): Promise<void> {
  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new UnsafeExternalUrlError("只支持 http/https 协议");
  }

  const hostname = normalizeHostname(url.hostname);
  if (!hostname || isBlockedHostname(hostname)) {
    throw new UnsafeExternalUrlError();
  }

  if (isIP(hostname)) {
    if (isBlockedIPAddress(hostname)) {
      throw new UnsafeExternalUrlError();
    }
    return;
  }

  const addresses = await lookup(hostname, { all: true, verbatim: true });
  if (addresses.length === 0 || addresses.some(({ address }) => isBlockedIPAddress(address))) {
    throw new UnsafeExternalUrlError();
  }
}

export async function safeFetchExternalUrl(
  input: string | URL,
  init: RequestInit = {},
  options: SafeFetchOptions = {}
): Promise<Response> {
  let currentUrl = typeof input === "string" ? new URL(input) : input;
  const maxRedirects = options.maxRedirects ?? DEFAULT_MAX_REDIRECTS;

  for (let redirectCount = 0; redirectCount <= maxRedirects; redirectCount++) {
    await assertSafeExternalUrl(currentUrl);

    const response = await fetch(currentUrl.toString(), {
      ...init,
      redirect: "manual",
    });

    if (response.status < 300 || response.status >= 400 || !response.headers.get("location")) {
      return response;
    }

    if (redirectCount === maxRedirects) {
      throw new UnsafeExternalUrlError("跳转次数过多");
    }

    currentUrl = new URL(response.headers.get("location")!, currentUrl);
  }

  throw new UnsafeExternalUrlError("跳转次数过多");
}

export async function readResponseTextWithLimit(
  response: Response,
  maxBytes = DEFAULT_MAX_BYTES
): Promise<string> {
  const contentLength = response.headers.get("content-length");
  if (contentLength && Number(contentLength) > maxBytes) {
    throw new Error("响应内容过大");
  }

  const reader = response.body?.getReader();
  if (!reader) {
    return response.text();
  }

  const chunks: Uint8Array[] = [];
  let totalBytes = 0;

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      totalBytes += value.byteLength;
      if (totalBytes > maxBytes) {
        throw new Error("响应内容过大");
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }

  return new TextDecoder().decode(Buffer.concat(chunks));
}
