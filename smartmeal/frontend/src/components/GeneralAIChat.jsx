import React, { useState, useRef, useEffect } from 'react';
import { ChefHat, Send, MessageSquare, Loader2, Sparkles, X } from 'lucide-react';
import { generalAppChat } from '../api/recipes';

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

      <div ref={chatContainerRef} style={{
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
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem',
            padding: '3rem 1rem'
          }}>
            <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'rgba(16,185,129,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <ChefHat size={32} color="var(--primary)" />
            </div>
            <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.9rem', lineHeight: 1.6, maxWidth: '80%' }}>
              I'm your personal kitchen assistant! Ask me how to use the app, or what you should cook for dinner.
            </p>
          </div>
        ) : (
          chatMessages.map((msg, i) => (
            <div key={i} style={{
              alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
              maxWidth: '85%',
              display: 'flex',
              gap: '0.75rem',
              flexDirection: msg.role === 'user' ? 'row-reverse' : 'row',
              alignItems: 'flex-end'
            }}>
              {msg.role === 'assistant' && (
                <div style={{
                  width: '28px', height: '28px', borderRadius: '50%',
                  background: 'linear-gradient(135deg, #10b981, #059669)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0,
                  boxShadow: '0 2px 6px rgba(16,185,129,0.3)'
                }}>
                  <Sparkles size={14} color="#fff" />
                </div>
              )}

              <div style={{
                background: msg.role === 'user' ? 'linear-gradient(135deg,#10b981,#059669)' : 'var(--card-bg)',
                color: msg.role === 'user' ? '#fff' : 'var(--text-main)',
                padding: '0.85rem 1.15rem',
                borderRadius: msg.role === 'user' ? '20px 20px 4px 20px' : '20px 20px 20px 4px',
                border: msg.role === 'user' ? 'none' : '1px solid var(--card-border)',
                boxShadow: msg.role === 'user' ? '0 6px 16px rgba(16,185,129,0.25)' : 'var(--shadow-sm)',
                fontSize: '0.9rem',
                lineHeight: 1.6,
                whiteSpace: 'pre-wrap'
              }}>
                {msg.content}
              </div>
            </div>
          ))
        )}
        {chatLoading && (
          <div style={{ alignSelf: 'flex-start', display: 'flex', gap: '0.75rem', alignItems: 'flex-end' }}>
            <div style={{
              width: '28px', height: '28px', borderRadius: '50%',
              background: 'linear-gradient(135deg, #10b981, #059669)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
              boxShadow: '0 2px 6px rgba(16,185,129,0.3)'
            }}>
              <Sparkles size={14} color="#fff" />
            </div>
            <div style={{ background: 'var(--card-bg)', padding: '1rem 1.25rem', borderRadius: '20px 20px 20px 4px', border: '1px solid var(--card-border)', display: 'flex', gap: '0.4rem', alignItems: 'center', boxShadow: 'var(--shadow-sm)' }}>
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
        borderTop: '1px solid var(--card-border)',
        background: 'var(--card-bg)',
        gap: '0.75rem',
        alignItems: 'center'
      }}>
        <div style={{
          flex: 1,
          display: 'flex',
          background: 'var(--body-bg)',
          borderRadius: '50px',
          border: '1px solid var(--card-border)',
          transition: 'all 0.2s',
          boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.02)'
        }}>
          <input
            type="text"
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            placeholder="Ask me anything about SmartMeal..."
            style={{
              flex: 1,
              minWidth: 0,
              border: 'none',
              background: 'transparent',
              padding: '0.85rem 1.25rem',
              fontSize: '0.9rem',
              outline: 'none',
              color: 'var(--text-main)'
            }}
            disabled={chatLoading}
          />
        </div>
        <button
          type="submit"
          disabled={chatLoading || !chatInput.trim()}
          style={{
            width: '46px',
            height: '46px',
            flexShrink: 0,
            background: chatLoading || !chatInput.trim() ? 'rgba(0,0,0,0.05)' : 'linear-gradient(135deg, #10b981, #059669)',
            color: chatLoading || !chatInput.trim() ? 'var(--text-muted)' : '#fff',
            border: 'none',
            borderRadius: '50%',
            padding: '0',
            cursor: chatLoading || !chatInput.trim() ? 'default' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.2s',
            boxShadow: chatLoading || !chatInput.trim() ? 'none' : '0 4px 12px rgba(16,185,129,0.3)',
          }}
        >
          <Send size={18} style={{ marginLeft: '-2px' }} />
        </button>
      </form>
    </div>
  );
}
