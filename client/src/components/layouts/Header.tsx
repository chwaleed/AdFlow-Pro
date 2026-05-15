import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Menu, Megaphone, Sun, Moon, ChevronDown, LogOut, LayoutDashboard, UserCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { useAuthStore } from '@/stores/authStore'
import { useUIStore } from '@/stores/uiStore'
import api from '@/lib/api'
import { toast } from 'sonner'

const NAV_LINKS = [
  { label: 'Home', to: '/' },
  { label: 'Browse Ads', to: '/ads' },
  { label: 'Packages', to: '/packages' },
]

const ROLE_LABELS: Record<string, string> = {
  client: 'Client',
  moderator: 'Moderator',
  admin: 'Admin',
  super_admin: 'Super Admin',
}

const DASHBOARD_ROUTES: Record<string, string> = {
  client: '/dashboard',
  moderator: '/moderator',
  admin: '/admin',
  super_admin: '/admin',
}

function ThemeToggle() {
  const { theme, setTheme } = useUIStore()
  return (
    <Button
      variant="ghost"
      size="icon"
      className="h-9 w-9"
      onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
      aria-label="Toggle theme"
    >
      {theme === 'dark'
        ? <Sun className="h-4 w-4" />
        : <Moon className="h-4 w-4" />}
    </Button>
  )
}

function UserMenu() {
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()
  if (!user) return null

  const initials = user.name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
  const dashRoute = DASHBOARD_ROUTES[user.role] ?? '/dashboard'

  async function handleLogout() {
    try { await api.post('/auth/logout') } catch { /* ignore */ }
    logout()
    navigate('/')
    toast.success('Signed out successfully')
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="flex h-9 items-center gap-2 px-2">
          <Avatar className="h-7 w-7">
            <AvatarFallback className="bg-accent text-accent-foreground text-xs font-semibold">
              {initials}
            </AvatarFallback>
          </Avatar>
          <span className="hidden text-sm font-medium lg:block max-w-32 truncate">{user.name}</span>
          <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <div className="px-3 py-2.5">
          <p className="text-sm font-semibold truncate">{user.name}</p>
          <p className="text-xs text-muted-foreground truncate">{user.email}</p>
          <Badge variant="outline" className="mt-1.5 text-xs capitalize">
            {ROLE_LABELS[user.role] ?? user.role}
          </Badge>
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link to={dashRoute} className="cursor-pointer">
            <LayoutDashboard className="mr-2 h-4 w-4" />
            Dashboard
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link to="/profile" className="cursor-pointer">
            <UserCircle className="mr-2 h-4 w-4" />
            Profile
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={handleLogout}
          className="cursor-pointer text-destructive focus:text-destructive"
        >
          <LogOut className="mr-2 h-4 w-4" />
          Sign Out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export default function Header() {
  const { isAuthenticated } = useAuthStore()
  const location = useLocation()
  const [mobileOpen, setMobileOpen] = useState(false)

  function isActive(to: string) {
    return to === '/' ? location.pathname === '/' : location.pathname.startsWith(to)
  }

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">

        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 shrink-0">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary">
            <Megaphone className="h-4 w-4 text-primary-foreground" strokeWidth={2} />
          </div>
          <span className="font-heading text-lg font-semibold tracking-tight text-foreground">
            AdFlow<span className="text-accent">Pro</span>
          </span>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-0.5" aria-label="Main navigation">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className={`rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                isActive(link.to)
                  ? 'bg-muted text-foreground'
                  : 'text-foreground/65 hover:bg-muted hover:text-foreground'
              }`}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Desktop Actions */}
        <div className="hidden md:flex items-center gap-1">
          <ThemeToggle />
          {isAuthenticated ? (
            <UserMenu />
          ) : (
            <>
              <Button variant="ghost" size="sm" asChild>
                <Link to="/login">Sign In</Link>
              </Button>
              <Button
                size="sm"
                className="bg-accent hover:bg-accent/90 text-accent-foreground"
                asChild
              >
                <Link to="/register">Post an Ad</Link>
              </Button>
            </>
          )}
        </div>

        {/* Mobile Actions */}
        <div className="flex items-center gap-1 md:hidden">
          <ThemeToggle />
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="h-9 w-9" aria-label="Open menu">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-72 flex flex-col p-0">
              <div className="flex items-center gap-2 border-b border-border px-5 py-4">
                <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary">
                  <Megaphone className="h-4 w-4 text-primary-foreground" strokeWidth={2} />
                </div>
                <span className="font-heading text-lg font-semibold">
                  AdFlow<span className="text-accent">Pro</span>
                </span>
              </div>

              <nav className="flex flex-col gap-0.5 px-3 pt-4" aria-label="Mobile navigation">
                {NAV_LINKS.map((link) => (
                  <Link
                    key={link.to}
                    to={link.to}
                    className={`rounded-md px-3 py-3 text-sm font-medium transition-colors ${
                      isActive(link.to)
                        ? 'bg-muted text-foreground'
                        : 'text-foreground/65 hover:bg-muted hover:text-foreground'
                    }`}
                    onClick={() => setMobileOpen(false)}
                  >
                    {link.label}
                  </Link>
                ))}
              </nav>

              <div className="mt-auto border-t border-border px-4 py-4 flex flex-col gap-2">
                {isAuthenticated ? (
                  <UserMenu />
                ) : (
                  <>
                    <Button variant="outline" className="w-full" asChild>
                      <Link to="/login" onClick={() => setMobileOpen(false)}>Sign In</Link>
                    </Button>
                    <Button
                      className="w-full bg-accent hover:bg-accent/90 text-accent-foreground"
                      asChild
                    >
                      <Link to="/register" onClick={() => setMobileOpen(false)}>Post an Ad</Link>
                    </Button>
                  </>
                )}
              </div>
            </SheetContent>
          </Sheet>
        </div>

      </div>
    </header>
  )
}
