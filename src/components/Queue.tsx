import { useState } from 'react'
import { Image, MessageSquare, Play, Pause, Trash2, Calendar, Clock, Edit } from 'lucide-react'
import { Button } from './ui/button'
import { Card, CardContent } from './ui/card'
import { Badge } from './ui/badge'
import { Checkbox } from './ui/checkbox'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select'
import { toast } from 'sonner'
import { useApp } from '../contexts/AppContext'

interface QueueProps {
  onEditPost?: (postId: string) => void
}

export default function Queue({ onEditPost }: QueueProps) {
  const { posts, accounts, updatePost, removePost } = useApp()
  const [filter, setFilter] = useState<'all' | 'scheduled' | 'paused'>('all')
  const [selectedIds, setSelectedIds] = useState<string[]>([])

  // 予約中と停止中の投稿のみ表示
  const queuePosts = posts.filter(
    (post) => post.status === 'scheduled' || post.status === 'posting'
  )

  const filteredPosts = queuePosts.filter((post) =>
    filter === 'all'
      ? true
      : filter === 'scheduled'
      ? post.status === 'scheduled'
      : false
  )

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    )
  }

  const toggleSelectAll = () => {
    if (selectedIds.length === filteredPosts.length) {
      setSelectedIds([])
    } else {
      setSelectedIds(filteredPosts.map((p) => p.id))
    }
  }

  const handleDelete = (id: string) => {
    removePost(id)
    setSelectedIds((prev) => prev.filter((i) => i !== id))
    toast.success('投稿を削除しました')
  }

  const bulkDelete = () => {
    if (selectedIds.length === 0) {
      toast.error('削除する投稿を選択してください')
      return
    }
    selectedIds.forEach((id) => removePost(id))
    setSelectedIds([])
    toast.success(`${selectedIds.length}件の投稿を削除しました`)
  }

  const getAccountNames = (accountIds: string[]) => {
    return accountIds
      .map((id) => {
        const account = accounts.find((acc) => acc.id === id)
        return account?.displayName || ''
      })
      .filter(Boolean)
      .join(', ')
  }

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto">
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="mb-2">予約キュー</h1>
          <p className="text-muted-foreground">
            予約された投稿の一覧と管理
          </p>
        </div>
        <Badge variant="secondary">{filteredPosts.length}件</Badge>
      </div>

      {/* Filters and Bulk Actions */}
      <div className="mb-6 flex flex-col sm:flex-row items-stretch sm:items-center gap-4 flex-wrap">
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">フィルター:</span>
          <Select value={filter} onValueChange={(value: any) => setFilter(value)}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="ステータス" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">すべて</SelectItem>
              <SelectItem value="scheduled">予約中</SelectItem>
              <SelectItem value="paused">停止中</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {selectedIds.length > 0 && (
          <div className="flex gap-2 flex-wrap">
            <Button variant="outline" size="sm" onClick={toggleSelectAll}>
              選択解除
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={bulkDelete}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              削除 ({selectedIds.length})
            </Button>
          </div>
        )}
      </div>

      {/* Queue List */}
      {filteredPosts.length > 0 ? (
        <div className="space-y-4">
          {filteredPosts.map((post) => (
            <Card key={post.id}>
              <CardContent className="p-4 md:p-6">
                <div className="flex flex-col gap-4">
                  <div className="flex items-start gap-4">
                    <Checkbox
                      checked={selectedIds.includes(post.id)}
                      onCheckedChange={() => toggleSelect(post.id)}
                      className="mt-1"
                    />

                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        <Badge variant={post.status === 'scheduled' ? 'default' : 'secondary'}>
                          {post.status === 'scheduled' ? '予約中' : '投稿中'}
                        </Badge>
                        {post.type === 'thread' && (
                          <Badge variant="outline" className="gap-1">
                            <MessageSquare className="h-3 w-3" />
                            スレッド {post.threadCount}
                          </Badge>
                        )}
                        {post.images.length > 0 && (
                          <Badge variant="outline" className="gap-1">
                            <Image className="h-3 w-3" />
                            画像 {post.images.length}
                          </Badge>
                        )}
                      </div>

                      <p className="text-sm mb-3 line-clamp-2">{post.text}</p>

                      <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3.5 w-3.5" />
                          <span>{post.scheduledDate}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="h-3.5 w-3.5" />
                          <span>{post.scheduledTime}</span>
                        </div>
                      </div>

                      <div className="mt-2 text-xs text-muted-foreground">
                        投稿先: {getAccountNames(post.accountIds)}
                      </div>
                    </div>

                    <div className="flex gap-2 shrink-0">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onEditPost?.(post.id)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(post.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="p-12 text-center">
            <div className="text-muted-foreground">
              <Calendar className="h-12 w-12 mx-auto mb-4" />
              <h3 className="mb-2">予約投稿がありません</h3>
              <p className="text-sm mb-4">
                投稿作成ページから新しい投稿を予約してください
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
