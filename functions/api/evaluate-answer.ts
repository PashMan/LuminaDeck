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
        JSON.stringify({ error: "GEMINI_API_KEY environment variable is not configured" }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    const body: any = await context.request.json();
    const { question, expectedAnswer, userAnswer, cardType = "qa", explanation = "" } = body;

    if (!question || !expectedAnswer || userAnswer === undefined) {
      return new Response(
        JSON.stringify({ error: "question, expectedAnswer, and userAnswer are required" }),
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

    return new Response(
      JSON.stringify({ success: true, evaluation: result }),
      { headers: { "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Error evaluating answer:", error);
    return new Response(
      JSON.stringify({
        error: "Failed to evaluate answer semantically",
        details: error?.message || String(error),
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};
