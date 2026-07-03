---
name: run
description: もじガチャアプリ(Expo SDK 57)を起動して動作確認する手順。dev サーバーの起動、iOS シミュレータでの実行、スクリーンショットによる検証、既知のエラー(manifest 500)の回避方法。アプリを起動・実行・確認したいときに使う。
---

# もじガチャの起動と動作確認

## dev サーバーの起動

**必ず `--offline` を付ける。**

```bash
npx expo start --port 8081 --offline
```

理由: このマシンは Expo アカウント未ログインのため、通常起動だと Expo Go 向けマニフェスト生成時に Expo API(GraphQL)への問い合わせが失敗し、
`HTTP 500: UnexpectedServerData: Unexpected server error: No returned query result` になる。
`npx expo login` でログイン済みなら `--offline` は不要。

バックグラウンドで起動する場合はログをファイルに書き、`Waiting on http://localhost:8081` が出るまで待つ。

起動確認:

```bash
curl -s -o /dev/null -w "%{http_code}" -H "expo-platform: ios" "http://localhost:8081/"
# 200 なら OK。500 なら --offline を付け忘れている
```

## iOS シミュレータで開く

Expo Go(SDK 57 対応版)はインストール済み。

```bash
xcrun simctl boot "iPhone 16 Plus" 2>/dev/null  # 未起動なら
xcrun simctl openurl booted "exp://127.0.0.1:8081"
```

- 同じ URL への `openurl` は再読み込みされない。リロードしたいときは先に
  `xcrun simctl terminate booted host.exp.Exponent` してから `openurl` する。
- 初回インストール直後は Expo Go の「Dev tools」案内シートが画面を覆う(Continue を押すまで消えない)。2回目以降の起動では出ない。

## 画面遷移(タップ不要のディープリンク)

このマシンにはシミュレータへタップを送る手段がない(cliclick / idb 無し、AppleScript は補助アクセス未許可)。
画面遷移は expo-router のディープリンクで行う:

```bash
xcrun simctl openurl booted "exp://127.0.0.1:8081/--/collection"  # コレクション画面
```

ガチャ画面(index)はアプリ再起動で戻るのが確実。

## スクリーンショットで検証

```bash
xcrun simctl io booted screenshot /path/to/shot.png
```

演出の途中フレームを撮りたい場合は、`src/app/index.tsx` にマウント数秒後に `spin()` を呼ぶ一時的な `useEffect` を仕込み、0.5秒間隔で連写する。**検証後は必ず削除し、`npx tsc --noEmit` を通すこと。**
なお自動スピンは永続ストアの累計回数を増やす副作用がある。

## 型チェック

```bash
npx tsc --noEmit
```

初回はエラーになることがある(`expo-env.d.ts` と `.expo/types` は dev サーバー初回起動時に生成されるため)。先に一度 `expo start` を起動すれば解消する。

## 未整備

- `npm run lint` は eslint 未導入のため動かない
