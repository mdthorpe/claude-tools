#!/usr/bin/env bun

import { Command } from 'commander';
import chalk from 'chalk';
import { loadConfig } from './lib/config';
import { ClaudeAPI } from './lib/api';
import type { MessageCreateParams } from '@anthropic-ai/sdk/resources/messages';
import { ALLOWED_MODELS, type ModelId } from './types';

const program = new Command();

program
  .name('claude')
  .description('CLI tool for interacting with Claude AI')
  .version('1.0.0');

program
  .command('models')
  .description('List available Claude models')
  .action(async () => {
    try {
      // Load config
      const config = loadConfig();
      
      // Show what we're doing
      console.log(chalk.blue('📋 Fetching available models...\n'));
      
      // Make the API call
      const api = new ClaudeAPI(config);
      const response = await api.listModels();
      
      // Display the models
      console.log(chalk.green('Available Claude Models:\n'));
      
      response.data.forEach((model, index) => {
        console.log(chalk.cyan(`${index + 1}. ${model.display_name}`));
        console.log(chalk.gray(`   ID: ${model.id}`));
        console.log(chalk.gray(`   Released: ${new Date(model.created_at).toLocaleDateString()}\n`));
      });
      
      // Show pagination info if there are more models
      if (response.has_more) {
        console.log(chalk.yellow('Note: More models are available. This shows the most recent ones.'));
      }
      
    } catch (error) {
      console.error(chalk.red('Error fetching models:'), error);
      process.exit(1);
    }
  });

program
  .command('ask')
  .description('Ask Claude a question')
  .argument('<prompt>', 'The question or prompt for Claude')
  .option('-m, --model <model>', 'Claude model to use')
  .option('-t, --tokens <number>', 'Max tokens for response', parseInt)
  .action(async (prompt: string, options) => {
    try {
      // Load config and override with command options if provided
      const config = loadConfig();
      
      if (options.model) {
        config.model = options.model;
      }
      if (options.tokens) {
        config.maxTokens = options.tokens;
      }

      // Show what we're doing
      console.log(chalk.blue('🤖 Asking Claude...'));
      console.log(chalk.gray(`Model: ${config.model}`));
      console.log(chalk.gray(`Max tokens: ${config.maxTokens}\n`));

      // Make the API call
      const api = new ClaudeAPI(config);
      const response = await api.ask(prompt);

      // Display the response
      console.log(chalk.green('Claude says:\n'));
      console.log(response.content);
      
      // Show token usage
      console.log(chalk.gray(`\n─────────────────────`));
      console.log(chalk.gray(`Tokens used: ${response.usage.inputTokens} input, ${response.usage.outputTokens} output`));
      
    } catch (error) {
      console.error(chalk.red('Error:'), error);
      process.exit(1);
    }
  });

program.command('chat')
  .description('Chat with Claude')
  .action(async () => {
    const { input } = await import('@inquirer/prompts');

    const config = loadConfig();
    let api = new ClaudeAPI(config);

    console.log(chalk.blue('🤖 Welcome to Claude Chat! Type /help for commands.\n'));

    let history: MessageCreateParams['messages'] = [];

    while (true) {
      const userInput = await input({ message: 'You:' });
      const trimmed = userInput.trim();

      if (trimmed === '/exit') {
        console.log(chalk.blue('👋 Chat ended.'));
        break;
      }

      if (trimmed === '/clear') {
        history = [];
        console.log(chalk.gray('History cleared.\n'));
        continue;
      }

      if (trimmed === '/help') {
        console.log(chalk.gray('Commands: /exit, /clear, /help, /model [id]'));
        console.log(chalk.gray(`Current model: ${config.model}`));
        continue;
      }

      if (trimmed.startsWith('/model')) {
        const parts = trimmed.split(/\s+/);
        if (parts.length === 1) {
          console.log(chalk.blue('📋 Fetching available models...\n'));
          const response = await api.listModels();
          console.log(chalk.green('Available Claude Models:\n'));
          response.data.forEach((model, index) => {
            console.log(chalk.cyan(`${index + 1}. ${model.display_name}`));
            console.log(chalk.gray(`   ID: ${model.id}`));
            console.log(chalk.gray(`   Released: ${new Date(model.created_at).toLocaleDateString()}\n`));
          });
          if (response.has_more) {
            console.log(chalk.yellow('Note: More models are available. This shows the most recent ones.'));
          }
          console.log(chalk.gray(`Current model: ${config.model}\n`));
          continue;
        } else {
          const newModel = parts[1];
          if (ALLOWED_MODELS.includes(newModel as ModelId)) {
            config.model = newModel as ModelId;
            api = new ClaudeAPI(config);
            console.log(chalk.gray(`Model set to: ${config.model}\n`));
          } else {
            console.log(chalk.red('Unknown model id.'));
            console.log(chalk.gray('Type /model to list available models.'));
          }
          continue;
        }
      }

      if (!trimmed) {
        continue;
      }

      const { response, usage, updatedHistory } = await api.chat(history, trimmed);
      history = updatedHistory;

      console.log(chalk.green('\nClaude:\n'));
      console.log(response);
      console.log(chalk.gray('\n─────────────────────'));
      console.log(chalk.gray(`Tokens used: ${usage.inputTokens} input, ${usage.outputTokens} output`));
      console.log();
    }
  });

// Parse command line arguments
program.parse(process.argv);

// Show help if no command provided
if (!process.argv.slice(2).length) {
  program.outputHelp();
}