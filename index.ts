import type { Response as WorkerResponse, Request, ServiceWorkerGlobalScope, ExportedHandler } from '@cloudflare/workers-types';

// @ts-ignore
import registerHtml from './register.html';

declare var self: ServiceWorkerGlobalScope;
const { Response, fetch, addEventListener } = self;

type Env = { [key: string]: string };

import { eightball } from './8ball.js';


export default {
  async fetch(request: Request, env: Env): Promise<WorkerResponse> {
    const key = env.TELEGRAM_BOT_KEY;
    const secret = env.TELEGRAM_BOT_SECRET;
    console.assert(key);
    const telegram_api = `https://api.telegram.org/bot${key}`;

    function rawHtmlResponse(html: string): WorkerResponse {
      return new Response(html, {
        headers: { "content-type": "text/html;charset=UTF-8", },
      });
    }

    async function readRequestBody(request: Request) {
      const contentType = request.headers.get("content-type") ?? "unknown";
      if (contentType.includes("application/json")) {
        return JSON.stringify(await request.json());
      }
      return "not json";
    }

    async function sendReply(message: any, text: string) {
      const resp = await fetch(telegram_api + '/sendMessage', {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          chat_id: message.chat.id,
          text: text,
          reply_parameters: {
            message_id: message.message_id,
          },
        }),
      });
      if (!resp.ok) {
        console.error('telegram returned error', await resp.json());
      }
    }
    async function handleCommand(message: any, cmd: string) {
      const commands = `
8ball - shake the magic 8 ball
ball - shake the magic 8 ball
approval - request purchase approval
approve - request purchase approval
purchase - request purchase approval
`;
      const { choice, ballAnswers, purchaseAnswersPos, purchaseAnswersNeg } = eightball;
      switch (cmd) {
        case '/8ball':
        case '/ball':
          return sendReply(message, choice(ballAnswers));
        case '/approval':
        case '/approve':
        case '/purchase':
          return sendReply(message, choice([...purchaseAnswersNeg, ...purchaseAnswersPos]));
        default:
          return sendReply(message,
            `i don\u2019t know how to ${cmd.replace('/', '/\u200b')} :(`);
      }
    }

    console.log(request.method, request.url);
    const { url } = request;
    if (url.includes("register")) {
      return rawHtmlResponse(registerHtml);
    }

    if (request.method === "POST") {
      const headersecret = request.headers.get("X-Telegram-Bot-Api-Secret-Token") ?? "invalid";
      if (headersecret !== secret) {
        console.warn('secret did not match. claimed', headersecret);
        return new Response('denied');
      }

      const reqBody = JSON.parse(await readRequestBody(request));
      console.log('message keys ' + Object.keys(reqBody));
      const { message } = reqBody;
      if (message) {
        const { text, entities } = message;
        const cmds = (entities ?? []).filter((x: any) => x.type === 'bot_command');
        const cmdtexts: Array<string> = cmds.map((x: any) => text.substring(x.offset, x.offset + x.length));
        console.log('commands:', cmdtexts);
        await Promise.all(cmdtexts.map(handleCommand.bind(this, message)));
        return new Response('ok');
      } else {
        return new Response('unhandled');
      }
    } else {
      return rawHtmlResponse(`
        <style>* { font-family: sans-serif; }</style>
        <h2>telbot</h2>
        <a href="${URL.parse(request.url)!.origin}/register">register bot</a>
      `);
    }
  },
} satisfies ExportedHandler<Env>;
