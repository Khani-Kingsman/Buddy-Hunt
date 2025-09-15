# Buddy Hunt - UI/UX Design System

## Visual Identity

### Brand Colors
```css
:root {
  /* Primary Colors */
  --color-primary-50: #f0f9ff;
  --color-primary-100: #e0f2fe;
  --color-primary-200: #bae6fd;
  --color-primary-300: #7dd3fc;
  --color-primary-400: #38bdf8;
  --color-primary-500: #0ea5e9;  /* Main brand */
  --color-primary-600: #0284c7;
  --color-primary-700: #0369a1;
  --color-primary-800: #075985;
  --color-primary-900: #0c4a6e;

  /* Secondary Colors - Purple */
  --color-secondary-50: #faf5ff;
  --color-secondary-100: #f3e8ff;
  --color-secondary-200: #e9d5ff;
  --color-secondary-300: #d8b4fe;
  --color-secondary-400: #c084fc;
  --color-secondary-500: #a855f7;  /* Secondary brand */
  --color-secondary-600: #9333ea;
  --color-secondary-700: #7c3aed;
  --color-secondary-800: #6b21a8;
  --color-secondary-900: #581c87;

  /* Accent Colors - Orange */
  --color-accent-50: #fff7ed;
  --color-accent-100: #ffedd5;
  --color-accent-200: #fed7aa;
  --color-accent-300: #fdba74;
  --color-accent-400: #fb923c;
  --color-accent-500: #f97316;  /* Accent */
  --color-accent-600: #ea580c;
  --color-accent-700: #c2410c;
  --color-accent-800: #9a3412;
  --color-accent-900: #7c2d12;

  /* Success Colors */
  --color-success-50: #f0fdf4;
  --color-success-500: #22c55e;
  --color-success-700: #15803d;

  /* Warning Colors */
  --color-warning-50: #fffbeb;
  --color-warning-500: #f59e0b;
  --color-warning-700: #b45309;

  /* Error Colors */
  --color-error-50: #fef2f2;
  --color-error-500: #ef4444;
  --color-error-700: #b91c1c;

  /* Neutral Colors */
  --color-neutral-50: #fafafa;
  --color-neutral-100: #f5f5f5;
  --color-neutral-200: #e5e5e5;
  --color-neutral-300: #d4d4d4;
  --color-neutral-400: #a3a3a3;
  --color-neutral-500: #737373;
  --color-neutral-600: #525252;
  --color-neutral-700: #404040;
  --color-neutral-800: #262626;
  --color-neutral-900: #171717;
}
```

### Typography
```css
/* Font Family */
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');

:root {
  --font-primary: 'Inter', system-ui, -apple-system, sans-serif;
  
  /* Font Sizes */
  --text-xs: 0.75rem;    /* 12px */
  --text-sm: 0.875rem;   /* 14px */
  --text-base: 1rem;     /* 16px */
  --text-lg: 1.125rem;   /* 18px */
  --text-xl: 1.25rem;    /* 20px */
  --text-2xl: 1.5rem;    /* 24px */
  --text-3xl: 1.875rem;  /* 30px */
  --text-4xl: 2.25rem;   /* 36px */
  --text-5xl: 3rem;      /* 48px */

  /* Line Heights */
  --leading-tight: 1.2;
  --leading-normal: 1.5;
  --leading-relaxed: 1.75;

  /* Font Weights */
  --font-light: 300;
  --font-regular: 400;
  --font-medium: 500;
  --font-semibold: 600;
  --font-bold: 700;
}

/* Typography Classes */
.heading-1 {
  font-size: var(--text-5xl);
  font-weight: var(--font-bold);
  line-height: var(--leading-tight);
}

.heading-2 {
  font-size: var(--text-4xl);
  font-weight: var(--font-bold);
  line-height: var(--leading-tight);
}

.heading-3 {
  font-size: var(--text-3xl);
  font-weight: var(--font-semibold);
  line-height: var(--leading-tight);
}

.body-lg {
  font-size: var(--text-lg);
  line-height: var(--leading-normal);
}

.body-base {
  font-size: var(--text-base);
  line-height: var(--leading-normal);
}

.body-sm {
  font-size: var(--text-sm);
  line-height: var(--leading-normal);
}
```

