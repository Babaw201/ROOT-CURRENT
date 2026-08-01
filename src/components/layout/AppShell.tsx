import type { ReactNode } from 'react'
import type { Page } from '../../app/navigation'
import { BottomNav } from './BottomNav'
import { Sidebar } from './Sidebar'

export function AppShell({
  currentPage,
  unreadAlertCount,
  onNavigate,
  children,
}: {
  currentPage: Page
  unreadAlertCount: number
  onNavigate: (page: Page) => void
  children: ReactNode
}) {
  return (
    <div className="min-h-screen bg-[#f6f7f2] text-stone-900">
      <div className="mx-auto flex min-h-screen max-w-[1500px]">
        <Sidebar currentPage={currentPage} unreadAlertCount={unreadAlertCount} onNavigate={onNavigate} />
        <main className="w-full min-w-0 px-4 pb-28 pt-5 sm:px-6 lg:px-10 lg:pb-10 lg:pt-8">{children}</main>
      </div>
      <BottomNav currentPage={currentPage} unreadAlertCount={unreadAlertCount} onNavigate={onNavigate} />
    </div>
  )
}
