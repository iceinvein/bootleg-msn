# Project Structure

## Root Directory

- `src/` - Frontend React application
- `convex/` - Backend Convex functions and schema
- `dist/` - Build output directory
- Configuration files at root level

## Frontend Structure (`src/`)

```
src/
├── App.tsx                 # Main app component with auth routing
├── main.tsx               # React app entry point
├── index.css              # Global styles
├── components/            # React components
│   ├── MessengerApp.tsx   # Main messenger interface
│   ├── ChatWindow.tsx     # Individual chat interface
│   ├── ContactList.tsx    # Contact management
│   ├── *Modal.tsx         # Modal dialogs
│   └── ...
├── hooks/                 # Custom React hooks
├── lib/                   # Utility libraries
├── utils/                 # Helper functions
└── vite-env.d.ts         # Vite type definitions
```

## Backend Structure (`convex/`)

```
convex/
├── schema.ts              # Database schema definition
├── auth.config.ts         # Authentication configuration
├── auth.ts               # Auth-related functions
├── messages.ts           # Message operations
├── contacts.ts           # Contact management
├── groups.ts             # Group chat functionality
├── userStatus.ts         # User status management
├── files.ts              # File upload/download
├── http.ts               # HTTP endpoints
├── router.ts             # Custom HTTP routes
└── _generated/           # Auto-generated Convex files
```

## Component Organization

- **Modals**: All modal components end with `Modal.tsx`
- **Main Components**: Core app functionality (MessengerApp, ChatWindow, etc.)
- **Form Components**: Authentication and input forms
- **Utility Components**: Reusable UI elements

## File Naming Conventions

- React components: PascalCase (e.g., `ChatWindow.tsx`)
- Convex functions: camelCase (e.g., `messages.ts`)
- Utilities: camelCase (e.g., `emojiUtils.ts`)
- Configuration: lowercase with dots (e.g., `vite.config.ts`)

## Import Patterns

- Use `@/` alias for src imports
- Convex imports use relative paths
- External libraries imported at top of file
