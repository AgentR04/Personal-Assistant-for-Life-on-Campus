import { GoogleGenerativeAI } from "@google/generative-ai";
import { logger } from "../utils/logger";

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY || "");

// ─── Mock Database: Senior Projects & Clubs ──────────────────────────────────
interface SeniorProject {
  id: string;
  name: string;
  description: string;
  lookingFor: string[];
  seniorLead: { name: string; year: string; contact: string };
  tags: string[];
  openSlots: number;
}

const SENIOR_PROJECTS: SeniorProject[] = [
  {
    id: "proj-ds-club",
    name: "Data Science Club — Campus Analytics",
    description:
      "We're building a dashboard that analyses campus placement trends, student performance patterns, and mess feedback. Looking for freshers who can help with data cleaning, visualization, and basic Python/SQL.",
    lookingFor: [
      "data cleaning",
      "data analysis",
      "visualization",
      "Python",
      "SQL",
      "statistics",
    ],
    seniorLead: {
      name: "Riya Sharma",
      year: "3rd Year",
      contact: "riya.sharma@college.edu",
    },
    tags: [
      "data science",
      "machine learning",
      "analytics",
      "python",
      "pandas",
      "statistics",
    ],
    openSlots: 3,
  },
  {
    id: "proj-genai-hack",
    name: "GenAI Hackathon Team — LLM Campus Bot",
    description:
      "Our team is preparing for the National GenAI Hackathon. We're building an LLM-powered campus assistant using RAG and prompt engineering. Need developers comfortable with APIs, JavaScript/TypeScript, and AI concepts.",
    lookingFor: [
      "LLM",
      "prompt engineering",
      "JavaScript",
      "TypeScript",
      "API development",
      "RAG",
    ],
    seniorLead: {
      name: "Arjun Mehta",
      year: "4th Year",
      contact: "arjun.mehta@college.edu",
    },
    tags: [
      "generative AI",
      "LLM",
      "chatbot",
      "hackathon",
      "javascript",
      "typescript",
      "API",
      "RAG",
    ],
    openSlots: 2,
  },
  {
    id: "proj-robo-club",
    name: "Robotics Club — Autonomous Line Follower",
    description:
      "We're building an autonomous line-following robot for the inter-college robotics competition. Looking for freshers interested in embedded systems, Arduino/ESP32, motor control, and basic circuit design.",
    lookingFor: [
      "Arduino",
      "embedded systems",
      "circuit design",
      "C/C++",
      "sensors",
      "robotics",
    ],
    seniorLead: {
      name: "Priya Desai",
      year: "3rd Year",
      contact: "priya.desai@college.edu",
    },
    tags: [
      "robotics",
      "embedded",
      "arduino",
      "electronics",
      "hardware",
      "IoT",
      "C++",
    ],
    openSlots: 4,
  },
];

// ─── Service ─────────────────────────────────────────────────────────────────

class ProjectMatcherService {
  /**
   * Extract skills/interests from natural language input using Gemini
   */
  async extractSkills(userInput: string): Promise<string[]> {
    try {
      const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

      const prompt = `Extract technical skills, interests, and keywords from the following student message. 
Return ONLY a JSON array of lowercase strings. No explanation, no markdown.

Student says: "${userInput}"

Example output: ["machine learning", "python", "data analysis"]`;

      const result = await model.generateContent(prompt);
      const text = result.response.text().trim();

      // Parse the JSON array from response
      const cleaned = text
        .replace(/```json\n?/g, "")
        .replace(/```/g, "")
        .trim();
      const skills: string[] = JSON.parse(cleaned);

      logger.info(`Extracted skills: ${skills.join(", ")}`);
      return skills;
    } catch (error) {
      logger.error("Error extracting skills:", error);
      // Fallback: simple keyword extraction
      return userInput
        .toLowerCase()
        .split(/[\s,]+/)
        .filter((w) => w.length > 3);
    }
  }

