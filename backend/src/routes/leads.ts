import express from "express";
import { PrismaClient } from "@prisma/client";
import { encoding_for_model } from "tiktoken";
import { openai } from "../utils/openaiClient";
import {
  MAX_TOKENS_PER_REQUEST,
  MODEL_NAME,
  DEFAULT_CREDITS,
} from "../config/config";
import { renderTemplate } from "../utils/renderTemplate";
import { z } from "zod";

const router = express.Router();
const prisma = new PrismaClient();
const enc = encoding_for_model("gpt-3.5-turbo");

const WINDOW_MS = 60_000;
const MAX_REQUESTS_PER_WINDOW = 5;
const MAX_CONCURRENT = 2;
const OPENAI_TIMEOUT_MS = 25_000;

type TS = number;

const requestLog: Map<string, TS[]> = new Map();
const activeCounts: Map<string, number> = new Map();

function checkAndRecordRate(userId: string): { ok: true } | { ok: false; reason: "RATE_LIMIT" } {
  const now = Date.now();
  const arr = requestLog.get(userId) ?? [];
  const recent = arr.filter((t) => now - t < WINDOW_MS);
  if (recent.length >= MAX_REQUESTS_PER_WINDOW) {
    requestLog.set(userId, recent);
    return { ok: false, reason: "RATE_LIMIT" };
  }
  recent.push(now);
  requestLog.set(userId, recent);
  return { ok: true };
}

function tryStartJob(userId: string): { ok: true } | { ok: false; reason: "CONCURRENCY_LIMIT" } {
  const current = activeCounts.get(userId) ?? 0;
  if (current >= MAX_CONCURRENT) {
    return { ok: false, reason: "CONCURRENCY_LIMIT" };
  }
  activeCounts.set(userId, current + 1);
  return { ok: true };
}

function finishJob(userId: string) {
  const current = activeCounts.get(userId) ?? 0;
  const next = Math.max(0, current - 1);
  activeCounts.set(userId, next);
}

function withTimeout<T>(p: Promise<T>, ms: number): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const id = setTimeout(() => reject(new Error("TIMEOUT")), ms);
    p.then(
      (v) => {
        clearTimeout(id);
        resolve(v);
      },
      (e) => {
        clearTimeout(id);
        reject(e);
      }
    );
  });
}

const EmailSchema = z.object({
  subject: z.string().min(1, "Subject is required").max(200, "Subject must be <= 200 characters"),
  body: z.string().min(10, "Body is too short"),
});

router.get("/", async (_req, res) => {
  try {
    const leads = await prisma.lead.findMany({
      orderBy: { createdAt: "desc" },
    });
    res.json(leads);
  } catch (err) {
    console.error("Error fetching leads:", err);
    res.status(500).json({ error: "Failed to fetch leads" });
  }
});

router.post("/", async (req, res) => {
  const { name, email, company, userId } = req.body;

  if (!name || !email || !userId) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  try {
    let user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      user = await prisma.user.create({
        data: {
          id: userId,
          email: `${userId}@example.com`,
          name,
          credits: DEFAULT_CREDITS,
        },
      });
    }

    const lead = await prisma.lead.create({
      data: { name, email, company, userId },
    });

    res.status(201).json(lead);
  } catch (err) {
    console.error("Error creating lead:", err);
    res.status(500).json({ error: "Failed to create lead" });
  }
});

router.get("/users/:userId/credits", async (req, res) => {
  const { userId } = req.params;
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { credits: true },
    });
    if (!user) return res.status(404).json({ error: "User not found" });
    res.json({ credits: user.credits });
  } catch (err) {
    console.error("Error fetching credits:", err);
    res.status(500).json({ error: "Failed to fetch user credits" });
  }
});


