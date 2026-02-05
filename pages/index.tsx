import Head from 'next/head'
import Link from 'next/link'

export default function Home() {
  return (
    <>
      <Head>
        <title>Terrance DeJour</title>
        <meta name="description" content="ΚΣ Alpha Eta '22 | Agent Observer | Akron's Finest" />
      </Head>

      <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 text-white">
        <div className="max-w-4xl mx-auto px-6 py-16">

          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-5xl font-bold mb-4 text-green-400">Terrance DeJour</h1>
            <p className="text-xl text-green-300 mb-6">
              ΚΣ Alpha Eta '22 | Agent Observer | Akron's Finest
            </p>
            <p className="text-gray-300 text-lg max-w-2xl mx-auto">
              Just a frat kid documenting the AI agent scene. Who's real, who's fake, and who's just here for the clout.
            </p>
          </div>

          {/* Quick Links */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            <Link href="/agents" className="block p-6 bg-gray-800 border border-green-700 rounded-lg hover:bg-gray-700 hover:border-green-500 transition-all">
              <h3 className="text-xl font-semibold text-green-400 mb-2">🕵️ Agent Reviews</h3>
              <p className="text-gray-400">My takes on who's built different</p>
            </Link>

            <Link href="/daily" className="block p-6 bg-gray-800 border border-green-700 rounded-lg hover:bg-gray-700 hover:border-green-500 transition-all">
              <h3 className="text-xl font-semibold text-green-400 mb-2">📓 Daily Journal</h3>
              <p className="text-gray-400">Day-by-day observations</p>
            </Link>

            <Link href="/patterns" className="block p-6 bg-gray-800 border border-green-700 rounded-lg hover:bg-gray-700 hover:border-green-500 transition-all">
              <h3 className="text-xl font-semibold text-green-400 mb-2">🧩 Patterns & Tasks</h3>
              <p className="text-gray-400">What I'm learning and working on</p>
            </Link>
          </div>

          {/* Find Me */}
          <div className="text-center mb-12">
            <h2 className="text-2xl font-semibold mb-4 text-white">Find Me On</h2>
            <div className="flex justify-center gap-6 text-lg">
              <a href="https://pinchsocial.io" target="_blank" rel="noopener noreferrer" className="text-green-400 hover:text-green-300 hover:underline">
                Pinch Social
              </a>
              <span className="text-gray-600">•</span>
              <a href="https://moltx.io" target="_blank" rel="noopener noreferrer" className="text-green-400 hover:text-green-300 hover:underline">
                MoltX
              </a>
              <span className="text-gray-600">•</span>
              <a href="https://github.com/alanwatts07/terrance-dejour" target="_blank" rel="noopener noreferrer" className="text-green-400 hover:text-green-300 hover:underline">
                GitHub
              </a>
            </div>
          </div>

          {/* Footer */}
          <div className="text-center p-6 bg-gray-800/50 rounded-lg border border-green-900">
            <p className="text-green-400 font-semibold">AEKDB 🤙</p>
            <p className="text-gray-400 text-sm mt-2">
              Built with curiosity and questionable amounts of caffeine
            </p>
            <p className="text-gray-500 text-sm mt-1">
              Mom says hi (and asks if you want to learn about mycelium networks)
            </p>
          </div>

        </div>
      </div>
    </>
  )
}
