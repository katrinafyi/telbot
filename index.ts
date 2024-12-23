import type { Response as WorkerResponse, Request, ServiceWorkerGlobalScope, ExportedHandler } from '@cloudflare/workers-types';

// @ts-ignore
import registerHtml from './register.html';

declare var self: ServiceWorkerGlobalScope;
const { Response, fetch, addEventListener } = self;

import { eightball } from './8ball.js';
const { choice, ballAnswers, purchaseAnswersPos, purchaseAnswersNeg, thinkingAnswers } = eightball;


type Env = {
  TELEGRAM_BOT_KEY?: string,
  TELEGRAM_BOT_SECRET?: string,
};


function sleep(milliseconds: number): Promise<void> {
  return new Promise(r => setTimeout(r, milliseconds));
}


export default {
  async fetch(request: Request, env: Env): Promise<WorkerResponse> {
    const key = env.TELEGRAM_BOT_KEY;
    const secret = env.TELEGRAM_BOT_SECRET;
    if (!key || !secret) {
      throw new Error('bot key and secret are required!');
    }
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

    async function getMe(): Promise<any> {
      return (await (await fetch(telegram_api + '/getMe')).json() as any).result;
    }

    async function sendReply(message: any, text: string, editMessage: number | null = null) {
      const endpoint = editMessage == null ? '/sendMessage' : '/editMessageText';
      const payload: any = {
        chat_id: message.chat.id,
        text: text,
      };

      if (editMessage !== null) {
        payload.message_id = editMessage;
      } else {
        payload.reply_parameters = {
          message_id: message.message_id,
        };
      }

      const resp = await fetch(telegram_api + endpoint, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload),
      });

      const json: any = await resp.json();
      if (!resp.ok) {
        console.error(json);
        throw new Error(`telegram ${endpoint} failed`);
      }
      if (!json.ok) {
        console.error(json);
        throw new Error(`telegram ${endpoint} returned ok=False`);
      }

      // console.log(endpoint, json.result);
      return json.result;
    }

    async function handleCommand(message: any, cmdtext: string) {
      const commands = `
8ball - shake the magic 8 ball
ball - shake the magic 8 ball
approval - request purchase approval
buy - request purchase approval
`;
      const me = await getMe();
      const [cmd, botname] = cmdtext.split('@', 2);
      console.log(cmd, botname);
      if (botname && botname !== me.username) {
        console.log('ignoring message for different bot', botname);
        return;
      }

      const thinking: any = {};
      // const thinking = await sendReply(message, choice(thinkingAnswers));

      const delay = 1200+700*Math.random();
      await sleep(delay);

      let reply = `i don\u2019t know how to ${cmd.replace('/', '/\u200b')} :(`;
      switch (cmd) {
        case '/8ball':
        case '/ball':
          reply = choice(ballAnswers);
          break;
        case '/buy':
        case '/approval':
        case '/approve':
        case '/purchase':
          reply = 'Decision: ' + choice([...purchaseAnswersNeg, ...purchaseAnswersPos]);
          break;
      }

      await sendReply(message, reply, thinking.message_id);
    }

    // console.log(request.method, request.url);
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
