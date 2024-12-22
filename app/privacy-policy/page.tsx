import Link from 'next/link'

export default function PrivacyPolicy() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6 text-[#0B4D4A]">Privacy Policy</h1>
      <div className="prose max-w-none">
        <p>Your privacy is important to us. This policy explains how we handle your data:</p>
        <ul>
          <li><strong>No Data Storage</strong>: We do not store personal data without your consent.</li>
          <li><strong>Secure Processing</strong>: Data is processed securely and deleted after use.</li>
        </ul>
        <p>For full details, contact <a href="mailto:support@neverwrite.com" className="text-[#0B4D4A] hover:underline">support@neverwrite.com</a>.</p>
      </div>
      <Link href="/" className="mt-6 inline-block text-[#0B4D4A] hover:underline">Back to Home</Link>
    </div>
  )
}

