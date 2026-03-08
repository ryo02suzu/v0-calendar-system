import type { Metadata, Viewport } from 'next'
// Fonts temporarily disabled - uncomment when deploying to production
// import { Geist, Geist_Mono } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { AuthProvider } from '@/components/auth-provider'
import { ServiceWorkerRegister } from '@/components/sw-register'
import './globals.css'

// const geist = Geist({ subsets: ["latin"] });
// const geistMono = Geist_Mono({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: 'Clinic Calendar System',
  description: 'A production-ready clinic calendar and reservation dashboard',
  icons: {
    icon: '/icon.svg',
  },
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: '歯科予約',
  },
}

export const viewport: Viewport = {
  themeColor: '#0f766e',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={`font-sans antialiased`}>
        <AuthProvider>
          {children}
        </AuthProvider>
        <ServiceWorkerRegister />
        <Analytics />
      </body>
    </html>
  )
}