### Spacing System
```css
:root {
  --space-0: 0;
  --space-1: 0.25rem;   /* 4px */
  --space-2: 0.5rem;    /* 8px */
  --space-3: 0.75rem;   /* 12px */
  --space-4: 1rem;      /* 16px */
  --space-5: 1.25rem;   /* 20px */
  --space-6: 1.5rem;    /* 24px */
  --space-8: 2rem;      /* 32px */
  --space-10: 2.5rem;   /* 40px */
  --space-12: 3rem;     /* 48px */
  --space-16: 4rem;     /* 64px */
  --space-20: 5rem;     /* 80px */
  --space-24: 6rem;     /* 96px */
}
```

## Component Library

### Button Component
```typescript
// components/ui/Button.tsx
import React from 'react';
import { cn } from '@/lib/utils';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ 
    className, 
    variant = 'primary', 
    size = 'md', 
    isLoading = false,
    leftIcon,
    rightIcon,
    children, 
    ...props 
  }, ref) => {
    const baseClasses = 'inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none';
    
    const variants = {
      primary: 'bg-primary-500 hover:bg-primary-600 text-white shadow-sm hover:shadow-md focus:ring-primary-500',
      secondary: 'bg-secondary-500 hover:bg-secondary-600 text-white shadow-sm hover:shadow-md focus:ring-secondary-500',
      outline: 'border border-neutral-300 bg-white hover:bg-neutral-50 text-neutral-700 focus:ring-primary-500',
      ghost: 'hover:bg-neutral-100 text-neutral-700 focus:ring-primary-500',
      danger: 'bg-error-500 hover:bg-error-600 text-white shadow-sm hover:shadow-md focus:ring-error-500',
    };

    const sizes = {
      sm: 'h-8 px-3 text-sm',
      md: 'h-10 px-4 text-base',
      lg: 'h-12 px-6 text-lg',
      xl: 'h-14 px-8 text-xl',
    };

    return (
      <button
        className={cn(
          baseClasses,
          variants[variant],
          sizes[size],
          isLoading && 'opacity-50 pointer-events-none',
          className
        )}
        ref={ref}
        {...props}
      >
        {isLoading ? (
          <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
        ) : (
          <>
            {leftIcon}
            {children}
            {rightIcon}
          </>
        )}
      </button>
    );
  }
);

export { Button };
```

### Input Component
```typescript
// components/ui/Input.tsx
import React from 'react';
import { cn } from '@/lib/utils';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, label, error, hint, leftIcon, rightIcon, ...props }, ref) => {
    const id = React.useId();

    return (
      <div className="space-y-2">
        {label && (
          <label htmlFor={id} className="block text-sm font-medium text-neutral-700">
            {label}
          </label>
        )}
        <div className="relative">
          {leftIcon && (
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <div className="h-5 w-5 text-neutral-400">{leftIcon}</div>
            </div>
          )}
          <input
            type={type}
            id={id}
            className={cn(
              'block w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm placeholder-neutral-400 shadow-sm transition-colors',
              'focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500',
              'disabled:cursor-not-allowed disabled:bg-neutral-50 disabled:text-neutral-500',
              error && 'border-error-300 focus:border-error-500 focus:ring-error-500',
              leftIcon && 'pl-10',
              rightIcon && 'pr-10',
              className
            )}
            ref={ref}
            {...props}
          />
          {rightIcon && (
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
              <div className="h-5 w-5 text-neutral-400">{rightIcon}</div>
            </div>
          )}
        </div>
        {error && <p className="text-sm text-error-600">{error}</p>}
        {hint && !error && <p className="text-sm text-neutral-500">{hint}</p>}
      </div>
    );
  }
);

export { Input };
```

## Screen Wireframes

### 1. Authentication Screens

#### Login Screen
```
┌─────────────────────────────────────┐
│ [LOGO] Buddy Hunt                   │
│                                     │
│        Welcome Back                 │
│      Sign in to continue            │
│                                     │
│ Email    [________________]         │
│ Password [________________] [👁]     │
│                                     │
│ [Forgot Password?]                  │
│                                     │
│ [    Sign In    ]                   │
│                                     │
│     ── or sign in with ──           │
│                                     │
│ [Google] [Facebook] [Apple]         │
│                                     │
│ Don't have an account? [Sign Up]    │
└─────────────────────────────────────┘
```

