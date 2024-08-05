import express, { type Application, type NextFunction, type Request, type Response } from 'express'
import { rateLimit, RateLimitRequestHandler } from 'express-rate-limit'
import { errorHandler } from './middlewares'
import ScraperRouter from "./routes/ScraperRouter";

class App {
  public app: Application;

  constructor() {    
    this.app = express();
    this.plugins();
    this.routes();
  }

  private readonly limiter: RateLimitRequestHandler = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 100,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    validate: { xForwardedForHeader: false }
  });

  protected routes (): void {
    this.app.use('/scrape', this.limiter, ScraperRouter)
    this.app.get('/health', (_req: Request, res: Response) => {
      res.status(200).send('ok');
    });
    this.app.use(errorHandler);
  }


  protected plugins (): void {
    this.app.use(express.json());
    this.app.use(express.urlencoded({ extended: true }));
    this.app.options('/scrape', (_req: Request, res: Response) => {
      res.header('Access-Control-Allow-Origin', '*');
      res.header('Access-Control-Allow-Methods', 'GET, OPTIONS');
      res.header('Access-Control-Allow-Headers', 'Content-Type, X-Forwarded-For');
      res.status(200).send('ok');
    });

    this.app.use((_req: Request, res: Response, next: NextFunction) => {
      res.header('Access-Control-Allow-Origin', '*');
      res.header('Access-Control-Allow-Methods', 'GET, OPTIONS');
      res.header('Access-Control-Allow-Headers', 'Content-Type, X-Forwarded-For');
      next();
    });
  }
}

export const api = new App().app;