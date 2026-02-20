import { GoogleGenerativeAI } from "@google/generative-ai";
import { ChromaClient, CloudClient } from "chromadb";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import { logger } from "../utils/logger";

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY || "");
const model = genAI.getGenerativeModel({ model: "gemini-2.5-pro" });

// Initialize ChromaDB client (cloud or local)
const chromaClient = process.env.CHROMA_API_KEY
  ? new CloudClient({
      apiKey: process.env.CHROMA_API_KEY,
      tenant: process.env.CHROMA_TENANT || "default_tenant",
      database: process.env.CHROMA_DATABASE || "default_database",
      cloudHost: `https://${process.env.CHROMA_HOST || "api.trychroma.com"}`,
      cloudPort: "443",
    })
  : new ChromaClient({
      path: `http://${process.env.CHROMA_HOST || "localhost"}:${process.env.CHROMA_PORT || 8000}`,
    });

const COLLECTION_NAME =
  process.env.CHROMA_COLLECTION_NAME || "pal_knowledge_base";

interface RAGQueryOptions {
  userId?: string;
  branch?: string;
  phase?: string;
  language?: "en" | "hi";
  maxResults?: number;
  studentProfile?: {
    name?: string;
    collegeName?: string;
    year?: string;
    interests?: string[];
    hostelResident?: boolean;
  };
}

interface RAGResponse {
  answer: string;
  sources: Array<{
    content: string;
    metadata: any;
    score: number;
  }>;
  confidence: number;
  language: string;
}

class RAGService {
  private collection: any = null;

  /**
   * Initialize ChromaDB collection
   */
  async initialize(): Promise<void> {
    try {
      // Try to get existing collection
      this.collection = await chromaClient.getOrCreateCollection({
        name: COLLECTION_NAME,
        metadata: { description: "P.A.L. Knowledge Base" },
      });
      logger.info(`✅ ChromaDB collection '${COLLECTION_NAME}' initialized`);
    } catch (error) {
      logger.warn("ChromaDB not available - using fallback mode:", error);
      this.collection = null; // Will use fallback responses
    }
  }

  /**
   * Add documents to knowledge base
   */
  async addDocuments(
    documents: Array<{
      content: string;
      metadata: {
        title: string;
        source: string;
        branch?: string;
        phase?: string;
        documentType?: string;
        uploadedBy?: string;
        uploadedAt?: string;
      };
    }>,
  ): Promise<void> {
    if (!this.collection) {
      await this.initialize();
    }

    try {
      // Split documents into chunks
      const textSplitter = new RecursiveCharacterTextSplitter({
        chunkSize: 512,
        chunkOverlap: 50,
      });

      const allChunks: string[] = [];
      const allMetadata: any[] = [];
      const allIds: string[] = [];

      for (const doc of documents) {
        const chunks = await textSplitter.splitText(doc.content);

        for (let i = 0; i < chunks.length; i++) {
          allChunks.push(chunks[i]);
          allMetadata.push({
            ...doc.metadata,
            chunkIndex: i,
            totalChunks: chunks.length,
          });
          allIds.push(`${doc.metadata.source}_chunk_${i}_${Date.now()}`);
        }
      }

      // Generate embeddings using Gemini
      const embeddings = await this.generateEmbeddings(allChunks);

      // Add to ChromaDB
      await this.collection.add({
        ids: allIds,
        embeddings,
        documents: allChunks,
        metadatas: allMetadata,
      });

      logger.info(`Added ${allChunks.length} chunks to knowledge base`);
    } catch (error) {
      logger.error("Error adding documents to knowledge base:", error);
      throw error;
    }
  }

