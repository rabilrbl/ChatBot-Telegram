import { Telegraf } from "telegraf";

import { bingSearch } from "./search.js";

import {
  genCode,
  genText,
  genImage,
  sendTextMessage,
  sendMarkdownMessage,
  loadingWrapper,
} from "./lib.js";

const AUTHORIZED_USERS = process.env.AUTHORIZED_USERS.split(",");

const bot = new Telegraf(process.env.BOT_TOKEN);

bot.start((ctx) => ctx.reply("Welcome!"));

bot.help((ctx) =>
  ctx.reply(
    `<b><i>Send a message to the bot and it will reply with a response generated by GPT-3.</i></b>
  
<b>Commands:</b>
  <code>/image {input}</code> - <i>Generate an image from text input. Uses Dall-E.</i>
  <code>/code {code comments}</code> - <i>Generate program from text with code comments.  Uses Codex.</i>
`,
    {
      parse_mode: "HTML",
    }
  )
);

// Restrict this bot to only user named "username"
bot.use((ctx, next) => {
  if (AUTHORIZED_USERS.includes(ctx.from.username)) {
    return loadingWrapper(ctx, async () => {
      await next();
    });
  }
  ctx.reply("You are not allowed to use this bot.");
});

bot.command("image", async (ctx) => {
  const response = await genImage(ctx.message.text.slice(7));
  const images = response.data.data;
  images.forEach((image) => {
    ctx.replyWithPhoto(image.url);
  });
});

bot.command("code", async (ctx) => {
  let prompt;
  ctx.message.reply_to_message
    ? (prompt =
        ctx.message.reply_to_message.text.slice(6) +
        "\n" +
        ctx.message.text.slice(6))
    : (prompt = ctx.message.text.slice(6));
  response = await genCode(ctx.message.text);
  sendMarkdownMessage(response, ctx);
});

bot.command("s", async (ctx) => {
  const query = ctx.message.text.slice(3);
  const response = await bingSearch(query);
  let message = `<b>Search results for <code>${query}</code></b>\n\n`;
  response.forEach((result) => {
    message += `<a href="${result.url}">${result.title}</a>\n<i>${result.description}</i>\n\n`;
  });
  message &&
    ctx.replyWithHTML(message, {
      reply_to_message_id: ctx.message.message_id,
      reply_markup: {
        inline_keyboard: [
          [
            {
              text: "Bing",
              url: `https://www.bing.com/search?q=${query}`,
            },
            {
              text: "Google",
              url: `https://www.google.com/search?q=${query}`,
            },
            {
              text: "You",
              url: `https://you.com/search?q=${query}`,
            },
          ],
        ],
      },
    });
});

// Process all messages and reply with openai response
bot.on("message", async (ctx) => {
  let prompt;
  // If message is a reply, use the replied message as prompt along with the current message
  ctx.message.reply_to_message
    ? (prompt = ctx.message.reply_to_message.text + "\n" + ctx.message.text)
    : (prompt = ctx.message.text);
  const response = await genText(prompt);
  sendTextMessage(response, ctx);
});

bot.on("edited_message", async (ctx) => {
  const message = ctx.update.edited_message;
  //  If message is not a command prefixed with "/"
  if (message.text[0] !== "/") {
    let prompt;
    message.reply_to_message
      ? (prompt = message.reply_to_message.text + "\n" + message.text)
      : (prompt = message.text);
    const response = await genText(prompt);
    sendTextMessage(response, ctx);
  } else {
    ctx.reply(
      `Commands are not supported in edited messages. You can paste this in a new message.\n<code>${message.text}</code>`,
      {
        parse_mode: "HTML",
      }
    );
  }
});

bot.action("regenerate", async (ctx) => {
  const message = ctx.update.callback_query.message;
  const prompt = message.reply_to_message.text;
  const response = await genText(prompt);
  sendTextMessage(response, ctx, true);
});

bot.launch();

// Enable graceful stop
process.once("SIGINT", () => bot.stop("SIGINT"));
process.once("SIGTERM", () => bot.stop("SIGTERM"));
