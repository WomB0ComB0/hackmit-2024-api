declare global {
  namespace NodeJS {
    interface ProcessEnv {
      NODE_ENV: 'development' | 'production';
      CONVEX_URL: string;
      CONVEX_DEPLOYMENT: string;
    }
  }
}

export {};
