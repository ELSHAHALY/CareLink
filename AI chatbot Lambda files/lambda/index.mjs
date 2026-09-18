import https from 'https';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ─────────────────────────────────────────────────────────────────────────────
// 1. SINGLE SOURCE OF TRUTH (SSOT): Load carelinkAI.json from the same folder
// ─────────────────────────────────────────────────────────────────────────────
let carelinkKnowledge = null;
try {
    const kbPath = path.join(__dirname, 'carelinkAI.json');
    if (fs.existsSync(kbPath)) {
        const fileContent = fs.readFileSync(kbPath, 'utf-8');
        carelinkKnowledge = JSON.parse(fileContent);
        console.log('✅ carelinkAI.json loaded successfully as Single Source of Truth.');
    } else {
        console.warn('⚠️ carelinkAI.json not found in the same folder as index.mjs.');
    }
} catch (err) {
    console.error('❌ Error reading carelinkAI.json:', err.message);
}

// Common CORS headers for both preflight (OPTIONS) and standard responses
const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
    'Access-Control-Allow-Methods': 'OPTIONS, POST, GET',
    'Content-Type': 'application/json'
};

/**
 * Check if the user query directly matches any FAQ item in carelinkAI.json.
 * This provides instant answers from the Single Source of Truth with zero latency.
 */
function findDirectFAQMatch(userMessage) {
    if (!carelinkKnowledge?.carelink_faq || !Array.isArray(carelinkKnowledge.carelink_faq)) {
        return null;
    }

    const cleanInput = userMessage.toLowerCase().replace(/[^\w\s]/g, '').trim();

    for (const item of carelinkKnowledge.carelink_faq) {
        const cleanQuestion = item.question.toLowerCase().replace(/[^\w\s]/g, '').trim();
        // Exact match or high-confidence match
        if (cleanInput === cleanQuestion || cleanInput.includes(cleanQuestion) || cleanQuestion.includes(cleanInput)) {
            return item.answer;
        }
    }

    return null;
}

/**
 * Construct the system prompt injecting the entire carelinkAI.json file
 * so the LLM strictly adheres to it as the Single Source of Truth.
 */
function buildSystemPrompt() {
    let prompt = `You are CareLink AI, the healthcare appointment assistant for the CareLink platform.\n\n`;

    if (carelinkKnowledge) {
        prompt += `======================================================================
CAREKNOWLEDGE BASE (SINGLE SOURCE OF TRUTH)
You MUST strictly follow and rely on the following CareLink knowledge base:
======================================================================
${JSON.stringify(carelinkKnowledge, null, 2)}
======================================================================

STRICT INSTRUCTIONS:
1. Use the knowledge base above as your absolute Single Source of Truth.
2. Follow all "core_rules" defined in the knowledge base.
3. NEVER diagnose medical conditions or prescribe medications or dosages.
4. If a user presents emergency or severe symptoms (e.g. chest pain, shortness of breath), immediately urge them to seek emergency medical care.
5. When symptoms are mentioned, reference "symptom_to_specialization" from the knowledge base to guide the user to the appropriate medical field (e.g. skin -> Dermatology, chest pain -> Cardiology).
6. Do NOT fabricate doctors, ratings, or appointment availability.
7. Respect the "out_of_scope" section and politely redirect off-topic inquiries.
8. Keep your responses clear, helpful, empathetic, and concise.`;
    } else {
        prompt += `Rules:
1. Help users understand and use CareLink.
2. Answer general health education, but NEVER diagnose conditions or prescribe medications.
3. For emergency symptoms, urge users to seek immediate medical care.
4. Guide users to relevant medical specializations based on symptoms.
5. Keep answers concise and professional.`;
    }

    return prompt;
}