#### Registration Screen
```
┌─────────────────────────────────────┐
│ [LOGO] Buddy Hunt                   │
│                                     │
│       Create Account                │
│     Join the community              │
│                                     │
│ Username    [________________]      │
│ Display Name[________________]      │
│ Email       [________________]      │
│ Password    [________________] [👁] │
│ Confirm Pass[________________] [👁] │
│                                     │
│ [✓] I agree to Terms & Privacy      │
│                                     │
│ [    Create Account    ]            │
│                                     │
│ Already have account? [Sign In]     │
└─────────────────────────────────────┘
```

### 2. Main Dashboard
```
┌─────────────────────────────────────────────────────────────┐
│ [☰] Buddy Hunt    [🔍Search...]   [🔔] [@avatar] [⚙] [❌] │
├─────────────────────────────────────────────────────────────┤
│ SIDEBAR           │                MAIN CONTENT             │
│                   │                                         │
│ 🎬 Cinemas        │  Featured Rooms                        │
│ 🏰 Mansions       │  ┌─────────────────────────────────┐    │
│ 💬 Messages       │  │ [🎬] Gaming Cinema              │    │
│ 👥 Friends        │  │ 🟢 142 viewers • Started 2h ago │    │
│ 🎭 Avatar World   │  │ Host: @streamer123              │    │
│ 💎 Store          │  └─────────────────────────────────┘    │
│                   │                                         │
│ RECENT ROOMS      │  ┌─────────────────────────────────┐    │
│ • Room Alpha      │  │ [🏰] Chill Lounge              │    │
│ • Study Group     │  │ 🟢 24 active • Music playing   │    │
│ • Movie Night     │  │ Host: @musiclover              │    │
│                   │  └─────────────────────────────────┘    │
│ FRIENDS ONLINE    │                                         │
│ 🟢 @alice         │  Quick Actions:                        │
│ 🟢 @bob           │  [Create Cinema] [Join Mansion]        │
│ 🟡 @charlie       │                                        │
└─────────────────────────────────────────────────────────────┘
```

### 3. Cinema Room (Streaming)
```
┌─────────────────────────────────────────────────────────────┐
│ [🎬] Gaming Cinema - Fortnite Stream    [⚙] [👥 142] [❌]   │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│              MAIN STREAM AREA                               │
│     ┌─────────────────────────────────────────┐             │
│     │                                         │             │
│     │        [SCREEN SHARE CONTENT]           │             │
│     │             1920x1080                   │             │
│     │                                         │             │
│     │     🔴 LIVE • 142 viewers • 4K         │             │
│     └─────────────────────────────────────────┘             │
│                                                             │
│ HOST CONTROLS:                                              │
│ [🎤OFF] [📷OFF] [🖥ON] [🎵] [💎] [⚙Settings]                │
│                                                             │
├─────────────────────────┬───────────────────────────────────┤
│ PARTICIPANT CAMERAS     │         CHAT                      │
│ ┌─────┐ ┌─────┐ ┌─────┐│ @user123: Amazing game! 🎮         │
│ │ 👤  │ │ 👤  │ │ 👤  ││ @viewer456: Nice shot!             │
│ │@usr1│ │@usr2│ │@usr3││ @fan789: [💎Diamond] Keep going!   │
│ └─────┘ └─────┘ └─────┘│                                    │
│                        │ [Type message...] [😊] [💎] [📤]   │
└─────────────────────────┴───────────────────────────────────┘
```

