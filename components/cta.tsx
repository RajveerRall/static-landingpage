'use client'

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

const COGNITO_DOMAIN = "ap-south-1i0tu4zlbp.auth.ap-south-1.amazoncognito.com"
const CLIENT_ID = "77cbj1at51n8kv9svog3gohqf3"
const REDIRECT_URI = "https://app.neverwrite.in/"

export default function Cta() {
  return (
    <section className="py-20 bg-[#AEBFAE]">
      <div className="container px-4 md:px-6">
        <h2 className="text-3xl font-bold text-center text-[#0B4D4A] mb-8">
          Who Is Neverwrite For?
        </h2>
        <div className="grid gap-8 md:grid-cols-3">
          <Card className="bg-white">
            <CardContent className="p-6 text-center">
              <h3 className="text-xl font-bold mb-4 text-[#0B4D4A]">Technical Writers</h3>
              <p className="text-gray-600">
                Let Neverwrite handle docs, GIFs, and video tutorials so you can focus on clear, concise content.
              </p>
            </CardContent>
          </Card>
          <Card className="bg-white">
            <CardContent className="p-6 text-center">
              <h3 className="text-xl font-bold mb-4 text-[#0B4D4A]">Product Managers</h3>
              <p className="text-gray-600">
                Quickly generate comprehensive docs and engaging video tutorials to keep your team and users informed with ease.
              </p>
            </CardContent>
          </Card>
          <Card className="bg-white">
            <CardContent className="p-6 text-center">
              <h3 className="text-xl font-bold mb-4 text-[#0B4D4A]">Developers</h3>
              <p className="text-gray-600">
                Create clear, professional docs and tutorials without taking time away from coding.
              </p>
            </CardContent>
          </Card>
        </div>
        <div className="mt-12 text-center">
          <Button 
            className="bg-[#0B4D4A] hover:bg-[#0B4D4A]/90 text-white px-8 py-6 text-lg"
            onClick={() => window.location.href = `https://${COGNITO_DOMAIN}/signup?client_id=${CLIENT_ID}&response_type=code&scope=email+openid+phone&redirect_uri=${encodeURIComponent(REDIRECT_URI)}`}
          >
            Get Started Now
          </Button>
        </div>
      </div>
    </section>
  )
}

