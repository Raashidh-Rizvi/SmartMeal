import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChefHat, ShoppingCart, Lightbulb, AlertCircle, CheckCircle2, Loader2, ExternalLink, Send, MessageSquare, Heart } from 'lucide-react';
import { ShoppingAPI } from '../api/axios';
import { chatAboutRecipe, createRecipe, toggleFavoriteRecipe } from '../api/recipes';

/**
 * AIRecipePanel
 * Displays the structured response from POST /api/recommendations/generate-recipe
 */
export default function AIRecipePanel({ data, onAlternativeClick, loading }) {
  const navigate = useNavigate();
  const [checkedItems, setCheckedItems] = useState({});
  const [addingAll, setAddingAll]       = useState(false);
  const [addedAll, setAddedAll]         = useState(false);
  const [addError, setAddError]         = useState('');

  // Favorites state
  const [isFavoriting, setIsFavoriting] = useState(false);
  const [isFavorited, setIsFavorited]   = useState(false);
  const [favoriteError, setFavoriteError] = useState('');

  // Chat state
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput]       = useState('');
  const [chatLoading, setChatLoading]   = useState(false);
  const chatContainerRef = useRef(null);

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [chatMessages]);

  const handleChatSubmit = async (e) => {
    e.preventDefault();
    if (!chatInput.trim() || chatLoading) return;

    const newMsg = { role: 'user', content: chatInput.trim() };
    const newHistory = [...chatMessages, newMsg];
    setChatMessages(newHistory);
    setChatInput('');
    setChatLoading(true);

    try {
      const res = await chatAboutRecipe({
        messages: newHistory,
        recipe_context: data?.generated_recipe || {}
      });
      setChatMessages([...newHistory, { role: 'assistant', content: res.data.reply }]);
    } catch (err) {
      setChatMessages([...newHistory, { role: 'assistant', content: 'Oops! I had a problem processing that. Could you try again?' }]);
    } finally {
      setChatLoading(false);
    }
  };

  // Parse "1 cup moong dal" → { name, quantity, unit }
  const parseShoppingItem = (raw) => {
    const str = String(raw).trim();
    // Match leading number (int or float/fraction like 1/2)
    const numMatch = str.match(/^([\d\/\.]+)\s*/);
    let quantity = 1;
    let rest = str;
    if (numMatch) {
      const raw = numMatch[1];
      if (raw.includes('/')) {
        const [n, d] = raw.split('/');
        quantity = parseFloat(n) / parseFloat(d);
      } else {
        quantity = parseFloat(raw) || 1;
      }
      rest = str.slice(numMatch[0].length).trim();
    }
    // Common units
    const units = ['cup','cups','tbsp','tsp','tablespoon','tablespoons','teaspoon','teaspoons',
      'g','kg','ml','l','liter','litre','oz','lb','piece','pieces','sprig','sprigs','clove','cloves',
      'pinch','bunch','inch','medium','large','small','can','slice','slices'];
    let unit = '';
    let name = rest;
    for (const u of units) {
      const rx = new RegExp(`^${u}s?\\s+`, 'i');
      if (rx.test(rest)) {
        unit = u;
        name = rest.replace(rx, '').trim();
        break;
      }
    }
    return { name: name || str, quantity, unit };
  };

  const handleAddAllToShoppingList = async () => {
    if (!shopping.length) return;
    setAddingAll(true);
    setAddedAll(false);
    setAddError('');
    try {
      const unchecked = shopping.filter((_, i) => !checkedItems[i]);
      // Use ShoppingAPI.addItem — same helper used everywhere else in the app,
      // guaranteed to send the JWT correctly. Errors are caught here so the
      // global 401 interceptor never fires and does NOT log the user out.
      const results = await Promise.allSettled(
        unchecked.map((item) => {
          const parsed = parseShoppingItem(item);
          return ShoppingAPI.addItem({
            name: parsed.name,
            quantity: parsed.quantity,
            unit: parsed.unit,
            category: 'AI Recipe',
            source: 'ai_recipe',
            status: 'pending',
          });
        })
      );
      const failed = results.filter(r => r.status === 'rejected');
      if (failed.length > 0) {
        const reason = failed[0].reason;
        // Only show an error — do NOT re-throw so the 401 interceptor doesn't fire
        const msg = reason?.response?.data?.detail || reason?.message || 'Some items could not be added.';
        setAddError(msg);
      } else {
        setAddedAll(true);
        // Redirect to the shopping list page immediately
        navigate('/shoppinglist');
      }
    } catch (err) {
      // Catch-all: show message without re-throwing
      setAddError(err?.response?.data?.detail || err?.message || 'Failed to add items.');
    } finally {
      setAddingAll(false);
    }
  };

  const handleAddToFavorites = async () => {
    if (!r.recipe_name) return;
    setIsFavoriting(true);
    setFavoriteError('');
    try {
      // 1. Parse prep time
      let time = 30; // default
      if (r.prep_time) {
        const match = r.prep_time.match(/(\d+)/);
        if (match) {
          const t = parseInt(match[1]);
          if (!isNaN(t)) time = t;
        }
      }

      // 2. Map category (must be breakfast, lunch, dinner, snack)
      let category = 'dinner';
      const dietLower = (r.diet || '').toLowerCase();
      if (dietLower.includes('breakfast')) category = 'breakfast';
      else if (dietLower.includes('lunch')) category = 'lunch';
      else if (dietLower.includes('snack')) category = 'snack';

      // 3. Parse ingredients
      const parsedIngredients = (r.ingredients || []).map((ing) => {
        const raw = ing.item || ing;
        const parsed = parseShoppingItem(raw);
        let q = parsed.quantity;
        if (isNaN(q) || q <= 0) q = 1;
        if (q > 9999) q = 9999;
        
        // Make sure name is not too long
        let name = parsed.name || 'ingredient';
        if (name.length > 100) name = name.substring(0, 100);
        
        let unit = parsed.unit || 'piece';
        if (unit.length > 50) unit = unit.substring(0, 50);

        return {
          name: name,
          quantity: q,
          unit: unit,
        };
      });

      // 4. Create recipe payload
      const payload = {
        title: r.recipe_name,
        description: r.tips || 'AI Generated Recipe',
        ingredients: parsedIngredients,
        preparation_steps: r.instructions || ['Cook and enjoy'],
        category: category,
        dietary_tags: r.diet ? [r.diet] : [],
        estimated_cooking_time: time,
      };

      // 5. Call API to save recipe
      const createRes = await createRecipe(payload);
      const recipeId = createRes.data._id || createRes.data.id;

      // 6. Add to favorites
      await toggleFavoriteRecipe(recipeId);

      setIsFavorited(true);
    } catch (err) {
      console.error('Failed to add to favorites:', err);
      setFavoriteError('Failed to save to favorites.');
    } finally {
      setIsFavoriting(false);
    }
  };

  // Derived values — declared before early returns so handler closure can access them
  const r            = (data && data.generated_recipe) || {};
  const shopping     = (data && data.shopping_list)    || [];
  const alternatives = (data && (data.alternatives || r.alternatives)) || [];
  const aiAvailable  = data && data.ai_available;

  if (loading) {
    return (
      <div style={panelStyle}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem', padding: '3rem' }}>
          <Loader2 size={48} style={{ color: 'var(--primary)', animation: 'spin 1s linear infinite' }} />
          <p style={{ color: 'var(--text-muted)', fontSize: '1.05rem', fontWeight: 600 }}>
            Chef AI is crafting your recipe…
          </p>
        </div>
      </div>
    );
  }

  if (!data) return null;

  const toggleCheck = (idx) =>
    setCheckedItems(prev => ({ ...prev, [idx]: !prev[idx] }));

  return (
    <div style={panelStyle}>
      {/* AI Badge */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={aiIconBadge}>
            <ChefHat size={22} color="#fff" />
          </div>
          <div>
            <h2 style={{ margin: 0, fontSize: '1.6rem', fontWeight: 800, color: 'var(--text-main)' }}>
              {r.recipe_name || 'AI Generated Recipe'}
            </h2>
            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.4rem', flexWrap: 'wrap' }}>
              {r.cuisine && <span style={chip('#10b981')}>{r.cuisine}</span>}
              {r.diet    && <span style={chip('#3b82f6')}>{r.diet}</span>}
              {r.prep_time && <span style={chip('#f59e0b')}>⏱ {r.prep_time}</span>}
              {r.servings  && <span style={chip('#8b5cf6')}>👥 {r.servings}</span>}
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          {!aiAvailable && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', color: '#f59e0b', background: 'rgba(245,158,11,0.1)', padding: '0.5rem 0.9rem', borderRadius: '50px', border: '1px solid rgba(245,158,11,0.25)' }}>
              <AlertCircle size={14} /> AI unavailable — showing fallback
            </div>
          )}
          <button
            onClick={handleAddToFavorites}
            disabled={isFavoriting || isFavorited}
            style={{
              display: 'flex', alignItems: 'center', gap: '0.45rem',
              padding: '0.5rem 1.1rem', borderRadius: '50px', fontWeight: 700, fontSize: '0.85rem',
              background: isFavorited ? 'rgba(239,68,68,0.1)' : '#fff',
              color: isFavorited ? '#ef4444' : 'var(--text-main)',
              border: `1px solid ${isFavorited ? 'rgba(239,68,68,0.3)' : 'var(--card-border)'}`,
              cursor: (isFavoriting || isFavorited) ? 'default' : 'pointer',
              transition: 'all 0.2s',
              boxShadow: isFavorited ? 'none' : '0 2px 8px rgba(0,0,0,0.05)',
            }}
          >
            {isFavoriting ? (
              <><Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> Saving…</>
            ) : isFavorited ? (
              <><Heart size={16} fill="#ef4444" color="#ef4444" /> Saved to Favorites</>
            ) : (
              <><Heart size={16} color="#ef4444" /> Save to Favorites</>
            )}
          </button>
        </div>
      </div>
      {favoriteError && <p style={{ fontSize: '0.78rem', color: '#ef4444', marginTop: '-1rem', marginBottom: '1rem', fontWeight: 500 }}>{favoriteError}</p>}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>

        {/* Ingredients */}
        <section style={sectionCard}>
          <h3 style={sectionTitle}>📋 Ingredients</h3>
          {(r.ingredients || []).map((ing, i) => {
            const available = ing.available !== false;
            return (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', padding: '0.45rem 0', borderBottom: '1px solid rgba(0,0,0,0.04)' }}>
                <span style={{ fontSize: '1rem' }}>{available ? '✅' : '🔴'}</span>
                <span style={{ flex: 1, fontSize: '0.9rem', color: available ? 'var(--text-main)' : '#ef4444', fontWeight: available ? 400 : 600 }}>
                  {ing.quantity ? `${ing.quantity} ` : ''}{ing.item || ing}
                </span>
                {!available && <span style={{ fontSize: '0.7rem', background: 'rgba(239,68,68,0.1)', color: '#ef4444', padding: '2px 8px', borderRadius: '50px', fontWeight: 700 }}>NEED</span>}
              </div>
            );
          })}
          {r.missing_ingredients?.length > 0 && (
            <div style={{ marginTop: '0.75rem', padding: '0.6rem 0.8rem', background: 'rgba(239,68,68,0.06)', borderRadius: '10px', border: '1px solid rgba(239,68,68,0.15)' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#ef4444', marginBottom: '0.35rem' }}>MISSING INGREDIENTS</div>
              {r.missing_ingredients.map((m, i) => <div key={i} style={{ fontSize: '0.85rem', color: '#ef4444' }}>• {m}</div>)}
            </div>
          )}
        </section>

        {/* Instructions */}
        <section style={sectionCard}>
          <h3 style={sectionTitle}>📝 Instructions</h3>
          {(r.instructions || []).map((step, i) => (
            <div key={i} style={{ display: 'flex', gap: '0.75rem', marginBottom: '0.85rem' }}>
              <div style={{ minWidth: '26px', height: '26px', borderRadius: '50%', background: 'var(--primary-gradient)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 800, flexShrink: 0 }}>
                {i + 1}
              </div>
              <p style={{ margin: 0, fontSize: '0.88rem', color: 'var(--text-main)', lineHeight: 1.6 }}>{step}</p>
            </div>
          ))}
          {r.tips && (
            <div style={{ marginTop: '0.75rem', padding: '0.75rem', background: 'rgba(16,185,129,0.06)', borderRadius: '10px', border: '1px solid rgba(16,185,129,0.15)' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--primary)', marginBottom: '0.25rem' }}>💡 CHEF TIP</div>
              <p style={{ margin: 0, fontSize: '0.85rem', fontStyle: 'italic', color: 'var(--text-main)' }}>{r.tips}</p>
            </div>
          )}
        </section>
      </div>

      {/* Shopping List */}
      {shopping.length > 0 && (
        <section style={{ ...sectionCard, marginTop: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.85rem', flexWrap: 'wrap', gap: '0.75rem' }}>
            <h3 style={{ ...sectionTitle, margin: 0 }}>
              <ShoppingCart size={16} style={{ verticalAlign: 'middle', marginRight: '0.4rem' }} />
              Shopping List
            </h3>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
              {addedAll ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ fontSize: '0.82rem', color: 'var(--primary)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <CheckCircle2 size={15} /> Added to Shopping List!
                  </span>
                  <a href="/shoppinglist" style={{ fontSize: '0.78rem', color: '#3b82f6', display: 'flex', alignItems: 'center', gap: '0.25rem', fontWeight: 600, textDecoration: 'none' }}>
                    View List <ExternalLink size={12} />
                  </a>
                </div>
              ) : (
                <button
                  onClick={handleAddAllToShoppingList}
                  disabled={addingAll}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '0.45rem',
                    padding: '0.45rem 1rem', borderRadius: '50px', fontWeight: 700, fontSize: '0.82rem',
                    background: addingAll ? 'rgba(16,185,129,0.1)' : 'linear-gradient(135deg,#10b981,#059669)',
                    color: addingAll ? 'var(--primary)' : '#fff',
                    border: '1px solid rgba(16,185,129,0.3)',
                    cursor: addingAll ? 'default' : 'pointer',
                    transition: 'all 0.2s',
                    boxShadow: addingAll ? 'none' : '0 3px 10px rgba(16,185,129,0.3)',
                  }}
                >
                  {addingAll
                    ? <><Loader2 size={13} style={{ animation: 'spin 1s linear infinite' }} /> Adding…</>
                    : <><ShoppingCart size={13} /> Add All to Shopping List</>}
                </button>
              )}
            </div>
          </div>
          {addError && <p style={{ fontSize: '0.78rem', color: '#ef4444', margin: '0 0 0.5rem', fontWeight: 500 }}>{addError}</p>}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '0.5rem' }}>
            {shopping.map((item, i) => (
              <label key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', cursor: 'pointer', padding: '0.5rem 0.75rem', borderRadius: '10px', background: checkedItems[i] ? 'rgba(16,185,129,0.06)' : 'rgba(0,0,0,0.02)', border: '1px solid', borderColor: checkedItems[i] ? 'rgba(16,185,129,0.2)' : 'var(--card-border)', transition: 'all 0.2s' }}>
                <input type="checkbox" checked={!!checkedItems[i]} onChange={() => toggleCheck(i)} style={{ accentColor: 'var(--primary)', width: '16px', height: '16px' }} />
                <span style={{ fontSize: '0.87rem', textDecoration: checkedItems[i] ? 'line-through' : 'none', color: checkedItems[i] ? 'var(--text-muted)' : 'var(--text-main)' }}>
                  {item}
                </span>
              </label>
            ))}
          </div>
          {!addedAll && shopping.length > 0 && (
            <p style={{ margin: '0.75rem 0 0', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Tip: Check off items you already have, then click <strong>Add All to Shopping List</strong> to add the rest.
            </p>
          )}
        </section>
      )}

      {/* Alternatives */}
      {alternatives.length > 0 && (
        <section style={{ marginTop: '1.5rem' }}>
          <h3 style={{ ...sectionTitle, marginBottom: '0.75rem' }}><Lightbulb size={16} style={{ verticalAlign: 'middle', marginRight: '0.4rem' }} />Alternative Dishes</h3>
          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            {alternatives.map((alt, i) => (
              <button key={i} onClick={() => onAlternativeClick && onAlternativeClick(alt.name)}
                style={{ padding: '0.6rem 1.2rem', borderRadius: '50px', border: '1px solid rgba(var(--primary-rgb),0.3)', background: 'rgba(var(--primary-rgb),0.05)', color: 'var(--primary)', fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer', transition: 'all 0.2s' }}
                onMouseEnter={e => { e.target.style.background = 'var(--primary)'; e.target.style.color = '#fff'; }}
                onMouseLeave={e => { e.target.style.background = 'rgba(var(--primary-rgb),0.05)'; e.target.style.color = 'var(--primary)'; }}>
                ✨ {alt.name || alt}
              </button>
            ))}
          </div>
          <div style={{ marginTop: '0.5rem', display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
            {alternatives.map((alt, i) => alt.reason && (
              <span key={i} style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                <strong>{alt.name}:</strong> {alt.reason}
              </span>
            ))}
          </div>
        </section>
      )}

      {/* Chef Chat */}
      <section style={{ 
        marginTop: '2rem', 
        background: '#ffffff', 
        border: '1px solid rgba(0,0,0,0.06)', 
        borderRadius: '24px', 
        overflow: 'hidden',
        boxShadow: '0 12px 36px rgba(0,0,0,0.04), 0 4px 12px rgba(0,0,0,0.02)'
      }}>
        <div style={{ 
          background: 'linear-gradient(to right, rgba(16,185,129,0.08), rgba(16,185,129,0.02))', 
          padding: '1.25rem 1.5rem', 
          borderBottom: '1px solid rgba(16,185,129,0.1)', 
          display: 'flex', 
          alignItems: 'center', 
          gap: '0.85rem' 
        }}>
          <div style={{
            width: '36px', height: '36px', borderRadius: '10px',
            background: 'linear-gradient(135deg, #10b981, #059669)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 4px 12px rgba(16,185,129,0.3)'
          }}>
            <MessageSquare size={18} color="#fff" />
          </div>
          <div>
            <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-main)', letterSpacing: '-0.01em' }}>Chef AI Assistant</h3>
            <p style={{ margin: '0.2rem 0 0', fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 500 }}>Ask about substitutions, tips, or modifications</p>
          </div>
        </div>
        
        <div ref={chatContainerRef} style={{ 
          padding: '1.5rem', 
          maxHeight: '380px', 
          overflowY: 'auto', 
          display: 'flex', 
          flexDirection: 'column', 
          gap: '1.25rem',
          background: '#fafafa'
        }}>
          {chatMessages.length === 0 ? (
            <div style={{ 
              textAlign: 'center', 
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem',
              padding: '3rem 1rem' 
            }}>
               <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'rgba(16,185,129,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                 <ChefHat size={32} color="var(--primary)" />
               </div>
               <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.9rem', lineHeight: 1.6, maxWidth: '80%' }}>
                 I'm your personal sous-chef! Have questions about this recipe? Want to substitute an ingredient or adjust the serving size? Ask me anything!
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
                    <ChefHat size={14} color="#fff" />
                  </div>
                )}
                
                <div style={{ 
                  background: msg.role === 'user' ? 'linear-gradient(135deg,#10b981,#059669)' : '#fff',
                  color: msg.role === 'user' ? '#fff' : 'var(--text-main)',
                  padding: '0.85rem 1.15rem',
                  borderRadius: msg.role === 'user' ? '20px 20px 4px 20px' : '20px 20px 20px 4px',
                  border: msg.role === 'user' ? 'none' : '1px solid rgba(0,0,0,0.06)',
                  boxShadow: msg.role === 'user' ? '0 6px 16px rgba(16,185,129,0.25)' : '0 4px 12px rgba(0,0,0,0.03)',
                  fontSize: '0.9rem',
                  lineHeight: 1.6,
                  whiteSpace: 'pre-wrap'
                }}>
                  {msg.content.replace(/[*#]/g, '').replace(/---/g, '')}
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
                 <ChefHat size={14} color="#fff" />
               </div>
               <div style={{ background: '#fff', padding: '1rem 1.25rem', borderRadius: '20px 20px 20px 4px', border: '1px solid rgba(0,0,0,0.06)', display: 'flex', gap: '0.4rem', alignItems: 'center', boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>
                 <div style={{width:'6px',height:'6px',borderRadius:'50%',background:'var(--primary)',animation:'bounce 1.4s infinite ease-in-out both',animationDelay:'-0.32s'}}></div>
                 <div style={{width:'6px',height:'6px',borderRadius:'50%',background:'var(--primary)',animation:'bounce 1.4s infinite ease-in-out both',animationDelay:'-0.16s'}}></div>
                 <div style={{width:'6px',height:'6px',borderRadius:'50%',background:'var(--primary)',animation:'bounce 1.4s infinite ease-in-out both'}}></div>
               </div>
            </div>
          )}
        </div>

        <form onSubmit={handleChatSubmit} style={{ 
          display: 'flex', 
          padding: '1.25rem 1.5rem', 
          borderTop: '1px solid rgba(0,0,0,0.06)', 
          background: '#fff',
          gap: '0.75rem',
          alignItems: 'center'
        }}>
          <div style={{ 
            flex: 1, 
            display: 'flex', 
            background: 'rgba(0,0,0,0.03)', 
            borderRadius: '50px',
            border: '1px solid rgba(0,0,0,0.05)',
            transition: 'all 0.2s',
            boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.02)'
          }}>
            <input 
              type="text" 
              value={chatInput} 
              onChange={(e) => setChatInput(e.target.value)}
              placeholder="Ask about substitutions, tips, or modifications..." 
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
      </section>
    </div>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const panelStyle = {
  background: 'var(--card-bg)',
  border: '1px solid var(--card-border)',
  borderRadius: '28px',
  padding: '2rem',
  marginTop: '2.5rem',
  animation: 'slideUp 0.5s ease-out',
  boxShadow: '0 8px 40px rgba(0,0,0,0.08)',
};

const aiIconBadge = {
  width: '48px', height: '48px', borderRadius: '14px',
  background: 'linear-gradient(135deg, #10b981, #059669)',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  boxShadow: '0 4px 14px rgba(16,185,129,0.35)',
};

const sectionCard = {
  background: 'rgba(0,0,0,0.02)',
  border: '1px solid var(--card-border)',
  borderRadius: '16px',
  padding: '1.25rem',
};

const sectionTitle = {
  margin: '0 0 0.85rem',
  fontSize: '0.85rem',
  fontWeight: 800,
  letterSpacing: '0.06em',
  color: 'var(--text-muted)',
  textTransform: 'uppercase',
};

const chip = (color) => ({
  fontSize: '0.72rem', fontWeight: 700, padding: '3px 10px',
  borderRadius: '50px', background: `${color}18`, color,
  border: `1px solid ${color}30`,
});
