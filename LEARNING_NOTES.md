# TypeScript CLI Learning Notes

This document captures key learnings from building a Claude CLI with TypeScript and Bun.

## Project Setup & Migration

### Converting from npm to Bun
1. **Remove npm files**: `rm -rf node_modules package-lock.json`
2. **Install with bun**: `bun install`
3. **New files created**: `bun.lock` (replaces `package-lock.json`)

### Key Bun Commands
- Install packages: `bun add <package>` (instead of `npm install`)
- Install dev dependencies: `bun add -d <package>` (instead of `npm install -D`)
- Run scripts: `bun run <script>` or just `bun <script>`
- Execute TypeScript directly: `bun index.ts` (no compilation needed!)
- Use `bunx` instead of `npx`: `bunx tsc --init`

## TypeScript Configuration

### Modern tsconfig.json for Bun
```json
{
  "compilerOptions": {
    "target": "ES2022",          // Modern JavaScript features
    "module": "ESNext",          // ES modules (not CommonJS)
    "moduleResolution": "bundler", // How bundlers resolve modules
    "lib": ["ES2022"],           // Available APIs
    "types": ["bun-types"],      // Bun-specific types
    
    // Strict settings
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "exactOptionalPropertyTypes": true,
    
    // Modern features
    "verbatimModuleSyntax": true,
    "isolatedModules": true
  }
}
```

### Key Settings Explained
- `moduleResolution: "bundler"`: Allows importing without file extensions
- `verbatimModuleSyntax`: Better import/export handling
- `types: ["bun-types"]`: Provides Bun global APIs (`Bun.env`, `Bun.file()`)

## Project Structure

```
src/
├── types/        # Type definitions
│   └── index.ts  # Central types export
├── lib/          # Core utilities
│   ├── config.ts # Configuration loader
│   └── api.ts    # API client
├── commands/     # CLI commands (future)
└── index.ts      # Entry point
```

### Why This Structure?
- **types/**: Centralized type definitions for easy imports
- **lib/**: Shared utilities and core functionality
- **Separation of concerns**: Types, config, API, and commands are separate

## Key Patterns Learned

### 1. Type-Safe Configuration with Zod
```typescript
// Define schema with validation and defaults
export const ConfigSchema = z.object({
  apiKey: z.string().min(1, "API key is required"),
  model: z.enum([...]).default('claude-3-5-sonnet'),
  maxTokens: z.number().positive().default(1000),
});

// Infer TypeScript type from schema
export type Config = z.infer<typeof ConfigSchema>;
```

**Key Learning**: Zod provides both runtime validation AND compile-time types. Define defaults in the schema, not in the config loader.

### 2. Class-Based API Client
```typescript
export class ClaudeAPI {
  private client: Anthropic;
  private config: Config;

  constructor(config: Config) {
    this.config = config;
    this.client = new Anthropic({ apiKey: config.apiKey });
  }

  async ask(prompt: string): Promise<ClaudeResponse> {
    // Implementation
  }
}
```

**Benefits**:
- Encapsulation of API logic
- Dependency injection (config passed in)
- Easy to extend with new methods
- Single place for error handling

### 3. Async/Await vs Promises

**Promises** are objects representing future values:
```typescript
fetchData()
  .then(data => console.log(data))
  .catch(error => console.error(error));
```

**Async/Await** makes async code look synchronous:
```typescript
try {
  const data = await fetchData();
  console.log(data);
} catch (error) {
  console.error(error);
}
```

**Key Learning**: Always use async/await for cleaner, more readable code.

### 4. Error Handling Pattern
```typescript
private handleError(error: unknown): never {
  if (error instanceof Anthropic.APIError) {
    // Specific error handling
    console.error(chalk.red('API Error:'), error.message);
    if (error.status === 401) {
      console.error(chalk.yellow('Check your API key'));
    }
    process.exit(1);
  }
  // Generic error handling
  console.error(chalk.red('Unexpected error:'), error);
  process.exit(1);
}
```

**Key Points**:
- Return type `never` indicates function never returns
- Type guards (`instanceof`) for specific error types
- User-friendly error messages with colors

### 5. Commander.js CLI Structure
```typescript
program
  .command('ask')
  .description('Ask Claude a question')
  .argument('<prompt>', 'Required argument')
  .option('-m, --model <model>', 'Optional flag')
  .action(async (prompt, options) => {
    // Command implementation
  });
```

### 6. API Response Types
When working with external APIs, define types for responses:
```typescript
export interface ModelsListResponse {
  data: Model[];
  first_id: string | null;  // Pagination cursor
  has_more: boolean;        // More pages available?
  last_id: string | null;   // Pagination cursor
}
```

**Pagination fields** enable cursor-based pagination:
- Use `after_id` to get next page
- Use `before_id` to get previous page
- Check `has_more` to know if more pages exist

## Interactive Chat Mode

### Using @inquirer/prompts for interactive input
```typescript
const { input } = await import('@inquirer/prompts');

while (true) {
  const text = (await input({ message: 'You:' })).trim();
  if (text === '/exit') break;
  if (text === '/clear') { history = []; continue; }
  if (text === '/help') { /* print commands */ continue; }
  // send to Claude...
}
```

### Conversation history with Anthropic SDK types
```typescript
import type { MessageCreateParams, Message, TextBlock } from '@anthropic-ai/sdk/resources/messages';

