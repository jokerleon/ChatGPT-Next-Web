import { NextRequest } from "next/server";

const OPENAI_URL = "api.openai.com";
const DEFAULT_PROTOCOL = "https";
const PROTOCOL = process.env.PROTOCOL ?? DEFAULT_PROTOCOL;
const BASE_URL = process.env.BASE_URL ?? OPENAI_URL;

export async function requestOpenai(req: NextRequest) {
  let baseUrl: string;
  let apiKey: string;
  let openaiPath: string;
  let finalUrl: string;

  const useAzureOpenAI =
    process.env.AZURE_OPENAI_API_BASE_URL &&
    process.env.AZURE_OPENAI_API_BASE_URL.length > 0;
  if (useAzureOpenAI) {
    let apiBaseUrl = process.env.AZURE_OPENAI_API_BASE_URL;
    const version = "2023-03-15-preview";
    const deployment = process.env.AZURE_OPENAI_DEPLOYMENT || "";
    if (apiBaseUrl && apiBaseUrl.endsWith("/")) {
      apiBaseUrl = apiBaseUrl.slice(0, -1);
    }

    baseUrl = `${apiBaseUrl}/openai/deployments/${deployment}/chat/completions?api-version=${version}`;
    apiKey = process.env.AZURE_OPENAI_API_KEY || "";
    openaiPath = req.headers.get("path") || "";
    finalUrl = baseUrl;
  } else {
    apiKey = req.headers.get("token") || "";
    openaiPath = req.headers.get("path") || "";

    baseUrl = BASE_URL;
    finalUrl = baseUrl + "/" + openaiPath;
  }

  if (!baseUrl.startsWith("http")) {
    baseUrl = `${PROTOCOL}://${baseUrl}`;
  }

  console.log("[Token] ", apiKey);
  console.log("[Proxy] ", openaiPath);
  console.log("[Base Url]", baseUrl);
  console.log("[Final Url]", finalUrl);

  if (process.env.OPENAI_ORG_ID) {
    console.log("[Org ID]", process.env.OPENAI_ORG_ID);
  }

  return fetch(`${finalUrl}`, {
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
      "api-key": `${apiKey}`,
      ...(process.env.OPENAI_ORG_ID && {
        "OpenAI-Organization": process.env.OPENAI_ORG_ID,
      }),
    },
    method: req.method,
    body: req.body,
  });
}
