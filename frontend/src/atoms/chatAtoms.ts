import { atom } from 'recoil';

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

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