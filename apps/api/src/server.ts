import Fastify from "fastify";
import cors from "@fastify/cors";
import { PrismaClient } from "@prisma/client";
import { z } from "zod";
import { calcClaimAmount, calcHourlyProduction } from "./mining";
import {
  FREE_OFFLINE_MAX_SECONDS,
  PREMIUM_OFFLINE_MAX_SECONDS,
  MINE_LEVELS
} from "./gameRules";

const prisma = new PrismaClient();
const app = Fastify({ logger: true });

app.register(cors, { origin: true });

// MVP auth: Telegram doğrulamasını bir sonraki adımda ekleyeceğiz.
// Şimdilik header ile telegramId alıyoruz.
function getTelegramId(req: any): string {
  const tg = req.headers["x-telegram-id"];
  if (!tg || typeof tg !== "string") throw new Error("Missing x-telegram-id");
  return tg;
}

app.get("/health", async () => ({ ok: true }));

app.post("/user/ensure", async (req) => {
  const telegramId = getTelegramId(req);
  const bodySchema = z.object({ username: z.string().optional() });
  const body = bodySchema.parse(req.body ?? {});

  const existing = await prisma.user.findUnique({ where: { telegramId } });
  if (existing) return existing;

  return prisma.user.create({
    data: {
      telegramId,
      username: body.username
    }
  });
});

app.get("/state", async (req) => {
  const telegramId = getTelegramId(req);

  const user = await prisma.user.findUnique({
    where: { telegramId },
    include: { mines: true }
  });

  if (!user) throw new Error("User not found");

  const hourlyProduction = calcHourlyProduction(user.mines);

  return {
    user: {
      borBalance: user.borBalance,
      lastClaimAt: user.lastClaimAt,
      isPremium: user.isPremium,
      premiumUntil: user.premiumUntil
    },
    mines: user.mines,
    hourlyProduction
  };
});

app.post("/mine/buy", async (req) => {
  const telegramId = getTelegramId(req);

  const bodySchema = z.object({
    level: z.number().int().min(1).max(3),
    starsPaid: z.number().int().min(0)
  });

  const body = bodySchema.parse(req.body);

  const price = MINE_LEVELS[body.level];
  if (!price) throw new Error("Invalid mine level");

  // MVP: Stars doğrulaması yok (Phase 1.1’de eklenecek)
  if (body.starsPaid < price.starCost) throw new Error("Not enough Stars (MVP)");


  const user = await prisma.user.findUnique({
    where: { telegramId },
    include: { mines: true }
  });

  if (!user) throw new Error("User not found");

  if (user.borBalance < price.borCost) throw new Error("Not enough BOR");

  await prisma.user.update({
    where: { id: user.id },
    data: { borBalance: user.borBalance - price.borCost }
  });

  await prisma.mine.create({
    data: { userId: user.id, level: body.level }
  });

  return { ok: true };
});

app.post("/claim", async (req) => {
  const telegramId = getTelegramId(req);

  const bodySchema = z.object({
    adWatched: z.boolean().default(false)
  });

  const body = bodySchema.parse(req.body ?? {});

  const user = await prisma.user.findUnique({
    where: { telegramId },
    include: { mines: true }
  });

  if (!user) throw new Error("User not found");

  const now = new Date();
  const elapsedSeconds = Math.floor((now.getTime() - user.lastClaimAt.getTime()) / 1000);

  const hourlyProduction = calcHourlyProduction(user.mines);

  const premiumActive =
    user.isPremium &&
    user.premiumUntil &&
    user.premiumUntil.getTime() > now.getTime();

  const maxSeconds = premiumActive ? PREMIUM_OFFLINE_MAX_SECONDS : FREE_OFFLINE_MAX_SECONDS;

  // Free kullanıcı claim = reklam şart
  if (!premiumActive && !body.adWatched) {
    throw new Error("Free claim için reklam gerekli");
  }

  const earned = calcClaimAmount({
    hourlyProduction,
    secondsElapsed: elapsedSeconds,
    maxSeconds
  });

  const updated = await prisma.user.update({
    where: { id: user.id },
    data: {
      borBalance: user.borBalance + earned,
      lastClaimAt: now
    }
  });

  return {
    ok: true,
    earned,
    borBalance: updated.borBalance,
    hourlyProduction
  };
});

app.listen({ port: 4000, host: "0.0.0.0" });