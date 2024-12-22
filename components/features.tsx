import { Card, CardContent } from "@/components/ui/card"

export default function Features() {
  const features = [
    {
      title: "Create GIFs",
      description: "Convert recordings into high-quality GIFs for tutorials and feature highlights."
    },
    {
      title: "AI-Powered Documentation",
      description: "Transform screen recordings into polished product documentation with text and visuals."
    },
    {
      title: "Professional AI Voiceovers",
      description: "Replace raw voice recordings with professional AI voices and enhanced scripts."
    },
    {
      title: "Zoom In and Out Effect",
      description: "Apply pan zoom in, and zoom out effects to your videos for enhanced detail and focus."
    }
  ]

  return (
    <section className="py-20 bg-[#AEBFAE]">
      <div className="container px-4 md:px-6">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {features.map((feature, i) => (
            <Card key={i} className="bg-white">
              <CardContent className="p-6">
                <h3 className="text-xl font-bold mb-2 text-[#0B4D4A]">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}

