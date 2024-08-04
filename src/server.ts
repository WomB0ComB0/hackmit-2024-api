import "./instrument";

import express, { type Application, type NextFunction, type Request, type Response } from 'express'
import { rateLimit, RateLimitRequestHandler } from 'express-rate-limit'
import * as Sentry from "@sentry/node";
import { errorHandler } from './middlewares'
import { join } from "path";
import ScraperRouter from "./routes/ScraperRouter";



class App {
  public app: Application;

  constructor() {    
    this.app = express();
    this.plugins();
    this.routes();
    this.app.use(Sentry.expressErrorHandler());
  }

  private readonly path: string = join(__dirname, '..', 'static');

  private readonly limiter: RateLimitRequestHandler = rateLimit({
    windowMs: 15 * 60 * 1000,
	  limit: 100,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
  });

  protected routes (): void {
    this.app.use('/', this.limiter, express.static(this.path));
    this.app.use('/api/v1/scrape', this.limiter, ScraperRouter)
    this.app.use(errorHandler)
  }

  protected plugins (): void {
    this.app.use(Sentry.expressErrorHandler());
    this.app.use(express.json());
    this.app.use(express.urlencoded({ extended: true }));
    this.app.options('/api/v1/scrape', (_req: Request, res: Response) => {
      res.header('Access-Control-Allow-Origin', '*');
      res.header('Access-Control-Allow-Methods', 'GET, OPTIONS');
      res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
      res.status(200).send('ok');
    });

    this.app.use((_req: Request, res: Response, next: NextFunction) => {
      res.header('Access-Control-Allow-Origin', '*');
      res.header('Access-Control-Allow-Methods', 'GET, OPTIONS');
      res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
      next();
    });
  }
}

const port: number = 3000;

export const api = new App().app;

api.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});