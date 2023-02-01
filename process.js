import { Configuration, OpenAIApi } from "openai";

const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);

export const computeMessageId = async (ctx) => {
  let messageId;
  try {
    messageId = await ctx.message.message_id;
  } catch (e) {
    // If error is of undefined type, it means that the message is an edited message
    if (e.name === "TypeError") {
      messageId = await ctx.update.edited_message.message_id;
    }
  }
  return messageId;
};

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

export const sendTextMessage = async (response, ctx) => {
  let message = "";
  response.data.choices.forEach((choice) => {
    message += choice.text;
  });
  ctx.reply(message, {
    reply_to_message_id: await computeMessageId(ctx),
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
  const loadingMessage = "Thinking...";
  const loadingMessageId = await ctx.reply(loadingMessage, {
    reply_to_message_id: await computeMessageId(ctx),
  });
  await func();
  ctx.deleteMessage(loadingMessageId.message_id);
};
