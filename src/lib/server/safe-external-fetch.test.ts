import { lookup } from "node:dns/promises";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  assertSafeExternalUrl,
  readResponseTextWithLimit,
  safeFetchExternalUrl,
  UnsafeExternalUrlError,
} from "./safe-external-fetch";

vi.mock("node:dns/promises", () => {
  const lookup = vi.fn();
  return {
    default: { lookup },
    lookup,
  };
});

const mockedLookup = vi.mocked(lookup);

describe("safe-external-fetch", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    mockedLookup.mockReset();
  });

  it("拒绝 localhost 和私网 IP", async () => {
    await expect(assertSafeExternalUrl(new URL("http://localhost"))).rejects.toBeInstanceOf(
      UnsafeExternalUrlError
    );
    await expect(assertSafeExternalUrl(new URL("http://127.0.0.1"))).rejects.toBeInstanceOf(
      UnsafeExternalUrlError
    );
    await expect(assertSafeExternalUrl(new URL("http://[::1]"))).rejects.toBeInstanceOf(
      UnsafeExternalUrlError
    );
  });

  it("拒绝解析到私网地址的域名", async () => {
    mockedLookup.mockResolvedValue([{ address: "10.0.0.2", family: 4 }]);

    await expect(assertSafeExternalUrl(new URL("https://internal.example"))).rejects.toBeInstanceOf(
      UnsafeExternalUrlError
    );
  });

  it("允许解析到公网地址的域名", async () => {
    mockedLookup.mockResolvedValue([{ address: "93.184.216.34", family: 4 }]);

    await expect(assertSafeExternalUrl(new URL("https://example.com"))).resolves.toBeUndefined();
  });

  it("拒绝跳转到内网地址", async () => {
    mockedLookup.mockResolvedValue([{ address: "93.184.216.34", family: 4 }]);
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(
        new Response(null, { status: 302, headers: { location: "http://127.0.0.1/admin" } })
      );

    await expect(safeFetchExternalUrl("https://example.com")).rejects.toBeInstanceOf(
      UnsafeExternalUrlError
    );
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("限制响应文本读取大小", async () => {
    const response = new Response("abcdef");

    await expect(readResponseTextWithLimit(response, 3)).rejects.toThrow("响应内容过大");
  });
});
