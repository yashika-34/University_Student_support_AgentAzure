import AIUsageLog from '../models/AIUsageLog.js';

// Cost calculation per token based on common deployment models
const PRICING = {
  'gpt-4.1-mini': { input: 0.15 / 1000000, output: 0.60 / 1000000 },
  'gpt-4o-mini': { input: 0.15 / 1000000, output: 0.60 / 1000000 },
  'gpt-4o': { input: 5.0 / 1000000, output: 15.0 / 1000000 },
  'gpt-4': { input: 30.0 / 1000000, output: 60.0 / 1000000 },
  'gpt-35-turbo': { input: 0.50 / 1000000, output: 1.50 / 1000000 },
  'default': { input: 1.0 / 1000000, output: 2.0 / 1000000 }
};

export const calculateCost = (model = 'gpt-4.1-mini', promptTokens = 0, completionTokens = 0) => {
  const rates = PRICING[model] || PRICING.default;
  return Number(((promptTokens * rates.input) + (completionTokens * rates.output)).toFixed(7));
};

/**
 * Enterprise AI Tracking Service
 * Logs tokens, latency, cost, and metadata for every Azure OpenAI invocation.
 */
export const trackAIUsage = async ({
  userId,
  userRole = 'student',
  feature = 'other',
  model = process.env.AZURE_OPENAI_DEPLOYMENT_NAME || 'gpt-4.1-mini',
  promptTokens = 0,
  completionTokens = 0,
  latencyMs = null,
  isSuccess = true,
  errorCode = null,
  requestMetadata = {}
}) => {
  try {
    if (!userId) {
      console.warn('[AIUsageLog] Cannot log AI usage without valid userId');
      return null;
    }

    const estimatedCostUSD = calculateCost(model, promptTokens, completionTokens);

    const logEntry = await AIUsageLog.create({
      userId,
      userRole,
      feature,
      model,
      promptTokens: promptTokens || 0,
      completionTokens: completionTokens || 0,
      totalTokens: (promptTokens || 0) + (completionTokens || 0),
      estimatedCostUSD,
      latencyMs,
      isSuccess,
      errorCode,
      requestMetadata
    });

    return logEntry;
  } catch (err) {
    // Non-blocking
    console.error('[AIUsageLog Error]:', err.message);
    return null;
  }
};

export default { trackAIUsage, calculateCost };
