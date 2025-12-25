import { create } from 'zustand';
import type { SystemEvent } from '../services/eventStreamService';
import type { ToolCall } from '../types';

// Message type for chat display
export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  toolCalls?: ToolCall[];
  systemEvent?: SystemEvent; // For system event messages
}

interface ChatStore {
  // State
  messages: ChatMessage[];
  conversationId: string | null;
  isTyping: boolean;
  collapsedTools: Set<string>;

  // Actions
  addMessage: (message: ChatMessage) => void;
  updateLastMessage: (updates: Partial<ChatMessage>) => void;
  updateOrAddAssistantMessage: (message: ChatMessage) => void;
  setMessages: (messages: ChatMessage[]) => void;
  setConversationId: (id: string | null) => void;
  setIsTyping: (isTyping: boolean) => void;
  toggleToolCollapse: (messageIndex: number, toolIndex: number) => void;
  clearChat: () => void;
}

const initialMessage: ChatMessage = {
  role: 'assistant',
  content:
    "Hello! I'm your AI assistant for power outage response operations. I can help you check connected network type and reachability, inspect power infrastructure, boost stream quality, and more. How can I assist you?",
  timestamp: new Date().toISOString(),
};

export const useChatStore = create<ChatStore>((set) => ({
  // Initial state
  messages: [initialMessage],
  conversationId: null,
  isTyping: false,
  collapsedTools: new Set<string>(),

  // Actions
  addMessage: (message) =>
    set((state) => ({
      messages: [...state.messages, message],
    })),

  updateLastMessage: (updates) =>
    set((state) => {
      const messages = [...state.messages];
      const lastIndex = messages.length - 1;

      if (lastIndex >= 0) {
        messages[lastIndex] = {
          ...messages[lastIndex],
          ...updates,
        };
      }

      return { messages };
    }),

  updateOrAddAssistantMessage: (message) =>
    set((state) => {
      const messages = [...state.messages];
      const lastMessage = messages[messages.length - 1];

      if (lastMessage?.role === 'assistant') {
        // Update existing assistant message
        messages[messages.length - 1] = message;
      } else {
        // Add new assistant message
        messages.push(message);
      }

      return { messages };
    }),

  setMessages: (messages) => set({ messages }),

  setConversationId: (id) => set({ conversationId: id }),

  setIsTyping: (isTyping) => set({ isTyping }),

  toggleToolCollapse: (messageIndex, toolIndex) =>
    set((state) => {
      const key = `${messageIndex}-${toolIndex}`;
      const newSet = new Set(state.collapsedTools);

      if (newSet.has(key)) {
        newSet.delete(key);
      } else {
        newSet.add(key);
      }

      return { collapsedTools: newSet };
    }),

  clearChat: () =>
    set({
      messages: [initialMessage],
      conversationId: null,
      isTyping: false,
      collapsedTools: new Set<string>(),
    }),
}));
