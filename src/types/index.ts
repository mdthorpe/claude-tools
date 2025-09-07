import { z } from 'zod';

// Configuration schema with Zod
export const ConfigSchema = z.object({
  apiKey: z.string().min(1, "API key is required"),
  model: z.enum([
    'claude-opus-4-1-20250805',
    'claude-opus-4-20250514',
    'claude-3-7-sonnet-latest',
  ]).default('claude-opus-4-20250514'),
  maxTokens: z.number().positive().default(1000),
});

export type Config = z.infer<typeof ConfigSchema>;

// API interaction types
export interface ClaudeResponse {
  content: string;
  usage: {
    inputTokens: number;
    outputTokens: number;
  };
}

export interface ApiError {
  message: string;
  type: string;
  code?: string;
}

// Model types for the list models API
export interface Model {
  created_at: string;
  display_name: string;
  id: string;
  type: 'model';
}

export interface ModelsListResponse {
  data: Model[];
  first_id: string | null;
  has_more: boolean;
  last_id: string | null;
}