  /**
   * Query the knowledge base
   */
  async query(
    query: string,
    options: RAGQueryOptions = {},
  ): Promise<RAGResponse> {
    if (!this.collection) {
      await this.initialize();
    }

    // FALLBACK: If ChromaDB is still not available, use simple Gemini responses
    if (!this.collection) {
      logger.warn("ChromaDB not available - using fallback Gemini responses");
      return await this.fallbackQuery(query, options);
    }

    try {
      const {
        userId,
        branch,
        phase,
        language = "en",
        maxResults = 5,
      } = options;

      // Detect language if not provided
      const detectedLanguage = language || (await this.detectLanguage(query));

      // Generate query embedding
      const queryEmbedding = await this.generateEmbeddings([query]);

      // Build where filter for tiered retrieval
      const whereFilter: any = {};
      if (branch) whereFilter.branch = branch;
      if (phase) whereFilter.phase = phase;

      // Query ChromaDB with MMR for diversity
      const results = await this.collection.query({
        queryEmbeddings: queryEmbedding,
        nResults: maxResults,
        where: Object.keys(whereFilter).length > 0 ? whereFilter : undefined,
      });

      // If no results with filters, try without filters
      let finalResults = results;
      if (
        results.documents[0].length === 0 &&
        Object.keys(whereFilter).length > 0
      ) {
        logger.info("No results with filters, trying without filters");
        finalResults = await this.collection.query({
          queryEmbeddings: queryEmbedding,
          nResults: maxResults,
        });
      }

      // Format sources
      const sources = finalResults.documents[0].map(
        (doc: string, idx: number) => ({
          content: doc,
          metadata: finalResults.metadatas[0][idx],
          score: 1 - (finalResults.distances[0][idx] || 0),
        }),
      );

      // Generate answer using Gemini
      const { answer, confidence } = await this.generateAnswer(
        query,
        sources,
        detectedLanguage,
      );

      return {
        answer,
        sources,
        confidence,
        language: detectedLanguage,
      };
    } catch (error) {
      logger.error("Error querying knowledge base:", error);
      // Fall back to direct Gemini response instead of crashing
      logger.warn("Falling back to direct Gemini response");
      return await this.fallbackQuery(query, options);
    }
  }

  /**
   * Generate embeddings using Gemini
   */
  private async generateEmbeddings(texts: string[]): Promise<number[][]> {
    try {
      const embeddingModel = genAI.getGenerativeModel({
        model: "gemini-embedding-001",
      });

      const embeddings: number[][] = [];

      // Process in batches to avoid rate limits
      const batchSize = 10;
      for (let i = 0; i < texts.length; i += batchSize) {
        const batch = texts.slice(i, i + batchSize);
        const batchEmbeddings = await Promise.all(
          batch.map(async (text) => {
            const result = await embeddingModel.embedContent(text);
            return result.embedding.values;
          }),
        );
        embeddings.push(...batchEmbeddings);
      }

      return embeddings;
    } catch (error) {
      logger.error("Error generating embeddings:", error);
      throw error;
    }
  }

  /**
   * Generate answer using Gemini with context
   */
  private async generateAnswer(
    query: string,
    sources: Array<{ content: string; metadata: any; score: number }>,
    language: string,
  ): Promise<{ answer: string; confidence: number }> {
    try {
      // Build context from sources
      const context = sources
        .map((s, idx) => `[${idx + 1}] ${s.content}`)
        .join("\n\n");

      // Build prompt
      const systemPrompt =
        language === "hi"
          ? `आप P.A.L. हैं - एक सहायक AI जो नए छात्रों की मदद करता है। दिए गए संदर्भ का उपयोग करके प्रश्न का उत्तर दें। यदि संदर्भ पर्याप्त नहीं है, तो अपने सामान्य ज्ञान का उपयोग करके उत्तर दें।`
          : `You are P.A.L. - a helpful AI assistant for college onboarding. Answer the question using the provided context. If the context is insufficient, use your general knowledge to provide a helpful answer.`;

      const prompt = `${systemPrompt}

Context:
${context}

Question: ${query}

Instructions:
- Answer in ${language === "hi" ? "Hindi" : "English"}
- Be concise and helpful
- If the context doesn't contain enough information, provide a general answer based on your knowledge
- Cite sources using [1], [2], etc. only if used

Answer:`;

      const result = await model.generateContent(prompt);
      const answer = result.response.text();

      // Calculate confidence based on source scores
      const avgScore =
        sources.length > 0
          ? sources.reduce((sum, s) => sum + s.score, 0) / sources.length
          : 0;

      // Base confidence on retrieval, but ensure a minimum floor (0.4) for general knowledge
      // This allows the model to answer using general knowledge without triggering the "I don't know" fallback
      const confidence = Math.max(Math.min(avgScore * 1.2, 1.0), 0.4);

      return { answer, confidence };
    } catch (error) {
      logger.error("Error generating answer:", error);
      throw error;
    }
  }

