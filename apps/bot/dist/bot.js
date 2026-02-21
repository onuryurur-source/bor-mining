"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const telegraf_1 = require("telegraf");
const token = process.env.TELEGRAM_BOT_TOKEN;
const webappUrl = process.env.WEBAPP_URL;
const bot = new telegraf_1.Telegraf(token);
bot.start(async (ctx) => {
    const name = ctx.from?.first_name ?? "madenci";
    await ctx.reply(`👑 Hoş geldin ${name}!

⛏️ Bor Mining başlıyor.
Maden imparatorluğunu kurmaya hazır mısın?`, telegraf_1.Markup.inlineKeyboard([
        telegraf_1.Markup.button.webApp("⛏️ Bor Mining'i Aç", webappUrl)
    ]));
});
bot.command("app", async (ctx) => {
    await ctx.reply("Mini App:", telegraf_1.Markup.inlineKeyboard([
        telegraf_1.Markup.button.webApp("Aç", webappUrl)
    ]));
});
bot.launch();
console.log("Bor Mining Bot çalışıyor 🚀");
