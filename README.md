# Claude CLI

A command-line interface for interacting with Claude AI models, built with TypeScript and Bun.

## Features

- **Ask Claude questions** directly from the terminal
- **List available models** to see what's available
- **Configurable settings** via environment variables
- **Token usage tracking** to monitor API costs
- **Multiple model support** including Claude Opus and Sonnet

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

1. Create a `.env` file in the project root:
```bash
ANTHROPIC_API_KEY=your_api_key_here
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

## Configuration

The CLI supports configuration via environment variables:

- `ANTHROPIC_API_KEY` - Your Anthropic API key (required)
- `CLAUDE_MODEL` - Default model to use (optional)
- `CLAUDE_MAX_TOKENS` - Default max tokens (optional)

## Development

```bash
# Run in development mode
bun run dev

# Build TypeScript
bun run build

# Run built version
bun run start
```