let history: MessageCreateParams['messages'] = [];

const message: Message = await client.messages.create({
  model,
  max_tokens,
  messages: history,
});
```

### Extracting text blocks with a type guard
```typescript
const content = message.content
  .filter((block): block is TextBlock => block.type === 'text')
  .map(block => block.text)
  .join('\n');
```

### Returning token usage from the API client
```typescript
async function chat(...): Promise<{
  response: string;
  usage: { inputTokens: number; outputTokens: number };
  updatedHistory: MessageCreateParams['messages'];
}> {
  // call SDK
  const usage = {
    inputTokens: message.usage.input_tokens,
    outputTokens: message.usage.output_tokens,
  };
  return { response: content, usage, updatedHistory };
}
```

### Centralized allowed models (single source of truth)
```typescript
// src/types/index.ts
export const ALLOWED_MODELS = [
  'claude-opus-4-1-20250805',
  'claude-opus-4-20250514',
  'claude-3-7-sonnet-latest',
] as const;
export type ModelId = typeof ALLOWED_MODELS[number];

export const ConfigSchema = z.object({
  apiKey: z.string().min(1, 'API key is required'),
  model: z.enum(ALLOWED_MODELS).default('claude-opus-4-20250514'),
  maxTokens: z.number().positive().default(1000),
});
```

Validate `/model <id>` using the constant:
```typescript
import { ALLOWED_MODELS, type ModelId } from './types';
if (ALLOWED_MODELS.includes(newModel as ModelId)) {
  config.model = newModel as ModelId;
}
```

### Importing SDK types (how to find them)
- Types are exported from `@anthropic-ai/sdk/resources/messages`.
- In editor: hover or Cmd/Ctrl-click a symbol to jump to its `.d.ts`.
- Check the package `exports` field for valid subpaths.

### let vs const for the API instance
- Reassigning the variable (e.g., after `/model`) requires `let`.
- Alternatively, keep `const api = new ClaudeAPI(config)` and only mutate `config.model` — current client reads from `config` each call.

### Chat commands implemented
- `/exit` — quit
- `/clear` — clear history
- `/help` — show commands and current model
- `/model [id]` — list models or switch model
- Each reply prints token usage (input/output)

## Global CLI Setup with Bun

1. **Set shebang to bun**: `#!/usr/bin/env bun`
2. **Update package.json**:
   ```json
   "bin": {
     "claude": "./src/index.ts"
   }
   ```
3. **Link globally**: `bun link`
4. **Use anywhere**: `claude ask "Hello"`

## TypeScript Tips

### Type Guards
```typescript
// Before type guard - error is 'unknown'
if (error instanceof Anthropic.APIError) {
  // Inside - TypeScript knows error is APIError
  console.log(error.status); // OK!
}
```

### Working with Unknown Types
```typescript
// When you must work with unknown data
const errorData = await response.json().catch(() => ({}));
const message = (errorData as any).message || 'Default message';
```

### Type Inference
Let TypeScript infer types when obvious:
```typescript
// Explicit (unnecessary)
const name: string = "Claude";

// Inferred (preferred)
const name = "Claude"; // TypeScript knows it's a string
```

## Common Gotchas & Solutions

1. **Property doesn't exist**: TypeScript caught `error.type` doesn't exist on `APIError`. Always check available properties!

2. **Shell selection**: Cursor might use a different shell. Set via Settings > Terminal > Default Profile

3. **Fetch in Node/Bun**: Modern runtimes have built-in `fetch()`, no need for axios or node-fetch

## Next Steps for Learning

1. **Add more commands**: chat mode, file processing, etc.
2. **Add tests**: Learn testing with Bun's built-in test runner
3. **Error recovery**: Retry logic, better error messages
4. **Configuration profiles**: Different settings for different use cases
5. **Interactive features**: Prompts, selections, spinners

## Resources
- [Bun Documentation](https://bun.sh)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Commander.js](https://github.com/tj/commander.js)
- [Zod](https://zod.dev)
- [Anthropic API Docs](https://docs.anthropic.com)
