const DEFAULT_CALLBACK_URL = "https://workflows.jelou.ai/v1/webview/callback";
const ALLOWED_CALLBACK_HOST = "workflows.jelou.ai";

function parseBody(req) {
  if (typeof req.body === "object" && req.body !== null) return req.body;
  if (typeof req.body === "string" && req.body.trim()) return JSON.parse(req.body);
  return {};
}

function getTargetUrl(callbackUrl, executionId) {
  const targetUrl = new URL(callbackUrl || DEFAULT_CALLBACK_URL);

  if (targetUrl.protocol !== "https:" || targetUrl.hostname !== ALLOWED_CALLBACK_HOST) {
    throw new Error("Callback URL no permitida");
  }

  if (executionId && !targetUrl.searchParams.has("executionId")) {
    targetUrl.searchParams.set("executionId", executionId);
  }

  return targetUrl.toString();
}

module.exports = async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    res.status(204).end();
    return;
  }

  if (req.method !== "POST") {
    res.status(405).json({ error: "Metodo no permitido" });
    return;
  }

  try {
    const body = parseBody(req);
    const { callbackUrl, ...callbackBody } = body;

    if (!callbackBody.executionId) {
      res.status(400).json({ error: "Falta executionId" });
      return;
    }

    const targetUrl = getTargetUrl(callbackUrl, callbackBody.executionId);
    const callbackResponse = await fetch(targetUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(callbackBody)
    });

    const responseText = await callbackResponse.text();

    if (!callbackResponse.ok) {
      res.status(callbackResponse.status).json({
        error: "Jelou rechazo el callback",
        status: callbackResponse.status,
        detail: responseText.slice(0, 500)
      });
      return;
    }

    res.status(200).json({
      success: true,
      status: callbackResponse.status
    });
  } catch (error) {
    res.status(500).json({
      error: error.message || "No se pudo enviar el callback"
    });
  }
};
