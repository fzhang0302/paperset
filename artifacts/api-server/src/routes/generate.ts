import { Router, type IRouter } from "express";
import Groq from "groq-sdk";
import { GenerateBody, GenerateResponse } from "@workspace/api-zod";

const router: IRouter = Router();

router.post("/generate", async (req, res): Promise<void> => {
  req.log.info("POST /api/generate hit");

  const parsed = GenerateBody.safeParse(req.body);
  if (!parsed.success) {
    req.log.warn({ errors: parsed.error.message }, "Invalid request body");
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    req.log.error("GROQ_API_KEY is not set");
    res.status(500).json({ error: "AI service is not configured — GROQ_API_KEY missing" });
    return;
  }

  const { prompt, maxTokens } = parsed.data;

  try {
    const groq = new Groq({ apiKey });

    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [{ role: "user", content: prompt }],
      max_tokens: maxTokens ?? 4000,
      temperature: 0.7,
    });

    const text = completion.choices[0]?.message?.content ?? "";
    req.log.info({ textLength: text.length }, "Groq response received");

    res.json(GenerateResponse.parse({ text }));
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    req.log.error({ err: message }, "Groq API call failed");
    res.status(502).json({ error: `Groq API error: ${message}` });
  }
});

export default router;
