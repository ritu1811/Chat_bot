import { atom } from 'recoil';

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export interface ChatSession {
  id: string;
  date: string;
  messages: Message[];
}

export const chatHistoryState = atom<ChatSession[]>({
  key: 'chatHistoryState',
  default: [],
});

export const messagesState = atom<Message[]>({
  key: 'messagesState',
  default: [],
});

export const sessionIdState = atom<string | null>({
  key: 'sessionIdState',
  default: null,
});

export const isLoadingState = atom<boolean>({
  key: 'isLoadingState',
  default: false,
});

export const errorState = atom<string | null>({
  key: 'errorState',
  default: null,
});