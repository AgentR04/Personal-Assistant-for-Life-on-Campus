import { GoogleGenerativeAI } from "@google/generative-ai";
import { ChromaClient, CloudClient } from "chromadb";
import { config } from "dotenv";
import { readFileSync } from "fs";
import { resolve } from "path";

// Load environment variables
config({ path: resolve(__dirname, "../../.env") });

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY || "");

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

interface Intent {
  intent: string;
  text: string[];
  responses: string[];
  context?: { out?: string };
}

async function generateEmbedding(text: string): Promise<number[]> {
  const model = genAI.getGenerativeModel({ model: "gemini-embedding-001" });
  const result = await model.embedContent(text);
  return result.embedding.values;
}

async function seedKnowledgeBase() {
  console.log("🚀 Starting ChromaDB knowledge base seeding...\n");

  // 1. Read dataset.json
  const datasetPath = resolve(__dirname, "../../dataset.json");
  let dataset: { intents: Intent[] };
  try {
    const raw = readFileSync(datasetPath, "utf-8");
    dataset = JSON.parse(raw);
    console.log(
      `📂 Loaded dataset.json with ${dataset.intents.length} intents`,
    );
  } catch (err) {
    console.error("❌ Failed to read dataset.json:", err);
    process.exit(1);
  }

  // 2. Connect to ChromaDB
  let collection;
  try {
    collection = await chromaClient.getOrCreateCollection({
      name: COLLECTION_NAME,
      metadata: { description: "P.A.L. Knowledge Base" },
    });
    console.log(`✅ Connected to ChromaDB collection '${COLLECTION_NAME}'`);
  } catch (err) {
    console.error("❌ Failed to connect to ChromaDB:", err);
    process.exit(1);
  }

  // 3. Check existing document count
  const existingCount = await collection.count();
  if (existingCount > 0) {
    console.log(`⚠️  Collection already has ${existingCount} documents.`);
    console.log(
      `   Skipping seed to avoid duplicates. Delete collection first to re-seed.`,
    );
    process.exit(0);
  }

  // 4. Convert intents to documents
  const documents: string[] = [];
  const metadatas: Record<string, string>[] = [];
  const ids: string[] = [];

  // Skip non-informational intents
  const skipIntents = new Set([
    "greeting",
    "goodbye",
    "creator",
    "name",
    "random",
    "swear",
    "salutaion",
    "task",
  ]);

  for (const intent of dataset.intents) {
    if (skipIntents.has(intent.intent)) continue;

    // Build a rich document from patterns + responses
    const patterns = intent.text.join(", ");
    const response = intent.responses.join(" ");
    const category = intent.context?.out || intent.intent;

    const docContent = `Topic: ${intent.intent}\nCommon questions: ${patterns}\nAnswer: ${response}`;

    documents.push(docContent);
    metadatas.push({
      title: intent.intent,
      source: "dataset.json",
      documentType: "faq",
      category: category,
    });
    ids.push(`dataset_${intent.intent}_${Date.now()}`);
  }

  console.log(`\n📝 Prepared ${documents.length} documents for embedding\n`);

  // 5. Generate embeddings and add in batches
  const batchSize = 5;
  let added = 0;

  for (let i = 0; i < documents.length; i += batchSize) {
    const batchDocs = documents.slice(i, i + batchSize);
    const batchMeta = metadatas.slice(i, i + batchSize);
    const batchIds = ids.slice(i, i + batchSize);

    try {
      // Generate embeddings for batch
      const embeddings: number[][] = [];
      for (const doc of batchDocs) {
        const embedding = await generateEmbedding(doc);
        embeddings.push(embedding);
        // Small delay to avoid rate limits
        await new Promise((r) => setTimeout(r, 200));
      }

      await collection.add({
        ids: batchIds,
        embeddings,
        documents: batchDocs,
        metadatas: batchMeta,
      });

      added += batchDocs.length;
      console.log(
        `  ✅ Added batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(documents.length / batchSize)} (${added}/${documents.length} docs)`,
      );
    } catch (err) {
      console.error(`  ❌ Failed batch starting at index ${i}:`, err);
    }
  }

  console.log(`\n🎉 Seeding complete! Added ${added} documents to ChromaDB.`);

  // 6. Verify
  const finalCount = await collection.count();
  console.log(`📊 Total documents in collection: ${finalCount}`);
}

seedKnowledgeBase()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("❌ Seeding failed:", err);
    process.exit(1);
  });
