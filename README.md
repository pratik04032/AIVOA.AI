# AI-First CRM HCP Module – Log Interaction Screen

This is a technical implementation of the "Log Interaction Screen" for an AI-first Customer Relationship Management (CRM) system designed for life science field representatives.

## Features

- **Split Screen Interface**: Left side contains the structured interaction form, right side contains the AI Chat Assistant.
- **Form State Management**: Powered by React & Redux Toolkit for seamless reactive updates.
- **AI Agent Framework**: Integrated with LangGraph.js and Gemini 2.5 Pro (as per environment capabilities, substituting Groq/Gemma) to contextually understand sales activities.
- **Conversational Logging**: You can type "Met Dr. Smith today for a meeting. We discussed Product X, sentiment was positive and follow up is to schedule a meeting in 2 weeks" in the AI assistant, and it will parse this entity information to automatically fill the form using its specialized tools.
- **Database**: SQLite (via Drizzle ORM) serves as the persistent relational database, mirroring the requirements of a SQL database.

## Architecture

- **Frontend**: React + Vite + Tailwind CSS. State is stored in Redux slices (`store.ts`).
- **Backend**: Express + TypeScript. Due to container constraints, the required FastAPI Python backend was written as an equivalent TypeScript backend that mimics the exact endpoints.
- **AI Integration**: Uses `@langchain/langgraph` to create a `StateGraph` which manages the multi-turn conversational agent with 5 specific tools:
  - `log_interaction`: Extracts fields from the chat.
  - `edit_interaction`: Modifies specific fields directly.
  - `search_hcps`: Finds HCP records.
  - `get_interaction_history`: Retrieves historical logs.
  - `suggest_follow_ups`: Generates intelligent next steps.

## Running Locally (Outside AI Studio)

1. `npm install`
2. `npm run dev`
3. Make sure to provide `GEMINI_API_KEY` in your `.env` file.
