import OpenAI from "openai";
import { Router, Request, Response } from "express";
import { addLog } from "../models/chromia";
import { openAIApiMiddleware } from "../middlewares/OpenAIApiMiddleware";
import { newSignatureProvider } from "postchain-client";

const router = Router();

router.get("/", (req, res) => {
  res.send("OpenAI Compatible Router on Chromia");
});

router.get(
  "/models",
  openAIApiMiddleware,
  async (req: Request, res: Response) => {
    const { apiKey, baseUrl } = req.apiData!;
    const openai = new OpenAI({
      apiKey: apiKey,
      baseURL: baseUrl,
    });

    try {
      const response = await openai.models.list();
      res.json(response);
    } catch (error) {
      console.error("Error forwarding request to OpenAI API:", error);
      res.status(500).send("Internal Server Error");
    }
  }
);

router.post("/chat/completions", openAIApiMiddleware, async (req: Request, res: Response) => {

  const { apiKey, baseUrl, privateKey } = req.apiData!;
  const openai = new OpenAI({
    apiKey,
    baseURL: baseUrl,
  });

  try {
    const requestBody = req.body;
    const response = await openai.chat.completions.create(requestBody);

    const signatureProvider = newSignatureProvider({
      privKey: privateKey
    });
    await addLog({
      chat_id: response.id,
      base_url: baseUrl,
      request_model: requestBody.model,
      request_messages: JSON.stringify(requestBody.messages),
      user_question: requestBody.messages[0].content,
      request_raw: JSON.stringify(requestBody),
      response_object: response.object,
      response_created: response.created || Date.now(),
      response_model: response.model,
      response_system_fingerprint: response.system_fingerprint || "",
      response_provider: (response as any).provider || "",
      response_usage_prompt_tokens: response.usage?.prompt_tokens || 0,
      response_usage_completion_tokens: response.usage?.completion_tokens || 0,
      response_usage_total_tokens: response.usage?.total_tokens || 0,
      assistant_reply: response.choices[0].message.content || "",
      finish_reason: response.choices[0].finish_reason,
      response_raw: JSON.stringify(response),
    },
    signatureProvider
  );

    res.json(response);
  } catch (error) {
    console.error("Error forwarding request to OpenAI API:", error);
    res.status(500).send("Internal Server Error");
  }
});

export const openaiRouter = router;
