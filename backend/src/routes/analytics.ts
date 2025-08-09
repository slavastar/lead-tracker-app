import express from "express";
import { PrismaClient } from "@prisma/client";

const router = express.Router();
const prisma = new PrismaClient();

type Period = "minute" | "hour" | "day";

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function stepMs(period: Period): number {
  switch (period) {
    case "minute": return 60_000;
    case "hour":   return 3_600_000;
    case "day":    return 86_400_000;
  }
}

function truncateToBucket(date: Date, period: Period): Date {
  const d = new Date(date);
  d.setSeconds(0, 0);
  if (period === "minute") return d;

  d.setMinutes(0, 0, 0);
  if (period === "hour") return d;

  // day
  d.setHours(0, 0, 0, 0);
  return d;
}


router.get("/credits", async (req, res) => {
  const userId = String(req.query.userId || "");
  const period = (String(req.query.period || "day") as Period);
  const limit  = clamp(parseInt(String(req.query.limit || "14"), 10) || 14, 1, 200);

  if (!userId) {
    return res.status(400).json({ error: "Missing userId" });
  }
  if (!["minute", "hour", "day"].includes(period)) {
    return res.status(400).json({ error: "Invalid period" });
  }

  try {
    const now = new Date();
    const bucketStep = stepMs(period);
    const endBucket = truncateToBucket(now, period);
    const startBucket = new Date(endBucket.getTime() - (limit - 1) * bucketStep);

    const purchases = await prisma.creditPurchase.findMany({
      where: {
        userId,
        createdAt: {
          gte: startBucket,
          lte: new Date(endBucket.getTime() + bucketStep - 1),
        },
      },
      select: { credits: true, createdAt: true },
      orderBy: { createdAt: "asc" },
    });

    const bucketMap = new Map<number, number>();
    for (const p of purchases) {
      const bucketStart = truncateToBucket(p.createdAt, period).getTime();
      bucketMap.set(bucketStart, (bucketMap.get(bucketStart) || 0) + (p.credits || 0));
    }

    const series: { bucketStart: string; credits: number }[] = [];
    for (let i = 0; i < limit; i++) {
      const t = startBucket.getTime() + i * bucketStep;
      series.push({
        bucketStart: new Date(t).toISOString(),
        credits: bucketMap.get(t) || 0,
      });
    }

    return res.json({ period, limit, series });
  } catch (err) {
    console.error("[/api/analytics/credits] Failed:", err);
    return res.status(500).json({ error: "Failed to load analytics" });
  }
});

export default router;