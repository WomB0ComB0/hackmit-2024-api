import { Request, Response } from "express";
import Scraper from "../classes/scraper";

class ScraperController {
  private readonly scraper: Scraper;
  constructor() {
    this.scraper = new Scraper();
  }
  async scrape(req: Request, res: Response): Promise<Response> {
    const url = req.query.url as string;
    if (!url) {
      return res.status(400).json({ message: "URL is required" });
    }
    try {
      const scrape = await this.scraper.scrape(url);
      return res.json(scrape);
    } catch (error) {
      return res.status(500).json({ message: `${error}` });
    }
  }
}

export default ScraperController;