  /**
   * Match extracted skills against project database using keyword similarity
   */
  matchProjects(
    skills: string[],
  ): Array<{ project: SeniorProject; score: number; matchedSkills: string[] }> {
    const results = SENIOR_PROJECTS.map((project) => {
      const allProjectTerms = [
        ...project.tags,
        ...project.lookingFor.map((s) => s.toLowerCase()),
      ];

      const matchedSkills: string[] = [];
      let score = 0;

      for (const skill of skills) {
        const skillLower = skill.toLowerCase();
        for (const term of allProjectTerms) {
          if (
            term.includes(skillLower) ||
            skillLower.includes(term) ||
            this.fuzzyMatch(skillLower, term)
          ) {
            matchedSkills.push(skill);
            score += 1;
            break;
          }
        }
      }

      // Normalize score (0-1)
      const normalizedScore = skills.length > 0 ? score / skills.length : 0;

      return {
        project,
        score: normalizedScore,
        matchedSkills: [...new Set(matchedSkills)],
      };
    });

    // Sort by score descending
    return results.sort((a, b) => b.score - a.score);
  }

  /**
   * Simple fuzzy matching for related terms
   */
  private fuzzyMatch(a: string, b: string): boolean {
    // Check for common substring (at least 4 chars)
    if (a.length < 4 || b.length < 4) return false;
    const shorter = a.length < b.length ? a : b;
    const longer = a.length < b.length ? b : a;
    return longer.includes(
      shorter.slice(0, Math.max(4, Math.floor(shorter.length * 0.7))),
    );
  }

  /**
   * Generate a personalized introduction message using Gemini
   */
  async generateIntroduction(
    studentInput: string,
    matchedSkills: string[],
    project: SeniorProject,
  ): Promise<string> {
    try {
      const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

      const prompt = `You are P.A.L., an AI campus assistant. A fresher just told you about their interests. You found a perfect project match for them.

Student said: "${studentInput}"
Matched skills: ${matchedSkills.join(", ")}

Project: ${project.name}
Description: ${project.description}
Senior Lead: ${project.seniorLead.name} (${project.seniorLead.year})
Open Slots: ${project.openSlots}

Write a short, enthusiastic, conversational message (3-4 sentences) that:
1. Acknowledges their interests
2. Introduces the matched project naturally
3. Mentions the senior lead by name
4. Offers to connect them

Keep it warm and college-friendly. Use 1-2 emojis max.`;

      const result = await model.generateContent(prompt);
      return result.response.text().trim();
    } catch (error) {
      logger.error("Error generating introduction:", error);
      // Fallback message
      return `Great news! Based on your interests in ${matchedSkills.join(", ")}, I found a perfect match: **${project.name}**! ${project.description} The team lead is ${project.seniorLead.name} (${project.seniorLead.year}). Want me to connect you? 🚀`;
    }
  }

  /**
   * Full pipeline: extract skills → match → generate intro
   */
  async findMatch(userInput: string): Promise<{
    skills: string[];
    bestMatch: {
      project: SeniorProject;
      score: number;
      matchedSkills: string[];
      introduction: string;
    };
    allMatches: Array<{
      projectName: string;
      score: number;
      matchedSkills: string[];
    }>;
  }> {
    // Step 1: Extract skills
    const skills = await this.extractSkills(userInput);

    // Step 2: Match against projects
    const matches = this.matchProjects(skills);

    // Step 3: Generate intro for best match
    const best = matches[0];
    const introduction = await this.generateIntroduction(
      userInput,
      best.matchedSkills,
      best.project,
    );

    return {
      skills,
      bestMatch: {
        project: best.project,
        score: best.score,
        matchedSkills: best.matchedSkills,
        introduction,
      },
      allMatches: matches.map((m) => ({
        projectName: m.project.name,
        score: Math.round(m.score * 100),
        matchedSkills: m.matchedSkills,
      })),
    };
  }

  /**
   * Get all available projects
   */
  getProjects(): SeniorProject[] {
    return SENIOR_PROJECTS;
  }
}

export default new ProjectMatcherService();
