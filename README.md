# ⛳ Scaletta Golf

A modern golf management application built with React Router v7, featuring user authentication, session management, and a responsive design tailored for golf enthusiasts.

## 🚀 Features

- **🔐 Authentication System**: Secure login/logout with session-based authentication
- **👤 User Management**: Account settings and profile management
- **🎨 Modern UI**: Responsive design with Tailwind CSS and custom components
- **📱 Mobile-First**: Optimized for mobile and desktop experiences
- **🗄️ Database**: SQLite database with Prisma ORM
- **🔒 TypeScript**: Full type safety throughout the application
- **⚡ Hot Reload**: Fast development with Vite and React Router dev server

## 🛠️ Tech Stack

- **Frontend**: React 19, React Router v7, TypeScript
- **Styling**: Tailwind CSS v4
- **Database**: SQLite with Prisma ORM
- **Authentication**: bcryptjs for password hashing
- **Validation**: Zod for schema validation
- **Build Tool**: Vite
- **Deployment**: Node.js server-side rendering

## 📋 Prerequisites

- Node.js 18.18 or higher
- npm or yarn package manager

## 🚀 Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/bennybrau/golf-trip-v2.git
cd golf-trip-v2
```

### 2. Install dependencies

```bash
npm install
```

### 3. Set up the database

The project uses SQLite with Prisma. The database configuration is already set up in `.env`:

```bash
# Generate Prisma client
npx prisma generate

# Apply database schema
npx prisma db push
```

### 4. Start the development server

```bash
npm run dev
```

Your application will be available at `http://localhost:5173`.

## 🎮 Using the App

### First Time Setup

1. Navigate to `http://localhost:5173`
2. You'll be redirected to the login page
3. **Demo Mode**: Enter any email and password to create a new account automatically
4. Once logged in, you'll see the golf dashboard

### Key Features

- **Dashboard**: Welcome screen with user greeting and golf-themed design
- **Navigation**: Easy access to account settings and logout
- **Account Management**: Update your profile information
- **Session Management**: Secure 30-day sessions with automatic cleanup

## 📁 Project Structure

```
golf-trip-v2/
├── app/
│   ├── components/          # Reusable UI components
│   │   ├── Navigation.tsx   # Main navigation component
│   │   └── ui/             # UI component library
│   ├── lib/                # Utility libraries
│   │   ├── auth.ts         # Authentication logic
│   │   ├── db.ts           # Database connection
│   │   ├── session.ts      # Session management
│   │   └── validation.ts   # Form validation schemas
│   ├── routes/             # Application routes
│   │   ├── home.tsx        # Protected dashboard
│   │   ├── login.tsx       # Login page
│   │   ├── account.tsx     # Account settings
│   │   └── logout.tsx      # Logout handler
│   ├── app.css            # Global styles
│   ├── root.tsx           # App root component
│   └── routes.ts          # Route configuration
├── prisma/
│   ├── schema.prisma      # Database schema
│   └── migrations/        # Database migrations
├── .env                   # Environment variables
└── package.json          # Dependencies and scripts
```

## 🗄️ Database Schema

The app uses two main models:

- **User**: Stores user account information (email, name, avatar, phone)
- **Session**: Manages user sessions with token-based authentication

## 🔧 Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run typecheck` - Run TypeScript type checking
- `npx prisma studio` - Open Prisma database browser
- `npx prisma db push` - Apply schema changes to database

## 🚀 Deployment

### Building for Production

```bash
npm run build
```

### Environment Variables

Make sure to set up your environment variables for production:

```env
DATABASE_URL="file:./prisma/prod.db"
NODE_ENV="production"
```

### Deploy Options

The app can be deployed to any Node.js hosting platform:

- **Vercel** (recommended for React Router apps)
- **Netlify**
- **Railway**
- **Render**
- **DigitalOcean App Platform**
- **AWS/Google Cloud/Azure**

## 🛡️ Security Features

- Password hashing with bcryptjs
- Session-based authentication with secure cookies
- HttpOnly cookies to prevent XSS attacks
- Automatic session cleanup for expired tokens
- Protected routes with authentication middleware

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆔 Built With

- [React Router v7](https://reactrouter.com/) - Full-stack React framework
- [Prisma](https://prisma.io/) - Next-generation ORM
- [Tailwind CSS](https://tailwindcss.com/) - Utility-first CSS framework
- [TypeScript](https://typescriptlang.org/) - JavaScript with syntax for types
- [Vite](https://vitejs.dev/) - Next generation frontend tooling

---

Built with ❤️ for golf enthusiasts