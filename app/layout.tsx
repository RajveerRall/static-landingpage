import { Inter } from 'next/font/google'
import './globals.css'
import Header from '@/components/header'
import Footer from '@/components/footer'
import Background from '@/components/Background'
import { Metadata } from 'next'
import GoogleAnalytics from '@/components/GoogleAnalytics'
import { generateViewport } from './viewport'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: {
    default: 'NeverWrite - Turn Screen Recordings into Professional Documentation',
    template: '%s | NeverWrite'
  },
  description: 'NeverWrite uses AI to transform your screen recordings into high-quality documentation, GIFs, and tutorials. Streamline your content creation process today!',
  keywords: ['screen recording', 'documentation', 'AI', 'tutorials', 'GIFs', 'product documentation'],
  authors: [{ name: 'NeverWrite Team' }],
  creator: 'NeverWrite',
  publisher: 'NeverWrite',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  icons: {
    icon: 'https://neverwrite-assets.s3.ap-south-1.amazonaws.com/favicon.ico',
    shortcut: 'https://neverwrite-assets.s3.ap-south-1.amazonaws.com/favicon.ico',
    apple: 'https://neverwrite-assets.s3.ap-south-1.amazonaws.com/favicon.ico',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://neverwrite.in',
    siteName: 'NeverWrite',
    title: 'NeverWrite - AI-Powered Screen Recording Documentation',
    description: 'Transform your screen recordings into professional documentation with NeverWrite. Powered by AI for efficiency and quality.',
    images: [
      {
        url: 'https://neverwrite.in/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'NeverWrite - AI Documentation Tool',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'NeverWrite - AI-Powered Screen Recording Documentation',
    description: 'Transform your screen recordings into professional documentation with NeverWrite. Powered by AI for efficiency and quality.',
    images: ['https://neverwrite.in/twitter-image.jpg'],
    creator: '@neverwrite',
  },
}

export const viewport = generateViewport

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Background />
        <div className="relative z-10 bg-transparent">
          <Header />
          <main>{children}</main>
          <Footer />
        </div>
        <GoogleAnalytics GA_MEASUREMENT_ID="G-7MYQTHYZEE" />
      </body>
    </html>
  )
}





// import { Inter } from 'next/font/google'
// import './globals.css'
// import Header from '@/components/header'
// import Footer from '@/components/footer'
// import Background from '@/components/Background'
// import { Metadata } from 'next'
// import GoogleAnalytics from '@/components/GoogleAnalytics'

// const inter = Inter({ subsets: ['latin'] })

// export const metadata: Metadata = {
  // title: {
    // default: 'NeverWrite - Turn Screen Recordings into Professional Documentation',
    // template: '%s | NeverWrite'
  // },
  // description: 'NeverWrite uses AI to transform your screen recordings into high-quality documentation, GIFs, and tutorials. Streamline your content creation process today!',
  // keywords: ['screen recording', 'documentation', 'AI', 'tutorials', 'GIFs', 'product documentation'],
  // authors: [{ name: 'NeverWrite Team' }],
  // creator: 'NeverWrite',
  // publisher: 'NeverWrite',
  // formatDetection: {
    // email: false,
    // address: false,
    // telephone: false,
  // },
  // icons: {
    // icon: 'https://neverwrite-assets.s3.ap-south-1.amazonaws.com/favicon.ico',
    // shortcut: 'https://neverwrite-assets.s3.ap-south-1.amazonaws.com/favicon.ico',
    // apple: 'https://neverwrite-assets.s3.ap-south-1.amazonaws.com/favicon.ico',
  // },
  // viewport: {
    // width: 'device-width',
    // initialScale: 1,
  // },
  // robots: {
    // index: true,
    // follow: true,
    // googleBot: {
      // index: true,
      // follow: true,
      // 'max-video-preview': -1,
      // 'max-image-preview': 'large',
      // 'max-snippet': -1,
    // },
  // },
  // openGraph: {
    // type: 'website',
    // locale: 'en_US',
    // url: 'https://neverwrite.in',
    // siteName: 'NeverWrite',
    // title: 'NeverWrite - AI-Powered Screen Recording Documentation',
    // description: 'Transform your screen recordings into professional documentation with NeverWrite. Powered by AI for efficiency and quality.',
    // images: [
      // {
        // url: 'https://neverwrite.in/og-image.jpg',
        // width: 1200,
        // height: 630,
        // alt: 'NeverWrite - AI Documentation Tool',
      // },
    // ],
  // },
  // twitter: {
    // card: 'summary_large_image',
    // title: 'NeverWrite - AI-Powered Screen Recording Documentation',
    // description: 'Transform your screen recordings into professional documentation with NeverWrite. Powered by AI for efficiency and quality.',
    // images: ['https://neverwrite.in/twitter-image.jpg'],
    // creator: '@neverwrite',
  // },
// }

// export default function RootLayout({
  // children,
// }: {
  // children: React.ReactNode
// }) {
  // return (
    // <html lang="en">
      // <body className={inter.className}>
        // <Background />
        // <div className="relative z-10 bg-transparent">
          // <Header />
          // <main>{children}</main>
          // <Footer />
        // </div>
        // <GoogleAnalytics GA_MEASUREMENT_ID="G-7MYQTHYZEE" />
      // </body>
    // </html>
  // )
// }

