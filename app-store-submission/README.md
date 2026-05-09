# Fixed Flow App Store申請準備パック

このフォルダは、固定費管理アプリをiOS App Storeへ申請するための下書き一式です。

## 現時点で準備済み

- App Store Connect掲載文言のドラフト: `app-store-connect-metadata.md`
- 審査メモのドラフト: `review-notes.md`
- プライバシーポリシーのドラフト: `privacy-policy.md`
- 利用規約のドラフト: `terms-of-use.md`
- iOS実装チェックリスト: `ios-implementation-checklist.md`
- 実画面キャプチャ入りUI仕様書: `../outputs/ios-ledger-spec/output/fixed-flow-ios-ui-spec.xlsx`

## 申請前に必要な残タスク

1. Apple Developer Programに登録する。
2. Bundle IDを決める。例: `jp.yourname.fixedflow`
3. CapacitorまたはSwiftUIでiOSプロジェクトを作成する。
4. ローカル通知をiOSネイティブ実装へ接続する。
5. 買い切りProをStoreKit 2の非消耗型IAPとして設定する。
6. App Store用スクリーンショットをXcode Simulatorで撮影する。
7. プライバシーポリシーと利用規約を公開URLに配置する。
8. App Reviewに提出する前に、実機で通知・購入復元・データ保存を確認する。

## アプリの申請方針

このアプリは、家計簿・決済管理・カード明細管理ではありません。

「固定費を月額換算で把握し、契約を確定・見直し中に分け、次に判断すべき期限を忘れないための契約台帳アプリ」として申請します。
