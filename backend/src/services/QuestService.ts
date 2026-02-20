import { supabaseAdmin } from "../config/database";
import { logger } from "../utils/logger";

// ─── Quest Definitions ───────────────────────────────────────────────────────

interface QuestReward {
  id: string;
  title: string;
  description: string;
  icon: string;
}

interface QuestLevel {
  level: number;
  title: string;
  taskId: string;
  taskDescription: string;
  reward: QuestReward;
  xpRequired: number;
}

interface StudentQuestState {
  studentId: string;
  currentLevel: number;
  xp: number;
  unlockedRewards: QuestReward[];
  completedTasks: string[];
  nextQuest: QuestLevel | null;
  allQuests: Array<QuestLevel & { completed: boolean }>;
}

const QUEST_LEVELS: QuestLevel[] = [
  {
    level: 1,
    title: "📜 The Scroll of Knowledge",
    taskId: "upload_docs",
    taskDescription:
      "Upload all required documents (10th, 12th marksheets, ID proof, photo)",
    reward: {
      id: "reward_wifi",
      title: "🔑 Campus Wi-Fi Password",
      description:
        "Access to high-speed campus Wi-Fi across all buildings and hostels",
      icon: "📶",
    },
    xpRequired: 100,
  },
  {
    level: 2,
    title: "📖 The Library Expedition",
    taskId: "library_visit",
    taskDescription:
      "Complete your physical library visit and get your library card",
    reward: {
      id: "reward_id_card",
      title: "🪪 Digital ID Card & 50 Mess Points",
      description:
        "Your official digital student ID + 50 bonus mess points for free meals",
      icon: "🪪",
    },
    xpRequired: 200,
  },
  {
    level: 3,
    title: "💻 The Digital Gateway",
    taskId: "lms_setup",
    taskDescription:
      "Set up your LMS account, enroll in courses, and submit your first assignment",
    reward: {
      id: "reward_whatsapp",
      title: "💬 Class WhatsApp Links",
      description:
        "Invite links to all your class WhatsApp groups and subject channels",
      icon: "💬",
    },
    xpRequired: 300,
  },
];

// ─── In-memory store (production would use Supabase) ──────────────────────

const questStore = new Map<
  string,
  {
    currentLevel: number;
    xp: number;
    unlockedRewards: string[];
    completedTasks: string[];
  }
>();

// ─── Service ─────────────────────────────────────────────────────────────────

class QuestService {
  /**
   * Get or initialize quest state for a student
   */
  async getQuestStatus(studentId: string): Promise<StudentQuestState> {
    let state = questStore.get(studentId);

    if (!state) {
      // Initialize new student
      state = {
        currentLevel: 1,
        xp: 0,
        unlockedRewards: [],
        completedTasks: [],
      };
      questStore.set(studentId, state);
    }

    const unlockedRewards = QUEST_LEVELS.filter((q) =>
      state!.completedTasks.includes(q.taskId),
    ).map((q) => q.reward);

    const nextQuest =
      QUEST_LEVELS.find((q) => !state!.completedTasks.includes(q.taskId)) ||
      null;

    const allQuests = QUEST_LEVELS.map((q) => ({
      ...q,
      completed: state!.completedTasks.includes(q.taskId),
    }));

    return {
      studentId,
      currentLevel: state.currentLevel,
      xp: state.xp,
      unlockedRewards,
      completedTasks: state.completedTasks,
      nextQuest,
      allQuests,
    };
  }

