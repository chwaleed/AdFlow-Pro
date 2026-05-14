import { RouterProvider } from 'react-router-dom'
import { Toaster } from 'sonner'
import { useEffect } from 'react'
import router from '@/router'
import { useUIStore } from '@/stores/uiStore'

export default function App() {
  const theme = useUIStore((s) => s.theme)

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark')
  }, [theme])

  return (
    <>
      <RouterProvider router={router} />
      <Toaster position="top-right" richColors closeButton expand={false} />
    </>
  )
}
