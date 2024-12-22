# telbot

A serverless, framework-less Telegram bot, receiving events via [webhook notifications](https://core.telegram.org/bots/api#setwebhook)
and interacting with Telegram via manual API calls.

This is designed to be deployed to [Cloudflare Workers](https://developers.cloudflare.com/workers/runtime-apis/).
See [here](https://developers.cloudflare.com/workers/runtime-apis/) for supported features.

## Development

Get started with the [Telegram bot tutorial](https://core.telegram.org/bots/tutorial).
Register a new bot and obtain its bot token.

Create a `.dev.vars` file to store local secrets:
```bash
cp .dev.vars template.dev.vars
```
Fill in the bot token and set the "secret" to a new string.
The secret is used to authenticate notifications to your webhook.

Start a local development server:
```bash
npm exec wrangler dev
```
Take note of the localhost address.

## Register webhook
Telegram has to be told the address of the bot, in order to send it webhook notifications.

If you are running a local dev server, you will have to make this publicly accessible somehow.
For instance, create a Cloudflare tunnel to your local address:
```bash
cloudflared tunnel --url http://localhost:8787
```
Or, use a similar tunnel service.

Once the bot has a public address, go to /register of the bot's public address.
Fill in the bot token and the bot secret, matching the .dev.vars file.
Click "Register webhook" to submit the Telegram API call.
You will be redirected to the API response which hopefully says `ok:true`.

## Deploy

Deploy the bot with:
```bash
npm exec wrangler deploy
```

Add secrets, entering the content of the secret when prompted:
```bash
npm exec wrangler secret put TELEGRAM_BOT_KEY
npm exec wrangler secret put TELEGRAM_BOT_SECRET
```
