import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const key = 'cold_email';
  const templates = [
    {
      key,
      version: 1,
      label: 'Short formal intro',
      isActive: true,
      body: `
Context:
- Your role/product: {{product_pitch}}
- Receiver: {{lead_name}} ({{lead_email}}) at {{lead_company}}

Goals:
- Briefly introduce value
- One clear CTA (15-min call or reply)

Constraints:
- 120 words max
- No jargon
- Subject line + body

User instructions:
{{user_prompt}}

Write a subject and body only.`
    },
    {
      key,
      version: 2,
      label: 'Value-first with micro-proof',
      isActive: false,
      body: `
You are a helpful email assistant.
Write a concise {{formality}} cold email in {{language}} to {{lead_name}} at {{lead_company}} ({{lead_email}}).
Open with the outcome, then 1 proof point, then 1 CTA.
Keep it under 120 words.

Additional instructions:
{{user_prompt}}

Return subject and body only.`
    },
    {
      key,
      version: 3,
      label: 'Problem → Solution → CTA',
      isActive: false,
      body: `
Problem → Solution → CTA framework.

Receiver: {{lead_name}} ({{lead_email}}), {{lead_company}}
Product: {{product_pitch}}
Style: {{formality}} in {{language}}
User notes: {{user_prompt}}

Output just a subject and a body (max 120 words).`
    },
    {
      key,
      version: 4,
      label: 'Conversational opener',
      isActive: false,
      body: `
Write a friendly, conversational cold email to {{lead_name}} ({{lead_email}}) at {{lead_company}}.
Introduce {{product_pitch}} in one sentence.
Ask a simple question as the CTA.
Max 120 words. {{language}}, {{formality}}.

User notes:
{{user_prompt}}

Return subject and body only.`
    },
  ];

  for (const t of templates) {
    await prisma.promptTemplate.upsert({
      where: { key_version: { key: t.key, version: t.version } },
      create: t,
      update: { ...t },
    });
  }

  await prisma.promptTemplate.updateMany({
    where: { key },
    data: { isActive: false },
  });
  await prisma.promptTemplate.update({
    where: { key_version: { key, version: 1 } },
    data: { isActive: true },
  });

  console.log('Seeded prompt templates for key "cold_email".');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });