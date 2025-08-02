# Technology Stack

## Frontend
- **React 19** with TypeScript
- **Vite** as build tool and dev server
- **Tailwind CSS** for styling with custom theme
- **Sonner** for toast notifications
- **clsx** and **tailwind-merge** for conditional styling

## Backend
- **Convex** as full-stack backend platform
- **Convex Auth** for authentication
- **Resend** for email services
- Real-time subscriptions and mutations

## Development Tools
- **TypeScript** with strict configuration
- **ESLint** with React hooks plugin
- **Prettier** for code formatting
- **npm-run-all** for parallel script execution

## Build System

### Common Commands
```bash
# Start development (frontend + backend)
npm run dev

# Start only frontend
npm run dev:frontend

# Start only backend  
npm run dev:backend

# Build for production
npm run build

# Lint and type check
npm run lint
```

## Configuration
- **Path aliases**: `@/*` maps to `./src/*`
- **Tailwind JIT mode** with custom purge configuration
- **PostCSS** with autoprefixer
- **Convex deployment**: Connected to `superb-seal-735`

## Code Style
- Use TypeScript strict mode
- Prefer functional components with hooks
- Use Tailwind utility classes over custom CSS
- Follow React 19 patterns and best practices