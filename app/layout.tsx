import type { Metadata } from 'next'
import { Geist, Geist_Mono, Newsreader } from 'next/font/google'
import { Toaster } from '@/components/ui/sonner'
import { TimezoneSync } from '@/components/TimezoneSync'
import { ThemeProvider } from '@/components/theme-provider'
import './globals.css'

const geist = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
  display: 'swap',
})

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
  display: 'swap',
})

const newsreader = Newsreader({
  variable: '--font-newsreader',
  subsets: ['latin'],
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Semester Planner',
  description: 'Plan courses, deadlines and exams.',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="en"
      className={`${geist.variable} ${geistMono.variable} ${newsreader.variable} h-full`}
      suppressHydrationWarning
    >
      <body className="h-full">
        <ThemeProvider>
          <TimezoneSync />
          {children}
          <Toaster richColors position="top-right" />
        </ThemeProvider>
      </body>
    </html>
  )
}
