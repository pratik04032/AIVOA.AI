import { configureStore, createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface InteractionState {
  hcpName: string;
  interactionType: string;
  date: string;
  time: string;
  attendees: string;
  topicsDiscussed: string;
  materialsShared: string;
  samplesDistributed: string;
  sentiment: string;
  outcomes: string;
  followUpActions: string;
  executiveSummary: string;
}

const initialInteractionState: InteractionState = {
  hcpName: '',
  interactionType: '',
  date: '',
  time: '',
  attendees: '',
  topicsDiscussed: '',
  materialsShared: '',
  samplesDistributed: '',
  sentiment: '',
  outcomes: '',
  followUpActions: '',
  executiveSummary: '',
};

export const interactionSlice = createSlice({
  name: 'interaction',
  initialState: initialInteractionState,
  reducers: {
    updateField: (state, action: PayloadAction<{ field: keyof InteractionState; value: string }>) => {
      state[action.payload.field] = action.payload.value;
    },
    updateMultipleFields: (state, action: PayloadAction<Partial<InteractionState>>) => {
      return { ...state, ...action.payload };
    },
    resetForm: () => initialInteractionState,
  },
});

export const { updateField, updateMultipleFields, resetForm } = interactionSlice.actions;

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface ChatState {
  messages: ChatMessage[];
  isTyping: boolean;
}

const initialChatState: ChatState = {
  messages: [{ role: 'assistant', content: 'Log interaction details here (e.g., "Met Dr. Smith, discussed Product X efficacy, positive sentiment, shared brochure") or ask for help.' }],
  isTyping: false,
};

export const chatSlice = createSlice({
  name: 'chat',
  initialState: initialChatState,
  reducers: {
    addMessage: (state, action: PayloadAction<ChatMessage>) => {
      state.messages.push(action.payload);
    },
    setTyping: (state, action: PayloadAction<boolean>) => {
      state.isTyping = action.payload;
    },
  },
});

export const { addMessage, setTyping } = chatSlice.actions;

export const store = configureStore({
  reducer: {
    interaction: interactionSlice.reducer,
    chat: chatSlice.reducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