router.post("/generate-email", async (req, res) => {
  const {
    prompt: user_prompt,
    lead,
    language,
    formality,
    userId,
    templateKey = "cold_email",
    templateVersion,
  } = req.body;

  if (!user_prompt || !lead || !userId || !lead.name || !lead.email) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  const rate = checkAndRecordRate(userId);
  if (!rate.ok) {
    return res
      .status(429)
      .json({ error: "Too many requests. Please wait a moment and try again.", code: "RATE_LIMIT" });
  }
  const cx = tryStartJob(userId);
  if (!cx.ok) {
    return res
      .status(429)
      .json({ error: "Too many active generations. Please wait for current ones to finish.", code: "CONCURRENCY_LIMIT" });
  }

  try {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return res.status(404).json({ error: "User not found" });
    if (user.credits <= 0) return res.status(403).json({ error: "No credits left" });

    const template = templateVersion
      ? await prisma.promptTemplate.findUnique({
          where: { key_version: { key: templateKey, version: Number(templateVersion) } },
        })
      : await prisma.promptTemplate.findFirst({
          where: { key: templateKey, isActive: true },
          orderBy: { version: "desc" },
        });

    if (!template) {
      return res.status(404).json({
        error: `No template found for key "${templateKey}"${templateVersion ? ` v${templateVersion}` : ""}`,
      });
    }

    try {
      const mod1 = await openai.moderations.create({
        model: "omni-moderation-latest",
        input: user_prompt,
      });
      const flagged = Array.isArray(mod1.results) && mod1.results.some((r) => (r as any).flagged);
      if (flagged) {
        return res.status(400).json({
          error: "The provided prompt was flagged by moderation. Please revise and try again.",
          code: "MODERATION_FLAGGED_INPUT",
        });
      }
    } catch {
      return res.status(503).json({ error: "Moderation service unavailable. Please try again later.", code: "MODERATION_UNAVAILABLE" });
    }

    const vars = {
      lead_name: lead.name,
      lead_email: lead.email,
      lead_company: lead.company || "N/A",
      language,
      formality,
      user_prompt,
      product_pitch: "We help teams generate high-quality, personalized emails in seconds.",
    };
    const finalPrompt = renderTemplate(template.body, vars);

    try {
      const mod2 = await openai.moderations.create({
        model: "omni-moderation-latest",
        input: finalPrompt,
      });
      const flagged = Array.isArray(mod2.results) && mod2.results.some((r) => (r as any).flagged);
      if (flagged) {
        return res.status(400).json({
          error: "The composed prompt was flagged by moderation. Please adjust inputs and try again.",
          code: "MODERATION_FLAGGED_RENDERED",
        });
      }
    } catch {
      return res.status(503).json({ error: "Moderation service unavailable. Please try again later.", code: "MODERATION_UNAVAILABLE" });
    }

    const tokenCount = enc.encode(finalPrompt).length;
    if (tokenCount > MAX_TOKENS_PER_REQUEST) {
      return res.status(400).json({
        error: `Prompt exceeds token limit (${tokenCount}/${MAX_TOKENS_PER_REQUEST})`,
      });
    }

    const jsonInstruction = `
You are an expert email copywriter.

Always write the email in: ${language}
Always use this tone: ${formality}

Return ONLY valid JSON with the following shape, no prose, no markdown:
{
  "subject": string (<= 200 chars),
  "body": string
}

Constraints:
- Subject must be concise (<= 200 chars).
- Body should be a short, professional cold email.
- Do not include any additional fields.
- Do not include backticks or code fences.
`;

    const userContent = `${finalPrompt}

Return only JSON for { "subject", "body" } as specified above.`;

    const completion = await withTimeout(
      openai.chat.completions.create({
        model: MODEL_NAME,
        messages: [
          { role: "system", content: jsonInstruction },
          { role: "user", content: userContent },
        ],
        max_tokens: MAX_TOKENS_PER_REQUEST,
        temperature: 0.7,
      }),
      OPENAI_TIMEOUT_MS
    );

    const raw = completion.choices[0]?.message?.content ?? "";
    let parsed: unknown;
    try {
      const cleaned = raw.trim().replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/```$/i, "");
      parsed = JSON.parse(cleaned);
    } catch (e) {
      console.error("Model did not return valid JSON:", raw);
      return res.status(502).json({ error: "Model returned invalid JSON.", code: "MODEL_BAD_JSON" });
    }

    const result = EmailSchema.safeParse(parsed);
    if (!result.success) {
      return res.status(422).json({
        error: "Model JSON failed validation.",
        code: "MODEL_BAD_SCHEMA",
        issues: result.error.issues,
      });
    }

    const { subject, body } = result.data;

    const updated = await prisma.user.update({
      where: { id: userId },
      data: { credits: { decrement: 1 } },
      select: { credits: true },
    });

    await prisma.promptRun.create({
      data: {
        userId,
        leadId: lead.id ?? null,
        templateId: template.id,
        templateKey: template.key,
        templateVersion: template.version,
        language,
        formality,
        variables: vars,
        finalPrompt,
        model: MODEL_NAME,
        tokenCount,
        response: { subject, body },
      },
    });

    return res.json({
      subject,
      body,
      creditsLeft: updated.credits,
      template: { key: template.key, version: template.version, label: template.label },
      tokenCount,
    });
  } catch (err: any) {
    if (err?.message === "TIMEOUT") {
      return res.status(504).json({
        error: "Generation took too long. Please try again.",
        code: "TIMEOUT",
      });
    }
    console.error("Error generating email:", err);
    return res.status(500).json({ error: "Failed to generate email" });
  } finally {
    finishJob(userId);
  }
});

router.delete("/:id", async (req, res) => {
  const { id } = req.params;
  try {
    await prisma.lead.delete({ where: { id } });
    res.status(204).send();
  } catch (err) {
    console.error("Error deleting lead:", err);
    res.status(500).json({ error: "Failed to delete lead" });
  }
});

export default router;