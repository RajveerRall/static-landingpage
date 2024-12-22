export default function Demo() {
  return (
    <section className="py-20 bg-[#AEBFAE]">
      <div className="container px-4 md:px-6">
        <h2 className="text-3xl font-bold text-center text-[#0B4D4A] mb-4">
          Create Docs from your Screen Recordings
        </h2>
        <p className="text-center text-gray-600 mb-12">
          The video demo shows how to take screen recordings and use them to create documents.
        </p>
        <div className="max-w-4xl mx-auto aspect-video bg-gray-100 rounded-xl shadow-xl overflow-hidden">
          <iframe
  width="100%"
  height="100%"
  src="https://www.youtube.com/embed/ebP7B36gIhs?rel=0&modestbranding=0&fs=0&controls=1&showinfo=1"
  title="Create Docs from Screen Recordings"
  frameBorder="0"
  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
  allowFullScreen
></iframe>
        </div>
      </div>
    </section>
  )
}

