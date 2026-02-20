"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Building2,
  Mail,
  Lock,
  User,
  Phone,
  MapPin,
  ArrowRight,
  Check,
  CreditCard,
  Shield,
} from "lucide-react";

const plans = [
  {
    id: "starter",
    name: "Starter",
    price: 299999,
    priceDisplay: "₹2,99,999",
    students: "1,000",
  },
  {
    id: "professional",
    name: "Professional",
    price: 599999,
    priceDisplay: "₹5,99,999",
    students: "5,000",
    popular: true,
  },
  {
    id: "enterprise",
    name: "Enterprise",
    price: 1299999,
    priceDisplay: "₹12,99,999",
    students: "Unlimited",
  },
];

export default function CollegeSignupPage() {
  const router = useRouter();
  const [step, setStep] = useState(1); // 1: College Info, 2: Admin Info, 3: Plan Selection, 4: Payment
  const [loading, setLoading] = useState(false);

  // Form data
  const [collegeData, setCollegeData] = useState({
    collegeName: "",
    collegeEmail: "",
    collegePhone: "",
    collegeAddress: "",
    collegeCity: "",
    collegeState: "",
    studentCount: "",
  });

  const [adminData, setAdminData] = useState({
    adminName: "",
    adminEmail: "",
    adminPhone: "",
    password: "",
    confirmPassword: "",
  });

  const [selectedPlan, setSelectedPlan] = useState("professional");
  const [paymentMethod, setPaymentMethod] = useState("razorpay");

  const handleCollegeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setStep(2);
  };

  const handleAdminSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (adminData.password !== adminData.confirmPassword) {
      alert("Passwords do not match!");
      return;
    }
    setStep(3);
  };

  const handlePlanSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setStep(4);
  };

  const handlePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // Simulate payment processing
    setTimeout(() => {
      // In production, integrate with Razorpay/Stripe
      alert("Payment successful! Your account is being set up...");
      
      // Create super admin account
      const superAdminData = {
        ...collegeData,
        ...adminData,
        plan: selectedPlan,
        role: "super_admin",
        trialEndsAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      };

      // Store in localStorage for demo (in production, call API)
      localStorage.setItem("superAdminData", JSON.stringify(superAdminData));
      localStorage.setItem("token", "demo_super_admin_token");
      localStorage.setItem("userRole", "super_admin");

      setLoading(false);
      router.push("/admin/setup");
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-gradient-mesh">
      <div className="mx-auto max-w-4xl px-6 py-12">
        {/* Header */}
        <div className="mb-8 text-center">
          <Link href="/" className="inline-block mb-6">
            <span className="text-2xl font-bold">P.A.L.</span>
          </Link>
          <h1 className="text-4xl font-bold">Get Started with P.A.L.</h1>
          <p className="mt-2 text-muted-foreground">
            Set up your institution in minutes. Start your 30-day free trial.
          </p>
        </div>

        {/* Progress Steps */}
        <div className="mb-12 flex items-center justify-center gap-2">
          {[1, 2, 3, 4].map((s) => (
            <div key={s} className="flex items-center">
              <div
                className={`flex h-10 w-10 items-center justify-center rounded-full font-semibold transition-all ${
                  s === step
                    ? "bg-foreground text-background scale-110"
                    : s < step
                      ? "bg-chart-1 text-white"
                      : "bg-secondary text-muted-foreground"
                }`}
              >
                {s < step ? <Check className="h-5 w-5" /> : s}
              </div>
              {s < 4 && (
                <div
                  className={`h-1 w-12 transition-all ${
                    s < step ? "bg-chart-1" : "bg-secondary"
                  }`}
                />
              )}
            </div>
          ))}
        </div>

        {/* Step 1: College Information */}
        {step === 1 && (
          <div className="rounded-3xl border border-border/50 bg-card p-8 neu-flat">
            <div className="mb-6">
              <h2 className="text-2xl font-bold">College Information</h2>
              <p className="text-sm text-muted-foreground">
                Tell us about your institution
              </p>
            </div>

            <form onSubmit={handleCollegeSubmit} className="space-y-4">
              <div>
                <label className="mb-2 block text-sm font-medium">
                  College Name *
                </label>
                <div className="relative">
                  <Building2 className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type="text"
                    required
                    value={collegeData.collegeName}
                    onChange={(e) =>
                      setCollegeData({ ...collegeData, collegeName: e.target.value })
                    }
                    className="w-full rounded-xl border border-border bg-background py-3 pl-11 pr-4 focus:outline-none focus:ring-2 focus:ring-ring"
                    placeholder="ABC Engineering College"
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-medium">
                    Official Email *
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                    <input
                      type="email"
                      required
                      value={collegeData.collegeEmail}
                      onChange={(e) =>
                        setCollegeData({ ...collegeData, collegeEmail: e.target.value })
                      }
                      className="w-full rounded-xl border border-border bg-background py-3 pl-11 pr-4 focus:outline-none focus:ring-2 focus:ring-ring"
                      placeholder="admin@college.edu"
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
                      value={collegeData.collegePhone}
                      onChange={(e) =>
                        setCollegeData({ ...collegeData, collegePhone: e.target.value })
                      }
                      className="w-full rounded-xl border border-border bg-background py-3 pl-11 pr-4 focus:outline-none focus:ring-2 focus:ring-ring"
                      placeholder="+91-9876543210"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium">
                  Address *
                </label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
                  <textarea
                    required
                    value={collegeData.collegeAddress}
                    onChange={(e) =>
                      setCollegeData({ ...collegeData, collegeAddress: e.target.value })
                    }
                    className="w-full rounded-xl border border-border bg-background py-3 pl-11 pr-4 focus:outline-none focus:ring-2 focus:ring-ring"
                    rows={2}
                    placeholder="123 College Road"
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-medium">City *</label>
                  <input
                    type="text"
                    required
                    value={collegeData.collegeCity}
                    onChange={(e) =>
                      setCollegeData({ ...collegeData, collegeCity: e.target.value })
                    }
                    className="w-full rounded-xl border border-border bg-background py-3 px-4 focus:outline-none focus:ring-2 focus:ring-ring"
                    placeholder="Mumbai"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium">State *</label>
                  <input
                    type="text"
                    required
                    value={collegeData.collegeState}
                    onChange={(e) =>
                      setCollegeData({ ...collegeData, collegeState: e.target.value })
                    }
                    className="w-full rounded-xl border border-border bg-background py-3 px-4 focus:outline-none focus:ring-2 focus:ring-ring"
                    placeholder="Maharashtra"
                  />
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium">
                  Approximate Student Count *
                </label>
                <select
                  required
                  value={collegeData.studentCount}
                  onChange={(e) =>
                    setCollegeData({ ...collegeData, studentCount: e.target.value })
                  }
                  className="w-full rounded-xl border border-border bg-background py-3 px-4 focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="">Select range</option>
                  <option value="0-500">0 - 500 students</option>
                  <option value="500-1000">500 - 1,000 students</option>
                  <option value="1000-5000">1,000 - 5,000 students</option>
                  <option value="5000-10000">5,000 - 10,000 students</option>
                  <option value="10000+">10,000+ students</option>
                </select>
              </div>

              <button
                type="submit"
                className="flex h-12 w-full items-center justify-center gap-2 rounded-full bg-foreground font-semibold text-background transition-all hover:scale-[1.02]"
              >
                Continue
                <ArrowRight className="h-4 w-4" />
              </button>
            </form>
          </div>
        )}

        {/* Step 2: Admin Information */}
        {step === 2 && (
          <div className="rounded-3xl border border-border/50 bg-card p-8 neu-flat">
            <div className="mb-6">
              <h2 className="text-2xl font-bold">Super Admin Account</h2>
              <p className="text-sm text-muted-foreground">
                Create your primary administrator account
              </p>
            </div>

            <form onSubmit={handleAdminSubmit} className="space-y-4">
              <div>
                <label className="mb-2 block text-sm font-medium">
                  Full Name *
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type="text"
                    required
                    value={adminData.adminName}
                    onChange={(e) =>
                      setAdminData({ ...adminData, adminName: e.target.value })
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
                      value={adminData.adminEmail}
                      onChange={(e) =>
                        setAdminData({ ...adminData, adminEmail: e.target.value })
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
                      value={adminData.adminPhone}
                      onChange={(e) =>
                        setAdminData({ ...adminData, adminPhone: e.target.value })
                      }
                      className="w-full rounded-xl border border-border bg-background py-3 pl-11 pr-4 focus:outline-none focus:ring-2 focus:ring-ring"
                      placeholder="+91-9876543210"
                    />
                  </div>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-medium">
                    Password *
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                    <input
                      type="password"
                      required
                      minLength={8}
                      value={adminData.password}
                      onChange={(e) =>
                        setAdminData({ ...adminData, password: e.target.value })
                      }
                      className="w-full rounded-xl border border-border bg-background py-3 pl-11 pr-4 focus:outline-none focus:ring-2 focus:ring-ring"
                      placeholder="••••••••"
                    />
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Minimum 8 characters
                  </p>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium">
                    Confirm Password *
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                    <input
                      type="password"
                      required
                      minLength={8}
                      value={adminData.confirmPassword}
                      onChange={(e) =>
                        setAdminData({ ...adminData, confirmPassword: e.target.value })
                      }
                      className="w-full rounded-xl border border-border bg-background py-3 pl-11 pr-4 focus:outline-none focus:ring-2 focus:ring-ring"
                      placeholder="••••••••"
                    />
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="flex h-12 flex-1 items-center justify-center gap-2 rounded-full border border-border font-semibold transition-all hover:bg-secondary"
                >
                  Back
                </button>
                <button
                  type="submit"
                  className="flex h-12 flex-1 items-center justify-center gap-2 rounded-full bg-foreground font-semibold text-background transition-all hover:scale-[1.02]"
                >
                  Continue
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Step 3: Plan Selection */}
        {step === 3 && (
          <div className="rounded-3xl border border-border/50 bg-card p-8 neu-flat">
            <div className="mb-6">
              <h2 className="text-2xl font-bold">Choose Your Plan</h2>
              <p className="text-sm text-muted-foreground">
                30-day free trial included. Cancel anytime.
              </p>
            </div>

            <form onSubmit={handlePlanSubmit} className="space-y-4">
              <div className="space-y-3">
                {plans.map((plan) => (
                  <label
                    key={plan.id}
                    className={`flex cursor-pointer items-center justify-between rounded-xl border p-4 transition-all ${
                      selectedPlan === plan.id
                        ? "border-foreground bg-secondary"
                        : "border-border hover:bg-secondary/50"
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <input
                        type="radio"
                        name="plan"
                        value={plan.id}
                        checked={selectedPlan === plan.id}
                        onChange={(e) => setSelectedPlan(e.target.value)}
                        className="h-5 w-5"
                      />
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold">{plan.name}</span>
                          {plan.popular && (
                            <span className="rounded-full bg-chart-1 px-2 py-0.5 text-xs font-semibold text-white">
                              Popular
                            </span>
                          )}
                        </div>
                        <span className="text-sm text-muted-foreground">
                          Up to {plan.students} students
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xl font-bold">{plan.priceDisplay}</div>
                      <div className="text-xs text-muted-foreground">/year</div>
                    </div>
                  </label>
                ))}
              </div>

              <div className="rounded-xl bg-secondary/50 p-4">
                <div className="flex items-start gap-3">
                  <Shield className="h-5 w-5 shrink-0 text-chart-1" />
                  <div className="text-sm">
                    <p className="font-medium">30-Day Money-Back Guarantee</p>
                    <p className="text-muted-foreground">
                      Not satisfied? Get a full refund within 30 days, no questions asked.
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="flex h-12 flex-1 items-center justify-center gap-2 rounded-full border border-border font-semibold transition-all hover:bg-secondary"
                >
                  Back
                </button>
                <button
                  type="submit"
                  className="flex h-12 flex-1 items-center justify-center gap-2 rounded-full bg-foreground font-semibold text-background transition-all hover:scale-[1.02]"
                >
                  Continue to Payment
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Step 4: Payment */}
        {step === 4 && (
          <div className="rounded-3xl border border-border/50 bg-card p-8 neu-flat">
            <div className="mb-6">
              <h2 className="text-2xl font-bold">Payment Details</h2>
              <p className="text-sm text-muted-foreground">
                Secure payment powered by Razorpay
              </p>
            </div>

            <form onSubmit={handlePayment} className="space-y-6">
              {/* Order Summary */}
              <div className="rounded-xl border border-border bg-secondary/30 p-4">
                <h3 className="mb-3 font-semibold">Order Summary</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">
                      {plans.find((p) => p.id === selectedPlan)?.name} Plan
                    </span>
                    <span className="font-medium">
                      {plans.find((p) => p.id === selectedPlan)?.priceDisplay}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">GST (18%)</span>
                    <span className="font-medium">
                      ₹{((plans.find((p) => p.id === selectedPlan)?.price || 0) * 0.18).toLocaleString('en-IN')}
                    </span>
                  </div>
                  <div className="border-t border-border pt-2">
                    <div className="flex justify-between text-base">
                      <span className="font-semibold">Total</span>
                      <span className="font-bold">
                        ₹{((plans.find((p) => p.id === selectedPlan)?.price || 0) * 1.18).toLocaleString('en-IN')}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Payment Method */}
              <div>
                <label className="mb-3 block text-sm font-medium">
                  Payment Method
                </label>
                <div className="space-y-2">
                  <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-border p-4 hover:bg-secondary/50">
                    <input
                      type="radio"
                      name="payment"
                      value="razorpay"
                      checked={paymentMethod === "razorpay"}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                      className="h-5 w-5"
                    />
                    <CreditCard className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <div className="font-medium">Razorpay</div>
                      <div className="text-xs text-muted-foreground">
                        Credit/Debit Card, UPI, Net Banking
                      </div>
                    </div>
                  </label>
                </div>
              </div>

              {/* Trial Notice */}
              <div className="rounded-xl bg-chart-1/10 p-4">
                <p className="text-sm">
                  <span className="font-semibold">🎉 Free Trial Active:</span> You won't be charged for 30 days. Cancel anytime before the trial ends.
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setStep(3)}
                  disabled={loading}
                  className="flex h-12 flex-1 items-center justify-center gap-2 rounded-full border border-border font-semibold transition-all hover:bg-secondary disabled:opacity-50"
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex h-12 flex-1 items-center justify-center gap-2 rounded-full bg-foreground font-semibold text-background transition-all hover:scale-[1.02] disabled:opacity-50"
                >
                  {loading ? (
                    <>Processing...</>
                  ) : (
                    <>
                      Complete Setup
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </button>
              </div>

              <p className="text-center text-xs text-muted-foreground">
                By completing this purchase, you agree to our{" "}
                <Link href="/terms" className="underline">
                  Terms of Service
                </Link>{" "}
                and{" "}
                <Link href="/privacy" className="underline">
                  Privacy Policy
                </Link>
              </p>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
