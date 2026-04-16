'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { AppSidebar } from '@/components/app-sidebar'
import { AppHeader } from '@/components/app-header'

function useAuth() {
  const [state, setState] = useState(() => {
    // Only run on client
    if (typeof window === 'undefined') {
      return { isLoading: true, isAuthenticated: false }
    }
    const user = localStorage.getItem('geo_e_user')
    return { 
      isLoading: false, 
      isAuthenticated: !!user 
    }
  })

  const checkAuth = useCallback(() => {
    const user = localStorage.getItem('geo_e_user')
    setState({ isLoading: false, isAuthenticated: !!user })
  }, [])

  return { ...state, checkAuth }
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const { isLoading, isAuthenticated } = useAuth()

  // Redirect if not authenticated
  if (!isLoading && !isAuthenticated) {
    router.push('/login')
    return null
  }

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return null
  }

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Sidebar */}
      <AppSidebar />
      
      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <AppHeader />
        
        {/* Page content */}
        <main className="flex-1 overflow-auto p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
