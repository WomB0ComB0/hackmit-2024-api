import { ConvexHttpClient } from 'convex/browser';
import cors from 'cors';
import express, {
  type Application,
  type NextFunction,
  type Request,
  type Response,
  Router,
} from 'express';
import { type RateLimitRequestHandler, rateLimit } from 'express-rate-limit';
import { api } from './convex/_generated/api';
import type { Id } from './convex/_generated/dataModel';
import { errorHandler } from './middlewares';

class App {
  public app: Application;
  private convex: ConvexHttpClient;

  constructor() {
    this.app = express();
    const convexUrl = process.env.CONVEX_URL || 'https://benevolent-manatee-676.convex.cloud';
    console.log('Convex URL:', convexUrl);
    if (!convexUrl) {
      throw new Error('CONVEX_URL environment variable is not set');
    }
    this.convex = new ConvexHttpClient(convexUrl);
    this.configureMiddleware();
    this.configureRoutes();
  }

  private readonly limiter: RateLimitRequestHandler = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 200,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    validate: { xForwardedForHeader: false },
  });

  private configureRoutes(): void {
    this.app.get('/health', (_req: Request, res: Response) => {
      res.send('OK');
    });
    this.app.use('/api/users', this.createUserRouter());
    this.app.use('/api/transactions', this.createTransactionRouter());
    this.app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
      errorHandler(err, _req, res, _next);
    });
  }

  private configureMiddleware(): void {
    this.app.use(express.json());
    this.app.use(express.urlencoded({ extended: true }));
    this.app.use(
      cors({
        origin: ['http://localhost:3000', 'https://www.fraudguard.tech'],
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'X-Forwarded-For'],
      }),
    );

    this.app.use(this.limiter);
  }

  private createUserRouter(): Router {
    return Router()
      .post('/', this.limiter, this.handleAsync(this.createUser))
      .get('/:id', this.limiter, this.handleAsync(this.getUser))
      .put('/:id', this.limiter, this.handleAsync(this.updateUser))
      .delete('/:id', this.limiter, this.handleAsync(this.deleteUser))
      .head('/', this.limiter, this.handleAsync(this.headUser))
      .options('/', this.limiter, this.handleAsync(this.optionsUser));
  }

  private createTransactionRouter(): Router {
    return Router()
      .post('/', this.limiter, this.handleAsync(this.createTransaction))
      .get('/:id', this.limiter, this.handleAsync(this.getTransaction))
      .put('/:id', this.limiter, this.handleAsync(this.updateTransaction))
      .delete('/:id', this.limiter, this.handleAsync(this.deleteTransaction))
      .head('/', this.limiter, this.handleAsync(this.headTransaction))
      .options('/', this.limiter, this.handleAsync(this.optionsTransaction));
  }

  private handleAsync(fn: (req: Request, res: Response) => Promise<void>) {
    return (req: Request, res: Response, next: NextFunction) => {
      fn.call(this, req, res).catch(next);
    };
  }

  private async createUser(req: Request, res: Response): Promise<void> {
    const { id, name, email } = req.body;
    const userId = await this.convex.mutation(api.users.createUser, { id, name, email });
    res.json({ userId });
  }

  private async getUser(req: Request, res: Response): Promise<void> {
    const userId = req.params.id;
    const user = await this.convex.query(api.users.getUser, { id: userId });
    if (user) {
      res.json(user);
    } else {
      res.status(404).json({ error: 'User not found' });
    }
  }

  private async updateUser(req: Request, res: Response): Promise<void> {
    const userId = req.params.id as Id<'users'>;
    const { name, email } = req.body;
    const updatedUser = await this.convex.mutation(api.users.updateUser, {
      id: userId,
      name,
      email,
    });
    res.json(updatedUser);
  }

  private async deleteUser(req: Request, res: Response): Promise<void> {
    const userId = req.params.id as Id<'users'>;
    await this.convex.mutation(api.users.deleteUser, { id: userId });
    res.status(204).send();
  }

  private async headUser(_req: Request, res: Response): Promise<void> {
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Allow', 'GET, POST, PUT, DELETE, HEAD, OPTIONS');
    res.status(200).send();
  }

  private async optionsUser(_req: Request, res: Response): Promise<void> {
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Allow', 'GET, POST, PUT, DELETE, HEAD, OPTIONS');
    res.status(200).send();
  }

  private async createTransaction(req: Request, res: Response): Promise<void> {
    try {
      console.log('Received transaction data:', req.body);
      const transactionData = req.body;

      if (!transactionData.userId) {
        res.status(400).json({ error: 'userId is required' });
        return;
      }

      const user = await this.convex.query(api.users.getUser, { id: transactionData.userId });
      if (!user) {
        res.status(404).json({ error: 'User not found' });
        return;
      }

      const fraudPredictionData = {
        amount: transactionData.amount,
        product_category: transactionData.productCategory,
        customer_location: transactionData.customerLocation,
        account_age_days: transactionData.accountAgeDays,
        transaction_date: transactionData.transactionDate,
      };

      const fraudPrediction = await this.predictFraud(fraudPredictionData);

      if (fraudPrediction.detail) {
        res.status(422).json({
          error: 'Invalid transaction data',
          details: fraudPrediction.detail,
        });
        return;
      }

      const transactionId = await this.convex.mutation(api.transactions.createTransaction, {
        ...transactionData,
        isFraudulent: fraudPrediction.is_fraudulent,
        fraudExplanation: fraudPrediction.fraud_explanation || '',
      });

      res.json({ transactionId, ...fraudPrediction });
    } catch (error) {
      console.error('Error creating transaction:', error);
      res.status(500).json({ error: 'An error occurred while creating the transaction' });
    }
  }

  private async getTransaction(req: Request, res: Response): Promise<void> {
    const transactionId = req.params.id as Id<'transactions'>;
    const transaction = await this.convex.query(api.transactions.getTransaction, {
      id: transactionId,
    });
    if (transaction) {
      res.json(transaction);
    } else {
      res.status(404).json({ error: 'Transaction not found' });
    }
  }

  private async updateTransaction(req: Request, res: Response): Promise<void> {
    const transactionId = req.params.id as Id<'transactions'>;
    const transactionData = req.body;
    const updatedTransaction = await this.convex.mutation(api.transactions.updateTransaction, {
      id: transactionId,
      ...transactionData,
    });
    res.json(updatedTransaction);
  }

  private async deleteTransaction(req: Request, res: Response): Promise<void> {
    const transactionId = req.params.id as Id<'transactions'>;
    await this.convex.mutation(api.transactions.deleteTransaction, {
      id: transactionId,
    });
    res.status(204).send();
  }

  private async headTransaction(_req: Request, res: Response): Promise<void> {
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Allow', 'GET, POST, PUT, DELETE, HEAD, OPTIONS');
    res.status(200).send();
  }

  private async optionsTransaction(_req: Request, res: Response): Promise<void> {
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Allow', 'GET, POST, PUT, DELETE, HEAD, OPTIONS');
    res.status(200).send();
  }

  private async predictFraud(transactionData: any): Promise<any> {
    const response = await fetch(
      'https://hackmit-2024-api-703466588724.us-central1.run.app/api/v1/predict_fraud',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(transactionData),
      },
    );
    const data = await response.json();
    if (!response.ok) {
      console.error('Fraud prediction API error:', data);
      throw new Error('Fraud prediction failed');
    }
    return data;
  }
}

const app = new App().app;

if (process.env.NODE_ENV !== 'production') {
  const port = process.env.PORT || 3000;
  app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
  });
}

export default app;
