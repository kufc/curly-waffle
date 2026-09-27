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

## Roadmap
1. **後端**（Cloudflare Workers／Firebase Functions 之類）：定時抓 RSS，並用 Claude API 把外文新聞翻成中文、產生摘要。API key 只放在後端，不進 App。
2. **推播通知**：expo-notifications 搭配後端篩選出的重大新聞。
3. **上架**：EAS Build／Submit，需要 Apple Developer（每年 US$99）和 Google Play（一次付 US$25）帳號。
4. **收費**：透過 RevenueCat 串接 App Store／Google Play 的訂閱，例如把 AI 摘要、無廣告、自訂推播做成付費功能。
