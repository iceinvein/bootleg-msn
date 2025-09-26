# 💬 Bootleg MSN Messenger

A nostalgic real-time chat application that recreates the classic MSN Messenger experience with modern web technologies. Available as a **web app**, **desktop application** (Windows/macOS/Linux), and **mobile apps** (iOS/Android). Built with React 19, TypeScript, Tailwind CSS 4, and powered by Convex for real-time backend functionality.

![MSN Messenger Screenshot](https://img.shields.io/badge/Status-Active%20Development-green)
![React](https://img.shields.io/badge/React-19-blue)
![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue)
![Convex](https://img.shields.io/badge/Convex-Backend-purple)
![Tailwind](https://img.shields.io/badge/Tailwind-4.1-cyan)
![Tauri](https://img.shields.io/badge/Tauri-2.8-orange)
![Capacitor](https://img.shields.io/badge/Capacitor-7.4-blue)

## ✨ Features

### 🎯 Core Messaging

- **Real-time messaging** with instant delivery and typing indicators
- **Direct messages** between contacts with read receipts
- **Group chat** functionality with member management
- **File sharing** with drag-and-drop support (images, videos, documents)
- **Emoji picker** with categorized emoji selection

### 👥 Contact Management

- **Contact requests** system (send, accept, reject)
- **Contact list** with online/offline status indicators
- **Custom nicknames** for contacts
- **Contact removal** functionality

### 🎨 Classic MSN Experience

- **Nostalgic UI** with authentic MSN Messenger design
- **Status system** (Online, Away, Busy, Invisible, Offline)
- **Custom status messages**
- **Gradient blue/purple theme** reminiscent of the original
- **Toast notifications** for system events
- **Cross-platform consistency** with platform-specific optimizations

### 📱 Cross-Platform Availability

#### 🌐 Web Application

- **Progressive Web App** with offline capabilities
- **Browser compatibility** across Chrome, Firefox, Safari, Edge
- **Responsive design** for desktop and mobile browsers

#### 🖥️ Desktop Application (Tauri)

- **Native performance** with Rust-powered backend
- **System integration** (notifications, file associations, system tray)
- **Auto-updates** for seamless version management
- **Platform-specific optimizations** for Windows, macOS, and Linux
- **Comprehensive documentation** - See [Tauri Documentation](#-tauri-desktop-documentation)

#### 📱 Mobile Applications (Capacitor)

- **Native iOS and Android apps** with app store distribution
- **Device integration** (camera, push notifications, haptic feedback)
- **Touch-optimized interface** with native gestures
- **Offline functionality** for core features

### 🔐 Authentication & Security

- **Email verification** system with Resend integration
- **Password authentication** with secure sign-up/sign-in
- **Anonymous authentication** for quick access (development)
- **User profile management** with name updates
- **Secure file uploads** with Convex storage

## 🛠️ Tech Stack

### Frontend

- **React 19** with **TypeScript 5.9** for type-safe development
- **Vite 7** for fast development and optimized builds
- **Tailwind CSS 4** with utility-first styling and CSS variables
- **shadcn/ui** as component library foundation
- **Radix UI** components for accessible UI primitives
- **Lucide React** for consistent iconography
- **Sonner** for elegant toast notifications
- **Next Themes** for dark/light theme support
- **class-variance-authority** for component variant management

### Cross-Platform Framework

#### 🖥️ Desktop (Tauri v2.8)

- **Rust backend** for high-performance native operations
- **WebView frontend** with React app in native container
- **Native APIs** for file system, notifications, and system integration
- **Security** with sandboxed execution and capability-based permissions

#### 📱 Mobile (Capacitor v7.4)

- **Native containers** for iOS and Android app shells
- **Web-to-native bridge** for seamless JavaScript to native API communication
- **Plugin ecosystem** with rich set of native device plugins
- **Performance** near-native with web technologies

### Backend

- **Convex** for real-time database and serverless functions
- **Convex Auth** with @auth/core integration
- **Resend** for email verification services
- **File storage** with Convex's built-in storage system

### Development Tools

- **TypeScript 5.9** with strict configuration
- **Biome 2.2.4** for linting and code formatting
- **Vitest 3.2.4** for unit and integration testing
- **@testing-library/react** for component testing
- **convex-test** for backend function testing
- **npm-run-all** for parallel script execution
- **Husky** for git hooks and pre-commit linting
- **Kiro AI** steering rules for consistent development

## 🚀 Getting Started

### Prerequisites

#### Core Requirements

- **Node.js** (v18 or higher)
- **pnpm 10.14+** (recommended) or **npm**
- **Convex account** (free at [convex.dev](https://convex.dev))
- **Resend account** (optional, for email verification)

#### Desktop Development (Optional)

- **Rust** (latest stable version)
- **Tauri CLI** (installed automatically)

#### Mobile Development (Optional)

For mobile app development, see the [Mobile Setup Guide](docs/MOBILE_SETUP.md):

- **Java 21+** (any version - auto-downloads Java 21 if needed)
- **Android Studio** (for Android development)
- **Xcode** (for iOS development, macOS only)

Quick mobile setup:

```bash
npm run setup:mobile  # Sets up both Android and iOS
```

### 1. Clone the Repository

```bash
git clone <your-repo-url>
cd bootleg-msn
```

### 2. Install Dependencies

```bash
pnpm install
# or
npm install
```

### 3. Set Up Convex

1. **Create a Convex account** at [convex.dev](https://convex.dev)
2. **Initialize Convex** in your project (no global install required):

   ```bash
   npx convex dev
   ```

3. **Follow the prompts** to create a new Convex project

### 4. Configure Environment Variables

Create a `.env.local` file in the root directory:

```bash
# Convex Configuration (auto-generated by `npx convex dev`)
CONVEX_DEPLOYMENT=dev:your-deployment-name
VITE_CONVEX_URL=https://your-deployment.convex.cloud
CONVEX_DEPLOY_KEY=your-deploy-key

# Email Service (Optional - for email verification)
CONVEX_RESEND_API_KEY=your-resend-api-key
CONVEX_SITE_URL=http://localhost:5173
```

> **⚠️ Important:** Never commit `.env.local` to version control. It's already included in `.gitignore`.

### 5. Set Up Email Service (Optional)

For email verification functionality:

1. **Sign up** at [Resend](https://resend.com)
2. **Get your API key** from the dashboard
3. **Add the key** to your `.env.local` file
4. **Configure your domain** in Resend (for production)

### 6. Start Development

```bash
pnpm dev
# or
npm run dev
```

This will start both the frontend (Vite) and backend (Convex) servers:

- **Frontend:** <http://localhost:5173>
- **Convex Dashboard:** Available through the CLI output

## 📁 Project Structure

```text
bootleg-msn/
├── src/                    # Frontend React application
│   ├── components/         # UI components (dialogs, overlays, etc.)
│   ├── adapters/           # Platform adapters (Web/Tauri/Capacitor)
│   ├── hooks/              # Custom React hooks
│   ├── lib/                # Client utilities (overlay manager, notifications)
│   ├── router/             # App routing
│   ├── stores/             # Global state (nanostores)
│   ├── utils/              # Helper functions
│   ├── App.tsx             # Main app interface
│   └── main.tsx            # App entry point
├── convex/                 # Backend (Convex)
│   ├── schema.ts           # Database schema definition
│   ├── router.ts           # Function router
│   ├── auth.ts             # Authentication
│   ├── messages.ts         # Messaging operations
│   ├── groups.ts           # Group chat
│   ├── contacts.ts         # Contact management
│   ├── files.ts            # File upload/download
│   ├── ...                 # More functions/tests
│   └── _generated/         # Auto-generated Convex files
├── src-tauri/              # Tauri desktop application (Rust)
├── android/                # Android (Capacitor) project
├── ios/                    # iOS (Capacitor) project
├── public/                 # Static assets (includes build.json)
├── scripts/                # Build/deploy scripts (write-build-json, post-deploy)
├── docs/                   # Tauri/Mobile/Deployment docs
├── netlify/ and netlify.toml
├── vite.config.ts, biome.json, package.json, tsconfig*.json
└── dist/                   # Production build output
```

## 🎮 Usage

### First Time Setup

1. **Open the app** at <http://localhost:5173>
2. **Sign up** with your email and password
3. **Verify your email** through the verification link sent to your inbox
4. **Sign in** with your verified credentials
5. **Add contacts** by email address
6. **Start chatting!**

> **Note:** Anonymous authentication is available for development but requires email verification for full functionality.

### Key Features

- **Add contacts:** Use the "Add Contact" button and enter their email
- **Create groups:** Click "Create Group" and select contacts to add
- **Send files:** Drag and drop files into chat windows
- **Change status:** Click your status in the sidebar
- **Use emojis:** Click the emoji button in message input

### Platform-Specific Features

#### 🌐 Web Browser

- **Progressive Web App** installation
- **Browser notifications** (with permission)
- **File download** via browser download manager

#### 🖥️ Desktop Application

- **Native notifications** with system integration
- **File system access** for advanced file operations
- **System tray** integration (minimize to tray)
- **Auto-updates** for seamless version management
- **Multiple windows** support

#### 📱 Mobile Applications

- **Push notifications** for real-time alerts
- **Camera integration** for photo sharing
- **Haptic feedback** for enhanced interaction
- **Native sharing** with other apps
- **Background sync** for offline message delivery

## 🔧 Development

### Available Scripts

#### Web Development

```bash
pnpm dev             # Start frontend (Vite) + backend (Convex) in parallel
pnpm dev:frontend    # Start only Vite dev server
pnpm dev:backend     # Start only Convex dev server

pnpm build           # Production build
pnpm build:netlify   # One-off Convex build + write build.json + Vite build
```

#### Desktop Development (Tauri)

```bash
pnpm dev:tauri       # Start desktop app in development
pnpm build:tauri     # Build desktop application
```

#### Mobile Development (Capacitor)

```bash
pnpm setup:mobile    # Set up Android and iOS platforms
pnpm setup:android   # Set up Android platform only

pnpm dev:android     # Build and run on Android
pnpm dev:ios         # Build and run on iOS

pnpm build:mobile    # Build web assets for mobile + sync
pnpm build:android   # Build Android app
pnpm build:ios       # Build iOS app
```

#### Testing

```bash
pnpm test            # Run tests once and exit
pnpm test:watch      # Run tests in watch mode
pnpm test:ui         # Run tests with UI interface
pnpm test:migration  # Test database migration integration
```

#### Code Quality

```bash
pnpm lint            # Biome lint (src and convex)
pnpm lint:fix        # Auto-fix with Biome (--write --unsafe)
pnpm typecheck       # TypeScript project references build (no emit)
```

#### Version management

```bash
pnpm version:patch
pnpm version:minor
pnpm version:major
```

### Database Schema

The app uses Convex with the following main tables:

- **users** - User profiles and authentication (from Convex Auth)
- **contacts** - Contact relationships with nicknames
- **contactRequests** - Contact request management (pending/accepted/rejected)
- **messages** - Unified messages for both direct and group chats with file support
- **groups** - Group chat information and settings
- **groupMembers** - Group membership with roles (admin/member)
- **messageReads** - Read receipts for all messages (direct and group)
- **userStatus** - Online status and custom status messages
- **emailVerifications** - Email verification tokens and status
- **typingIndicators** - Real-time typing indicators
- **deploymentInfo** - Application version tracking

### AI Development Assistance

This project includes Kiro steering rules for consistent AI-assisted development:

- **General coding standards** and MSN Messenger guidelines
- **Convex-specific** backend development rules with new function syntax
- **React component** development patterns
- **Tailwind CSS** guidelines with cn() function usage
- **Project structure** and file organization rules

### Versioning & Deployment Metadata

- Source of truth: version in `package.json`
- Bump locally with scripts:

```bash
pnpm version:patch
pnpm version:minor
pnpm version:major
```

- On Netlify deploys:
  - `public/build.json` is generated from `package.json` version and env (scripts/write-build-json.js)
  - Convex deployment tracking is triggered post-deploy (scripts/post-deploy.js)
  - Commits containing `[force]` mark the release as a force deployment

Note: GitHub Actions–based auto-bumping is optional and not required for the Netlify flow.

## 🚀 Deployment

### Web Application

#### Netlify (recommended)

Netlify is configured to deploy Convex and the frontend together via `netlify.toml`:

```bash
npx convex deploy --cmd 'pnpm build:netlify' && node scripts/post-deploy.js
```

- `pnpm build:netlify` runs a one-off Convex build, writes `public/build.json`, and Vite builds to `dist/`
- `post-deploy.js` records the release in Convex and marks it live; commits containing `[force]` are treated as force deployments
- Preview deploys use `VITE_CHANNEL=staging`

#### Manual (local or alternative hosts)

- Deploy Convex to production:

```bash
npx convex deploy --prod
```

- Build frontend assets:

```bash
pnpm build
```

You can then host the `dist/` folder on any static host (Netlify, Vercel, GitHub Pages, AWS S3 + CloudFront, etc.).

### Desktop Application (Tauri)

#### Development Build

```bash
pnpm build:tauri
```

#### Production Distribution

1. **Code signing** (Windows/macOS)
2. **Auto-updater configuration**
3. **Store distribution** (Microsoft Store, Mac App Store)

### Mobile Applications (Capacitor)

#### iOS App Store

1. **Build iOS app:**

   ```bash
   pnpm build:ios
   ```

2. **Open in Xcode** for final configuration
3. **Submit to App Store Connect**

#### Google Play Store

1. **Build Android app:**

   ```bash
   pnpm build:android
   ```

2. **Sign APK/AAB** with release keystore
3. **Upload to Google Play Console**

## 🤝 Contributing

1. **Fork the repository**
2. **Create a feature branch:** `git checkout -b feature/amazing-feature`
3. **Follow the steering rules** in `.kiro/steering/`
4. **Commit your changes:** `git commit -m 'Add amazing feature'`
5. **Push to the branch:** `git push origin feature/amazing-feature`
6. **Open a Pull Request**

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Microsoft** for the original MSN Messenger inspiration
- **Convex** for the excellent real-time backend platform
- **React team** for the amazing frontend framework
- **Tailwind CSS** for the utility-first styling approach

## 📞 Support

If you encounter any issues or have questions:

1. **Check the issues** on GitHub
2. **Review the Convex docs** at [docs.convex.dev](https://docs.convex.dev)
3. **Create a new issue** with detailed information

---

## 📚 Tauri Desktop Documentation

Comprehensive documentation for the Tauri desktop application:

- **[Setup Guide](docs/TAURI_SETUP.md)** - Development environment setup and getting started
- **[Architecture Overview](docs/TAURI_ARCHITECTURE.md)** - System design, plugins, and security model
- **[API Reference](docs/TAURI_API_REFERENCE.md)** - Complete API documentation for Rust commands and TypeScript integration
- **[Deployment Guide](docs/TAURI_DEPLOYMENT.md)** - Building, code signing, and distribution for all platforms
- **[Troubleshooting](docs/TAURI_TROUBLESHOOTING.md)** - Common issues, debugging, and platform-specific problems

### Key Tauri Features

- **🦀 Rust Backend**: High-performance native operations with zero-cost abstractions
- **🪟 Multi-Window Support**: Create separate chat windows with persistent state
- **🔔 Native Notifications**: System-integrated notifications with click handling
- **📱 System Tray**: Minimize to tray with unread message badges
- **🔗 Deep Links**: Handle `msn-messenger://` protocol URLs
- **🔄 Auto-Updates**: Seamless version management with signed updates
- **🔒 Security**: Capability-based permissions and sandboxed execution
- **🎨 Platform Integration**: Native look and feel on Windows, macOS, and Linux

---

## Built with ❤️ and nostalgia for the golden age of instant messaging

Experience the classic MSN Messenger on any device - web, desktop, or mobile!
