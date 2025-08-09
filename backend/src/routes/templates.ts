import express from "express";
import { PrismaClient } from "@prisma/client";

const router = express.Router();
const prisma = new PrismaClient();

router.post("/seed", async (_req, res) => {
  const templates = [
    {
      key: "cold_email",
      version: 1,
      label: "V1: Short, direct value prop",
      body: `Write a {{formality}} cold email in {{language}} to {{lead_name}} at {{lead_company}}.

Context:
- Your role/product: {{product_pitch}}
- Receiver email: {{lead_email}}

Goals:
- Briefly introduce value
- One clear CTA (15-min call or reply)

Constraints:
- 120 words max
- No jargon
- Subject line + body

User prompt (additional instructions):
{{user_prompt}}`,
      isActive: true,
    },
    {
      key: "cold_email",
      version: 2,
      label: "V2: Problem–Agitate–Solve",
      body: `Create a {{formality}} cold email in {{language}} to {{lead_name}} ({{lead_email}}) at {{lead_company}}.

Use PAS structure:
1) Problem: identify a pain relevant to {{lead_company}}
2) Agitate: consequences of inaction
3) Solve: how {{product_pitch}} helps

Include:
- Subject line that hints at the outcome
- 2–3 bullet benefits
- CTA to book a slot

Additional instructions:
{{user_prompt}}`,
      isActive: false,
    },
    {
      key: "cold_email",
      version: 3,
      label: "V3: Social proof + outcome",
      body: `Draft a {{formality}} cold email in {{language}} for {{lead_name}} ({{lead_email}}) at {{lead_company}}.

Structure:
- Subject: outcome-focused
- Opener: 1-line social proof (logo or metric)
- Outcome: what we achieve in numbers
- CTA: reply or 15-min call

Tone:
- Confident, concise, friendly

Product pitch:
{{product_pitch}}

Extra instructions:
{{user_prompt}}`,
      isActive: false,
    },
    {
      key: "cold_email",
      version: 4,
      label: "V4: Personalized hook + micro-CTA",
      body: `Compose a {{formality}} cold email in {{language}} to {{lead_name}} at {{lead_company}} ({{lead_email}}).

Guidelines:
- Personalized hook in first line (role/company)
- One-liner value proposition for {{lead_company}}
- Micro-CTA (e.g., "worth a quick reply?")

Keep it under 100 words.

Product pitch:
{{product_pitch}}

Prompt notes:
{{user_prompt}}`,
      isActive: false,
    },
  ];

  try {
    for (const t of templates) {
      await prisma.promptTemplate.upsert({
        where: { key_version: { key: t.key, version: t.version } },
        create: t,
        update: { label: t.label, body: t.body, isActive: t.isActive },
      });
    }
    res.json({ ok: true, inserted: templates.length });
  } catch (err) {
    console.error("Seeding templates failed:", err);
    res.status(500).json({ error: "Template seeding failed" });
  }
});

export default router;