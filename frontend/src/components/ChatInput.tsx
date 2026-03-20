import React, { useState } from 'react';
import { useRecoilValue, useRecoilCallback } from 'recoil';
import { messagesState, sessionIdState, isLoadingState, errorState } from '../atoms/chatAtoms';
import axios from 'axios';

const ChatInput: React.FC = () => {
  const [input, setInput] = useState('');
  const sessionId = useRecoilValue(sessionIdState);
  const isLoading = useRecoilValue(isLoadingState);

  const handleSubmit = useRecoilCallback(({ set }) => async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage = {
      id: Date.now().toString(),
      role: 'user' as const,
      content: input,
      timestamp: new Date(),
    };

    set(messagesState, prev => [...prev, userMessage]);
    setInput('');
    set(isLoadingState, true);
    set(errorState, null);

    try {
      const response = await axios.post('http://localhost:5000/chat', {
        session_id: sessionId,
        message: input,
      });

      const assistantMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant' as const,
        content: response.data.reply || response.data.message,
        timestamp: new Date(),
      };

      set(messagesState, prev => [...prev, assistantMessage]);
    } catch (error) {
      set(errorState, 'Failed to send message. Please try again.');
    } finally {
      set(isLoadingState, false);
    }
  }, [input, sessionId]);

  return (
    <form onSubmit={handleSubmit} className="chat-input">
      <input
        type="text"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder="Type your message..."
        disabled={isLoading}
      />
      <button type="submit" disabled={isLoading || !input.trim()}>
        Send
      </button>
    </form>
  );
};

export default ChatInput;