'use client'

import { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import Link from 'next/link'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // Here you would typically handle the password reset logic
    console.log('Password reset request', { email })
    setSubmitted(true)
  }

  if (submitted) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-md">
        <h1 className="text-3xl font-bold mb-8 text-[#0B4D4A] text-center">Check Your Email</h1>
        <p className="text-center mb-4">
          If an account exists for {email}, we've sent a password reset link to that email address.
        </p>
        <div className="text-center">
          <Link href="/login" className="text-[#0B4D4A] hover:underline">
            Return to Login
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-md">
      <h1 className="text-3xl font-bold mb-8 text-[#0B4D4A] text-center">Forgot Password</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label htmlFor="email">Email</Label>
          <Input 
            id="email" 
            type="email" 
            value={email} 
            onChange={(e) => setEmail(e.target.value)} 
            required 
          />
        </div>
        <Button type="submit" className="w-full">Send Reset Link</Button>
      </form>
      <div className="mt-4 text-center">
        Remembered your password? 
        <Link href="/login" className="text-[#0B4D4A] hover:underline ml-1">
          Login
        </Link>
      </div>
    </div>
  )
}

