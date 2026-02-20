"use client";

import { useState } from "react";
import { AuthGuard } from "@/components/auth-guard";
import { Trophy, Sparkles, CheckCircle, Lock, Zap } from "lucide-react";

export default function QuestsPage() {
  const [userLevel, setUserLevel] = useState(1);
  const [totalXP, setTotalXP] = useState(0);
  const [unlockedRewards, setUnlockedRewards] = useState<string[]>([]);
  const [completedQuests, setCompletedQuests] = useState<number[]>([]);

  const quests = [
    {
      id: 1,
      level: 1,
      name: "Upload Your Documents",
      description: "Upload your admission documents to Smart-Scanner for verification",
      xp: 100,
      reward: "Campus Wi-Fi Password: CampusNet2024",
      icon: "📄",
      color: "chart-1"
    },
    {
      id: 2,
      level: 2,
      name: "Visit the Library",
      description: "Walk to the Main Library and scan the QR code at the information desk",
      xp: 150,
      reward: "Digital ID Card + 50 Mess Points (Free Coffee!)",
      icon: "📚",
      color: "chart-2"
    },
    {
      id: 3,
      level: 3,
      name: "Complete LMS Setup",
      description: "Set up your Learning Management System profile with photo and preferences",
      xp: 200,
      reward: "Class Timetable + WhatsApp Group Links",
      icon: "🎓",
      color: "chart-3"
    }
  ];

  const completeQuest = (questId: number, xp: number, reward: string) => {
    if (completedQuests.includes(questId)) return;

    const newXP = totalXP + xp;
    const newLevel = Math.floor(newXP / 300) + 1;
    
    setCompletedQuests([...completedQuests, questId]);
    setTotalXP(newXP);
    setUnlockedRewards([...unlockedRewards, reward]);
    
    if (newLevel > userLevel) {
      setUserLevel(newLevel);
      alert(`🎉 LEVEL UP! You're now Level ${newLevel}!`);
    } else {
      alert(`✨ Quest Complete! +${xp} XP earned\n🎁 Reward: ${reward}`);
    }
  };

  const isQuestAvailable = (questLevel: number) => {
    return questLevel <= userLevel;
  };

  const nextLevelXP = userLevel * 300;
  const progressPercent = (totalXP / nextLevelXP) * 100;

  return (
    <AuthGuard>
      <div className="min-h-screen bg-gradient-mesh p-6">
        <div className="mx-auto max-w-4xl">
          {/* Header */}
          <div className="mb-8">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-secondary px-4 py-2 text-sm font-medium">
              <Sparkles className="h-4 w-4" />
              RPG Quest System
            </div>
            <h1 className="text-4xl font-bold">Your Campus Adventure</h1>
            <p className="mt-2 text-lg text-muted-foreground">
              Complete quests to unlock rewards and level up!
            </p>
          </div>

          {/* Profile Card */}
          <div className="mb-8 rounded-3xl border border-border/50 bg-gradient-to-br from-chart-1/10 to-chart-3/10 p-8 neu-flat">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <div className="mb-1 flex items-center gap-3">
                  <Trophy className="h-8 w-8 text-chart-1" />
                  <h2 className="text-3xl font-bold">Level {userLevel}</h2>
                </div>
                <p className="text-sm text-muted-foreground">
                  {totalXP} / {nextLevelXP} XP
                </p>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold">{completedQuests.length}/3</div>
                <div className="text-sm text-muted-foreground">Quests Complete</div>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="mb-4">
              <div className="h-4 overflow-hidden rounded-full bg-background/50">
                <div
                  className="h-full bg-gradient-to-r from-chart-1 to-chart-3 transition-all duration-500"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>

            {/* Unlocked Rewards */}
            {unlockedRewards.length > 0 && (
              <div className="rounded-2xl border border-border/50 bg-background/50 p-4">
                <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold">
                  <Zap className="h-4 w-4 text-chart-1" />
                  Unlocked Rewards
                </h3>
                <div className="space-y-2">
                  {unlockedRewards.map((reward, idx) => (
                    <div key={idx} className="flex items-start gap-2 text-sm">
                      <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-chart-1" />
                      <span>{reward}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Quests */}
          <div className="space-y-6">
            <h2 className="text-2xl font-bold">Available Quests</h2>

            {quests.map((quest) => {
              const isCompleted = completedQuests.includes(quest.id);
              const isAvailable = isQuestAvailable(quest.level);
              const isLocked = !isAvailable;

              return (
                <div
                  key={quest.id}
                  className={`rounded-3xl border p-6 transition-all ${
                    isCompleted
                      ? "border-chart-1 bg-chart-1/10"
                      : isAvailable
                      ? "border-border/50 bg-card hover:border-border hover:shadow-lg neu-flat"
                      : "border-border/30 bg-secondary/30 opacity-60"
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="mb-3 flex items-center gap-3">
                        <div className="text-4xl">{quest.icon}</div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="text-xl font-bold">{quest.name}</h3>
                            {isLocked && <Lock className="h-4 w-4 text-muted-foreground" />}
                            {isCompleted && <CheckCircle className="h-5 w-5 text-chart-1" />}
                          </div>
                          <p className="text-sm text-muted-foreground">
                            Level {quest.level} Quest
                          </p>
                        </div>
                      </div>

                      <p className="mb-4 leading-relaxed text-muted-foreground">
                        {quest.description}
                      </p>

                      <div className="mb-4 flex items-center gap-4 text-sm">
                        <div className="flex items-center gap-1">
                          <Sparkles className="h-4 w-4 text-chart-1" />
                          <span className="font-semibold">+{quest.xp} XP</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Trophy className="h-4 w-4 text-chart-2" />
                          <span className="font-semibold">Reward</span>
                        </div>
                      </div>

                      <div className="rounded-2xl border border-border/50 bg-background/50 p-3">
                        <p className="text-sm">
                          <span className="font-semibold">🎁 Reward: </span>
                          {quest.reward}
                        </p>
                      </div>
                    </div>

                    <div className="ml-4">
                      {isCompleted ? (
                        <div className="rounded-full bg-chart-1/20 px-4 py-2 text-sm font-semibold text-chart-1">
                          Completed
                        </div>
                      ) : isAvailable ? (
                        <button
                          onClick={() => completeQuest(quest.id, quest.xp, quest.reward)}
                          className="rounded-full bg-foreground px-6 py-2 text-sm font-semibold text-background transition-all hover:scale-105"
                        >
                          Complete Quest
                        </button>
                      ) : (
                        <div className="rounded-full bg-secondary px-4 py-2 text-sm font-semibold text-muted-foreground">
                          Locked
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* All Complete */}
          {completedQuests.length === quests.length && (
            <div className="mt-8 rounded-3xl border border-chart-1 bg-gradient-to-br from-chart-1/20 to-chart-3/20 p-8 text-center neu-flat">
              <Trophy className="mx-auto mb-4 h-16 w-16 text-chart-1" />
              <h2 className="mb-2 text-3xl font-bold">Quest Master!</h2>
              <p className="text-lg text-muted-foreground">
                You've completed all onboarding quests. Your campus journey is off to an amazing start!
              </p>
            </div>
          )}
        </div>
      </div>
    </AuthGuard>
  );
}
