# ChatBot Telegram

## Description

This is a simple chatbot for Telegram that uses GPT-3 Model from OpenAI. It is based on the [Telegram Bot API](https://core.telegram.org/bots/api) and [Telegraf](https://npmjs.com/package/telegraf).

## Deploy to Cloud

### [Deploy](https://fly.io/docs/languages-and-frameworks/node/) to Fly.io

```bash
flyctl deploy
```

## Requiremed environment variables

- `BOT_TOKEN` - Telegram Bot Token.
- `OPENAI_API_KEY` - OpenAI API Key.
- `AUTHORIZED_USERS` - Comma separated list of authorized usernames to use the bot.