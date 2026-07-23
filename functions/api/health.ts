interface Env {
  GEMINI_API_KEY: string;
}

export const onRequest = async (context: any) => {
  const env = context.env as Env;
  const apiKey = env?.GEMINI_API_KEY;
  return new Response(
    JSON.stringify({
      status: "ok",
      geminiConfigured: !!apiKey,
      runtime: "cloudflare-pages-workers",
    }),
    {
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
    }
  );
};
