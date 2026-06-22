<div align="center">

# 🤖 Rivolo — AI Mock Interview Assistant

**An intelligent, full-stack web application that conducts realistic mock interviews powered by AI, analyzes your resume, and provides actionable feedback to help you land your dream job.**

**Live Demo:** [https://rivolo-ai-interview.vercel.app/](https://rivolo-ai-interview.vercel.app/)

[![Next.js](https://img.shields.io/badge/Next.js-16-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![Express.js](https://img.shields.io/badge/Express-5-000000?style=for-the-badge&logo=express)](https://expressjs.com/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-47A248?style=for-the-badge&logo=mongodb)](https://www.mongodb.com/)
[![Groq](https://img.shields.io/badge/Groq-AI-F55036?style=for-the-badge)](https://groq.com/)

</div>

---

## ✨ Features

### 🎙️ AI-Powered Adaptive Mock Interviews
- Choose from **11+ technical domains** — JavaScript, React, Python, System Design, Cybersecurity, and more.
- **Adaptive Interview Engine**: Rivolo dynamically adjusts the difficulty of questions (Easy → Medium → Hard) based on your real-time performance. Answer strongly (score >= 7), and the engine dives deeper into advanced concepts. Struggle (score < 5), and it gracefully scales down to foundational topics to help you recover.
- **Contextual Follow-ups**: The AI maintains full interview context. The engine parses your previous performance and the exact topic of the last question, forcing the LLM to generate logical follow-up questions rather than picking random topics.
- **Anti-Abuse Mechanisms (Hashing)**: 
  - *Repeated Answer Detection*: Answers are hashed and stored. If you try to paste the exact same text again, the AI detects it, issues a warning in the chat, and slaps a 3-point penalty on your answer.
  - *Duplicate Question Prevention*: All AI-generated questions are normalized, hashed, and tracked. The engine checks every newly generated question against the history to guarantee it is 100% unique, forcing the LLM to regenerate up to 3 times if it creates a duplicate.
- **Robust Scoring System**: Scores are calculated using a weighted difficulty algorithm where questions have absolute caps (Easy maxes out at 60 points, Medium at 80, Hard at 100). The final score averages points across the expected 5 questions. Skipping questions or early exits penalize your score naturally by contributing 0 points.
- **Markdown Rich Feedback**: After every answer, receive beautifully formatted, detailed explanations powered by `react-markdown` and `@tailwindcss/typography`, complete with code snippets, bolding, and real-world examples to help you prepare.
- **Adaptive Progression Report**: Upon finishing, get a timeline of your interview plotted on your Dashboard showing your Start Level, Peak Level, End Level, and a summarized trajectory of your performance.

### 📄 Resume Analysis
- Upload your PDF resume and get an **AI-powered analysis** with domain-specific recommendations.
- Detailed breakdown of strengths, areas for improvement, and suggested interview topics based on your resume content.

### 📊 Performance Dashboard
- Visual charts (Radar + Bar) tracking your interview scores across domains.
- Historical session data so you can see your improvement over time.

### 🔐 Secure Authentication
- JWT-based auth with bcrypt password hashing.
- Complete **Forgot Password** flow with tokenized email reset links.
- Enterprise-grade security with Helmet, CORS lock-down, NoSQL injection prevention, and brute-force protection.

### 🎨 Premium UI/UX
- Sleek, modern dark-mode interface built with **shadcn/ui** components.
- Fully responsive design optimized for desktop, tablet, and mobile (including iOS Safari).
- Smooth animations powered by Framer Motion.

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | Next.js 16, React, TypeScript, Tailwind CSS, shadcn/ui, Framer Motion, react-markdown |
| **Backend** | Node.js, Express 5, Mongoose |
| **Database** | MongoDB Atlas |
| **AI Engine** | Groq API (LLaMA-3.3-70b-versatile) |
| **Security** | Helmet, express-rate-limit, express-mongo-sanitize, hpp, bcryptjs, JWT |
| **Email** | Nodemailer (Ethereal for dev, configurable for production SMTP) |

---

## 🚀 Getting Started

### Prerequisites
- **Node.js** v18+
- **MongoDB** (Atlas cluster or local instance)
- **Groq API Key** — [Get one free here](https://console.groq.com/)

### 1. Clone the repository

```bash
git clone https://github.com/kairos-ix/rivolo-ai-interview.git
cd rivolo-ai-interview
```

### 2. Set up the Backend

```bash
cd server
npm install
```

Create a `.env` file in the `server/` directory (see `.env.example`):

```env
GROQ_API_KEY=your_groq_api_key
JWT_SECRET=your_random_jwt_secret
MONGO_URI=your_mongodb_connection_string
PORT=5000
CLIENT_URL=http://localhost:3000
```

Start the backend:

```bash
npm run dev
```

### 3. Set up the Frontend

```bash
cd ../client
npm install
npm run dev
```

The app will be running at **http://localhost:3000** 🎉

---

## 📁 Project Structure

```
rivolo-ai-interview/
├── client/                   # Next.js frontend
│   ├── app/                  # App router pages
│   │   ├── dashboard/        # Performance analytics
│   │   ├── forgot-password/  # Password reset request
│   │   ├── history/          # Interview history
│   │   ├── interview/        # Live AI interview
│   │   ├── login/            # User login
│   │   ├── practice/         # Domain selection
│   │   ├── register/         # User registration
│   │   └── reset-password/   # Password reset form
│   ├── components/           # Reusable UI components
│   ├── context/              # Auth context provider
│   ├── hooks/                # Custom React hooks
│   └── lib/                  # Axios instance & utilities
│
├── server/                   # Express.js backend
│   └── src/
│       ├── config/           # Database connection
│       ├── controllers/      # Route handlers (auth, interview, resume)
│       ├── middleware/       # JWT auth middleware
│       ├── models/           # Mongoose schemas (User, Interview)
│       ├── routes/           # API route definitions
│       └── utils/            # Adaptive Engine, hashing, and Groq retry logic
│
└── README.md
```

---

## 🔒 Security Features

| Protection | Implementation |
|---|---|
| **XSS / Clickjacking** | Helmet HTTP security headers |
| **NoSQL Injection** | express-mongo-sanitize strips `$` operators from input |
| **Brute Force** | Strict rate limiting on auth endpoints (10 req/15 min) |
| **Parameter Pollution** | hpp middleware strips duplicate query params |
| **CORS** | Restricted to frontend origin only |
| **Password Storage** | bcrypt with 10 salt rounds |
| **Token Security** | SHA-256 hashed reset tokens with 1-hour expiry |


---

## 🤝 Contributing

Contributions, issues, and feature requests are welcome! Feel free to check the [issues page](https://github.com/kairos-ix/rivolo-ai-interview/issues).

1. Fork the project
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📜 License

This project is open source and available under the [MIT License](LICENSE).

---

<div align="center">

**Made with ❤️ by [Sahil Maurya](https://github.com/kairos-ix) (also known as kairos)**

[![GitHub](https://img.shields.io/badge/GitHub-kairos--ix-181717?style=flat-square&logo=github)](https://github.com/kairos-ix)
[![LinkedIn](https://img.shields.io/badge/LinkedIn-Sahil%20Maurya-0A66C2?style=flat-square&logo=linkedin)](https://www.linkedin.com/in/sahil-maurya-525579260/)
[![Instagram](https://img.shields.io/badge/Instagram-kairos.ix-E4405F?style=flat-square&logo=instagram)](https://instagram.com/kairos.ix)

</div>
