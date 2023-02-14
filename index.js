import { Telegraf } from "telegraf";

import {
  googleCurrency,
  googleDictionary,
  googleImageReverseSearch,
  googleImages,
  googleKP,
  googleSearchResults,
  googleTranslate,
} from "./search.js";

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
    `*Send a message to the bot and it will reply with a response generated by GPT-3.*

    You can also use the following commands:
  
*Commands:*

\`/image <text>\` - *Generate image from DALL-E based on text.*
\`/code <code comments>\` - *Generate code with Codex based on code comments.*
\`/s <query>\` - *Search on Google, knowledge graph included.*
\`/i <query>\` - *Search on Google Images.*
\`/d <word>\` - *Get the definition of a word.*
\`/t <language> <sentence>\` - *Translate a sentence to a language.*
\`/convert <amount> <input currency> to <output currency>\` - *Convert currency.*
\`/kp <query>\` - *Get knowledge panel of a query.*

*Examples:*
/image cute cat in a box
/code // This is a comment
/s Stephen Hawking
/i rainbow logos
/d procastination
/t spanish Hello world
/convert 100 dollars to rupees
/kp Stephen Hawking
`,
    {
      parse_mode: "Markdown",
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
  response = await genCode(prompt);
  sendMarkdownMessage(response, ctx);
});

