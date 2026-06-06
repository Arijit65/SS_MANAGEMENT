import type React from "react"
import {
  Receipt,
  CreditCard,
  Folder,
  Wallet,
  Users2,
  Shield,
  MessagesSquare,
  Video,
  Settings,
  HelpCircle,
  ChevronDown,
  Home,
  Package,
  FileText,
  Database,
  Globe,
  Mail,
  Calendar,
  ImageIcon,
  Zap,
  Code,
  Layers,
  Monitor,
  TrendingUp,
  Activity,
  DollarSign,
  TrendingDown,
  Puzzle,
  Table2,
  LayoutList,
  Lock,
  Key,
  Eye,
  Bell,
  Camera,
  Headphones,
  Play,
  Bookmark,
  Tag,
  Search,
  Map,
  Clock,
  Download,
  Upload,
  Edit,
  Plus,
  Minus,
} from "lucide-react"
import { Link } from "react-router-dom"
import { useState, useEffect } from "react"
import { cn } from "@/lib/utils"
import { useAppDispatch, useAppSelector } from "@/store/hooks"
import { fetchCustomTables } from "@/store/slices/customTablesSlice"
import { hasTablePermission } from "@/store/slices/authSlice"

type MenuState = "full" | "collapsed" | "hidden"

interface SubMenuItem {
  id: string
  label: string
  href: string
  icon?: React.ComponentType<any>
  badge?: string
  isNew?: boolean
  children?: SubMenuItem[]
}

interface MenuItem {
  id: string
  label: string
  href?: string
  icon: React.ComponentType<any>
  badge?: string
  isNew?: boolean
  children?: SubMenuItem[]
}

interface MenuSection {
  id: string
  label: string
  items: MenuItem[]
}

