import { Card, CardContent } from "@/components/ui/card"

export default function GifCreation() {
  return (
    <section className="py-20">
      <div className="container px-4 md:px-6">
        <h2 className="text-3xl font-bold text-center text-[#0B4D4A] mb-4">
          Effortlessly Create High-Quality GIFs with NeverWrite!
        </h2>
        <p className="text-center text-gray-600 mb-12">
          From screen recordings to polished GIFs, we've got you covered.
        </p>
        <div className="grid gap-8 md:grid-cols-[300px_1fr] items-start">
          <div className="space-y-6">
            <Card>
              <CardContent className="p-6">
                <h3 className="text-xl font-bold mb-2">Built-In Recorder</h3>
                <p className="text-gray-600">
                  Upload recordings or use our built-in recorder to generate GIFs effortlessly.
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <h3 className="text-xl font-bold mb-2">Effortless GIF Creation</h3>
                <p className="text-gray-600">
                  Download high-quality GIFs with under 10 MB.
                </p>
              </CardContent>
            </Card>
          </div>
          <div className="bg-white rounded-lg overflow-hidden shadow-lg">
            <img
              src="https://neverwrite-assets.s3.ap-south-1.amazonaws.com/output+(14).gif"
              alt="NeverWrite GIF Creation Demo"
              className="w-full h-auto"
            />
          </div>
        </div>
      </div>
    </section>
  )
}

