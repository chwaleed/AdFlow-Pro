import { Outlet } from 'react-router-dom'

export default function RootLayout() {
  return (
    <div className="min-h-dvh bg-background font-sans text-foreground antialiased">
      <Outlet />
    </div>
  )
}
