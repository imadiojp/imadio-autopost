import { useState } from 'react'
import { Button } from './ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { toast } from 'sonner'
import { authApi } from '../lib/api'

interface AuthProps {
  onSuccess: () => void
}

export default function Auth({ onSuccess }: AuthProps) {
  const [isLogin, setIsLogin] = useState(true)
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      if (isLogin) {
        // ログイン
        const response = await authApi.login(email, password)
        localStorage.setItem('auth_token', response.token)
        toast.success('ログインしました')
        onSuccess()
      } else {
        // 新規登録
        if (!username.trim()) {
          toast.error('ユーザー名を入力してください')
          setIsLoading(false)
          return
        }
        const response = await authApi.register(username, email, password)
        localStorage.setItem('auth_token', response.token)
        toast.success('アカウントを作成しました')
        onSuccess()
      }
    } catch (error: any) {
      console.error('Auth error:', error)
      toast.error(error.message || '認証に失敗しました')
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>{isLogin ? 'ログイン' : '新規登録'}</CardTitle>
          <CardDescription>
            {isLogin
              ? 'アカウントにログインしてください'
              : 'アカウントを作成してX連携を始めましょう'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <div className="space-y-2">
                <Label htmlFor="username">ユーザー名</Label>
                <Input
                  id="username"
                  type="text"
                  placeholder="your_name"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                />
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="email">メールアドレス</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">パスワード</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
              />
              {!isLogin && (
                <p className="text-xs text-muted-foreground">
                  6文字以上で入力してください
                </p>
              )}
            </div>

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading
                ? '処理中...'
                : isLogin
                  ? 'ログイン'
                  : '新規登録'}
            </Button>

            <div className="text-center">
              <Button
                type="button"
                variant="link"
                onClick={() => {
                  setIsLogin(!isLogin)
                  setUsername('')
                  setEmail('')
                  setPassword('')
                }}
              >
                {isLogin
                  ? 'アカウントをお持ちでない方はこちら'
                  : 'すでにアカウントをお持ちの方はこちら'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
