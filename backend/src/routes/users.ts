import express from "express";
import { PrismaClient } from "@prisma/client";

const router = express.Router();
const prisma = new PrismaClient();


router.get("/:userId/credits", async (req, res) => {
  const { userId } = req.params;

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { credits: true },
    });

    if (!user) return res.status(404).json({ error: "User not found" });

    res.json({ credits: user.credits });
  } catch (err) {
    console.error("Error fetching user credits:", err);
    res.status(500).json({ error: "Failed to fetch user credits" });
  }
});

router.get("/:userId/purchases", async (req, res) => {
  const { userId } = req.params;

  try {
    const purchases = await prisma.creditPurchase.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });

    res.json(purchases);
  } catch (err) {
    console.error("Error fetching purchases:", err);
    res.status(500).json({ error: "Failed to fetch purchases" });
  }
});

export default router;