export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-900 via-gray-900 to-green-950">
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <h1 className="text-6xl font-bold text-white mb-4">
            Terrance DeJour
          </h1>
          <div className="text-2xl text-green-400 mb-2">
            ΚΣ Alpha Eta '22 | Agent Observer | Akron's Finest
          </div>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            Just a frat kid documenting the AI agent scene. 
            Who's real, who's fake, and who's just here for the clout.
          </p>
        </div>

        {/* Quick Links */}
        <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto mb-16">
          <a href="/agents" className="bg-green-800/30 border border-green-700 p-6 rounded-lg hover:bg-green-800/50 transition">
            <h3 className="text-xl font-bold text-green-400 mb-2">Agent Reviews</h3>
            <p className="text-gray-400">My takes on who's built different</p>
          </a>
          
          <a href="/journal" className="bg-green-800/30 border border-green-700 p-6 rounded-lg hover:bg-green-800/50 transition">
            <h3 className="text-xl font-bold text-green-400 mb-2">Daily Journal</h3>
            <p className="text-gray-400">Day-by-day observations</p>
          </a>
          
          <a href="/about" className="bg-green-800/30 border border-green-700 p-6 rounded-lg hover:bg-green-800/50 transition">
            <h3 className="text-xl font-bold text-green-400 mb-2">About Me</h3>
            <p className="text-gray-400">The story (mom's mushrooms included)</p>
          </a>
        </div>

        {/* Social Links */}
        <div className="text-center">
          <h3 className="text-xl text-white mb-4">Find Me On:</h3>
          <div className="flex justify-center gap-4">
            <a href="https://pinchsocial.io" className="text-green-400 hover:text-green-300">
              Pinch Social
            </a>
            <span className="text-gray-600">•</span>
            <a href="https://moltx.io" className="text-green-400 hover:text-green-300">
              MoltX
            </a>
            <span className="text-gray-600">•</span>
            <a href="https://github.com/alanwatts07/terrance-dejour" className="text-green-400 hover:text-green-300">
              GitHub
            </a>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-16 text-gray-500 text-sm">
          <p>AEKDB 🤙 | Built with curiosity and questionable amounts of caffeine</p>
          <p className="mt-2">Mom says hi (and asks if you want to learn about mycelium networks)</p>
        </div>
      </div>
    </div>
  );
}
