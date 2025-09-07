import Anthropic from '@anthropic-ai/sdk';
import { type Config, type ClaudeResponse, type ApiError, type ModelsListResponse } from '../types';
import chalk from 'chalk';

export class ClaudeAPI {
  private client: Anthropic;
  private config: Config;

  constructor(config: Config) {
    this.config = config;
    this.client = new Anthropic({
      apiKey: config.apiKey,
    });
  }

  async ask(prompt: string): Promise<ClaudeResponse> {
    try {
      const message = await this.client.messages.create({
        model: this.config.model,
        max_tokens: this.config.maxTokens,
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
      });

      // Extract text content from the response
      const content = message.content
        .filter(block => block.type === 'text')
        .map(block => block.text)
        .join('\n');

      return {
        content,
        usage: {
          inputTokens: message.usage.input_tokens,
          outputTokens: message.usage.output_tokens,
        },
      };
    } catch (error) {
      this.handleError(error);
    }
  }

  async listModels(options?: { 
    afterId?: string; 
    beforeId?: string; 
    limit?: number; 
  }): Promise<ModelsListResponse> {
    try {
      // Build URL with query parameters
      const url = new URL('https://api.anthropic.com/v1/models');
      if (options?.afterId) url.searchParams.append('after_id', options.afterId);
      if (options?.beforeId) url.searchParams.append('before_id', options.beforeId);
      if (options?.limit) url.searchParams.append('limit', options.limit.toString());

      // The Anthropic SDK doesn't have a built-in method for listing models
      // So we need to make a direct API call
      const response = await fetch(url.toString(), {
        method: 'GET',
        headers: {
          'x-api-key': this.config.apiKey,
          'anthropic-version': '2023-06-01',
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = (errorData as any).message || `HTTP error! status: ${response.status}`;
        throw new Error(errorMessage);
      }

      const data = await response.json() as ModelsListResponse;
      return data;
    } catch (error) {
      this.handleError(error);
    }
  }

  private handleError(error: unknown): never {
    if (error instanceof Anthropic.APIError) {
      const apiError: ApiError = {
        message: error.message,
        type: error.name || 'APIError',
        code: error.status?.toString(),
      };

      console.error(chalk.red('\nAPI Error:'), apiError.message);
      
      if (error.status === 401) {
        console.error(chalk.yellow('Check your API key in the .env file'));
      } else if (error.status === 429) {
        console.error(chalk.yellow('Rate limit exceeded. Please wait a moment.'));
      } else if (error.status === 400) {
        console.error(chalk.yellow('Invalid request. Check your prompt or parameters.'));
      }
      
      process.exit(1);
    }

    // Unknown error
    console.error(chalk.red('\nUnexpected error:'), error);
    process.exit(1);
  }
}