import { PrismaClient } from "@prisma/client";
import { NextFunction, Request, Response } from "express";
import { decrypt } from "../utils/encryption";

const prisma = new PrismaClient();

export const openAIApiMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const authorization = req.headers["authorization"];
  if (!authorization) {
    res.status(401).send("Unauthorized");
    return;
  }

  const apiKeyObj = await prisma.apiKey.findFirst({
    where: {
      user_token: authorization.replace("Bearer ", ""),
    },
    select: {
      api_key: true,
      chromia_private_key: true,
      chromia_public_key: true,
      api_type: {
        select: {
          base_url: true,
        },
      },
    },
  });

  if (!apiKeyObj) {
    res.status(401).send("Unauthorized");
    return;
  }

  const apiKey = decrypt(apiKeyObj.api_key);
  const privateKey = decrypt(apiKeyObj.chromia_private_key!);

  req.apiData = {
    apiKey,
    baseUrl: apiKeyObj.api_type.base_url,
    privateKey,
    publicKey: apiKeyObj.chromia_public_key!,
  }

  next();
};
