# AI Chatbot Platform

A full-stack, scalable chatbot platform with JWT authentication, project management, and LLM-powered conversations using OpenRouter API.

![AI Chatbot Platform](https://img.shields.io/badge/Node.js-18+-green) ![React](https://img.shields.io/badge/React-18-blue) ![SQLite](https://img.shields.io/badge/SQLite-3-orange)

## ✨ Features

- **🔐 Secure Authentication**: JWT-based auth with bcrypt password hashing
- **📁 Project Management**: Create and manage multiple AI chatbot agents
- **💬 Real-time Chat**: Streaming responses from multiple LLM providers
- **📝 Prompt Templates**: Save and reuse prompts across conversations
- **📎 File Upload**: Attach files to your projects
- **🎨 Modern UI**: Beautiful dark-themed interface with smooth animations

## 🏗️ Architecture

```
AI_Chatbot/
├── server/                 # Backend (Node.js + Express)
│   ├── index.js           # Entry point
│   ├── database/          # SQLite database setup
│   ├── middleware/        # Auth middleware
│   ├── routes/            # API endpoints
│   ├── services/          # LLM integration
│   └── utils/             # Helper functions
│
└── client/                 # Frontend (React + Vite)
    └── src/
        ├── api/           # API client
        ├── components/    # Reusable UI components
        ├── context/       # React context providers
        └── pages/         # Application pages
```

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and npm
- OpenRouter API key (get one at [openrouter.ai](https://openrouter.ai))

### 1. Install Dependencies

```bash
# Install backend dependencies
cd server
npm install

# Install frontend dependencies
cd ../client
npm install
```

### 2. Configure Environment

Edit `server/.env` and add your OpenRouter API key:

```env
PORT=3001
JWT_SECRET=your-secure-secret-key-here
OPENROUTER_API_KEY=your-openrouter-api-key-here
DEFAULT_MODEL=openai/gpt-3.5-turbo
```

### 3. Start the Application

```bash
# Terminal 1: Start backend server
cd server
npm run dev

# Terminal 2: Start frontend
cd client
npm run dev
```

### 4. Open in Browser

Navigate to `http://localhost:5173` to access the application.

## 📚 API Documentation

### Authentication

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/auth/register` | POST | Register new user |
| `/api/auth/login` | POST | Login user |

### Projects

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/projects` | GET | List all projects |
| `/api/projects` | POST | Create new project |
| `/api/projects/:id` | GET | Get project details |
| `/api/projects/:id` | PUT | Update project |
| `/api/projects/:id` | DELETE | Delete project |

### Chat

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/projects/:id/messages` | GET | Get chat history |
| `/api/projects/:id/chat` | POST | Send message (streaming) |
| `/api/projects/:id/messages` | DELETE | Clear chat history |

### Prompts

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/projects/:id/prompts` | GET | List prompts |
| `/api/projects/:id/prompts` | POST | Create prompt |
| `/api/prompts/:id` | PUT | Update prompt |
| `/api/prompts/:id` | DELETE | Delete prompt |

### Files

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/projects/:id/files` | GET | List files |
| `/api/projects/:id/files` | POST | Upload file |
| `/api/files/:id` | GET | Download file |
| `/api/files/:id` | DELETE | Delete file |

## 🔧 Configuration

### Supported LLM Models

The platform supports any model available through OpenRouter:

- `openai/gpt-3.5-turbo` - Fast and cost-effective
- `openai/gpt-4` - Most capable OpenAI model
- `openai/gpt-4-turbo` - Latest GPT-4 with larger context
- `anthropic/claude-3-sonnet` - Balanced performance
- `anthropic/claude-3-opus` - Most capable Claude model
- `google/gemini-pro` - Google's latest model
- `meta-llama/llama-3-70b-instruct` - Open-source alternative

### System Prompt

Each project can have its own system prompt that defines the AI's personality:

```
You are a helpful customer support agent for Acme Corp.
You should be friendly, professional, and always try to help solve customer issues.
If you don't know something, admit it and offer to connect them with a human agent.
```

## 🛡️ Security Features

- **Password Hashing**: bcrypt with salt rounds
- **JWT Authentication**: Secure token-based auth with expiration
- **SQL Parameterization**: Protection against SQL injection
- **Input Validation**: Server-side validation on all inputs
- **CORS Configuration**: Restricted to allowed origins

## 📦 Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 18, Vite, React Router |
| Backend | Node.js, Express |
| Database | SQLite (better-sqlite3) |
| Auth | JWT, bcryptjs |
| LLM | OpenRouter API |
| Styling | Custom CSS with CSS Variables |

## 🔄 Scaling for Production

To scale this application for production:

1. **Database**: Migrate from SQLite to PostgreSQL
   - Change `better-sqlite3` to `pg` package
   - Update connection string in environment

2. **Session Management**: Add Redis for session storage

3. **Containerization**: Use Docker for deployment
   ```dockerfile
   FROM node:18-alpine
   WORKDIR /app
   COPY package*.json ./
   RUN npm install --production
   COPY . .
   CMD ["node", "index.js"]
   ```

4. **Load Balancing**: Deploy behind nginx or a cloud load balancer

## 📝 License

MIT License - feel free to use for your own projects.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.