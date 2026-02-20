"use client";

import { ChatInterface } from "@/components/chat-interface";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

function ChatPageContent() {
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get("q") || undefined;

  return <ChatInterface initialMessage={initialQuery} />;
}

export default function ChatPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center h-screen">
          Loading...
        </div>
      }
    >
      <ChatPageContent />
    </Suspense>
  );
}
