// api/analyze-pdf.js
// Vercel serverless function — AI-powered field detection for uploaded PDFs.
//
// Uses the official @google/generative-ai SDK instead of raw fetch to avoid
// 404 / model-not-found errors caused by manual URL construction.
import { GoogleGenerativeAI } from '@google/generative-ai';

// ---------------------------------------------------------------------------
// Increase Vercel's default 4.5 MB JSON body limit so large PDFs can be sent.
// ---------------------------------------------------------------------------
export const config = {
  api: {
    bodyParser: {
      sizeLimit: '10mb',
    },
  },
};

// ---------------------------------------------------------------------------
// Override Vercel Serverless Function Default Timeout (10s)
// Allow up to 60 seconds to accommodate slower AI responses.
// ---------------------------------------------------------------------------
export const maxDuration = 60;

// ---------------------------------------------------------------------------
// callGemini
// Sends the raw PDF (as base64) to Gemini 2.5 Flash via the official SDK.
// ---------------------------------------------------------------------------
async function callGemini(base64Pdf) {
  // Force trim to eliminate hidden newlines or spaces Vercel can inject into env vars.
  const apiKey = (process.env.GEMINI_API_KEY || '').trim();

  // Guard: fail immediately if the key is missing or looks like an unexpanded
  // template literal such as "${GEMINI_API_KEY}" — a common misconfiguration.
  if (!apiKey || apiKey.startsWith('${')) {
    throw new Error('GEMINI_API_KEY is not set or was not expanded by the environment.');
  }

  // Strip any data-URI prefix the frontend may have included, e.g.:
  // "data:application/pdf;base64,JVBERi0x..."
  // The Gemini SDK expects the raw base64 string only.
  const cleanBase64 = base64Pdf.replace(/^data:[^;]+;base64,/, '').trim();

  // Validate that the cleaned string looks like real base64 content.
  if (!cleanBase64 || cleanBase64.length < 100) {
    throw new Error('base64Pdf appears to be empty or too short after stripping the data-URI prefix.');
  }

  // Strict Initialization: Force API Version v1beta via getGenerativeModel
  // Passing apiVersion as the second argument ensures it uses v1beta,
  // which is required for the gemini-2.5-flash model.
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY.trim());
  
  const model = genAI.getGenerativeModel(
    {
      model: "gemini-2.5-flash",
      generationConfig: {
        temperature:     0.0,
        maxOutputTokens: 2048,
        responseMimeType: "application/json",
      },
    },
    { apiVersion: "v1beta" }
  );

 // ---------------------------------------------------------------------------
  // Prompt engineering - Strict dictionary-matching with coordinate extraction.
  // The model is instructed to behave as a text scanner, not a semantic reasoner.
  // Both normal and visually reversed Hebrew strings are listed as targets,
  // since Hebrew PDFs often encode characters in reverse visual order.
  // ---------------------------------------------------------------------------
  const SYSTEM_PROMPT = `You are a strict text-matching and coordinate extraction tool. Stop semantic reasoning. Scan the document exclusively for the following exact phrases (which include visually reversed Hebrew text due to PDF encoding):

SIGNATURE Targets: 'signature', 'חתימה', 'תמיתח', 'חתימת מלגאי/ת', 'ת/יאגלמ תמיתח', 'חתום כאן', 'נאכ םותח'.

DATE Targets: 'date', 'תאריך', 'ךיראת'.

NAME Targets: 'name', 'שם', 'מש', 'שם מלא', 'אלמ םש'.

When you find an exact match from these targets, look at the blank line or space immediately adjacent to it and calculate its ACTUAL fractional coordinates (0.0 to 1.0).
Return ONLY a valid JSON array. Example of expected format: [{"type": "date", "label": "ךיראת", "nx": 0.25, "ny": 0.85, "nw": 0.2, "nh": 0.05, "page": 1}]`;

  console.log("[analyze-pdf] Calling Gemini v1beta with model: gemini-2.5-flash");

  // Send the prompt text + PDF inline data. 
  // cleanBase64 has had any data-URI prefix stripped, so only raw base64 is sent.
  const result = await model.generateContent([
    { text: SYSTEM_PROMPT },
    {
      inlineData: {
        mimeType: 'application/pdf',
        data:     cleanBase64,
      },
    },
  ]);

  const rawText = result.response.text() ?? '';

  // Strip accidental markdown code fences before parsing
  const jsonString = rawText
    .replace(/```(?:json)?/gi, '')
    .replace(/```/g, '')
    .trim();

  let suggestions;
  try {
    suggestions = JSON.parse(jsonString);
  } catch {
    console.warn('[analyze-pdf] Gemini returned non-JSON content; falling back to []. Raw output:', rawText);
    return [];
  }

  if (!Array.isArray(suggestions)) {
    console.warn('[analyze-pdf] Gemini response is not a JSON array; falling back to []. Got:', suggestions);
    return [];
  }

  // Use AI-provided coordinates when available; fall back to cascading defaults
  // so fields are still visible even if the model omits coordinate properties.
  return suggestions.map((s, i) => ({
    type:       s.type || 'customText',
    label:      s.label || s.type || 'Field',
    page:       s.page  ?? 1,
    nx:         s.nx ?? 0.05,
    ny:         s.ny ?? (0.10 + (i * 0.08)),
    nw:         s.nw ?? 0.20,
    nh:         s.nh ?? 0.05,
    confidence: 1.0,
  }));
}

// ---------------------------------------------------------------------------
// Main handler
// ---------------------------------------------------------------------------
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { base64Pdf } = req.body;

  if (!base64Pdf || typeof base64Pdf !== 'string') {
    return res.status(400).json({ error: '`base64Pdf` string is required in the request body.' });
  }

  try {
    const suggestions = await callGemini(base64Pdf);
    return res.status(200).json({ suggestions });
  } catch (error) {
    console.error('[analyze-pdf] Error:', error.message);
    
    // Detect quota / rate-limit errors from the Gemini SDK and forward 429
    const isQuotaError =
      error.message?.includes('429') ||
      /quota/i.test(error.message || '');
      
    const statusCode = isQuotaError ? 429 : 500;
    return res.status(statusCode).json({ error: error.message });
  }
}
