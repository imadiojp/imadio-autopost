import { Inbox, History, Search, Link, AlertCircle, RefreshCw } from 'lucide-react'
import { Button } from './ui/button'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'

export default function EmptyStates() {
  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto">
      <h1 className="mb-6">Empty States</h1>
      <p className="text-muted-foreground mb-8">
        アプリケーション内で使用される空状態のパターン
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* No Posts */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">投稿なし</CardTitle>
          </CardHeader>
          <CardContent className="text-center py-8 md:py-12">
            <Inbox className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="mb-2">まだ投稿がありません</h3>
            <p className="text-sm text-muted-foreground mb-4">
              最初の投稿を作成して、自動投稿を始めましょう
            </p>
            <Button>投稿を作成</Button>
          </CardContent>
        </Card>

        {/* No History */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">履歴なし</CardTitle>
          </CardHeader>
          <CardContent className="text-center py-8 md:py-12">
            <History className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="mb-2">履歴がありません</h3>
            <p className="text-sm text-muted-foreground mb-4">
              投稿が実行されると、ここに履歴が表示されます
            </p>
            <Button variant="outline">投稿を作成</Button>
          </CardContent>
        </Card>

        {/* No Search Results */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">検索結果なし</CardTitle>
          </CardHeader>
          <CardContent className="text-center py-8 md:py-12">
            <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="mb-2">見つかりませんでした</h3>
            <p className="text-sm text-muted-foreground mb-4">
              検索条件を変更して、もう一度お試しください
            </p>
            <Button variant="outline">検索条件をクリア</Button>
          </CardContent>
        </Card>

        {/* No Connection */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">接続なし</CardTitle>
          </CardHeader>
          <CardContent className="text-center py-8 md:py-12">
            <Link className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="mb-2">Xアカウント未連携</h3>
            <p className="text-sm text-muted-foreground mb-4">
              自動投稿を始めるには、Xアカウントを連携してください
            </p>
            <Button>アカウントを連携</Button>
          </CardContent>
        </Card>

        {/* Error State */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">エラー</CardTitle>
          </CardHeader>
          <CardContent className="text-center py-8 md:py-12">
            <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
            <h3 className="mb-2">エラーが発生しました</h3>
            <p className="text-sm text-muted-foreground mb-4">
              データの読み込みに失敗しました。もう一度お試しください。
            </p>
            <Button variant="outline">
              <RefreshCw className="h-4 w-4 mr-2" />
              再試行
            </Button>
          </CardContent>
        </Card>

        {/* Loading State (with animation) */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">読み込み中</CardTitle>
          </CardHeader>
          <CardContent className="text-center py-8 md:py-12">
            <div className="h-12 w-12 mx-auto mb-4">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-muted border-t-primary" />
            </div>
            <h3 className="mb-2">読み込み中...</h3>
            <p className="text-sm text-muted-foreground">
              データを取得しています
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="mt-8">
        <Card>
          <CardHeader>
            <CardTitle>使用方法</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p>
              <strong>投稿なし:</strong> 投稿作成ページで使用
            </p>
            <p>
              <strong>履歴なし:</strong> 履歴ページで使用
            </p>
            <p>
              <strong>検索結果なし:</strong> 検索機能で結果が0件の場合に使用
            </p>
            <p>
              <strong>接続なし:</strong> X連携ページで使用
            </p>
            <p>
              <strong>エラー:</strong> データ取得失敗時に使用
            </p>
            <p>
              <strong>読み込み中:</strong> 非同期処理中に使用
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