bot.command("s", async (ctx) => {
  const query = ctx.message.text.slice(3);
  const response = await googleSearchResults(query);
  let message = `Showing search results for \`${query}\`\n\n`;
  response.forEach((result) => {
    message += `[${result.title}](${result.url})\n_${result.description}_\n\n`;
  });
  message &&
    ctx.reply(message, {
      parse_mode: "Markdown",
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

bot.command("d", async (ctx) => {
  const query = ctx.message.text.slice(3);
  const response = await googleDictionary(query);
  if (response.definitions.length > 0) {
    let message = `Word: <b>${response.word}</b> | <code>${response.phonetic}</code>\n\n`;
    message += `<u>Definitions:</u> \n\n`;
    response.definitions.forEach((definition) => {
      message += `<b><i>${definition}</i></b>\n\n`;
    });
    if (response.examples.length > 0) {
      message += `\n<u>Examples:</u> \n\n`;
      response.examples.forEach((example) => {
        message += `<i>${example}</i>\n\n`;
      });
    }
    message &&
      ctx.replyWithHTML(fmt(message, {
        parse_mode: "HTML",
      }), {
        reply_to_message_id: ctx.message.message_id,
      });
  } else {
    ctx.reply("No definition found.");
  }
});

bot.command("t", async (ctx) => {
  let query = ctx.message.text.slice(3);
  query = query.split(" ");
  // First word will be the language to translate to
  const language = query.shift();
  // Join the rest of the words to form the query
  query = query.join(" ");
  const response = await googleTranslate(query, language);
  if (response.target_text) {
    let message = `Translated from <b>${response.source_language}</b> to <b>${response.target_language}</b>\n\n`;
    message += `<u>Actual:</u> ${response.source_text}\n\n<u>Translated:</u> <b><code>${response.target_text}</code></b>`;
    message &&
      ctx.replyWithHTML(message, {
        reply_to_message_id: ctx.message.message_id,
      });
  } else {
    ctx.reply("Translation failed.");
  }
});

bot.command("i", async (ctx) => {
  const query = ctx.message.text.slice(3);
  const response = await googleImages(query);
  ctx.reply(`<b>Image search results for <code>${query}</code></b>\n\n`, {
    reply_to_message_id: ctx.message.message_id,
    parse_mode: "HTML",
  });
  response.forEach((result) => {
    ctx.replyWithPhoto(result.url, {
      caption: result.origin.title,
      caption_entities: [
        {
          type: "text_link",
          url: result.origin.website.url,
          offset: 0,
          length: result.origin.title.length,
        },
      ],
      reply_markup: {
        inline_keyboard: [
          [
            {
              text: "Delete",
              callback_data: "delete",
            },
          ],
        ],
      },
    });
  });
});

bot.command("kp", async (ctx) => {
  const query = ctx.message.text.slice(4);
  const response = await googleKP(query);
  if (response.title) {
    let message = `Knowledge panel for <code>${query}</code>\n\n`;
    message += `<u><b>${response.title}</b></u> - <i>${response.type}</i>\n\n`;
    message += `<i><b>${response.description}</b></i>\n\n`;
    response.metadata.forEach((metadata) => {
      message += `<u><b>${metadata.title}</b></u>: ${metadata.value}\n\n`;
    });
    response.songs.length > 0 &&
      (message += `\n<u><b>Songs:</b></u>\n\n`) &&
      response.songs.forEach((song) => {
        message += `<b>${song.title}</b> - <i>${song.album}</i>\n`;
      });
    response.books.length > 0 &&
      (message += `\n<u><b>Books:</b></u>\n\n`) &&
      response.books.forEach((book) => {
        message += `<b>${book.title}</b> - <i>${book.year}</i>\n`;
      });
    response.ratings.length > 0 &&
      (message += `\n<u><b>Ratings:</b></u>\n\n`) &&
      response.ratings.forEach((rating) => {
        message += `<b>${rating.name}</b>: <i>${rating.rating}</i>\n`;
      });
    response.tv_shows_and_movies.length > 0 &&
      (message += `\n<u><b>TV Shows and Movies:</b></u>\n\n`) &&
      response.tv_shows_and_movies.forEach((show) => {
        message += `<b>${show.title}</b> - <i>${show.year}</i>\n`;
      });
    response.socials.length > 0 &&
      (message += `\n<u><b>Socials:</b></u>\n`) &&
      response.socials.forEach((social) => {
        message += `<a href="${social.url}">${social.name}</a>\n`;
      });
    response.lyrics &&
      response.lyrics.length > 0 &&
      (message += `\n<u><b>Lyrics:</b></u>\n\n<i>${response.lyrics}</i>\n`);

    response.available_on &&
      response.available_on.length > 0 &&
      (message += `\n${response.available_on}\n`);

    response.demonstration && (message += `\n${response.demonstration}\n`);

    const reply_markup = response.url
      ? {
          inline_keyboard: [
            [
              {
                text: "Learn more",
                url: response.url,
              },
            ],
          ],
        }
      : {};

    ctx.replyWithHTML(message, {
      reply_to_message_id: ctx.message.message_id,
      reply_markup,
    });
  } else {
    ctx.reply(`No results found for <code>${query}</code>`, {
      reply_to_message_id: ctx.message.message_id,
    });
  }
});

// Currency converter: /convert 1 USD to INR
bot.hears(/\/convert \d+ \w+ to \w+/i, async (ctx) => {
  const query = ctx.message.text.slice(8);
  const response = await googleCurrency(query);
  let message = `<b>Conversion results for <code>${query}</code></b>\n\n`;
  message += `<u>${response.input.name}</u>: ${response.input.value}\n\n`;
  message += `<u>${response.output.name}</u>: ${response.output.value}`;
  message &&
    ctx.replyWithHTML(message, {
      reply_to_message_id: ctx.message.message_id,
    });
});

// Process all messages and reply with openai response
bot.on("message", async (ctx) => {
  const message = ctx.message;
  if (message.text) {
    let prompt;
    // If message is a reply, use the replied message as prompt along with the current message
    ctx.message.reply_to_message
      ? (prompt = ctx.message.reply_to_message.text + "\n" + ctx.message.text)
      : (prompt = ctx.message.text);
    const response = await genText(prompt);
    sendTextMessage(response, ctx);
  }
  if (message.photo && message.photo.length > 0) {
    // const photo = message.photo[message.photo.length - 1];
    // const photo_id  = photo.file_id;
    // let photo_url = (await bot.telegram.getFileLink(photo_id)).href;
    ctx.reply("We don't support photos yet.");
  }
  if (message.voice) {
    ctx.reply("Voice received. We don't support voice yet.");
  }
  if (message.document) {
    ctx.reply("We don't support documents yet.");
  }
  if (message.audio) {
    ctx.reply("We don't support audio yet.");
  }
  if (message.video) {
    ctx.reply("We don't support videos yet.");
  }
}).catch((err) => {
  console.log(`Error Occured: ${err}`);
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

bot.action("delete", async (ctx) => {
  const message = ctx.update.callback_query.message;
  ctx.telegram.deleteMessage(message.chat.id, message.message_id);
});

bot.launch();

// Enable graceful stop
process.once("SIGINT", () => bot.stop("SIGINT"));
process.once("SIGTERM", () => bot.stop("SIGTERM"));
