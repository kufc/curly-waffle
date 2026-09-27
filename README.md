# 科技快訊 (TechNews)

一個以 Expo (React Native) 打造、iOS 與 Android 共用一套程式碼的 App，整理國內外最新的科技新聞。

## 目前功能（MVP）
- 抓取國內（iThome、數位時代、INSIDE、科技新報）、國外（The Verge、TechCrunch、Ars Technica、Wired）以及 Hacker News 的 RSS
- 可依地區或分類篩選（AI／手機／資安／半導體），也能搜尋關鍵字
- 下拉即可重新整理，點新聞會開啟原文
- 深色模式會跟著系統設定切換

## 開發
```bash
npm install
npx expo start      # 手機裝 Expo Go 後掃 QR code 就能預覽
```
新聞來源和分類設定放在 `src/feeds.ts`。

## 後端（Cloudflare Workers）
`worker/` 會每 15 分鐘抓一次 RSS，用 Claude 產生繁體中文標題和摘要，存進 KV，再透過 `GET /news` 提供給 App。

```bash
cd worker && npm install
npx wrangler login
npx wrangler kv namespace create NEWS          # 把拿到的 id 貼進 wrangler.jsonc
npx wrangler secret put ANTHROPIC_API_KEY
npx wrangler deploy                            # 會得到 https://technews-worker.<帳號>.workers.dev
```
App 端的設定：建立 `.env`，填入 `EXPO_PUBLIC_API_URL=https://technews-worker.<帳號>.workers.dev`。沒設定的話，App 會直接抓 RSS（沒有中文摘要）。

費用控制：`worker/src/index.ts` 裡的 `PER_RUN` 決定每次最多摘要幾則新聞，模型用低 effort。

## Roadmap
1. ~~**後端**：抓 RSS、產生 AI 中文摘要~~（已完成，放在 `worker/`）
2. **推播通知**：expo-notifications 搭配後端篩選出的重大新聞。
3. **上架**：EAS Build／Submit，需要 Apple Developer（每年 US$99）和 Google Play（一次付 US$25）帳號。
4. **收費**：透過 RevenueCat 串接 App Store／Google Play 的訂閱，例如把 AI 摘要、無廣告、自訂推播做成付費功能。
