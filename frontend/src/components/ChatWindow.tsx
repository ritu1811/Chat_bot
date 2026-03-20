import React, { useEffect } from 'react';
import { useRecoilValue, useRecoilCallback } from 'recoil';
import { messagesState, sessionIdState, errorState } from '../atoms/chatAtoms';
import ChatMessage from './ChatMessage';
import axios from 'axios';

const ChatWindow: React.FC = () => {
  const messages = useRecoilValue(messagesState);
  const sessionId = useRecoilValue(sessionIdState);
  const error = useRecoilValue(errorState);

  const startInterview = useRecoilCallback(({ set }) => async () => {
    try {
      const response = await axios.post('http://localhost:5000/start');
      set(sessionIdState, response.data.session_id);

      const initialMessage = {
        id: Date.now().toString(),
        role: 'assistant' as const,
        content: response.data.question,
        timestamp: new Date(),
      };
      set(messagesState, [initialMessage]);
    } catch (error) {
      set(errorState, 'Failed to start interview. Please refresh and try again.');
    }
  }, []);

  useEffect(() => {
    if (!sessionId) {
      startInterview();
    }
  }, [sessionId, startInterview]);

  return (
    <div className="chat-window">
      <div className="messages">
        {messages.map(message => (
          <ChatMessage key={message.id} message={message} />
        ))}
      </div>
      {error && <div className="error">{error}</div>}
    </div>
  );
};

export default ChatWindow;