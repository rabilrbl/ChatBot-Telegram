# ChatBot Telegram

## Description

This is a simple chatbot for Telegram that uses GPT-3 Model from OpenAI. It is based on the [Telegram Bot API](https://core.telegram.org/bots/api) and [Telegraf](https://npmjs.com/package/telegraf).

## Usage and Commands
- #### Send a text message to the bot - It will reply with a message generated by GPT-3.
- #### `/start` - Start the bot.
- #### `/help` - Show help.
- #### `/image <text>` - Generate image from DALL-E based on text.
- #### `/code <code comments>` - Generate code with Codex based on code comments.
- #### `/s <query>` - Search on Google, knowledge graph included.
- #### `/i <query>` - Search on Google Images.
- #### `/d <word>` - Get the definition of a word.
- #### `/t <language> <sentence>` - Translate a sentence to a language.
- #### `/convert <amount> <input currency> to <output currency>` - Convert currency.
- #### `/kp <query>` - Display Knowledge Panel from Google.

## Deploy to Cloud

 Deploy to any cloud provider with Docker

## Required environment variables

- `BOT_TOKEN` - Telegram Bot Token.
- `OPENAI_API_KEY` - OpenAI API Key.
- `AUTHORIZED_USERS` - Comma separated list of authorized usernames to use the bot.
