import { Metadata } from 'next'
import Hero from '@/components/hero'
import Features from '@/components/features'
import Comparison from '@/components/comparison'
import Demo from '@/components/demo'
import GifCreation from '@/components/gif-creation'
import Cta from '@/components/cta'
import DocumentationGenerator from '@/components/DocumentationGenerator'




export const metadata: Metadata = {
  title: 'NeverWrite - Turn Screen Recordings into Professional Documentation',
  description: 'NeverWrite uses AI to transform your screen recordings into high-quality documentation, GIFs, and tutorials. Streamline your content creation process today!',
  openGraph: {
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

export default function LandingPage() {

  return (
    <main className="min-h-screen relative z-10">
      <Hero />
      <section className="py-20 bg-[#AEBFAE]">
        <div className="container px-4 md:px-6 max-w-none">
          <h2 className="text-3xl font-bold text-center text-[#0B4D4A] mb-8">
            Generate Documentation from Your Screen Recordings
          </h2>
          <div className="w-full h-[calc(100vh-80px)]">
            <DocumentationGenerator />
          </div>
        </div>
      </section>
      <Features />
      <Comparison />
      <Demo />
      <GifCreation />
      <Cta />
    </main>
  )
}

