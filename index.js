import { Telegraf } from "telegraf";

import { bingSearch } from "./search.js";

import {
  genCode,
  genText,
  genImage,
  sendTextMessage,
  sendMarkdownMessage,
  loadingWrapper,
} from "./process.js";

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
    return next();
  }
  ctx.reply("You are not allowed to use this bot.");
});

bot.command("image", async (ctx) => {
  loadingWrapper(ctx, async () => {
    const response = await genImage(ctx.message.text.slice(7));
    const images = response.data.data;
    images.forEach((image) => {
      ctx.replyWithPhoto(image.url);
    });
  });
});

bot.command("code", async (ctx) => {
  if (ctx.message.reply_to_message) {
    loadingWrapper(ctx, async () => {
      const response = await genCode(
        ctx.message.reply_to_message.text + "\n" + ctx.message.text.slice(6)
      );
      sendMarkdownMessage(response, ctx);
    });
  } else {
    loadingWrapper(ctx, async () => {
      const response = await genCode(ctx.message.text);
      sendMarkdownMessage(response, ctx);
    });
  }
});

bot.command("s", async (ctx) => {
  loadingWrapper(ctx, async () => {
    const query = ctx.message.text.slice(3);
    const response = await bingSearch(query);
    let message = `<b>Search results for <code>${query}</code></b>\n`
    response.forEach((result) => {
      message += `<a href="${result.url}">${result.title}</a>\n<i>${result.description}</i>\n\n`;
    });
    message &&
      ctx.replyWithHTML(message, {
        reply_to_message_id: ctx.message.message_id,
      });
  });
});

// Process all messages and reply with openai response
bot.on("message", async (ctx) => {
  // If message is a reply, use the replied message as prompt along with the current message
  if (ctx.message.reply_to_message) {
    loadingWrapper(ctx, async () => {
      const response = await genText(
        ctx.message.reply_to_message.text + "\n" + ctx.message.text
      );
      sendTextMessage(response, ctx);
    });
  } else {
    loadingWrapper(ctx, async () => {
      const response = await genText(ctx.message.text);
      sendTextMessage(response, ctx);
    });
  }
});

bot.on("edited_message", async (ctx) => {
  loadingWrapper(ctx, async () => {
    const message = ctx.update.edited_message;
    //  If message is not a command prefixed with "/"
    if (message.text[0] !== "/") {
      if (message.reply_to_message) {
        const response = await genText(
          message.reply_to_message.text + "\n" + message.text
        );
        sendTextMessage(response, ctx);
      } else {
        const response = await genText(message.text);
        sendTextMessage(response, ctx);
      }
    } else {
      ctx.reply("Commands are not supported in edited messages.");
    }
  });
});

bot.launch();

// Enable graceful stop
process.once("SIGINT", () => bot.stop("SIGINT"));
process.once("SIGTERM", () => bot.stop("SIGTERM"));
