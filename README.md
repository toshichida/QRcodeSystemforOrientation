# QRコード受付システム

留学生新入生オリエンテーション（生活ガイダンス）の受付を効率化するQRコードベースの受付システムです。

## 構成

- **バックエンド**: Google Apps Script (GAS) + スプレッドシート
- **フロントエンド**: HTML5 + JavaScript（GitHub Pages でホスティング）

## セットアップ

### 1. 環境準備

- Node.js, Clasp, Git, GitHub CLI (gh) をインストール
- `npm install -g @google/clasp`
- `gh auth login` で GitHub 認証

### 2. GAS のセットアップ

1. 新規 Google スプレッドシートを作成
2. 「拡張機能」→「Apps Script」を開く
3. `.clasp.json` の `scriptId` を GAS のスクリプト ID に設定
4. `clasp push` でコードをプッシュ
5. GAS エディタで「デプロイ」→「新しいデプロイ」→「ウェブアプリ」を選択
6. 「アクセスできるユーザー」を「全員」に設定してデプロイ
7. 表示された URL を `js/config.js` の `GAS_WEB_APP_URL` に設定
8. スプレッドシートで「オリエンテーション受付」メニューから「スプレッドシート初期設定」を実行

### 3. フロントエンドのローカル確認

```bash
npx serve .
```

ブラウザで `http://localhost:3000` を開き、HTTPS または localhost でカメラが動作することを確認してください。

### 4. GitHub Pages へのデプロイ

```bash
git init
git add .
git commit -m "Initial implementation"
gh repo create QRcodeSystemforOrientation --private --source=. --push
```

GitHub の Settings → Pages で「Deploy from a branch」を選択し、Branch: `main`, Folder: `/ (root)` に設定。

- リポジトリ: https://github.com/toshichida/QRcodeSystemforOrientation
- 注意: プライベートリポジトリでは GitHub Pages が制限される場合があります。その場合はリポジトリをパブリックにするか、ローカルで `npx serve .` で動作確認してください。

## 使い方

- **午前モード**: スマートフォンで職員が学生の QR コードをスキャン（背面カメラ）
- **午後モード**: PC のウェブカメラに学生が QR をかざす（広い読み取り枠）

担当者を選択してから QR コードをスキャンしてください。⚙ ボタンで表示項目をカスタマイズできます。

## 参照ドキュメント

- [要件定義書](docs/要件定義書.md)
- [実装計画書](docs/実装計画書.md)
- [API設計書](docs/API設計書.md)