### 4. Mansion Room (Social)
```
┌─────────────────────────────────────────────────────────────┐
│ [🏰] Chill Lounge                      [⚙] [👥 24] [❌]    │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│              VIRTUAL ROOM SPACE                             │
│     ┌─────────────────────────────────────────┐             │
│     │    🪑     🪑   🎵♪♫   🪑     🪑        │             │
│     │      👤     👤        👤     👤       │             │
│     │   @alice  @bob      @charlie @diana   │             │
│     │                                       │             │
│     │         🎨 AVATAR INTERACTIONS        │             │
│     │    [Dance] [Wave] [Gift] [Emote]      │             │
│     └─────────────────────────────────────────┘             │
│                                                             │
│ VOICE CONTROLS:                                             │
│ [🎤ON] [🎧Adjust] [🎵Music Queue] [🎭Avatar] [💎Store]      │
│                                                             │
├─────────────────────────┬───────────────────────────────────┤
│ ROOM PARTICIPANTS       │         CHAT & ACTIVITY           │
│                         │                                   │
│ 🟢 @alice (Host)        │ 🎵 Now playing: Chill Beats      │
│ 🟢 @bob                 │ @alice: Welcome everyone! 😊      │
│ 🟢 @charlie             │ @bob sent @alice a [🌹Rose]       │
│ 🟡 @diana (Away)        │ @charlie is dancing 💃            │
│ 🔇 @eve (Muted)         │                                   │
│                         │ [Type message...] [😊] [💎] [📤]   │
│ [+ Invite Friends]      │                                   │
└─────────────────────────┴───────────────────────────────────┘
```

### 5. Direct Messages
```
┌─────────────────────────────────────────────────────────────┐
│ Messages                                  [🔍] [✏️] [⚙]     │
├─────────────────────────┬───────────────────────────────────┤
│ CONVERSATIONS           │ @alice                            │
│                         │ ⚬ Online • Last seen now          │
│ [🔵] @alice             ├───────────────────────────────────┤
│      Hey! How are you?  │                                   │
│      2 min ago          │ [🔒] End-to-end encrypted         │
│                         │                                   │
│ @bob                    │ Today 2:30 PM                    │
│      Thanks for the...  │ alice: Hey! How are you doing? 👋  │
│      1 hour ago         │                                   │
│                         │ Today 2:32 PM                    │
│ @charlie                │ You: Good! Just streaming 🎮       │
│      See you later!     │                                   │
│      Yesterday          │ Today 2:35 PM                    │
│                         │ alice: Cool! I'll join later      │
│ @diana                  │ alice: [💎Heart] 💖                │
│      Movie tonight?     │                                   │
│      2 days ago         │                                   │
│                         │ ┌─────────────────────────────┐   │
├─────────────────────────┤ │ [Type message...] [😊] [💎]  │   │
│ [🔐] Ephemeral Mode     │ │ [📷] [📁] [🎤] [⏰] [📤]      │   │
│ [👥] Group Messages     │ └─────────────────────────────┘   │
└─────────────────────────┴───────────────────────────────────┘
```

## Buddy Animation System

### Animation Specifications

#### Buddy Character Design
```typescript
// Buddy animation configuration
interface BuddyAnimationConfig {
  idle: {
    duration: 3000,      // 3 seconds
    frames: 60,          // 20 FPS
    loop: true,
    easing: 'ease-in-out'
  },
  greeting: {
    duration: 2000,      // 2 seconds  
    frames: 40,
    trigger: 'user-join',
    sequence: ['wave', 'bounce', 'smile']
  },
  celebration: {
    duration: 1500,      // 1.5 seconds
    frames: 45,
    trigger: 'gift-received',
    effects: ['confetti', 'sparkles']
  },
  sleeping: {
    duration: 4000,      // 4 seconds
    frames: 20,          // Slow animation
    trigger: 'user-away'
  }
}
```

#### Buddy State Transitions
```css
/* CSS Animations for Buddy */
@keyframes buddyIdle {
  0%, 100% { transform: translateY(0px) scale(1); }
  25% { transform: translateY(-2px) scale(1.02); }
  50% { transform: translateY(0px) scale(1); }
  75% { transform: translateY(-1px) scale(1.01); }
}

@keyframes buddyGreeting {
  0% { transform: rotate(0deg); }
  25% { transform: rotate(-10deg) translateY(-5px); }
  50% { transform: rotate(10deg) translateY(-8px); }
  75% { transform: rotate(-5deg) translateY(-3px); }
  100% { transform: rotate(0deg) translateY(0px); }
}

@keyframes buddyCelebration {
  0% { transform: scale(1) rotate(0deg); }
  25% { transform: scale(1.1) rotate(-5deg); }
  50% { transform: scale(1.2) rotate(5deg); }
  75% { transform: scale(1.1) rotate(-3deg); }
  100% { transform: scale(1) rotate(0deg); }
}

.buddy-character {
  width: 64px;
  height: 64px;
  animation: buddyIdle 3s ease-in-out infinite;
}

.buddy-character.greeting {
  animation: buddyGreeting 2s ease-in-out;
}

.buddy-character.celebrating {
  animation: buddyCelebration 1.5s ease-in-out;
}
```

