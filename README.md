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

Rivolo is a comprehensive platform built for students, professionals, and mentors. It bridges the gap between learning and getting hired by providing a highly adaptive AI interview engine, a placement readiness tracker, and a mentor review system. Whether you are practicing for your first internship or a senior engineering role, Rivolo adapts to your skill level in real-time.

---

## Core Features

### AI-Powered Adaptive Mock Interviews
- **Domain Selection:** Choose from over 11 technical domains, including JavaScript, React, Python, System Design, Cybersecurity, Data Science, and more.
- **Adaptive Interview Engine:** Rivolo dynamically adjusts the difficulty of questions (Easy to Medium to Hard) based on your real-time performance. If you answer strongly, the engine dives deeper into advanced concepts. If you struggle, it scales down to foundational topics to help you recover.
- **Contextual Follow-ups:** The AI maintains full interview context. The engine parses your previous performance and the exact topic of the last question, forcing the LLM to generate logical follow-up questions rather than picking random topics.
- **Anti-Abuse Mechanisms (Hashing):** 
  - *Repeated Answer Detection:* Answers are hashed and stored. If you try to paste the exact same text again, the AI detects it, issues a warning, and applies a penalty to your score.
  - *Duplicate Question Prevention:* All AI-generated questions are normalized, hashed, and tracked to guarantee they are 100% unique, forcing the LLM to regenerate if it creates a duplicate.
- **Robust Scoring System:** Scores are calculated using a weighted difficulty algorithm. Easy questions cap at lower scores, while Hard questions yield maximum points.
- **Rich Feedback:** Receive detailed, formatted explanations after every answer, complete with code snippets and real-world examples.

### Placement Readiness Engine
- **Holistic Analysis:** The placement engine analyzes your overall performance across all interview domains.
- **Readiness Classification:** Get categorized as "Placement Ready", "High Potential Candidate", or needing improvement based on your scores and candidate type (Fresher, Internship, Experienced).
- **Personalized Roadmap:** Generates an actionable roadmap highlighting specific technologies, projects, and certifications you need to focus on to become placement-ready.
- **Customizable Weights:** Adjust the scoring configuration (Interview Weight, Resume Weight, Skill Breadth Weight) to match the criteria of your target companies.

### Resume Analysis
- **AI Breakdown:** Upload your PDF, DOCX, or TXT resume and get an instant AI-powered analysis.
- **Skill Detection:** Automatically detects frameworks, languages, and tools to gauge your experience level (Junior, Mid, Senior).
- **Domain Recommendations:** Suggests the best interview domains to practice based on your resume's content.

### Mentor and Admin Dashboards
- **Mentor Review System:** Mentors can view student interview transcripts, read the AI's feedback, and provide their own human-in-the-loop constructive feedback.
- **Admin Controls:** Comprehensive admin dashboard to manage users, assign roles (Student, Mentor, Admin), track platform metrics, and restrict abusive accounts.

### Challenge Arena & Recruiter Sim
- **Challenge Arena:** Daily coding and conceptual challenges with leaderboards to keep you engaged.
- **Recruiter Sim:** Company-specific interview simulations tailored to the hiring patterns of top tech companies.

### Performance Dashboard
- **Visual Analytics:** View Radar and Bar charts tracking your proficiency across different domains.
- **Historical Data:** Review past sessions to track your progression over time and identify weak areas.

---

## Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | Next.js 16, React, TypeScript, Tailwind CSS, shadcn/ui, Framer Motion, Recharts |
| **Backend** | Node.js, Express 5, Mongoose |
| **Database** | MongoDB Atlas |
| **AI Engine** | Groq API (LLaMA-3.3-70b-versatile) |
| **Security** | Helmet, express-rate-limit, xss (inline sanitization), express-mongo-sanitize, bcrypt, JWT |
| **Email** | Nodemailer (OTP generation and password resets) |

---

## Getting Started

### Prerequisites
- **Node.js** v18 or higher
- **MongoDB** (Atlas cluster or local instance)
- **Groq API Key** (Obtain one for free at the Groq Console)

### 1. Clone the repository

```bash
git clone https://github.com/kairos-ix/rivolo-ai-interview.git
cd rivolo-ai-interview
```

### 2. Set up the Backend

Navigate to the server directory and install dependencies:

```bash
cd server
npm install
```

Create a `.env` file in the `server/` directory and add the following variables:

```env
GROQ_API_KEY=your_groq_api_key
JWT_SECRET=your_random_jwt_secret
MONGO_URI=your_mongodb_connection_string
PORT=5000
CLIENT_URL=http://localhost:3000
EMAIL_USER=your_smtp_email
EMAIL_PASS=your_smtp_password
```

Start the backend development server:

```bash
npm run dev
```

### 3. Set up the Frontend

Open a new terminal window, navigate to the client directory, and install dependencies:

```bash
cd client
npm install
```

Start the frontend development server:

```bash
npm run dev
```

The application will be running at **http://localhost:3000**.

---

## Project Structure

```text
rivolo-ai-interview/
├── client/                   # Next.js frontend application
│   ├── app/                  # App router pages (Dashboard, Admin, Mentor, etc.)
│   ├── components/           # Reusable UI components (shadcn/ui, Layouts)
│   ├── context/              # React Context for global state (Auth)
│   ├── hooks/                # Custom React hooks
│   └── lib/                  # Utility functions and API configuration
│
├── server/                   # Express.js backend API
│   └── src/
│       ├── config/           # Database and environment configuration
│       ├── controllers/      # Route handlers for business logic
│       ├── middleware/       # JWT auth, rate limiters, error handling
│       ├── models/           # Mongoose schemas
│       ├── routes/           # Express route definitions
│       └── utils/            # AI Engine logic, hashing, and email services
│
└── README.md                 # Project documentation
```

---

## Security Features

Security is a first-class citizen in Rivolo. The application implements multiple layers of protection:

| Protection | Implementation Details |
|---|---|
| **XSS Prevention** | Custom inline sanitization middleware processing all incoming request bodies and parameters. |
| **NoSQL Injection** | `express-mongo-sanitize` strips operator keys from input data. |
| **Brute Force Defense** | Strict rate limiting on authentication endpoints (e.g., 10 requests per 15 minutes). |
| **Parameter Pollution** | `hpp` middleware ignores duplicate query parameters. |
| **CORS Policy** | API access is strictly limited to authorized frontend origins. |
| **Data Encryption** | Passwords are hashed using `bcrypt` with 10 salt rounds. |
| **Session Security** | JWT-based authentication with secure token handling. |

---

## Contributing

Contributions, bug reports, and feature requests are highly appreciated. 

1. Fork the project.
2. Create your feature branch (`git checkout -b feature/amazing-feature`).
3. Commit your changes (`git commit -m 'Add an amazing feature'`).
4. Push to the branch (`git push origin feature/amazing-feature`).
5. Open a Pull Request for review.

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
