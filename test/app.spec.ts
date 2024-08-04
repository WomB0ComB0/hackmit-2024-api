import { describe, expect, it } from "vitest";
import { Hono, MiddlewareHandler } from "hono";
import Scraper from '../src/classes/scraper'


describe("API", () => {
  const app = new Hono();

  app.get("/api", async (c) => {
    return c.text("Hello from tRPC!");
  });

  app.get("/api/v1/scrape", async (c) => {
    const url: string = c.req.query("url") ?? "";
    if (!url) {
      return c.json({ message: "URL query parameter is required" });
    }
    const scraper = new Scraper();
    await scraper.scrape(url);
    return c.json({ message: "Scraping completed" });
  });

  it("GET /api", async () => {
    try {
      const res = await app.request("/api");
      expect(res.status).toBe(200);
      expect(res.body).toEqual({ message: "Hello from tRPC!" });
    } catch (error) {
      console.error(error);
    }
  });

  it("GET /api/v1/scrape", async () => {
    try {
      const res = await app.request("/api/v1/scrape");
      expect(res.status).toBe(400);
      expect(res.body).toEqual({ message: "URL query parameter is required" });
    } catch (error) {
      console.error(error);
    }
  });

  it("GET /api/v1/scrape?url=https://example.com", async () => {
    try {
      const res = await app.request("/api/v1/scrape?url=https://example.com");
      expect(res.status).toBe(200);
      expect(res.body).toEqual({ message: "Scraping completed" });
    } catch (error) {
      console.error(error);
    }
  });

  it("GET /api/v1/scrape?url=", async () => {
    try {
      const res = await app.request("/api/v1/scrape?url=");
      expect(res.status).toBe(400);
      expect(res.body).toEqual({ message: "URL query parameter is required" });
    } catch (error) {
      console.error(error);
    }
  });
});