# 完全無料デプロイガイド

**Render (バックエンド) + Vercel (フロントエンド) = $0/月**

所要時間: 約20分

---

## ステップ1: X Developer Portal設定 (5分)

### 1.1 アカウント作成
https://developer.twitter.com/en/portal/dashboard にアクセス

### 1.2 新しいアプリを作成
1. "Create App" をクリック
2. アプリ名を入力: `imadio-autopost`
3. 作成完了

### 1.3 OAuth 2.0を設定
1. "User authentication settings" → "Set up" をクリック
2. 以下を設定:
   - **App permissions**: Read and write
   - **Type of App**: Web App
   - **Callback URI**: `https://YOUR-APP.onrender.com/api/auth/x/callback`
     (後で更新)
   - **Website URL**: `https://YOUR-APP.vercel.app`
     (後で更新)

### 1.4 認証情報を取得
1. "Keys and tokens" タブを開く
2. **Client ID** をコピー → メモ帳に保存
3. **Client Secret** をコピー → メモ帳に保存

**重要**: これらを失くさないように!

---

## ステップ2: GitHubにプッシュ (3分)

```bash
# まだGitリポジトリでない場合
git init
git add .
git commit -m "Initial commit: imadio autopost"

# GitHubに新規リポジトリを作成してプッシュ
git remote add origin https://github.com/YOUR-USERNAME/imadio-autopost.git
git branch -M main
git push -u origin main
```

---

## ステップ3: Renderでバックエンドをデプロイ (5分)

### 3.1 Renderアカウント作成
https://render.com/ にアクセスして "Get Started" をクリック

### 3.2 GitHubで認証
"Sign in with GitHub" をクリック

### 3.3 新規Webサービスを作成
1. "New +" → "Web Service" をクリック
2. GitHubリポジトリを選択: `imadio-autopost`
3. 以下を設定:
   - **Name**: `imadio-autopost-api` (好きな名前でOK)
   - **Region**: Oregon (US West) が無料
   - **Branch**: `main`
   - **Root Directory**: (空欄のまま)
   - **Runtime**: Node
   - **Build Command**: `cd server && npm install && npm run build`
   - **Start Command**: `cd server && npm start`
   - **Plan**: **Free**

### 3.4 環境変数を設定
"Advanced" → "Add Environment Variable" をクリックして以下を追加:

```
NODE_ENV=production
PORT=10000
JWT_SECRET=<ランダムな64文字の文字列>
X_API_CLIENT_ID=<ステップ1.4のClient ID>
X_API_CLIENT_SECRET=<ステップ1.4のClient Secret>
X_API_CALLBACK_URL=https://YOUR-APP.onrender.com/api/auth/x/callback
FRONTEND_URL=https://YOUR-APP.vercel.app
```

**JWT_SECRETの生成:**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

**注意**:
- `YOUR-APP.onrender.com` は後で実際のURLに置き換え
- `YOUR-APP.vercel.app` も後で実際のURLに置き換え

### 3.5 デプロイ開始
"Create Web Service" をクリック → 5-10分待つ

### 3.6 URLを確認
デプロイ完了後、URLをコピー (例: `https://imadio-autopost-api.onrender.com`)

### 3.7 環境変数を更新
1. "Environment" タブを開く
2. `X_API_CALLBACK_URL` を実際のURLに更新:
   ```
   https://imadio-autopost-api.onrender.com/api/auth/x/callback
   ```
3. "Save Changes" をクリック

---

## ステップ4: X Developer Portalを更新 (2分)

1. https://developer.twitter.com/en/portal/dashboard に戻る
2. アプリの設定で "User authentication settings" → "Edit" をクリック
3. **Callback URI** を実際のRender URLに更新:
   ```
   https://imadio-autopost-api.onrender.com/api/auth/x/callback
   ```
4. "Save" をクリック

---

## ステップ5: Vercelでフロントエンドをデプロイ (3分)

### 5.1 Vercelアカウント作成
https://vercel.com/ にアクセスして "Start Deploying" をクリック

### 5.2 GitHubで認証
"Continue with GitHub" をクリック

