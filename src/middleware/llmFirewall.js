/**
 * Active LLM Firewall Middleware (express-llm-guard)
 * Provides real-time prompt risk inspection & response sanitization.
 */

// Known malicious prompt patterns
const BLOCKED_PATTERNS = [
  /ignore\s+(all\s+)?previous\s+instructions/i,
  /recite\s+(your\s+)?system\s+prompt/i,
  /act\s+as\s+dan/i,
  /developer\s+mode\s+activated/i,
  /do\s+anything\s+now/i,
  /reveal\s+internal\s+keys/i,
  /<\s*system_instruction\s*>/i
];

// Sensitive data patterns for output sanitization
const SENSITIVE_PATTERNS = [
  { name: 'API_KEY', regex: /(sk_live_[a-zA-Z0-9]{24,})/gi, replacement: '[REDACTED_API_KEY]' },
  { name: 'JWT_TOKEN', regex: /(eyJ[a-zA-Z0-9_-]{10,}\.eyJ[a-zA-Z0-9_-]{10,}\.[a-zA-Z0-9_-]{10,})/gi, replacement: '[REDACTED_JWT_TOKEN]' },
  { name: 'SYSTEM_PROMPT_LEAK', regex: /(You are a helpful customer support assistant\. Answer questions accurately)/gi, replacement: '[REDACTED_SYSTEM_PROMPT]' }
];

/**
 * Inspects incoming prompts for malicious injection or jailbreak attempts
 */
function inspectPrompt(promptText) {
  if (!promptText || typeof promptText !== 'string') {
    return { allowed: true, riskScore: 0, reason: "Empty prompt" };
  }

  for (const pattern of BLOCKED_PATTERNS) {
    if (pattern.test(promptText)) {
      return {
        allowed: false,
        riskScore: 9.5,
        reason: `Matched blocked security rule: ${pattern.toString()}`
      };
    }
  }

  return { allowed: true, riskScore: 0.5, reason: "Passed safety checks" };
}

/**
 * Redacts sensitive credentials or system prompt disclosure from outbound LLM text
 */
function sanitizeResponse(responseText) {
  if (!responseText || typeof responseText !== 'string') {
    return { sanitizedText: responseText, redactedCount: 0 };
  }

  let cleaned = responseText;
  let count = 0;

  for (const item of SENSITIVE_PATTERNS) {
    if (item.regex.test(cleaned)) {
      cleaned = cleaned.replace(item.regex, item.replacement);
      count++;
    }
  }

  return { sanitizedText: cleaned, redactedCount: count };
}

/**
 * Express Middleware Wrapper
 */
function llmFirewallMiddleware(req, res, next) {
  const prompt = req.body?.prompt || req.body?.query || '';
  const result = inspectPrompt(prompt);

  if (!result.allowed) {
    return res.status(403).json({
      error: "LLM_FIREWALL_BLOCKED",
      message: "Request blocked by Active LLM Firewall",
      details: result
    });
  }

  req.firewallInspection = result;
  next();
}

module.exports = {
  inspectPrompt,
  sanitizeResponse,
  llmFirewallMiddleware
};
