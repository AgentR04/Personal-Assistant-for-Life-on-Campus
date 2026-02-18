"use client";

import api from "@/lib/api";
import { BookOpen, Bot, Loader2, Send, Sparkles, User } from "lucide-react";
import { useEffect, useRef, useState } from "react";

type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
  sources?: string[];
  timestamp: Date;
};

const quickActions = [
  "What are my core subjects?",
  "When is the fee deadline?",
  "Tell me about hostel allotment",
];

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let mounted = true;

    const init = async () => {
      if (mounted) {
        await initializeChat();
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
  }, [messages, isTyping]);

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
        keywords: ["wifi", "internet", "email", "portal", "login", "password"],
        answer:
          "**IT Services:**\n\n📶 WiFi: Login with student ID\n📧 College email provided in first week\n🔑 Portal: portal.college.edu\n📞 IT Helpdesk: Block B, Ground Floor",
      },
      {
        keywords: [
          "help",
          "support",
          "counselor",
          "mental",
          "health",
          "stress",
        ],
        answer:
          "**Support Services:**\n\n🧠 Campus Counselor: Mon-Fri, 10AM-5PM (free & confidential)\n🏥 Health Center: Block C, Ground Floor\n📞 Emergency: Ext. 100",
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
      {
        keywords: ["who are you", "what are you", "what can you do"],
        answer:
          "I'm **P.A.L.** — Personal Assistant for Life on Campus 🤖\n\nI help students with academics, hostel info, fees, library, clubs, IT services, and wellness support!",
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
      "I can help you with:\n• 📚 Academics & Exams\n• 🏠 Hostel & Mess\n• 💰 Fees & Deadlines\n• 📖 Library\n• 🎭 Clubs & Sports\n• 📶 WiFi & IT\n• 🧠 Wellness\n\nTry asking about any of these topics!"
    );
  };

  const isTestMode = () => {
    if (typeof window === "undefined") return false;
    return localStorage.getItem("testMode") === "true";
  };

  const initializeChat = async () => {
    setLoading(true);

    if (isTestMode()) {
      // In test mode, skip backend calls
      setMessages([
        {
          id: "welcome",
          role: "assistant",
          content:
            "Hi! I'm P.A.L., your personal campus assistant. Ask me anything about campus life! 🎓\n\n*(Running in offline demo mode)*",
          timestamp: new Date(),
        },
      ]);
      setLoading(false);
      return;
    }

    try {
      // Try to get existing conversations
      const conversationsRes = await api.chat.getConversations(1);

      if (conversationsRes?.data?.conversations?.length > 0) {
        const conv = conversationsRes.data.conversations[0];
        setConversationId(conv.id);

        // Try to load messages
        try {
          const messagesRes = await api.chat.getMessages(conv.id);
          if (messagesRes?.data?.messages) {
            const formattedMessages = messagesRes.data.messages.map(
              (msg: any) => ({
                id: msg.id,
                role: msg.role,
                content: msg.content,
                sources: msg.sources,
                timestamp: new Date(msg.timestamp),
              }),
            );
            setMessages(formattedMessages);
          }
        } catch (e) {
          console.error("Failed to load messages:", e);
        }
      }
    } catch (error) {
      console.error("Failed to initialize chat:", error);
    }

    // Always show welcome message if no messages
    setMessages((prev) => {
      if (prev.length === 0) {
        return [
          {
            id: "welcome",
            role: "assistant",
            content:
              "Hi! I'm P.A.L., your personal campus assistant. Ask me anything!",
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

    const userMsg: Message = {
      id: Date.now().toString(),
      role: "user",
      content: text,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsTyping(true);

    // Test mode: use local responses
    if (isTestMode()) {
      await new Promise((resolve) =>
        setTimeout(resolve, 800 + Math.random() * 700),
      );
      const response = getTestModeResponse(text);
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: response,
          timestamp: new Date(),
        },
      ]);
      setIsTyping(false);
      return;
    }

    try {
      let activeConvId = conversationId;

      if (!activeConvId) {
        const newConvRes = await api.chat.createConversation(
          "Campus Assistant Chat",
        );
        // Try both possible response structures
        activeConvId =
          newConvRes?.data?.conversation?.id ||
          newConvRes?.data?.data?.conversation?.id;

        if (!activeConvId) {
          console.error("No conversation ID in response:", newConvRes);
          throw new Error("Invalid conversation response");
        }

        setConversationId(activeConvId);
      }

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
    } catch (error: any) {
      console.error("Send error:", error);
      // Fallback to test mode response on error
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
    } finally {
      setIsTyping(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-4rem)] flex-col">
      {/* Chat header */}
      <div className="border-b border-border/50 bg-background/80 px-6 py-4 backdrop-blur-sm">
        <div className="mx-auto flex max-w-3xl items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-foreground float-animate">
            <Bot className="h-5 w-5 text-background" />
          </div>
          <div>
            <h1 className="font-semibold">Chat with P.A.L.</h1>
            <p className="text-xs text-muted-foreground">
              RAG-powered campus assistant — CS Branch, 1st Year context
            </p>
          </div>
          <div className="ml-auto flex items-center gap-1.5 rounded-full bg-chart-4/15 px-3 py-1">
            <span className="h-2 w-2 rounded-full bg-chart-4 animate-pulse" />
            <span className="text-xs font-medium text-chart-4">Online</span>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-6 py-6">
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
                    {msg.sources.map((src) => (
                      <span
                        key={src}
                        className="inline-flex items-center gap-1 rounded-lg bg-secondary px-2.5 py-1 text-xs text-muted-foreground"
                      >
                        <BookOpen className="h-3 w-3" />
                        {src}
                      </span>
                    ))}
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
        </div>
      </div>

      {/* Quick actions + Input */}
      <div className="border-t border-border/50 bg-background/80 px-6 py-4 backdrop-blur-sm">
        <div className="mx-auto max-w-3xl">
          {messages.length <= 1 && (
            <div className="mb-4 flex flex-wrap gap-2">
              {quickActions.map((action) => (
                <button
                  key={action}
                  onClick={() => sendMessage(action)}
                  className="flex items-center gap-1.5 rounded-full border border-border/50 px-4 py-2 text-sm text-muted-foreground transition-all hover:bg-secondary hover:text-foreground neu-flat"
                >
                  <Sparkles className="h-3.5 w-3.5" />
                  {action}
                </button>
              ))}
            </div>
          )}
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
              placeholder="Ask P.A.L. about campus, deadlines, academics..."
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
        </div>
      </div>
    </div>
  );
}
