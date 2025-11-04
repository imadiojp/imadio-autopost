import { useState } from 'react'
import { Badge } from './ui/badge'
import { Button } from './ui/button'
import { Card, CardContent } from './ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from './ui/table'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select'
import { Eye, History as HistoryIcon } from 'lucide-react'
import { useApp } from '../contexts/AppContext'
import type { PostStatus } from '../types'

export default function HistoryView() {
  const { posts, accounts } = useApp()
  const [statusFilter, setStatusFilter] = useState<'all' | PostStatus>('all')
  const [typeFilter, setTypeFilter] = useState<'all' | 'single' | 'thread'>('all')

  // 投稿済み、失敗、再試行中の投稿を表示
  const historyPosts = posts.filter((post) =>
    ['posted', 'failed', 'retrying'].includes(post.status)
  )

  const filteredHistory = historyPosts.filter((post) => {
    const statusMatch = statusFilter === 'all' || post.status === statusFilter
    const typeMatch = typeFilter === 'all' || post.type === typeFilter
    return statusMatch && typeMatch
  })

  const getAccountNames = (accountIds: string[]) => {
    return accountIds
      .map((id) => {
        const account = accounts.find((acc) => acc.id === id)
        return account?.displayName || ''
      })
      .filter(Boolean)
      .join(', ')
  }

  const getStatusBadge = (status: PostStatus) => {
    switch (status) {
      case 'posted':
        return (
          <Badge variant="success" className="gap-1">
            完了
          </Badge>
        )
      case 'failed':
        return (
          <Badge variant="destructive" className="gap-1">
            失敗
          </Badge>
        )
      case 'retrying':
        return (
          <Badge variant="outline" className="gap-1">
            再試行中
          </Badge>
        )
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto">
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1>投稿履歴</h1>
        <Badge variant="secondary">{filteredHistory.length}件</Badge>
      </div>

      {/* Filters */}
      <div className="mb-6 flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">ステータス:</span>
          <Select
            value={statusFilter}
            onValueChange={(value: any) => setStatusFilter(value)}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="ステータス" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">すべて</SelectItem>
              <SelectItem value="posted">完了</SelectItem>
              <SelectItem value="failed">失敗</SelectItem>
              <SelectItem value="retrying">再試行中</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">タイプ:</span>
          <Select
            value={typeFilter}
            onValueChange={(value: any) => setTypeFilter(value)}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="タイプ" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">すべて</SelectItem>
              <SelectItem value="single">単一投稿</SelectItem>
              <SelectItem value="thread">スレッド</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* History Table */}
      {filteredHistory.length > 0 ? (
        <div className="border rounded-lg overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[180px]">日時</TableHead>
                <TableHead>投稿内容</TableHead>
                <TableHead className="w-[100px]">タイプ</TableHead>
                <TableHead className="w-[120px]">ステータス</TableHead>
                <TableHead className="w-[150px]">投稿先</TableHead>
                <TableHead className="w-[100px]">アクション</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredHistory.map((post) => (
                <TableRow key={post.id}>
                  <TableCell className="text-sm">
                    <div className="flex flex-col">
                      <span>{post.scheduledDate}</span>
                      <span className="text-muted-foreground">{post.scheduledTime}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <p className="line-clamp-2 text-sm">{post.text}</p>
                  </TableCell>
                  <TableCell>
                    {post.type === 'thread' ? (
                      <Badge variant="outline" className="gap-1">
                        スレッド {post.threadCount}
                      </Badge>
                    ) : (
                      <Badge variant="secondary">単一</Badge>
                    )}
                  </TableCell>
                  <TableCell>{getStatusBadge(post.status)}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {getAccountNames(post.accountIds)}
                  </TableCell>
                  <TableCell>
                    <Button variant="ghost" size="sm">
                      <Eye className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : (
        <Card>
          <CardContent className="p-12 text-center">
            <div className="text-muted-foreground">
              <HistoryIcon className="h-12 w-12 mx-auto mb-4" />
              <h3 className="mb-2">履歴がありません</h3>
              <p className="text-sm mb-4">
                投稿が実行されると、ここに履歴が表示されます
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
