import Link from 'next/link'

export default function TermsOfService() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6 text-[#0B4D4A]">Terms of Service</h1>
      <div className="prose max-w-none">
        <h2>Effective Date: 12/12/2024</h2>

        <h3>1. Introduction</h3>
        <p>These Terms & Conditions ("Terms") govern your use of <a href="https://neverwrite.in" className="text-[#0B4D4A] hover:underline">https://neverwrite.in</a> (the "Website") and the services provided by neverwrite ("we," "our," or "us"). By accessing or using our Website and services, you agree to comply with and be bound by these Terms.</p>

        <h3>2. Service/Product Details & User Responsibilities</h3>
        <p><strong>Service Description:</strong> We provide AI audio generation from screen recordings. Users can upload screen recordings and generate AI audio by purchasing and using credits.</p>
        <p><strong>User Responsibilities:</strong> Users must provide accurate and complete information when using our services. Users are responsible for maintaining the confidentiality of their account information and for all activities that occur under their account.</p>

        <h3>3. Payment Terms</h3>
        <p><strong>Credits Purchase:</strong> Users must purchase credits to generate AI audio. Credits can be purchased through our Website using the available payment methods.</p>
        <p><strong>Non-Refundable Credits:</strong> All purchases of credits are final and non-refundable. Once credits are used to generate AI audio, the transaction is final, and no refunds will be provided.</p>

        {/* Add more sections here */}

        <h3>9. Contact Us</h3>
        <p>If you have any questions about these Terms, please contact us at <a href="mailto:support@neverwrite.in" className="text-[#0B4D4A] hover:underline">support@neverwrite.in</a> or 7087743074.</p>
      </div>
      <Link href="/" className="mt-6 inline-block text-[#0B4D4A] hover:underline">Back to Home</Link>
    </div>
  )
}

