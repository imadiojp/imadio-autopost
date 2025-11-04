import {
  Scissors,
  Image,
  Move,
  PauseCircle,
  RefreshCw,
  History,
  Mail,
} from 'lucide-react'
import { Card, CardContent } from './ui/card'

const features = [
  {
    icon: Scissors,
    title: 'スレ自動分割',
    description: '長文を自動的に280文字ずつ分割してスレッド投稿',
  },
  {
    icon: Image,
    title: '画像・Alt対応',
    description: '最大4枚の画像とAltテキストを設定可能',
  },
  {
    icon: Move,
    title: 'ドラッグ移動',
    description: 'カレンダー上で投稿をドラッグして時間変更',
  },
  {
    icon: PauseCircle,
    title: '一括停止',
    description: 'すべての予約投稿を一時的に停止',
  },
  {
    icon: RefreshCw,
    title: '自動リトライ',
    description: '失敗した投稿を自動で最大3回まで再試行',
  },
  {
    icon: History,
    title: '投稿履歴',
    description: '過去の投稿を一覧で確認、フィルタリング可能',
  },
  {
    icon: Mail,
    title: 'メール通知',
    description: '投稿の成功・失敗をメールで通知',
  },
]

export default function MarketingCard() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-background">
      <div className="p-4 md:p-8 max-w-6xl mx-auto">
        {/* Hero Section */}
        <div className="text-center mb-12 pt-8 md:pt-12">
          <h1 className="text-3xl md:text-4xl font-medium mb-4 bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            imadio autopost
          </h1>
          <p className="text-xl text-muted-foreground mb-2">
            X（旧Twitter）の自動投稿に特化した無料ツール
          </p>
          <p className="text-muted-foreground">
            誠実で軽快。シンプルで使いやすい。
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
          {features.map((feature, idx) => (
            <Card
              key={idx}
              className="hover:shadow-lg transition-shadow cursor-pointer"
            >
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                    <feature.icon className="h-6 w-6 text-primary" />
                  </div>
                  <div className="flex-1">
                    <h3 className="mb-2">{feature.title}</h3>
                    <p className="text-sm text-muted-foreground">
                      {feature.description}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Design System Highlight */}
        <Card className="mb-12">
          <CardContent className="p-8">
            <h2 className="mb-6 text-center">デザインシステム</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="w-16 h-16 rounded-full bg-primary mx-auto mb-3" />
                <h4 className="mb-1">8ptグリッド</h4>
                <p className="text-sm text-muted-foreground">
                  一貫したスペーシング
                </p>
              </div>
              <div className="text-center">
                <div className="flex gap-2 justify-center mb-3">
                  <div className="w-12 h-12 rounded-lg bg-background border" />
                  <div className="w-12 h-12 rounded-lg bg-card border" />
                  <div className="w-12 h-12 rounded-lg bg-primary" />
                </div>
                <h4 className="mb-1">ダークモード対応</h4>
                <p className="text-sm text-muted-foreground">
                  完全なテーマ切替
                </p>
              </div>
              <div className="text-center">
                <div className="mb-3">
                  <p className="font-medium">Noto Sans JP</p>
                  <p className="text-sm">あいうえお</p>
                </div>
                <h4 className="mb-1">日本語最適化</h4>
                <p className="text-sm text-muted-foreground">
                  読みやすいフォント
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-12">
          <Card>
            <CardContent className="p-6 text-center">
              <p className="text-3xl font-medium text-primary mb-1">8</p>
              <p className="text-sm text-muted-foreground">ページ</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6 text-center">
              <p className="text-3xl font-medium text-primary mb-1">5</p>
              <p className="text-sm text-muted-foreground">アカウント連携</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6 text-center">
              <p className="text-3xl font-medium text-primary mb-1">280</p>
              <p className="text-sm text-muted-foreground">文字制限</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6 text-center">
              <p className="text-3xl font-medium text-primary mb-1">∞</p>
              <p className="text-sm text-muted-foreground">予約投稿数</p>
            </CardContent>
          </Card>
        </div>

        {/* Footer CTA */}
        <Card className="bg-gradient-to-r from-primary/5 to-primary/10 border-primary/20">
          <CardContent className="p-8 text-center">
            <h2 className="mb-3">今すぐ始めよう</h2>
            <p className="text-muted-foreground mb-6">
              Xアカウントを連携して、自動投稿を始めましょう
            </p>
            <div className="flex gap-4 justify-center">
              <button className="px-6 py-3 bg-primary text-primary-foreground rounded-md font-medium hover:bg-primary/90 transition-colors">
                アカウントを連携
              </button>
              <button className="px-6 py-3 border rounded-md font-medium hover:bg-accent transition-colors">
                使い方を見る
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
