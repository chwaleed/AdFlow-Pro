import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { UserCircle, Store, KeyRound, BadgeCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Separator } from '@/components/ui/separator'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { useAuthStore } from '@/stores/authStore'
import api from '@/lib/api'
import type { SellerProfile } from '@/lib/types'
import { toast } from 'sonner'

// ── Schemas ───────────────────────────────────────────────────────────────────

const profileSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(50),
})

const sellerSchema = z.object({
  display_name:  z.string().min(2).max(80).optional().or(z.literal('')),
  business_name: z.string().max(100).optional().or(z.literal('')),
  phone:         z.string().max(20).optional().or(z.literal('')),
  city:          z.string().max(60).optional().or(z.literal('')),
  bio:           z.string().max(500).optional().or(z.literal('')),
})

const passwordSchema = z.object({
  current_password: z.string().min(1, 'Current password is required'),
  new_password:     z.string().min(8, 'New password must be at least 8 characters'),
  confirm_password: z.string(),
}).refine((d) => d.new_password === d.confirm_password, {
  message: 'Passwords do not match',
  path: ['confirm_password'],
})

type ProfileValues  = z.infer<typeof profileSchema>
type SellerValues   = z.infer<typeof sellerSchema>
type PasswordValues = z.infer<typeof passwordSchema>

