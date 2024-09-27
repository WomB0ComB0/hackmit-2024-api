declare global {
  namespace NodeJS {
    interface ProcessEnv {
      CONVEX_URL: string;
    }
  }
}

export {};