  /**
   * Detect language of text
   */
  private async detectLanguage(text: string): Promise<"en" | "hi"> {
    // Simple heuristic: check for Devanagari script
    const hindiPattern = /[\u0900-\u097F]/;
    return hindiPattern.test(text) ? "hi" : "en";
  }

  /**
   * Delete documents from knowledge base
   */
  async deleteDocuments(documentIds: string[]): Promise<void> {
    if (!this.collection) {
      await this.initialize();
    }

    try {
      await this.collection.delete({
        ids: documentIds,
      });
      logger.info(
        `Deleted ${documentIds.length} documents from knowledge base`,
      );
    } catch (error) {
      logger.error("Error deleting documents:", error);
      throw error;
    }
  }

  /**
   * Search documents by metadata
   */
  async searchByMetadata(
    metadata: Record<string, any>,
    limit: number = 10,
  ): Promise<any[]> {
    if (!this.collection) {
      await this.initialize();
    }

    try {
      const results = await this.collection.get({
        where: metadata,
        limit,
      });

      return results.documents.map((doc: string, idx: number) => ({
        id: results.ids[idx],
        content: doc,
        metadata: results.metadatas[idx],
      }));
    } catch (error) {
      logger.error("Error searching by metadata:", error);
      throw error;
    }
  }

  /**
   * Fallback query when ChromaDB is not available
   * Uses Gemini directly without RAG, or hardcoded responses if no API key
   */
  private async fallbackQuery(
    query: string,
    options: RAGQueryOptions = {},
  ): Promise<RAGResponse> {
    const language = options.language || "en";

    // If Google API key is available, use Gemini directly
    if (process.env.GOOGLE_API_KEY) {
      try {
        const geminiModel = genAI.getGenerativeModel({
          model: "gemini-2.5-pro",
        });

        // Build profile context for personalized responses
        const profile = options.studentProfile;
        const profileContext = profile
          ? `\nStudent Profile: Name: ${profile.name || "Student"}, College: ${profile.collegeName || "Unknown"}, Branch: ${options.branch || profile.collegeName || "Unknown"}, Year: ${profile.year || "Unknown"}, Hostel: ${profile.hostelResident ? "Yes" : "No"}, Interests: ${profile.interests?.join(", ") || "Not specified"}.\nPersonalize your response based on this student's profile.`
          : "";

        const prompt =
          language === "hi"
            ? `आप P.A.L. हैं - एक कैंपस सहायक AI। ${profileContext}\n\nनिम्नलिखित प्रश्न का संक्षिप्त और सहायक उत्तर दें:\n\n${query}\n\nअपने सामान्य ज्ञान का उपयोग करके सर्वोत्तम संभव सलाह दें।`
            : `You are P.A.L. - a helpful AI campus assistant for college onboarding.${profileContext}\n\nAnswer the following question concisely and helpfully using your general knowledge:\n\n${query}\n\nProvide the best possible advice you can.`;

        const result = await geminiModel.generateContent(prompt);
        const answer = result.response.text();

        return {
          answer,
          sources: [],
          confidence: 0.6,
          language,
        };
      } catch (error) {
        logger.error("Error calling Gemini in fallback:", error);
        // Fall through to hardcoded responses
      }
    }

    // Hardcoded smart responses when no API key is available
    logger.info("Using hardcoded responses (no GOOGLE_API_KEY configured)");
    const answer = this.getHardcodedResponse(query, language);

    return {
      answer,
      sources: [],
      confidence: 0.7,
      language,
    };
  }

