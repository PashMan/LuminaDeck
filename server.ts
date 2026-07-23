import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

app.use(express.json({ limit: "10mb" }));

// Initialize Gemini SDK with telemetry header
const getGeminiClient = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY environment variable is not configured");
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });
};

// API Health Check
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", geminiConfigured: !!process.env.GEMINI_API_KEY });
});

// API: Generate Cards from Notes / Topic / Document
app.post("/api/generate-cards", async (req, res) => {
  try {
    const {
      title,
      sourceType = "text",
      sourceContent,
      cardCount = 8,
      cardTypes = ["qa", "cloze", "code", "mcq"],
      difficulty = "intermediate",
      targetLanguage = "auto",
    } = req.body;

    if (!sourceContent || typeof sourceContent !== "string") {
      return res.status(400).json({ error: "sourceContent is required" });
    }

    const ai = getGeminiClient();

    const prompt = `
You are an expert educational instructional designer and Anki flashcard engineer.
Your task is to take the following learning source material and break it down into atomic, high-retention interactive flashcards using spaced repetition best practices.

SOURCE TYPE: ${sourceType}
SOURCE TITLE/TOPIC: ${title || "Untitled Deck"}
TARGET CARD COUNT: Approximately ${cardCount} cards
ALLOWED CARD TYPES: ${cardTypes.join(", ")}
DIFFICULTY LEVEL: ${difficulty}
LANGUAGE: ${targetLanguage === "auto" ? "Detect language from source (Russian or English preferred)" : targetLanguage}

RULES FOR HIGH-QUALITY FLASHCARDS:
1. ATOMIC PRINCIPLE: Each card must test strictly ONE core concept, fact, syntax rule, or key insight.
2. DIVERSE CARD FORMATS:
   - "qa": Short, direct question with a concise, punchy answer.
   - "cloze": Fill-in-the-blank text where critical terms are replaced by {{c1::hidden_value}}.
   - "code": A code snippet with a question asking for output, bug fix, or missing method.
   - "mcq": A conceptual multiple-choice question with 4 options and 1 clear correct answer.
3. CLEAR EXPLANATION: Include a short "explanation" field detailing WHY the answer is correct and a memory trick/mnemonic if applicable.
4. TAGS: Include 1-3 concise tags (e.g., ["postgres", "indexing", "performance"]).

Source Material:
"""
${sourceContent.slice(0, 15000)}
"""

Return a JSON object containing the deck title, deck description, tags, and an array of generated cards.
`;

    const response = await ai.models.generateContent({
      model: "gemini-3.6-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            deckTitle: { type: Type.STRING, description: "Clear descriptive deck title" },
            deckDescription: { type: Type.STRING, description: "Short summary of what this deck covers" },
            tags: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "Primary topic tags",
            },
            cards: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  type: {
                    type: Type.STRING,
                    description: "One of 'qa', 'cloze', 'code', or 'mcq'",
                  },
                  question: { type: Type.STRING, description: "The flashcard prompt or question" },
                  answer: { type: Type.STRING, description: "The exact reference answer" },
                  explanation: { type: Type.STRING, description: "Brief intuitive explanation or mnemonic" },
                  clozeText: {
                    type: Type.STRING,
                    description: "For cloze cards: full text with {{c1::cloze term}} markers",
                  },
                  codeSnippet: {
                    type: Type.STRING,
                    description: "Optional code block in markdown or code format",
                  },
                  options: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                    description: "For MCQ cards: 4 choices",
                  },
                  correctOptionIndex: {
                    type: Type.INTEGER,
                    description: "For MCQ: 0-based index of correct option",
                  },
                  tags: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                  },
                },
                required: ["type", "question", "answer", "explanation"],
              },
            },
          },
          required: ["deckTitle", "deckDescription", "cards"],
        },
      },
    });

    const jsonText = response.text || "{}";
    const data = JSON.parse(jsonText);

    return res.json({
      success: true,
      deckTitle: data.deckTitle || title || "Generated Deck",
      deckDescription: data.deckDescription || "AI-generated flashcards from source material.",
      tags: data.tags || ["AI Generated"],
      cards: (data.cards || []).map((card: any, idx: number) => ({
        id: `card_${Date.now()}_${idx}`,
        type: card.type || "qa",
        question: card.question || "Question",
        answer: card.answer || "Answer",
        explanation: card.explanation || "",
        clozeText: card.clozeText || "",
        codeSnippet: card.codeSnippet || "",
        options: card.options || [],
        correctOptionIndex: typeof card.correctOptionIndex === "number" ? card.correctOptionIndex : 0,
        tags: card.tags || [],
        // Initial SM-2 spaced repetition values
        repetitions: 0,
        interval: 0, // in days
        easeFactor: 2.5,
        dueDate: new Date().toISOString(),
        lastReviewedAt: null,
        history: [],
      })),
    });
  } catch (error: any) {
    console.error("Error generating cards:", error);
    return res.status(500).json({
      error: "Failed to generate cards via Gemini AI",
      details: error?.message || String(error),
    });
  }
});

