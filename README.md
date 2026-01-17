# GrudAI

A full-stack AI chatbot platform with JWT authentication, project management, real-time streaming chat, file analysis with OCR, and multi-model support via OpenRouter API.

![Node.js](https://img.shields.io/badge/Node.js-18+-green) ![React](https://img.shields.io/badge/React-18-blue) ![Turso](https://img.shields.io/badge/Turso-SQLite-orange) ![Vite](https://img.shields.io/badge/Vite-5-purple) ![Railway](https://img.shields.io/badge/Railway-Backend-blueviolet) ![Render](https://img.shields.io/badge/Render-Frontend-46E3B7)

---

## 📖 Table of Contents

- [Features](#-features)
- [Live Demo](#-live-demo)
- [Screenshots](#-screenshots)
- [Architecture](#-architecture)
- [Tech Stack](#-tech-stack)
- [Deployment](#-deployment)
- [Getting Started](#-getting-started)
- [API Documentation](#-api-documentation)
- [Project Structure](#-project-structure)
- [Available Models](#-available-models)
- [Security](#-security)
- [Scaling for Production](#-scaling-for-production)

---

## ✨ Features

| Feature | Description |
|---------|-------------|
| 🔐 **JWT Authentication** | Secure login/register with bcrypt password hashing |
| 📁 **Project Management** | Create and manage multiple AI chatbot agents |
| 💬 **Real-time Streaming** | Live streaming responses from LLM providers via SSE |
| 🗂️ **Conversations** | Organize chats into separate conversation threads |
| 📄 **File Analysis** | Upload PDFs, Word docs, images, and text files |
| 🔍 **OCR Support** | Extract text from images using Tesseract.js |
| 📊 **Mermaid Diagrams** | Generate and render flowcharts in chat |
| 📝 **Markdown Rendering** | Rich text formatting with syntax-highlighted code blocks |
| 🌗 **Dark/Light Theme** | Toggle between dark and light modes |
| 🤖 **Multi-Model Support** | Access GPT-4o, Claude, Gemini, Llama via OpenRouter |
| 💾 **Saved Prompts** | Store and reuse custom system prompts |
| 🎨 **Modern UI** | Sleek interface with smooth animations |

---

## 🌐 Live Demo

| Component | URL |
|-----------|-----|
| **Frontend** | [https://grudai-client-xppo.onrender.com](https://grudai-client-xppo.onrender.com) |
| **Backend API** | [https://aichatbot-production-d986.up.railway.app](https://aichatbot-production-d986.up.railway.app) |

---

## 📸 Screenshots

The application features a modern, responsive design:

- **Dashboard**: View all your projects at a glance
- **Chat Interface**: Streaming AI responses with markdown support
- **Settings Modal**: Configure project name, description, system prompt, and AI model
- **Conversation Sidebar**: Organize and switch between chat threads
- **File Upload**: Attach documents and images for AI analysis

---

## 🏗 Architecture

### System Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                         CLIENT (React + Vite)                        │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────────────────┐ │
│  │  Login   │  │Dashboard │  │   Chat   │  │  Project Settings    │ │
│  │ Register │  │ Projects │  │ Messages │  │  Prompts / Files     │ │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └──────────┬───────────┘ │
│       └─────────────┼───────────────┼──────────────────┘            │
│                     ▼               ▼                               │
│              ┌────────────────────────────────────┐                 │
│              │         API Client Layer           │                 │
│              │   (Fetch + JWT Token Management)   │                 │
│              │   • Streaming SSE handling         │                 │
│              │   • File upload with FormData      │                 │
│              └──────────────┬─────────────────────┘                 │
└─────────────────────────────┼───────────────────────────────────────┘
                              │ HTTP/REST + SSE
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│                       SERVER (Express.js)                            │
│  ┌───────────────────────────────────────────────────────────────┐  │
│  │                     Middleware Layer                           │  │
│  │  ┌──────────────┐  ┌───────────┐  ┌────────────────────────┐  │  │
│  │  │  CORS/JSON   │  │  Logging  │  │  JWT Authentication    │  │  │
│  │  └──────────────┘  └───────────┘  └────────────────────────┘  │  │
│  └───────────────────────────┬───────────────────────────────────┘  │
│                              ▼                                      │
│  ┌───────────────────────────────────────────────────────────────┐  │
│  │                      Route Handlers                            │  │
│  │  ┌──────┐ ┌────────┐ ┌──────────────┐ ┌──────┐ ┌───────────┐  │  │
│  │  │ Auth │ │Projects│ │Conversations │ │ Chat │ │  Files    │  │  │
│  │  └──┬───┘ └───┬────┘ └──────┬───────┘ └──┬───┘ └─────┬─────┘  │  │
│  │     │         │             │            │           │        │  │
│  │  ┌──┴───┐  ┌──┴────┐                  ┌──┴───┐  ┌────┴─────┐  │  │
│  │  │Users │  │Prompts│                  │ LLM  │  │   OCR    │  │  │
│  │  └──────┘  └───────┘                  │Service│ │Tesseract │  │  │
│  └───────────────────────────────────────┴──┬───┴──┴────┬─────┴──┘  │
│                                             │           │           │
│                              ┌──────────────┴───────────┘           │
│                              ▼                                      │
│         ┌─────────────────────────────────────────────┐             │
│         │              SQLite Database                │             │
│         │  ┌───────┐ ┌────────┐ ┌─────────────────┐   │             │
│         │  │ Users │ │Projects│ │  Conversations  │   │             │
│         │  └───────┘ └────────┘ └─────────────────┘   │             │
│         │  ┌────────┐ ┌───────┐ ┌──────┐              │             │
│         │  │Messages│ │Prompts│ │Files │              │             │
│         │  └────────┘ └───────┘ └──────┘              │             │
│         └─────────────────────────────────────────────┘             │
└──────────────────────────────────┬──────────────────────────────────┘
                                   │
                                   ▼
                    ┌──────────────────────────────┐
                    │       OpenRouter API         │
                    │  • GPT-4o, GPT-3.5 Turbo     │
                    │  • Claude 3.5 Sonnet, Haiku  │
                    │  • Gemini 2.5 Pro, 2.0 Flash │
                    │  • Llama 3.3 70B, 3.1 70B    │
                    └──────────────────────────────┘
```

### Data Flow

1. **Authentication Flow**
   - User registers/logs in → Server validates credentials → JWT token issued → Stored in localStorage
   - All subsequent API calls include `Authorization: Bearer <token>` header

2. **Chat Flow**
   - User sends message → Server saves to DB → Request sent to OpenRouter → Response chunks streamed via SSE → Rendered with markdown/mermaid

3. **File Upload Flow**
   - User selects file → Uploaded via FormData → Server extracts text (OCR for images, pdf-parse for PDFs) → Text stored in DB → Available as context for chat

### Database Schema

```sql
users (id, email, password_hash, name, created_at)
    │
    └──► projects (id, user_id, name, description, system_prompt, model, created_at, updated_at)
              │
              ├──► conversations (id, project_id, title, created_at, updated_at)
              │         │
              │         └──► messages (id, project_id, conversation_id, role, content, created_at)
              │
              ├──► prompts (id, project_id, name, content, created_at)
              │
              └──► files (id, project_id, filename, original_name, mime_type, size, extracted_text, created_at)
```

---

## 🛠 Tech Stack

### Frontend

| Technology | Purpose |
|------------|---------|
| React 18 | UI component framework |
| Vite 5 | Fast build tool and dev server |
| React Router v6 | Client-side routing |
| react-markdown | Markdown rendering |
| Mermaid | Flowchart/diagram generation |

### Backend

| Technology | Purpose |
|------------|---------|
| Node.js 18+ | Runtime environment |
| Express.js | REST API framework |
| Turso (@libsql/client) | Cloud SQLite database |
| JWT (jsonwebtoken) | Token-based authentication |
| bcryptjs | Password hashing |
| Multer | File upload handling |
| Tesseract.js | OCR for image text extraction |
| pdf-parse | PDF text extraction |
| Mammoth | Word document text extraction |

### External Services

| Service | Purpose |
|---------|---------|
| OpenRouter API | Unified access to multiple LLM providers |
| Turso | Cloud-hosted SQLite database |

### Deployment Platforms

| Platform | Purpose |
|----------|---------|
| Railway | Backend hosting (Node.js) |
| Render | Frontend hosting (static site) |
| Turso | Persistent cloud database |

---

## 🚀 Deployment

The application is deployed using a modern cloud-native architecture:

### Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                      PRODUCTION DEPLOYMENT                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌─────────────────┐        ┌─────────────────┐                 │
│  │     Render      │        │    Railway      │                 │
│  │   Static Site   │───────▶│   Node.js API   │                 │
│  │   (Frontend)    │  API   │   (Backend)     │                 │
│  └─────────────────┘        └────────┬────────┘                 │
│                                      │                          │
│                                      ▼                          │
│                           ┌─────────────────┐                   │
│                           │     Turso       │                   │
│                           │  Cloud SQLite   │                   │
│                           │   (Database)    │                   │
│                           └─────────────────┘                   │
│                                      │                          │
│                                      ▼                          │
│                           ┌─────────────────┐                   │
│                           │   OpenRouter    │                   │
│                           │   LLM APIs      │                   │
│                           └─────────────────┘                   │
└─────────────────────────────────────────────────────────────────┘
```

### Environment Variables

**Railway (Backend):**
| Variable | Description |
|----------|-------------|
| `JWT_SECRET` | Secret key for JWT signing |
| `OPENROUTER_API_KEY` | OpenRouter API key |
| `OPENROUTER_BASE_URL` | `https://openrouter.ai/api/v1` |
| `TURSO_DATABASE_URL` | Turso database URL |
| `TURSO_AUTH_TOKEN` | Turso authentication token |
| `FRONTEND_URL` | Render frontend URL (for CORS) |

**Render (Frontend):**
| Variable | Description |
|----------|-------------|
| `VITE_API_URL` | Railway backend URL + `/api` |

---

## 🚀 Getting Started

### Prerequisites

- **Node.js 18+** - [Download here](https://nodejs.org/)
- **npm** (comes with Node.js)
- **OpenRouter API Key** - [Get one free](https://openrouter.ai/)

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
```

**Edit `server/.env` with your configuration:**

```env
# Server Configuration
PORT=3001

# JWT Configuration
JWT_SECRET=your-secure-secret-key-change-this-in-production
JWT_EXPIRES_IN=7d

# OpenRouter API Configuration
OPENROUTER_API_KEY=sk-or-v1-your-actual-api-key-here
OPENROUTER_BASE_URL=https://openrouter.ai/api/v1

# Default LLM Model
DEFAULT_MODEL=openai/gpt-3.5-turbo
```

> ⚠️ **Important**: Never commit your `.env` file with real API keys!

### Step 3: Setup Frontend

```bash
# Open a new terminal and navigate to client directory
cd client

# Install dependencies
npm install
```

### Step 4: Run the Application

**Terminal 1 - Start Backend Server:**

```bash
cd server
npm start
# Or for development with auto-reload:
npm run dev
```

The server will start on `http://localhost:3001`

**Terminal 2 - Start Frontend Development Server:**

```bash
cd client
npm run dev
```

The frontend will start on `http://localhost:5173`

### Step 5: Access the Application

1. Open your browser and go to: **http://localhost:5173**
2. **Register** a new account with your email
3. **Create** a new project (chatbot agent)
4. **Configure** the AI model in project settings
5. **Start chatting** with your AI assistant!

---

## 📚 API Documentation

### Authentication

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/auth/register` | Create new user account | No |
| POST | `/api/auth/login` | Login and receive JWT | No |
| POST | `/api/auth/verify` | Verify JWT token validity | No |

### Users

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/users/me` | Get current user profile | Yes |
| PUT | `/api/users/me` | Update user profile | Yes |

### Projects

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/projects` | List all user's projects | Yes |
| POST | `/api/projects` | Create new project | Yes |
| GET | `/api/projects/:id` | Get project details | Yes |
| PUT | `/api/projects/:id` | Update project settings | Yes |
| DELETE | `/api/projects/:id` | Delete project | Yes |

### Conversations

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/projects/:id/conversations` | List conversations | Yes |
| POST | `/api/projects/:id/conversations` | Create conversation | Yes |
| PUT | `/api/conversations/:id` | Update conversation title | Yes |
| DELETE | `/api/conversations/:id` | Delete conversation | Yes |

### Chat

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/projects/:id/messages` | Get chat history | Yes |
| POST | `/api/projects/:id/chat` | Send message (streaming SSE) | Yes |
| DELETE | `/api/projects/:id/messages` | Clear chat history | Yes |

### Files

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/projects/:id/files` | List project files | Yes |
| POST | `/api/projects/:id/files` | Upload file | Yes |
| GET | `/api/files/:id/text` | Get extracted text | Yes |
| DELETE | `/api/files/:id` | Delete file | Yes |

### Prompts

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/projects/:id/prompts` | List saved prompts | Yes |
| POST | `/api/projects/:id/prompts` | Create prompt | Yes |
| PUT | `/api/prompts/:id` | Update prompt | Yes |
| DELETE | `/api/prompts/:id` | Delete prompt | Yes |

---

## 📁 Project Structure

```
AI_Chatbot/
├── client/                          # React Frontend
│   ├── src/
│   │   ├── api/
│   │   │   └── index.js            # API client with fetch + JWT
│   │   ├── components/
│   │   │   ├── ChatInput.jsx       # Message input with file upload
│   │   │   ├── ChatMessage.jsx     # Message bubble with markdown
│   │   │   ├── Modal.jsx           # Reusable modal component
│   │   │   ├── Navbar.jsx          # Top navigation with theme toggle
│   │   │   └── ProjectCard.jsx     # Project card for dashboard
│   │   ├── context/
│   │   │   └── AuthContext.jsx     # Authentication state management
│   │   ├── pages/
│   │   │   ├── Chat.jsx            # Main chat interface
│   │   │   ├── Dashboard.jsx       # Project listing page
│   │   │   ├── Login.jsx           # Login page
│   │   │   └── Register.jsx        # Registration page
│   │   ├── App.jsx                 # Main app with routing
│   │   ├── index.css               # Global styles (dark/light themes)
│   │   └── main.jsx                # React entry point
│   ├── index.html
│   ├── package.json
│   └── vite.config.js              # Vite configuration with proxy
│
├── server/                          # Express Backend
│   ├── database/
│   │   ├── db.js                   # SQLite connection manager
│   │   └── schema.sql              # Database schema
│   ├── middleware/
│   │   └── auth.js                 # JWT authentication middleware
│   ├── routes/
│   │   ├── auth.js                 # Authentication endpoints
│   │   ├── chat.js                 # Chat/messaging endpoints
│   │   ├── conversations.js        # Conversation management
│   │   ├── files.js                # File upload with OCR
│   │   ├── projects.js             # Project CRUD
│   │   ├── prompts.js              # Saved prompts
│   │   └── users.js                # User profile management
│   ├── services/
│   │   ├── llmService.js           # OpenRouter API integration
│   │   └── textExtractor.js        # OCR and document parsing
│   ├── uploads/                    # Uploaded files storage
│   ├── utils/
│   │   └── helpers.js              # Utility functions
│   ├── index.js                    # Server entry point
│   ├── .env.example                # Environment template
│   └── package.json
│
└── README.md                        # This file
```

---

## 🤖 Available Models

The application supports multiple AI models via OpenRouter:

| Model | ID | Description |
|-------|-----|-------------|
| GPT-3.5 Turbo | `openai/gpt-3.5-turbo` | Fast, cost-effective |
| GPT-4o Mini | `openai/gpt-4o-mini` | Balanced performance |
| GPT-4o | `openai/gpt-4o` | Most capable |
| Claude 3 Haiku | `anthropic/claude-3-haiku` | Fast responses |
| Gemini 2.0 Flash | `google/gemini-2.0-flash-001` | Fast Gemini |
| Llama 3.3 70B (Free) | `meta-llama/llama-3.3-70b-instruct:free` | Free tier |
| Llama 3.1 70B | `meta-llama/llama-3.1-70b-instruct` | High quality |

---

## 🔒 Security

| Feature | Implementation |
|---------|----------------|
| Password Hashing | bcrypt with salt rounds |
| Authentication | JWT with 7-day expiration |
| SQL Injection | Parameterized queries (sql.js prepared statements) |
| CORS | Configured for allowed origins |
| API Keys | Environment variables (never committed) |
| File Uploads | Validated file types and size limits |

### Security Best Practices

1. **Change JWT_SECRET** in production - use a long, random string
2. **Never commit `.env`** files with real credentials
3. **Use HTTPS** in production
4. **Set appropriate CORS origins** for your domain

---

## 📈 Scaling for Production

To scale this application for production use:

### Database

- Migrate from SQLite to **PostgreSQL** or **MySQL** for better concurrency
- Add database connection pooling

### Deployment

- Containerize with **Docker** and **Docker Compose**
- Deploy to cloud platforms (AWS, GCP, Azure, Vercel, Railway)

### Performance

- Add **Redis** for session management and caching
- Use **CDN** for static assets
- Enable **compression** middleware

### Monitoring

- Add logging with **Winston** or **Pino**
- Implement APM with **New Relic** or **Datadog**
- Set up error tracking with **Sentry**

### Load Balancing

- Deploy behind **nginx** or cloud load balancer
- Implement **rate limiting** for API endpoints

---

## 📝 License

MIT License - feel free to use for your own projects.

---

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 👤 Author

**Sayyedsohaib M Yallur**

- GitHub: [@Sahilyallur](https://github.com/Sahilyallur/AI_Chatbot)

---

## 🙏 Acknowledgments

- [OpenRouter](https://openrouter.ai/) for unified LLM API access
- [Mermaid](https://mermaid.js.org/) for diagram rendering
- [Tesseract.js](https://tesseract.projectnaptha.com/) for OCR capabilities