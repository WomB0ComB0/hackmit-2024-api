import { Hono, MiddlewareHandler } from 'hono';
import { describe, expect, it } from 'vitest';

describe('API', () => {
  const app = new Hono();

  app.get('/api', async (c) => {
    return c.text('Hello from tRPC!');
  });
});
