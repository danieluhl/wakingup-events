# AGENTS.md - WakingUp Events Project

## Project Overview
This is a TanStack Start application for the WakingUp Events project, deployed on Cloudflare Workers with D1 database and Better Auth for authentication.

## Product Reference
Use the Excalidraw MCP to connect to the shared **Waking Up Events Excalidraw**. Review it for business requirements and existing diagrams, and use it to draw new diagrams when visualizing product flows or technical designs would be useful. There are no local Excalidraw files in this repository.

## Product Voice and Vocabulary
The site helps people discover meditation events that support insight, deeper understanding, self-exploration, and meaningful connection. Write in a grounded, warm, spacious, and invitational voice. Prefer clear language over mystical or promotional language, and describe what an event offers without promising healing, awakening, or transformation.

Use the following vocabulary as a source for page titles, descriptions, labels, calls to action, and generated event copy. Vary the language naturally rather than placing several contemplative terms in one sentence.

### Meditation and Inner Exploration
1. **Awareness** - conscious recognition of present experience
2. **Attention** - steady, intentional focus
3. **Presence** - being fully here with what is happening
4. **Mindfulness** - present-moment awareness without judgment
5. **Stillness** - quiet in body, mind, or environment
6. **Silence** - space for listening and direct experience
7. **Breath** - a natural anchor for attention
8. **Grounding** - returning attention to the body and immediate experience
9. **Centering** - settling into a steady inner orientation
10. **Noticing** - gently recognizing thoughts, feelings, and sensations
11. **Observation** - seeing experience clearly without immediately reacting
12. **Contemplation** - sustained consideration of a meaningful question
13. **Reflection** - looking back or inward with care
14. **Introspection** - examining one's inner experience
15. **Inquiry** - exploring experience with openness and curiosity
16. **Insight** - clear understanding arising from observation or inquiry
17. **Clarity** - seeing experience or intention more distinctly
18. **Discernment** - recognizing meaningful distinctions with care
19. **Equanimity** - balanced presence amid pleasant and difficult experience
20. **Acceptance** - allowing experience to be present as it is
21. **Nonjudgment** - meeting experience without immediately labeling it good or bad
22. **Openness** - willingness to encounter experience without a fixed conclusion
23. **Curiosity** - a gentle interest in what can be discovered
24. **Compassion** - caring awareness of suffering and difficulty
25. **Self-compassion** - relating to oneself with patience and kindness
26. **Loving-kindness** - cultivating goodwill toward oneself and others
27. **Empathy** - understanding and relating to another person's experience
28. **Patience** - allowing practice and understanding to unfold over time
29. **Gratitude** - recognizing and appreciating what is present
30. **Wisdom** - understanding that informs how one lives and relates

### Events and Shared Practice
31. **Gathering** - a welcoming occasion for people to come together
32. **Circle** - a participatory and relational group format
33. **Community** - people connected by shared practice or intention
34. **Connection** - meaningful contact with oneself and others
35. **Belonging** - feeling accepted and included within a group
36. **Companionship** - supportive presence along a shared path
37. **Sangha** - a Buddhist community of practice; use only when the event identifies itself this way
38. **Practice** - an activity repeated to cultivate awareness or understanding
39. **Sitting** - a period of seated meditation
40. **Session** - a defined period of guided or shared activity
41. **Retreat** - dedicated time away from ordinary routines for sustained practice
42. **Workshop** - an interactive event focused on learning and participation
43. **Dialogue** - thoughtful exchange grounded in mutual attention
44. **Listening** - receiving another person or experience with care
45. **Sharing** - offering experience, questions, or understanding to a group
46. **Fellowship** - supportive association among people with common interests
47. **Facilitation** - guiding a group process with clarity and care
48. **Invitation** - an open, low-pressure welcome to participate
49. **Encounter** - a meaningful meeting with a person, idea, or experience
50. **Togetherness** - the felt quality of practicing or learning with others

Use Buddhist or tradition-specific language, including **sangha** and **loving-kindness**, only when it accurately reflects the event or teacher. Do not imply that every meditation event is religious. Avoid clichés such as "find your bliss," "raise your vibration," or "unlock your true self" unless they appear in organizer-provided copy.

## Tech Stack
- **Framework**: TanStack Start (React 19)
- **Styling**: Tailwind CSS v4 with Shadcn components
- **Database**: Cloudflare D1 (SQLite) with Drizzle ORM
- **Auth**: Better Auth with email/password
- **Deployment**: Cloudflare Workers
- **Package Manager**: pnpm
- **Linting**: Biome

## Development Commands
```bash
# Start development server
pnpm run dev

# Build for production
pnpm run build

# Lint and format
pnpm run lint
pnpm run format
pnpm run check

# Deploy to Cloudflare
pnpm run deploy

# Database operations
pnpm run db:generate    # Generate migrations
pnpm run db:migrate     # Run migrations
pnpm run db:push        # Push schema changes
pnpm run db:studio      # Open Drizzle Studio

# Add Shadcn components
pnpm dlx shadcn@latest add [component-name]
```

## Project Structure
```
src/
├── components/          # React components
├── db/                  # Database schema and queries
│   ├── schema.ts        # Drizzle schema definitions
│   └── index.ts         # Database connection
├── lib/                 # Utility functions
│   ├── auth.ts          # Better Auth configuration
│   ├── auth-client.ts   # Client-side auth helpers
│   └── utils.ts         # General utilities
├── routes/              # TanStack Router file-based routes
│   ├── __root.tsx       # Root layout
│   ├── index.tsx        # Home page
│   ├── login.tsx        # Login page
│   └── api/             # API routes
├── integrations/        # Third-party integrations
├── env.ts               # Environment variables (T3Env)
├── router.tsx           # Router configuration
├── routeTree.gen.ts     # Auto-generated route tree
└── styles.css           # Global styles
```

## Key Configurations
- **Path Aliases**: `#/*` and `@/*` map to `./src/*`
- **Environment Variables**: Use T3Env with `src/env.ts`
- **Database**: Cloudflare D1 with Drizzle ORM
- **Auth**: Better Auth with email/password enabled

## Coding Guidelines
1. Use TypeScript strict mode
2. Follow Biome formatting (tabs, double quotes)
3. Prefer Shadcn components over native HTML elements
4. Minimize Tailwind classes in pages and components; keep utility styles inside Shadcn components
5. Keep components in `src/components/`
6. Use file-based routing in `src/routes/`
7. Database queries go in `src/db/`
8. Auth configuration in `src/lib/auth.ts`
9. Avoid abstraction where it's not completely necessary; prefer duplicating code over early abstraction

## Cloudflare Specific
- Uses `cloudflare:workers` for environment access
- D1 database binding: `DB`
- Deploy with `pnpm run deploy`
- Set secrets with `wrangler secret put SECRET_NAME`

## Common Patterns
- Server functions: Use `createServerFn` from TanStack Start
- Data loading: Use route `loader` functions
- State management: TanStack Query for server state
- Forms: React Hook Form with Zod validation
