import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().default('5000'),
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
  JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 characters').optional(),
  SESSION_SECRET: z.string().min(1, 'SESSION_SECRET is required'),
  
  // AI API Keys (supports both standard and Replit integrations)
  GEMINI_API_KEY: z.string().optional(),
  OPENAI_API_KEY: z.string().optional(),
  ANTHROPIC_API_KEY: z.string().optional(),
  
  // Replit AI Integrations (fallback)
  AI_INTEGRATIONS_GEMINI_API_KEY: z.string().optional(),
  AI_INTEGRATIONS_OPENAI_API_KEY: z.string().optional(),
  AI_INTEGRATIONS_ANTHROPIC_API_KEY: z.string().optional(),
  
  STRIPE_SECRET_KEY: z.string().optional(),
  STRIPE_WEBHOOK_SECRET: z.string().optional(),
  VITE_STRIPE_PUBLIC_KEY: z.string().optional(),
  
  FRONTEND_URL: z.string().optional(),
  LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error', 'http']).default('info'),
  SENTRY_DSN: z.string().optional(),
});

export type Env = z.infer<typeof envSchema>;

export function validateEnv(): Env {
  try {
    const env = envSchema.parse(process.env);
    
    // Check for AI API keys (either standard or Replit integrations)
    const hasGemini = env.GEMINI_API_KEY || env.AI_INTEGRATIONS_GEMINI_API_KEY;
    const hasOpenAI = env.OPENAI_API_KEY || env.AI_INTEGRATIONS_OPENAI_API_KEY;
    const hasAnthropic = env.ANTHROPIC_API_KEY || env.AI_INTEGRATIONS_ANTHROPIC_API_KEY;
    
    if (!hasGemini) {
      console.warn('⚠️  GEMINI_API_KEY not set - AI generation will fail');
    }
    if (!hasOpenAI) {
      console.warn('⚠️  OPENAI_API_KEY not set - AI verification will fail');
    }
    if (!hasAnthropic) {
      console.warn('⚠️  ANTHROPIC_API_KEY not set - AI fixing will fail');
    }
    if (!env.STRIPE_SECRET_KEY && env.NODE_ENV === 'production') {
      console.warn('⚠️  STRIPE_SECRET_KEY not set - payments will not work');
    }
    
    console.log('✅ Environment variables validated successfully');
    return env;
  } catch (error) {
    console.error('❌ Environment validation failed:');
    if (error instanceof z.ZodError) {
      error.errors.forEach(err => {
        console.error(`  - ${err.path.join('.')}: ${err.message}`);
      });
    }
    if (process.env.NODE_ENV === 'production') {
      process.exit(1);
    }
    return process.env as unknown as Env;
  }
}

export const config = validateEnv();
