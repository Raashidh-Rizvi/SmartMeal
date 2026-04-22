import React, { useState } from 'react';
import { getPasswordStrength } from '../utils/passwordValidation';

/* ─── Eye Icons ─────────────────────────────────────────────────────────── */
const EyeOpen = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
    <circle cx="12" cy="12" r="3"/>
  </svg>
);

const EyeClosed = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
    <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
    <line x1="1" y1="1" x2="23" y2="23"/>
  </svg>
);

/* ─── Strength Config ─────────────────────────────────────────────────────── */
const STRENGTH_LEVELS = [
  { max: 20,  label: 'Very Weak', color: '#ef4444', segments: 1 },
  { max: 40,  label: 'Weak',      color: '#f97316', segments: 2 },
  { max: 60,  label: 'Fair',      color: '#f59e0b', segments: 3 },
  { max: 80,  label: 'Strong',    color: '#3b82f6', segments: 4 },
  { max: 101, label: 'Very Strong', color: '#10b981', segments: 5 },
];

function getLevel(strength) {
  return STRENGTH_LEVELS.find(l => strength < l.max) || STRENGTH_LEVELS[4];
}

/* ─── Policy Rules ────────────────────────────────────────────────────────── */
const RULES = [
  { label: 'At least 12 characters',          test: p => p.length >= 12 },
  { label: 'At most 64 characters',           test: p => p.length <= 64 },
  { label: 'One uppercase letter (A–Z)',       test: p => /[A-Z]/.test(p) },
  { label: 'One lowercase letter (a–z)',       test: p => /[a-z]/.test(p) },
  { label: 'One number (0–9)',                 test: p => /\d/.test(p) },
  { label: 'One special character (!@#$%…)',   test: p => /[!@#$%^&*(),.?":{}|<>]/.test(p) },
];

/* ═══════════════════════════════════════════════════════════════════════════
   PasswordInput — a fully self-contained premium password field
   Props:
     id          – unique id for the <input>
     label       – field label text
     value       – controlled value
     onChange    – (e) => void
     placeholder – placeholder text
     error       – inline error string (optional)
     showStrength – show the 5-segment bar + policy checklist (default false)
     showMatch   – show "passwords match" indicator (compared to matchValue)
     matchValue  – the value to compare against when showMatch=true
     userData    – { name, email } for policy check (optional)
     required    – html required attr (default true)
   ══════════════════════════════════════════════════════════════════════════ */
export default function PasswordInput({
  id,
  label,
  value,
  onChange,
  placeholder = 'Enter password',
  error,
  showStrength = false,
  showMatch = false,
  matchValue = '',
  required = true,
}) {
  const [visible, setVisible] = useState(false);

  const strength = getPasswordStrength(value);
  const level    = getLevel(strength);

  const matchOk  = showMatch && value.length > 0 && value === matchValue;

  return (
    <div className="pw-field">
      {/* Label */}
      <label htmlFor={id} className="pw-label">{label}</label>

      {/* Input wrapper */}
      <div className="pw-input-wrap">
        <input
          id={id}
          type={visible ? 'text' : 'password'}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          required={required}
          autoComplete="new-password"
          className={`pw-input${error ? ' pw-input--error' : ''}`}
        />
        <button
          type="button"
          className="pw-eye"
          onClick={() => setVisible(v => !v)}
          aria-label={visible ? 'Hide password' : 'Show password'}
          tabIndex={-1}
        >
          {visible ? <EyeClosed /> : <EyeOpen />}
        </button>
      </div>

      {/* Error */}
      {error && <span className="pw-error-text">{error}</span>}

      {/* Strength bar — only when showStrength and user has typed */}
      {showStrength && value && (
        <div className="pw-strength">
          {/* 5-segment bar */}
          <div className="pw-segments">
            {[1,2,3,4,5].map(n => (
              <div
                key={n}
                className="pw-segment"
                style={{
                  background: n <= level.segments ? level.color : 'var(--pw-track)',
                  transform: n <= level.segments ? 'scaleY(1)' : 'scaleY(0.6)',
                }}
              />
            ))}
          </div>
          <span className="pw-strength-label" style={{ color: level.color }}>
            {level.label}
          </span>
        </div>
      )}

      {/* Policy checklist — only when showStrength and user has typed */}
      {showStrength && value && (
        <ul className="pw-rules">
          {RULES.map(r => {
            const pass = r.test(value);
            return (
              <li key={r.label} className={`pw-rule ${pass ? 'pw-rule--pass' : 'pw-rule--fail'}`}>
                <span className="pw-rule-icon">{pass ? '✓' : '✗'}</span>
                {r.label}
              </li>
            );
          })}
        </ul>
      )}

      {/* Match indicator */}
      {showMatch && value && (
        <span className={`pw-match ${matchOk ? 'pw-match--ok' : 'pw-match--bad'}`}>
          {matchOk ? '✓ Passwords match' : '✗ Passwords do not match'}
        </span>
      )}
    </div>
  );
}
