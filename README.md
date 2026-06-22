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

### 🎙️ AI-Powered Mock Interviews
- Choose from **11+ technical domains** — JavaScript, React, Python, System Design, Cybersecurity, and more.
- Rivolo, the AI interviewer, asks one question at a time and evaluates your answer with a **score, strengths, and areas for improvement**.
- Adaptive questioning that generates unique, non-repeating questions for each session.

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
| **Frontend** | Next.js 16, React, TypeScript, Tailwind CSS, shadcn/ui, Framer Motion |
| **Backend** | Node.js, Express 5, Mongoose |
| **Database** | MongoDB Atlas |
| **AI Engine** | Groq API (LLaMA models) |
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
│       ├── middleware/        # JWT auth middleware
│       ├── models/           # Mongoose schemas (User, Interview)
│       ├── routes/           # API route definitions
│       └── utils/            # Retry logic & helpers
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
