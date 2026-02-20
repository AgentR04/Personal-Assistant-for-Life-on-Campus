"use client";

import { Progress } from "@/components/ui/progress";
import api from "@/lib/api";
import { cn } from "@/lib/utils";
import confetti from "canvas-confetti";
import { ArrowRight, Star, Trophy } from "lucide-react";
import { useEffect, useState } from "react";

export function QuestWidget() {
  const [status, setStatus] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [completing, setCompleting] = useState(false);

  const fetchStatus = async () => {
    try {
      const res = await api.quests.getStatus();
      if (res.data.success) {
        setStatus(res.data.data);
      }
    } catch (error) {
      console.error("Failed to fetch quest status:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  const handleCompleteQuest = async (taskId: string) => {
    if (completing) return;
    setCompleting(true);
    try {
      const res = await api.quests.complete(taskId);
      if (res.data.success) {
        // Celebration!
        const duration = 3000;
        const animationEnd = Date.now() + duration;
        const defaults = {
          startVelocity: 30,
          spread: 360,
          ticks: 60,
          zIndex: 0,
        };
        const randomInRange = (min: number, max: number) =>
          Math.random() * (max - min) + min;

        const interval: any = setInterval(function () {
          const timeLeft = animationEnd - Date.now();
          if (timeLeft <= 0) {
            clearInterval(interval);
            return;
          }
          const particleCount = 50 * (timeLeft / duration);
          confetti({
            ...defaults,
            particleCount,
            origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 },
          });
          confetti({
            ...defaults,
            particleCount,
            origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 },
          });
        }, 250);

        // Refresh status
        await fetchStatus();
        alert(res.data.data.celebrationMessage); // Simple alert for now, could be a toast
      }
    } catch (error) {
      console.error("Failed to complete quest:", error);
    } finally {
      setCompleting(false);
    }
  };

  if (loading) return <div className="p-4 text-center">Loading quests...</div>;
  if (!status) return null;

  const nextQuest = status.nextQuest;
  const progressToNextLevel = status.xp % 100; // Simplified XP progress logic

  return (
    <div className="rounded-2xl border border-yellow-500/30 bg-yellow-500/5 p-6 neu-flat relative overflow-hidden">
      <div className="absolute top-0 right-0 p-4 opacity-10">
        <Trophy className="w-24 h-24 text-yellow-600" />
      </div>

      <div className="relative z-10">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-bold flex items-center gap-2 text-yellow-700 dark:text-yellow-400">
              <Trophy className="w-5 h-5" />
              Level {status.currentLevel} Adventurer
            </h3>
            <p className="text-xs text-muted-foreground">
              {status.xp} XP Earned • {status.unlockedRewards.length} Rewards
              Unlocked
            </p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-yellow-600">
              {status.xp} XP
            </div>
          </div>
        </div>

        {/* XP Bar */}
        <div className="mb-6">
          <div className="flex justify-between text-xs mb-1.5 font-medium">
            <span>Level {status.currentLevel}</span>
            <span>Level {status.currentLevel + 1}</span>
          </div>
          <Progress
            value={progressToNextLevel}
            className="h-2.5 bg-yellow-950/10"
            indicatorClassName="bg-yellow-500"
          />
        </div>

        {/* Current Quest */}
        {nextQuest ? (
          <div className="bg-card/80 backdrop-blur-sm rounded-xl p-4 border border-border/50 shadow-sm">
            <h4 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-2">
              <Star className="w-4 h-4 text-yellow-500" /> Current Quest
            </h4>
            <div className="mb-3">
              <h5 className="font-bold text-lg">{nextQuest.title}</h5>
              <p className="text-sm text-muted-foreground">
                {nextQuest.taskDescription}
              </p>
            </div>

            <div className="flex items-center justify-between mt-4">
              <div className="flex items-center gap-2 text-xs font-medium bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 px-2.5 py-1 rounded-md">
                Reward: {nextQuest.reward.icon} {nextQuest.reward.title}
              </div>
              <button
                onClick={() => handleCompleteQuest(nextQuest.taskId)}
                disabled={completing}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all",
                  "bg-linear-to-r from-yellow-500 to-orange-500 text-white hover:shadow-lg hover:scale-105",
                  completing && "opacity-70 cursor-not-allowed",
                )}
              >
                {completing ? "Completing..." : "Complete Quest"}{" "}
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        ) : (
          <div className="text-center p-6 bg-card/50 rounded-xl border border-dashed border-border">
            <Trophy className="w-12 h-12 text-yellow-500 mx-auto mb-3" />
            <h4 className="font-bold text-lg">All Quests Completed!</h4>
            <p className="text-muted-foreground text-sm">
              You are a campus legend. Stay tuned for more quests!
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
