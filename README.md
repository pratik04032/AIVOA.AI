# AI-First CRM HCP Module - Log Interaction Screen

This repository contains the frontend and backend implementation for an AI-First Customer Relationship Management (CRM) system, specifically focusing on the Healthcare Professional (HCP) module. 

## Project Structure

*Note: As this project is hosted and built within the AI Studio sandbox environment (which natively supports Node.js/Vite), the backend is implemented in Node.js/Express and the database uses Firebase Firestore. This serves as a functional equivalent to the requested Python/FastAPI and MySQL/PostgreSQL stack.*

The project is built with a modern React frontend using Vite and Tailwind CSS, backed by an Express/Node.js server-side environment for API mocking and AI capabilities. State management is handled using Redux.

- `src/App.tsx`: Main application layout, split into the structured interaction form (left) and the conversational chat interface (right).
- `src/components/InteractionForm.tsx`: The primary structured form for logging interactions, matching the required fields and layout.
- `src/components/ChatAssistant.tsx`: The conversational interface that allows reps to log interactions via natural language, which then populates the structured form.
- `src/store.ts`: Redux store configuration for managing the interaction form state.
- `server.ts`: Backend server simulating the FastAPI/Python layer (in a Node environment) for AI summarization and CRM data endpoints.

## How to Run

1. Clone the repository.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Run the development server:
   ```bash
   npm run dev
   ```
4. Build for production:
   ```bash
   npm run build
   ```

## LangGraph AI Agent & Tools

### Role of the LangGraph Agent in Managing HCP Interactions
The LangGraph agent acts as an intelligent orchestration layer between the field representative and the CRM database. Instead of forcing the rep to manually fill out complex forms, the agent can process natural language (either via text chat or voice notes), maintain context of the conversation, extract relevant entities (HCP names, products, sentiments, outcomes), and automatically map them to the structured CRM database. It ensures data consistency, reduces administrative burden, and proactively suggests follow-up actions based on the context of the interaction.

### Five (5) Specific Tools for the LangGraph Agent

1. **Log Interaction** (Required)
   - *Description*: Captures interaction data from unstructured input. The LLM summarizes the conversation, extracts key entities (HCP name, date, sentiment, materials shared), and formats it into a structured JSON payload that is sent to the CRM database.

2. **Edit Interaction** (Required)
   - *Description*: Allows the rep to modify previously logged data via conversational commands (e.g., "Actually, I also gave Dr. Smith a trial kit"). The tool retrieves the existing record, applies the delta changes intelligently using the LLM, and updates the database.

3. **Search HCPs**
   - *Description*: Searches the CRM database for Healthcare Professionals by name to verify if an HCP exists before logging interactions.

4. **Get Interaction History**
   - *Description*: Queries the database for past interactions of a specific HCP to provide the rep with historical context.

5. **Suggest Follow-ups**
   - *Description*: Generates contextual follow-up actions based on the interaction details discussed.

## Task Summary
The objective of this task was to conceptualize and build the "Log Interaction Screen" for an AI-first CRM tailored for life science field representatives. The solution provides a dual-interface approach: a traditional structured form for precise data entry and an AI-powered conversational chat for fast, unstructured logging. The architecture emphasizes the use of an LLM and an agentic framework (LangGraph) to bridge the gap between human conversation and structured database records, ultimately streamlining the workflow for medical representatives.
