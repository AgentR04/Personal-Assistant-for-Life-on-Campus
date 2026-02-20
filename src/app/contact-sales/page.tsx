"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Building2,
  Mail,
  Phone,
  User,
  MessageSquare,
  ArrowRight,
  CheckCircle,
} from "lucide-react";

export default function ContactSalesPage() {
  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    collegeName: "",
    studentCount: "",
    message: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // In production, send to backend/CRM
    console.log("Contact form submitted:", formData);
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-mesh">
        <div className="mx-auto max-w-2xl px-6 py-20">
          <div className="rounded-3xl border border-chart-1/30 bg-chart-1/10 p-12 text-center neu-flat">
            <div className="mb-6 flex justify-center">
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-chart-1">
                <CheckCircle className="h-10 w-10 text-white" />
              </div>
            </div>

            <h1 className="mb-4 text-3xl font-bold">Thank You!</h1>
            <p className="mb-8 text-lg text-muted-foreground">
              Our sales team will contact you within 24 hours to discuss your requirements.
            </p>

            <Link
              href="/"
              className="inline-flex h-12 items-center gap-2 rounded-full bg-foreground px-8 font-semibold text-background transition-all hover:scale-[1.02]"
            >
              Back to Home
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-mesh">
      <div className="mx-auto max-w-5xl px-6 py-12">
        {/* Header */}
        <div className="mb-12 text-center">
          <Link href="/" className="inline-block mb-6">
            <span className="text-2xl font-bold">P.A.L.</span>
          </Link>
          <h1 className="text-4xl font-bold">Contact Our Sales Team</h1>
          <p className="mt-4 text-lg text-muted-foreground">
            Let's discuss how P.A.L. can transform your institution's onboarding process
          </p>
        </div>

        <div className="grid gap-8 lg:grid-cols-2">
          {/* Contact Form */}
          <div className="rounded-3xl border border-border/50 bg-card p-8 neu-flat">
            <h2 className="mb-6 text-2xl font-bold">Get in Touch</h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="mb-2 block text-sm font-medium">
                  Full Name *
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    className="w-full rounded-xl border border-border bg-background py-3 pl-11 pr-4 focus:outline-none focus:ring-2 focus:ring-ring"
                    placeholder="John Doe"
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-medium">
                    Email Address *
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                    <input
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) =>
                        setFormData({ ...formData, email: e.target.value })
                      }
                      className="w-full rounded-xl border border-border bg-background py-3 pl-11 pr-4 focus:outline-none focus:ring-2 focus:ring-ring"
                      placeholder="john@college.edu"
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium">
                    Phone Number *
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                    <input
                      type="tel"
                      required
                      value={formData.phone}
                      onChange={(e) =>
                        setFormData({ ...formData, phone: e.target.value })
                      }
                      className="w-full rounded-xl border border-border bg-background py-3 pl-11 pr-4 focus:outline-none focus:ring-2 focus:ring-ring"
                      placeholder="+91-9876543210"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium">
                  College/Institution Name *
                </label>
                <div className="relative">
                  <Building2 className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type="text"
                    required
                    value={formData.collegeName}
                    onChange={(e) =>
                      setFormData({ ...formData, collegeName: e.target.value })
                    }
                    className="w-full rounded-xl border border-border bg-background py-3 pl-11 pr-4 focus:outline-none focus:ring-2 focus:ring-ring"
                    placeholder="ABC Engineering College"
                  />
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium">
                  Number of Students *
                </label>
                <select
                  required
                  value={formData.studentCount}
                  onChange={(e) =>
                    setFormData({ ...formData, studentCount: e.target.value })
                  }
                  className="w-full rounded-xl border border-border bg-background py-3 px-4 focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="">Select range</option>
                  <option value="0-1000">0 - 1,000 students</option>
                  <option value="1000-5000">1,000 - 5,000 students</option>
                  <option value="5000-10000">5,000 - 10,000 students</option>
                  <option value="10000+">10,000+ students</option>
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium">
                  Message (Optional)
                </label>
                <div className="relative">
                  <MessageSquare className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
                  <textarea
                    value={formData.message}
                    onChange={(e) =>
                      setFormData({ ...formData, message: e.target.value })
                    }
                    className="w-full rounded-xl border border-border bg-background py-3 pl-11 pr-4 focus:outline-none focus:ring-2 focus:ring-ring"
                    rows={4}
                    placeholder="Tell us about your requirements..."
                  />
                </div>
              </div>

              <button
                type="submit"
                className="flex h-12 w-full items-center justify-center gap-2 rounded-full bg-foreground font-semibold text-background transition-all hover:scale-[1.02]"
              >
                Submit Request
                <ArrowRight className="h-4 w-4" />
              </button>
            </form>
          </div>

          {/* Info Section */}
          <div className="space-y-6">
            {/* Contact Info */}
            <div className="rounded-3xl border border-border/50 bg-card p-8 neu-flat">
              <h3 className="mb-6 text-xl font-bold">Get in Touch</h3>

              <div className="space-y-4">
                <div className="flex items-start gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-secondary">
                    <Mail className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="font-semibold">Email</div>
                    <a
                      href="mailto:sales@pal.edu"
                      className="text-sm text-muted-foreground hover:text-foreground"
                    >
                      sales@pal.edu
                    </a>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-secondary">
                    <Phone className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="font-semibold">Phone</div>
                    <a
                      href="tel:+919876543210"
                      className="text-sm text-muted-foreground hover:text-foreground"
                    >
                      +91-98765 43210
                    </a>
                  </div>
                </div>
              </div>
            </div>

            {/* Why Choose Us */}
            <div className="rounded-3xl border border-border/50 bg-card p-8 neu-flat">
              <h3 className="mb-6 text-xl font-bold">Why Choose P.A.L.?</h3>

              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 shrink-0 text-chart-1" />
                  <div className="text-sm text-muted-foreground">
                    <span className="font-semibold text-foreground">
                      AI-Powered Automation
                    </span>
                    <br />
                    Reduce admin workload by 70% with intelligent document processing
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 shrink-0 text-chart-1" />
                  <div className="text-sm text-muted-foreground">
                    <span className="font-semibold text-foreground">
                      Proven Results
                    </span>
                    <br />
                    85% query deflection rate and 3-day onboarding completion
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 shrink-0 text-chart-1" />
                  <div className="text-sm text-muted-foreground">
                    <span className="font-semibold text-foreground">
                      Dedicated Support
                    </span>
                    <br />
                    24/7 technical support and dedicated account manager
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 shrink-0 text-chart-1" />
                  <div className="text-sm text-muted-foreground">
                    <span className="font-semibold text-foreground">
                      Enterprise Security
                    </span>
                    <br />
                    SOC 2 compliant with SSO, SAML, and data encryption
                  </div>
                </div>
              </div>
            </div>

            {/* Testimonial */}
            <div className="rounded-3xl border border-border/50 bg-gradient-to-br from-chart-1/10 to-chart-3/10 p-8 neu-flat">
              <p className="mb-4 text-sm italic text-muted-foreground">
                "P.A.L. transformed our onboarding process. What used to take 2 weeks now takes 3 days. Our admin team can finally focus on student support instead of paperwork."
              </p>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary font-bold">
                  DR
                </div>
                <div>
                  <div className="font-semibold text-sm">Dr. Rajesh Kumar</div>
                  <div className="text-xs text-muted-foreground">
                    Dean, XYZ Engineering College
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