  /**
   * Get a hardcoded response based on keyword matching
   */
  private getHardcodedResponse(query: string, language: string): string {
    const q = query.toLowerCase();

    // Knowledge base of campus topics
    const responses: Array<{ keywords: string[]; en: string; hi: string }> = [
      {
        keywords: ["fee", "fees", "payment", "tuition", "deadline", "pay"],
        en: "**Fee Information:**\n\n📅 **Fee Deadline:** The fee payment deadline for this semester is typically within the first 2 weeks of the semester. Check your student portal for exact dates.\n\n💰 **Payment Methods:**\n• Online banking (recommended)\n• UPI / Net Banking\n• Demand Draft at the accounts office\n\n📞 Contact the Accounts Office at Block A, 1st Floor for any fee-related queries.\n\n*Tip: Set a reminder a week before the deadline to avoid late fees!*",
        hi: "**शुल्क जानकारी:**\n\n📅 **शुल्क की अंतिम तिथि:** इस सेमेस्टर के लिए शुल्क भुगतान की अंतिम तिथि आमतौर पर सेमेस्टर के पहले 2 सप्ताह के भीतर होती है।\n\n💰 **भुगतान के तरीके:**\n• ऑनलाइन बैंकिंग\n• UPI / नेट बैंकिंग\n• डिमांड ड्राफ्ट\n\n📞 शुल्क संबंधी प्रश्नों के लिए लेखा कार्यालय से संपर्क करें।",
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
        en: "**Hostel Information:**\n\n🏠 **Hostel Allotment:** Hostel rooms are allotted based on year and branch. First-year students typically get shared rooms (2-3 per room).\n\n📋 **What to bring:**\n• Mattress, bedsheet, pillow\n• Bucket, mug, toiletries\n• Study lamp\n• Valid ID proof\n\n🍽️ **Mess Timings:**\n• Breakfast: 7:30 - 9:00 AM\n• Lunch: 12:30 - 2:00 PM\n• Dinner: 7:30 - 9:00 PM\n\n📞 Contact the Hostel Warden's office for room-related queries.",
        hi: "**छात्रावास जानकारी:**\n\n🏠 **कमरा आवंटन:** कमरे वर्ष और शाखा के आधार पर आवंटित किए जाते हैं।\n\n🍽️ **मेस का समय:**\n• नाश्ता: 7:30 - 9:00 AM\n• दोपहर का भोजन: 12:30 - 2:00 PM\n• रात का भोजन: 7:30 - 9:00 PM",
      },
      {
        keywords: [
          "subject",
          "course",
          "core",
          "elective",
          "syllabus",
          "curriculum",
          "class",
          "timetable",
          "schedule",
        ],
        en: "**Academic Information:**\n\n📚 **Core Subjects (1st Year CS):**\n• Mathematics I / II\n• Physics / Chemistry\n• Programming in C / Python\n• Data Structures\n• Digital Electronics\n• English / Communication Skills\n\n📋 **Electives** are available from 3rd semester onwards.\n\n⏰ **Timetable:** Check the department notice board or student portal for the latest class schedule.\n\n💡 *Tip: Attend the orientation session to understand the full curriculum structure!*",
        hi: "**शैक्षणिक जानकारी:**\n\n📚 **मुख्य विषय (प्रथम वर्ष CS):**\n• गणित I / II\n• भौतिकी / रसायन\n• C / Python में प्रोग्रामिंग\n• डेटा स्ट्रक्चर्स\n• डिजिटल इलेक्ट्रॉनिक्स\n\n⏰ **समय सारणी:** विभाग के नोटिस बोर्ड पर देखें।",
      },
      {
        keywords: [
          "exam",
          "test",
          "marks",
          "grade",
          "gpa",
          "cgpa",
          "result",
          "midterm",
          "semester",
        ],
        en: "**Examination Information:**\n\n📝 **Exam Schedule:**\n• Mid-Semester Exams: Usually in Week 7-8\n• End-Semester Exams: As per university calendar\n• Internal Assessments: Continuous throughout the semester\n\n📊 **Grading System:**\n• Internal: 30-40% (assignments, quizzes, mid-sem)\n• External: 60-70% (end-sem exam)\n• Minimum passing: 40% overall\n\n📞 Contact the Examination Cell for specific queries about results and revaluation.",
        hi: "**परीक्षा जानकारी:**\n\n📝 **परीक्षा कार्यक्रम:**\n• मध्य-सेमेस्टर: सप्ताह 7-8 में\n• अंत-सेमेस्टर: विश्वविद्यालय कैलेंडर के अनुसार\n\n📊 **ग्रेडिंग:** आंतरिक 30-40% + बाह्य 60-70%",
      },
      {
        keywords: ["library", "book", "borrow", "return", "study", "reading"],
        en: "**Library Information:**\n\n📖 **Library Hours:**\n• Monday - Friday: 8:00 AM - 9:00 PM\n• Saturday: 9:00 AM - 5:00 PM\n• Sunday: Closed (exam period: open)\n\n📚 **Borrowing Rules:**\n• UG Students: Up to 3 books at a time\n• Loan period: 14 days (renewable once)\n• Late fee: ₹2/day/book\n\n💻 **Digital Resources:** Access e-journals and e-books through the library portal with your student ID.\n\n📍 Located at the Central Academic Block, 2nd Floor.",
        hi: "**पुस्तकालय जानकारी:**\n\n📖 **समय:** सोमवार-शुक्रवार: 8:00 AM - 9:00 PM\n📚 **नियम:** एक बार में 3 पुस्तकें, 14 दिन के लिए\n📍 केंद्रीय शैक्षणिक भवन, दूसरी मंजिल",
      },
      {
        keywords: [
          "club",
          "society",
          "extracurricular",
          "sports",
          "cultural",
          "technical",
          "event",
          "fest",
        ],
        en: "**Clubs & Activities:**\n\n🎭 **Cultural Clubs:** Drama, Music, Dance, Art, Photography\n💻 **Technical Clubs:** Coding Club, Robotics, AI/ML, Cyber Security\n⚽ **Sports:** Cricket, Football, Basketball, Badminton, Athletics\n📰 **Others:** Debate Society, Entrepreneurship Cell, NSS/NCC\n\n📋 **How to Join:** Club registrations usually happen during the first 2 weeks. Visit the Student Activity Center or check notice boards.\n\n💡 *Joining clubs is a great way to build your network and develop skills beyond academics!*",
        hi: "**क्लब और गतिविधियां:**\n\n🎭 **सांस्कृतिक:** नाटक, संगीत, नृत्य\n💻 **तकनीकी:** कोडिंग, रोबोटिक्स, AI/ML\n⚽ **खेल:** क्रिकेट, फुटबॉल, बैडमिंटन\n\n📋 पहले 2 सप्ताह में पंजीकरण करें।",
      },
      {
        keywords: [
          "wifi",
          "internet",
          "email",
          "id",
          "portal",
          "login",
          "password",
          "erp",
        ],
        en: "**IT Services:**\n\n📶 **WiFi Access:**\n• Network: Campus-WiFi\n• Login with your student ID and password\n• Available across campus and hostels\n\n📧 **College Email:** You'll receive a college email (name@college.edu) within the first week.\n\n🔑 **Student Portal / ERP:** Access at portal.college.edu for:\n• Attendance, Grades, Fee payments\n• Course registration, Timetable\n\n📞 IT Helpdesk: Block B, Ground Floor (Mon-Sat, 9 AM - 5 PM)",
        hi: "**आईटी सेवाएं:**\n\n📶 **WiFi:** छात्र ID से लॉगिन करें\n📧 **ईमेल:** पहले सप्ताह में कॉलेज ईमेल मिलेगा\n🔑 **पोर्टल:** portal.college.edu पर उपस्थिति, ग्रेड, शुल्क देखें",
      },
      {
        keywords: [
          "help",
          "support",
          "counselor",
          "mental",
          "health",
          "stress",
          "anxiety",
          "wellness",
        ],
        en: "**Support Services:**\n\n🧠 **Mental Health Support:**\n• Campus Counselor: Available Mon-Fri, 10 AM - 5 PM\n• Confidential and free for all students\n\n🏥 **Health Center:** Block C, Ground Floor\n• General physician available daily\n• First aid and basic medications\n\n📞 **Emergency Contacts:**\n• Campus Security: Ext. 100\n• Health Emergency: +91 98765 43210\n• Women's Helpline: Ext. 200\n\n💡 *Your well-being matters. Don't hesitate to reach out!*",
        hi: "**सहायता सेवाएं:**\n\n🧠 **मानसिक स्वास्थ्य:** परामर्शदाता सोमवार-शुक्रवार उपलब्ध\n🏥 **स्वास्थ्य केंद्र:** ब्लॉक C, भूतल\n📞 सुरक्षा: Ext. 100",
      },
      {
        keywords: [
          "hello",
          "hi",
          "hey",
          "good morning",
          "good evening",
          "namaste",
        ],
        en: "Hello! 👋 I'm **P.A.L.** - your Personal Assistant for Life on Campus!\n\nI can help you with:\n• 📚 Academic info (subjects, exams, timetable)\n• 🏠 Hostel & mess details\n• 💰 Fee information & deadlines\n• 📖 Library services\n• 🎭 Clubs & activities\n• 📶 IT services (WiFi, portal)\n• 🧠 Wellness & support\n\nJust ask me anything about campus life! 😊",
        hi: "नमस्ते! 👋 मैं **P.A.L.** हूं - आपका कैंपस सहायक!\n\nमैं इन विषयों में मदद कर सकता हूं:\n• 📚 शैक्षणिक जानकारी\n• 🏠 छात्रावास विवरण\n• 💰 शुल्क जानकारी\n• 📖 पुस्तकालय\n\nकुछ भी पूछें! 😊",
      },
      {
        keywords: ["thank", "thanks", "dhanyavaad", "shukriya"],
        en: "You're welcome! 😊 I'm glad I could help. If you have any more questions about campus life, feel free to ask anytime!\n\n💡 **Quick tip:** Bookmark important dates like fee deadlines and exam schedules so you never miss them!",
        hi: "आपका स्वागत है! 😊 अगर कोई और सवाल हो तो बेझिझक पूछें!",
      },
      {
        keywords: ["who are you", "what are you", "what can you do", "about"],
        en: "I'm **P.A.L.** — **Personal Assistant for Life on Campus** 🤖\n\nI'm an AI-powered assistant designed to help new students navigate their college journey. Here's what I can do:\n\n✅ Answer questions about academics, exams, and courses\n✅ Provide hostel, mess, and facility information\n✅ Help with fee deadlines and payment info\n✅ Guide you to clubs, events, and activities\n✅ Connect you with support services\n✅ Support both English and Hindi! 🇮🇳\n\n*I'm constantly learning to serve you better!*",
        hi: "मैं **P.A.L.** हूं — **कैंपस जीवन के लिए व्यक्तिगत सहायक** 🤖\n\nमैं नए छात्रों की मदद के लिए बनाया गया AI सहायक हूं। मैं शैक्षणिक, छात्रावास, शुल्क और अन्य विषयों में मदद कर सकता हूं।",
      },
    ];

    // Find the best matching response
    let bestMatch: { en: string; hi: string } | null = null;
    let bestScore = 0;

    for (const resp of responses) {
      const matchCount = resp.keywords.filter((kw) => q.includes(kw)).length;
      if (matchCount > bestScore) {
        bestScore = matchCount;
        bestMatch = resp;
      }
    }

    if (bestMatch && bestScore > 0) {
      return language === "hi" ? bestMatch.hi : bestMatch.en;
    }

    // Default response for unmatched queries
    return language === "hi"
      ? "मैं इस प्रश्न का उत्तर अभी नहीं दे सकता, लेकिन मैं इन विषयों में मदद कर सकता हूं:\n\n• 📚 शैक्षणिक जानकारी (विषय, परीक्षा)\n• 🏠 छात्रावास और मेस\n• 💰 शुल्क और भुगतान\n• 📖 पुस्तकालय\n• 🎭 क्लब और गतिविधियां\n• 📶 WiFi और पोर्टल\n• 🧠 स्वास्थ्य सहायता\n\nकृपया इनमें से कोई विषय पूछें, या अधिक जानकारी के लिए प्रशासन कार्यालय से संपर्क करें।"
      : "I don't have specific information about that yet, but I can help you with:\n\n• 📚 **Academics** — subjects, exams, timetable\n• 🏠 **Hostel & Mess** — allotment, timings\n• 💰 **Fees** — deadlines, payment methods\n• 📖 **Library** — hours, borrowing rules\n• 🎭 **Clubs** — cultural, technical, sports\n• 📶 **IT Services** — WiFi, portal, email\n• 🧠 **Wellness** — counseling, health center\n\nTry asking about any of these topics! For specific queries, you can also visit the Admin Office (Block A, Ground Floor).";
  }
}

export default new RAGService();
