import React from 'react';
import ChatWindow from './components/ChatWindow';
import ChatInput from './components/ChatInput';
import './App.css';

function App() {
  return (
    <div className="App">
      <header>
        <h1>HR Interview Chatbot</h1>
      </header>
      <main>
        <ChatWindow />
        <ChatInput />
      </main>
    </div>
  );
}

export default App;