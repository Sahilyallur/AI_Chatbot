# GrudAI

A full-stack AI chatbot platform with JWT authentication, project management, real-time streaming chat, and flowchart generation using OpenRouter API.

![Node.js](https://img.shields.io/badge/Node.js-18+-green) ![React](https://img.shields.io/badge/React-18-blue) ![SQLite](https://img.shields.io/badge/SQLite-3-orange)

---

## 📖 Table of Contents

- [Features](#-features)
- [Architecture](#-architecture)
- [Tech Stack](#-tech-stack)
- [Getting Started](#-getting-started)
- [API Documentation](#-api-documentation)
- [Project Structure](#-project-structure)
- [Security](#-security)
- [Scaling for Production](#-scaling-for-production)

---

## ✨ Features

| Feature | Description |
|---------|-------------|
| 🔐 **Authentication** | JWT-based auth with bcrypt password hashing |
| 📁 **Project Management** | Create and manage multiple AI chatbot agents |
| 💬 **Real-time Chat** | Streaming responses from LLM providers |
| � **Flowcharts** | Mermaid diagram support for visual diagrams |
| 📝 **Markdown Rendering** | Rich text formatting with code blocks |
| 📎 **File Upload** | Attach files to your projects |
| 🎨 **Modern UI** | Dark-themed interface with smooth animations |

---

## 🏗 Architecture

### System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                         CLIENT (React)                          │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────────────┐ │
│  │  Login   │  │Dashboard │  │   Chat   │  │ Project Settings │ │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────────┬─────────┘ │
│       └─────────────┼───────────────┼────────────────┘          │
│                     ▼               ▼                           │
│              ┌─────────────────────────────┐                    │
│              │       API Client Layer       │                   │
│              │  (Fetch + Auth Token Mgmt)   │                   │
│              └──────────────┬──────────────┘                    │
└─────────────────────────────┼───────────────────────────────────┘
                              │ HTTP/REST
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                       SERVER (Express.js)                       │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │                   Middleware Layer                       │    │
│  │  ┌──────────────┐  ┌───────────┐  ┌──────────────────┐  │    │
│  │  │  CORS/JSON   │  │  Logging  │  │ JWT Auth Verify  │  │    │
│  │  └──────────────┘  └───────────┘  └──────────────────┘  │    │
│  └─────────────────────────┬───────────────────────────────┘    │
│                            ▼                                    │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │                    Route Handlers                        │    │
│  │  ┌────────┐ ┌─────────┐ ┌──────┐ ┌───────┐ ┌─────────┐  │    │
│  │  │  Auth  │ │ Projects│ │ Chat │ │Prompts│ │  Files  │  │    │
│  │  └───┬────┘ └────┬────┘ └──┬───┘ └───┬───┘ └────┬────┘  │    │
│  └──────┼───────────┼─────────┼─────────┼──────────┼───────┘    │
│         └───────────┴─────────┼─────────┴──────────┘            │
│                               ▼                                 │
│         ┌─────────────────────────────────────┐                 │
│         │            LLM Service              │                 │
│         │   (OpenRouter API Integration)      │────────────────►│ OpenRouter API
│         │    - Streaming SSE responses        │                 │
│         │    - Multi-model support            │                 │
│         └─────────────────────────────────────┘                 │
│                               │                                 │
│                               ▼                                 │
│         ┌─────────────────────────────────────┐                 │
│         │          SQLite Database            │                 │
│         │  ┌───────┐ ┌────────┐ ┌─────────┐   │                 │
│         │  │ Users │ │Projects│ │Messages │   │                 │
│         │  └───────┘ └────────┘ └─────────┘   │                 │
│         │  ┌───────┐ ┌────────┐               │                 │
│         │  │Prompts│ │ Files  │               │                 │
│         │  └───────┘ └────────┘               │                 │
│         └─────────────────────────────────────┘                 │
└─────────────────────────────────────────────────────────────────┘
```

### Data Flow

1. **Authentication Flow**: User registers/logs in → Server validates → JWT token issued → Stored in localStorage
2. **Chat Flow**: User sends message → Server streams to OpenRouter → Response chunks sent via SSE → Rendered with markdown
3. **Project Flow**: CRUD operations with user ownership validation

### Database Schema

```sql
users (id, email, password_hash, name, created_at)
    │
    └──► projects (id, user_id, name, description, system_prompt, model)
              │
              ├──► messages (id, project_id, role, content, created_at)
              ├──► prompts (id, project_id, name, content)
              └──► files (id, project_id, filename, original_name, size)
```

---

## 🛠 Tech Stack

| Layer | Technology | Purpose |
|-------|------------|---------|
| **Frontend** | React 18, Vite | UI framework and build tool |
| **Routing** | React Router v6 | Client-side navigation |
| **Backend** | Node.js, Express | REST API server |
| **Database** | SQLite (sql.js) | Lightweight persistent storage |
| **Auth** | JWT, bcryptjs | Secure authentication |
| **LLM** | OpenRouter API | Access to multiple AI models |
| **Diagrams** | Mermaid | Flowchart rendering |
| **Markdown** | react-markdown | Rich text formatting |

---

## 🚀 Getting Started

### Prerequisites

- **Node.js 18+** ([Download](https://nodejs.org/))
- **OpenRouter API Key** ([Get one free](https://openrouter.ai/))

### Step 1: Clone the Repository

```bash
git clone https://github.com/Sahilyallur/AI_Chatbot.git
cd AI_Chatbot
```

### Step 2: Setup Backend

```bash
# Navigate to server directory
cd server

# Install dependencies
npm install

# Create environment file from template
cp .env.example .env

# Edit .env and add your OpenRouter API key
# Replace 'your-openrouter-api-key-here' with your actual key
```

**Configure `server/.env`:**
```env
PORT=3001
JWT_SECRET=your-secure-secret-key-change-this
JWT_EXPIRES_IN=7d
OPENROUTER_API_KEY=sk-or-v1-your-actual-key-here
OPENROUTER_BASE_URL=https://openrouter.ai/api/v1
DEFAULT_MODEL=openai/gpt-3.5-turbo
```

### Step 3: Setup Frontend

```bash
# Open new terminal, navigate to client directory
cd client

# Install dependencies
npm install
```

### Step 4: Run the Application

**Terminal 1 - Start Backend:**
```bash
cd server
npm run dev
# Server runs on http://localhost:3001
```

**Terminal 2 - Start Frontend:**
```bash
cd client
npm run dev
# App runs on http://localhost:5173
```

### Step 5: Access the Application

Open your browser and navigate to: **http://localhost:5173**

1. **Register** a new account
2. **Create** a new project/chatbot
3. **Start chatting** with your AI assistant!

---

## 📚 API Documentation

### Authentication Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/api/auth/register` | Create new user | No |
| POST | `/api/auth/login` | Login user | No |
| POST | `/api/auth/verify` | Verify JWT token | No |

### User Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/users/me` | Get current user | Yes |
| PUT | `/api/users/me` | Update profile | Yes |

### Project Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/projects` | List all projects | Yes |
| POST | `/api/projects` | Create project | Yes |
| GET | `/api/projects/:id` | Get project details | Yes |
| PUT | `/api/projects/:id` | Update project | Yes |
| DELETE | `/api/projects/:id` | Delete project | Yes |

### Chat Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/projects/:id/messages` | Get chat history | Yes |
| POST | `/api/projects/:id/chat` | Send message (streaming) | Yes |
| DELETE | `/api/projects/:id/messages` | Clear chat history | Yes |

### Prompts & Files

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET/POST | `/api/projects/:id/prompts` | Manage saved prompts |
| GET/POST | `/api/projects/:id/files` | Manage file uploads |

---

## 📁 Project Structure

```
AI_Chatbot/
├── client/                    # React Frontend
│   ├── src/
│   │   ├── api/              # API client functions
│   │   ├── components/       # Reusable UI components
│   │   │   ├── ChatInput.jsx
│   │   │   ├── ChatMessage.jsx
│   │   │   ├── Modal.jsx
│   │   │   ├── Navbar.jsx
│   │   │   └── ProjectCard.jsx
│   │   ├── context/          # React context providers
│   │   ├── pages/            # Page components
│   │   │   ├── Chat.jsx
│   │   │   ├── Dashboard.jsx
│   │   │   ├── Login.jsx
│   │   │   └── Register.jsx
│   │   ├── App.jsx           # Main app with routing
│   │   └── index.css         # Global styles
│   └── vite.config.js        # Vite configuration
│
├── server/                    # Express Backend
│   ├── database/
│   │   ├── db.js             # Database connection
│   │   └── schema.sql        # Table definitions
│   ├── middleware/
│   │   └── auth.js           # JWT authentication
│   ├── routes/
│   │   ├── auth.js           # Auth endpoints
│   │   ├── chat.js           # Chat endpoints
│   │   ├── files.js          # File upload endpoints
│   │   ├── projects.js       # Project CRUD
│   │   ├── prompts.js        # Prompt management
│   │   └── users.js          # User management
│   ├── services/
│   │   └── llmService.js     # OpenRouter integration
│   ├── utils/
│   │   └── helpers.js        # Utility functions
│   ├── index.js              # Server entry point
│   └── .env.example          # Environment template
│
└── README.md                  # This file
```

---

## � Security

| Feature | Implementation |
|---------|----------------|
| Password Hashing | bcrypt with salt rounds |
| Authentication | JWT with expiration |
| SQL Injection | Parameterized queries |
| CORS | Configured for allowed origins |
| API Keys | Environment variables (never committed) |

---

## � Scaling for Production

To scale this application for production:

1. **Database**: Migrate from SQLite to PostgreSQL
2. **Deployment**: Containerize with Docker
3. **Load Balancing**: Deploy behind nginx or cloud LB
4. **Caching**: Add Redis for session management
5. **Monitoring**: Add logging and APM tools

---

## 📝 License

MIT License - feel free to use for your own projects.

---

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.