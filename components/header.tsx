'use client'

import Link from 'next/link'
import { Button } from "@/components/ui/button"

const COGNITO_DOMAIN = "ap-south-1i0tu4zlbp.auth.ap-south-1.amazoncognito.com"
const CLIENT_ID = "77cbj1at51n8kv9svog3gohqf3"
const REDIRECT_URI = "https://neverwrite.in/app/"

const loginUrl = `https://${COGNITO_DOMAIN}/login?client_id=${CLIENT_ID}&response_type=code&scope=email+openid+phone&redirect_uri=${encodeURIComponent(REDIRECT_URI)}`
const signUpUrl = `https://${COGNITO_DOMAIN}/signup?client_id=${CLIENT_ID}&response_type=code&scope=email+openid+phone&redirect_uri=${encodeURIComponent(REDIRECT_URI)}`

export default function Header() {
  return (
    <header className="py-4 px-4 md:px-6 bg-transparent shadow-none relative z-20">
      <div className="container mx-auto flex justify-between items-center">
        <Link href="/" className="text-2xl font-bold text-[#0B4D4A]">
          NeverWrite
        </Link>
        <nav>
          <ul className="flex space-x-4">
            <li> 
              <Button asChild 
              className="bg-[#0B4D4A] hover:bg-[#0B4D4A]/90 text-white"
              variant="outline">
                <Link href={loginUrl}>Login</Link>
              </Button>
            </li>
            <li>
              <Button asChild
              className="bg-[#0B4D4A] hover:bg-[#0B4D4A]/90 text-white">
                <Link href={signUpUrl}>Sign Up</Link>
              </Button>
            </li>
          </ul>
        </nav>
      </div>
    </header>
  )
}




// import Link from 'next/link'
// import { Button } from "@/components/ui/button"

// const COGNITO_DOMAIN = "ap-south-1i0tu4zlbp.auth.ap-south-1.amazoncognito.com"
// const CLIENT_ID = "77cbj1at51n8kv9svog3gohqf3"
// const REDIRECT_URI = "https://neverwrite.in"

// const loginUrl = `https://${COGNITO_DOMAIN}/login?client_id=${CLIENT_ID}&response_type=code&scope=email+openid+phone&redirect_uri=${encodeURIComponent(REDIRECT_URI)}`
// const signUpUrl = `https://${COGNITO_DOMAIN}/signup?client_id=${CLIENT_ID}&response_type=code&scope=email+openid+phone&redirect_uri=${encodeURIComponent(REDIRECT_URI)}`

// export default function Header() {
  // return (
    // <header className="py-4 px-4 md:px-6 bg-transparent shadow-none relative z-20">
      // <div className="container mx-auto flex justify-between items-center">
        // <Link href="/" className="text-2xl font-bold text-[#0B4D4A]">
          // NeverWrite
        // </Link>
        // <nav>
          // <ul className="flex space-x-4">
            // <li> 
              // <Button asChild 
              // className="bg-[#0B4D4A] hover:bg-[#0B4D4A]/90 text-white"
              // variant="outline">
                // <Link href={loginUrl}>Login</Link>
              // </Button>
            // </li>
            // <li>
              // <Button asChild
              // className="bg-[#0B4D4A] hover:bg-[#0B4D4A]/90 text-white">
                // <Link href={signUpUrl}>Sign Up</Link>
              // </Button>
            // </li>
          // </ul>
        // </nav>
      // </div>
    // </header>
  // )
// }

