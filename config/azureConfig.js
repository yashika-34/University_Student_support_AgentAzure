import dotenv from 'dotenv';

dotenv.config();

export const AZURE_OPENAI_ENDPOINT = (process.env.AZURE_OPENAI_ENDPOINT || '').trim().replace(/\/+$/, '');
export const AZURE_OPENAI_KEY = (process.env.AZURE_OPENAI_API_KEY || process.env.AZURE_OPENAI_KEY || '').trim();
export const AZURE_OPENAI_DEPLOYMENT = (process.env.AZURE_OPENAI_DEPLOYMENT_NAME || process.env.AZURE_OPENAI_DEPLOYMENT || 'gpt-4.1-mini').trim();
export const AZURE_OPENAI_API_VERSION = (process.env.AZURE_OPENAI_API_VERSION || '2024-02-15-preview').trim();

export const AZURE_SPEECH_ENDPOINT = process.env.AZURE_SPEECH_ENDPOINT;
export const AZURE_SPEECH_KEY = process.env.AZURE_SPEECH_KEY;
