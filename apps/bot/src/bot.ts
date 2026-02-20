import "dotenv/config";
import { Telegraf, Markup } from "telegraf";

const token = process.env.TELEGRAM_BOT_TOKEN!;
const webappUrl = process.env.WEBAPP_URL!;

const bot = new Telegraf(token);

bot.start(async (ctx) => {
  const name = ctx.from?.first_name ?? "madenci";

  await ctx.reply(
    `👑 Hoş geldin ${name}!

⛏️ Bor Mining başlıyor.
Maden imparatorluğunu kurmaya hazır mısın?`,
    Markup.inlineKeyboard([
      Markup.button.webApp("⛏️ Bor Mining'i Aç", webappUrl)
    ])
  );
});

bot.command("app", async (ctx) => {
  await ctx.reply(
    "Mini App:",
    Markup.inlineKeyboard([
      Markup.button.webApp("Aç", webappUrl)
    ])
  );
});

bot.launch();

console.log("Bor Mining Bot çalışıyor 🚀");