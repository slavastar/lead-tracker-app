import express from "express";
import Stripe from "stripe";
import { PrismaClient } from "@prisma/client";
import dotenv from "dotenv";

dotenv.config();

const router = express.Router();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
const prisma = new PrismaClient();


const CREDITS_PER_PURCHASE = 10;

router.post(
  "/",
  express.raw({ type: "application/json" }),
  async (req, res) => {
    const sig = req.headers["stripe-signature"];
    const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

    if (!endpointSecret) {
      console.error("STRIPE_WEBHOOK_SECRET is not set");
      return res.status(500).send("Server misconfiguration");
    }

    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(req.body, sig as string, endpointSecret);
      console.log("Webhook event received:", event.type);
    } catch (err) {
      console.error("Webhook signature error:", err);
      return res.status(400).send("Webhook Error");
    }

    try {
      if (event.type === "checkout.session.completed") {
        const session = event.data.object as Stripe.Checkout.Session;

        if (session.payment_status !== "paid") {
          console.log("Session not paid yet, skipping.");
          return res.status(200).send();
        }

        const userId = session.metadata?.userId;
        if (!userId) {
          console.warn("No userId in session metadata; cannot credit user.");
          return res.status(200).send();
        }

        await prisma.$transaction([
          prisma.user.update({
            where: { id: userId },
            data: { credits: { increment: CREDITS_PER_PURCHASE } },
          }),
          prisma.creditPurchase.create({
            data: {
              userId,
              credits: CREDITS_PER_PURCHASE,
            },
          }),
        ]);

        console.log(`Incremented credits by ${CREDITS_PER_PURCHASE} and logged purchase for user ${userId}`);
      }

      res.status(200).send();
    } catch (err) {
      console.error("Webhook processing error:", err);
      res.status(200).send();
    }
  }
);

export default router;