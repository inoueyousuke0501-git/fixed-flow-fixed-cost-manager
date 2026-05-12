# Fixed Flow - 固定費台帳アプリ

Fixed Flowは、固定費を月額換算で把握し、契約を「確定」と「見直し中」に分け、次に判断すべき更新日・無料期間終了・解約期限・割引終了を忘れないためのWeb/PWAアプリです。

家計簿ではなく、支払い管理アプリでもなく、契約ベースの固定費棚卸しツールとして作っています。データはまず `localStorage` に保存するため、ログイン、外部DB、環境変数なしで動きます。

## 主な機能

- ホーム: 月額固定費、年額、日あたり、確定/見直し中、次に判断するもの、横棒内訳、棚卸し状況
- 契約: 検索、すべて/見直し中/確定フィルタ、期限が近い順/高額順/追加順ソート
- 内訳: 月額/年額/日あたり、カテゴリ別横棒、月額換算ランキング、見直し中合計
- 追加/編集: ピクトグラム選択、金額手入力、判断期限、期限種別、通知リマインド
- 設定: Pro、通知、データのエクスポート/インポート、ダークモード、規約/ヘルプ導線
- PWA: スマホのホーム画面追加、スタンドアロン表示、service worker
- 日本円表示、レスポンシブ対応、ダークモード対応

## サブスク/カードのテンプレート

追加フォームでは、よく使うサービスや固定費カテゴリをピクトグラム候補として選べます。

- Apple Music: 個人、ファミリー、学生
- Netflix: 広告つきスタンダード、スタンダード、プレミアム
- Amazon Prime: 月払い、年払い
- Spotify: Standard、Duo、Family
- YouTube Premium / Lite
- Disney+、U-NEXT、Hulu
- American Express: グリーン、ゴールド・プリファード、プラチナ

候補を選ぶとカテゴリと名称の入力補助だけを行い、金額は実際の契約金額やキャンペーン価格に合わせて手入力します。

## ローカル実行

```bash
npm install
npm run dev
```

ビルド確認:

```bash
npm run build
```

## Netlify公開手順

1. このディレクトリをGitHubリポジトリへpushします。
2. Netlifyで「Add new site」→「Import an existing project」を選びます。
3. GitHubリポジトリを選択します。
4. Build settingsを以下にします。

```text
Build command: npm run build
Publish directory: dist
Node version: 22
```

5. 環境変数は不要です。Vite 7系でビルドするため、Node.jsは22系を指定してください。
6. Deploy後、NetlifyのSite overviewに表示されるURLを開いて動作確認します。

`netlify.toml` に同じ設定を入れているため、Netlify側では通常そのまま検出されます。

## 公開URL

Netlify URL:

https://fixed-flow-cost-manager-inoue.netlify.app/

既存のGitHub Pages URL:

https://inoueyousuke0501-git.github.io/fixed-flow-fixed-cost-manager/

## 仕様書 / App Store申請準備

- UI仕様書: `outputs/ios-ledger-spec/output/fixed-flow-ios-ui-spec.xlsx`
- App Store申請準備: `app-store-submission/`

## 注意

- データはブラウザの `localStorage` に保存されます。端末やブラウザを変える場合はJSONエクスポート/インポートを使ってください。
- ブラウザのサイトデータ削除を行うと保存データも消えます。
- PWAのホーム画面追加は、iOS/Android/ブラウザの仕様によって表示文言が異なります。
