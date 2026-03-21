import { useState, useEffect } from 'react';
import { Menu, X, Sun, Moon, MessageSquare, Clock } from 'lucide-react';
import { useRecoilState } from 'recoil';
import { messagesState, sessionIdState, chatHistoryState } from './atoms/chatAtoms';
import ChatWindow from './components/ChatWindow';
import ChatInput from './components/ChatInput';
import './App.css';

function App() {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [messages, setMessages] = useRecoilState(messagesState);
  const [history, setHistory] = useRecoilState(chatHistoryState);
  const [sessionId, setSessionId] = useRecoilState(sessionIdState);

  useEffect(() => {
    // Check system preference on initial load
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      setTheme('dark');
    }
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => (prev === 'light' ? 'dark' : 'light'));
  };

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const handleNewChat = () => {
    if (messages.length > 0) {
      setHistory(prev => [
        {
          id: sessionId || Date.now().toString(),
          date: new Date().toLocaleDateString() + ' ' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          messages: [...messages]
        },
        ...prev
      ].slice(0, 50)); // Keep last 50 chats
    }
    setMessages([]);
    setSessionId(null);
    if (window.innerWidth < 768) {
      setSidebarOpen(false);
    }
  };

  const handleLoadChat = (session: any) => {
    if (messages.length > 0 && sessionId !== session.id) {
      // Save current chat before loading if it's not the exact same one
      setHistory(prev => {
        const historyWithoutCurrent = prev.filter(h => h.id !== (sessionId || ''));
        return [
          {
             id: sessionId || Date.now().toString(),
             date: new Date().toLocaleDateString() + ' ' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
             messages: [...messages]
          },
          ...historyWithoutCurrent
        ].slice(0, 50);
      });
    }
    setMessages(session.messages);
    setSessionId(session.id);
    if (window.innerWidth < 768) {
      setSidebarOpen(false);
    }
  };

  return (
    <div className="app-container">
      {/* Sidebar */}
      <aside className={`sidebar ${sidebarOpen ? 'mobile-visible' : 'mobile-hidden'}`}>
        <div className="sidebar-header">
          <button className="icon-button" onClick={toggleSidebar}>
            <X size={24} className="md:hidden" />
          </button>
        </div>
        <div style={{ padding: '1rem', flex: 1, overflowY: 'auto' }}>
          <button 
            onClick={handleNewChat}
            style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '8px', padding: '12px', background: 'transparent', border: '1px solid var(--border-color)', color: 'var(--text-color)', justifyContent: 'flex-start', cursor: 'pointer', borderRadius: '8px', marginBottom: '1rem' }}
          >
            <MessageSquare size={18} />
            <span>New Chat</span>
          </button>
          
          {history.length > 0 && (
            <div style={{ marginTop: '1rem' }}>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-color)', opacity: 0.6, marginBottom: '0.5rem', fontWeight: 600 }}>Previous Chats</div>
              {history.map(session => (
                <div 
                  key={session.id} 
                  onClick={() => handleLoadChat(session)}
                  style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px', fontSize: '0.9rem', color: 'var(--text-color)', opacity: session.id === sessionId ? 1 : 0.8, background: session.id === sessionId ? 'var(--border-color)' : 'transparent', cursor: 'pointer', borderRadius: '6px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}
                >
                  <Clock size={16} style={{ flexShrink: 0 }} />
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{session.date} ({session.messages.length} msgs)</span>
                </div>
              ))}
            </div>
          )}
        </div>
        <div style={{ padding: '1rem', borderTop: '1px solid var(--border-color)' }}>
          <button className="icon-button" onClick={toggleTheme} style={{ width: '100%', justifyContent: 'flex-start', gap: '8px' }}>
            {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
            {theme === 'light' ? 'Dark Mode' : 'Light Mode'}
          </button>
        </div>
      </aside>

      {/* Main Content Areas */}
      <main className="main-area">
        {/* Mobile Header */}
        <header className="header-mobile">
          <button className="icon-button" onClick={toggleSidebar} aria-label="Open Sidebar">
            <Menu size={24} />
          </button>
          <span style={{ fontWeight: '500' }}>HR Interview Chatbot</span>
          <button className="icon-button" onClick={toggleTheme} aria-label="Toggle Theme">
            {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
          </button>
        </header>

        {/* Chat Component container */}
        <ChatWindow />
        <div className="input-container">
          <ChatInput />
        </div>
      </main>
    </div>
  );
}

export default App;