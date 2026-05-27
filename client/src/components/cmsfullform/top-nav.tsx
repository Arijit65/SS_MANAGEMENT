import { Menu, Search, Bell, Settings, User, ChevronDown, Home, LogOut } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ThemeToggle } from "../theme-toggle"
import { Link, useNavigate } from "react-router-dom"
import { useAppSelector, useAppDispatch } from "@/store/hooks"
import { logout, ROLE_DISPLAY_NAMES } from "@/store/slices/authSlice"

export default function TopNav() {
  const navigate = useNavigate()
  const dispatch = useAppDispatch()
  const user = useAppSelector((state) => state.auth.user)
  
  const handleLogout = () => {
    dispatch(logout())
    navigate('/auth/login')
  }
  
  const handleMenuToggle = () => {
    if (typeof window !== "undefined" && (window as any).toggleMenuState) {
      ;(window as any).toggleMenuState()
    }
  }

  const handleMobileMenuToggle = () => {
    if (typeof window !== "undefined" && (window as any).setIsMobileMenuOpen) {
      const currentState = (window as any).isMobileMenuOpen || false
      ;(window as any).setIsMobileMenuOpen(!currentState)
    }
  }

  return (
    <div className="flex items-center justify-between h-full px-4 lg:px-6">
      {/* Left side - Menu toggle and Breadcrumbs */}
      <div className="flex items-center space-x-4">
        {/* Desktop Menu Toggle */}
        <Button variant="ghost" size="sm" onClick={handleMenuToggle} className="hidden lg:flex p-2" title="Toggle Menu">
          <Menu className="h-4 w-4" />
        </Button>

        {/* Mobile Menu Toggle */}
        <Button
          variant="ghost"
          size="sm"
          onClick={handleMobileMenuToggle}
          className="lg:hidden p-2"
          title="Toggle Mobile Menu"
        >
          <Menu className="h-4 w-4" />
        </Button>

        {/* Breadcrumbs */}
        <nav className="hidden sm:flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-300">
          <Link to="/dashboard" className="flex items-center hover:text-[#1DA1F2]">
            <Home className="h-4 w-4 mr-1" />
            Dashboard
          </Link>
          <span>/</span>
          <span className="text-gray-900 dark:text-white font-medium">CMS</span>
        </nav>
      </div>

      {/* Center - Search (hidden on mobile) */}
      <div className="hidden md:flex flex-1 max-w-md mx-4">
        <div className="relative w-full">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            type="search"
            placeholder="Search..."
            className="pl-10 bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700"
          />
        </div>
      </div>

      {/* Right side - Actions and Profile */}
      <div className="flex items-center space-x-2">
        {/* Mobile Search */}
        <Button variant="ghost" size="sm" className="md:hidden p-2">
          <Search className="h-4 w-4" />
        </Button>

        {/* Theme Toggle */}
        <ThemeToggle />

        {/* Notifications */}
        <Button variant="ghost" size="sm" className="relative p-2">
          <Bell className="h-4 w-4" />
          <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs bg-[#1DA1F2] text-white">
            3
          </Badge>
        </Button>

        {/* Settings */}
        <Button variant="ghost" size="sm" className="p-2">
          <Settings className="h-4 w-4" />
        </Button>

        {/* Profile Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="flex items-center space-x-2 p-2">
              <Avatar className="h-8 w-8">
                <AvatarImage src="/placeholder.svg?height=32&width=32" alt={user?.fullName || 'User'} />
                <AvatarFallback className="bg-[#1DA1F2] text-white">
                  {user?.fullName?.split(' ').map(n => n[0]).join('').toUpperCase() || 'U'}
                </AvatarFallback>
              </Avatar>
              <div className="hidden lg:flex flex-col items-start">
                <span className="text-sm font-medium text-gray-900 dark:text-white">{user?.fullName || 'User'}</span>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {user?.role ? ROLE_DISPLAY_NAMES[user.role] : 'User'}
                </span>
              </div>
              <ChevronDown className="hidden lg:block h-4 w-4 text-gray-500" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>My Account</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => navigate('/profile')}>
              <User className="mr-2 h-4 w-4" />
              Profile
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate('/settings')}>
              <Settings className="mr-2 h-4 w-4" />
              Settings
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-[#1DA1F2]" onClick={handleLogout}>
              <LogOut className="mr-2 h-4 w-4" />
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  )
}
