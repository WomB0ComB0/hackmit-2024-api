import { Request, Response } from "express";
import { scrape as scraper, initializeFilterWords } from "../classes/scraper";

class ScraperController {
  constructor() {
    this.initializeScraper();
    this.scrape = this.scrape.bind(this);
  }

  private async initializeScraper() {
    try {
      await initializeFilterWords();
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
      const scrape = await scraper(url);
      return res.json(scrape);
    } catch (error) {
      console.error(`Error during scraping: ${error instanceof Error ? error.stack : error}`);

      if (error instanceof Error) {
        return res.status(500).json({ 
          message: `Failed to scrape url: ${url} at <scrape method in ScraperController>. ${error.message}`,
          stack: error.stack
        });
      }
      return res.status(500).json({ message: "An unknown error occurred" });
    }
  }
}

export default ScraperController;