const menuData: MenuSection[] = [
  {
    id: "overview",
    label: "Overview",
    items: [
      {
        id: "dashboard",
        label: "Dashboard",
        href: "/dashboard",
        icon: Home,
        badge: "3",
        children: [
          {
            id: "analytics",
            label: "Analytics",
            href: "/dashboard/analytics",
            icon: Activity,
          },
          {
            id: "reports",
            label: "Reports",
            href: "/dashboard/reports",
            icon: FileText,
            children: [
              {
                id: "sales-reports",
                label: "Sales Reports",
                href: "/dashboard/reports/sales",
                icon: TrendingUp,
              },
              {
                id: "user-reports",
                label: "User Reports",
                href: "/dashboard/reports/users",
                icon: Users2,
              },
              {
                id: "financial-reports",
                label: "Financial Reports",
                href: "/dashboard/reports/financial",
                icon: DollarSign,
              },
            ],
          },
          {
            id: "real-time",
            label: "Real-time",
            href: "/dashboard/realtime",
            icon: Activity,
            isNew: true,
          },
        ],
      },
      {
        id: "projects",
        label: "Projects",
        href: "/projects",
        icon: Folder,
        badge: "12",
        children: [
          {
            id: "projects-dashboard",
            label: "Dashboard",
            href: "/projects",
            icon: Home,
          },
          {
            id: "projects-list",
            label: "All Projects",
            href: "/projects/list",
            icon: LayoutList,
          },
          {
            id: "projects-calendar",
            label: "Calendar",
            href: "/projects/calendar",
            icon: Calendar,
          },
          {
            id: "projects-timeline",
            label: "Timeline",
            href: "/projects/timeline",
            icon: Activity,
          },
        ],
      },
      {
        id: "data-tables",
        label: "All Tables",
        href: "/data-tables",
        icon: Table2,
      },
    ],
  },
  {
    id: "finance",
    label: "Finance",
    items: [
      {
        id: "transactions",
        label: "Transactions",
        href: "/transactions",
        icon: Wallet,
        children: [
          {
            id: "all-transactions",
            label: "All Transactions",
            href: "/transactions/all",
            icon: Wallet,
          },
          {
            id: "income",
            label: "Income",
            href: "/transactions/income",
            icon: TrendingUp,
          },
          {
            id: "expenses",
            label: "Expenses",
            href: "/transactions/expenses",
            icon: TrendingDown,
          },
        ],
      },
      {
        id: "invoices",
        label: "Invoices",
        href: "/invoices",
        icon: Receipt,
        badge: "2",
      },
      {
        id: "payments",
        label: "Payments",
        href: "/payments",
        icon: CreditCard,
        children: [
          {
            id: "payment-methods",
            label: "Payment Methods",
            href: "/payments/methods",
            icon: CreditCard,
          },
          {
            id: "payment-history",
            label: "Payment History",
            href: "/payments/history",
            icon: Clock,
          },
          {
            id: "refunds",
            label: "Refunds",
            href: "/payments/refunds",
            icon: Minus,
          },
        ],
      },
    ],
  },
  {
    id: "content",
    label: "Content Management",
    items: [
      {
        id: "pages",
        label: "Pages",
        href: "/pages",
        icon: FileText,
        children: [
          {
            id: "all-pages",
            label: "All Pages",
            href: "/pages/all",
            icon: FileText,
          },
          {
            id: "blog",
            label: "Blog",
            href: "/pages/blog",
            icon: Edit,
            children: [
              {
                id: "posts",
                label: "Posts",
                href: "/pages/blog/posts",
                icon: FileText,
              },
              {
                id: "categories",
                label: "Categories",
                href: "/pages/blog/categories",
                icon: Tag,
              },
              {
                id: "tags",
                label: "Tags",
                href: "/pages/blog/tags",
                icon: Bookmark,
              },
            ],
          },
          {
            id: "landing-pages",
            label: "Landing Pages",
            href: "/pages/landing",
            icon: Globe,
          },
        ],
      },
      {
        id: "media",
        label: "Media",
        href: "/media",
        icon: ImageIcon,
        children: [
          {
            id: "images",
            label: "Images",
            href: "/media/images",
            icon: ImageIcon,
          },
          {
            id: "videos",
            label: "Videos",
            href: "/media/videos",
            icon: Play,
          },
          {
            id: "audio",
            label: "Audio",
            href: "/media/audio",
            icon: Headphones,
          },
          {
            id: "documents",
            label: "Documents",
            href: "/media/documents",
            icon: FileText,
          },
        ],
      },
      {
        id: "seo",
        label: "SEO",
        href: "/seo",
        icon: Search,
        isNew: true,
        children: [
          {
            id: "keywords",
            label: "Keywords",
            href: "/seo/keywords",
            icon: Search,
          },
          {
            id: "meta-tags",
            label: "Meta Tags",
            href: "/seo/meta-tags",
            icon: Tag,
          },
          {
            id: "sitemap",
            label: "Sitemap",
            href: "/seo/sitemap",
            icon: Map,
          },
        ],
      },
    ],
  },
  {
    id: "team",
    label: "Team & Communication",
    items: [
      {
        id: "members",
        label: "Members",
        href: "/members",
        icon: Users2,
        children: [
          {
            id: "all-members",
            label: "All Members",
            href: "/members/all",
            icon: Users2,
          },
          {
            id: "roles",
            label: "Roles",
            href: "/members/roles",
            icon: Shield,
            children: [
              {
                id: "admin",
                label: "Administrators",
                href: "/members/roles/admin",
                icon: Shield,
              },
              {
                id: "editor",
                label: "Editors",
                href: "/members/roles/editor",
                icon: Edit,
              },
              {
                id: "viewer",
                label: "Viewers",
                href: "/members/roles/viewer",
                icon: Eye,
              },
            ],
          },
          {
            id: "permissions",
            label: "Permissions",
            href: "/members/permissions",
            icon: Lock,
          },
        ],
      },
      {
        id: "chat",
        label: "Chat",
        href: "/chat",
        icon: MessagesSquare,
        badge: "12",
        children: [
          {
            id: "channels",
            label: "Channels",
            href: "/chat/channels",
            icon: MessagesSquare,
          },
          {
            id: "direct-messages",
            label: "Direct Messages",
            href: "/chat/dm",
            icon: Mail,
          },
          {
            id: "notifications",
            label: "Notifications",
            href: "/chat/notifications",
            icon: Bell,
          },
        ],
      },
      {
        id: "meetings",
        label: "Meetings",
        href: "/meetings",
        icon: Video,
        children: [
          {
            id: "scheduled",
            label: "Scheduled",
            href: "/meetings/scheduled",
            icon: Calendar,
          },
          {
            id: "recordings",
            label: "Recordings",
            href: "/meetings/recordings",
            icon: Camera,
          },
          {
            id: "rooms",
            label: "Meeting Rooms",
            href: "/meetings/rooms",
            icon: Monitor,
          },
        ],
      },
    ],
  },
  {
    id: "tools",
    label: "Tools & Utilities",
    items: [
      {
        id: "custom-tables",
        label: "Custom Tables",
        href: "/admin/tables",
        icon: Table2,
        isNew: true,
      },
      {
        id: "user-management",
        label: "User Management",
        href: "/admin/users",
        icon: Users2,
      },
      {
        id: "plugins",
        label: "Plugins",
        href: "/plugins",
        icon: Puzzle,
        badge: "8",
        children: [
          {
            id: "installed",
            label: "Plugins đã cài",
            href: "/plugins",
            icon: Package,
          },
          {
            id: "add-new",
            label: "Thêm mới",
            href: "/plugins",
            icon: Plus,
          },
        ],
      },
      {
        id: "api",
        label: "API",
        href: "/api",
        icon: Code,
        children: [
          {
            id: "documentation",
            label: "Documentation",
            href: "/api/docs",
            icon: FileText,
          },
          {
            id: "keys",
            label: "API Keys",
            href: "/api/keys",
            icon: Key,
          },
          {
            id: "webhooks",
            label: "Webhooks",
            href: "/api/webhooks",
            icon: Zap,
          },
        ],
      },
      {
        id: "integrations",
        label: "Integrations",
        href: "/integrations",
        icon: Layers,
        children: [
          {
            id: "third-party",
            label: "Third Party",
            href: "/integrations/third-party",
            icon: Globe,
          },
          {
            id: "plugins",
            label: "Plugins",
            href: "/integrations/plugins",
            icon: Plus,
          },
          {
            id: "extensions",
            label: "Extensions",
            href: "/integrations/extensions",
            icon: Zap,
          },
        ],
      },
      {
        id: "backup",
        label: "Backup & Restore",
        href: "/backup",
        icon: Database,
        children: [
          {
            id: "create-backup",
            label: "Create Backup",
            href: "/backup/create",
            icon: Download,
          },
          {
            id: "restore",
            label: "Restore",
            href: "/backup/restore",
            icon: Upload,
          },
          {
            id: "schedule",
            label: "Schedule",
            href: "/backup/schedule",
            icon: Clock,
          },
        ],
      },
    ],
  },
]

