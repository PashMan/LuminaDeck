import { GoogleGenAI } from "@google/genai";

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
    const { question, answer, explanation = "", userQuery = "" } = body;

    const ai = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });

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

    return new Response(
      JSON.stringify({ success: true, explanation: response.text }),
      { headers: { "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Error generating explanation:", error);
    return new Response(
      JSON.stringify({
        error: "Failed to generate AI explanation",
        details: error?.message || String(error),
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};