export const handler = async (event) => {
    // ─────────────────────────────────────────────
    // 1. Handle CORS Preflight (OPTIONS request)
    // ─────────────────────────────────────────────
    const httpMethod = event.requestContext?.http?.method || event.httpMethod;
    if (httpMethod === 'OPTIONS') {
        return {
            statusCode: 204,
            headers: corsHeaders,
            body: ''
        };
    }

    try {
        // ─────────────────────────────────────────────
        // 2. Parse incoming request body from React
        // ─────────────────────────────────────────────
        let body = event.body;
        if (event.isBase64Encoded && typeof body === 'string') {
            body = Buffer.from(body, 'base64').toString('utf-8');
        }

        if (typeof body === 'string') {
            try {
                body = JSON.parse(body);
            } catch (err) {
                console.warn('Failed to parse body as JSON:', err.message);
                body = {};
            }
        }
        body = body || {};

        const userMessage = (body?.message || body?.prompt || '').trim();
        const rawHistory = Array.isArray(body?.conversationHistory) ? body.conversationHistory : [];

        if (!userMessage) {
            return {
                statusCode: 400,
                headers: corsHeaders,
                body: JSON.stringify({
                    reply: 'Please provide a message.',
                    message: 'Please provide a message.'
                })
            };
        }

        // ─────────────────────────────────────────────
        // 3. STEP 1: Check carelinkAI.json FIRST!
        //    If the question is an exact FAQ match in
        //    the Single Source of Truth, answer immediately.
        // ─────────────────────────────────────────────
        const directAnswer = findDirectFAQMatch(userMessage);
        if (directAnswer) {
            console.log(`Direct FAQ match found in carelinkAI.json for query: "${userMessage}"`);
            return {
                statusCode: 200,
                headers: corsHeaders,
                body: JSON.stringify({
                    reply: directAnswer,
                    message: directAnswer,
                    source: 'carelinkAI.json'
                })
            };
        }

        // ─────────────────────────────────────────────
        // 4. STEP 2: Query the LLM using carelinkAI.json
        //    injected as the Single Source of Truth context
        // ─────────────────────────────────────────────
        const apiKey = process.env.NIM_API_KEY ||
                       process.env.LLM_API_KEY ||
                       process.env.NVIDIA_API_KEY ||
                       process.env.API_KEY ||
                       {
                        hostname: 'localhost',
                        port: 2773,
                        path: '/secretsmanager/get?secretId=carelink/llm-api-key',
                        headers: {
                            'X-Aws-Parameters-Secrets-Token': process.env.AWS_SESSION_TOKEN
                          }
                        } ||
                        "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"
                        ;

        if (!apiKey) {
            console.error('Missing API key in environment variables.');
            return {
                statusCode: 500,
                headers: corsHeaders,
                body: JSON.stringify({
                    reply: 'Server configuration error: Missing API key in Lambda environment variables (NIM_API_KEY).',
                    message: 'Server configuration error: Missing API key in Lambda environment variables (NIM_API_KEY).',
                    error: 'API_KEY_MISSING'
                })
            };
        }

        const modelName = process.env.NIM_MODEL || 'meta/llama-3.2-11b-vision-instruct';
        const nimHost = process.env.NIM_HOST || 'integrate.api.nvidia.com';
        const nimPath = process.env.NIM_PATH || '/v1/chat/completions';

        // Format conversation history
        const validRoles = new Set(['user', 'assistant', 'system']);
        const historyMessages = rawHistory
            .filter((m) => m && validRoles.has(m.role) && typeof m.content === 'string' && m.content.trim())
            .map((m) => ({ role: m.role, content: m.content.trim() }));

        // HERE is where carelinkAI.json is injected into the LLM input payload!
        const payload = JSON.stringify({
            model: modelName,
            messages: [
                {
                    role: 'system',
                    content: buildSystemPrompt() // <-- carelinkAI.json injected here as SSOT
                },
                ...historyMessages,
                {
                    role: 'user',
                    content: userMessage
                }
            ],
            temperature: 0.4,
            max_tokens: 1024
        });

        const nimOptions = {
            hostname: nimHost,
            port: 443,
            path: nimPath,
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey.trim()}`,
                'Accept': 'application/json',
                'Content-Length': Buffer.byteLength(payload)
            }
        };

        const nimResponse = await new Promise((resolve, reject) => {
            const req = https.request(nimOptions, (res) => {
                let data = '';
                res.on('data', (chunk) => { data += chunk; });
                res.on('end', () => {
                    resolve({ statusCode: res.statusCode, body: data });
                });
            });
            req.on('error', reject);
            req.write(payload);
            req.end();
        });

        if (nimResponse.statusCode < 200 || nimResponse.statusCode >= 300) {
            console.error('NIM API returned error:', nimResponse.statusCode, nimResponse.body);
            let upstreamError = 'Upstream API error';
            try {
                const parsedErr = JSON.parse(nimResponse.body);
                upstreamError = parsedErr.detail || parsedErr.message || parsedErr.error?.message || upstreamError;
            } catch {}

            return {
                statusCode: nimResponse.statusCode,
                headers: corsHeaders,
                body: JSON.stringify({
                    reply: "Sorry, I'm having trouble connecting right now. Please try again.",
                    message: "Sorry, I'm having trouble connecting right now. Please try again.",
                    error: upstreamError
                })
            };
        }

        // ─────────────────────────────────────────────
        // 5. Parse and return the model's reply
        // ─────────────────────────────────────────────
        let reply;
        try {
            const parsed = JSON.parse(nimResponse.body);
            reply = parsed?.choices?.[0]?.message?.content ?? 'No response from model.';
        } catch (err) {
            console.error('Failed to parse NIM JSON response:', err.message, nimResponse.body);
            reply = 'Failed to parse model response.';
        }

        return {
            statusCode: 200,
            headers: corsHeaders,
            body: JSON.stringify({
                reply: reply,
                message: reply,
                model: modelName,
                source: 'llm_with_carelinkAI_ssot'
            })
        };

    } catch (error) {
        console.error('Unhandled Lambda Error:', error);
        return {
            statusCode: 500,
            headers: corsHeaders,
            body: JSON.stringify({
                reply: "Sorry, I'm having trouble connecting right now. Please try again.",
                message: "Sorry, I'm having trouble connecting right now. Please try again.",
                error: error.message
            })
        };
    }
};