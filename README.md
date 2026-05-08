# Fixed Flow - 固定費管理アプリ

毎月/毎年発生する固定費をまとめて管理する、React + TypeScript + Vite 製のWebアプリです。データはまず `localStorage` に保存するため、ログイン、外部DB、環境変数なしで動きます。

## 主な機能

- ダッシュボード: 今月の支払予定、月額換算、年間換算、カテゴリ別支出、見直し候補
- 固定費一覧: 支払日が近い順、金額順、名称順の並び替え
- 絞り込み: カテゴリ、支払方法、キーワード検索
- 追加/編集/削除: 名称、金額、支払周期、次回支払日、カテゴリ、支払方法、契約開始日、解約予定日、メモ、見直し優先度
- カレンダー表示: 月単位で支払予定を確認
- データ管理: JSONエクスポート/インポート、サンプルデータ投入、全データ削除
- PWA: スマホのホーム画面追加、スタンドアロン表示、service worker
- 日本円表示、レスポンシブ対応、ダークモード対応

## サブスク/カードのテンプレート

追加フォームと設定画面に、よく使うプランのテンプレートを入れています。

- Apple Music: 個人、ファミリー、学生
- Netflix: 広告つきスタンダード、スタンダード、プレミアム
- Amazon Prime: 月払い、年払い
- Spotify: Standard、Duo、Family
- YouTube Premium / Lite
- Disney+、U-NEXT、Hulu
- American Express: グリーン、ゴールド・プリファード、プラチナ

金額は初期値として入力されます。実際の契約金額やキャンペーン価格に合わせて編集してください。

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
```

5. 環境変数は不要です。
6. Deploy後、NetlifyのSite overviewに表示されるURLを開いて動作確認します。

`netlify.toml` に同じ設定を入れているため、Netlify側では通常そのまま検出されます。

## 注意

- データはブラウザの `localStorage` に保存されます。端末やブラウザを変える場合はJSONエクスポート/インポートを使ってください。
- ブラウザのサイトデータ削除を行うと保存データも消えます。
- PWAのホーム画面追加は、iOS/Android/ブラウザの仕様によって表示文言が異なります。
