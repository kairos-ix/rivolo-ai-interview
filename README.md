<div align="center">

# Rivolo - AI Mock Interview Assistant

**An intelligent, full-stack web application designed to conduct realistic mock interviews powered by AI, analyze your resume, and provide actionable, personalized feedback to help you land your dream job.**

*This project was developed as part of an internship program to demonstrate advanced full-stack development, AI integration, and robust security practices.*

**Live Demo:** [https://rivolo-ai-interview.vercel.app/](https://rivolo-ai-interview.vercel.app/)

[![Next.js](https://img.shields.io/badge/Next.js-16-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![Express.js](https://img.shields.io/badge/Express-5-000000?style=for-the-badge&logo=express)](https://expressjs.com/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-47A248?style=for-the-badge&logo=mongodb)](https://www.mongodb.com/)
[![Groq](https://img.shields.io/badge/Groq-AI-F55036?style=for-the-badge)](https://groq.com/)
[![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css)](https://tailwindcss.com/)

</div>

---

## 📖 Table of Contents

1. [Overview & Problem Statement](#-overview--problem-statement)
2. [Core Features Deep Dive](#-core-features-deep-dive)
    - [AI-Powered Adaptive Engine](#1-ai-powered-adaptive-engine)
    - [Placement Readiness Analytics](#2-placement-readiness-analytics)
    - [Intelligent Resume Analysis](#3-intelligent-resume-analysis)
    - [Human-in-the-Loop Mentorship](#4-human-in-the-loop-mentorship)
3. [Technical Architecture](#-technical-architecture)
4. [Security Infrastructure](#-security-infrastructure)
5. [Local Development Setup](#-local-development-setup)
6. [Project Structure](#-project-structure)
7. [Future Roadmap](#-future-roadmap)
8. [Contributing](#-contributing)
9. [License](#-license)

---

## 🎯 Overview & Problem Statement

Technical interviews are notoriously difficult to prepare for. Traditional preparation involves grinding static algorithmic questions or reading rigid behavioral guides, neither of which accurately simulate the dynamic, high-pressure environment of a real interview.

**Rivolo** solves this by leveraging high-speed Large Language Models (LLMs) to create an **Adaptive Mock Interview Engine**. Rather than asking static questions, Rivolo acts like a real interviewer: it evaluates your answers in real-time, adjusts the difficulty of the next question based on your competence, detects if you are attempting to cheat, and provides rich, contextual feedback. It bridges the gap between theoretical knowledge and practical interview readiness.

---

## ✨ Core Features Deep Dive

### 1. AI-Powered Adaptive Engine
The heartbeat of Rivolo is its custom interview engine, powered by the **Groq API** (utilizing the LLaMA-3.3-70b-versatile model). Groq's LPU (Language Processing Unit) architecture allows for ultra-low latency inference, making the chat feel instantaneous and conversational.

- **Dynamic Difficulty Scaling Algorithm:** The interview does not follow a set script. Each response is scored on a scale. 
  - **High Performance (Score > 7):** The engine shifts the system prompt to increase complexity, asking deep dive, edge-case, or architectural questions.
  - **Low Performance (Score < 5):** The engine gracefully scales down to foundational or definitional topics to rebuild the candidate's confidence and accurately measure their base competency.
- **Contextual Memory & Follow-ups:** The backend parses the exact topic of the preceding question and the nuances of the user's answer. It instructs the LLM to generate logical follow-ups (e.g., *"You mentioned using React Context for state management. How would you prevent unnecessary re-renders when the context value changes?"*).
- **Advanced Anti-Abuse & Integrity Mechanisms:** 
  - *Repeated Answer Detection:* Every user answer is hashed and tracked in memory. If a user pastes the same text twice, the AI detects the anomaly, issues a strict warning in the chat UI, and applies a rigid penalty to the score.
  - *Hallucination & Duplicate Prevention:* All AI-generated questions are normalized (stripping punctuation and casing), hashed, and logged. Before serving a new question, the engine checks it against the history array. If it is a duplicate, it forces the LLM to regenerate up to 3 times to guarantee 100% uniqueness.
- **Granular Scoring:** Final scores are not simple averages. They are calculated using a weighted difficulty algorithm. Easy questions have lower score ceilings, while answering Hard questions correctly yields maximum points. Skipping questions or abandoning the session penalizes the final average.

### 2. Placement Readiness Analytics
Rivolo doesn't just conduct interviews; it tells you if you are actually ready for the job market through a holistic analytics module.

- **Data Aggregation:** The engine aggregates data across all completed domains, factoring in the difficulty tiers reached, average scores, and time consistency.
- **Categorization Matrix:** Based on the candidate's profile (Fresher, Internship, Experienced), the system assigns a distinct readiness tier:
  - *Placement Ready* (Excellent track record across domains)
  - *High Potential Candidate* (Strong in some areas, weak in others)
  - *Needs Improvement* (Foundational gaps detected)
- **Automated Roadmap Generation:** Using the identified weak areas, communication gaps, and missing skills, the engine generates a structured, step-by-step roadmap. It prescribes specific technologies to learn, side projects to build, and theoretical concepts to study.
- **Customizable Weighting Configurations:** Users can adjust the mathematical weights assigned to Interview Performance, Resume Strength, and Skill Breadth, allowing them to tailor the readiness score to the criteria of specific target companies.

### 3. Intelligent Resume Analysis
- **Multi-Format Extraction Pipeline:** Users can upload PDF, DOCX, or TXT resumes. The backend utilizes specific parsing libraries to extract raw textual data seamlessly while preserving structure where possible.
- **Schema-Driven LLM Parsing:** The raw text is fed into the LLM alongside a strict JSON schema. The LLM is instructed to bypass conversational pleasantries and strictly output a JSON object containing detected frameworks, programming languages, methodologies, and tools.
- **Experience Level Assessment:** The system heuristically gauges the user's experience level (Junior, Mid, Senior) based on phrasing, project scope, and listed responsibilities.
- **Actionable Recommendations:** Cross-references extracted skills with Rivolo's available mock interview modules and suggests the most relevant domains for the user to practice.

### 4. Human-in-the-Loop Mentorship
While AI is powerful, human nuance is irreplaceable. Rivolo features a comprehensive mentor ecosystem.
- **Role-Based Access Control (RBAC):** Distinct dashboards and access levels for Students, Mentors, and Administrators.
- **Mentor Dashboard:** Verified mentors can oversee student performance. They have access to entire historical interview transcripts, the AI's automated feedback, and the student's progression metrics.
- **Nuanced Feedback Loop:** Mentors can override or supplement AI feedback with their own constructive, human-in-the-loop reviews, providing personalized guidance that an LLM might miss.
- **Administrative Governance:** Platform owners can manage users, assign roles, track global platform metrics, and suspend abusive or spam accounts.

---

## 🏗️ Technical Architecture

Rivolo is built on a modern, decoupled Client-Server architecture ensuring scalability, maintainability, and high performance.

### Frontend (Client Application)
- **Framework:** **Next.js 16** utilizing the App Router paradigm for optimized server-side rendering (SSR) and seamless client-side navigation.
- **Language:** **React 18** with **TypeScript** for strict type safety and predictable data flow.
- **Styling:** **Tailwind CSS**, heavily utilizing **`shadcn/ui`** for accessible, headless, and customizable UI components.
- **Animations:** **Framer Motion** powers all fluid transitions, modal overlays, and micro-interactions.
- **Data Visualization:** **Recharts** is used to render dynamic, interactive Radar and Bar charts on the performance dashboards.
- **State Management:** **React Context API** handles global authentication and session state without the boilerplate of Redux.

### Backend (REST API Server)
- **Runtime:** **Node.js**
- **Framework:** **Express.js 5** (Leveraging modern routing and native Promise handling).
- **Database:** **MongoDB Atlas**, structured and accessed via the **Mongoose ODM**.
- **AI Integration:** **Groq API SDK** is used for interfacing with LLaMA models, chosen specifically for its unparalleled tokens-per-second generation speed, which is crucial for real-time conversational interfaces.
- **Email Services:** **Nodemailer** handles the generation and dispatch of secure OTPs and password reset links.

---

## 🔒 Security Infrastructure

Security is treated as a first-class citizen in the Rivolo architecture. The application implements multiple defensive layers to protect user data and ensure platform stability:

| Threat Vector | Implementation Details & Defenses |
|---|---|
| **Cross-Site Scripting (XSS)** | We implemented a custom, highly robust recursive inline sanitization middleware (using the `xss` library). It traverses and sanitizes all incoming `req.body`, `req.query`, and `req.params` objects in-place. This custom solution was built specifically to be compatible with Express 5's read-only getter restrictions, preventing hydration errors and script injections. |
| **NoSQL Injection** | Utilizes `express-mongo-sanitize` to recursively strip `$` and `.` operator keys from all input data before it ever touches Mongoose queries. |
| **Brute Force & DDoS** | Strict rate limiting (`express-rate-limit`) is applied globally, with tighter restrictions on authentication endpoints (e.g., maximum of 10 requests per 15 minutes per IP address for login/register). |
| **HTTP Parameter Pollution** | `hpp` middleware is deployed to actively ignore malicious duplicate query parameters that could confuse backend logic. |
| **Header Security & Clickjacking** | `Helmet` is configured to set strict HTTP security headers, including `Content-Security-Policy`, `X-Frame-Options`, and `Strict-Transport-Security` (HSTS). |
| **Data Encryption** | Passwords are never stored in plaintext. They are securely hashed using `bcryptjs` with 10 salt rounds before database insertion. |
| **Session Integrity** | Stateless, JWT-based authentication. Password reset workflows utilize secure, SHA-256 hashed tokens stored in the database with a strict, rolling 1-hour expiration window. |

---

## 💻 Local Development Setup

To run Rivolo locally for development or testing, follow these steps meticulously.

### Prerequisites
- **Node.js** (v18.0.0 or higher recommended).
- **MongoDB** (An active MongoDB Atlas cluster connection string, or a local MongoDB daemon running on your machine).
- **Groq API Key** (Obtain a free API key from the [Groq Developer Console](https://console.groq.com/)).

### 1. Clone the Repository

```bash
git clone https://github.com/kairos-ix/rivolo-ai-interview.git
cd rivolo-ai-interview
```

### 2. Configure the Backend (Server)

Navigate to the server directory and install the required NPM packages:

```bash
cd server
npm install
```

Create a `.env` file in the root of the `server/` directory. Populate it with the following variables, ensuring you replace the placeholder values with your actual credentials:

```env
# Server Configuration
PORT=5000
CLIENT_URL=http://localhost:3000

# Database
MONGO_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/rivolo?retryWrites=true&w=majority

# Authentication
JWT_SECRET=generate_a_very_long_random_string_here_for_security

# AI Integration
GROQ_API_KEY=gsk_your_groq_api_key_here

# Email Services (Optional, for password resets)
EMAIL_USER=your_smtp_email_address@gmail.com
EMAIL_PASS=your_smtp_app_password
```

Start the backend development server using nodemon:

```bash
npm run dev
```
*(You should see console logs confirming that the server is running on port 5000 and successfully connected to MongoDB).*

### 3. Configure the Frontend (Client)

Open a new terminal window, navigate to the client directory, and install its dependencies:

```bash
cd client
npm install
```

*(Note: The frontend does not strictly require a `.env` file for local development if the backend is running on port 5000, as Axios is configured to proxy requests appropriately. However, ensure `axiosInstance` in `lib/axios.ts` points to `http://localhost:5000` if modifying).*

Start the Next.js development server:

```bash
npm run dev
```

The application will now be accessible in your browser at **http://localhost:3000**.

---

## 📁 Project Directory Structure

A high-level overview of the codebase to help you navigate:

```text
rivolo-ai-interview/
├── client/                     # Next.js Frontend Application
│   ├── app/                    # Next.js App Router Pages
│   │   ├── admin/              # Administrative dashboard and user management
│   │   ├── dashboard/          # Student performance analytics and metrics
│   │   ├── interview/          # The live conversational AI interview interface
│   │   ├── mentor/             # Mentor review dashboard and transcripts
│   │   ├── placement/          # Placement Readiness Engine analytics
│   │   └── (auth)/             # Login, Register, Forgot Password flows
│   ├── components/             # Reusable UI Components
│   │   ├── ui/                 # Atomic shadcn/ui components (Buttons, Cards, Inputs)
│   │   └── ...                 # Composite components (ChatContainers, Navbars)
│   ├── context/                # React Context providers (AuthContext)
│   ├── hooks/                  # Custom React hooks (useAuth, useClickOutside)
│   └── lib/                    # Utility functions and centralized Axios configuration
│
├── server/                     # Express.js Backend API
│   └── src/
│       ├── config/             # Database initialization (db.js)
│       ├── controllers/        # Business logic for routes
│       │   ├── authController.js
│       │   ├── interviewController.js
│       │   ├── resumeController.js
│       │   └── mentorController.js
│       ├── middleware/         # Express middleware
│       │   ├── auth.js         # JWT verification and RBAC checks
│       │   ├── rateLimiter.js  # Brute force protection
│       │   └── sanitizer.js    # Custom XSS prevention logic
│       ├── models/             # Mongoose schemas (User, Interview, Session)
│       ├── routes/             # Express API route definitions
│       └── utils/              # Core utilities (AI Engine logic, Hashing, Nodemailer)
│
└── README.md                   # Primary project documentation
```

---

## 🔮 Future Roadmap

Rivolo is continuously evolving. Planned upcoming features include:
1. **Voice-to-Text & Text-to-Voice:** Integrating WebRTC and Whisper/ElevenLabs APIs to conduct actual spoken interviews.
2. **Integrated Code Sandbox:** Allowing candidates to write and execute code in the browser during technical interviews, with the AI analyzing the compilation results.
3. **Peer-to-Peer Mock Interviews:** A matchmaking system allowing students to conduct mock interviews with each other.

---

## 🤝 Contributing

Contributions, bug reports, and feature requests are highly appreciated! 

1. **Fork** the project repository.
2. **Create** your feature branch (`git checkout -b feature/amazing-feature`).
3. **Commit** your changes with descriptive, conventional commit messages (`git commit -m 'feat: add an amazing feature'`).
4. **Push** to your branch (`git push origin feature/amazing-feature`).
5. **Open a Pull Request** for review and integration.

---

## 📜 License

This project is open source and available under the [MIT License](LICENSE).

---

<div align="center">

**Developed by Sahil Maurya (kairos)**

[![GitHub](https://img.shields.io/badge/GitHub-kairos--ix-181717?style=flat-square&logo=github)](https://github.com/kairos-ix)
[![LinkedIn](https://img.shields.io/badge/LinkedIn-Sahil%20Maurya-0A66C2?style=flat-square&logo=linkedin)](https://www.linkedin.com/in/sahil-maurya-525579260/)
[![Instagram](https://img.shields.io/badge/Instagram-kairos.ix-E4405F?style=flat-square&logo=instagram)](https://instagram.com/kairos.ix)

</div>