const ROLE_LABELS: Record<string, string> = {
  client: 'Client',
  moderator: 'Moderator',
  admin: 'Admin',
  super_admin: 'Super Admin',
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function ProfilePage() {
  const { user, setUser } = useAuthStore()
  const [sellerProfile, setSellerProfile] = useState<SellerProfile | null>(null)
  const [loadingProfile, setLoadingProfile] = useState(true)

  const profileForm = useForm<ProfileValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: { name: user?.name ?? '' },
  })

  const sellerForm = useForm<SellerValues>({
    resolver: zodResolver(sellerSchema),
    defaultValues: { display_name: '', business_name: '', phone: '', city: '', bio: '' },
  })

  const passwordForm = useForm<PasswordValues>({
    resolver: zodResolver(passwordSchema),
    defaultValues: { current_password: '', new_password: '', confirm_password: '' },
  })

  useEffect(() => {
    async function load() {
      try {
        const res = await api.get<{ ok: boolean; data: { profile: SellerProfile } }>('/client/profile')
        const sp = res.data.data?.profile
        setSellerProfile(sp)
        if (sp) {
          sellerForm.reset({
            display_name:  sp.display_name ?? '',
            business_name: sp.business_name ?? '',
            phone:         sp.phone ?? '',
            city:          sp.city ?? '',
            bio:           sp.bio ?? '',
          })
        }
      } catch {
        // profile endpoint not yet built — silently ignore
      } finally {
        setLoadingProfile(false)
      }
    }
    load()
  }, [sellerForm])

  async function onProfileSave(values: ProfileValues) {
    try {
      const res = await api.patch<{ ok: boolean; data: { user: typeof user } }>('/client/profile/user', values)
      if (res.data.data?.user) setUser(res.data.data.user)
      toast.success('Profile updated')
    } catch {
      toast.error('Failed to update profile')
    }
  }

  async function onSellerSave(values: SellerValues) {
    try {
      await api.patch('/client/profile/seller', values)
      toast.success('Seller profile updated')
    } catch {
      toast.error('Failed to update seller profile')
    }
  }

  async function onPasswordChange(values: PasswordValues) {
    try {
      await api.patch('/client/profile/password', {
        current_password: values.current_password,
        new_password: values.new_password,
      })
      passwordForm.reset()
      toast.success('Password changed successfully')
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } }).response?.data?.error
      toast.error(msg ?? 'Failed to change password')
    }
  }

  const initials = user?.name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2) ?? '?'

  return (
    <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6">
      <h1 className="font-heading mb-8 text-2xl font-bold text-foreground">My Profile</h1>

      {/* ── Account Info ── */}
      <Card className="mb-6">
        <CardHeader className="flex flex-row items-center gap-4 pb-2">
          <Avatar className="h-14 w-14">
            <AvatarFallback className="bg-accent text-accent-foreground text-lg font-bold">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div>
            <div className="flex items-center gap-2">
              <p className="font-heading text-lg font-semibold text-foreground">{user?.name}</p>
              {sellerProfile?.is_verified && (
                <BadgeCheck className="h-4 w-4 text-accent" />
              )}
            </div>
            <p className="text-sm text-muted-foreground">{user?.email}</p>
            <Badge variant="outline" className="mt-1 text-xs">
              {ROLE_LABELS[user?.role ?? ''] ?? user?.role}
            </Badge>
          </div>
        </CardHeader>
      </Card>

      {/* ── Basic Info ── */}
      <Card className="mb-6">
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2">
            <UserCircle className="h-4 w-4 text-muted-foreground" />
            <h2 className="font-heading text-sm font-semibold text-foreground">Basic Information</h2>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={profileForm.handleSubmit(onProfileSave)} className="space-y-4">
            <div>
              <Label htmlFor="name">Full Name</Label>
              <Input id="name" className="mt-1.5" {...profileForm.register('name')} />
              {profileForm.formState.errors.name && (
                <p className="mt-1 text-xs text-destructive">{profileForm.formState.errors.name.message}</p>
              )}
            </div>
            <div>
              <Label>Email Address</Label>
              <Input value={user?.email ?? ''} disabled className="mt-1.5 bg-muted/50 cursor-not-allowed" />
              <p className="mt-1 text-xs text-muted-foreground">Email cannot be changed.</p>
            </div>
            <Button type="submit" size="sm" disabled={profileForm.formState.isSubmitting}>
              {profileForm.formState.isSubmitting ? 'Saving...' : 'Save Changes'}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* ── Seller Profile ── */}
      <Card className="mb-6">
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2">
            <Store className="h-4 w-4 text-muted-foreground" />
            <h2 className="font-heading text-sm font-semibold text-foreground">Seller Profile</h2>
          </div>
        </CardHeader>
        <CardContent>
          {loadingProfile ? (
            <div className="space-y-3">
              <Skeleton className="h-9 w-full" />
              <Skeleton className="h-9 w-full" />
              <Skeleton className="h-20 w-full" />
            </div>
          ) : (
            <form onSubmit={sellerForm.handleSubmit(onSellerSave)} className="space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <Label htmlFor="display_name">Display Name</Label>
                  <Input id="display_name" placeholder="Your name on listings" className="mt-1.5" {...sellerForm.register('display_name')} />
                </div>
                <div>
                  <Label htmlFor="business_name">Business Name</Label>
                  <Input id="business_name" placeholder="Optional" className="mt-1.5" {...sellerForm.register('business_name')} />
                </div>
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <Label htmlFor="sp_phone">Phone / WhatsApp</Label>
                  <Input id="sp_phone" placeholder="03001234567" className="mt-1.5" {...sellerForm.register('phone')} />
                </div>
                <div>
                  <Label htmlFor="sp_city">City</Label>
                  <Input id="sp_city" placeholder="e.g. Karachi" className="mt-1.5" {...sellerForm.register('city')} />
                </div>
              </div>
              <div>
                <Label htmlFor="bio">Bio</Label>
                <Textarea
                  id="bio"
                  rows={3}
                  placeholder="A short description about you or your business..."
                  className="mt-1.5 resize-none"
                  {...sellerForm.register('bio')}
                />
                <p className="mt-1 text-xs text-muted-foreground">Max 500 characters</p>
              </div>
              <Button type="submit" size="sm" disabled={sellerForm.formState.isSubmitting}>
                {sellerForm.formState.isSubmitting ? 'Saving...' : 'Save Seller Profile'}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>

      {/* ── Change Password ── */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2">
            <KeyRound className="h-4 w-4 text-muted-foreground" />
            <h2 className="font-heading text-sm font-semibold text-foreground">Change Password</h2>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={passwordForm.handleSubmit(onPasswordChange)} className="space-y-4">
            <div>
              <Label htmlFor="current_password">Current Password</Label>
              <Input id="current_password" type="password" className="mt-1.5" {...passwordForm.register('current_password')} />
            </div>
            <Separator />
            <div>
              <Label htmlFor="new_password">New Password</Label>
              <Input id="new_password" type="password" className="mt-1.5" {...passwordForm.register('new_password')} />
              {passwordForm.formState.errors.new_password && (
                <p className="mt-1 text-xs text-destructive">{passwordForm.formState.errors.new_password.message}</p>
              )}
            </div>
            <div>
              <Label htmlFor="confirm_password">Confirm New Password</Label>
              <Input id="confirm_password" type="password" className="mt-1.5" {...passwordForm.register('confirm_password')} />
              {passwordForm.formState.errors.confirm_password && (
                <p className="mt-1 text-xs text-destructive">{passwordForm.formState.errors.confirm_password.message}</p>
              )}
            </div>
            <Button type="submit" size="sm" variant="outline" disabled={passwordForm.formState.isSubmitting}>
              {passwordForm.formState.isSubmitting ? 'Changing...' : 'Change Password'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