## Responsive Design Breakpoints

```css
/* Breakpoint System */
:root {
  --breakpoint-sm: 640px;
  --breakpoint-md: 768px;
  --breakpoint-lg: 1024px;
  --breakpoint-xl: 1280px;
  --breakpoint-2xl: 1536px;
}

/* Mobile First Media Queries */
@media (min-width: 640px) {
  /* Small tablets */
}

@media (min-width: 768px) {
  /* Tablets */
  .sidebar {
    display: block;
    width: 280px;
  }
  
  .main-content {
    margin-left: 280px;
  }
}

@media (min-width: 1024px) {
  /* Desktop */
  .cinema-layout {
    grid-template-columns: 1fr 320px;
  }
  
  .participant-grid {
    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  }
}

@media (min-width: 1280px) {
  /* Large desktop */
  .cinema-stream {
    max-width: 1920px;
    aspect-ratio: 16/9;
  }
}
```

## Micro-interactions and Hover States

```css
/* Interactive Elements */
.button {
  transform: translateY(0);
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.button:hover {
  transform: translateY(-2px);
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15);
}

.button:active {
  transform: translateY(0);
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.15);
}

/* Card Hover Effects */
.room-card {
  transition: all 0.3s ease;
  border-radius: 12px;
  overflow: hidden;
}

.room-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
}

/* Gift Animation */
.gift-send-animation {
  animation: giftFlyOut 1.2s cubic-bezier(0.25, 0.46, 0.45, 0.94);
}

@keyframes giftFlyOut {
  0% {
    transform: scale(0) rotate(0deg);
    opacity: 0;
  }
  50% {
    transform: scale(1.2) rotate(180deg);
    opacity: 1;
  }
  100% {
    transform: scale(1) rotate(360deg) translateX(100px);
    opacity: 0;
  }
}

/* Typing Indicator */
.typing-indicator {
  display: flex;
  align-items: center;
  gap: 4px;
}

.typing-dot {
  width: 4px;
  height: 4px;
  border-radius: 50%;
  background: var(--color-neutral-400);
  animation: typingPulse 1.4s infinite;
}

.typing-dot:nth-child(2) {
  animation-delay: 0.2s;
}

.typing-dot:nth-child(3) {
  animation-delay: 0.4s;
}

@keyframes typingPulse {
  0%, 60%, 100% {
    transform: scale(1);
    opacity: 0.5;
  }
  30% {
    transform: scale(1.2);
    opacity: 1;
  }
}
```

## Accessibility Guidelines

### Focus Management
```css
/* Focus Styles */
*:focus {
  outline: 2px solid var(--color-primary-500);
  outline-offset: 2px;
}

.skip-link {
  position: absolute;
  top: -40px;
  left: 6px;
  background: var(--color-primary-500);
  color: white;
  padding: 8px;
  border-radius: 4px;
  text-decoration: none;
  z-index: 1000;
}

.skip-link:focus {
  top: 6px;
}
```

### ARIA Labels and Screen Reader Support
```typescript
// Accessibility utilities
const a11yLabels = {
  roomJoin: (roomName: string) => `Join ${roomName} room`,
  streamQuality: (quality: string) => `Stream quality: ${quality}`,
  participantCount: (count: number) => `${count} participants in room`,
  messageFrom: (user: string, time: string) => `Message from ${user} at ${time}`,
  giftSent: (gift: string, recipient: string) => `Sent ${gift} to ${recipient}`,
};

// Screen reader announcements
const announceToScreenReader = (message: string) => {
  const announcement = document.createElement('div');
  announcement.setAttribute('aria-live', 'polite');
  announcement.setAttribute('aria-atomic', 'true');
  announcement.className = 'sr-only';
  announcement.textContent = message;
  
  document.body.appendChild(announcement);
  setTimeout(() => document.body.removeChild(announcement), 1000);
};
```

This comprehensive design system provides the foundation for building a premium, accessible, and visually stunning social streaming platform that meets the high standards expected from modern applications.