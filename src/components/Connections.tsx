import { useState, useEffect } from 'react'
import { CheckCircle, XCircle, Plus, Crown } from 'lucide-react'
import { Button } from './ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card'
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar'
import { Badge } from './ui/badge'
import { toast } from 'sonner'
import { useApp } from '../contexts/AppContext'
import type { AccountType } from '../types'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select'
import { xAccountApi } from '../lib/api'

const MAX_ACCOUNTS = 5

export default function Connections() {
  const { accounts, addAccount, updateAccount, removeAccount, setAccounts } = useApp()
  const [isConnecting, setIsConnecting] = useState(false)

  // Load accounts on mount
  useEffect(() => {
    loadAccounts()
  }, [])

  // Check for OAuth callback success/error on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const success = params.get('success')
    const error = params.get('error')

    if (success === 'true') {
      toast.success('Xアカウントを連携しました')
      // Reload accounts from server
      loadAccounts()
      // Clear URL params
      window.history.replaceState({}, '', window.location.pathname)
    } else if (error) {
      toast.error(`連携に失敗しました: ${decodeURIComponent(error)}`)
      // Clear URL params
      window.history.replaceState({}, '', window.location.pathname)
    }
  }, [])

  const loadAccounts = async () => {
    try {
      // Get anonymous user ID
      const anonymousId = localStorage.getItem('anonymous_user_id')

      if (!anonymousId) {
        console.error('No anonymous ID found')
        return
      }

      const response = await xAccountApi.getAccountsAnonymous(anonymousId)
      // Replace local state with server data (single source of truth)
      setAccounts(response.accounts)
    } catch (error: any) {
      console.error('Failed to load accounts:', error)
    }
  }

  const handleConnect = async () => {
    if (accounts.length >= MAX_ACCOUNTS) {
      toast.error(`最大${MAX_ACCOUNTS}アカウントまで連携できます`)
      return
    }

    setIsConnecting(true)
    try {
      // Get anonymous user ID
      const anonymousId = localStorage.getItem('anonymous_user_id')

      // Get OAuth URL from backend
      const response = await xAccountApi.initiateAuthAnonymous(anonymousId!)

      // Store code verifier and state in localStorage
      localStorage.setItem('oauth_code_verifier', response.codeVerifier)
      localStorage.setItem('oauth_state', response.state)

      // Redirect to X OAuth page
      window.location.href = response.authUrl
    } catch (error: any) {
      console.error('Failed to initiate X auth:', error)
      toast.error('認証の開始に失敗しました。後でもう一度お試しください。')
      setIsConnecting(false)
    }
  }

  const handleDisconnect = (id: string) => {
    updateAccount(id, { isConnected: false })
    toast.success('アカウントの連携を解除しました')
  }

  const handleReconnect = (id: string) => {
    updateAccount(id, { isConnected: true })
    toast.success('アカウントを再連携しました')
  }

  const handleRemove = (id: string) => {
    removeAccount(id)
    toast.success('アカウントを削除しました')
  }

  const handleAccountTypeChange = (id: string, accountType: AccountType) => {
    updateAccount(id, { accountType })
    toast.success(`アカウントタイプを${accountType === 'free' ? '無料' : 'プレミアム'}に変更しました`)
  }

  const connectedAccounts = accounts.filter((acc) => acc.isConnected)

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto">
      <div className="mb-6 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <h1 className="mb-2">X連携</h1>
          <p className="text-muted-foreground">
            Xアカウントを連携して、自動投稿を開始しましょう
          </p>
        </div>
        <Badge variant="secondary">
          {connectedAccounts.length}/{MAX_ACCOUNTS} アカウント
        </Badge>
      </div>

      {/* Connected Accounts */}
      <div className="space-y-6 mb-6">
        {accounts.length > 0 ? (
          accounts.map((account) => (
            <Card key={account.id}>
              <CardContent className="p-6">
                <div className="flex flex-col gap-4">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                    <Avatar className="h-12 w-12 shrink-0">
                      <AvatarImage src={account.avatar} />
                      <AvatarFallback>
                        {account.displayName.charAt(0)}
                      </AvatarFallback>
                    </Avatar>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-medium">{account.displayName}</h3>
                        {account.accountType === 'premium' && (
                          <Badge variant="default" className="gap-1">
                            <Crown className="h-3 w-3" />
                            Premium
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground break-all">
                        {account.username}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 w-full sm:w-auto">
                      {account.isConnected ? (
                        <Badge variant="success" className="gap-1">
                          <CheckCircle className="h-3 w-3" />
                          接続済み
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="gap-1">
                          <XCircle className="h-3 w-3" />
                          未接続
                        </Badge>
                      )}
                    </div>
                  </div>

                  {/* Account Settings */}
                  <div className="flex flex-col sm:flex-row gap-4 pt-4 border-t">
                    <div className="flex-1">
                      <label className="text-sm font-medium mb-2 block">
                        アカウントタイプ
                      </label>
                      <Select
                        value={account.accountType}
                        onValueChange={(value) =>
                          handleAccountTypeChange(account.id, value as AccountType)
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="free">
                            無料 (140文字)
                          </SelectItem>
                          <SelectItem value="premium">
                            プレミアム (25,000文字)
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="flex items-end gap-2">
                      {account.isConnected ? (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDisconnect(account.id)}
                          className="w-full sm:w-auto"
                        >
                          連携解除
                        </Button>
                      ) : (
                        <Button
                          variant="default"
                          size="sm"
                          onClick={() => handleReconnect(account.id)}
                          className="w-full sm:w-auto"
                        >
                          再連携
                        </Button>
                      )}
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleRemove(account.id)}
                        className="w-full sm:w-auto"
                      >
                        削除
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <Card>
            <CardContent className="p-12 text-center">
              <XCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="mb-2">Xアカウント未連携</h3>
              <p className="text-muted-foreground mb-4">
                まだアカウントが連携されていません
              </p>
              <Button onClick={handleConnect} disabled={isConnecting}>
                <Plus className="h-4 w-4 mr-2" />
                {isConnecting ? '認証中...' : 'アカウントを追加'}
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Add Account Button */}
      {accounts.length > 0 && accounts.length < MAX_ACCOUNTS && (
        <Button
          variant="outline"
          className="w-full"
          onClick={handleConnect}
          disabled={isConnecting}
        >
          <Plus className="h-4 w-4 mr-2" />
          {isConnecting ? '認証中...' : `アカウントを追加 (${accounts.length}/${MAX_ACCOUNTS})`}
        </Button>
      )}

      {accounts.length >= MAX_ACCOUNTS && (
        <div className="text-center p-4 bg-muted rounded-lg">
          <p className="text-sm text-muted-foreground">
            最大アカウント数に達しました
          </p>
        </div>
      )}

      {/* Permissions Info */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>必要な権限</CardTitle>
          <CardDescription>
            このアプリは以下の権限を使用します
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm">
            <li className="flex items-start gap-2">
              <CheckCircle className="h-4 w-4 text-success mt-0.5" />
              <span>ツイートの投稿（テキスト・画像）</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle className="h-4 w-4 text-success mt-0.5" />
              <span>スレッドの作成</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle className="h-4 w-4 text-success mt-0.5" />
              <span>投稿履歴の参照（読み取りのみ）</span>
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  )
}
