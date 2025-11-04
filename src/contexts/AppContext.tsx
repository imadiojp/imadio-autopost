import React, { createContext, useContext, useState, useEffect } from 'react'
import type { Account, Post, Settings } from '../types'

interface AppContextType {
  // Accounts
  accounts: Account[]
  addAccount: (account: Account) => void
  updateAccount: (id: string, updates: Partial<Account>) => void
  removeAccount: (id: string) => void
  setAccounts: (accounts: Account[]) => void

  // Posts
  posts: Post[]
  addPost: (post: Post) => void
  updatePost: (id: string, updates: Partial<Post>) => void
  removePost: (id: string) => void

  // Settings
  settings: Settings
  updateSettings: (updates: Partial<Settings>) => void
}

const defaultSettings: Settings = {
  timezone: 'Asia/Tokyo',
  bulkPause: false,
  emailNotifications: false,
  email: '',
  autoRetry: true,
  maxRetryCount: 3,
  retryInterval: 15,
}

const AppContext = createContext<AppContextType | null>(null)

export function AppProvider({ children }: { children: React.ReactNode }) {
  // Load data from localStorage
  const [accounts, setAccounts] = useState<Account[]>(() => {
    const saved = localStorage.getItem('imadio_accounts')
    return saved ? JSON.parse(saved) : []
  })

  const [posts, setPosts] = useState<Post[]>(() => {
    const saved = localStorage.getItem('imadio_posts')
    return saved ? JSON.parse(saved) : []
  })

  const [settings, setSettings] = useState<Settings>(() => {
    const saved = localStorage.getItem('imadio_settings')
    return saved ? JSON.parse(saved) : defaultSettings
  })

  // Save to localStorage when data changes
  useEffect(() => {
    localStorage.setItem('imadio_accounts', JSON.stringify(accounts))
  }, [accounts])

  useEffect(() => {
    localStorage.setItem('imadio_posts', JSON.stringify(posts))
  }, [posts])

  useEffect(() => {
    localStorage.setItem('imadio_settings', JSON.stringify(settings))
  }, [settings])

  // Account operations
  const addAccount = (account: Account) => {
    setAccounts((prev) => [...prev, account])
  }

  const updateAccount = (id: string, updates: Partial<Account>) => {
    setAccounts((prev) =>
      prev.map((acc) => (acc.id === id ? { ...acc, ...updates } : acc))
    )
  }

  const removeAccount = (id: string) => {
    setAccounts((prev) => prev.filter((acc) => acc.id !== id))
  }

  // Post operations
  const addPost = (post: Post) => {
    setPosts((prev) => [...prev, post])
  }

  const updatePost = (id: string, updates: Partial<Post>) => {
    setPosts((prev) =>
      prev.map((post) => (post.id === id ? { ...post, ...updates } : post))
    )
  }

  const removePost = (id: string) => {
    setPosts((prev) => prev.filter((post) => post.id !== id))
  }

  // Settings operations
  const updateSettings = (updates: Partial<Settings>) => {
    setSettings((prev) => ({ ...prev, ...updates }))
  }

  const value: AppContextType = {
    accounts,
    addAccount,
    updateAccount,
    removeAccount,
    setAccounts,
    posts,
    addPost,
    updatePost,
    removePost,
    settings,
    updateSettings,
  }

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

export function useApp() {
  const context = useContext(AppContext)
  if (!context) {
    throw new Error('useApp must be used within an AppProvider')
  }
  return context
}
