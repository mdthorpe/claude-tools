import dotenv from 'dotenv';
import { ConfigSchema, type Config } from '../types';
import chalk from 'chalk';

// Load environment variables
dotenv.config();

export function loadConfig(): Config {
  try {
    const config = ConfigSchema.parse({
      apiKey: process.env.ANTHROPIC_API_KEY,
      model: process.env.CLAUDE_MODEL,
      maxTokens: process.env.MAX_TOKENS ? parseInt(process.env.MAX_TOKENS) : undefined,
    });
    
    return config;
  } catch (error) {
    if (error instanceof Error) {
      console.error(chalk.red('Configuration error:'), error.message);
      console.error(chalk.yellow('\nMake sure you have set ANTHROPIC_API_KEY in your .env file'));
    }
    process.exit(1);
  }
}