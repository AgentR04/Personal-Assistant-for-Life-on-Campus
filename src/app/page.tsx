import Link from "next/link";
import Image from "next/image";
import {
  MessageCircle,
  FileCheck,
  Users,
  LayoutDashboard,
  ArrowRight,
  Bot,
  Sparkles,
  Shield,
  Check,
  Building2,
  Zap,
  Crown,
  Wifi,
  Camera,
  CreditCard,
  GraduationCap,
  Mail,
} from "lucide-react";

const features = [
  {
    icon: MessageCircle,
    title: "AI Chat Assistant",
    description:
      "Get instant answers about campus rules, deadlines, and academics — powered by RAG with your college knowledge base.",
    href: "/chat",
  },
  {
    icon: FileCheck,
    title: "Smart-Scan Documents",
    description:
      "Upload marksheets and IDs. Vision AI extracts data, validates against records, and flags discrepancies in seconds.",
    href: "/documents",
  },
  {
    icon: Users,
    title: "Find My Tribe",
    description:
      "Connect with classmates who share your interests — coding, gaming, music, and more. Build your campus network.",
    href: "/tribe",
  },
  {
    icon: LayoutDashboard,
    title: "Lifecycle Dashboard",
    description:
      "Track your onboarding progress from document submission to fee payment to hostel allotment and beyond.",
    href: "/dashboard",
  },
];

const stats = [
  { value: "70%", label: "Less Admin Work" },
  { value: "85%", label: "Query Deflection" },
  { value: "3 Days", label: "Onboarding Speed" },
  { value: "3s", label: "Doc Verification" },
];

const pricingPlans = [
  {
    name: "P.A.L Basic",
    icon: Building2,
    price: "₹7,99,999",
    period: "/year",
    description: "Complete onboarding solution for your institution",
    students: "Up to 5,000 students",
    features: [
      "AI Chat Assistant (RAG-powered)",
      "Smart Document Verification (Vision AI)",
      "Student Lifecycle Dashboard",
      "Find My Tribe (Social Matching)",
      "Wellness Monitoring",
      "Bulk User Upload (AI-powered)",
      "Advanced Analytics & Reports",
      "Email & Chat Support",
      "20 Admin Accounts",
      "Custom Branding",
    ],
    cta: "Start Free Trial",
    popular: true,
  },
  {
    name: "P.A.L Pro",
    icon: Crown,
    price: "Custom",
    period: "",
    description: "Advanced features for next-gen campus experience",
    students: "Unlimited students",
    features: [
      "Everything in P.A.L Basic",
      "IoT-Based Campus Integration",
      "AR-Based Campus Tour",
      "Fee Payment Portal",
      "Alumni Connect Platform",
      "Multi-Campus Support",
      "Dedicated Account Manager",
      "Priority Support (24/7)",
      "Custom AI Training",
      "White-Label Solution",
      "API Access & Custom Integrations",
      "SLA Guarantee (99.9% uptime)",
    ],
    cta: "Contact Sales",
    popular: false,
    note: "Need just one Pro feature? Contact our sales team for custom pricing",
  },
];

