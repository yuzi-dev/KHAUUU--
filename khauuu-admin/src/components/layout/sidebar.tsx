'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { 
  Home, 
  Store, 
  UtensilsCrossed, 
  Users, 
  Settings,
  BarChart3,
  Menu
} from 'lucide-react'
import { useState } from 'react'

const navigation = [
  {
    name: 'Dashboard',
    href: '/',
    icon: Home,
  },
  {
    name: 'Restaurants',
    href: '/restaurants',
    icon: Store,
  },
  {
    name: 'Foods',
    href: '/foods',
    icon: UtensilsCrossed,
  },
  {
    name: 'Users',
    href: '/users',
    icon: Users,
  },
  {
    name: 'Analytics',
    href: '/analytics',
    icon: BarChart3,
  },
  {
    name: 'Settings',
    href: '/settings',
    icon: Settings,
  },
]

export function Sidebar() {
  const pathname = usePathname()
  const [isCollapsed, setIsCollapsed] = useState(false)

  return (
    <div className={cn(
      "flex flex-col h-screen bg-white border-r border-gray-200 transition-all duration-300",
      isCollapsed ? "w-16" : "w-64"
    )}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        {!isCollapsed && (
          <h1 className="text-xl font-bold text-gray-900">Khauuu Admin</h1>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="h-8 w-8"
        >
          <Menu className="h-4 w-4" />
        </Button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2">
        {navigation.map((item) => {
          const isActive = pathname === item.href
          const Icon = item.icon

          return (
            <Link key={item.name} href={item.href}>
              <Button
                variant={isActive ? "default" : "ghost"}
                className={cn(
                  "w-full justify-start",
                  isCollapsed && "px-2"
                )}
              >
                <Icon className={cn("h-4 w-4", !isCollapsed && "mr-2")} />
                {!isCollapsed && item.name}
              </Button>
            </Link>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-gray-200">
        {!isCollapsed && (
          <div className="text-xs text-gray-500">
            <p>Khauuu Admin Panel</p>
            <p>Version 1.0.0</p>
          </div>
        )}
      </div>
    </div>
  )
}