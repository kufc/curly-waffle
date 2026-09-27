import Anthropic from '@anthropic-ai/sdk';
import { Article, fetchAllNews } from '../../src/news';

interface Env {
  NEWS: KVNamespace;
  ANTHROPIC_API_KEY: string;
}

export interface NewsItem extends Article {
  titleZh: string;
  summaryZh: string;
}

const KEEP = 300; // KV 中保留的最新新聞數
const PER_RUN = 25; // 每次排程最多摘要幾則新文章（控制 API 費用）

const SYSTEM = `你是科技新聞編輯。把每則新聞翻譯並濃縮成台灣慣用的繁體中文：
- titleZh：精簡標題，30 字內，專有名詞保留原文（如 Nvidia、iPhone）
- summaryZh：2 句、80 字內的重點摘要，只根據提供的內容，不要臆測
原文已是中文時直接潤飾即可。`;

async function summarize(env: Env, items: Article[]) {
  const client = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY });
  const input = items.map((a) => ({ id: a.id, title: a.title, summary: a.summary }));

  const response = await client.beta.messages.create({
    model: 'claude-opus-5',
    max_tokens: 16000,
    betas: ['server-side-fallback-2026-07-01'],
    fallbacks: 'default',
    output_config: {
      effort: 'low',
      format: {
        type: 'json_schema',
        schema: {
          type: 'object',
          properties: {
            items: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  titleZh: { type: 'string' },
                  summaryZh: { type: 'string' },
                },
                required: ['id', 'titleZh', 'summaryZh'],
                additionalProperties: false,
              },
            },
          },
          required: ['items'],
          additionalProperties: false,
        },
      },
    },
    system: SYSTEM,
    messages: [{ role: 'user', content: JSON.stringify(input) }],
  });

  if (response.stop_reason === 'refusal') return new Map<string, { titleZh: string; summaryZh: string }>();
  const text = response.content.find((b: { type: string }) => b.type === 'text') as { text: string } | undefined;
  const parsed = JSON.parse(text?.text ?? '{"items":[]}') as { items: { id: string; titleZh: string; summaryZh: string }[] };
  return new Map(parsed.items.map((i) => [i.id, i]));
}

async function refresh(env: Env) {
  const [{ articles }, stored] = await Promise.all([
    fetchAllNews(),
    env.NEWS.get<NewsItem[]>('articles', 'json'),
  ]);
  const existing = new Map((stored ?? []).map((a) => [a.id, a]));
  const fresh = articles.filter((a) => !existing.has(a.id)).slice(0, PER_RUN);

  let zh = new Map<string, { titleZh: string; summaryZh: string }>();
  if (fresh.length) {
    try {
      zh = await summarize(env, fresh);
    } catch (e) {
      console.error('summarize failed', e);
    }
  }

  const added: NewsItem[] = fresh.map((a) => ({
    ...a,
    titleZh: zh.get(a.id)?.titleZh ?? a.title,
    summaryZh: zh.get(a.id)?.summaryZh ?? a.summary,
  }));
  const merged = [...added, ...existing.values()]
    .sort((a, b) => b.publishedAt - a.publishedAt)
    .slice(0, KEEP);
  await env.NEWS.put('articles', JSON.stringify(merged));
  return added.length;
}

export default {
  async fetch(req: Request, env: Env): Promise<Response> {
    const url = new URL(req.url);
    if (url.pathname === '/news') {
      const data = (await env.NEWS.get('articles')) ?? '[]';
      return new Response(data, {
        headers: {
          'content-type': 'application/json; charset=utf-8',
          'cache-control': 'public, max-age=60',
          'access-control-allow-origin': '*',
        },
      });
    }
    return new Response('Not found', { status: 404 });
  },

  async scheduled(_event: ScheduledController, env: Env, ctx: ExecutionContext) {
    ctx.waitUntil(refresh(env).then((n) => console.log(`added ${n} articles`)));
  },
} satisfies ExportedHandler<Env>;
