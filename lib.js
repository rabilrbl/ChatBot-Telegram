import { Configuration, OpenAIApi } from "openai";
import { fmt } from "telegraf/format";

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
      try {
        messageId = await ctx.update.edited_message.message_id; // Get the message id of the edited message
      } catch (e) {
        if (e.name === "TypeError") {
          messageId = await ctx.update.callback_query.message.message_id; // Get the message id of the message from which the callback button clicked
        } else {
          throw e;
        }
      }
    } else {
      throw e;
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
  return await openai.createChatCompletion({
    model: "gpt-3.5-turbo",
    messages: prompt,
  });
};

export const genImage = async (prompt) => {
  return await openai.createImage({
    prompt: prompt,
    n: 2,
  });
};

export const sendTextMessage = async (response, ctx, editMessage = false) => {
  let message = "";
  response.data.choices.forEach((choice) => {
    message += choice.text;
  });
  const reply_markup = {
    inline_keyboard: [
      [
        {
          text: "Regenerate",
          callback_data: "regenerate",
        },
      ],
    ],
  };
  message
    ? !editMessage
      ? ctx.reply(fmt(message), {
          reply_to_message_id: await computeMessageId(ctx),
          reply_markup,
        })
      : ctx.editMessageText(fmt(message), {
          // Update the message with the new response
          reply_markup,
        })
    : ctx.reply("No response from the GPT");
};

export const sendMarkdownMessage = (response, ctx) => {
  let message = "";
  response.data.choices.forEach((choice) => {
    message += choice.text;
  });
  message
    ? ctx.replyWithMarkdown(
        fmt(message, {
          parse_mode: "Markdown",
        }),
        {
          reply_to_message_id: ctx.message.message_id,
        }
      )
    : ctx.reply("No response from the GPT");
};

export const loadingWrapper = async (ctx, func) => {
  const loadingMessage = "Thinking...";
  const loadingMessageId = await ctx.reply(loadingMessage, {
    reply_to_message_id: await computeMessageId(ctx),
  });
  await func();
  ctx.deleteMessage(loadingMessageId.message_id);
};