// API: Evaluate User's Free-Form Answer Semantically
app.post("/api/evaluate-answer", async (req, res) => {
  try {
    const { question, expectedAnswer, userAnswer, cardType = "qa", explanation = "" } = req.body;

    if (!question || !expectedAnswer || userAnswer === undefined) {
      return res.status(400).json({ error: "question, expectedAnswer, and userAnswer are required" });
    }

    const ai = getGeminiClient();

    const prompt = `
You are an intelligent educational grading agent for spaced repetition flashcards.
Evaluate the user's answer semantically against the reference answer. Do NOT insist on exact word-for-word string match. Focus on conceptual understanding, key technical terms, and correctness.

CARD QUESTION: "${question}"
REFERENCE ANSWER: "${expectedAnswer}"
ADDITIONAL CONTEXT/EXPLANATION: "${explanation}"
USER'S ANSWER: "${userAnswer}"

EVALUATION CRITERIA:
1. Score from 0 to 100 based on accuracy and coverage of core concepts.
2. Determine if it is functionally correct (isCorrect: true if score >= 70 or user captured the core idea).
3. Assign Anki SuperMemo SM-2 Rating (1 to 4):
   - 1 = Again (Complete fail, incorrect, or major misunderstanding)
   - 2 = Hard (Partially correct, missed important details, required recall effort)
   - 3 = Good (Correct understanding with minor omissions or slightly informal phrasing)
   - 4 = Easy (Spot on, full accuracy, articulate and complete)
4. Provide constructive short feedback (1-2 sentences) in the language of the prompt/answer.
5. List key points the user correctly mentioned and any missed key terms.

Return a JSON object matching the requested schema.
`;

    const response = await ai.models.generateContent({
      model: "gemini-3.6-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            score: { type: Type.INTEGER, description: "0 to 100 percentage score" },
            isCorrect: { type: Type.BOOLEAN, description: "true if user answer is acceptable" },
            sm2Rating: { type: Type.INTEGER, description: "1 (Again), 2 (Hard), 3 (Good), 4 (Easy)" },
            ratingLabel: { type: Type.STRING, description: "Again, Hard, Good, or Easy" },
            feedback: { type: Type.STRING, description: "Short supportive, informative feedback" },
            keyPointsCovered: { type: Type.ARRAY, items: { type: Type.STRING } },
            missingPoints: { type: Type.ARRAY, items: { type: Type.STRING } },
            idealPhrasingTip: { type: Type.STRING, description: "Quick tip to remember key term" },
          },
          required: ["score", "isCorrect", "sm2Rating", "ratingLabel", "feedback"],
        },
      },
    });

    const jsonText = response.text || "{}";
    const result = JSON.parse(jsonText);

    return res.json({ success: true, evaluation: result });
  } catch (error: any) {
    console.error("Error evaluating answer:", error);
    return res.status(500).json({
      error: "Failed to evaluate answer semantically",
      details: error?.message || String(error),
    });
  }
});

// API: AI Explain Like I'm 5 / Deep Dive Mnemonic
app.post("/api/explain-card", async (req, res) => {
  try {
    const { question, answer, explanation = "", userQuery = "" } = req.body;

    const ai = getGeminiClient();

    const prompt = `
You are a friendly, genius tutor explaining a complex concept from a flashcard.

FLASHCARD QUESTION: "${question}"
FLASHCARD ANSWER: "${answer}"
CONTEXT: "${explanation}"
USER QUESTION / REQUEST: "${userQuery || "Explain this in a simple, memorable way with a real-world analogy and mnemonic."}"

Deliver a response formatted in Markdown with:
1. 💡 **Intuitive Analogy (ELI5)**: A relatable real-world comparison.
2. 🔑 **Core Principle**: Breakdown in 2 bullet points.
3. 🧠 **Mnemonic or Memory Trick**: A clever rule, acronym, or visualization to never forget this.
`;

    const response = await ai.models.generateContent({
      model: "gemini-3.6-flash",
      contents: prompt,
    });

    return res.json({ success: true, explanation: response.text });
  } catch (error: any) {
    console.error("Error generating explanation:", error);
    return res.status(500).json({
      error: "Failed to generate AI explanation",
      details: error?.message || String(error),
    });
  }
});

// Serve Vite dev server or static build
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`MemPulse AI Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