  /**
   * Complete a quest task — verify, upgrade level, append reward
   */
  async completeQuest(
    studentId: string,
    taskId: string,
  ): Promise<{
    success: boolean;
    message: string;
    levelUp: boolean;
    newLevel: number;
    xpGained: number;
    totalXp: number;
    reward: QuestReward | null;
    celebrationMessage: string;
  }> {
    // Get or create state
    let state = questStore.get(studentId);
    if (!state) {
      state = {
        currentLevel: 1,
        xp: 0,
        unlockedRewards: [],
        completedTasks: [],
      };
      questStore.set(studentId, state);
    }

    // Find the quest for this task
    const quest = QUEST_LEVELS.find((q) => q.taskId === taskId);
    if (!quest) {
      return {
        success: false,
        message: `Unknown task: ${taskId}. Valid tasks: ${QUEST_LEVELS.map((q) => q.taskId).join(", ")}`,
        levelUp: false,
        newLevel: state.currentLevel,
        xpGained: 0,
        totalXp: state.xp,
        reward: null,
        celebrationMessage: "",
      };
    }

    // Check if already completed
    if (state.completedTasks.includes(taskId)) {
      return {
        success: false,
        message: `Quest "${quest.title}" already completed!`,
        levelUp: false,
        newLevel: state.currentLevel,
        xpGained: 0,
        totalXp: state.xp,
        reward: null,
        celebrationMessage:
          "You've already conquered this quest! Try the next one. 🎯",
      };
    }

    // Check prerequisites (must complete in order)
    const questIndex = QUEST_LEVELS.indexOf(quest);
    for (let i = 0; i < questIndex; i++) {
      if (!state.completedTasks.includes(QUEST_LEVELS[i].taskId)) {
        return {
          success: false,
          message: `You must complete "${QUEST_LEVELS[i].title}" first!`,
          levelUp: false,
          newLevel: state.currentLevel,
          xpGained: 0,
          totalXp: state.xp,
          reward: null,
          celebrationMessage: `Complete Level ${i + 1} first to unlock this quest! 🔒`,
        };
      }
    }

    // ✅ Complete the quest!
    const xpGained = quest.xpRequired;
    state.completedTasks.push(taskId);
    state.unlockedRewards.push(quest.reward.id);
    state.xp += xpGained;

    const levelUp = quest.level > state.currentLevel;
    if (levelUp) {
      state.currentLevel = quest.level;
    }

    questStore.set(studentId, state);

    // Try to persist to Supabase (non-blocking)
    this.persistToDatabase(studentId, state).catch((err) => {
      logger.warn("Failed to persist quest state to DB:", err);
    });

    logger.info(
      `Student ${studentId} completed quest "${quest.title}" — Level ${state.currentLevel}, XP: ${state.xp}`,
    );

    // Build celebration message
    const isMaxLevel = state.currentLevel === QUEST_LEVELS.length;
    const celebrationMessage = isMaxLevel
      ? `🏆🎉 LEGENDARY! You've completed ALL quests and reached MAX LEVEL! You've unlocked: ${quest.reward.icon} ${quest.reward.title}. You're officially a campus pro! 🎊`
      : `⚔️🎉 QUEST COMPLETE: "${quest.title}"! You earned ${xpGained} XP and unlocked: ${quest.reward.icon} ${quest.reward.title}! ${quest.reward.description}. Next quest awaits, adventurer! 🗡️`;

    return {
      success: true,
      message: `Quest "${quest.title}" completed!`,
      levelUp,
      newLevel: state.currentLevel,
      xpGained,
      totalXp: state.xp,
      reward: quest.reward,
      celebrationMessage,
    };
  }

  /**
   * Persist quest state to Supabase (best-effort)
   */
  private async persistToDatabase(
    studentId: string,
    state: {
      currentLevel: number;
      xp: number;
      unlockedRewards: string[];
      completedTasks: string[];
    },
  ): Promise<void> {
    try {
      // Upsert into a quest_progress table (or update user metadata)
      await supabaseAdmin
        .from("users")
        .update({
          overall_progress: Math.round(
            (state.completedTasks.length / QUEST_LEVELS.length) * 100,
          ),
        })
        .eq("id", studentId);
    } catch (error) {
      logger.error("Error persisting quest state:", error);
    }
  }

  /**
   * Get quest definitions
   */
  getQuestDefinitions(): QuestLevel[] {
    return QUEST_LEVELS;
  }
}

export default new QuestService();
