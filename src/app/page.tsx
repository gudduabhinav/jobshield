import Link from "next/link";
import {
  Shield,
  ArrowRight,
  ExternalLink,
  AlertTriangle,
  Activity,
  HeartPulse,
  Repeat,
  Search,
  Zap,
  CheckCircle,
  Eye,
  Lock,
} from "lucide-react";

const FEATURES = [
  {
    icon: HeartPulse,
    title: "Self-Healing Collection",
    description:
      "When target websites change their layout, the scraper detects the failure, self-heals, and recovers data extraction automatically.",
  },
  {
    icon: AlertTriangle,
    title: "Scam Risk Intelligence",
    description:
      "Deterministic risk scoring analyzes job postings for suspicious patterns, payment requests, and deceptive language to flag high-risk listings.",
  },
  {
    icon: Repeat,
    title: "Job Repost Detection",
    description:
      "Identifies duplicate and repeatedly reposted job listings across sources, helping you spot stale or fake opportunities.",
  },
];

const PIPELINE_STEPS = [
  { icon: Search, label: "Public Web Data" },
  { icon: Zap, label: "Bright Data Scraper" },
  { icon: Eye, label: "Validation" },
  { icon: HeartPulse, label: "Self-Healing" },
  { icon: Shield, label: "Job Intelligence" },
];

