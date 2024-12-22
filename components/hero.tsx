'use client'

import { Button } from "@/components/ui/button"

const COGNITO_DOMAIN = "ap-south-1i0tu4zlbp.auth.ap-south-1.amazoncognito.com"
const CLIENT_ID = "77cbj1at51n8kv9svog3gohqf3"
const REDIRECT_URI = "https://app.neverwrite.in/"

const loginUrl = `https://${COGNITO_DOMAIN}/login?client_id=${CLIENT_ID}&response_type=code&scope=email+openid+phone&redirect_uri=${encodeURIComponent(REDIRECT_URI)}`
const signUpUrl = `https://${COGNITO_DOMAIN}/signup?client_id=${CLIENT_ID}&response_type=code&scope=email+openid+phone&redirect_uri=${encodeURIComponent(REDIRECT_URI)}`

export default function Hero() {
  return (
    <section className="py-20 text-center">
      <div className="container px-4 md:px-6">
        <h1 className="text-4xl font-bold tracking-tighter text-[#0B4D4A] sm:text-5xl md:text-6xl lg:text-7xl">
          Screen Recording to<br />Docs, GIFs, and Tutorials
        </h1>
        <p className="mx-auto mt-4 max-w-[700px] text-gray-600 md:text-xl">
          Turn screen recordings into professional product documentation with the power of AI.
        </p>
        <div className="mt-8">
          <Button 
            className="bg-[#0B4D4A] hover:bg-[#0B4D4A]/90 text-white px-8 py-6 text-lg"
            onClick={() => window.location.href = `https://${COGNITO_DOMAIN}/signup?client_id=${CLIENT_ID}&response_type=code&scope=email+openid+phone&redirect_uri=${encodeURIComponent(REDIRECT_URI)}`}
          >
            Get Started for Free
          </Button>
        </div>
      </div>
    </section>
  )
}

