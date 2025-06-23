# Plico - AI Assistant Context Guide

## Project Overview
Plico is a real-time polling application built with Next.js 14, TypeScript, and Supabase. The core value proposition is "Stop arguing. Just send a Plico." - enabling quick, anonymous group decision-making without authentication friction.

## Tech Stack
- **Frontend**: Next.js 14 (App Router), React, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes, Supabase (PostgreSQL + Realtime)
- **ORM**: Prisma
- **Animation**: Framer Motion, Three.js (for backgrounds)
- **State**: React hooks, Supabase Realtime subscriptions
- **Styling**: Tailwind CSS with dark mode support
- **Deployment**: Vercel (assumed based on analytics)

## Key Features & Business Logic

### Poll Creation Flow
1. User creates poll on home page (no auth required)
2. Creator receives special double-cookie authentication (creator key + admin key)
3. Redirected to share page to distribute poll link
4. Only creator can finalize results (for non-timed polls)

### Voting Mechanics
- Anonymous voting (no user accounts)
- One vote per browser (cookie-based)
- Real-time vote updates via Supabase subscriptions
- Fallback to polling if WebSocket fails
- Optimistic UI updates with rollback on failure

### Poll Types
1. **Timed Polls**: Auto-finalize when timer expires
2. **Manual Polls**: Creator must finalize
3. **Tie Handling**: Random tie-breaker animations (4 variants)

## Critical Security Measures

### Rate Limiting
- Poll creation: 5 polls per minute per IP
- Located in `/lib/rate-limiter.ts`
- Implemented on `/api/plico` POST endpoint

### CSRF Protection
- Custom CSRF token implementation in `/lib/csrf.ts` and `/lib/csrf-client.ts`
- Required for all state-changing operations

### Cookie Security
- Double-cookie pattern for creator authentication
- HTTP-only cookies for sensitive data
- Secure flag in production

## Project Structure
```
/app                    # Next.js 14 app directory
  /(pages)             # Page routes with (parentheses) for organization
    /poll/[id]         # Poll viewing/voting page
      /share           # Share page after poll creation
  /api                 # API routes
    /plico            # Poll CRUD operations
      /[id]           # Poll-specific operations
        /vote         # Vote submission
        /finalize     # Manual finalization
        /auto-finalize # Timer-based finalization
/components
  /plico              # Poll-specific components
  /reactbits          # Fancy animations (Hyperspeed, Iridescence, etc.)
  /ui                 # Reusable UI components
/lib                  # Utilities and configurations
  /supabase           # Supabase client and realtime manager
/hooks                # Custom React hooks
/prisma               # Database schema and migrations
```

## Important Patterns & Conventions

### Component Patterns
- Use `memo` for performance optimization on frequently rendered components
- Implement `useReducedMotion` for accessibility
- Always clean up timers/intervals in useEffect return functions
- Handle both light and dark themes in all components

### Animation Guidelines
- Check `prefers-reduced-motion` and disable animations accordingly
- Use Framer Motion's `AnimatePresence` for exit animations
- Clean up Three.js resources in dispose() methods
- Keep shiny text animation at 8s duration with 3s pause

### Real-time Updates
- Primary: Supabase Realtime subscriptions
- Fallback: HTTP polling every 3 seconds
- Always implement both patterns for reliability
- Handle connection state in UI

### Error Handling
- Show user-friendly error messages
- Implement rollback for optimistic updates
- Log errors for debugging but don't expose internals

## Common Tasks

### Running Development Server
```bash
npm run dev
```

### Testing Changes
- Hard refresh browser (Cmd+Shift+R) for cache issues
- Check both light and dark themes
- Test with DevTools network throttling for real-time fallback
- Verify mobile responsive design

### Before Committing
1. Run linting: `npm run lint`
2. Run type checking: `npm run typecheck`
3. Test rate limiting isn't too restrictive
4. Verify animations work with reduced motion preference
5. Check for memory leaks in animation components

## Known Gotchas

1. **Safari WebSocket Issues**: Special handling in `/lib/supabase/safari-websocket-fixes.ts`
2. **Cookie Parsing**: Some cookies are prefixed with `j:` (JSON stringified)
3. **Timer Precision**: Polls may close a few seconds early/late due to client-server time differences
4. **Animation Performance**: Three.js backgrounds can be CPU-intensive on older devices

## Database Schema (Key Tables)
- **Plico**: Main poll table (id, question, finalized, closesAt, etc.)
- **Option**: Poll options (id, text, voteCount, plicoId)
- **Vote**: Individual votes (id, optionId, ipAddress, userAgent)

## Environment Variables
```
DATABASE_URL          # Prisma database connection
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
NEXT_PUBLIC_BASE_URL  # For absolute URLs
```

## Testing Approach
- Manual testing for UI/UX flows
- Focus on real-time synchronization testing
- Test with multiple browsers/tabs for vote updates
- Verify rate limiting works across different IPs

## Performance Considerations
- Optimistic updates for instant feedback
- Debounced real-time subscriptions
- Lazy load heavy components (confetti, animations)
- Use `dynamic` imports for Three.js components

## Accessibility Checklist
- ✅ ARIA labels on interactive elements
- ✅ Keyboard navigation support
- ✅ Screen reader announcements for vote updates
- ✅ Respects prefers-reduced-motion
- ✅ Sufficient color contrast ratios
- ✅ Focus indicators visible

## When Making Changes
1. **Adding new animations**: Always include reduced motion checks
2. **Modifying voting logic**: Test the rollback mechanism
3. **Changing real-time code**: Verify the polling fallback works
4. **Updating styles**: Check both themes
5. **Adding API endpoints**: Implement rate limiting if needed

## Recent Updates (as of last session)
- Added dramatic winner reveal animations
- Implemented tie-breaker for equal votes
- Fixed memory leaks in animation components
- Added comprehensive rate limiting
- Improved accessibility across all components
- Slowed down shiny text animations (8s duration, 3s pause)

Remember: The app should feel magical but remain accessible and performant. Every interaction should be instant, smooth, and delightful.