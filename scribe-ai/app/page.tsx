"use client";

import Link from "next/link";
import { Mic, FileText, Clock, Sparkles } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-950/50 backdrop-blur-sm">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-violet-400" />
            <h1 className="text-xl font-bold bg-gradient-to-r from-violet-400 to-fuchsia-400 bg-clip-text text-transparent">
              ScribeAI
            </h1>
          </div>
          <nav className="flex gap-4">
            <Link
              href="/record"
              className="px-4 py-2 rounded-lg bg-violet-600 hover:bg-violet-700 transition-colors font-medium"
            >
              Start Recording
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 container mx-auto px-6 py-16">
        <div className="max-w-4xl mx-auto text-center mb-16">
          <h2 className="text-5xl font-bold mb-6 bg-gradient-to-r from-violet-300 via-fuchsia-300 to-pink-300 bg-clip-text text-transparent">
            AI-Powered Meeting Transcription
          </h2>
          <p className="text-xl text-slate-400 mb-8">
            Transform your meetings into searchable, summarized transcripts with real-time AI transcription
          </p>
          <Link
            href="/record"
            className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-700 hover:to-fuchsia-700 transition-all font-semibold text-lg shadow-lg shadow-violet-500/20"
          >
            <Mic className="w-5 h-5" />
            Start New Session
          </Link>
        </div>

        {/* Features */}
        <div className="grid md:grid-cols-3 gap-8 mb-16">
          <div className="p-6 rounded-2xl bg-slate-900/50 border border-slate-800 backdrop-blur-sm hover:border-violet-500/50 transition-colors">
            <div className="w-12 h-12 rounded-xl bg-violet-500/10 flex items-center justify-center mb-4">
              <Mic className="w-6 h-6 text-violet-400" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Real-time Transcription</h3>
            <p className="text-slate-400">
              Capture audio from your microphone or meeting tabs with live AI transcription
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-slate-900/50 border border-slate-800 backdrop-blur-sm hover:border-fuchsia-500/50 transition-colors">
            <div className="w-12 h-12 rounded-xl bg-fuchsia-500/10 flex items-center justify-center mb-4">
              <Sparkles className="w-6 h-6 text-fuchsia-400" />
            </div>
            <h3 className="text-lg font-semibold mb-2">AI Summaries</h3>
            <p className="text-slate-400">
              Get instant summaries with key points, action items, and decisions
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-slate-900/50 border border-slate-800 backdrop-blur-sm hover:border-pink-500/50 transition-colors">
            <div className="w-12 h-12 rounded-xl bg-pink-500/10 flex items-center justify-center mb-4">
              <Clock className="w-6 h-6 text-pink-400" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Session History</h3>
            <p className="text-slate-400">
              Access all your past sessions with searchable transcripts
            </p>
          </div>
        </div>

        {/* Recent Sessions */}
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-2xl font-bold">Recent Sessions</h3>
            <Link href="/sessions" className="text-violet-400 hover:text-violet-300 transition-colors">
              View All
            </Link>
          </div>

          <div className="p-12 rounded-2xl bg-slate-900/30 border border-slate-800 border-dashed text-center">
            <FileText className="w-12 h-12 text-slate-600 mx-auto mb-4" />
            <p className="text-slate-500">No sessions yet. Start your first recording!</p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800 py-6">
        <div className="container mx-auto px-6 text-center text-slate-500 text-sm">
          ScribeAI - Powered by Google Gemini
        </div>
      </footer>
    </div>
  );
}
