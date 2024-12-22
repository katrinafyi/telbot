import type { Response as WorkerResponse, Request, ServiceWorkerGlobalScope, ExportedHandler } from '@cloudflare/workers-types';

// @ts-ignore
import registerHtml from './register.html';

declare var self: ServiceWorkerGlobalScope;
const { Response, fetch, addEventListener } = self;

type Env = { [key: string]: string };

import {eightball} from './8ball.js';


export default {
  async fetch(request: Request, env: Env): Promise<WorkerResponse> {
    const key = env.TELEGRAM_BOT_KEY;
    const secret = env.TELEGRAM_BOT_SECRET;
    console.assert(key);
    const telegram_api = `https://api.telegram.org/bot${key}`;

    /**
     * rawHtmlResponse returns HTML inputted directly
     * into the worker script
     * @param {string} html
     */
    function rawHtmlResponse(html: string) {
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
      await fetch(telegram_api + '/sendMessage', {
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
          }
        }),
      });
    }

    async function handleCommand(message: any, cmd: string) {
      if (cmd === '/8ball' || cmd === '/ball') {
        return sendReply(message, eightball.getAnswer());
      } else {
        return sendReply(message, `i don't know how to ${cmd} :(`);
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
      console.log('message keys', Object.keys(reqBody));
      const { message } = reqBody;
      if (message) {
        const { text, entities } = message;
        const cmds = (entities ?? []).filter((x: any) => x.type === 'bot_command');
        const cmdtexts: Array<string> = cmds.map((x: any) => text.substring(x.offset, x.offset + x.length));
        await Promise.all(cmdtexts.map(handleCommand.bind(this, message)));
        return new Response('ok');
      } else {
        return new Response('unhandled');
      }
    } else {
      return new Response("The request was a " + request.method);
    }
  },
} satisfies ExportedHandler<Env>;
