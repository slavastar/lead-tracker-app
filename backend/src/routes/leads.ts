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

const router = express.Router();
const prisma = new PrismaClient();
const enc = encoding_for_model("gpt-3.5-turbo");


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
  const { prompt: user_prompt, lead, language, formality, userId, templateKey = "cold_email", templateVersion } = req.body;

  if (!user_prompt || !lead || !userId || !lead.name || !lead.email) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  try {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return res.status(404).json({ error: "User not found" });
    if (user.credits <= 0) return res.status(403).json({ error: "No credits left" });

    // Pick the template: exact version if provided, else active
    const template = templateVersion
      ? await prisma.promptTemplate.findUnique({ where: { key_version: { key: templateKey, version: Number(templateVersion) } } })
      : await prisma.promptTemplate.findFirst({ where: { key: templateKey, isActive: true }, orderBy: { version: "desc" } });

    if (!template) {
      return res.status(404).json({ error: `No template found for key "${templateKey}"${templateVersion ? ` v${templateVersion}` : ""}` });
    }

    const vars = {
      lead_name: lead.name,
      lead_email: lead.email,
      lead_company: lead.company || "N/A",
      language,
      formality,
      user_prompt,
      product_pitch: "We help teams generate high-quality, personalized emails in seconds.", // you can move this to config/db later
    };

    const finalPrompt = renderTemplate(template.body, vars);

    const tokenCount = enc.encode(finalPrompt).length;
    if (tokenCount > MAX_TOKENS_PER_REQUEST) {
      return res.status(400).json({
        error: `Prompt exceeds token limit (${tokenCount}/${MAX_TOKENS_PER_REQUEST})`,
      });
    }

    const completion = await openai.chat.completions.create({
      model: MODEL_NAME,
      messages: [
        { role: "system", content: "You are a helpful email assistant." },
        { role: "user", content: finalPrompt },
      ],
      max_tokens: MAX_TOKENS_PER_REQUEST,
    });

    const generatedEmail = completion.choices[0].message.content?.trim() || "";

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
        response: generatedEmail,
      },
    });

    res.json({
      email: generatedEmail,
      creditsLeft: updated.credits,
      template: { key: template.key, version: template.version, label: template.label },
      tokenCount,
    });
  } catch (err) {
    console.error("Error generating email:", err);
    res.status(500).json({ error: "Failed to generate email" });
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