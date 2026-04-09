import React, { useContext, useState, useMemo, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import { ThemeContext } from '../../context/ThemeContext';
import api from '../../api/axios';
import {
  Package,
  Sparkles,
  Calendar,
  ShoppingCart,
  BookOpen,
  ChefHat,
  Wallet,
  User,
  TrendingUp,
  Leaf,
  Flame,
  BarChart2,
  ArrowRight,
  Clock,
  AlertCircle,
  Tag,
  Loader2,
  Search,
  Plus,
  Zap,
  UtensilsCrossed
} from 'lucide-react';

/* ─── Premium Design Tokens & Styles ─── */
const s = {
  container: {
    paddingBottom: '3rem',
    animation: 'fadeIn 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards',
  },
  /* Hero Section */
  heroSection: {
    width: '100vw',
    position: 'relative',
    left: '50%',
    right: '50%',
    marginLeft: '-50vw',
    marginRight: '-50vw',
    background: 'linear-gradient(135deg, #012a1e 0%, #011c16 100%)',
    boxShadow: 'inset 0 0 100px rgba(0, 0, 0, 0.3)',
    borderRadius: '0 0 100px 100px',
    marginTop: '-3rem', // Counteracting main-content top padding
    padding: '8rem 2rem 10rem',
    marginBottom: '3.5rem',
    overflow: 'hidden',
    textAlign: 'center',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '2.5rem', // QuicMov-style spacing
  },
  ctaButton: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    padding: '1rem 2.25rem',
    background: 'linear-gradient(135deg, var(--primary) 0%, #059669 100%)',
    color: 'white',
    borderRadius: '14px',
    fontSize: '1.15rem',
    fontWeight: 700,
    border: 'none',
    cursor: 'pointer',
    boxShadow: '0 10px 25px rgba(16, 185, 129, 0.3), 0 0 0 1px rgba(255, 255, 255, 0.1) inset',
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    textDecoration: 'none',
    zIndex: 10,
  },
  heroBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.6rem',
    background: 'rgba(255, 255, 255, 0.08)',
    border: '1px solid rgba(16, 185, 129, 0.3)',
    backdropFilter: 'blur(10px)',
    padding: '0.5rem 1.25rem',
    borderRadius: '100px',
    fontSize: '0.85rem',
    fontWeight: 700,
    color: '#10b981',
    textTransform: 'uppercase',
    letterSpacing: '0.1em',
    marginBottom: '0.5rem',
  },
  gradientTitle: {
    fontSize: 'clamp(2.5rem, 6vw, 4.5rem)',
    fontWeight: 900,
    letterSpacing: '-0.05em',
    margin: '0 auto',
    lineHeight: 1.1,
    display: 'inline-block',
    maxWidth: '900px',
    textAlign: 'center',
    position: 'relative',
    zIndex: 1,
  },
  subtitle: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: '1.25rem',
    fontWeight: 500,
    maxWidth: '700px',
    margin: '0 auto',
    opacity: 0.9,
    lineHeight: 1.6,
  },
  searchBox: {
    width: '100%',
    maxWidth: '850px',
    position: 'relative',
    marginTop: '1.5rem',
    zIndex: 10,
  },
  searchInput: {
    width: '100%',
    padding: '1.25rem 1.5rem 1.25rem 3.5rem',
    fontSize: '1.1rem',
    background: 'rgba(255, 255, 255, 0.05)',
    backdropFilter: 'blur(30px)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    borderRadius: '24px',
    color: 'white',
    boxShadow: 'var(--shadow-lg)',
    transition: 'all 0.3s ease',
  },
  searchIcon: {
    position: 'absolute',
    left: '1.5rem',
    top: '50%',
    transform: 'translateY(-50%)',
    color: '#10b981',
    opacity: 0.9,
  },
  heroBgIcon: {
    position: 'absolute',
    opacity: 0.08,
    color: '#10b981',
    pointerEvents: 'none',
  },
  /* welcome row */
  welcomeRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: '1.5rem',
    marginBottom: '2.5rem',
    padding: '0 1rem',
  },
  /* stats mini */
  statsMini: {
    display: 'flex',
    gap: '0.85rem',
    flexWrap: 'wrap',
  },
  statBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.5rem',
    background: 'var(--card-bg)',
    backdropFilter: 'blur(12px)',
    border: '1px solid var(--card-border)',
    borderRadius: '100px',
    padding: '0.6rem 1.25rem',
    fontWeight: 700,
    fontSize: '0.8rem',
    color: 'var(--primary)',
    boxShadow: 'var(--shadow-sm)',
    transition: 'all 0.3s ease',
  },
  /* The Unified Smart Grid */
  smartGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
    gap: '1.5rem',
    perspective: '1000px',
  },
  /* The Smart Widget Card */
  widget: {
    background: 'var(--card-bg)',
    backdropFilter: 'var(--glass-blur)',
    border: '1px solid var(--card-border)',
    borderRadius: '32px',
    padding: '1.75rem',
    display: 'flex',
    flexDirection: 'column',
    gap: '1.25rem',
    textDecoration: 'none',
    color: 'inherit',
    transition: 'all 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
    position: 'relative',
    overflow: 'hidden',
    boxShadow: 'var(--shadow-md)',
  },
  widgetHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  iconBox: {
    width: '52px',
    height: '52px',
    borderRadius: '18px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'rgba(16, 185, 129, 0.08)',
    color: 'var(--primary)',
    transition: 'transform 0.3s ease',
  },
  statusDot: {
    width: '10px',
    height: '10px',
    borderRadius: '50%',
    background: '#10b981',
    boxShadow: '0 0 15px rgba(16, 185, 129, 0.6)',
  },
  contentBox: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.4rem',
  },
  widgetTitle: {
    fontSize: '1.25rem',
    fontWeight: 800,
    color: 'var(--text-main)',
    margin: 0,
    letterSpacing: '-0.02em',
  },
  widgetInfo: {
    fontSize: '0.95rem',
    color: 'var(--text-muted)',
    lineHeight: 1.5,
  },
  dataViz: {
    marginTop: 'auto',
    padding: '1rem',
    background: 'rgba(var(--primary-rgb), 0.03)',
    borderRadius: '20px',
    border: '1px solid rgba(var(--primary-rgb), 0.05)',
  },
  progressBarContainer: {
    height: '6px',
    background: 'rgba(0,0,0,0.05)',
    borderRadius: '10px',
    overflow: 'hidden',
    marginTop: '0.5rem',
  },
  progressBar: {
    height: '100%',
    background: 'var(--primary-gradient)',
    borderRadius: '10px',
    transition: 'width 1s ease-out',
  },
  loadingContainer: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '400px',
    color: 'var(--primary)',
  }
};

