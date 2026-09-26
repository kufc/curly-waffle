export type Region = 'tw' | 'intl' | 'dev';

export interface FeedSource {
  name: string;
  url: string;
  region: Region;
}

// 可自行增減。未來改由後端統一抓取、翻譯與摘要後再下發給 App。
export const FEEDS: FeedSource[] = [
  { name: 'iThome', url: 'https://www.ithome.com.tw/rss', region: 'tw' },
  { name: '數位時代', url: 'https://www.bnext.com.tw/rss', region: 'tw' },
  { name: 'INSIDE', url: 'https://www.inside.com.tw/feed/rss', region: 'tw' },
  { name: 'TechNews 科技新報', url: 'https://technews.tw/feed/', region: 'tw' },
  { name: 'The Verge', url: 'https://www.theverge.com/rss/index.xml', region: 'intl' },
  { name: 'TechCrunch', url: 'https://techcrunch.com/feed/', region: 'intl' },
  { name: 'Ars Technica', url: 'https://feeds.arstechnica.com/arstechnica/index', region: 'intl' },
  { name: 'Wired', url: 'https://www.wired.com/feed/rss', region: 'intl' },
  { name: 'Hacker News', url: 'https://hnrss.org/frontpage', region: 'dev' },
];

export const CATEGORIES: { key: string; label: string; keywords: RegExp }[] = [
  { key: 'ai', label: 'AI', keywords: /\b(AI|GPT|LLM|Claude|Gemini|OpenAI|Anthropic)\b|人工智慧|生成式|模型/i },
  { key: 'mobile', label: '手機', keywords: /iPhone|Android|Pixel|Galaxy|iOS|手機|smartphone/i },
  { key: 'security', label: '資安', keywords: /security|breach|malware|ransomware|vulnerab|hack|資安|漏洞|駭客|勒索/i },
  { key: 'chip', label: '半導體', keywords: /chip|semiconductor|TSMC|Nvidia|Intel|AMD|Qualcomm|晶片|半導體|台積電/i },
];
