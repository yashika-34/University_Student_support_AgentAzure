import dotenv from 'dotenv';

dotenv.config();

export const AZURE_OPENAI_ENDPOINT = process.env.AZURE_OPENAI_ENDPOINT; // e.g. https://<your-resource>.openai.azure.com/openai/deployments/<deployment>/chat/completions?api-version=2023-05-15
export const AZURE_OPENAI_KEY = process.env.AZURE_OPENAI_KEY;
export const AZURE_OPENAI_DEPLOYMENT = process.env.AZURE_OPENAI_DEPLOYMENT; // name of deployment

export const AZURE_SPEECH_ENDPOINT = process.env.AZURE_SPEECH_ENDPOINT; // Speech service endpoint
export const AZURE_SPEECH_KEY = process.env.AZURE_SPEECH_KEY;
