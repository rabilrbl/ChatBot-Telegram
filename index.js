import { Telegraf } from "telegraf";

import { Configuration, OpenAIApi } from "openai";

const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);
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

const genCode = async (prompt) => {
  return await openai.createCompletion({
    model: "code-davinci-002",
    prompt: prompt,
    temperature: 0.7,
    max_tokens: 2000,
  });
};

const genText = async (prompt) => {
  return await openai.createCompletion({
    model: "text-davinci-003",
    prompt: prompt,
    temperature: 0.7,
    max_tokens: 500,
  });
};

const genImage = async (prompt) => {
  return await openai.createImage({
    prompt: prompt,
    n: 2,
  });
};

const sendTextMessage = (response, ctx) => {
  let message = "";
  response.data.choices.forEach((choice) => {
    message += choice.text;
  });
  ctx.reply(message, {
    reply_to_message_id: ctx.message.message_id,
  });
};

const sendMarkdownMessage = (response, ctx) => {
  let message = "";
  response.data.choices.forEach((choice) => {
    message += choice.text;
  });
  ctx.replyWithMarkdown(message, {
    reply_to_message_id: ctx.message.message_id,
    parse_mode: "Markdown",
  });
};

// Restrict this bot to only user named "username"
bot.use((ctx, next) => {
  if (AUTHORIZED_USERS.includes(ctx.from.username)) {
    return next();
  }
  ctx.reply("You are not allowed to use this bot");
});

bot.command("image", async (ctx) => {
  const response = await genImage(ctx.message.text);
  const images = response.data.data;
  images.forEach((image) => {
    ctx.replyWithPhoto(image.url);
  });
});

bot.command("code", async (ctx) => {
  if (ctx.message.reply_to_message) {
    const response = await genCode(
      ctx.message.reply_to_message.text + "\n" + ctx.message.text
    );
    sendMarkdownMessage(response, ctx);
  } else {
    const response = await genCode(ctx.message.text);
    sendMarkdownMessage(response, ctx);
  }
});

// Process all messages and reply with openai response
bot.on("message", async (ctx) => {
  // If message is a reply, use the replied message as prompt along with the current message
  if (ctx.message.reply_to_message) {
    const response = await genText(
      ctx.message.reply_to_message.text + "\n" + ctx.message.text
    );
    sendTextMessage(response, ctx);
  } else {
    const response = await genText(ctx.message.text);
    sendTextMessage(response, ctx);
  }
});

bot.launch();
