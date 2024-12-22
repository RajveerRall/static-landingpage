export default function Comparison() {
  return (
    <section className="py-20">
      <div className="container px-4 md:px-6">
        <h2 className="text-3xl font-bold text-center text-[#0B4D4A] mb-4">
          Upgrade Your Tutorials with AI Voiceover
        </h2>
        <p className="text-center text-gray-600 mb-12">
          The video demo shows how to take screen recordings and use them to create documents.
        </p>
        <div className="grid gap-8 md:grid-cols-2">
          <div className="flex flex-col items-center">
            <h3 className="text-xl font-semibold mb-4 text-center">Before</h3>
            <div className="aspect-video bg-gray-100 rounded-lg overflow-hidden w-full shadow-lg">
              <iframe
                width="100%"
                height="100%"
                src="https://www.youtube.com/embed/LcQ1uHpqNyc?rel=0&modestbranding=1&fs=0&controls=1&showinfo=0"
                title="Before: Screen Recording"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              ></iframe>
            </div>
          </div>
          <div className="flex flex-col items-center">
            <h3 className="text-xl font-semibold mb-4 text-center">After</h3>
            <div className="aspect-video bg-gray-100 rounded-lg overflow-hidden w-full shadow-lg">
              <iframe
                width="100%"
                height="100%"
                src="https://www.youtube.com/embed/fcVgD0GtsDo?rel=0&modestbranding=1&fs=0&controls=1&showinfo=0"
                title="After: AI-Enhanced Documentation"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              ></iframe>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

