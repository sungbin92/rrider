# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

rRider is a bicycle route planning application with AI-powered recommendations and Strava integration. It's a pnpm + Turbo monorepo with TypeScript throughout.

## Monorepo Structure

```
apps/
├── api/     # NestJS REST API (port 3001)
└── web/     # Next.js frontend (port 3000)
packages/
├── db/                   # Prisma database layer (PostgreSQL)
└── recommendation-core/  # AI prompt engineering and recommendation logic
```

## Common Commands

```bash
# Development
pnpm dev                              # Start all dev servers
pnpm --filter @apps/api start:dev     # API only with watch
pnpm --filter web dev                 # Web only

# Building
pnpm build                            # Build all packages

# Testing (API)
pnpm --filter @apps/api test          # Run unit tests
pnpm --filter @apps/api test:watch    # Watch mode
pnpm --filter @apps/api test:e2e      # E2E tests

# Code Quality
pnpm --filter @apps/api lint          # ESLint with auto-fix
pnpm --filter @apps/api format        # Prettier formatting

# Database
pnpm --filter @packages/db db:generate  # Generate Prisma client
pnpm --filter @packages/db db:push      # Apply schema to database
pnpm --filter @packages/db db:studio    # Open Prisma Studio GUI
```

## Architecture

### API (`apps/api/`)
- **Framework**: NestJS 11 with Express
- **Pattern**: Controller → Service → PrismaClient with dependency injection
- **Auth**: JWT-based with global JwtAuthGuard
- **Key modules**: AuthModule (JWT + Strava OAuth), PlanModule, RouteModule, PlaceModule, RecommendationModule, SegmentModule

### Web (`apps/web/`)
- **Framework**: Next.js 16 with App Router and React 19
- **Maps**: Leaflet + React Leaflet, Mapbox GL
- **Styling**: Tailwind CSS 4

### Database (`packages/db/`)
- **ORM**: Prisma with PostgreSQL
- **Models**: User, Plan, Route, Place, Recommendation, Segment, StravaToken
- **Generated client**: `prisma/generated/`

### Recommendation Core (`packages/recommendation-core/`)
- Shared AI prompt engineering logic
- Exports `recommendFlow()` and `routeRecommendFlow()` functions
- Used by API's recommendation service with pluggable AI clients

## External Integrations

- **GraphHopper**: Route calculation (`apps/api/src/graphhopper/`)
- **Strava API**: Segment exploration with OAuth token management
- **Google Places API**: Place search near routes
- **AI Providers**: Groq (primary), OpenAI, Gemini - all implement common `AiClient` interface

## Code Conventions

- **Package manager**: pnpm only
- **Module type**: ESM (`"type": "module"`)
- **Package naming**: `@apps/*`, `@packages/*`
- **Test files**: `*.spec.ts` alongside source files
- **TypeScript**: Strict mode, decorators enabled for NestJS
