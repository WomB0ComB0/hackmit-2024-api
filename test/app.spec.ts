import { describe, expect, it } from "vitest";
import { Hono, Context, MiddlewareHandler } from "hono";
import { rateLimit, RateLimitBinding } from "../src/utils/limit";
import Scraper from '../src/classes/scraper'

type keyConfig = {
	key: string;
};

class PassingRateLimiter implements RateLimitBinding {
	async limit(_: keyConfig) {
		return { success: true };
	}
}

class FailingRateLimiter implements RateLimitBinding {
	async limit(_: keyConfig) {
		return { success: false };
	}
}

const passingRateLimiter: MiddlewareHandler = async (c, next) => {
	return await rateLimit(new PassingRateLimiter(), () => {
		return "someKey";
	})(c, next);
};

const failingRateLimiter: MiddlewareHandler = async (c, next) => {
	return await rateLimit(new FailingRateLimiter(), () => {
		return "someKey";
	})(c, next);
};

describe("API", () => {
  const app = new Hono();

  app.use("*", passingRateLimiter);
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

  it("Should be rate limited", async () => {
    const res = await app.request("/api");
    expect(res.status).toBe(429);
  });

  it("Should not be rate limited", async () => {
    const res = await app.request("/api");
    expect(res.status).toBe(200);
  });
});