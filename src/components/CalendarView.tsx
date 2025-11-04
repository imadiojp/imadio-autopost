import { useState } from 'react'
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Edit } from 'lucide-react'
import { Button } from './ui/button'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Badge } from './ui/badge'
import { format, addWeeks, subWeeks, startOfWeek, addDays, isSameDay, parseISO } from 'date-fns'
import { useApp } from '../contexts/AppContext'

interface CalendarViewProps {
  onEditPost?: (postId: string) => void
}

export default function CalendarView({ onEditPost }: CalendarViewProps) {
  const { posts, accounts } = useApp()
  const [currentWeek, setCurrentWeek] = useState(new Date())

  const weekStart = startOfWeek(currentWeek, { weekStartsOn: 0 }) // Sunday
  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))

  const hours = Array.from({ length: 24 }, (_, i) => i)

  const getPostsForDateTime = (day: Date, hour: number) => {
    return posts.filter((post) => {
      if (!post.scheduledDate || !post.scheduledTime) return false

      try {
        const postDate = parseISO(post.scheduledDate)
        const [postHour] = post.scheduledTime.split(':').map(Number)

        return isSameDay(postDate, day) && postHour === hour
      } catch {
        return false
      }
    })
  }

  const getAccountName = (accountId: string) => {
    return accounts.find((acc) => acc.id === accountId)?.displayName || 'Unknown'
  }

  const goToPrevWeek = () => setCurrentWeek(subWeeks(currentWeek, 1))
  const goToNextWeek = () => setCurrentWeek(addWeeks(currentWeek, 1))
  const goToToday = () => setCurrentWeek(new Date())

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto">
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1>カレンダー</h1>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={goToPrevWeek}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={goToToday}>
            今週
          </Button>
          <Button variant="outline" size="sm" onClick={goToNextWeek}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarIcon className="h-5 w-5" />
            {format(weekStart, 'yyyy年M月d日')} -{' '}
            {format(addDays(weekStart, 6), 'yyyy年M月d日')}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <div className="min-w-[800px]">
              {/* Header - Days of week */}
              <div className="grid grid-cols-[80px_repeat(7,1fr)] border-b">
                <div className="p-3 border-r bg-muted"></div>
                {days.map((day, idx) => (
                  <div
                    key={idx}
                    className="p-3 text-center border-r last:border-r-0"
                  >
                    <div className="text-sm font-medium">{format(day, 'EEE')}</div>
                    <div
                      className={`text-lg ${
                        isSameDay(day, new Date())
                          ? 'font-bold text-primary'
                          : ''
                      }`}
                    >
                      {format(day, 'd')}
                    </div>
                  </div>
                ))}
              </div>

              {/* Time slots */}
              {hours.map((hour) => (
                <div
                  key={hour}
                  className="grid grid-cols-[80px_repeat(7,1fr)] border-b last:border-b-0"
                >
                  <div className="p-3 border-r bg-muted text-sm text-muted-foreground text-center">
                    {hour.toString().padStart(2, '0')}:00
                  </div>
                  {days.map((day, dayIdx) => {
                    const postsInSlot = getPostsForDateTime(day, hour)
                    return (
                      <div
                        key={dayIdx}
                        className="p-2 border-r last:border-r-0 min-h-[60px] hover:bg-accent/50 transition-colors"
                      >
                        {postsInSlot.map((post) => (
                          <div
                            key={post.id}
                            className="mb-1 last:mb-0 group relative"
                          >
                            <div className="p-2 rounded bg-primary/10 border border-primary/20 text-xs cursor-pointer hover:bg-primary/20 transition-colors">
                              <div className="flex items-center gap-1 mb-1">
                                <Badge
                                  variant={
                                    post.status === 'scheduled'
                                      ? 'default'
                                      : post.status === 'posted'
                                      ? 'success'
                                      : post.status === 'failed'
                                      ? 'destructive'
                                      : 'secondary'
                                  }
                                  className="text-[10px] px-1 py-0"
                                >
                                  {post.status === 'scheduled'
                                    ? '予約'
                                    : post.status === 'posted'
                                    ? '完了'
                                    : post.status === 'failed'
                                    ? '失敗'
                                    : post.status}
                                </Badge>
                                {post.type === 'thread' && (
                                  <span className="text-[10px] text-muted-foreground">
                                    × {post.threadCount}
                                  </span>
                                )}
                                {post.status === 'scheduled' && (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      onEditPost?.(post.id)
                                    }}
                                    className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity"
                                  >
                                    <Edit className="h-3 w-3" />
                                  </button>
                                )}
                              </div>
                              <p className="line-clamp-2 text-[11px] leading-tight">
                                {post.text}
                              </p>
                              <div className="mt-1 text-[10px] text-muted-foreground truncate">
                                {post.accountIds
                                  .map((id) => getAccountName(id))
                                  .join(', ')}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )
                  })}
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
