import React, { useState, useRef, useEffect } from 'react';
import { ChefHat, Send, MessageSquare, Loader2, Sparkles, X, Bot } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { generalAppChat } from '../api/recipes';

const premiumStyles = `
  .premium-chat-scroll::-webkit-scrollbar {
    width: 6px;
  }
  .premium-chat-scroll::-webkit-scrollbar-track {
    background: transparent;
  }
  .premium-chat-scroll::-webkit-scrollbar-thumb {
    background: rgba(16, 185, 129, 0.2);
    border-radius: 10px;
  }
  .premium-chat-scroll::-webkit-scrollbar-thumb:hover {
    background: rgba(16, 185, 129, 0.4);
  }
  .premium-markdown p {
    margin: 0 0 0.75rem 0;
  }
  .premium-markdown p:last-child {
    margin: 0;
  }
  .premium-markdown ul, .premium-markdown ol {
    margin: 0.5rem 0 0.75rem 0;
    padding-left: 1.5rem;
  }
  .premium-markdown li {
    margin-bottom: 0.3rem;
  }
  .premium-markdown strong {
    color: var(--primary);
    font-weight: 700;
  }
  .user-msg-markdown p, .user-msg-markdown strong, .user-msg-markdown li {
    color: #fff !important;
  }
`;

