import Link from "next/link"

export default function Footer() {
  return (
    <footer className="bg-[#0B4D4A]/90 backdrop-blur-sm text-white py-8 relative z-20">
      <div className="container px-4 md:px-6">
        <div className="text-center">
          <p className="text-sm">© 2024 NeverWrite. All Rights Reserved.</p>
          <div className="mt-4 space-x-4">
            <Link href="/privacy-policy" className="text-sm hover:underline">
              Privacy Policy
            </Link>
            <Link href="/terms-of-service" className="text-sm hover:underline">
              Terms of Service
            </Link>
            <Link href="/refund-policy" className="text-sm hover:underline">
              Refund policy
            </Link>
          </div>
          <div className="mt-4">
            <Link href="mailto:support@neverwrite.ai" className="text-sm hover:underline">
              Contact us: support@neverwrite.ai
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}

