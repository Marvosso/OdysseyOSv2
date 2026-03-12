/**
 * OdysseyOS Public Landing Page
 * High-conversion marketing page: hero, product visuals, features, pricing, CTAs.
 */

import Link from 'next/link';
import {
  Users,
  PenLine,
  Sparkles,
  Mic,
  Layout,
  Check,
  ArrowRight,
  ChevronRight,
} from 'lucide-react';

const AUTH_PATH = '/auth';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[rgb(var(--background-rgb))] text-gray-900 dark:text-gray-100">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-gray-200/80 dark:border-gray-800 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
          <span className="font-bold text-xl text-gray-900 dark:text-white">OdysseyOS</span>
          <Link
            href={AUTH_PATH}
            className="text-sm font-semibold text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 transition-colors"
          >
            Sign in
          </Link>
        </div>
      </header>

      {/* Section 1 — Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-purple-950/40 via-indigo-950/30 to-violet-950/40 dark:from-purple-950/60 dark:via-indigo-950/50 dark:to-violet-950/60">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%239933ea\' fill-opacity=\'0.03\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] opacity-80" aria-hidden />
        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 sm:pt-28 pb-24 sm:pb-32">
          <div className="text-center max-w-4xl mx-auto">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-gray-900 dark:text-white">
              OdysseyOS — The Storytelling Workspace for Writers
            </h1>
            <p className="mt-6 text-lg sm:text-xl text-gray-600 dark:text-gray-300 leading-relaxed">
              Plan your story with proven outline templates, track characters and worldbuilding, write chapters in a cinematic editor, and get thoughtful AI assistance when you need it.
            </p>
            <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href={AUTH_PATH}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-semibold text-lg shadow-lg shadow-purple-500/25 hover:shadow-purple-500/30 transition-all duration-200"
              >
                Start Writing Free
                <ArrowRight className="w-5 h-5" />
              </Link>
              <a
                href="#product-visuals"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:border-purple-400 dark:hover:border-purple-500 hover:bg-gray-50 dark:hover:bg-gray-800/50 font-semibold transition-all duration-200"
              >
                See How It Works
                <ChevronRight className="w-5 h-5" />
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Section 2 — Product Visuals */}
      <section id="product-visuals" className="py-16 sm:py-24 bg-white dark:bg-gray-900/50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl sm:text-4xl font-bold text-center text-gray-900 dark:text-white mb-12">
            Built for Storytellers
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Outline template picker — real screenshot */}
            <div className="rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden bg-gray-50 dark:bg-gray-800/50 shadow-card dark:shadow-none hover:shadow-card-md dark:hover:shadow-lg transition-shadow duration-300">
              <div className="aspect-video bg-gray-200 dark:bg-gray-800 flex items-center justify-center overflow-hidden">
                <img
                  src="/screenshots/outline-template.png"
                  alt="Story Outline — template picker, premise, chapters and scenes"
                  className="w-full h-full object-cover object-top"
                />
              </div>
              <p className="p-4 text-sm font-medium text-gray-700 dark:text-gray-300 text-center border-t border-gray-200 dark:border-gray-700">
                Outline template picker
              </p>
            </div>
            {/* Story beats visualization — real screenshot */}
            <div className="rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden bg-gray-50 dark:bg-gray-800/50 shadow-card dark:shadow-none hover:shadow-card-md dark:hover:shadow-lg transition-shadow duration-300">
              <div className="aspect-video bg-gray-200 dark:bg-gray-800 flex items-center justify-center overflow-hidden">
                <img
                  src="/screenshots/story-beats.png"
                  alt="Scene Breakdown — structure templates and beat cards with duration and impact"
                  className="w-full h-full object-cover object-top"
                />
              </div>
              <p className="p-4 text-sm font-medium text-gray-700 dark:text-gray-300 text-center border-t border-gray-200 dark:border-gray-700">
                Story beats visualization
              </p>
            </div>
            {/* Character Hub / character linking — real screenshot */}
            <div className="rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden bg-gray-50 dark:bg-gray-800/50 shadow-card dark:shadow-none hover:shadow-card-md dark:hover:shadow-lg transition-shadow duration-300">
              <div className="aspect-video bg-gray-200 dark:bg-gray-800 flex items-center justify-center overflow-hidden">
                <img
                  src="/screenshots/character-hub.png"
                  alt="Character Hub — roles, add character, detected from your story linking"
                  className="w-full h-full object-cover object-top"
                />
              </div>
              <p className="p-4 text-sm font-medium text-gray-700 dark:text-gray-300 text-center border-t border-gray-200 dark:border-gray-700">
                Character profile linked to scenes
              </p>
            </div>
            {/* Writing editor workspace — real screenshot */}
            <div className="rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden bg-gray-50 dark:bg-gray-800/50 shadow-card dark:shadow-none hover:shadow-card-md dark:hover:shadow-lg transition-shadow duration-300">
              <div className="aspect-video bg-gray-200 dark:bg-gray-800 flex items-center justify-center overflow-hidden">
                <img
                  src="/screenshots/writing-workspace.png"
                  alt="Writing workspace — chapter editor with Reference panel (Characters, World, Notes / AI)"
                  className="w-full h-full object-cover object-top"
                />
              </div>
              <p className="p-4 text-sm font-medium text-gray-700 dark:text-gray-300 text-center border-t border-gray-200 dark:border-gray-700">
                Writing editor workspace
              </p>
            </div>
            {/* Voice narration — real screenshot */}
            <div className="rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden bg-gray-50 dark:bg-gray-800/50 shadow-card dark:shadow-none hover:shadow-card-md dark:hover:shadow-lg transition-shadow duration-300">
              <div className="aspect-video bg-gray-200 dark:bg-gray-800 flex items-center justify-center overflow-hidden">
                <img
                  src="/screenshots/narration.png"
                  alt="Narration — voice selection and narrate by scene or chapter"
                  className="w-full h-full object-cover object-top"
                />
              </div>
              <p className="p-4 text-sm font-medium text-gray-700 dark:text-gray-300 text-center border-t border-gray-200 dark:border-gray-700">
                Voice narration player
              </p>
            </div>
            {/* World Builder — real screenshot */}
            <div className="rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden bg-gray-50 dark:bg-gray-800/50 shadow-card dark:shadow-none hover:shadow-card-md dark:hover:shadow-lg transition-shadow duration-300">
              <div className="aspect-video bg-gray-200 dark:bg-gray-800 flex items-center justify-center overflow-hidden">
                <img
                  src="/screenshots/world-builder.png"
                  alt="World Builder — locations, culture, magic, technology, politics, economy, religion"
                  className="w-full h-full object-cover object-top"
                />
              </div>
              <p className="p-4 text-sm font-medium text-gray-700 dark:text-gray-300 text-center border-t border-gray-200 dark:border-gray-700">
                World Builder
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Section 3 — Core Features */}
      <section id="features" className="py-16 sm:py-24 bg-gray-50 dark:bg-gray-900/80">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl sm:text-4xl font-bold text-center text-gray-900 dark:text-white mb-14">
            Core Features
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                title: 'Structured Story Outlining',
                description: 'Use proven narrative templates like Hero’s Journey, Save the Cat, Snowflake Method, and Three-Act Structure.',
                icon: Layout,
              },
              {
                title: 'Character & World Tracking',
                description: 'Track characters, relationships, locations, and story elements across your project.',
                icon: Users,
              },
              {
                title: 'Cinematic Writing Workspace',
                description: 'Write chapters in a focused editor designed for storytelling, not distractions.',
                icon: PenLine,
              },
              {
                title: 'AI Story Assistance',
                description: 'Use AI to analyze structure, generate outlines, and develop ideas without losing control of your story.',
                icon: Sparkles,
              },
              {
                title: 'Voice Narration',
                description: 'Listen to your chapters with natural AI narration to refine pacing and dialogue.',
                icon: Mic,
              },
            ].map(({ title, description, icon: Icon }) => (
              <div
                key={title}
                className="p-6 rounded-2xl bg-white dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 hover:border-purple-300 dark:hover:border-purple-500/50 transition-colors duration-200"
              >
                <div className="p-3 rounded-xl bg-purple-100 dark:bg-purple-600/20 w-fit mb-4">
                  <Icon className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">{title}</h3>
                <p className="text-gray-600 dark:text-gray-400 leading-relaxed">{description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Section 4 — Why OdysseyOS */}
      <section className="py-16 sm:py-24 bg-white dark:bg-gray-900/50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl sm:text-4xl font-bold text-center text-gray-900 dark:text-white mb-6">
            Why OdysseyOS
          </h2>
          <p className="text-center text-gray-600 dark:text-gray-400 text-lg mb-12">
            Writers struggle with tools that generate text but don’t help structure stories.
          </p>
          <p className="text-center text-gray-700 dark:text-gray-300 font-medium mb-8">
            OdysseyOS focuses on:
          </p>
          <ul className="space-y-4">
            {['Planning stories', 'Organizing narrative elements', 'Writing in a focused environment', 'Completing projects'].map((item) => (
              <li key={item} className="flex items-center gap-3 text-gray-700 dark:text-gray-300">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-purple-100 dark:bg-purple-600/30 flex items-center justify-center">
                  <Check className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                </span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Section 5 — Pricing Summary */}
      <section className="py-16 sm:py-24 bg-gray-50 dark:bg-gray-900/80">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl sm:text-4xl font-bold text-center text-gray-900 dark:text-white mb-14">
            Simple Pricing
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Free */}
            <div className="rounded-2xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/50 p-6 flex flex-col">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">Free</h3>
              <ul className="mt-4 space-y-2 text-gray-600 dark:text-gray-400 flex-1">
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-green-500 flex-shrink-0" /> 2 story projects</li>
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-green-500 flex-shrink-0" /> Writing editor</li>
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-green-500 flex-shrink-0" /> Outline templates</li>
              </ul>
              <Link
                href={AUTH_PATH}
                className="mt-6 w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-semibold transition-colors"
              >
                Start Writing Free
              </Link>
            </div>
            {/* Pro */}
            <div className="rounded-2xl border-2 border-purple-500 bg-white dark:bg-gray-800/50 p-6 flex flex-col shadow-lg shadow-purple-500/10">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">Pro</h3>
              <ul className="mt-4 space-y-2 text-gray-600 dark:text-gray-400 flex-1">
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-green-500 flex-shrink-0" /> Unlimited projects</li>
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-green-500 flex-shrink-0" /> Advanced templates</li>
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-green-500 flex-shrink-0" /> Narration features</li>
              </ul>
              <Link
                href={AUTH_PATH}
                className="mt-6 w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-semibold transition-colors"
              >
                Start Writing Free
              </Link>
            </div>
            {/* Studio */}
            <div className="rounded-2xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/50 p-6 flex flex-col">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">Studio</h3>
              <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">Coming soon</p>
              <ul className="mt-4 space-y-2 text-gray-600 dark:text-gray-400 flex-1">
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-green-500 flex-shrink-0" /> Collaboration</li>
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-green-500 flex-shrink-0" /> Team tools</li>
              </ul>
              <Link
                href={AUTH_PATH}
                className="mt-6 w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:border-purple-400 font-semibold transition-colors"
              >
                Join the waitlist
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Section 6 — Beta Status */}
      <section className="py-12 sm:py-16 bg-purple-600 dark:bg-purple-700">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl sm:text-3xl font-bold text-white mb-2">
            OdysseyOS is currently in early beta.
          </h2>
          <p className="text-purple-100 text-lg mb-8">
            Your feedback helps shape the future of storytelling tools.
          </p>
          <Link
            href={AUTH_PATH}
            className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl bg-white text-purple-600 font-semibold hover:bg-purple-50 transition-colors"
          >
            Join the Beta
          </Link>
        </div>
      </section>

      {/* Section 7 — Final CTA */}
      <section className="py-20 sm:py-28 bg-gradient-to-br from-purple-950/30 via-indigo-950/20 to-violet-950/30 dark:from-purple-950/50 dark:via-indigo-950/40 dark:to-violet-950/50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl sm:text-5xl font-bold text-gray-900 dark:text-white mb-6">
            Start Your Next Story.
          </h2>
          <Link
            href={AUTH_PATH}
            className="inline-flex items-center justify-center gap-2 px-10 py-5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-semibold text-lg shadow-lg shadow-purple-500/25 transition-all duration-200"
          >
            Create Your Free Account
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900/50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            © {new Date().getFullYear()} OdysseyOS. Built for writers.
          </p>
          <div className="flex items-center gap-6">
            <Link href={AUTH_PATH} className="text-sm font-medium text-purple-600 dark:text-purple-400 hover:underline">
              Sign in
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
