import { Hono } from "hono";
import { swaggerUI } from "@hono/swagger-ui";
import { sentry } from "@hono/sentry";
import Scraper from "./scraper";

export type Bindings = {
  [key in keyof CloudflareBindings]: CloudflareBindings[key];
};

export type Variables = Record<string, never>;

class App {
  public app = new Hono<{
    Bindings: Bindings;
    Variables: Variables;
  }>();

  constructor() {
    this.app.basePath("/api/v1");

    this.app.get("/", swaggerUI({ url: "/doc" }));

    this.app.get("/scrape", async (ctx) => {
      const url: string = ctx.req.query("url") ?? "";
      if (!url) {
        return ctx.json({ message: "URL query parameter is required" });
      }

      try {
        const scraper = new Scraper();
        await scraper.scrape(url);
        return ctx.json({ message: "Scraping compelted" });
      } catch (error) {
        return ctx.json({ message: `${error}`, status: `${ctx.status(500)}` });
      }
    });

    this.app.get("/ui", swaggerUI({ url: "/doc" }));

    this.app.use(
      "*",
      sentry({
        dsn: "https://b9aacde06ec3352f373c1a7a2ce32fd3@o4506762839916544.ingest.us.sentry.io/4507716661018624",
      }),
    );
  }
}

const api = new App();

export default api;
