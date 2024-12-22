import { Metadata } from 'next'
import Link from 'next/link'
import { Button } from "@/components/ui/button"

export const metadata: Metadata = {
  title: 'Blog | NeverWrite',
  description: 'Read the latest articles about screen recording, documentation, and AI-powered content creation from NeverWrite.',
  openGraph: {
    title: 'NeverWrite Blog - Insights on AI Documentation',
    description: 'Explore articles on screen recording, documentation best practices, and AI-powered content creation.',
    images: [
      {
        url: '/blog-og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'NeverWrite Blog',
      },
    ],
  },
}

export default function BlogPage() {
  // This would typically come from a database or CMS
  const blogPosts = [
    { id: 1, title: "Getting Started with Screen Recording", date: "2023-12-01" },
    { id: 2, title: "5 Tips for Creating Effective Tutorials", date: "2023-12-15" },
    { id: 3, title: "The Power of AI in Documentation", date: "2024-01-05" },
  ]

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8 text-[#0B4D4A]">Blog</h1>
      <div className="grid gap-6">
        {blogPosts.map((post) => (
          <div key={post.id} className="border p-4 rounded-lg">
            <h2 className="text-xl font-semibold mb-2">
              <Link href={`/blog/${post.id}`} className="text-[#0B4D4A] hover:underline">
                {post.title}
              </Link>
            </h2>
            <p className="text-gray-600 mb-4">{post.date}</p>
            <Button asChild>
              <Link href={`/blog/${post.id}`}>Read More</Link>
            </Button>
          </div>
        ))}
      </div>
    </div>
  )
}

