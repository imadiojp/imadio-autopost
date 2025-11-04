import { useState, useRef, useEffect } from 'react'
import { Image, Plus, Calendar as CalendarIcon, Clock, X as XIcon, AlertCircle, Crown, Trash2 } from 'lucide-react'
import { Button } from './ui/button'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Textarea } from './ui/textarea'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Badge } from './ui/badge'
import { Checkbox } from './ui/checkbox'
import { Alert, AlertDescription } from './ui/alert'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select'
import { toast } from 'sonner'
import { useApp } from '../contexts/AppContext'
import type { PostImage } from '../types'
import { CHARACTER_LIMITS } from '../types'

interface Thread {
  id: string
  text: string
}

interface ComposerProps {
  editingPostId?: string | null
  onEditComplete?: () => void
}

export default function Composer({ editingPostId, onEditComplete }: ComposerProps) {
  const { accounts, addPost, posts, updatePost } = useApp()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [threads, setThreads] = useState<Thread[]>([
    { id: 'thread_1', text: '' }
  ])
  const [images, setImages] = useState<PostImage[]>([])
  const [scheduledDate, setScheduledDate] = useState('')
  const [scheduledTime, setScheduledTime] = useState('')
  const [timezone, setTimezone] = useState('Asia/Tokyo')
  const [selectedAccountIds, setSelectedAccountIds] = useState<string[]>([])

  // 接続済みのアカウントのみ表示
  const connectedAccounts = accounts.filter((acc) => acc.isConnected)

  // Load post data when editing
  useEffect(() => {
    if (editingPostId) {
      const postToEdit = posts.find((p) => p.id === editingPostId)
      if (postToEdit) {
        // Split combined text back into threads
        const textParts = postToEdit.text.split('\n\n').filter(t => t.trim() && t !== '(画像のみ)')
        if (textParts.length > 0) {
          setThreads(textParts.map((text, idx) => ({
            id: `thread_${idx + 1}`,
            text
          })))
        } else {
          setThreads([{ id: 'thread_1', text: '' }])
        }

        setImages(postToEdit.images)
        setScheduledDate(postToEdit.scheduledDate)
        setScheduledTime(postToEdit.scheduledTime)
        setTimezone(postToEdit.timezone)
        setSelectedAccountIds(postToEdit.accountIds)
      }
    }
  }, [editingPostId, posts])

  // 選択されたアカウントの最も厳しい文字数制限を取得
  const getCharLimit = () => {
    if (selectedAccountIds.length === 0) return CHARACTER_LIMITS.free
    const selectedAccounts = accounts.filter((acc) =>
      selectedAccountIds.includes(acc.id)
    )
    const hasFreeAccount = selectedAccounts.some(
      (acc) => acc.accountType === 'free'
    )
    return hasFreeAccount ? CHARACTER_LIMITS.free : CHARACTER_LIMITS.premium
  }

  const charLimit = getCharLimit()

  // 全スレッドの文字数をカウント
  const isOverLimit = threads.some((thread) => thread.text.length > charLimit)

  const handleAccountToggle = (accountId: string) => {
    setSelectedAccountIds((prev) =>
      prev.includes(accountId)
        ? prev.filter((id) => id !== accountId)
        : [...prev, accountId]
    )
  }

  const handleThreadTextChange = (id: string, text: string) => {
    setThreads((prev) =>
      prev.map((thread) =>
        thread.id === id ? { ...thread, text } : thread
      )
    )
  }

  const handleAddThread = () => {
    if (threads.length >= 10) {
      toast.error('スレッドは最大10個までです')
      return
    }
    const newThread: Thread = {
      id: `thread_${Date.now()}`,
      text: ''
    }
    setThreads([...threads, newThread])
    toast.success('スレッドを追加しました')
  }

  const handleRemoveThread = (id: string) => {
    if (threads.length <= 1) {
      toast.error('最低1つのスレッドが必要です')
      return
    }
    setThreads((prev) => prev.filter((thread) => thread.id !== id))
    toast.success('スレッドを削除しました')
  }

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files) return

    if (images.length + files.length > 4) {
      toast.error('画像は最大4枚までです')
      return
    }

    const newImages: PostImage[] = Array.from(files).map((file) => ({
      id: `img_${Date.now()}_${Math.random()}`,
      url: URL.createObjectURL(file),
      file,
    }))

    setImages([...images, ...newImages])
    toast.success(`${files.length}枚の画像を追加しました`)

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleRemoveImage = (id: string) => {
    setImages((prev) => {
      const image = prev.find((img) => img.id === id)
      if (image?.url) {
        URL.revokeObjectURL(image.url)
      }
      return prev.filter((img) => img.id !== id)
    })
    toast.success('画像を削除しました')
  }

  const handleSchedule = () => {
    const hasContent = threads.some((thread) => thread.text.trim()) || images.length > 0

    if (!hasContent) {
      toast.error('投稿内容または画像を追加してください')
      return
    }

    if (selectedAccountIds.length === 0) {
      toast.error('投稿先アカウントを選択してください')
      return
    }

    if (!scheduledDate || !scheduledTime) {
      toast.error('日時を選択してください')
      return
    }

    if (isOverLimit) {
      toast.error(`各スレッドは${charLimit}文字以内にしてください`)
      return
    }

    // 全スレッドのテキストを結合
    const combinedText = threads
      .filter((thread) => thread.text.trim())
      .map((thread) => thread.text)
      .join('\n\n')

    const postData = {
      text: combinedText || '(画像のみ)',
      images,
      scheduledDate,
      scheduledTime,
      timezone,
      accountIds: selectedAccountIds,
      status: 'scheduled' as const,
      type: threads.filter((t) => t.text.trim()).length > 1 ? ('thread' as const) : ('single' as const),
      threadCount: threads.filter((t) => t.text.trim()).length || 1,
      updatedAt: new Date().toISOString(),
    }

    if (editingPostId) {
      // Update existing post
      updatePost(editingPostId, postData)
      toast.success('投稿を更新しました')
      onEditComplete?.()
    } else {
      // Create new post
      const newPost = {
        ...postData,
        id: `post_${Date.now()}`,
        createdAt: new Date().toISOString(),
      }
      addPost(newPost)
      toast.success('投稿を予約しました')
    }

    // Reset form
    setThreads([{ id: 'thread_1', text: '' }])
    setImages([])
    setScheduledDate('')
    setScheduledTime('')
    setSelectedAccountIds([])
  }

  const hasAnyContent = threads.some((thread) => thread.text.trim()) || images.length > 0

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <h1>{editingPostId ? '投稿編集' : '投稿作成'}</h1>
      </div>

      {connectedAccounts.length === 0 && (
        <Alert className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            投稿を作成するには、まずX連携ページでアカウントを連携してください
          </AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Composer Form */}
        <div className="space-y-6">
          {/* Account Selection */}
          {connectedAccounts.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>投稿先アカウント</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {connectedAccounts.map((account) => (
                  <div
                    key={account.id}
                    className="flex items-center gap-3 p-3 rounded-lg border hover:bg-accent/50 transition-colors"
                  >
                    <Checkbox
                      id={`account-${account.id}`}
                      checked={selectedAccountIds.includes(account.id)}
                      onCheckedChange={() => handleAccountToggle(account.id)}
                    />
                    <label
                      htmlFor={`account-${account.id}`}
                      className="flex-1 cursor-pointer"
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-medium">
                          {account.displayName}
                        </span>
                        {account.accountType === 'premium' && (
                          <Badge variant="default" className="gap-1 text-xs">
                            <Crown className="h-2.5 w-2.5" />
                            Premium
                          </Badge>
                        )}
                      </div>
                      <span className="text-sm text-muted-foreground">
                        {account.username} •{' '}
                        {account.accountType === 'free'
                          ? '140文字'
                          : '25,000文字'}
                      </span>
                    </label>
                  </div>
                ))}
                {selectedAccountIds.length > 0 && (
                  <p className="text-xs text-muted-foreground">
                    {selectedAccountIds.length}個のアカウントに投稿されます
                  </p>
                )}
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>投稿内容</CardTitle>
                {selectedAccountIds.length > 0 && (
                  <span className="text-xs text-muted-foreground">
                    制限: {charLimit}文字/スレッド
                  </span>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Threads */}
              {threads.map((thread, index) => (
                <div key={thread.id} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor={`thread-${thread.id}`}>
                      {threads.length > 1 ? `スレッド ${index + 1}` : 'テキスト'}
                    </Label>
                    <div className="flex items-center gap-2">
                      <Badge
                        variant={
                          thread.text.length > charLimit
                            ? 'destructive'
                            : 'secondary'
                        }
                      >
                        {thread.text.length}/{charLimit}
                      </Badge>
                      {threads.length > 1 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveThread(thread.id)}
                          className="h-6 w-6 p-0"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                  </div>
                  <Textarea
                    id={`thread-${thread.id}`}
                    placeholder="投稿内容を入力してください"
                    value={thread.text}
                    onChange={(e) => handleThreadTextChange(thread.id, e.target.value)}
                    className="min-h-[120px] resize-none text-base"
                  />
                </div>
              ))}

              {/* Add Thread Button */}
              <Button
                variant="outline"
                onClick={handleAddThread}
                disabled={threads.length >= 10}
                className="w-full"
              >
                <Plus className="h-4 w-4 mr-2" />
                スレッドを追加 ({threads.length}/10)
              </Button>

              {/* Images */}
              <div className="pt-4 border-t">
                <Label className="mb-2 block">画像（任意）</Label>
                <div className="grid grid-cols-2 gap-3 mb-2">
                  {images.map((img) => (
                    <div
                      key={img.id}
                      className="relative aspect-video bg-muted rounded-md overflow-hidden group"
                    >
                      <img
                        src={img.url}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                      <button
                        onClick={() => handleRemoveImage(img.id)}
                        className="absolute top-2 right-2 bg-destructive text-destructive-foreground rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <XIcon className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleImageUpload}
                  className="hidden"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={images.length >= 4}
                  className="w-full sm:w-auto"
                >
                  <Image className="h-4 w-4 mr-2" />
                  画像を追加 ({images.length}/4)
                </Button>
              </div>

              {/* Date/Time/Timezone Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t">
                <div className="space-y-2">
                  <Label htmlFor="date">
                    <CalendarIcon className="h-4 w-4 inline mr-2" />
                    日付
                  </Label>
                  <Input
                    id="date"
                    type="date"
                    value={scheduledDate}
                    onChange={(e) => setScheduledDate(e.target.value)}
                    className="text-base"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="time">
                    <Clock className="h-4 w-4 inline mr-2" />
                    時刻
                  </Label>
                  <Input
                    id="time"
                    type="time"
                    value={scheduledTime}
                    onChange={(e) => setScheduledTime(e.target.value)}
                    className="text-base"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="timezone">タイムゾーン</Label>
                  <Select value={timezone} onValueChange={setTimezone}>
                    <SelectTrigger id="timezone">
                      <SelectValue placeholder="選択" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Asia/Tokyo">Asia/Tokyo</SelectItem>
                      <SelectItem value="America/New_York">
                        America/New_York
                      </SelectItem>
                      <SelectItem value="Europe/London">
                        Europe/London
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Button
                className="w-full"
                onClick={handleSchedule}
                disabled={connectedAccounts.length === 0}
              >
                <CalendarIcon className="h-4 w-4 mr-2" />
                {editingPostId ? '投稿を更新' : '投稿を予約'}
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Right: Preview */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle>プレビュー</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {hasAnyContent ? (
                <>
                  {threads.filter((t) => t.text.trim() || images.length > 0).map((thread, idx) => (
                    <div key={thread.id} className="border rounded-lg p-4 space-y-2">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-full bg-muted shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium">
                            {selectedAccountIds.length > 0
                              ? accounts.find(
                                  (acc) => acc.id === selectedAccountIds[0]
                                )?.displayName || 'ユーザー名'
                              : 'ユーザー名'}
                          </p>
                          <p className="text-muted-foreground text-sm">
                            {selectedAccountIds.length > 0
                              ? accounts.find(
                                  (acc) => acc.id === selectedAccountIds[0]
                                )?.username || '@username'
                              : '@username'}
                          </p>
                        </div>
                      </div>
                      {thread.text && (
                        <p className="whitespace-pre-wrap break-words">{thread.text}</p>
                      )}
                      {idx === 0 && images.length > 0 && (
                        <div className="grid grid-cols-2 gap-2 mt-2">
                          {images.map((img) => (
                            <div
                              key={img.id}
                              className="aspect-video bg-muted rounded-md overflow-hidden"
                            >
                              <img
                                src={img.url}
                                alt=""
                                className="w-full h-full object-cover"
                              />
                            </div>
                          ))}
                        </div>
                      )}
                      <div className="flex gap-4 text-muted-foreground flex-wrap">
                        <span className="text-sm">
                          <Clock className="h-3 w-3 inline mr-1" />
                          {scheduledDate && scheduledTime
                            ? `${scheduledDate} ${scheduledTime}`
                            : '未設定'}
                        </span>
                      </div>
                      {threads.filter((t) => t.text.trim()).length > 1 && (
                        <Badge variant="outline" className="text-xs">
                          スレッド {idx + 1}/{threads.filter((t) => t.text.trim()).length}
                        </Badge>
                      )}
                    </div>
                  ))}
                </>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  <p>投稿内容または画像を追加するとプレビューが表示されます</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
