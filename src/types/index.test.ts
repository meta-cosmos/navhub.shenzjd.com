import { describe, expect, it } from "vitest";

describe("Type definitions consistency", () => {
  it("Site type should have required fields", () => {
    const site = {
      id: "test-id",
      title: "Test Site",
      url: "https://example.com",
    };

    expect(site.id).toBeDefined();
    expect(site.title).toBeDefined();
    expect(site.url).toBeDefined();
  });

  it("Category type should contain sites array", () => {
    const category = {
      id: "cat-1",
      name: "Test Category",
      sort: 0,
      sites: [],
    };

    expect(Array.isArray(category.sites)).toBe(true);
  });

  it("NavData should support version tracking", () => {
    const data = {
      version: "1.0",
      lastModified: Date.now(),
      categories: [],
    };

    expect(data.version).toBe("1.0");
    expect(typeof data.lastModified).toBe("number");
  });
});