### 5.3 プロジェクトをインポート
1. "Add New..." → "Project" をクリック
2. `imadio-autopost` リポジトリを選択
3. "Import" をクリック

### 5.4 設定
以下を設定:
- **Framework Preset**: Vite (自動検出)
- **Root Directory**: `./` (デフォルト)
- **Build Command**: `npm run build` (デフォルト)
- **Output Directory**: `dist` (デフォルト)

### 5.5 環境変数を追加
"Environment Variables" セクションで:
```
VITE_API_URL=https://imadio-autopost-api.onrender.com/api
```

**注意**: Render URLを正確に入力!

### 5.6 デプロイ
"Deploy" をクリック → 2-3分待つ

### 5.7 URLを確認
デプロイ完了後、URLが表示される (例: `https://imadio-autopost.vercel.app`)

---

## ステップ6: Render環境変数を最終更新 (2分)

1. Renderダッシュボードに戻る
2. "Environment" タブを開く
3. `FRONTEND_URL` を実際のVercel URLに更新:
   ```
   https://imadio-autopost.vercel.app
   ```
4. "Save Changes" をクリック
5. 自動的に再デプロイされる (2-3分)

---

## ステップ7: X Developer Portalを最終更新 (1分)

1. https://developer.twitter.com/en/portal/dashboard に戻る
2. "User authentication settings" → "Edit"
3. **Website URL** を実際のVercel URLに更新:
   ```
   https://imadio-autopost.vercel.app
   ```
4. "Save" をクリック

---

## ステップ8: 動作確認 (3分)

### 8.1 アプリにアクセス
Vercel URLにアクセス (例: https://imadio-autopost.vercel.app)

### 8.2 ユーザー登録
1. メールアドレスとパスワードを入力
2. 登録をクリック

### 8.3 Xアカウント連携
1. 「X連携」ページに移動
2. 「アカウントを追加」をクリック
3. Xの認証画面が表示される → 承認
4. アプリに戻ってくる

### 8.4 投稿をテスト
1. 「投稿作成」ページで投稿を作成
2. 日時を設定
3. 「投稿を予約」をクリック

**完了!** 🎉

---

## 重要な注意事項

### Renderの無料プランの制限
- ✅ **完全無料**
- ⚠️ **15分間非アクティブでスリープ**
- ⚠️ **起動に10-30秒かかる**
- ⚠️ **月750時間まで稼働** (31日で744時間なのでギリギリ足りる)

### 使い方のコツ
1. 毎日1回はアプリにアクセス → サーバーが起動したままになる
2. スケジューラーは起動中のみ動作 → 投稿時刻の数分前にアクセスすると確実
3. 本格的に使うなら有料プラン ($7/月) を検討

---

## トラブルシューティング

### エラー: "Failed to initiate X auth"
- X Developer PortalでCallback URIが正しいか確認
- RenderのX_API_CLIENT_IDとSECRETが正しいか確認

### エラー: "Network error"
- RenderのURLが正しいか確認
- VercelのVITE_API_URLが正しいか確認
- Renderがスリープ中の可能性 → 数秒待つ

### 投稿が実行されない
- Renderがスリープしている可能性
- 投稿時刻の5分前にアプリにアクセスしておく
- Renderのログを確認: Dashboard → Logs

### Renderを常時起動させたい
外部から定期的にpingする:
- https://uptimerobot.com/ (無料)
- 5分ごとにヘルスチェックを設定

---

## コスト

### 現在
- Render: **$0/月** (Free)
- Vercel: **$0/月** (Free)
- **合計: $0/月**

### もっと快適に使いたい場合
- Render: **$7/月** (Starter) → 常時稼働、高速
- Vercel: **$0/月** (Free)
- **合計: $7/月**

---

## カスタムドメイン (オプション)

### 自分のドメインを使う
1. Vercel: Dashboard → Settings → Domains
2. Render: Dashboard → Settings → Custom Domain

独自ドメインがあればプロフェッショナルに!

---

## まとめ

✅ 完全無料でデプロイ完了!
✅ ユーザーは登録してすぐ使える
✅ 複雑な設定は一切不要

**制限**: サーバーがスリープするので、投稿前にアクセスが必要

本格運用なら$7/月のプランがおすすめです。
