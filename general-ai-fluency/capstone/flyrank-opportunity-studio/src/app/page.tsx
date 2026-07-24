import Link from "next/link"
import { ArrowRight, ShieldCheck, Activity, LineChart } from "lucide-react"

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      <header className="sticky top-0 z-10 border-b bg-white/80 backdrop-blur-md">
        <div className="container mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-2 font-bold text-xl text-blue-900">
            <Activity className="h-6 w-6 text-blue-600" />
            <span>FlyRank Studio</span>
          </div>
          <nav>
            <Link 
              href="/studio" 
              className="rounded-full bg-blue-600 px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700"
            >
              Launch Workspace
            </Link>
          </nav>
        </div>
      </header>

      <main className="flex-1">
        <section className="px-4 py-20 text-center sm:px-6 lg:py-32">
          <div className="mx-auto max-w-4xl">
            <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl lg:text-6xl">
              Opportunity Intelligence for <span className="text-blue-600">Search & Content</span>
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg text-slate-600 sm:text-xl">
              Turn your Google Search Console and Google Analytics 4 data into actionable content opportunities. 
              No databases, no stored data, fully client-side and privacy-first.
            </p>
            <div className="mt-10 flex justify-center gap-4">
              <Link 
                href="/studio" 
                className="group flex items-center justify-center gap-2 rounded-full bg-blue-600 px-8 py-3 text-base font-medium text-white transition-all hover:bg-blue-700 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2"
              >
                Start Analysis
                <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
              </Link>
            </div>
          </div>
        </section>

        <section className="bg-white py-16 sm:py-24">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <div className="grid gap-12 sm:grid-cols-2 lg:grid-cols-3">
              <div className="flex flex-col items-center text-center">
                <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-100 text-blue-600">
                  <ShieldCheck className="h-8 w-8" />
                </div>
                <h3 className="mb-2 text-xl font-bold text-slate-900">Privacy First</h3>
                <p className="text-slate-600">
                  Your data never leaves your browser. All CSV processing and analysis happens locally on your machine.
                </p>
              </div>
              
              <div className="flex flex-col items-center text-center">
                <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-100 text-indigo-600">
                  <LineChart className="h-8 w-8" />
                </div>
                <h3 className="mb-2 text-xl font-bold text-slate-900">Advanced Scoring</h3>
                <p className="text-slate-600">
                  Our proprietary algorithm weighs impressions, CTR gaps, striking distance, and engagement to rank opportunities.
                </p>
              </div>

              <div className="flex flex-col items-center text-center">
                <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-600">
                  <Activity className="h-8 w-8" />
                </div>
                <h3 className="mb-2 text-xl font-bold text-slate-900">Actionable Insights</h3>
                <p className="text-slate-600">
                  Get clear recommended actions for every landing page, whether it&apos;s rewriting titles or refreshing content.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t bg-slate-50 py-8">
        <div className="container mx-auto text-center text-sm text-slate-500">
          <p>© {new Date().getFullYear()} FlyRank Opportunity Intelligence Studio. All rights reserved.</p>
          <p className="mt-2">Built for demonstration purposes. Use synthetic data for testing.</p>
        </div>
      </footer>
    </div>
  )
}
