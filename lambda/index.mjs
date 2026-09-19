import instructions from "./carelinkAI.json" with { type: "json" };

const NVIDIA_API_URL =
  "https://integrate.api.nvidia.com/v1/chat/completions";

const MODEL = "meta/llama-3.2-11b-vision-instruct";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "content-type",
  "Access-Control-Allow-Methods": "POST,OPTIONS",
  "Content-Type": "application/json",
};

export const handler = async (event) => {
  try {
    if (event.requestContext?.http?.method === "OPTIONS") {
      return {
        statusCode: 204,
        headers: CORS_HEADERS,
        body: "",
      };
    }

    const body =
      typeof event.body === "string"
        ? JSON.parse(event.body)
        : event.body;

    const message = body?.message;

    if (!message || typeof message !== "string") {
      return {
        statusCode: 400,
        headers: CORS_HEADERS,
        body: JSON.stringify({
          error: "A message is required.",
        }),
      };
    }

    const apiKey = process.env.NVIDIA_API_KEY;

    if (!apiKey) {
      throw new Error(
        "NVIDIA_API_KEY environment variable is missing."
      );
    }

    console.log("Calling NVIDIA...");
    console.log("Model:", MODEL);

    const controller = new AbortController();

    const timeout = setTimeout(() => {
      controller.abort();
    }, 30000);

    let response;

    try {
      response = await fetch(NVIDIA_API_URL, {
        method: "POST",

        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
          Accept: "application/json",
        },

        body: JSON.stringify({
          model: MODEL,
        
          messages: [
            {
              role: "system",
              content:
                typeof instructions === "string"
                  ? instructions
                  : JSON.stringify(instructions),
            },
            {
              role: "user",
              content: message,
            },
          ],
        
          temperature: 0.2,
          max_tokens: 100,
          stream: false,
        }),

        signal: controller.signal,
      });
    } finally {
      clearTimeout(timeout);
    }

    console.log("NVIDIA HTTP status:", response.status);

    const result = await response.json();

    if (!response.ok) {
      console.error(
        "NVIDIA API error:",
        JSON.stringify(result)
      );

      return {
        statusCode: response.status,
        headers: CORS_HEADERS,
        body: JSON.stringify({
          error: "NVIDIA API request failed.",
          details: result,
        }),
      };
    }

    const reply = result.choices?.[0]?.message?.content;

    if (!reply) {
      console.error(
        "Unexpected NVIDIA response:",
        JSON.stringify(result)
      );

      throw new Error(
        "NVIDIA returned no assistant response."
      );
    }

    console.log("NVIDIA request completed successfully.");

    return {
      statusCode: 200,
      headers: CORS_HEADERS,
      body: JSON.stringify({
        reply,
      }),
    };
  } catch (error) {
    console.error("Lambda error:", error);

    if (error.name === "AbortError") {
      return {
        statusCode: 504,
        headers: CORS_HEADERS,
        body: JSON.stringify({
          error: "NVIDIA request timed out after 30 seconds.",
        }),
      };
    }

    return {
      statusCode: 500,
      headers: CORS_HEADERS,
      body: JSON.stringify({
        error: error.message,
      }),
    };
  }
};