const STATS = [
  { value: "1,284", label: "Jobs Analyzed", color: "text-emerald-400" },
  { value: "120", label: "High Risk Detected", color: "text-red-400" },
  { value: "97.8%", label: "Extraction Quality", color: "text-emerald-400" },
  { value: "100%", label: "Recovery Rate", color: "text-blue-400" },
];

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border/50">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
              <Shield className="h-4.5 w-4.5 text-emerald-500" />
            </div>
            <span className="text-lg font-bold tracking-tight">JobShield</span>
          </Link>
          <nav className="flex items-center gap-6">
            <Link
              href="/demo"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Demo
            </Link>
            <Link
              href="/dashboard"
              className="text-sm bg-emerald-500 text-white px-4 py-2 rounded-lg hover:bg-emerald-600 transition-colors font-medium"
            >
              Open Dashboard
            </Link>
          </nav>
        </div>
      </header>

      <main>
        {/* Hero */}
        <section className="relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,oklch(0.696_0.17_162.48/0.08),transparent)]" />
          <div className="relative max-w-6xl mx-auto px-6 pt-24 pb-20 text-center">
            <div className="inline-flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 rounded-full px-4 py-1.5 text-sm text-emerald-500 mb-8">
              <Activity className="h-3.5 w-3.5" />
              Powered by Bright Data Scraper Studio
            </div>

            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight mb-6 leading-[1.1]">
              Job
              <span className="text-emerald-500">Shield</span>
            </h1>

            <p className="text-xl sm:text-2xl text-muted-foreground max-w-2xl mx-auto mb-3 leading-relaxed">
              Find suspicious job postings before they waste your time.
            </p>
            <p className="text-base text-muted-foreground/70 max-w-xl mx-auto mb-12">
              A self-healing job intelligence platform powered by real-time web
              data. When websites change, our scraper adapts automatically.
            </p>

            <div className="flex items-center justify-center gap-4">
              <Link
                href="/dashboard/jobs"
                className="bg-emerald-500 text-white px-7 py-3 rounded-lg font-medium hover:bg-emerald-600 transition-all inline-flex items-center gap-2 text-sm shadow-lg shadow-emerald-500/20"
              >
                Explore Jobs
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/demo"
                className="border border-border px-7 py-3 rounded-lg font-medium hover:bg-muted transition-all inline-flex items-center gap-2 text-sm"
              >
                Watch Demo
                <Activity className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </section>

        {/* Stats Bar */}
        <section className="border-y border-border/50">
          <div className="max-w-6xl mx-auto px-6 py-10 grid grid-cols-2 md:grid-cols-4 gap-8">
            {STATS.map((stat) => (
              <div key={stat.label} className="text-center">
                <div className={`text-3xl sm:text-4xl font-bold ${stat.color}`}>
                  {stat.value}
                </div>
                <div className="text-sm text-muted-foreground mt-2">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Features */}
        <section className="max-w-6xl mx-auto px-6 py-24">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              Intelligence Platform Features
            </h2>
            <p className="text-muted-foreground max-w-lg mx-auto">
              Built to protect job seekers with real-time analysis and
              resilient data collection
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {FEATURES.map((feature) => (
              <div
                key={feature.title}
                className="group border border-border/50 rounded-2xl p-8 bg-card/50 hover:border-emerald-500/30 hover:bg-card transition-all"
              >
                <div className="h-12 w-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mb-6 group-hover:bg-emerald-500/20 transition-colors">
                  <feature.icon className="h-5 w-5 text-emerald-500" />
                </div>
                <h3 className="font-semibold text-lg mb-3">{feature.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Pipeline */}
        <section className="border-y border-border/50">
          <div className="max-w-6xl mx-auto px-6 py-24">
            <div className="text-center mb-16">
              <h2 className="text-3xl sm:text-4xl font-bold mb-4">
                How It Works
              </h2>
              <p className="text-muted-foreground max-w-lg mx-auto">
                The complete data pipeline from web to intelligence
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-2">
              {PIPELINE_STEPS.map((step, i) => (
                <div key={step.label} className="flex items-center gap-2 sm:gap-0">
                  <div className="flex flex-col items-center gap-3 px-4 sm:px-6">
                    <div className="h-14 w-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                      <step.icon className="h-6 w-6 text-emerald-500" />
                    </div>
                    <span className="text-sm font-medium text-center whitespace-nowrap">
                      {step.label}
                    </span>
                  </div>
                  {i < PIPELINE_STEPS.length - 1 && (
                    <div className="hidden sm:block w-12 h-px bg-border" />
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Self-Healing Callout */}
        <section className="max-w-6xl mx-auto px-6 py-24">
          <div className="border border-border/50 rounded-2xl bg-card/50 p-8 sm:p-12">
            <div className="grid md:grid-cols-2 gap-10 items-center">
              <div>
                <div className="inline-flex items-center gap-2 bg-amber-500/10 border border-amber-500/20 rounded-full px-3 py-1 text-xs text-amber-500 mb-6">
                  <Zap className="h-3 w-3" />
                  Self-Healing Technology
                </div>
                <h2 className="text-2xl sm:text-3xl font-bold mb-4">
                  The website changed.
                  <br />
                  <span className="text-emerald-500">
                    The scraper adapted.
                  </span>
                  <br />
                  The data kept flowing.
                </h2>
                <p className="text-muted-foreground leading-relaxed mb-6">
                  When target websites change their HTML structure, JobShield
                  detects the extraction failure, triggers Bright Data&apos;s
                  self-healing workflow, and recovers structured data without
                  manual intervention.
                </p>
                <Link
                  href="/demo"
                  className="inline-flex items-center gap-2 text-sm text-emerald-500 hover:text-emerald-400 font-medium transition-colors"
                >
                  Watch the demo
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
              <div className="bg-background rounded-xl border border-border/50 p-6 space-y-4">
                <div className="flex items-center gap-3">
                  <CheckCircle className="h-4 w-4 text-emerald-500" />
                  <span className="text-sm">Scraper healthy — 1,284 records</span>
                </div>
                <div className="flex items-center gap-3">
                  <AlertTriangle className="h-4 w-4 text-red-500" />
                  <span className="text-sm">
                    Extraction failed — layout changed
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <Activity className="h-4 w-4 text-amber-500" />
                  <span className="text-sm">Validation detected anomalies</span>
                </div>
                <div className="flex items-center gap-3">
                  <Zap className="h-4 w-4 text-blue-500" />
                  <span className="text-sm">Self-healing initiated</span>
                </div>
                <div className="flex items-center gap-3">
                  <Repeat className="h-4 w-4 text-violet-500" />
                  <span className="text-sm">Extraction repaired</span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle className="h-4 w-4 text-emerald-500" />
                  <span className="text-sm font-medium">
                    1,284 records recovered — 97.8% quality
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Disclaimer */}
        <section className="max-w-6xl mx-auto px-6 pb-12">
          <div className="bg-muted/30 rounded-xl p-6 text-center">
            <Lock className="h-4 w-4 text-muted-foreground mx-auto mb-2" />
            <p className="text-xs text-muted-foreground leading-relaxed max-w-2xl mx-auto">
              <strong className="text-foreground/80">Disclaimer:</strong>{" "}
              JobShield provides automated risk signals for informational
              purposes only. Scores are generated by an algorithm and are not a
              definitive determination of fraud or illegality. Always verify job
              opportunities through official company channels.
            </p>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-border/50">
        <div className="max-w-6xl mx-auto px-6 py-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="h-6 w-6 rounded-md bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
              <Shield className="h-3 w-3 text-emerald-500" />
            </div>
            <span className="text-sm font-semibold">JobShield</span>
          </div>
          <p className="text-xs text-muted-foreground">
            Built for WeMakeDevs &quot;Into the Scrape-Verse&quot; Hackathon
          </p>
          <a
            href="https://brightdata.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1 transition-colors"
          >
            Powered by Bright Data
            <ExternalLink className="h-3 w-3" />
          </a>
        </div>
      </footer>
    </div>
  );
}
