#!/usr/bin/env bun

import { Command } from 'commander';
import chalk from 'chalk';
import { loadConfig } from './lib/config';
import { ClaudeAPI } from './lib/api';

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

// Parse command line arguments
program.parse(process.argv);

// Show help if no command provided
if (!process.argv.slice(2).length) {
  program.outputHelp();
}