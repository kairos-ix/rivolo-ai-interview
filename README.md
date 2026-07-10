<div align="center">

# Rivolo - AI Mock Interview Assistant

**An intelligent, full-stack web application designed to conduct realistic mock interviews powered by AI, analyze your resume, and provide actionable, personalized feedback to help you land your dream job.**

*This project was developed as part of an internship program.*

**Live Demo:** [https://rivolo-ai-interview.vercel.app/](https://rivolo-ai-interview.vercel.app/)

[![Next.js](https://img.shields.io/badge/Next.js-16-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![Express.js](https://img.shields.io/badge/Express-5-000000?style=for-the-badge&logo=express)](https://expressjs.com/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-47A248?style=for-the-badge&logo=mongodb)](https://www.mongodb.com/)
[![Groq](https://img.shields.io/badge/Groq-AI-F55036?style=for-the-badge)](https://groq.com/)

</div>

---

## Overview

Rivolo is a comprehensive platform built for students, professionals, and mentors. It bridges the gap between theoretical learning and practical hiring requirements by providing a highly adaptive AI interview engine, a placement readiness tracker, and a human-in-the-loop mentor review system. Whether you are practicing for your first internship or a senior engineering role, Rivolo evaluates your skill level in real-time, identifies your weaknesses, and gives you a structured path to improvement.

---

## Core Features & Architecture

### 1. AI-Powered Adaptive Mock Interviews
The core of Rivolo is a highly sophisticated interview engine powered by the Groq API (utilizing the LLaMA-3.3-70b-versatile model for ultra-low latency inference).
- **Domain Selection:** Candidates can choose from over 11 technical domains, including JavaScript, React, Python, System Design, Cybersecurity, Data Science, and General Behavioral.
- **Adaptive Difficulty Scaling:** Rivolo dynamically adjusts the difficulty of questions (Easy, Medium, Hard) based on real-time performance. If a candidate answers strongly, the engine transitions to advanced concepts to test their limits. If a candidate struggles, it gracefully scales down to foundational topics to rebuild confidence and measure base competency.
- **Contextual Follow-ups:** The AI maintains full conversational context. The backend engine parses previous performance and the exact topic of the last question, instructing the LLM to generate logical follow-up questions rather than pulling from a randomized list.
- **Advanced Anti-Abuse Mechanisms:** 
  - *Repeated Answer Detection:* Answers are securely hashed and tracked in memory. If a user attempts to paste the exact same text for multiple questions, the AI detects the anomaly, issues a strict warning, and applies a penalty to the final score.
  - *Duplicate Question Prevention:* All AI-generated questions are normalized, hashed, and tracked across the session. The engine checks every newly generated question against this history to guarantee 100% uniqueness, forcing the LLM to regenerate (up to 3 times) if it hallucinates a duplicate.
- **Robust Scoring Algorithm:** Scores are calculated using a weighted difficulty algorithm. Easy questions have lower score caps, while Hard questions yield maximum points. Skipping questions or abandoning the interview early penalizes the final average appropriately.
- **Rich Markdown Feedback:** Responses are parsed through `react-markdown` and styled with Tailwind Typography, providing beautifully formatted explanations complete with code snippets, bolded terms, and real-world examples.

### 2. Placement Readiness Engine
A holistic analytics module designed to give candidates a macro view of their employability.
- **Comprehensive Analysis:** The engine aggregates performance data across all completed interview domains, factoring in difficulty levels, average scores, and time taken.
- **Readiness Classification:** Based on the aggregated data and the user's candidate profile (Fresher, Internship, Experienced), the engine assigns a distinct readiness tier (e.g., "Placement Ready", "High Potential Candidate").
- **Gap Identification:** Uses data visualization to highlight specific weak areas, recurring communication gaps, and missing technical skills.
- **Personalized Roadmap Generation:** Generates a structured, step-by-step roadmap highlighting the specific technologies, side projects, and theoretical concepts the user needs to study to bridge their specific knowledge gaps.
- **Customizable Weighting Configurations:** Users can adjust how their readiness score is calculated by modifying the weights assigned to Interview Performance, Resume Strength, and Skill Breadth, allowing them to tailor the system to specific company profiles.

### 3. Intelligent Resume Analysis
- **Multi-Format Parsing:** Users can upload PDF, DOCX, or TXT resumes. The backend utilizes specific parsing libraries to extract raw text seamlessly.
- **AI Breakdown & Extraction:** The raw text is fed into the LLM with a strict JSON schema, instructing it to automatically detect frameworks, programming languages, methodologies, and tools.
- **Experience Level Assessment:** The system gauges the user's experience level (Junior, Mid, Senior) based on phrasing, project scope, and listed responsibilities.
- **Domain Recommendations:** Cross-references extracted skills with Rivolo's available mock interview modules and suggests the most relevant domains for the user to practice.

### 4. Human-in-the-Loop Mentorship System
- **Mentor Dashboard:** Verified mentors have access to a dedicated dashboard where they can oversee student performance.
- **Session Reviews:** Mentors can view entire interview transcripts, read the AI's automated feedback, and provide their own nuanced, human constructive feedback.
- **Admin Controls:** A comprehensive administrative dashboard allows platform owners to manage users, assign role-based access controls (Student, Mentor, Admin), track global platform metrics, and suspend abusive accounts.

### 5. Challenge Arena & Recruiter Sim
- **Challenge Arena:** A dedicated space for daily coding and conceptual challenges. Includes competitive leaderboards to foster community engagement and continuous learning.
- **Recruiter Sim:** Specialized interview simulations tailored to mimic the exact hiring patterns, behavioral matrices, and technical bars of top-tier tech companies.

### 6. Visual Performance Dashboard
- **Analytics Display:** Interactive visual charts (including Radar and Bar charts built with Recharts) tracking proficiency and score distribution across different domains.
- **Historical Data:** A comprehensive history log allowing users to review past sessions, track their chronological progression, and identify persistent weak areas.

---

## Tech Stack & Architecture

### Frontend (Client)
- **Framework:** Next.js 16 (App Router)
- **Library:** React 18 with TypeScript for strict type safety
- **Styling:** Tailwind CSS, utilizing `shadcn/ui` for accessible, reusable components
- **Animations:** Framer Motion for fluid transitions and micro-interactions
- **Data Visualization:** Recharts for dynamic performance graphs
- **State Management:** React Context API for global authentication state

### Backend (Server)
- **Runtime:** Node.js
- **Framework:** Express.js 5
- **Database:** MongoDB Atlas, accessed via Mongoose ODM
- **AI Integration:** Groq API SDK (utilizing LLaMA models for high-speed generation)
- **Email Services:** Nodemailer for OTP generation and secure password reset workflows

---

## Security Infrastructure

Security is a primary focus of the Rivolo architecture. The application implements multiple defensive layers to protect user data and ensure platform stability:

| Protection Mechanism | Implementation Details |
|---|---|
| **Cross-Site Scripting (XSS)** | Implemented a custom recursive inline sanitization middleware (`xss` library) that processes all incoming request bodies, queries, and parameters in-place, compatible with Express 5's read-only getter restrictions. |
| **NoSQL Injection Defense** | Utilizes `express-mongo-sanitize` to recursively strip `$` and `.` operator keys from input data before it reaches Mongoose. |
| **Brute Force & DDoS Mitigation** | Strict rate limiting (`express-rate-limit`) applied to authentication endpoints (e.g., maximum of 10 requests per 15 minutes per IP address). |
| **HTTP Parameter Pollution** | `hpp` middleware deployed to ignore malicious duplicate query parameters. |
| **Header Security** | `Helmet` configured to set strict HTTP security headers (e.g., Content-Security-Policy, X-Frame-Options, Strict-Transport-Security). |
| **Data Encryption** | Passwords are securely hashed using `bcryptjs` with 10 salt rounds before database insertion. |
| **Authentication & Sessions** | Stateless JWT-based authentication. Password reset workflows utilize secure, SHA-256 hashed tokens with a strict 1-hour expiration window. |

---

## Local Development Setup

### Prerequisites
- **Node.js** v18 or higher installed on your machine.
- **MongoDB** (An active Atlas cluster connection string or a local MongoDB instance).
- **Groq API Key** (Can be obtained for free at the Groq Developer Console).

### 1. Clone the Repository

```bash
git clone https://github.com/kairos-ix/rivolo-ai-interview.git
cd rivolo-ai-interview
```

### 2. Configure the Backend

Navigate to the server directory and install required dependencies:

```bash
cd server
npm install
```

Create a `.env` file in the root of the `server/` directory and populate it with the following required variables:

```env
GROQ_API_KEY=your_groq_api_key_here
JWT_SECRET=your_secure_random_jwt_secret
MONGO_URI=your_mongodb_connection_string
PORT=5000
CLIENT_URL=http://localhost:3000
EMAIL_USER=your_smtp_email_address
EMAIL_PASS=your_smtp_email_password
```

Start the backend development server:

```bash
npm run dev
```
*(The server will initialize and connect to MongoDB on port 5000)*

### 3. Configure the Frontend

Open a new terminal window, navigate to the client directory, and install dependencies:

```bash
cd client
npm install
```

Start the Next.js development server:

```bash
npm run dev
```

The application will be accessible in your browser at **http://localhost:3000**.

---

## Project Directory Structure

```text
rivolo-ai-interview/
├── client/                   # Next.js frontend application
│   ├── app/                  # Next.js App Router (Dashboard, Admin, Mentor, Interview screens)
│   ├── components/           # Reusable UI components (shadcn/ui modules, custom layouts)
│   ├── context/              # React Context providers (AuthContext for global state)
│   ├── hooks/                # Custom React hooks (useAuth, etc.)
│   └── lib/                  # Utility functions and centralized Axios configuration
│
├── server/                   # Express.js backend API
│   └── src/
│       ├── config/           # Database initialization and environment configurations
│       ├── controllers/      # Route handlers (Auth, Interview, Resume, Mentor logic)
│       ├── middleware/       # Express middleware (JWT verification, rate limiters, sanitizers)
│       ├── models/           # Mongoose schemas (User, Interview, Session Data)
│       ├── routes/           # Express API route definitions mapping to controllers
│       └── utils/            # Core utilities (AI Engine logic, Hashing, Email Services)
│
└── README.md                 # Primary project documentation
```

---

## Contributing

Contributions, bug reports, and feature requests are highly appreciated. 

1. Fork the project repository.
2. Create your feature branch (`git checkout -b feature/amazing-feature`).
3. Commit your changes with descriptive messages (`git commit -m 'Add an amazing feature'`).
4. Push to your branch (`git push origin feature/amazing-feature`).
5. Open a Pull Request for review and integration.

---

## License

This project is open source and available under the MIT License.

---

<div align="center">

**Developed by Sahil Maurya (kairos)**

[![GitHub](https://img.shields.io/badge/GitHub-kairos--ix-181717?style=flat-square&logo=github)](https://github.com/kairos-ix)
[![LinkedIn](https://img.shields.io/badge/LinkedIn-Sahil%20Maurya-0A66C2?style=flat-square&logo=linkedin)](https://www.linkedin.com/in/sahil-maurya-525579260/)
[![Instagram](https://img.shields.io/badge/Instagram-kairos.ix-E4405F?style=flat-square&logo=instagram)](https://instagram.com/kairos.ix)

</div>
