import { useState, useEffect } from 'react'
import {
  PenSquare,
  Calendar,
  Clock,
  History,
  Settings,
  Link as LinkIcon,
  Inbox,
  Sun,
  Moon
} from 'lucide-react'
import { Button } from './components/ui/button'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from './components/ui/sidebar'
import Composer from './components/Composer'
import CalendarView from './components/CalendarView'
import Queue from './components/Queue'
import HistoryView from './components/HistoryView'
import SettingsView from './components/SettingsView'
import Connections from './components/Connections'
import EmptyStates from './components/EmptyStates'
import MarketingCard from './components/MarketingCard'
import Auth from './components/Auth'
import { Toaster } from 'sonner'

type Page =
  | 'composer'
  | 'calendar'
  | 'queue'
  | 'history'
  | 'settings'
  | 'connections'
  | 'empty-states'
  | 'marketing'

function App() {
  const [currentPage, setCurrentPage] = useState<Page>('composer')
  const [isDark, setIsDark] = useState(false)
  const [editingPostId, setEditingPostId] = useState<string | null>(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  useEffect(() => {
    // Check if user is logged in
    const token = localStorage.getItem('auth_token')
    setIsAuthenticated(!!token)
  }, [])

  const toggleTheme = () => {
    setIsDark(!isDark)
    document.documentElement.classList.toggle('dark')
  }

  const handleEditPost = (postId: string) => {
    setEditingPostId(postId)
    setCurrentPage('composer')
  }

  const menuItems = [
    { id: 'composer' as const, icon: PenSquare, label: '投稿作成' },
    { id: 'calendar' as const, icon: Calendar, label: 'カレンダー' },
    { id: 'queue' as const, icon: Clock, label: '予約キュー' },
    { id: 'history' as const, icon: History, label: '履歴' },
    { id: 'settings' as const, icon: Settings, label: '設定' },
  ]

  const utilityItems = [
    { id: 'connections' as const, icon: LinkIcon, label: 'X連携' },
    { id: 'empty-states' as const, icon: Inbox, label: 'Empty States' },
    { id: 'marketing' as const, icon: PenSquare, label: 'マーケティング' },
  ]

  const renderPage = () => {
    switch (currentPage) {
      case 'composer':
        return <Composer editingPostId={editingPostId} onEditComplete={() => setEditingPostId(null)} />
      case 'calendar':
        return <CalendarView onEditPost={handleEditPost} />
      case 'queue':
        return <Queue onEditPost={handleEditPost} />
      case 'history':
        return <HistoryView />
      case 'settings':
        return <SettingsView />
      case 'connections':
        return <Connections />
      case 'empty-states':
        return <EmptyStates />
      case 'marketing':
        return <MarketingCard />
      default:
        return <Composer editingPostId={editingPostId} onEditComplete={() => setEditingPostId(null)} />
    }
  }

  // Show auth screen if not logged in
  if (!isAuthenticated) {
    return (
      <>
        <Auth onSuccess={() => setIsAuthenticated(true)} />
        <Toaster position="top-right" />
      </>
    )
  }

  return (
    <SidebarProvider defaultOpen={true}>
      <div className="flex h-screen w-full">
        {/* Sidebar */}
        <Sidebar>
          <SidebarHeader>
            <h2 className="font-medium">imadio autopost</h2>
          </SidebarHeader>

          <SidebarContent>
            {/* Main Menu */}
            <SidebarGroup>
              <SidebarMenu>
                {menuItems.map((item) => (
                  <SidebarMenuItem
                    key={item.id}
                    onClick={() => setCurrentPage(item.id)}
                    isActive={currentPage === item.id}
                  >
                    <item.icon className="h-4 w-4" />
                    <span>{item.label}</span>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroup>

            {/* Utility Menu */}
            <SidebarGroup>
              <SidebarGroupLabel>ユーティリティ</SidebarGroupLabel>
              <SidebarMenu>
                {utilityItems.map((item) => (
                  <SidebarMenuItem
                    key={item.id}
                    onClick={() => setCurrentPage(item.id)}
                    isActive={currentPage === item.id}
                  >
                    <item.icon className="h-4 w-4" />
                    <span>{item.label}</span>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroup>
          </SidebarContent>

          {/* Theme Toggle */}
          <SidebarFooter>
            <Button
              variant="outline"
              size="sm"
              onClick={toggleTheme}
              className="w-full justify-start gap-3"
            >
              {isDark ? (
                <>
                  <Sun className="h-4 w-4" />
                  <span>ライトモード</span>
                </>
              ) : (
                <>
                  <Moon className="h-4 w-4" />
                  <span>ダークモード</span>
                </>
              )}
            </Button>
          </SidebarFooter>
        </Sidebar>

        {/* Main Content */}
        <main className="flex-1 overflow-auto">
          {/* Top Bar with Hamburger Menu */}
          <div className="sticky top-0 z-10 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 md:hidden">
            <div className="flex h-16 items-center px-4 gap-4">
              <SidebarTrigger />
              <h2 className="font-medium">imadio autopost</h2>
            </div>
          </div>

          {/* Page Content */}
          <div className="pb-16">
            {renderPage()}
          </div>
        </main>
      </div>
      <Toaster position="top-right" />
    </SidebarProvider>
  )
}

export default App
