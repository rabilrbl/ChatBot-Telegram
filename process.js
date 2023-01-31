import { Configuration, OpenAIApi } from "openai";

const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);

export const genCode = async (prompt) => {
  return await openai.createCompletion({
    model: "code-davinci-002",
    prompt: prompt,
    temperature: 0.7,
    max_tokens: 2000,
  });
};

export const genText = async (prompt) => {
  return await openai.createCompletion({
    model: "text-davinci-003",
    prompt: prompt,
    temperature: 0.7,
    max_tokens: 500,
  });
};

export const genImage = async (prompt) => {
  return await openai.createImage({
    prompt: prompt,
    n: 2,
  });
};

export const sendTextMessage = (response, ctx) => {
  let message = "";
  response.data.choices.forEach((choice) => {
    message += choice.text;
  });
  ctx.reply(message, {
    reply_to_message_id: ctx.message.message_id,
  });
};

export const sendMarkdownMessage = (response, ctx) => {
  let message = "";
  response.data.choices.forEach((choice) => {
    message += choice.text;
  });
  ctx.replyWithMarkdown(message, {
    reply_to_message_id: ctx.message.message_id,
  });
};

export const loadingWrapper = async (ctx, func) => {
  const msg = await ctx.reply("Thinking...");
  await func();
  ctx.deleteMessage(msg.message_id);
};
