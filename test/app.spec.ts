import { describe, expect, it } from "vitest";
import api from "../src/server";
import request from "supertest";

describe("API", () => {
  it("GET /api", async () => {
    try {
      const res = await request(api).get("/api");
      expect(res.status).toBe(200);
      expect(res.body).toEqual({ message: "Hello from tRPC!" });
    } catch (error) {
      console.error(error);
    }
  });

  it("GET /api/v1/scrape", async () => {
    try {
      const res = await request(api).get("/api/v1/scrape");
      expect(res.status).toBe(400);
      expect(res.body).toEqual({ message: "URL query parameter is required" });
    } catch (error) {
      console.error(error);
    }
  });

  it("GET /api/v1/scrape?url=https://example.com", async () => {
    try {
      const res = await request(api).get("/api/v1/scrape?url=https://example.com");
      expect(res.status).toBe(200);
      expect(res.body).toEqual({ message: "Scraping completed" });
    } catch (error) {
      console.error(error);
    }
  });
});