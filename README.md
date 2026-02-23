# Page Pulse

Chrome の内蔵 AI（Gemini Nano）を使って、ウェブページを瞬時に要約する Chrome 拡張機能です。
API キー不要・完全ローカル動作でプライバシーも安心。

## 主な機能

- ページの要約（2〜3文）と重要ポイント3つを自動生成
- 読了時間の表示
- 技術レベルの判定（初級 / 中級 / 上級）
- 日本語・英語の切り替え対応
- 要約結果のキャッシュ（同じページの再訪問時は即表示）

---

## インストール方法

### Chrome ウェブストアから（公開後）

1. [Chrome ウェブストア](https://chromewebstore.google.com/) で「**Page Pulse**」を検索
2. 「**Chrome に追加**」をクリック
3. ポップアップが表示されたら「**拡張機能を追加**」をクリック

インストール完了後、ツールバーに Page Pulse のアイコンが表示されます。

### 開発版を手動でインストール

1. このリポジトリをクローン

   ```bash
   git clone https://github.com/k-iizuka000/page-pulse.git
   cd page-pulse
   ```

2. 依存パッケージをインストールしてビルド

   ```bash
   npm install
   npm run build
   ```

3. Chrome で `chrome://extensions` を開く

4. 右上の「**デベロッパー モード**」をオンにする

5. 「**パッケージ化されていない拡張機能を読み込む**」をクリック

6. クローンしたフォルダ内の `dist` ディレクトリを選択

---

## Chrome AI（Gemini Nano）のセットアップ

Page Pulse を使うには、Chrome の内蔵 AI を有効にする必要があります。

### 必要環境

- Chrome 128 以上（推奨: 最新の安定版）
- ストレージ空き容量 22GB 以上（AI モデルのダウンロードに必要）

### 有効化手順

1. Chrome で `chrome://flags/#optimization-guide-on-device-model` を開く
2. 「**Enabled BypassPerfRequirement**」に設定
3. Chrome で `chrome://flags/#prompt-api-for-gemini-nano` を開く
4. 「**Enabled**」に設定
5. **Chrome を完全に再起動**する（全ウィンドウを閉じてから再度開く）
6. `chrome://components` を開く
7. 「**Optimization Guide On Device Model**」を探す
8. バージョンが `0.0.0.0` の場合は「**Check for update**」をクリック
9. ダウンロードが完了するまで待つ（数分〜数十分かかる場合があります）

### セットアップの確認方法

Chrome の DevTools コンソールで以下を実行：

```javascript
const availability = await LanguageModel.availability();
console.log(availability); // "available" と表示されれば OK
```

`"available"` と表示されない場合：
- `"downloadable"` → モデルが未ダウンロード。上記手順 6〜9 をやり直してください
- `"downloading"` → ダウンロード中。しばらく待ってから再度確認してください
- エラーが出る → flags の設定と Chrome の再起動を確認してください

---

## 使い方

### 基本操作

1. 任意のウェブページを開く
2. ページ右下に **Page Pulse のバッジ**（読了時間つき）が表示される
3. バッジをクリックすると**サイドパネル**が開く
4. AI がページを分析し、以下が表示される：
   - **ページタイトル**
   - **技術レベル**（初級 / 中級 / 上級）
   - **読了時間**
   - **要約**（2〜3文）
   - **重要ポイント**（3つ）

### 言語の切り替え

サイドパネル右上の言語切り替えボタンで日本語/英語を切り替えられます。

- 「**日本語**」と表示されているとき → クリックで英語に切り替え
- 「**English**」と表示されているとき → クリックで日本語に切り替え

言語を切り替えると AI が新しい言語で再要約します。設定は保存されるので次回も同じ言語で表示されます。

### 注意事項

- `chrome://` や `chrome-extension://` などの特殊ページではバッジは表示されません
- AI の要約品質はページの内容やテキスト量に依存します
- 初回の要約には数秒かかる場合があります（2回目以降はキャッシュから即表示）

---

## アンインストール方法

### Chrome ウェブストアからインストールした場合

1. Chrome のツールバーで Page Pulse アイコンを右クリック
2. 「**Chrome から削除**」をクリック
3. 確認ダイアログで「**削除**」をクリック

### 手動でインストールした場合

1. Chrome で `chrome://extensions` を開く
2. Page Pulse カードの「**削除**」をクリック
3. 確認ダイアログで「**削除**」をクリック

拡張機能を削除しても Chrome の内蔵 AI モデルは削除されません。AI モデルも削除したい場合は、`chrome://flags` で有効にした設定を「Default」に戻して Chrome を再起動してください。

---

## 開発

### セットアップ

```bash
npm install
```

### 開発サーバー

```bash
npm run dev
```

### ビルド

```bash
npm run build
```

ビルド成果物は `dist/` ディレクトリに出力されます。

### テスト

```bash
npm test          # ウォッチモード
npm run test:run  # 一回実行
```

### 型チェック

```bash
npm run check
```

---

## 技術スタック

| カテゴリ | 技術 |
|---------|------|
| フレームワーク | Svelte 4 |
| ビルドツール | Vite + @crxjs/vite-plugin |
| スタイリング | Tailwind CSS |
| AI | Chrome Built-in AI（Gemini Nano / Prompt API） |
| テスト | Vitest + Testing Library |
| 言語 | TypeScript |

## ライセンス

MIT
