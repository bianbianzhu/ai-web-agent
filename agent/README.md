# Web AI Agent

This project is a web AI agent built with TypeScript and Node.js. It uses Puppeteer for browser automation and OpenAI for natural language processing.

## Overview

The graph below shows the detailed architecture of the agent.

<img src="assets/overview.gif" width=800 height=700>

## Structure

- agent.ts: The main agent script.
- services/: Contains various services used by the agent.
  - browser-controller.ts: Controls the browser using Puppeteer.
  - data-transformer.ts: Transforms data for the agent.
  - element-annotator.ts: Annotates HTML elements for the agent.
  - openai.ts: Interfaces with the OpenAI API.
  - prompt-map.ts: Maps user prompts to actions.
  - user-prompt-interface.ts: Interfaces with the user to get prompts.
  - test.ts: Contains tests for the agent.
  - utils.ts: Contains utility functions used by the agent.
  - global.d.ts: Contains global type definitions.
