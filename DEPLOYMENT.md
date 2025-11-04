# imadio autopost - デプロイガイド

このガイドでは、imadio autopostをSaaS型アプリケーションとしてデプロイする手順を説明します。

## アーキテクチャ

```
[ユーザー] → [Vercel (フロントエンド)] → [Railway (バックエンド)] → [X API]
```

## 前提条件

1. GitHubアカウント
2. X Developer アカウント
3. Railwayアカウント (無料)
4. Vercelアカウント (無料)

## ステップ1: X Developer Portal設定

### 1.1 X Developer Portalにアクセス

https://developer.twitter.com/en/portal/dashboard

### 1.2 新しいアプリを作成

1. "Create App" をクリック
2. アプリ名を入力 (例: imadio-autopost)
3. 作成完了

### 1.3 OAuth 2.0を設定

1. アプリの設定画面で "User authentication settings" をクリック
2. "Set up" をクリック
3. 以下を設定:
   - **App permissions**: Read and write
   - **Type of App**: Web App
   - **Callback URI**: `https://your-railway-app.railway.app/api/auth/x/callback`
     (後でRailwayのURLに置き換え)
   - **Website URL**: `https://your-vercel-app.vercel.app`
     (後でVercelのURLに置き換え)

4. "Save" をクリック

### 1.4 認証情報を取得

1. "Keys and tokens" タブを開く
2. **Client ID** をコピー
3. **Client Secret** をコピー (表示ボタンをクリック)

**重要**: これらの情報を安全に保管してください!

---

## ステップ2: バックエンドをRailwayにデプロイ

### 2.1 Railwayアカウント作成

1. https://railway.app/ にアクセス
2. "Start a New Project" をクリック
3. GitHubでサインイン

### 2.2 プロジェクトをデプロイ

1. "Deploy from GitHub repo" を選択
2. このリポジトリを選択
3. "Deploy Now" をクリック

### 2.3 環境変数を設定

1. プロジェクト設定で "Variables" タブを開く
2. 以下の環境変数を追加:

```bash
NODE_ENV=production
PORT=3001
JWT_SECRET=<ランダムな長い文字列を生成>
X_API_CLIENT_ID=<ステップ1.4で取得したClient ID>
X_API_CLIENT_SECRET=<ステップ1.4で取得したClient Secret>
X_API_CALLBACK_URL=https://<your-railway-domain>.railway.app/api/auth/x/callback
FRONTEND_URL=https://<your-vercel-domain>.vercel.app
```

**JWT_SECRETの生成方法:**
```bash
# ターミナルで実行
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

### 2.4 カスタムドメインを取得 (オプション)

1. "Settings" → "Networking" でRailwayが提供するドメインを確認
2. 例: `imadio-autopost-production.up.railway.app`

### 2.5 X Developer Portalを更新

1. ステップ1.3に戻る
2. Callback URIを実際のRailway URLに更新:
   - `https://imadio-autopost-production.up.railway.app/api/auth/x/callback`

---

## ステップ3: フロントエンドをVercelにデプロイ

### 3.1 Vercelアカウント作成

1. https://vercel.com/ にアクセス
2. GitHubでサインイン

### 3.2 プロジェクトをデプロイ

1. "Add New Project" をクリック
2. このリポジトリを選択
3. "Framework Preset" は自動検出される (Vite)
4. "Root Directory" はそのまま (ルート)

### 3.3 環境変数を設定

1. "Environment Variables" セクションで以下を追加:

```bash
VITE_API_URL=https://<your-railway-domain>.railway.app/api
```

### 3.4 デプロイ

1. "Deploy" をクリック
2. 数分待つとデプロイ完了

### 3.5 X Developer Portalを更新 (最終)

1. ステップ1.3に戻る
2. Website URLを実際のVercel URLに更新:
   - `https://imadio-autopost.vercel.app`

---

## ステップ4: 動作確認

### 4.1 フロントエンドにアクセス

Vercelが提供したURL (例: https://imadio-autopost.vercel.app) にアクセス

### 4.2 ユーザー登録

1. アプリを開く
2. 新規登録
3. メールアドレスとパスワードを入力

### 4.3 Xアカウント連携

1. 「X連携」ページに移動
2. 「アカウントを追加」をクリック
3. Xの認証画面が表示される
4. 承認すると連携完了

### 4.4 投稿をテスト

1. 「投稿作成」ページで投稿を作成
2. 日時を設定して予約
3. スケジューラーが自動的に投稿を実行

---

## トラブルシューティング

### エラー: "Failed to initiate X auth"

- X Developer PortalでCallback URIが正しく設定されているか確認
- RailwayのX_API_CLIENT_IDとX_API_CLIENT_SECRETが正しいか確認

### エラー: "Network error"

- RailwayのバックエンドURLが正しいか確認
- VercelのVITE_API_URLが正しいか確認
- CORSエラーの場合、RailwayのFRONTEND_URLを確認

### 投稿が実行されない

- Railwayのログを確認: `Railway Dashboard → View Logs`
- スケジューラーが起動しているか確認
- 投稿の日時が過去でないか確認

---

## コスト

### Railway
- 無料枠: 月500時間、$5分の利用
- 有料プラン: 月$5から (クレジットカード登録が必要)

### Vercel
- 無料枠: 個人利用に十分
- 帯域制限: 月100GB

### 合計
- 基本無料で運用可能
- ユーザー数が増えたらRailwayの有料プランが必要

---

## セキュリティ

1. **JWT_SECRET**: 絶対に公開しない
2. **X API認証情報**: GitHubにコミットしない
3. **定期的なトークン更新**: X APIのトークンは定期的に確認
4. **HTTPS必須**: HTTPではなくHTTPSを使用

---

## メンテナンス

### ログの確認

**Railway:**
- Dashboard → プロジェクト → View Logs

**Vercel:**
- Dashboard → プロジェクト → Deployments → Logs

### データベースのバックアップ

Railwayは自動バックアップを提供していないため、定期的に手動バックアップを推奨:

1. Railway Dashboard → プロジェクト → Data タブ
2. SQLiteファイルをダウンロード

---

## カスタムドメイン (オプション)

### ドメインの設定

**Vercel:**
1. Dashboard → プロジェクト → Settings → Domains
2. カスタムドメインを追加 (例: app.yourdomain.com)
3. DNSレコードを設定

**Railway:**
1. Dashboard → プロジェクト → Settings → Networking
2. カスタムドメインを追加 (例: api.yourdomain.com)
3. CNAMEレコードを設定

---

## サポート

問題が発生した場合:
1. RailwayとVercelのログを確認
2. GitHubのIssuesで報告
3. X Developer Communityで質問

---

## まとめ

これで、あなたのimadio autopostアプリが世界中のユーザーに公開されました!

ユーザーは:
1. URLにアクセス
2. 登録
3. Xアカウント連携
4. すぐに使い始められる

複雑な設定は一切不要です。
