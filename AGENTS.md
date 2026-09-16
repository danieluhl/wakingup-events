# AGENTS.md - WakingUp Events Project

## Project Overview
This is a TanStack Start application for the WakingUp Events project, deployed on Cloudflare Workers with D1 database and Better Auth for authentication.

## Product Reference
Use the Excalidraw MCP to connect to the shared **Waking Up Events Excalidraw**. Review it for business requirements and existing diagrams, and use it to draw new diagrams when visualizing product flows or technical designs would be useful. There are no local Excalidraw files in this repository.

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
