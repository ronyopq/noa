import type { Metadata, Viewport } from 'next'
import '@/app/globals.css'
import ThemeWrapper from '@/components/ThemeWrapper'

export const metadata: Metadata = {
  title: {
    template: '%s | NOA Cafe',
    default: 'NOA Cafe — Restaurant',
  },
  description:
    'NOA Cafe রেস্টুরেন্ট — অনলাইন মেনু, কার্ট, WhatsApp অর্ডার ও পাবলিক গেম। স্টাফ মেনু, বিলিং, বাজার, বিজ্ঞাপন ও রিপোর্ট।',
  manifest: '/manifest.json',
  openGraph: {
    type: 'website',
    locale: 'bn_BD',
    siteName: 'NOA Cafe',
  },
}

export const viewport: Viewport = {
  themeColor: '#e65100',
  colorScheme: 'light',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="bn">
      <body>
        <ThemeWrapper>{children}</ThemeWrapper>
      </body>
    </html>
  )
}
