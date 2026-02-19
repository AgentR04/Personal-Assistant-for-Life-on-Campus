"use client";

import { api } from "@/lib/api";
import { BookOpen, Bot, CheckCircle2, Loader2, Send, User } from "lucide-react";
import { useEffect, useRef, useState } from "react";

type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
  sources?: string[];
  timestamp: Date;
};

type StudentProfile = {
  name: string;
  collegeName: string;
  branch: string;
  year: string;
  hostelResident: boolean;
  interests: string[];
};

const ONBOARDING_QUESTIONS = [
  {
    key: "name",
    question:
      "👋 Welcome to **P.A.L.** — your Personal Assistant for Life on Campus!\n\nBefore we start, I'd like to know a bit about you so I can give personalized answers.\n\n**What's your name?**",
    placeholder: "Enter your name...",
    type: "text" as const,
  },
  {
    key: "collegeName",
    question:
      "Nice to meet you, {name}! 🎓\n\n**Which college/university are you from?**",
    placeholder: "e.g. VIT, BITS Pilani, IIT Bombay...",
    type: "text" as const,
  },
  {
    key: "branch",
    question: "Great! 📚\n\n**What's your branch/department?**",
    placeholder: "Select your branch",
    type: "select" as const,
    options: [
      "Computer Science",
      "Information Technology",
      "Electronics & Communication",
      "Mechanical Engineering",
      "Civil Engineering",
      "Chemical Engineering",
      "Electrical Engineering",
      "AI/ML",
      "Data Science",
      "Other",
    ],
  },
  {
    key: "year",
    question: "📖 **Which year/semester are you in?**",
    placeholder: "Select your year",
    type: "select" as const,
    options: ["1st Year", "2nd Year", "3rd Year", "4th Year", "Post Graduate"],
  },
  {
    key: "hostelResident",
    question: "🏠 **Are you a hostel resident?**",
    placeholder: "",
    type: "yesno" as const,
  },
  {
    key: "interests",
    question:
      "Almost done! 🎯\n\n**What are your interests?** *(Select all that apply)*",
    placeholder: "",
    type: "multiselect" as const,
    options: [
      "🎭 Cultural",
      "💻 Coding",
      "⚽ Sports",
      "🤖 Robotics",
      "📊 Data Science",
      "🎵 Music",
      "📸 Photography",
      "🎮 Gaming",
      "📝 Writing",
      "🧪 Research",
    ],
  },
];

