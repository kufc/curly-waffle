import { StatusBar } from 'expo-status-bar';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Linking,
  Pressable,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  useColorScheme,
  View,
} from 'react-native';
import { CATEGORIES } from './src/feeds';
import { Article, loadNews } from './src/news';

const FILTERS = [
  { key: 'all', label: '全部' },
  { key: 'tw', label: '國內' },
  { key: 'intl', label: '國外' },
  { key: 'dev', label: '開發者' },
  ...CATEGORIES.map(({ key, label }) => ({ key, label })),
];

const palette = {
  light: { bg: '#F6F7F9', card: '#FFFFFF', text: '#111418', sub: '#5B6470', accent: '#2563EB', chip: '#E6E9EE' },
  dark: { bg: '#0E1116', card: '#171B22', text: '#E8EAED', sub: '#9AA3AE', accent: '#60A5FA', chip: '#232933' },
};

function timeAgo(ts: number) {
  const m = Math.max(1, Math.round((Date.now() - ts) / 60000));
  if (m < 60) return `${m} 分鐘前`;
  const h = Math.round(m / 60);
  return h < 24 ? `${h} 小時前` : `${Math.round(h / 24)} 天前`;
}

export default function App() {
  const c = palette[useColorScheme() === 'dark' ? 'dark' : 'light'];
  const [articles, setArticles] = useState<Article[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState('all');
  const [query, setQuery] = useState('');

  const load = useCallback(async () => {
    const r = await loadNews();
    setArticles(r.articles);
    setErrors(r.errors);
  }, []);

  useEffect(() => {
    load().finally(() => setLoading(false));
  }, [load]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }, [load]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return articles.filter((a) => {
      const okFilter = filter === 'all' || a.region === filter || a.categories.includes(filter);
      const okQuery = !q || `${a.title} ${a.titleZh ?? ''} ${a.summary} ${a.summaryZh ?? ''}`.toLowerCase().includes(q);
      return okFilter && okQuery;
    });
  }, [articles, filter, query]);

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: c.bg }]}>
      <StatusBar style="auto" />
      <Text style={[styles.title, { color: c.text }]}>科技快訊</Text>
      <TextInput
        value={query}
        onChangeText={setQuery}
        placeholder="搜尋標題或內容"
        placeholderTextColor={c.sub}
        style={[styles.search, { backgroundColor: c.card, color: c.text }]}
      />
      <View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
          {FILTERS.map((f) => {
            const active = f.key === filter;
            return (
              <Pressable
                key={f.key}
                onPress={() => setFilter(f.key)}
                style={[styles.chip, { backgroundColor: active ? c.accent : c.chip }]}
              >
                <Text style={{ color: active ? '#fff' : c.text, fontWeight: '600' }}>{f.label}</Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>
      {errors.length > 0 && (
        <Text style={[styles.error, { color: c.sub }]}>暫時無法載入：{errors.join('、')}</Text>
      )}
      {loading ? (
        <ActivityIndicator style={{ marginTop: 40 }} color={c.accent} />
      ) : (
        <FlatList
          data={visible}
          keyExtractor={(a) => a.id}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={c.accent} />}
          contentContainerStyle={{ padding: 16, gap: 12 }}
          ListEmptyComponent={<Text style={{ color: c.sub, textAlign: 'center' }}>沒有符合的新聞</Text>}
          renderItem={({ item }) => (
            <Pressable
              onPress={() => item.link && Linking.openURL(item.link)}
              style={[styles.card, { backgroundColor: c.card }]}
            >
              <Text style={[styles.meta, { color: c.accent }]}>
                {item.source} · {timeAgo(item.publishedAt)}
              </Text>
              <Text style={[styles.headline, { color: c.text }]}>{item.titleZh ?? item.title}</Text>
              {!!(item.summaryZh ?? item.summary) && (
                <Text numberOfLines={3} style={{ color: c.sub, lineHeight: 20 }}>
                  {item.summaryZh ?? item.summary}
                </Text>
              )}
            </Pressable>
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  title: { fontSize: 28, fontWeight: '800', paddingHorizontal: 16, paddingTop: 16 },
  search: { marginHorizontal: 16, marginTop: 12, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, fontSize: 16 },
  chips: { paddingHorizontal: 16, paddingVertical: 12, gap: 8 },
  chip: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 16 },
  error: { paddingHorizontal: 16, fontSize: 12 },
  card: { borderRadius: 12, padding: 14, gap: 6 },
  meta: { fontSize: 12, fontWeight: '600' },
  headline: { fontSize: 17, fontWeight: '700', lineHeight: 23 },
});
