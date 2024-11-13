import "express";

declare module "express" {
  interface Request {
    apiData?: {
      apiKey: string;
      baseUrl: string;
      privateKey: string;
      publicKey: string;
    };
  }
}