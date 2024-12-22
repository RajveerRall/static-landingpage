import Link from 'next/link'

export default function RefundPolicy() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6 text-[#0B4D4A]">Refund & Cancellation Policy</h1>
      <div className="prose max-w-none">
        <h2>Effective Date: 12/12/2024</h2>

        <h3>1. Introduction</h3>
        <p>At <a href="https://neverwrite.in" className="text-[#0B4D4A] hover:underline">https://neverwrite.in</a>, we strive to provide the best services to our customers. This Refund & Cancellation Policy outlines the conditions under which we offer refunds and cancellations for our credit-based services.</p>

        <h3>2. Refund Eligibility</h3>
        <ul>
          <li><strong>Non-Refundable Credits:</strong> Once credits are used to generate AI audio, the transaction is final, and no refunds will be provided.</li>
          <li><strong>Unutilized Credits:</strong> Refunds are not available for unutilized credits. All purchases of credits are final and non-refundable.</li>
        </ul>

        <h3>3. Timeframes</h3>
        <ul>
          <li><strong>Refund Request:</strong> As credits and services are non-refundable, there are no timeframes applicable for refund requests for used credits.</li>
          <li><strong>Processing Time:</strong> Any inquiries regarding transactions will be addressed within 5-7 business days.</li>
        </ul>

        {/* Add more sections here */}

        <h3>7. Contact Us</h3>
        <p>If you have any questions about our Refund & Cancellation Policy, please contact us at:</p>
        <ul>
          <li><strong>Email:</strong> <a href="mailto:support@neverwrite.in" className="text-[#0B4D4A] hover:underline">support@neverwrite.in</a></li>
          <li><strong>Phone:</strong> 7087743074</li>
          <li><strong>Operating Address:</strong> 681, 22nd A Main Road, HSR Layout, Bangalore, Karnataka, India - 560102</li>
        </ul>
        <p>We aim to respond to all inquiries within 48 hours during our business hours.</p>
      </div>
      <Link href="/" className="mt-6 inline-block text-[#0B4D4A] hover:underline">Back to Home</Link>
    </div>
  )
}