export default function GeneralAIChat({ initialQuery, onClose }) {
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput]       = useState('');
  const [chatLoading, setChatLoading]   = useState(false);
  const chatContainerRef = useRef(null);
  const initialized = useRef(false);

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [chatMessages]);

  useEffect(() => {
    // Auto-send the initial query when component mounts
    if (initialQuery && !initialized.current) {
      initialized.current = true;
      handleInitialQuery(initialQuery);
    }
  }, [initialQuery]);

  const handleInitialQuery = async (query) => {
    const newMsg = { role: 'user', content: query };
    const newHistory = [newMsg];
    setChatMessages(newHistory);
    setChatLoading(true);

    try {
      const res = await generalAppChat({
        messages: newHistory,
      });
      setChatMessages([...newHistory, { role: 'assistant', content: res.data.reply }]);
    } catch (err) {
      setChatMessages([...newHistory, { role: 'assistant', content: 'Oops! I had a problem processing that. Could you try again?' }]);
    } finally {
      setChatLoading(false);
    }
  };

  const handleChatSubmit = async (e) => {
    e.preventDefault();
    if (!chatInput.trim() || chatLoading) return;

    const newMsg = { role: 'user', content: chatInput.trim() };
    const newHistory = [...chatMessages, newMsg];
    setChatMessages(newHistory);
    setChatInput('');
    setChatLoading(true);

    try {
      const res = await generalAppChat({
        messages: newHistory,
      });
      setChatMessages([...newHistory, { role: 'assistant', content: res.data.reply }]);
    } catch (err) {
      setChatMessages([...newHistory, { role: 'assistant', content: 'Oops! I had a problem processing that. Could you try again?' }]);
    } finally {
      setChatLoading(false);
    }
  };

  const [isInputFocused, setIsInputFocused] = useState(false);

  return (
    <div style={{
      width: '100%',
      maxWidth: '850px',
      margin: '0 auto 2.5rem auto',
      background: 'var(--card-bg)',
      border: '1px solid var(--card-border)',
      borderRadius: '24px',
      overflow: 'hidden',
      boxShadow: 'var(--shadow-lg)',
      animation: 'slideUp 0.4s ease-out',
      position: 'relative',
      zIndex: 20
    }}>
      <div style={{
        background: 'linear-gradient(to right, rgba(16,185,129,0.08), rgba(16,185,129,0.02))',
        padding: '1.25rem 1.5rem',
        borderBottom: '1px solid rgba(16,185,129,0.1)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
          <div style={{
            width: '36px', height: '36px', borderRadius: '10px',
            background: 'linear-gradient(135deg, #10b981, #059669)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 4px 12px rgba(16,185,129,0.3)'
          }}>
            <Sparkles size={18} color="#fff" />
          </div>
          <div>
            <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-main)', letterSpacing: '-0.01em' }}>SmartMeal Assistant</h3>
            <p style={{ margin: '0.2rem 0 0', fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 500 }}>Ask about recipes or app features</p>
          </div>
        </div>
        {onClose && (
          <button 
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--text-muted)',
              padding: '0.5rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: '50%',
              transition: 'all 0.2s'
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(0,0,0,0.05)'; e.currentTarget.style.color = 'var(--text-main)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-muted)'; }}
          >
            <X size={20} />
          </button>
        )}
      </div>

      <style>{premiumStyles}</style>
      <div 
        ref={chatContainerRef} 
        className="premium-chat-scroll"
        style={{
        padding: '1.5rem',
        maxHeight: '400px',
        overflowY: 'auto',
        display: 'flex',
        flexDirection: 'column',
        gap: '1.25rem',
        background: 'var(--body-bg)',
      }}>
        {chatMessages.length === 0 && !chatLoading ? (
          <div style={{
            textAlign: 'center',
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.25rem',
            padding: '3rem 1rem',
            background: 'linear-gradient(180deg, rgba(16,185,129,0.02) 0%, rgba(16,185,129,0) 100%)',
            borderRadius: '16px',
            border: '1px solid rgba(16,185,129,0.05)',
            margin: '0.5rem'
          }}>
            <div style={{ 
              width: '72px', height: '72px', borderRadius: '50%', 
              background: 'linear-gradient(135deg, rgba(16,185,129,0.15), rgba(5,150,105,0.05))', 
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: 'inset 0 2px 4px rgba(255,255,255,0.5)'
            }}>
              <Bot size={36} color="var(--primary)" />
            </div>
            <p style={{ margin: 0, color: 'var(--text-main)', fontSize: '1rem', fontWeight: 500, lineHeight: 1.6, maxWidth: '80%' }}>
              Hi there! I'm your AI kitchen assistant.
            </p>
            <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.9rem', lineHeight: 1.6, maxWidth: '85%' }}>
              Ask me for personalized recipe ideas, how to use leftovers, or any cooking tips you need.
            </p>
          </div>
        ) : (
          chatMessages.map((msg, i) => (
            <div key={i} style={{
              alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
              maxWidth: '85%',
              display: 'flex',
              gap: '0.85rem',
              flexDirection: msg.role === 'user' ? 'row-reverse' : 'row',
              alignItems: 'flex-end'
            }}>
              {msg.role === 'assistant' && (
                <div style={{
                  width: '32px', height: '32px', borderRadius: '12px',
                  background: 'linear-gradient(135deg, #10b981, #059669)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0,
                  boxShadow: '0 4px 10px rgba(16,185,129,0.25)'
                }}>
                  <Sparkles size={16} color="#fff" />
                </div>
              )}

              <div style={{
                background: msg.role === 'user' ? 'linear-gradient(135deg,#10b981,#059669)' : 'var(--card-bg)',
                color: msg.role === 'user' ? '#fff' : 'var(--text-main)',
                padding: '1rem 1.25rem',
                borderRadius: msg.role === 'user' ? '24px 24px 6px 24px' : '24px 24px 24px 6px',
                border: msg.role === 'user' ? 'none' : '1px solid rgba(16,185,129,0.15)',
                boxShadow: msg.role === 'user' ? '0 8px 20px rgba(16,185,129,0.2)' : '0 4px 16px rgba(0,0,0,0.04)',
                fontSize: '0.95rem',
                lineHeight: 1.6,
                position: 'relative'
              }}>
                <div className={msg.role === 'user' ? 'user-msg-markdown' : 'premium-markdown'}>
                  {msg.role === 'user' ? (
                    <div style={{ whiteSpace: 'pre-wrap' }}>{msg.content}</div>
                  ) : (
                    <ReactMarkdown>{msg.content}</ReactMarkdown>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
        {chatLoading && (
          <div style={{ alignSelf: 'flex-start', display: 'flex', gap: '0.75rem', alignItems: 'flex-end' }}>
            <div style={{
              width: '32px', height: '32px', borderRadius: '12px',
              background: 'linear-gradient(135deg, #10b981, #059669)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
              boxShadow: '0 4px 10px rgba(16,185,129,0.25)'
            }}>
              <Sparkles size={16} color="#fff" />
            </div>
            <div style={{ background: 'var(--card-bg)', padding: '1.15rem 1.5rem', borderRadius: '24px 24px 24px 6px', border: '1px solid rgba(16,185,129,0.15)', display: 'flex', gap: '0.4rem', alignItems: 'center', boxShadow: '0 4px 16px rgba(0,0,0,0.04)' }}>
              <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--primary)', animation: 'bounce 1.4s infinite ease-in-out both', animationDelay: '-0.32s' }}></div>
              <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--primary)', animation: 'bounce 1.4s infinite ease-in-out both', animationDelay: '-0.16s' }}></div>
              <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--primary)', animation: 'bounce 1.4s infinite ease-in-out both' }}></div>
            </div>
          </div>
        )}
      </div>

      <form onSubmit={handleChatSubmit} style={{
        display: 'flex',
        padding: '1.25rem 1.5rem',
        borderTop: '1px solid rgba(16,185,129,0.1)',
        background: 'var(--card-bg)',
        gap: '0.85rem',
        alignItems: 'center',
        borderBottomLeftRadius: '24px',
        borderBottomRightRadius: '24px',
      }}>
        <div style={{
          flex: 1,
          display: 'flex',
          background: isInputFocused ? 'var(--card-bg)' : 'var(--body-bg)',
          borderRadius: '50px',
          border: `1px solid ${isInputFocused ? 'var(--primary)' : 'rgba(16,185,129,0.1)'}`,
          transition: 'all 0.3s ease',
          boxShadow: isInputFocused ? '0 0 0 4px rgba(16,185,129,0.1)' : 'inset 0 2px 4px rgba(0,0,0,0.02)'
        }}>
          <input
            type="text"
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            onFocus={() => setIsInputFocused(true)}
            onBlur={() => setIsInputFocused(false)}
            placeholder="Ask me anything about SmartMeal..."
            style={{
              flex: 1,
              minWidth: 0,
              border: 'none',
              background: 'transparent',
              padding: '0.95rem 1.5rem',
              fontSize: '0.95rem',
              outline: 'none',
              color: 'var(--text-main)',
              fontWeight: 500
            }}
            disabled={chatLoading}
          />
        </div>
        <button
          type="submit"
          disabled={chatLoading || !chatInput.trim()}
          style={{
            width: '48px',
            height: '48px',
            flexShrink: 0,
            background: chatLoading || !chatInput.trim() ? '#f1f5f9' : 'linear-gradient(135deg, #10b981, #059669)',
            color: chatLoading || !chatInput.trim() ? '#94a3b8' : '#fff',
            border: 'none',
            borderRadius: '50%',
            padding: '0',
            cursor: chatLoading || !chatInput.trim() ? 'default' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            boxShadow: chatLoading || !chatInput.trim() ? 'none' : '0 6px 16px rgba(16,185,129,0.35)',
            transform: chatLoading || !chatInput.trim() ? 'scale(1)' : 'scale(1.05)'
          }}
          onMouseEnter={e => { if(!chatLoading && chatInput.trim()) e.currentTarget.style.transform = 'scale(1.1) rotate(5deg)'; }}
          onMouseLeave={e => { if(!chatLoading && chatInput.trim()) e.currentTarget.style.transform = 'scale(1.05)'; }}
        >
          <Send size={20} style={{ marginLeft: chatLoading || !chatInput.trim() ? '0' : '-2px' }} />
        </button>
      </form>
    </div>
  );
}