const suggestedQuestions = [
  "📚 What are courses offered?",
  "💰 What is the fee structure?",
  "🏠 Tell me about hostel",
  "📖 Library timings?",
  "🍽️ What's on the canteen menu?",
  "🎓 Placement details?",
  "📅 Exam schedule?",
  "🏅 Sports facilities?",
  "💼 Scholarship info?",
  "📋 Documents needed for admission?",
  "🏫 College timings?",
  "🎭 Events in college?",
];

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Onboarding state
  const [onboardingStep, setOnboardingStep] = useState(-1); // -1 = checking, 0-5 = questions, 6+ = done
  const [profileComplete, setProfileComplete] = useState(false);
  const [studentProfile, setStudentProfile] = useState<StudentProfile>({
    name: "",
    collegeName: "",
    branch: "",
    year: "",
    hostelResident: false,
    interests: [],
  });
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);

  useEffect(() => {
    let mounted = true;
    const init = async () => {
      if (mounted) {
        await checkProfileAndInit();
      }
    };
    init();
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages, isTyping, onboardingStep]);

  const getTestModeResponse = (query: string): string => {
    const q = query.toLowerCase();
    const responses: Array<{ keywords: string[]; answer: string }> = [
      {
        keywords: ["fee", "fees", "payment", "tuition", "deadline", "pay"],
        answer:
          "**Fee Information:**\n\n📅 **Fee Deadline:** The fee payment deadline for this semester is typically within the first 2 weeks. Check your student portal for exact dates.\n\n💰 **Payment Methods:**\n• Online banking (recommended)\n• UPI / Net Banking\n• Demand Draft at the accounts office\n\n📞 Contact the Accounts Office at Block A, 1st Floor.",
      },
      {
        keywords: [
          "hostel",
          "room",
          "accommodation",
          "dorm",
          "allotment",
          "mess",
        ],
        answer:
          "**Hostel Information:**\n\n🏠 First-year students get shared rooms (2-3 per room).\n\n🍽️ **Mess Timings:**\n• Breakfast: 7:30 - 9:00 AM\n• Lunch: 12:30 - 2:00 PM\n• Dinner: 7:30 - 9:00 PM\n\n📞 Contact the Hostel Warden for queries.",
      },
      {
        keywords: [
          "subject",
          "course",
          "core",
          "elective",
          "syllabus",
          "class",
          "timetable",
        ],
        answer:
          "**Core Subjects (1st Year CS):**\n\n📚 Mathematics I/II, Physics/Chemistry, Programming in C/Python, Data Structures, Digital Electronics, English\n\n📋 Electives available from 3rd semester.\n⏰ Check the department notice board for timetable.",
      },
      {
        keywords: ["exam", "test", "marks", "grade", "gpa", "result"],
        answer:
          "**Exam Info:**\n\n📝 Mid-Sem: Week 7-8 | End-Sem: Per university calendar\n📊 Grading: Internal 30-40% + External 60-70%\n📞 Contact Examination Cell for results.",
      },
      {
        keywords: ["library", "book", "borrow", "study"],
        answer:
          "**Library:**\n\n📖 Mon-Fri: 8AM-9PM | Sat: 9AM-5PM\n📚 Borrow up to 3 books for 14 days\n📍 Central Academic Block, 2nd Floor",
      },
      {
        keywords: ["club", "society", "sports", "cultural", "event", "fest"],
        answer:
          "**Clubs & Activities:**\n\n🎭 Cultural: Drama, Music, Dance\n💻 Technical: Coding, Robotics, AI/ML\n⚽ Sports: Cricket, Football, Basketball\n\n📋 Register in the first 2 weeks!",
      },
      {
        keywords: ["hello", "hi", "hey", "namaste"],
        answer:
          "Hello! 👋 I'm **P.A.L.** - your campus assistant!\n\nAsk me about:\n• 📚 Academics\n• 🏠 Hostel & Mess\n• 💰 Fees\n• 📖 Library\n• 🎭 Clubs\n• 📶 WiFi & IT\n• 🧠 Wellness",
      },
      {
        keywords: ["thank", "thanks"],
        answer:
          "You're welcome! 😊 Feel free to ask anything else about campus life!",
      },
    ];

    let best: string | null = null;
    let bestScore = 0;
    for (const r of responses) {
      const score = r.keywords.filter((kw) => q.includes(kw)).length;
      if (score > bestScore) {
        bestScore = score;
        best = r.answer;
      }
    }
    return (
      best ||
      "I can help you with:\n• 📚 Academics & Exams\n• 🏠 Hostel & Mess\n• 💰 Fees & Deadlines\n• 📖 Library\n• 🎭 Clubs & Sports\n\nTry asking about any of these topics!"
    );
  };

  const isTestMode = () => {
    if (typeof window === "undefined") return false;
    return (
      localStorage.getItem("testMode") === "true" ||
      (localStorage.getItem("token") || "").startsWith("test-token-")
    );
  };

  const checkProfileAndInit = async () => {
    setLoading(true);

    if (isTestMode()) {
      // In test mode, check localStorage for profile
      const savedProfile = localStorage.getItem("pal_profile");
      if (savedProfile) {
        setStudentProfile(JSON.parse(savedProfile));
        setProfileComplete(true);
        setOnboardingStep(-1);
        initializeChat(true);
      } else {
        setOnboardingStep(0);
        setMessages([
          {
            id: "onboard-0",
            role: "assistant",
            content: ONBOARDING_QUESTIONS[0].question,
            timestamp: new Date(),
          },
        ]);
        setLoading(false);
      }
      return;
    }

    // Check backend profile
    try {
      const profileRes = await api.chat.getProfile();
      const data = profileRes?.data?.data || profileRes?.data;

      if (data?.profileComplete && data?.profile) {
        setStudentProfile(data.profile);
        setProfileComplete(true);
        setOnboardingStep(-1);
        initializeChat(true);
        return;
      }
    } catch (e) {
      console.warn("Could not check profile:", e);
    }

    // Profile not complete — start onboarding
    setOnboardingStep(0);
    setMessages([
      {
        id: "onboard-0",
        role: "assistant",
        content: ONBOARDING_QUESTIONS[0].question,
        timestamp: new Date(),
      },
    ]);
    setLoading(false);
  };

  const handleOnboardingAnswer = async (answer: string) => {
    const step = onboardingStep;
    const question = ONBOARDING_QUESTIONS[step];

    // Add user's answer as a message
    setMessages((prev) => [
      ...prev,
      {
        id: `user-onboard-${step}`,
        role: "user",
        content: answer,
        timestamp: new Date(),
      },
    ]);

    // Update profile
    const newProfile = { ...studentProfile };
    if (question.key === "name") newProfile.name = answer;
    if (question.key === "collegeName") newProfile.collegeName = answer;
    if (question.key === "branch") newProfile.branch = answer;
    if (question.key === "year") newProfile.year = answer;
    if (question.key === "hostelResident")
      newProfile.hostelResident = answer.toLowerCase() === "yes";
    if (question.key === "interests") newProfile.interests = answer.split(", ");
    setStudentProfile(newProfile);

    const nextStep = step + 1;

    if (nextStep < ONBOARDING_QUESTIONS.length) {
      // Show next question with a small delay
      setIsTyping(true);
      await new Promise((r) => setTimeout(r, 600));
      setIsTyping(false);

      const nextQ = ONBOARDING_QUESTIONS[nextStep];
      let questionText = nextQ.question.replace("{name}", newProfile.name);
      setMessages((prev) => [
        ...prev,
        {
          id: `onboard-${nextStep}`,
          role: "assistant",
          content: questionText,
          timestamp: new Date(),
        },
      ]);
      setOnboardingStep(nextStep);
    } else {
      // Onboarding complete!
      setIsTyping(true);
      await new Promise((r) => setTimeout(r, 800));
      setIsTyping(false);

      // Save profile
      if (isTestMode()) {
        localStorage.setItem("pal_profile", JSON.stringify(newProfile));
      } else {
        try {
          await api.chat.saveProfile(newProfile);
        } catch (e) {
          console.warn("Could not save profile:", e);
        }
      }

      setProfileComplete(true);
      setOnboardingStep(-1);

      // Show completion message
      setMessages((prev) => [
        ...prev,
        {
          id: "onboard-complete",
          role: "assistant",
          content: `✅ **Profile saved!** Here's what I know about you:\n\n👤 **${newProfile.name}**\n🏫 ${newProfile.collegeName}\n📚 ${newProfile.branch} — ${newProfile.year}\n🏠 Hostel: ${newProfile.hostelResident ? "Yes" : "No"}\n🎯 Interests: ${newProfile.interests.join(", ")}\n\nI'll personalize all my responses based on your profile. **Ask me anything about campus life!** 🎓`,
          timestamp: new Date(),
        },
      ]);
    }
  };

  const initializeChat = async (skipWelcome = false) => {
    if (isTestMode()) {
      if (!skipWelcome) {
        setMessages((prev) => [
          ...prev,
          {
            id: "welcome",
            role: "assistant",
            content:
              "Hi! I'm P.A.L., your personal campus assistant. Ask me anything about campus life! 🎓\n\n*(Running in demo mode)*",
            timestamp: new Date(),
          },
        ]);
      }
      setLoading(false);
      return;
    }

    try {
      const conversationsRes = await api.chat.getConversations(1);
      if (conversationsRes?.data?.conversations?.length > 0) {
        const conv = conversationsRes.data.conversations[0];
        setConversationId(conv.id);
        try {
          const messagesRes = await api.chat.getMessages(conv.id);
          if (messagesRes?.data?.messages) {
            setMessages(
              messagesRes.data.messages.map((msg: any) => ({
                id: msg.id,
                role: msg.role,
                content: msg.content,
                sources: msg.sources,
                timestamp: new Date(msg.timestamp),
              })),
            );
          }
        } catch (e) {
          console.warn("Failed to load messages:", e);
        }
      }
    } catch (error) {
      console.warn("Chat API unavailable, using local mode:", error);
    }

    setMessages((prev) => {
      if (prev.length === 0) {
        return [
          {
            id: "welcome",
            role: "assistant",
            content:
              "Hi! I'm P.A.L., your personal campus assistant. Ask me anything about campus life! 🎓",
            timestamp: new Date(),
          },
        ];
      }
      return prev;
    });
    setLoading(false);
  };

  const sendMessage = async (text: string) => {
    if (!text.trim()) return;

    // If still in onboarding, route to onboarding handler
    if (onboardingStep >= 0 && onboardingStep < ONBOARDING_QUESTIONS.length) {
      handleOnboardingAnswer(text);
      setInput("");
      return;
    }

    const userMsg: Message = {
      id: Date.now().toString(),
      role: "user",
      content: text,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsTyping(true);

    // In test mode, use local responses
    if (isTestMode()) {
      await new Promise((r) => setTimeout(r, 800 + Math.random() * 700));
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: getTestModeResponse(text),
          timestamp: new Date(),
        },
      ]);
      setIsTyping(false);
      return;
    }

    // Try real backend API
    try {
      let activeConvId = conversationId;
      if (!activeConvId) {
        const newConvRes = await api.chat.createConversation(
          "Campus Assistant Chat",
        );
        activeConvId =
          newConvRes?.data?.data?.conversation?.id ||
          newConvRes?.data?.conversation?.id;
        if (activeConvId) setConversationId(activeConvId);
      }

      if (activeConvId) {
        const response = await api.chat.sendMessage(activeConvId, text);
        const data = response?.data?.data || response?.data;
        setMessages((prev) => [
          ...prev,
          {
            id: data?.messageId || (Date.now() + 1).toString(),
            role: "assistant",
            content:
              data?.response ||
              data?.message?.content ||
              "Sorry, I couldn't process that.",
            sources: data?.sources,
            timestamp: new Date(),
          },
        ]);
        setIsTyping(false);
        return;
      }
    } catch (error) {
      console.warn("Backend chat failed, using local fallback:", error);
    }

    // Fallback to local responses
    const fallbackResponse = getTestModeResponse(text);
    setMessages((prev) => [
      ...prev,
      {
        id: (Date.now() + 2).toString(),
        role: "assistant",
        content: fallbackResponse,
        timestamp: new Date(),
      },
    ]);
    setIsTyping(false);
  };

  // Render select/multiselect/yesno UI for onboarding
  const renderOnboardingInput = () => {
    if (onboardingStep < 0 || onboardingStep >= ONBOARDING_QUESTIONS.length)
      return null;

    const q = ONBOARDING_QUESTIONS[onboardingStep];

    if (q.type === "select") {
      return (
        <div className="mb-4 flex flex-wrap gap-2">
          {q.options?.map((opt) => (
            <button
              key={opt}
              onClick={() => handleOnboardingAnswer(opt)}
              className="rounded-full border border-border/50 px-4 py-2 text-sm text-muted-foreground transition-all hover:bg-foreground hover:text-background neu-flat"
            >
              {opt}
            </button>
          ))}
        </div>
      );
    }

    if (q.type === "yesno") {
      return (
        <div className="mb-4 flex gap-3">
          <button
            onClick={() => handleOnboardingAnswer("Yes")}
            className="flex-1 rounded-xl border border-border/50 px-4 py-3 text-sm font-medium transition-all hover:bg-foreground hover:text-background neu-flat"
          >
            ✅ Yes
          </button>
          <button
            onClick={() => handleOnboardingAnswer("No")}
            className="flex-1 rounded-xl border border-border/50 px-4 py-3 text-sm font-medium transition-all hover:bg-foreground hover:text-background neu-flat"
          >
            ❌ No
          </button>
        </div>
      );
    }

    if (q.type === "multiselect") {
      return (
        <div className="mb-4">
          <div className="flex flex-wrap gap-2 mb-3">
            {q.options?.map((opt) => (
              <button
                key={opt}
                onClick={() => {
                  setSelectedInterests((prev) =>
                    prev.includes(opt)
                      ? prev.filter((x) => x !== opt)
                      : [...prev, opt],
                  );
                }}
                className={`rounded-full border px-4 py-2 text-sm transition-all ${
                  selectedInterests.includes(opt)
                    ? "border-foreground bg-foreground text-background"
                    : "border-border/50 text-muted-foreground hover:bg-secondary neu-flat"
                }`}
              >
                {opt}
              </button>
            ))}
          </div>
          {selectedInterests.length > 0 && (
            <button
              onClick={() =>
                handleOnboardingAnswer(selectedInterests.join(", "))
              }
              className="flex items-center gap-2 rounded-full bg-foreground px-5 py-2.5 text-sm font-medium text-background transition-all hover:scale-105"
            >
              <CheckCircle2 className="h-4 w-4" />
              Continue ({selectedInterests.length} selected)
            </button>
          )}
        </div>
      );
    }

    // Text input — handled by the main input box
    return null;
  };

  if (loading) {
    return (
      <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-4rem)] flex-col overflow-hidden">
      {/* Chat header */}
      <div className="shrink-0 border-b border-border/50 bg-background/80 px-6 py-4 backdrop-blur-sm">
        <div className="mx-auto flex max-w-3xl items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-foreground float-animate">
            <Bot className="h-5 w-5 text-background" />
          </div>
          <div>
            <h1 className="font-semibold">Chat with P.A.L.</h1>
            <p className="text-xs text-muted-foreground">
              {profileComplete
                ? `${studentProfile.branch} — ${studentProfile.year} @ ${studentProfile.collegeName}`
                : "Complete your profile to get personalized answers"}
            </p>
          </div>
          <div className="ml-auto flex items-center gap-1.5 rounded-full bg-chart-4/15 px-3 py-1">
            <span className="h-2 w-2 rounded-full bg-chart-4 animate-pulse" />
            <span className="text-xs font-medium text-chart-4">Online</span>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="min-h-0 flex-1 overflow-y-auto px-6 py-6">
        <div className="mx-auto max-w-3xl space-y-6">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex gap-3 ${
                msg.role === "user" ? "flex-row-reverse" : ""
              }`}
            >
              <div
                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
                  msg.role === "assistant" ? "bg-foreground" : "bg-chart-1/15"
                }`}
              >
                {msg.role === "assistant" ? (
                  <Bot className="h-4.5 w-4.5 text-background" />
                ) : (
                  <User className="h-4.5 w-4.5 text-chart-1" />
                )}
              </div>
              <div
                className={`max-w-[80%] rounded-2xl px-5 py-4 ${
                  msg.role === "assistant"
                    ? "bg-card border border-border/50 neu-flat"
                    : "bg-foreground text-background"
                }`}
              >
                <div className="text-sm leading-relaxed whitespace-pre-line">
                  {msg.content.split(/(\*\*.*?\*\*)/).map((part, i) => {
                    if (part.startsWith("**") && part.endsWith("**")) {
                      return <strong key={i}>{part.slice(2, -2)}</strong>;
                    }
                    return part;
                  })}
                </div>
                {msg.sources && msg.sources.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2 border-t border-border/30 pt-3">
                    {msg.sources.map((src: any, idx: number) => {
                      const label =
                        typeof src === "string"
                          ? src
                          : src?.metadata?.title ||
                            src?.metadata?.source ||
                            "Source";
                      return (
                        <span
                          key={idx}
                          className="inline-flex items-center gap-1 rounded-lg bg-secondary px-2.5 py-1 text-xs text-muted-foreground"
                        >
                          <BookOpen className="h-3 w-3" />
                          {label}
                        </span>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          ))}

          {isTyping && (
            <div className="flex gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-foreground">
                <Bot className="h-4.5 w-4.5 text-background" />
              </div>
              <div className="rounded-2xl border border-border/50 bg-card px-5 py-4 neu-flat">
                <div className="flex items-center gap-1.5">
                  <span className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground/40 [animation-delay:0ms]" />
                  <span className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground/40 [animation-delay:150ms]" />
                  <span className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground/40 [animation-delay:300ms]" />
                </div>
              </div>
            </div>
          )}
          {/* Scroll padding so last message isn't hidden behind input */}
          <div className="h-4" />
        </div>
      </div>

      {/* Quick actions + Input */}
      <div className="shrink-0 border-t border-border/50 bg-background/80 px-6 py-4 backdrop-blur-sm">
        <div className="mx-auto max-w-3xl">
          {/* Onboarding special inputs (select, yesno, multiselect) */}
          {renderOnboardingInput()}

          {/* Suggestion bar — always visible when chat is active */}
          {profileComplete && (
            <div className="mb-3 flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
              {suggestedQuestions.map((q) => (
                <button
                  key={q}
                  onClick={() => sendMessage(q)}
                  disabled={isTyping}
                  className="flex-none rounded-full border border-border/50 px-3.5 py-1.5 text-xs text-muted-foreground transition-all hover:bg-secondary hover:text-foreground whitespace-nowrap disabled:opacity-40"
                >
                  {q}
                </button>
              ))}
            </div>
          )}

          {/* Text input — shown for text-type onboarding questions and normal chat */}
          {(onboardingStep < 0 ||
            ONBOARDING_QUESTIONS[onboardingStep]?.type === "text") && (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                sendMessage(input);
              }}
              className="flex items-center gap-3"
            >
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={
                  onboardingStep >= 0
                    ? ONBOARDING_QUESTIONS[onboardingStep]?.placeholder
                    : "Ask P.A.L. about campus, deadlines, academics..."
                }
                className="flex-1 rounded-full border border-border/50 bg-card px-5 py-3.5 text-sm outline-none transition-all placeholder:text-muted-foreground/60 focus:border-ring focus:ring-2 focus:ring-ring/20 neu-pressed"
              />
              <button
                type="submit"
                disabled={!input.trim() || isTyping}
                className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-foreground text-background transition-all hover:scale-105 disabled:opacity-40"
              >
                <Send className="h-5 w-5" />
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
