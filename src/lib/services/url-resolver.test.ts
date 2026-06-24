import { describe, expect, it } from "vitest";
import {
  BoundedCache,
  normalizeUrl,
  titleFromHostname,
  googleS2,
  absolutizeUrl,
  cleanupText,
  extractMeta,
  extractTitleTag,
  extractIconHref,
} from "./url-resolver";

describe("BoundedCache", () => {
  it("should return null for missing key", () => {
    const cache = new BoundedCache<string>(3);
    expect(cache.get("nonexistent")).toBeNull();
  });

  it("should set and get value", () => {
    const cache = new BoundedCache<string>(3);
    cache.set("key1", "value1");
    expect(cache.get("key1")).toBe("value1");
  });

  it("should expire entries after TTL", () => {
    const cache = new BoundedCache<string>(3);
    cache.set("key1", "value1", -1); // 立即过期
    expect(cache.get("key1")).toBeNull();
  });

  it("should evict oldest entry when over capacity", () => {
    const cache = new BoundedCache<string>(2);
    cache.set("a", "1", 60_000);
    cache.set("b", "2", 60_000);
    cache.set("c", "3", 60_000); // 超出容量
    expect(cache.size).toBe(2);
    expect(cache.get("a")).toBeNull(); // 最旧的被淘汰
    expect(cache.get("b")).toBe("2");
    expect(cache.get("c")).toBe("3");
  });

  it("should update existing key without increasing size", () => {
    const cache = new BoundedCache<string>(2);
    cache.set("a", "1", 60_000);
    cache.set("b", "2", 60_000);
    cache.set("a", "updated", 60_000); // 更新已有 key
    expect(cache.size).toBe(2);
    expect(cache.get("a")).toBe("updated");
  });

  it("should clean up expired entries", () => {
    const cache = new BoundedCache<string>(5);
    cache.set("valid", "data", 60_000);
    cache.set("expired", "old", -1);
    cache.cleanup();
    expect(cache.size).toBe(1);
    expect(cache.get("valid")).toBe("data");
    expect(cache.get("expired")).toBeNull();
  });
});

describe("normalizeUrl", () => {
  it("should accept http/https URLs", () => {
    const url = normalizeUrl("https://example.com/path");
    expect(url.protocol).toBe("https:");
    expect(url.hostname).toBe("example.com");
  });

  it("should reject non-http protocols", () => {
    expect(() => normalizeUrl("ftp://example.com")).toThrow("只支持 http/https 协议");
  });
});

describe("titleFromHostname", () => {
  it("should capitalize first letter of domain name", () => {
    expect(titleFromHostname("github.com")).toBe("Github");
  });

  it("should strip www prefix", () => {
    expect(titleFromHostname("www.google.com")).toBe("Google");
  });

  it("should handle hyphens as spaces", () => {
    expect(titleFromHostname("my-cool-site.com")).toBe("My Cool Site");
  });

  it("should handle empty domain part", () => {
    // ".com" → split[0]="" → after capitalize logic → "Website"
    expect(titleFromHostname(".com")).toBe("Website");
  });
});

describe("googleS2", () => {
  it("should generate valid Google S2 URL", () => {
    const result = googleS2("example.com");
    expect(result).toContain("google.com/s2/favicons");
    expect(result).toContain("example.com");
  });
});

describe("absolutizeUrl", () => {
  it("should resolve relative URL to absolute", () => {
    const base = new URL("https://example.com/path/page.html");
    expect(absolutizeUrl("/favicon.ico", base)).toBe("https://example.com/favicon.ico");
  });

  it("should return null for invalid URLs", () => {
    const base = new URL("https://example.com");
    expect(absolutizeUrl("http://[invalid", base)).toBeNull();
  });
});

describe("cleanupText", () => {
  it("should trim whitespace and collapse multiple spaces", () => {
    expect(cleanupText("  hello   world  ")).toBe("hello world");
  });

  it("should handle empty/undefined input", () => {
    expect(cleanupText(undefined)).toBe("");
    expect(cleanupText("")).toBe("");
  });
});

describe("extractMeta", () => {
  it("should extract og:title meta tag content", () => {
    const html = '<meta property="og:title" content="Test Title">';
    expect(extractMeta(html, "og:title")).toBe("Test Title");
  });

  it("should extract with reversed attribute order", () => {
    const html = '<meta content="Reversed" name="description">';
    expect(extractMeta(html, "description")).toBe("Reversed");
  });

  it("should return empty string if not found", () => {
    expect(extractMeta("<html></html>", "og:title")).toBe("");
  });
});

describe("extractTitleTag", () => {
  it("should extract title text", () => {
    const html = "<title>  My Page  </title>";
    expect(extractTitleTag(html)).toBe("My Page");
  });

  it("should handle no title tag", () => {
    expect(extractTitleTag("<html><body>no title</body></html>")).toBe("");
  });
});

describe("extractIconHref", () => {
  it("should extract icon link href", () => {
    const html = '<link rel="icon" href="/icon.png">';
    expect(extractIconHref(html)).toBe("/icon.png");
  });

  it("should prefer icon shortcut", () => {
    const html = '<link rel="shortcut icon" href="/shortcut.ico">';
    expect(extractIconHref(html)).toBe("/shortcut.ico");
  });

  it("should skip non-icon links", () => {
    const html = '<link rel="stylesheet" href="/style.css">';
    expect(extractIconHref(html)).toBe("");
  });
});