export default function Home() {
  return (
    <div className="gradient-mesh">
      {/* Hero Section */}
      <section className="relative overflow-hidden px-6 pt-16 pb-20">
        <div className="mx-auto max-w-5xl text-center">
          {/* Floating badge */}
          <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-secondary px-5 py-2 text-sm font-medium text-muted-foreground neu-flat">
            <Sparkles className="h-4 w-4" />
            AI-Powered Campus Onboarding
          </div>

          <h1 className="mx-auto max-w-3xl text-4xl font-bold leading-[1.1] tracking-tight sm:text-5xl lg:text-6xl">
            Your Digital{" "}
            <span className="relative">
              Senior
              <span className="absolute -bottom-1 left-0 h-2 w-full rounded-full iridescent-wave opacity-60" />
            </span>
            {" "}for Campus Life
          </h1>

          <div className="mx-auto mt-6 flex justify-center">
            <Image 
              src="/pal-logo-light.svg"
              alt="P.A.L. Logo"
              width={160}
              height={160}
              className="h-24 w-24 sm:h-28 sm:w-28 lg:h-32 lg:w-32 dark:hidden"
            />
            <Image 
              src="/pal-logo-dark.svg"
              alt="P.A.L. Logo"
              width={160}
              height={160}
              className="h-24 w-24 sm:h-28 sm:w-28 lg:h-32 lg:w-32 hidden dark:inline"
            />
          </div>

          <p className="mx-auto max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg">
            P.A.L. transforms chaotic college onboarding into a seamless,
            proactive journey. Smart document scanning, personalized guidance,
            and social matching — all in one intelligent assistant.
          </p>

          <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link
              href="/signup/college"
              className="group flex h-12 items-center gap-2 rounded-full bg-foreground px-7 text-base font-semibold text-background transition-all hover:scale-[1.02] hover:shadow-lg"
            >
              <Building2 className="h-5 w-5" />
              Get Started for Your College
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
            <Link
              href="/login"
              className="flex h-12 items-center gap-2 rounded-full border border-border px-7 text-base font-semibold transition-all hover:bg-secondary neu-flat"
            >
              <Bot className="h-5 w-5" />
              Login
            </Link>
          </div>

          <p className="mt-5 text-sm text-muted-foreground">
            🎓 Free 30-day trial • No credit card required • Setup in 5 minutes
          </p>
        </div>

        {/* Decorative floating orbs */}
        <div className="pointer-events-none absolute top-20 left-10 h-72 w-72 rounded-full bg-chart-1/10 blur-3xl" />
        <div className="pointer-events-none absolute top-40 right-10 h-56 w-56 rounded-full bg-chart-3/10 blur-3xl" />
      </section>

      {/* Stats bar */}
      <section className="border-y border-border/50 bg-background/60 backdrop-blur-sm">
        <div className="mx-auto grid max-w-5xl grid-cols-2 gap-6 px-6 py-8 sm:grid-cols-4">
          {stats.map((stat) => (
            <div key={stat.label} className="text-center">
              <div className="text-2xl font-bold tracking-tight">
                {stat.value}
              </div>
              <div className="mt-1 text-xs text-muted-foreground">
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section id="features" className="px-6 py-24">
        <div className="mx-auto max-w-5xl">
          <div className="mb-16 text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Everything You Need, Day One
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              From admission to academics, P.A.L. guides every step of your
              campus journey.
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2">
            {features.map((feature) => (
              <Link
                key={feature.title}
                href={feature.href}
                className="group rounded-3xl border border-border/50 bg-card p-8 transition-all hover:border-border hover:shadow-lg neu-flat"
              >
                <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-secondary">
                  <feature.icon className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-semibold tracking-tight">
                  {feature.title}
                </h3>
                <p className="mt-2 leading-relaxed text-muted-foreground">
                  {feature.description}
                </p>
                <div className="mt-4 flex items-center gap-1 text-sm font-medium opacity-0 transition-opacity group-hover:opacity-100">
                  Explore
                  <ArrowRight className="h-3.5 w-3.5" />
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="border-t border-border/50 bg-background/60 px-6 py-24 backdrop-blur-sm">
        <div className="mx-auto max-w-5xl">
          <h2 className="mb-16 text-center text-3xl font-bold tracking-tight sm:text-4xl">
            Your Day 1 Journey
          </h2>
          <div className="grid gap-8 sm:grid-cols-3">
            {[
              {
                step: "01",
                title: "Upload Documents",
                desc: "Snap a photo of your marksheet. Vision AI verifies it in 3 seconds.",
                icon: FileCheck,
              },
              {
                step: "02",
                title: "Get Personalized Guidance",
                desc: "P.A.L. unlocks your dashboard with a customized onboarding checklist.",
                icon: Sparkles,
              },
              {
                step: "03",
                title: "Connect & Thrive",
                desc: "Find your tribe, complete your setup, and start campus life stress-free.",
                icon: Users,
              },
            ].map((item) => (
              <div
                key={item.step}
                className="relative rounded-3xl border border-border/50 bg-card p-8 neu-flat"
              >
                <span className="text-5xl font-bold text-muted-foreground/20">
                  {item.step}
                </span>
                <div className="mt-4 mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-foreground">
                  <item.icon className="h-5 w-5 text-background" />
                </div>
                <h3 className="text-lg font-semibold">{item.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Trust bar */}
      <section className="border-t border-border/50 px-6 py-16">
        <div className="mx-auto flex max-w-3xl flex-col items-center gap-6 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-secondary">
            <Shield className="h-6 w-6" />
          </div>
          <h3 className="text-xl font-semibold">Built with Privacy First</h3>
          <p className="text-muted-foreground">
            PII masking on all document scans. Hallucination guardrails on every
            AI response. Your data stays secure.
          </p>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="border-t border-border/50 px-6 py-16">
        <div className="mx-auto max-w-7xl">
          <div className="mb-12 text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Simple, Transparent Pricing
            </h2>
            <p className="mt-3 text-base text-muted-foreground">
              Choose the perfect plan for your institution. All plans include 30-day free trial.
            </p>
          </div>

          <div className="grid gap-6 lg:grid-cols-2 max-w-6xl mx-auto">
            {pricingPlans.map((plan) => (
              <div
                key={plan.name}
                className="relative rounded-3xl border border-border/50 bg-card p-6 transition-all hover:shadow-xl neu-flat"
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="rounded-full bg-foreground px-3 py-1 text-xs font-semibold text-background">
                      RECOMMENDED
                    </span>
                  </div>
                )}

                <div className="mb-5">
                  <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-secondary">
                    <plan.icon className="h-5 w-5" />
                  </div>
                  <h3 className="text-xl font-bold">{plan.name}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {plan.description}
                  </p>
                </div>

                <div className="mb-5">
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-bold tracking-tight">
                      {plan.price}
                    </span>
                    {plan.period && (
                      <span className="text-sm text-muted-foreground">{plan.period}</span>
                    )}
                  </div>
                  <p className="mt-1 text-sm font-medium text-chart-1">
                    {plan.students}
                  </p>
                </div>

                <Link
                  href={plan.name === "P.A.L Pro" ? "/contact-sales" : "/signup/college"}
                  className="mb-5 flex h-11 w-full items-center justify-center gap-2 rounded-full bg-foreground text-background font-semibold transition-all hover:scale-[1.02]"
                >
                  {plan.cta}
                  <ArrowRight className="h-4 w-4" />
                </Link>

                <div className="space-y-2.5">
                  {plan.features.map((feature) => (
                    <div key={feature} className="flex items-start gap-2.5">
                      <Check className="h-4 w-4 shrink-0 text-chart-1 mt-0.5" />
                      <span className="text-sm text-muted-foreground">
                        {feature}
                      </span>
                    </div>
                  ))}
                </div>

                {plan.note && (
                  <div className="mt-5 rounded-xl border border-chart-1/30 bg-chart-1/5 p-3">
                    <div className="flex items-start gap-2.5">
                      <Mail className="h-4 w-4 shrink-0 text-chart-1 mt-0.5" />
                      <p className="text-xs text-muted-foreground">
                        {plan.note}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Pro Features Highlight */}
          <div className="mt-12 rounded-3xl border border-border/50 bg-gradient-to-br from-chart-1/10 via-chart-2/10 to-chart-3/10 p-6 neu-flat">
            <h3 className="mb-5 text-center text-xl font-bold">
              P.A.L Pro Exclusive Features
            </h3>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {[
                {
                  icon: Wifi,
                  title: "IoT Integration",
                  desc: "Smart campus devices",
                },
                {
                  icon: Camera,
                  title: "AR Campus Tour",
                  desc: "Immersive AR experience",
                },
                {
                  icon: CreditCard,
                  title: "Fee Portal",
                  desc: "Payment gateway",
                },
                {
                  icon: GraduationCap,
                  title: "Alumni Connect",
                  desc: "Alumni networking",
                },
              ].map((feature) => (
                <div
                  key={feature.title}
                  className="rounded-xl border border-border/50 bg-background p-4 text-center"
                >
                  <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-secondary">
                    <feature.icon className="h-5 w-5" />
                  </div>
                  <h4 className="mb-1 text-sm font-semibold">{feature.title}</h4>
                  <p className="text-xs text-muted-foreground">{feature.desc}</p>
                </div>
              ))}
            </div>
            <div className="mt-5 text-center">
              <p className="mb-3 text-xs text-muted-foreground">
                Want just one of these features? We offer flexible à la carte pricing.
              </p>
              <Link
                href="/contact-sales"
                className="inline-flex h-10 items-center gap-2 rounded-full border border-border bg-background px-5 text-sm font-semibold transition-all hover:bg-secondary"
              >
                <Mail className="h-4 w-4" />
                Contact Sales Team
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>

          <div className="mt-8 text-center">
            <p className="text-xs text-muted-foreground">
              All prices are in Indian Rupees (INR) and exclude GST (18%). 
              Need a custom plan? <Link href="/contact-sales" className="font-medium text-foreground hover:underline">Contact our sales team</Link>
            </p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="border-t border-border/50 bg-gradient-to-br from-chart-1/10 via-chart-2/10 to-chart-3/10 px-6 py-24">
        <div className="mx-auto max-w-4xl text-center">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Ready to Transform Your Campus Onboarding?
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Join leading institutions using P.A.L. to streamline student onboarding
          </p>
          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link
              href="/signup/college"
              className="group flex h-14 items-center gap-2 rounded-full bg-foreground px-8 text-base font-semibold text-background transition-all hover:scale-[1.02] hover:shadow-lg"
            >
              <Building2 className="h-5 w-5" />
              Start Your Free Trial
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
            <Link
              href="/contact-sales"
              className="flex h-14 items-center gap-2 rounded-full border border-border bg-background px-8 text-base font-semibold transition-all hover:bg-secondary"
            >
              Schedule a Demo
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/50 px-6 py-10">
        <div className="mx-auto flex max-w-5xl items-center justify-between">
          <div className="flex items-center gap-2">
            <Image 
              src="/pal-logo-light.svg"
              alt="P.A.L. Logo"
              width={32}
              height={32}
              className="h-8 w-8 dark:hidden"
            />
            <Image 
              src="/pal-logo-dark.svg"
              alt="P.A.L. Logo"
              width={32}
              height={32}
              className="h-8 w-8 hidden dark:inline"
            />
            <span className="text-sm font-semibold">P.A.L.</span>
          </div>
          <p className="text-sm text-muted-foreground">
            Personal Assistant for Life on Campus
          </p>
        </div>
      </footer>
    </div>
  );
}
