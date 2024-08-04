import { Request, Response } from "express";
import Scraper from "../classes/scraper";

class ScraperController {
  private scraper: Scraper;
  constructor() {
    this.scraper = new Scraper();
    this.initializeScraper();
    this.scrape = this.scrape.bind(this);
  }

  private async initializeScraper() {
    try {
      await this.scraper.initialize();
    } catch (error) {
      throw new Error(`Failed to initialize scraper at <initializeScraper in ScraperController>. ${error}`);
    }
  }

  async scrape(req: Request, res: Response): Promise<Response> {
    const url = req.query.url as string;

    if (!url) {
      return res.status(400).json({ message: "URL is required" });
    }

    try {
      await this.initializeScraper();
      const scrape = await this.scraper.scrape(url);
      return res.json(scrape);
    } catch (error) {
      return res.status(500).json({ message: `Failed to scrape url: ${url} at <scrape method in ScraperController>. ${error}` });
    }
  }
}

export default ScraperController;