export default function Sidebar() {
  const dispatch = useAppDispatch()
  const { tables: customTables } = useAppSelector((state) => state.customTables)
  const user = useAppSelector((state) => state.auth.user)
  const isAdmin = user?.role === 'admin'

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [menuState, setMenuState] = useState<MenuState>("full")
  const [isHovered, setIsHovered] = useState(false)
  const [previousDesktopState, setPreviousDesktopState] = useState<MenuState>("full")
  const [isMobile, setIsMobile] = useState(false)
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set())

  // Fetch custom tables on mount
  useEffect(() => {
    dispatch(fetchCustomTables())
  }, [dispatch])

  // Build dynamic menu data with custom tables
  let dynamicMenuData = [...menuData]

  // Filter system table items based on user permissions
  if (!isAdmin && user) {
    dynamicMenuData = dynamicMenuData.map((section) => {
      if (section.id === 'overview') {
        return {
          ...section,
          items: section.items.filter((item) => {
            // Filter onboarding, smo, website based on permissions
            if (item.id === 'onboarding') {
              return hasTablePermission(user, 'onboarding_cdr', 'canView')
            }
            if (item.id === 'smo') {
              return hasTablePermission(user, 'smodb_cdr', 'canView')
            }
            if (item.id === 'website') {
              return hasTablePermission(user, 'websitedb', 'canView')
            }
            return true
          }),
        }
      }
      return section
    })
  }

  // Add custom tables as a section if there are any active tables the user can access
  const activeCustomTables = customTables.filter((t) => {
    if (t.is_archived || !t.is_active) return false
    // Admin can see all, non-admin must have permission
    if (isAdmin) return true
    return hasTablePermission(user, t.name, 'canView')
  })

  if (activeCustomTables.length > 0) {
    // Icon mapping for custom tables
    const iconMap: Record<string, React.ComponentType<any>> = {
      FileText,
      Database,
      Table2,
      LayoutList,
    }

    const customTablesSection: MenuSection = {
      id: "custom-data",
      label: "Custom Data",
      items: activeCustomTables.map((table) => ({
        id: `custom-${table.name}`,
        label: table.display_name,
        href: `/custom/${table.name}`,
        icon: iconMap[table.icon] || FileText,
        children: [
          {
            id: `custom-${table.name}-list`,
            label: `${table.display_name} List`,
            href: `/custom/${table.name}/list`,
            icon: LayoutList,
          },
          {
            id: `custom-${table.name}-form`,
            label: `New ${table.display_name}`,
            href: `/custom/${table.name}/form`,
            icon: Plus,
          },
        ],
      })),
    }

    // Insert after Overview section (index 0)
    dynamicMenuData.splice(1, 0, customTablesSection)
  }

  // Cycle through menu states: full -> collapsed -> hidden -> full
  const toggleMenuState = () => {
    setMenuState((prev) => {
      switch (prev) {
        case "full":
          return "collapsed"
        case "collapsed":
          return "hidden"
        case "hidden":
          return "full"
        default:
          return "full"
      }
    })
  }

  // Function to set menu state from theme customizer
  const setMenuStateFromCustomizer = (state: MenuState) => {
    if (!isMobile) {
      setMenuState(state)
    }
  }

  // Handle responsive behavior
  useEffect(() => {
    const handleResize = () => {
      const isDesktop = window.innerWidth >= 1024 // lg breakpoint
      setIsMobile(!isDesktop)

      if (!isDesktop) {
        // On mobile/tablet, save current desktop state and set to hidden
        if (menuState !== "hidden") {
          setPreviousDesktopState(menuState)
          setMenuState("hidden")
        }
      } else {
        // On desktop, restore previous state if coming from mobile
        if (menuState === "hidden" && previousDesktopState !== "hidden") {
          setMenuState(previousDesktopState)
        }
      }
    }

    // Check on mount
    handleResize()

    // Add event listener
    window.addEventListener("resize", handleResize)

    return () => window.removeEventListener("resize", handleResize)
  }, [menuState, previousDesktopState])

  // Export functions to window for TopNav and ThemeCustomizer to access
  useEffect(() => {
    if (typeof window !== "undefined") {
      ;(window as any).toggleMenuState = toggleMenuState
      ;(window as any).menuState = menuState
      ;(window as any).isHovered = isHovered
      ;(window as any).isMobile = isMobile
      ;(window as any).setIsMobileMenuOpen = setIsMobileMenuOpen
      ;(window as any).isMobileMenuOpen = isMobileMenuOpen
      ;(window as any).setMenuStateFromCustomizer = setMenuStateFromCustomizer
    }
  }, [menuState, isHovered, isMobile, isMobileMenuOpen])

  function handleNavigation() {
    if (isMobile) {
      setIsMobileMenuOpen(false)
    }
  }

  const toggleExpanded = (itemId: string) => {
    setExpandedItems((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(itemId)) {
        newSet.delete(itemId)
      } else {
        newSet.add(itemId)
      }
      return newSet
    })
  }

  function NavItem({
    item,
    level = 0,
    parentId = "",
  }: {
    item: MenuItem | SubMenuItem
    level?: number
    parentId?: string
  }) {
    const itemId = `${parentId}-${item.id}`
    const isExpanded = expandedItems.has(itemId)
    const hasChildren = item.children && item.children.length > 0
    const showText = menuState === "full" || (menuState === "collapsed" && isHovered) || (isMobile && isMobileMenuOpen)
    const showExpandIcon = hasChildren && showText

    const paddingLeft = level === 0 ? "px-3" : level === 1 ? "pl-8 pr-3" : "pl-12 pr-3"
    
    const ItemIcon = item.icon || FileText

    const content = (
      <div
        className={cn(
          "flex items-center py-2 text-sm rounded-md transition-colors sidebar-menu-item hover:bg-gray-50 dark:hover:bg-[#1F1F23] relative group cursor-pointer",
          paddingLeft,
        )}
        onClick={() => {
          if (hasChildren) {
            toggleExpanded(itemId)
          } else if (item.href) {
            // Navigate to the href
            window.location.href = item.href
            handleNavigation()
          }
        }}
        title={menuState === "collapsed" && !isHovered && !isMobile ? item.label : undefined}
      >
        <ItemIcon className="h-4 w-4 flex-shrink-0 sidebar-menu-icon" />

        {showText && (
          <>
            <span className="ml-3 flex-1 transition-opacity duration-200 sidebar-menu-text">{item.label}</span>

            {/* Badges and indicators */}
            <div className="flex items-center space-x-1">
              {item.isNew && (
                <span className="px-1.5 py-0.5 text-xs bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 rounded-full">
                  New
                </span>
              )}
              {item.badge && (
                <span className="px-1.5 py-0.5 text-xs bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 rounded-full">
                  {item.badge}
                </span>
              )}
              {showExpandIcon && (
                <ChevronDown
                  className={cn("h-3 w-3 transition-transform duration-200", isExpanded ? "rotate-180" : "rotate-0")}
                />
              )}
            </div>
          </>
        )}

        {/* Tooltip for collapsed state when not hovered and not mobile */}
        {menuState === "collapsed" && !isHovered && !isMobile && (
          <div className="absolute left-full ml-2 px-2 py-1 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50">
            {item.label}
            {item.badge && <span className="ml-1 text-blue-300">({item.badge})</span>}
          </div>
        )}
      </div>
    )

    return (
      <div>
        {item.href && !hasChildren ? <Link to={item.href}>{content}</Link> : content}
        {hasChildren && isExpanded && showText && (
          <div className="mt-1 space-y-1">
            {item.children!.map((child) => (
              <NavItem key={child.id} item={child} level={level + 1} parentId={itemId} />
            ))}
          </div>
        )}
      </div>
    )
  }

  // Calculate sidebar width - expand when collapsed and hovered, or full width on mobile
  const getSidebarWidth = () => {
    if (isMobile) {
      return "w-64" // Always full width on mobile
    }
    if (menuState === "collapsed" && isHovered) {
      return "w-64" // Expand to full width when hovered
    }
    return menuState === "collapsed" ? "w-16" : "w-64"
  }

  // Show text if menu is full OR if collapsed and hovered OR on mobile
  const showText = menuState === "full" || (menuState === "collapsed" && isHovered) || (isMobile && isMobileMenuOpen)

  // On mobile, show sidebar as overlay when isMobileMenuOpen is true
  if (isMobile) {
    return (
      <>
        {/* Mobile sidebar overlay */}
        <nav
          className={`
            fixed inset-y-0 left-0 z-[70] w-64 bg-white dark:bg-[#0F0F12] 
            border-r border-gray-200 dark:border-[#1F1F23] 
            transform transition-transform duration-300 ease-in-out
            ${isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"}
          `}
        >
          <div className="h-full flex flex-col">
            {/* Header */}
            <div className="h-16 px-3 flex items-center border-b border-gray-200 dark:border-[#1F1F23]">
              <Link
                to="/"
                className="flex items-center gap-3 w-full"
              >
                <img
                  src="/rlogo.png"
                  alt="Smritisudha Admin"
                  width={32}
                  height={32}
                  className="flex-shrink-0"
                />
                <span className="text-lg font-semibold hover:cursor-pointer text-[#1DA1F2]">
                  Smritisudha Admin
                </span>
              </Link>
            </div>

            <div
              className="flex-1 overflow-y-auto overflow-x-hidden py-4 px-2 scrollbar-none"
              style={{
                scrollbarWidth: "none" /* Firefox */,
                msOverflowStyle: "none" /* IE and Edge */,
              }}
            >
              <div className="space-y-6">
                {dynamicMenuData.map((section) => (
                  <div key={section.id} className="relative">
                    <div className="px-3 mb-2 text-xs font-semibold uppercase tracking-wider sidebar-section-label">
                      {section.label}
                    </div>
                    <div className="space-y-1">
                      {section.items.map((item) => (
                        <NavItem key={item.id} item={item} parentId={section.id} />
                      ))}
                    </div>
                    
                    {/* Admin-only overlay for Tools & Utilities section */}
                    {section.id === 'tools' && !isAdmin && (
                      <div className="absolute inset-0 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm rounded-md flex items-center justify-center z-10">
                        <div className="text-center px-4">
                          <Lock className="h-5 w-5 mx-auto mb-2 text-gray-600 dark:text-gray-400" />
                          <p className="text-xs font-medium text-gray-700 dark:text-gray-300">
                            Admin access only
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="px-2 py-4 border-t border-gray-200 dark:border-[#1F1F23]">
              <div className="space-y-1">
                <NavItem item={{ id: "settings", label: "Settings", href: "/settings", icon: Settings }} />
                <NavItem item={{ id: "help", label: "Help", href: "/help", icon: HelpCircle }} />
              </div>
            </div>
          </div>
        </nav>

        {/* Mobile overlay backdrop */}
        {isMobileMenuOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-[65]" onClick={() => setIsMobileMenuOpen(false)} />
        )}
      </>
    )
  }

  // Desktop sidebar
  return (
    <nav
      className={`
        fixed inset-y-0 left-0 z-[60] bg-white dark:bg-[#0F0F12] 
        border-r border-gray-200 dark:border-[#1F1F23] transition-all duration-300 ease-in-out
        ${menuState === "hidden" ? "w-0 border-r-0" : getSidebarWidth()}
      `}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        overflow: menuState === "hidden" ? "hidden" : "visible",
      }}
    >
      {menuState !== "hidden" && (
        <div className="h-full flex flex-col">
          {/* Header */}
          <div className="h-16 px-3 flex items-center border-b border-gray-200 dark:border-[#1F1F23]">
            {showText ? (
              <Link
                to="/"
                className="flex items-center gap-3 w-full"
              >
                <img
                  src="/rlogo.png"
                  alt="Smritisudha Admin"
                  width={32}
                  height={32}
                  className="flex-shrink-0 hidden dark:block"
                />
                <img
                  src="/rlogo.png"
                  alt="Smritisudha Admin"
                  width={32}
                  height={32}
                  className="flex-shrink-0 block dark:hidden"
                />
                <span className="text-lg font-semibold hover:cursor-pointer text-[#1DA1F2] transition-opacity duration-200">
                  Smritisudha Admin
                </span>
              </Link>
            ) : (
              <div className="flex justify-center w-full">
                <img
                  src="/rlogo.png"
                  alt="Smritisudha Admin"
                  width={32}
                  height={32}
                  className="flex-shrink-0 hidden dark:block"
                />
                <img
                  src="/rlogo.png"
                  alt="Smritisudha Admin"
                  width={32}
                  height={32}
                  className="flex-shrink-0 block dark:hidden"
                />
              </div>
            )}
          </div>

          <div
            className="flex-1 overflow-y-auto overflow-x-hidden py-4 px-2 scrollbar-none"
            style={{
              scrollbarWidth: "none" /* Firefox */,
              msOverflowStyle: "none" /* IE and Edge */,
            }}
          >
            <div className="space-y-6">
              {dynamicMenuData.map((section) => (
                <div key={section.id} className="relative">
                  {showText && (
                    <div className="px-3 mb-2 text-xs font-semibold uppercase tracking-wider sidebar-section-label transition-opacity duration-200">
                      {section.label}
                    </div>
                  )}
                  <div className="space-y-1">
                    {section.items.map((item) => (
                      <NavItem key={item.id} item={item} parentId={section.id} />
                    ))}
                  </div>
                  
                  {/* Admin-only overlay for Tools & Utilities section */}
                  {section.id === 'tools' && !isAdmin && (
                    <div className="absolute inset-0 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm rounded-md flex items-center justify-center z-10">
                      <div className="text-center px-4">
                        <Lock className="h-5 w-5 mx-auto mb-2 text-gray-600 dark:text-gray-400" />
                        <p className="text-xs font-medium text-gray-700 dark:text-gray-300">
                          Admin access only
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="px-2 py-4 border-t border-gray-200 dark:border-[#1F1F23]">
            <div className="space-y-1">
              <NavItem item={{ id: "settings", label: "Settings", href: "/settings", icon: Settings }} />
              <NavItem item={{ id: "help", label: "Help", href: "/help", icon: HelpCircle }} />
            </div>
          </div>
        </div>
      )}
    </nav>
  )
}
