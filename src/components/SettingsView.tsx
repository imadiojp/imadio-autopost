import { Button } from './ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Switch } from './ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select'
import { Alert, AlertDescription } from './ui/alert'
import { AlertCircle } from 'lucide-react'
import { toast } from 'sonner'
import { useApp } from '../contexts/AppContext'

export default function SettingsView() {
  const { settings, updateSettings } = useApp()

  const handleSave = () => {
    toast.success('設定を保存しました')
  }

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto">
      <h1 className="mb-6">設定</h1>

      <div className="space-y-6">
        {/* Timezone Settings */}
        <Card>
          <CardHeader>
            <CardTitle>タイムゾーン</CardTitle>
            <CardDescription>
              投稿の予約時刻に使用するタイムゾーンを設定します
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Label htmlFor="timezone">タイムゾーン</Label>
              <Select
                value={settings.timezone}
                onValueChange={(value) => updateSettings({ timezone: value })}
              >
                <SelectTrigger id="timezone">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Asia/Tokyo">
                    Asia/Tokyo (UTC+9)
                  </SelectItem>
                  <SelectItem value="America/New_York">
                    America/New_York (UTC-5)
                  </SelectItem>
                  <SelectItem value="Europe/London">
                    Europe/London (UTC+0)
                  </SelectItem>
                  <SelectItem value="America/Los_Angeles">
                    America/Los_Angeles (UTC-8)
                  </SelectItem>
                  <SelectItem value="Europe/Paris">
                    Europe/Paris (UTC+1)
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Bulk Pause */}
        <Card>
          <CardHeader>
            <CardTitle>一括停止</CardTitle>
            <CardDescription>
              すべての予約投稿を一時的に停止します
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="space-y-0.5 flex-1">
                <Label htmlFor="bulk-pause">すべての投稿を停止</Label>
                <p className="text-sm text-muted-foreground">
                  有効にすると、すべての予約投稿が停止されます
                </p>
              </div>
              <Switch
                id="bulk-pause"
                checked={settings.bulkPause}
                onCheckedChange={(checked) => {
                  updateSettings({ bulkPause: checked })
                  toast.success(
                    checked
                      ? 'すべての投稿を停止しました'
                      : 'すべての投稿を再開しました'
                  )
                }}
              />
            </div>

            {settings.bulkPause && (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  現在、すべての予約投稿が停止されています。再開するには、このスイッチをオフにしてください。
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        {/* Email Notifications */}
        <Card>
          <CardHeader>
            <CardTitle>メール通知</CardTitle>
            <CardDescription>
              投稿の成功・失敗をメールで受け取ります
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="space-y-0.5 flex-1">
                <Label htmlFor="email-notifications">メール通知を有効化</Label>
                <p className="text-sm text-muted-foreground">
                  投稿の実行結果をメールで通知します
                </p>
              </div>
              <Switch
                id="email-notifications"
                checked={settings.emailNotifications}
                onCheckedChange={(checked) =>
                  updateSettings({ emailNotifications: checked })
                }
              />
            </div>

            {settings.emailNotifications && (
              <div className="space-y-2">
                <Label htmlFor="email">メールアドレス</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="your@email.com"
                  value={settings.email}
                  onChange={(e) => updateSettings({ email: e.target.value })}
                  className="text-base"
                />
              </div>
            )}
          </CardContent>
        </Card>

        {/* Auto Retry */}
        <Card>
          <CardHeader>
            <CardTitle>自動リトライ</CardTitle>
            <CardDescription>
              投稿に失敗した場合、自動的に再試行します
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="space-y-0.5 flex-1">
                <Label htmlFor="auto-retry">自動リトライを有効化</Label>
                <p className="text-sm text-muted-foreground">
                  失敗した投稿を{settings.retryInterval}分後に再試行します（最大
                  {settings.maxRetryCount}回）
                </p>
              </div>
              <Switch
                id="auto-retry"
                checked={settings.autoRetry}
                onCheckedChange={(checked) =>
                  updateSettings({ autoRetry: checked })
                }
              />
            </div>
          </CardContent>
        </Card>

        {/* Save Button */}
        <div className="flex justify-end">
          <Button onClick={handleSave}>設定を保存</Button>
        </div>
      </div>
    </div>
  )
}
