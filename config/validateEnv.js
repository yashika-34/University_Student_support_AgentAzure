/**
 * Environment Variable Validator
 * Validates critical environment variables at startup and fails fast on missing required configs.
 */
export const validateEnv = () => {
  const required = [
    'MONGODB_URI',
    'JWT_SECRET',
    'JWT_REFRESH_SECRET'
  ];

  const recommended = [
    { key: 'AZURE_OPENAI_ENDPOINT', label: 'Azure OpenAI Endpoint' },
    { key: 'AZURE_OPENAI_API_KEY', label: 'Azure OpenAI API Key' },
    { key: 'CLIENT_URL', label: 'Frontend Client URL' }
  ];

  const missingRequired = required.filter((key) => !process.env[key]);
  const missingRecommended = recommended.filter(({ key }) => !process.env[key] && !process.env[key.replace('_API_KEY', '_KEY')]);

  if (missingRequired.length > 0) {
    console.error('\n======================================================');
    console.error('❌ CRITICAL ENVIRONMENT CONFIGURATION ERROR:');
    console.error(`Missing required environment variables: ${missingRequired.join(', ')}`);
    console.error('Please configure these in your .env file or deployment dashboard.');
    console.error('======================================================\n');

    if (process.env.NODE_ENV === 'production') {
      process.exit(1);
    }
  }

  if (missingRecommended.length > 0 && process.env.NODE_ENV !== 'test') {
    console.warn('\n⚠️ [ENV WARNING] Missing recommended configuration variables:');
    missingRecommended.forEach(({ key, label }) => {
      console.warn(`  - ${key} (${label})`);
    });
    console.warn('AI and cloud services may run in fallback/degraded mode.\n');
  }

  return {
    valid: missingRequired.length === 0,
    missingRequired,
    missingRecommended: missingRecommended.map((r) => r.key)
  };
};

export default validateEnv;
