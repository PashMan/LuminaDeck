import { GoogleGenAI, Type } from "@google/genai";

interface Env {
  GEMINI_API_KEY: string;
}

export const onRequestPost = async (context: any) => {
  try {
    const env = context.env as Env;
    const apiKey = env?.GEMINI_API_KEY;
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: "GEMINI_API_KEY environment variable is not configured on Cloudflare" }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    const body: any = await context.request.json();
    const {
      title,
      sourceType = "text",
      sourceContent,
      cardCount = 8,
      cardTypes = ["qa", "cloze", "code", "mcq"],
      difficulty = "intermediate",
      targetLanguage = "auto",
    } = body;

    if (!sourceContent || typeof sourceContent !== "string") {
      return new Response(
        JSON.stringify({ error: "sourceContent is required" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const ai = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });

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

    return new Response(
      JSON.stringify({
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
          repetitions: 0,
          interval: 0,
          easeFactor: 2.5,
          dueDate: new Date().toISOString(),
          lastReviewedAt: null,
          history: [],
        })),
      }),
      { headers: { "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Error generating cards:", error);
    return new Response(
      JSON.stringify({
        error: "Failed to generate cards via Gemini AI",
        details: error?.message || String(error),
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};
