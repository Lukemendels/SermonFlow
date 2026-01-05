import { createClient } from '@/lib/supabase-server';
import { redirect } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import {
  BookOpen,
  Sparkles,
  ArrowRight,
  Mic,
  PenTool,
  FileCheck,
  ShieldCheck,
  SplitSquareHorizontal,
  Download,
  CheckCircle2,
  CreditCard,
  CalendarOff
} from 'lucide-react';

export default async function Home() {
  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();

  if (session) {
    redirect('/dashboard');
  }

  return (
    <div className="bg-parchment-50 text-charcoal antialiased selection:bg-gold-light selection:text-charcoal overflow-x-hidden min-h-screen relative">
      {/* NAV */}
      <nav className="absolute top-0 left-0 w-full z-50 px-6 py-6 flex justify-between items-center max-w-7xl mx-auto right-0">
        <div className="font-serif text-2xl font-bold tracking-tight text-white drop-shadow-sm flex items-center gap-2">
          <BookOpen className="w-6 h-6 text-gold" />
          SermonFlow
        </div>
        <div className="hidden md:flex gap-6">
          <a href="#" className="text-white/80 hover:text-white font-sans text-sm transition-colors">Pricing</a>
          <a href="#" className="text-white/80 hover:text-white font-sans text-sm transition-colors">Theology</a>
          <Link href="/login" className="text-white/80 hover:text-white font-sans text-sm transition-colors">Login</Link>
        </div>
      </nav>

      {/* SECTION 1: HERO */}
      <section className="relative w-full min-h-[90vh] flex flex-col justify-center items-center text-center px-4 bg-charcoal">

        {/* Image Placeholder Layer */}
        <div className="absolute inset-0 z-0 bg-neutral-800 bg-texture">
          {/* Hero Background Image */}
          <div className="absolute inset-0 opacity-20">
            <Image
              src="/images/landing/hero-pastor-desk.png"
              alt="Cinematic Top-Down Shot of Messy Pastor's Desk"
              fill
              className="object-cover"
              priority
            />
          </div>
          {/* Editorial Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-b from-charcoal/60 via-charcoal/30 to-parchment-50/90"></div>
        </div>

        {/* Content Layer */}
        <div className="relative z-10 max-w-4xl mx-auto space-y-8 pt-20">
          <h1 className="font-serif italic text-6xl md:text-7xl lg:text-8xl text-white drop-shadow-lg leading-[0.9]">
            Sunday Morning is Finished. <br />
            <span className="not-italic text-parchment-100 block mt-2">Get Your Afternoon Back.</span>
          </h1>

          <p className="font-sans text-lg md:text-xl text-white/90 max-w-2xl mx-auto font-light tracking-wide leading-relaxed">
            Upload your sermon recording. Get beautifully branded small group guides, devotionals, and newsletters in minutes—before the potluck is over.
          </p>

          <div className="flex flex-col md:flex-row gap-4 justify-center items-center pt-8">
            <Link href="/login" className="bg-gold hover:bg-gold-hover text-charcoal font-sans font-semibold py-4 px-8 rounded-sm shadow-xl transition-all transform hover:scale-105 hover:shadow-gold/20 flex items-center gap-2 group">
              <Sparkles className="w-5 h-5 group-hover:rotate-12 transition-transform" />
              Generate Your First Bundle Free
            </Link>
            <a href="#" className="text-white/90 hover:text-white border-b border-white/50 hover:border-white transition-colors pb-1 font-sans mt-4 md:mt-0 flex items-center gap-2 group">
              See a Sample PDF
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </a>
          </div>
        </div>
      </section>

      {/* SECTION 2: THE WORKFLOW */}
      <section className="w-full py-24 px-6 md:px-12 bg-parchment-50 border-b border-charcoal/5">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-20 space-y-4">
            <h2 className="font-serif text-4xl md:text-5xl text-charcoal">From Pulpit to PDF in Minutes</h2>
            <p className="font-sans text-charcoal-muted max-w-xl mx-auto">No prompt engineering. No complex editors. Just upload your audio, and we steward the rest.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 relative">

            {/* Connector Line (Desktop) */}
            <div className="hidden md:block absolute top-[110px] left-[16%] right-[16%] h-[1px] bg-charcoal/10 z-0"></div>

            {/* Step 1 */}
            <div className="flex flex-col items-center text-center space-y-6 group relative z-10">
              <div className="w-full aspect-[3/2] relative overflow-hidden rounded-sm shadow-md bg-neutral-200 grayscale group-hover:grayscale-0 transition-all duration-700">
                <Image
                  src="/images/landing/workflow-step-1-input.png"
                  alt="iPhone Recording on Pulpit"
                  fill
                  className="object-cover"
                />
                <div className="absolute inset-0 flex flex-col items-center justify-center text-neutral-400 p-4 border border-neutral-300 m-2 border-dashed pointer-events-none">
                  <Mic className="w-8 h-8 mb-2" />
                </div>
              </div>
              <div className="space-y-2">
                <div className="w-10 h-10 rounded-full bg-parchment-200 flex items-center justify-center font-serif text-xl text-royal mx-auto border border-royal/10">1</div>
                <h3 className="font-serif text-2xl text-charcoal">Input</h3>
                <p className="text-sm text-charcoal-muted max-w-[250px] mx-auto leading-relaxed">Drop in your MP3, M4A, or YouTube link immediately after service.</p>
              </div>
            </div>

            {/* Step 2 */}
            <div className="flex flex-col items-center text-center space-y-6 group relative z-10">
              <div className="w-full aspect-[3/2] relative overflow-hidden rounded-sm shadow-md bg-neutral-200 grayscale group-hover:grayscale-0 transition-all duration-700">
                <Image
                  src="/images/landing/workflow-step-2-process.png"
                  alt="Fountain Pen on Notes"
                  fill
                  className="object-cover"
                />
                <div className="absolute inset-0 flex flex-col items-center justify-center text-neutral-400 p-4 border border-neutral-300 m-2 border-dashed pointer-events-none">
                  <PenTool className="w-8 h-8 mb-2" />
                </div>
              </div>
              <div className="space-y-2">
                <div className="w-10 h-10 rounded-full bg-parchment-200 flex items-center justify-center font-serif text-xl text-royal mx-auto border border-royal/10">2</div>
                <h3 className="font-serif text-2xl text-charcoal">Process</h3>
                <p className="text-sm text-charcoal-muted max-w-[250px] mx-auto leading-relaxed">Our engine digests the theology, context, and tone of your message.</p>
              </div>
            </div>

            {/* Step 3 */}
            <div className="flex flex-col items-center text-center space-y-6 group relative z-10">
              <div className="w-full aspect-[3/2] relative overflow-hidden rounded-sm shadow-md bg-neutral-200 grayscale group-hover:grayscale-0 transition-all duration-700">
                <Image
                  src="/images/landing/workflow-step-3-output.png"
                  alt="Hands Holding PDF"
                  fill
                  className="object-cover"
                />
                <div className="absolute inset-0 flex flex-col items-center justify-center text-neutral-400 p-4 border border-neutral-300 m-2 border-dashed pointer-events-none">
                  <FileCheck className="w-8 h-8 mb-2" />
                </div>
              </div>
              <div className="space-y-2">
                <div className="w-10 h-10 rounded-full bg-parchment-200 flex items-center justify-center font-serif text-xl text-royal mx-auto border border-royal/10">3</div>
                <h3 className="font-serif text-2xl text-charcoal">Output</h3>
                <p className="text-sm text-charcoal-muted max-w-[250px] mx-auto leading-relaxed">Download ready-to-print PDFs and emails for your 5 PM small group.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 3: THE PURPLE COW */}
      <section className="w-full py-24 px-6 bg-white">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center gap-16">
          <div className="flex-1 space-y-8">
            <h2 className="font-serif text-5xl md:text-6xl text-charcoal leading-[0.9]">
              The AI That Speaks <br /> <span className="text-royal italic">Your Language.</span>
            </h2>
            <p className="font-sans text-lg text-charcoal/80 leading-relaxed max-w-md">
              Generic tools sound like a robot or a seminary textbook. SermonFlow sounds like <strong>you</strong>.
            </p>

            <div className="p-8 bg-parchment-50 border-l-4 border-gold rounded-r-sm space-y-4 shadow-sm">
              <h4 className="font-serif text-2xl text-charcoal">The "Ministry Voiceprint"</h4>
              <p className="text-sm text-charcoal-muted leading-relaxed">
                Does your church call volunteers "The Dream Team"? Do you call baptism "getting dunked"?
                We learn your insider lexicon so you don't have to edit the "soul" back into the text.
              </p>
            </div>

            <div className="flex items-center gap-2 text-charcoal-muted text-sm font-medium pt-2 bg-green-50 p-3 rounded-sm inline-flex border border-green-100">
              <ShieldCheck className="w-4 h-4 text-green-700" />
              <span className="text-green-800">Doctrinally Safe: Reformed, Wesleyan, or Non-Denom guardrails.</span>
            </div>
          </div>

          <div className="flex-1 w-full relative pl-0 md:pl-10">
            <div className="aspect-square bg-neutral-100 rounded-sm shadow-2xl relative overflow-hidden border border-neutral-200">
              <Image
                src="/images/landing/feature-brand-split.png"
                alt="Split Screen: Paper Bulletin vs. iPad Screen"
                fill
                className="object-cover"
              />
              <div className="absolute inset-0 flex flex-col items-center justify-center text-neutral-400 bg-neutral-50 p-8 border border-neutral-200 m-4 border-dashed/50 pointer-events-none opacity-50">
                <SplitSquareHorizontal className="w-12 h-12 mb-4" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 4: THE BENTO GRID */}
      <section className="w-full py-24 px-6 md:px-12 bg-parchment-50 border-t border-charcoal/5">
        <div className="max-w-6xl mx-auto">
          <div className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <h2 className="font-serif text-4xl text-charcoal mb-2">Stewardship Suite</h2>
              <p className="text-charcoal-muted font-light">Everything you need to create an echo.</p>
            </div>
            <div className="hidden md:block h-[1px] flex-1 bg-charcoal/10 ml-8 mb-2"></div>
          </div>

          {/* GRID */}
          <div className="grid grid-cols-1 md:grid-cols-3 grid-rows-auto md:grid-rows-[400px_350px] gap-6">

            {/* Card 1: Small Group (Tall Vertical) */}
            <div className="md:col-span-1 md:row-span-2 bg-white rounded-sm shadow-sm border border-charcoal/5 overflow-hidden flex flex-col group hover:shadow-lg transition-all duration-300">
              <div className="flex-1 bg-neutral-100 relative min-h-[300px]">
                <Image
                  src="/images/landing/bento-small-group.png"
                  alt="Vertical iPad Flatlay - Study Guide"
                  fill
                  className="object-cover"
                />
                <div className="absolute inset-0 flex flex-col items-center justify-center text-neutral-400 p-4 pointer-events-none opacity-0">
                  {/* Placeholder content hidden if image loads */}
                </div>
              </div>
              <div className="p-8 border-t border-neutral-100 relative z-10 bg-white">
                <div className="flex justify-between items-center mb-3">
                  <h3 className="font-serif text-2xl text-charcoal">Small Group Guide</h3>
                  <Download className="w-5 h-5 text-charcoal-muted group-hover:text-gold transition-colors" />
                </div>
                <p className="text-sm text-charcoal-muted leading-relaxed">Auto-generated icebreakers and deep dive questions ready for Sunday afternoon.</p>
              </div>
            </div>

            {/* Card 2: Branding (Square) */}
            <div className="bg-white rounded-sm shadow-sm border border-charcoal/5 overflow-hidden flex flex-col group hover:shadow-lg transition-all duration-300">
              <div className="flex-1 bg-neutral-100 relative min-h-[200px]">
                <Image
                  src="/images/landing/bento-branding.png"
                  alt="Pantone Chips & Laptop"
                  fill
                  className="object-cover"
                />
              </div>
              <div className="p-6 border-t border-neutral-100 relative z-10 bg-white">
                <h3 className="font-serif text-xl text-charcoal">Your Brand, Not Ours</h3>
                <p className="text-xs text-charcoal-muted mt-1">We apply your hex codes, logos, and fonts automatically.</p>
              </div>
            </div>

            {/* Card 3: Devotional (Square) */}
            <div className="bg-white rounded-sm shadow-sm border border-charcoal/5 overflow-hidden flex flex-col group hover:shadow-lg transition-all duration-300">
              <div className="flex-1 bg-neutral-100 relative min-h-[200px]">
                <Image
                  src="/images/landing/bento-devotional.png"
                  alt="Mobile Email View"
                  fill
                  className="object-cover"
                />
              </div>
              <div className="p-6 border-t border-neutral-100 relative z-10 bg-white">
                <h3 className="font-serif text-xl text-charcoal">The Mid-Week Echo</h3>
                <p className="text-xs text-charcoal-muted mt-1">5-Day email sequence to keep your people in the Word.</p>
              </div>
            </div>

            {/* Card 4: No Hallucinations (Wide) */}
            <div className="md:col-span-2 bg-charcoal text-parchment-50 rounded-sm shadow-sm border border-charcoal/5 overflow-hidden flex flex-col md:flex-row items-center relative group">
              <div className="w-full md:w-1/2 h-[200px] md:h-full bg-neutral-800 relative">
                <Image
                  src="/images/landing/bento-safety.png"
                  alt="Magnifying Glass on Text"
                  fill
                  className="object-cover"
                />
              </div>
              <div className="flex-1 p-8 md:p-10 space-y-4 text-left w-full">
                <div className="flex items-center gap-3 mb-2">
                  <CheckCircle2 className="w-5 h-5 text-gold" />
                  <span className="font-sans text-xs uppercase tracking-widest text-gold font-semibold">Theological Safety</span>
                </div>
                <h3 className="font-serif text-3xl text-white">No Hallucinations.</h3>
                <p className="text-white/70 text-sm leading-relaxed">
                  We don't invent scripture. Every point generated is anchored to your specific transcript text.
                </p>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* SECTION 5: THE OFFER */}
      <section className="w-full py-32 px-4 bg-royal-deep text-center relative overflow-hidden">
        {/* Background Texture */}
        <div className="absolute inset-0 opacity-5 bg-texture bg-white"></div>

        <div className="relative z-10 max-w-2xl mx-auto space-y-8">
          <h2 className="font-serif text-5xl md:text-6xl text-white drop-shadow-md">Try It This Sunday.</h2>
          <p className="font-sans text-xl text-white/80 font-light">
            You’ve already done the hard work of writing the sermon. <br />Let us handle the heavy lifting of distribution.
          </p>

          <div className="flex flex-col items-center gap-6 pt-4">
            <Link href="/login" className="bg-gold hover:bg-gold-hover text-charcoal font-sans font-bold text-lg py-5 px-12 rounded-sm shadow-2xl hover:shadow-gold/20 transition-all transform hover:-translate-y-1">
              Start Your Free Sunday Bundle
            </Link>
            <div className="flex items-center gap-4 text-white/40 text-sm font-sans">
              <span className="flex items-center gap-1"><CreditCard className="w-3 h-3" /> No credit card required</span>
              <span>•</span>
              <span className="flex items-center gap-1"><CalendarOff className="w-3 h-3" /> Cancel anytime</span>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="w-full py-16 bg-charcoal text-center border-t border-white/5">
        <div className="max-w-7xl mx-auto px-6 space-y-8">
          <div className="font-serif text-3xl text-parchment-100/30 tracking-widest">SOLI DEO GLORIA</div>
          <div className="flex justify-center gap-8 text-white/40 text-sm font-sans">
            <a href="#" className="hover:text-white transition-colors">Manifesto</a>
            <a href="#" className="hover:text-white transition-colors">Privacy</a>
            <a href="#" className="hover:text-white transition-colors">Contact</a>
          </div>
          <p className="text-xs text-white/20 mt-8 font-sans">© 2026 SermonFlow. Built for the Church.</p>
        </div>
      </footer>
    </div>
  );
}
