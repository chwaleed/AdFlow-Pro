import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Link, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'
import api from '@/lib/api'
import { useAuthStore, type AuthUser } from '@/stores/authStore'
import { Button } from '@/components/ui/button'

const schema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
})
type FormData = z.infer<typeof schema>

export default function RegisterPage() {
  const navigate = useNavigate()
  const setAuth = useAuthStore((s) => s.setAuth)

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  const onSubmit = async (values: FormData) => {
    try {
      const { data } = await api.post<{ data: { user: AuthUser; accessToken: string; refreshToken: string } }>(
        '/auth/register',
        values,
      )
      setAuth(data.data.user, data.data.accessToken, data.data.refreshToken)
      toast.success('Account created!')
      navigate('/dashboard')
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error ?? 'Registration failed'
      toast.error(msg)
    }
  }

  return (
    <div className="flex min-h-dvh items-center justify-center px-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="space-y-1 text-center">
          <h1 className="font-heading text-3xl font-semibold text-foreground">Create account</h1>
          <p className="text-sm text-muted-foreground">Start posting ads in minutes</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {(['name', 'email', 'password'] as const).map((field) => (
            <div key={field} className="space-y-1.5">
              <label htmlFor={field} className="text-sm font-medium capitalize text-foreground">
                {field} <span className="text-destructive">*</span>
              </label>
              <input
                id={field}
                type={field === 'password' ? 'password' : field === 'email' ? 'email' : 'text'}
                autoComplete={field === 'password' ? 'new-password' : field}
                placeholder={field === 'email' ? 'you@example.com' : field === 'password' ? '••••••••' : 'Your name'}
                {...register(field)}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring disabled:opacity-50"
              />
              {errors[field] && (
                <p role="alert" className="text-xs text-destructive">{errors[field]?.message}</p>
              )}
            </div>
          ))}

          <Button type="submit" disabled={isSubmitting} className="w-full">
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isSubmitting ? 'Creating account…' : 'Create account'}
          </Button>
        </form>

        <p className="text-center text-sm text-muted-foreground">
          Have an account?{' '}
          <Link to="/login" className="font-medium text-accent underline-offset-4 hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}
