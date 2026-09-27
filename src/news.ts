import { XMLParser } from 'fast-xml-parser';
import { CATEGORIES, FEEDS, FeedSource, Region } from './feeds';

export interface Article {
  id: string;
  title: string;
  link: string;
  summary: string;
  source: string;
  region: Region;
  publishedAt: number;
  categories: string[];
  // 後端 Worker 產生的中文標題與摘要（直接抓 RSS 時沒有）
  titleZh?: string;
  summaryZh?: string;
}

const parser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: '@' });

const text = (v: unknown): string => {
  if (v == null) return '';
  if (typeof v === 'object') return String((v as Record<string, unknown>)['#text'] ?? '');
  return String(v);
};

const stripHtml = (s: string) =>
  s.replace(/<[^>]*>/g, ' ').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/\s+/g, ' ').trim();

const asArray = <T,>(v: T | T[] | undefined): T[] => (v == null ? [] : Array.isArray(v) ? v : [v]);

async function fetchFeed(src: FeedSource): Promise<Article[]> {
  const res = await fetch(src.url);
  if (!res.ok) throw new Error(`${src.name}: HTTP ${res.status}`);
  const doc = parser.parse(await res.text());

  // RSS 2.0 → rss.channel.item；Atom → feed.entry
  const items = asArray(doc?.rss?.channel?.item ?? doc?.feed?.entry);
  return items.map((it: any) => {
    const link =
      typeof it.link === 'string'
        ? it.link
        : asArray(it.link).find((l: any) => !l['@rel'] || l['@rel'] === 'alternate')?.['@href'] ?? '';
    const title = stripHtml(text(it.title));
    const summary = stripHtml(text(it.description ?? it.summary ?? it.content)).slice(0, 200);
    const date = Date.parse(text(it.pubDate ?? it.published ?? it.updated)) || Date.now();
    const haystack = `${title} ${summary}`;
    return {
      id: `${src.name}:${link || title}`,
      title,
      link,
      summary,
      source: src.name,
      region: src.region,
      publishedAt: date,
      categories: CATEGORIES.filter((c) => c.keywords.test(haystack)).map((c) => c.key),
    };
  });
}

// 設定 EXPO_PUBLIC_API_URL（Worker 網址）後改從後端取得含中文摘要的新聞
const API_URL = process.env.EXPO_PUBLIC_API_URL;

export async function loadNews(): Promise<{ articles: Article[]; errors: string[] }> {
  if (API_URL) {
    try {
      const res = await fetch(`${API_URL}/news`);
      if (res.ok) return { articles: await res.json(), errors: [] };
    } catch {}
  }
  return fetchAllNews();
}

export async function fetchAllNews(): Promise<{ articles: Article[]; errors: string[] }> {
  const results = await Promise.allSettled(FEEDS.map(fetchFeed));
  const articles: Article[] = [];
  const errors: string[] = [];
  results.forEach((r, i) => {
    if (r.status === 'fulfilled') articles.push(...r.value);
    else errors.push(FEEDS[i].name);
  });
  const seen = new Set<string>();
  return {
    articles: articles
      .filter((a) => a.title && !seen.has(a.id) && seen.add(a.id))
      .sort((a, b) => b.publishedAt - a.publishedAt),
    errors,
  };
}