function Dashboard() {
  const { user } = useContext(AuthContext);
  const { isDarkMode } = useContext(ThemeContext);
  const navigate = useNavigate();
  const [toast, setToast] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearch = (e) => {
    if (e.key === 'Enter' && searchQuery.trim()) {
      navigate(`/recipes?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  // States for real data
  const [stats, setStats] = useState({
    budget: null,
    shopping: null,
    inventory: [],
    meals: [],
    recipes: [],
    leftovers: []
  });

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    const fetchDashboardData = async () => {
      // AuthContext handles redirection if no user, but we check here for safety
      if (!user?._id) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        // Use allSettled so one failing API doesn't break the entire dashboard
        const results = await Promise.allSettled([
          api.get('/api/budget/summary'),
          api.get(`/api/shopping/stats?user_id=${user._id}`),
          api.get('/api/inventory/'),
          api.get('/api/meal-schedules/'),
          api.get('/api/recipes/'),
          api.get('/api/leftovers')
        ]);

        const [
          budgetRes,
          shoppingRes,
          inventoryRes,
          mealsRes,
          recipesRes,
          leftoversRes
        ] = results;

        setStats({
          budget: budgetRes.status === 'fulfilled' ? budgetRes.value.data : null,
          shopping: shoppingRes.status === 'fulfilled' ? shoppingRes.value.data : null,
          inventory: inventoryRes.status === 'fulfilled' ? (inventoryRes.value.data.items || []) : [],
          meals: mealsRes.status === 'fulfilled' ? (mealsRes.value.data || []) : [],
          recipes: recipesRes.status === 'fulfilled' ? (recipesRes.value.data || []) : [],
          leftovers: leftoversRes.status === 'fulfilled' ? (leftoversRes.value.data || []) : []
        });

        if (results.some(r => r.status === 'rejected')) {
          console.warn('Some dashboard APIs failed to load.');
        }
      } catch (err) {
        console.error('CRITICAL: Error fetching dashboard data:', err);
        showToast('⚠️ Dashboard data could not be loaded.');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [user?._id]);

  const displayName = user?.name || 'Chef';

  // Derived Insights
  const insights = useMemo(() => {
    const { budget, shopping, inventory, meals, recipes, leftovers } = stats;

    // 1. Inventory
    const now = new Date();
    const expiringSoon = inventory.filter(item => {
      if (!item.expiryDate) return false;
      const exp = new Date(item.expiryDate);
      const diff = (exp - now) / (1000 * 60 * 60 * 24);
      return diff >= 0 && diff <= 2;
    }).length;

    // 2. Next Meal
    const futureMeals = meals
      .filter(m => new Date(m.meal_date) >= now.setHours(0,0,0,0))
      .sort((a,b) => new Date(a.meal_date) - new Date(b.meal_date));
    const nextMeal = futureMeals[0];

    return {
      inventory: {
        count: expiringSoon,
        info: expiringSoon > 0 
          ? `${expiringSoon} items expiring within 48h. Time to cook!` 
          : 'All your ingredients are fresh. Nice stocking!',
        value: inventory.length > 0 ? Math.min(100, (expiringSoon / inventory.length) * 50 + 50) : 0,
        label: inventory.length > 0 ? `Stock: ${inventory.length} items` : 'No items in stock'
      },
      budget: {
        spent: budget?.total_spent || 0,
        limit: budget?.budget?.amount || 1,
        percent: budget?.percentage_used ? Math.round(budget.percentage_used) : 0,
        info: budget?.is_over_budget 
          ? `You are $${Math.abs(budget.remaining)} over budget. Time to save!`
          : `You've spent $${budget?.total_spent || 0} — ${Math.round(budget?.percentage_used || 0)}% of limit.`
      },
      meals: {
        next: nextMeal ? `Next: ${nextMeal.recipe_title} (${nextMeal.meal_type})` : 'No meals planned for today.',
        count: futureMeals.length,
        percent: futureMeals.length > 0 ? 100 : 0,
        label: `${futureMeals.length} meals planned`
      },
      shopping: {
        pending: shopping?.pending || 0,
        info: (shopping?.pending || 0) > 0 
          ? `${shopping.pending} items pending. Mostly ${shopping.source_breakdown?.meal_plan > 0 ? 'meal plans' : 'manual'} additions.`
          : 'Your shopping list is clear. Ready to cook!',
        percent: shopping?.total > 0 ? Math.round(((shopping.bought || 0) / shopping.total) * 100) : 0,
        label: `${shopping?.pending || 0} items to buy`
      },
      recipes: {
        total: recipes.length || 0,
        info: (recipes.length || 0) > 0 
          ? `${recipes.length} recipes available. ${recipes.slice(0,5).length} new this week.`
          : 'Start building your repository by adding recipes!',
        percent: Math.min(100, (recipes.length / 50) * 100), // arbitrary 50 goal
        label: `${recipes.length} recipes total`
      },
      leftovers: {
        count: leftovers.length || 0,
        info: (leftovers.length || 0) > 0
          ? `${leftovers.length} items remaining. ${leftovers[0].name} needs eating.`
          : 'No leftovers. You\'re managing waste perfectly!',
        percent: Math.max(20, 100 - (leftovers.length * 20)),
        label: `Wasted reduced: ${Math.max(0, 100 - (leftovers.length * 10))}%`
      }
    };
  }, [stats]);

  // Smart Widget Config mapping to state
  const widgets = [
    {
      id: 'inventory',
      title: 'Inventory Status',
      icon: Package,
      path: '/inventory',
      ...insights.inventory,
      action: 'Check items',
      color: '#10b981'
    },
    {
      id: 'budget',
      title: 'Weekly Spending',
      icon: Wallet,
      path: '/budget',
      info: insights.budget.info,
      smartData: { value: insights.budget.percent, label: `$${insights.budget.spent} of $${insights.budget.limit} used` },
      action: 'View details',
      color: '#059669'
    },
    {
      id: 'meals',
      title: 'Meal Schedule',
      icon: Calendar,
      path: '/meals',
      info: insights.meals.next,
      smartData: { value: insights.meals.percent, label: insights.meals.label },
      action: 'Full schedule',
      color: '#047857'
    },
    {
      id: 'suggestions',
      title: 'Smart Suggestions',
      icon: Sparkles,
      path: '/recommendations',
      info: 'Use your leftovers for a creative meal tonight.',
      smartData: { value: 90, label: 'Optimization: High' },
      action: 'Explore recipe',
      color: '#064e3b'
    },
    {
      id: 'shopping',
      title: 'Shopping List',
      icon: ShoppingCart,
      path: '/shoppinglist',
      info: insights.shopping.info,
      smartData: { value: insights.shopping.percent, label: insights.shopping.label },
      action: 'Open list',
      color: '#10b981'
    },
    {
      id: 'recipes',
      title: 'Recipe Repository',
      icon: BookOpen,
      path: '/recipes',
      info: insights.recipes.info,
      smartData: { value: Math.round(insights.recipes.percent), label: insights.recipes.label },
      action: 'Browse all',
      color: '#059669'
    },
    {
      id: 'leftovers',
      title: 'Leftover Tracker',
      icon: ChefHat,
      path: '/leftovers',
      info: insights.leftovers.info,
      smartData: { value: insights.leftovers.percent, label: insights.leftovers.label },
      action: 'Check leftovers',
      color: '#047857'
    },
    {
      id: 'profile',
      title: 'Your Growth',
      icon: TrendingUp,
      path: '/profile',
      info: 'Keep tracking your meals to unlock new kitchen levels.',
      smartData: { value: 50, label: 'Level 4 Foodie' },
      action: 'My stats',
      color: '#064e3b'
    }
  ];

  if (loading) {
    return (
      <div style={s.loadingContainer}>
        <Loader2 className="animate-spin" size={48} />
      </div>
    );
  }

  return (
    <div style={s.container}>
      {/* ── Smart Hero Section ── */}
      <div style={s.heroSection}>
        {/* Decorative Background Icons */}
        <UtensilsCrossed size={240} style={{ ...s.heroBgIcon, top: '20px', left: '20px', transform: 'rotate(-15deg)' }} />
        <ChefHat size={240} style={{ ...s.heroBgIcon, top: '30px', right: '120px', transform: 'rotate(10deg)' }} />
        <Flame size={240} style={{ ...s.heroBgIcon, top: '40%', right: '15%', transform: 'rotate(20deg)' }} />
        <Leaf size={240} style={{ ...s.heroBgIcon, bottom: '30%', left: '10%', transform: 'rotate(-10deg)' }} />

        <div style={s.heroBadge}>
          <Zap size={14} fill="currentColor" /> The #1 Kitchen Intelligence Platform
        </div>
        
        <h1 style={s.gradientTitle} className="premium-gradient-text">Find Your Next Favorite Recipe In SmartMeal</h1>
        <div style={{ padding: '0 1rem' }}>
          <p style={s.subtitle}>
            SmartRecipe connects your ingredients with AI-powered inspiration. <br />
            Save time, reduce waste, and cook like a professional.
          </p>
        </div>

        {/* Search Bar Integration */}
        <div style={s.searchBox}>
          <Search style={s.searchIcon} size={24} />
          <input 
            type="text" 
            placeholder="Search for recipes, ingredients, or meal types..." 
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            onKeyDown={handleSearch}
            style={{
              ...s.searchInput,
              background: isDarkMode ? 'rgba(255, 255, 255, 0.05)' : 'white',
              color: isDarkMode ? 'white' : '#012a1e',
              border: isDarkMode ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid rgba(16, 185, 129, 0.3)',
              boxShadow: isDarkMode ? '0 10px 40px rgba(0, 0, 0, 0.4)' : '0 20px 50px rgba(16, 185, 129, 0.25)',
              borderBottom: !isDarkMode ? '4px solid var(--primary)' : '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '20px',
            }}
            onFocus={e => {
              e.currentTarget.style.borderColor = 'rgba(16, 185, 129, 0.6)';
              e.currentTarget.style.boxShadow = isDarkMode 
                ? '0 0 40px rgba(16, 185, 129, 0.3)' 
                : '0 0 60px rgba(16, 185, 129, 0.4)';
              if (!isDarkMode) e.currentTarget.style.background = 'white';
            }}
            onBlur={e => {
              e.currentTarget.style.borderColor = isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(16, 185, 129, 0.3)';
              e.currentTarget.style.boxShadow = isDarkMode ? '0 10px 40px rgba(0, 0, 0, 0.4)' : '0 20px 50px rgba(16, 185, 129, 0.25)';
              if (!isDarkMode) e.currentTarget.style.background = 'white';
            }}
          />
        </div>
      </div>

      {/* ── Welcome Header & Quick Stats ── */}
      <div style={s.welcomeRow}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 800, margin: 0, color: 'var(--text-main)' }}>Welcome back, {displayName} 👋</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '1rem', fontWeight: 500, opacity: 0.8 }}>Here's your smart kitchen summary for today.</p>
        </div>

        <div style={s.statsMini}>
          <div style={s.statBadge}><TrendingUp size={14} /> {stats.recipes.length} recipes saved</div>
          <div style={s.statBadge}><ShoppingCart size={14} /> {stats.shopping?.pending || 0} items to buy</div>
          <div style={{ ...s.statBadge, background: 'rgba(16, 185, 129, 0.1)', borderColor: 'rgba(16, 185, 129, 0.2)' }}>
            <BarChart2 size={14} /> ${stats.budget?.total_spent || 0} spent
          </div>
        </div>
      </div>

      {/* ── Unified Smart Widget Grid ── */}
      <div style={s.smartGrid}>
        {widgets.map((w, i) => (
          <Link
            key={w.id}
            to={w.path}
            style={{
              ...s.widget,
              animation: `slideUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) ${i * 0.05}s forwards`,
              opacity: 0,
            }}
            onMouseEnter={e => {
              e.currentTarget.style.transform = 'translateY(-10px) scale(1.02)';
              e.currentTarget.style.boxShadow = '0 20px 40px rgba(0,0,0,0.12)';
              e.currentTarget.style.borderColor = 'rgba(16,185,129,0.4)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.transform = 'translateY(0) scale(1)';
              e.currentTarget.style.boxShadow = 'var(--shadow-md)';
              e.currentTarget.style.borderColor = 'var(--card-border)';
            }}
          >
            <div style={s.widgetHeader}>
              <div style={{ ...s.iconBox, background: `${w.color}15`, color: w.color }}>
                <w.icon size={24} />
              </div>
              <div style={{ ...s.statusDot, background: w.color }} />
            </div>

            <div style={s.contentBox}>
              <h3 style={s.widgetTitle}>{w.title}</h3>
              <p style={s.widgetInfo}>{w.info}</p>
            </div>

            <div style={s.dataViz}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '0.25rem' }}>
                <span>{w.smartData?.label || w.label}</span>
                <span>{w.smartData?.value || w.value}%</span>
              </div>
              <div style={s.progressBarContainer}>
                <div style={{ ...s.progressBar, width: `${w.smartData?.value || w.value || 0}%`, background: `linear-gradient(90deg, ${w.color}cc, ${w.color})` }} />
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: w.color, fontWeight: 700, fontSize: '0.85rem', marginTop: '0.25rem' }}>
              {w.action} <ArrowRight size={14} />
            </div>
          </Link>
        ))}
      </div>

      {/* ── Toast ── */}
      {toast && (
        <div style={{
          position: 'fixed', bottom: '2rem', right: '2rem', background: 'var(--primary)',
          color: 'white', padding: '1rem 2rem', borderRadius: '100px', fontWeight: 600,
          zIndex: 1000, boxShadow: 'var(--shadow-lg)', animation: 'slideUp 0.4s ease'
        }}>
          {toast}
        </div>
      )}
    </div>
  );
}

export default Dashboard;
