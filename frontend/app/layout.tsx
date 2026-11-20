import { Analytics } from '@vercel/analytics/next'
import type { Metadata, Viewport } from 'next'
import './globals.css'
import './operations.css'
import './portals.css'
import { PortalDevelopmentProvider } from '@/components/portals/development-data-provider'
import { AuthProvider } from '@/services/auth-context'

export const metadata: Metadata = {
  title: 'RADA Coffee | Control & Business',
  description: 'Separate internal platform operations and customer business intelligence portals for RADA Coffee.',
  generator: 'v0.app',
  icons: {
    icon: [
      {
        url: '/icon-light-32x32.png',
        media: '(prefers-color-scheme: light)',
      },
      {
        url: '/icon-dark-32x32.png',
        media: '(prefers-color-scheme: dark)',
      },
      {
        url: '/icon.svg',
        type: 'image/svg+xml',
      },
    ],
    apple: '/apple-icon.png',
  },
}

export const viewport: Viewport = {
  colorScheme: 'dark',
  themeColor: '#090D16',
  width: 'device-width',
  initialScale: 1,
  userScalable: true,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        <AuthProvider><PortalDevelopmentProvider>{children}</PortalDevelopmentProvider></AuthProvider>
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
