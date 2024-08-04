import { asyncHandler } from '../middlewares';
import BaseRoutes from './BaseRouter';
import ScraperController from '../controllers/ScraperController';

class ScraperRouter extends BaseRoutes {
  private scraperController: ScraperController | null = null;

  constructor() {
    super();
    this.routes();
  }

  public async routes(): Promise<void> {
    try {
      this.scraperController = new ScraperController();

      if (this.scraperController) {
        this.router.get("/", asyncHandler(this.scraperController.scrape));
      } else {
        throw new Error(`⚠️ Unable to initialize ScraperController at <ScraperRouter.routes>.`);
      }
    } catch (error) {
      console.error(`⚠️ Unable to initialize ScraperRouter at <ScraperRouter.routes>. ${error}`);
      throw new Error(`⚠️ Unable to initialize ScraperRouter at <ScraperRouter.routes>. ${error}`);
    }
  }
}

export default new ScraperRouter().router;
