# iOS実装チェックリスト

## 推奨構成

まずは現在のReact/Vite/PWAをCapacitorでiOSラップする構成が最短です。

- Web UI: React + TypeScript + Vite
- iOSラッパー: Capacitor
- 通知: Capacitor Local NotificationsまたはSwift側の`UNUserNotificationCenter`
- 課金: StoreKit 2
- データ保存: 初期はWebView内localStorage。本番では移行余地を残す

## テストアプリ化の次アクション

2026-05-12時点のローカル確認では、`xcodebuild` がCommand Line Toolsを向いており、Xcode本体が未選択のためiOSビルドはまだ実行できません。

最初に行うこと:

- Mac App StoreまたはApple Developerから最新のXcodeを入れる
- `sudo xcode-select -s /Applications/Xcode.app/Contents/Developer` でXcode本体を選択する
- Xcodeを一度起動して追加コンポーネントとライセンスを完了する
- CapacitorでiOSプロジェクトを追加し、実機またはSimulatorで起動確認する

確認したい観点:

- Liquid Glass: 最新SDKでビルドし、標準ナビゲーション/タブ/シートの見え方を確認する
- 通知: `UNUserNotificationCenter` またはCapacitor Local Notificationsで許可ダイアログ、3日前通知、通知プレビューを確認する
- PWAとの差分: ステータスバー、ホームインジケータ、キーボード、ファイルインポート/エクスポートの扱いを確認する

参考:

- Apple Developer: Adopting Liquid Glass
  https://developer.apple.com/documentation/TechnologyOverviews/adopting-liquid-glass
- Apple Developer: Applying Liquid Glass to custom views
  https://developer.apple.com/documentation/SwiftUI/Applying-Liquid-Glass-to-custom-views
- Apple Developer: UNUserNotificationCenter
  https://developer.apple.com/documentation/usernotifications/unusernotificationcenter
- Apple Developer: Scheduling a notification locally from your app
  https://developer.apple.com/documentation/usernotifications/scheduling-a-notification-locally-from-your-app

## 必須実装

- Bundle IDを作成する
- App Iconを1024px含めて用意する
- Splash/Launch Screenを用意する
- iOSのローカル通知許可ダイアログを実装する
- 期限種別ごとにローカル通知をスケジュールする
- Pro買い切りを非消耗型IAPとして実装する
- 購入復元を実装する
- 無料版10件制限を実装する
- Pro状態を端末に保存する
- JSONエクスポート/インポートをファイル共有に対応させる

## StoreKit 2

想定Product ID:

```text
jp.yourname.fixedflow.pro
```

課金タイプ:

```text
Non-Consumable
```

表示名:

```text
Fixed Flow Pro
```

説明:

```text
登録件数無制限、通知リマインド、データ管理機能を解放します。
```

## ローカル通知

通知対象:

- 更新日が近い
- 無料期間終了が近い
- 解約期限が近い
- 割引終了が近い
- 見直し中の契約

通知タイミング:

- 当日
- 1日前
- 3日前
- 7日前
- 30日前

デフォルト:

```text
3日前 / 9:00
```

## App Storeスクリーンショット

現在のWeb実キャプチャ:

```text
outputs/ios-ledger-spec/screenshots/
```

提出前はXcode Simulatorで以下を撮影してください。

- 6.7インチ
- 6.5インチ
- 5.5インチ

推奨スクリーン:

- ホーム
- 契約
- 内訳
- 追加・編集
- 設定
- 通知設定
- ダークモード
