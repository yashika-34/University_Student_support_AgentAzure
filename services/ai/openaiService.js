import fetch from 'node-fetch';
import { AZURE_OPENAI_ENDPOINT, AZURE_OPENAI_KEY, AZURE_OPENAI_DEPLOYMENT } from '../../config/azureConfig.js';

/**
 * Helper to call Azure OpenAI Chat Completion API.
 * @param {string} systemPrompt System level instruction.
 * @param {Array<{role:string, content:string}>} messages Conversation messages.
 * @returns {Promise<string>} Assistant response text.
 */
export const callAzureOpenAI = async (systemPrompt, messages) => {
  const url = `${AZURE_OPENAI_ENDPOINT}`; // full endpoint with deployment
  const headers = {
    'Content-Type': 'application/json',
    'api-key': AZURE_OPENAI_KEY,
  };
  const body = {
    model: AZURE_OPENAI_DEPLOYMENT,
    messages: [{ role: 'system', content: systemPrompt }, ...messages],
    temperature: 0.7,
    max_tokens: 1024,
  };
  const response = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  });
  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Azure OpenAI error: ${response.status} ${err}`);
  }
  const data = await response.json();
  const reply = data.choices?.[0]?.message?.content ?? '';
  return reply.trim();
};
