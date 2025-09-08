# Claude CLI

A command-line interface for interacting with Claude AI models, built with TypeScript and Bun.

## Features

- **Ask Claude questions** directly from the terminal
- **List available models** to see what's available
- **Configurable settings** via environment variables
- **Token usage tracking** to monitor API costs
- **Multiple model support** including Claude Opus and Sonnet
 - **Interactive chat mode** with conversation history
 - **Streaming replies** (toggle with `/stream on|off`)
 - **Model switching in chat** via `/model [id]`

## Installation

```bash
# Clone the repository
git clone https://github.com/mdthorpe/claude-tools.git
cd claude-tools

# Install dependencies
bun install

# Build the project
bun run build
```

## Setup

1. Create your `.env` from the example and edit values:
```bash
cp .env.example .env
# edit .env
```

2. Make the CLI globally available:
```bash
bun link
```

## Usage

### Ask Claude a question
```bash
claude ask "What is the capital of France?"
```

### List available models
```bash
claude models
```

### Use specific model or token limit
```bash
claude ask "Explain quantum computing" --model claude-3-7-sonnet-latest --tokens 500
```

### Interactive chat
```bash
claude chat
# Commands in chat:
# /help                Show commands and current model
# /clear               Clear conversation history
# /exit                Quit chat
# /model [id]          List models (no arg) or switch model
# /stream [on|off]     Toggle streaming replies
```

### Streaming
- Toggle streaming on/off inside chat using `/stream on|off`.
- While streaming, text appears as it’s generated; when complete, token usage is printed.

## Configuration

The CLI supports configuration via environment variables:

- `ANTHROPIC_API_KEY` - Your Anthropic API key (required)
- `CLAUDE_MODEL` - Default model to use (optional)
- `MAX_TOKENS` - Default max tokens (optional)

## Development

```bash
# Run in development mode
bun run dev

# Build TypeScript
bun run build

# Run built version
bun run start
```
