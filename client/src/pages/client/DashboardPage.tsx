import { useAuthStore } from '@/stores/authStore'

export default function DashboardPage() {
  const user = useAuthStore((s) => s.user)
  return (
    <div className="p-8">
      <h1 className="font-heading text-2xl font-semibold">Dashboard</h1>
      <p className="mt-1 text-muted-foreground">Welcome back, {user?.name}</p>
    </div>
  )
}
