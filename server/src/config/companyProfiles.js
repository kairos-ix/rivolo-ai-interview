const COMPANY_PROFILES = {
  google: {
    name: "Google",
    type: "product",
    tier: "FAANG",
    logo: "🔵",
    style: "Highly structured. Focuses on algorithmic thinking, data structures, system design at scale, and Googleyness behavioral questions.",
    questionPatterns: ["DSA (arrays, graphs, DP)", "System Design (distributed systems, scale)", "Behavioral (STAR format, leadership principles)", "Code clarity and optimization"],
    difficulty: "hard",
    evaluationCriteria: ["Problem decomposition", "Time/space complexity analysis", "Scalable system thinking", "Clear communication of approach"],
    focusAreas: ["Algorithms", "System Design", "Coding", "Behavioral"],
    passingBar: 75
  },
  amazon: {
    name: "Amazon",
    type: "product",
    tier: "FAANG",
    logo: "🟠",
    style: "Leadership Principles driven. Every question ties back to one of 16 LPs. Expect STAR behavioral rounds alongside DSA and system design.",
    questionPatterns: ["Leadership Principle behavioral (STAR)", "DSA medium-hard", "System Design (AWS-flavored)", "Ownership and customer obsession scenarios"],
    difficulty: "hard",
    evaluationCriteria: ["LP alignment", "Ownership mindset", "DSA correctness", "Customer-first thinking"],
    focusAreas: ["Leadership Principles", "DSA", "System Design", "Behavioral"],
    passingBar: 72
  },
  microsoft: {
    name: "Microsoft",
    type: "product",
    tier: "FAANG",
    logo: "🔷",
    style: "Collaborative and growth-mindset focused. Mix of DSA, system design, and cultural fit. Interviewers value how you think, not just the answer.",
    questionPatterns: ["DSA (medium difficulty)", "OOP and design patterns", "System Design", "Growth mindset behavioral"],
    difficulty: "medium",
    evaluationCriteria: ["Thought process clarity", "OOP design", "Collaboration signals", "Growth mindset"],
    focusAreas: ["DSA", "OOP", "System Design", "Behavioral"],
    passingBar: 68
  },
  tcs: {
    name: "TCS",
    type: "service",
    tier: "mass-recruiter",
    logo: "🔵",
    style: "Volume hiring. Aptitude-heavy first rounds, followed by basic programming, communication round, and HR. Less DSA depth, more conceptual fundamentals.",
    questionPatterns: ["Aptitude (quant, logical, verbal)", "Basic programming (loops, arrays, patterns)", "CS fundamentals (DBMS, OS, Networks)", "HR and communication round"],
    difficulty: "easy",
    evaluationCriteria: ["Aptitude score", "Basic coding ability", "Communication clarity", "Professional attitude"],
    focusAreas: ["Aptitude", "Core CS", "Communication", "HR"],
    passingBar: 55
  },
  infosys: {
    name: "Infosys",
    type: "service",
    tier: "mass-recruiter",
    logo: "🟢",
    style: "Similar to TCS. Hackwithinfy for top performers, else standard aptitude + pseudocode + HR. Values consistent academics and communication.",
    questionPatterns: ["Aptitude and reasoning", "Pseudocode / flowchart questions", "Verbal ability", "HR situational questions"],
    difficulty: "easy",
    evaluationCriteria: ["Aptitude accuracy", "Logical flow in pseudocode", "English communication", "Attitude and cultural fit"],
    focusAreas: ["Aptitude", "Pseudocode", "Verbal", "HR"],
    passingBar: 52
  },
  startup: {
    name: "Startup (Generic)",
    type: "startup",
    tier: "startup",
    logo: "🚀",
    style: "Fast-paced, practical. No time for theory — show what you've built. Interviewers want problem-solvers who can ship. Expect project discussions, system architecture trade-offs, and rapid prototyping questions.",
    questionPatterns: ["Project deep-dive (what you built, why, trade-offs)", "Practical coding (real-world scenario, not LeetCode)", "Architecture decisions with limited resources", "Startup mindset: ownership, speed, ambiguity handling"],
    difficulty: "medium",
    evaluationCriteria: ["Real-world project experience", "Practical problem-solving", "Ability to handle ambiguity", "Shipping mindset"],
    focusAreas: ["Projects", "Practical Coding", "Architecture", "Mindset"],
    passingBar: 60
  },
  wipro: {
    name: "Wipro",
    type: "service",
    tier: "mass-recruiter",
    logo: "🟡",
    style: "Aptitude, coding, and communication. NLTH for filtering, followed by technical and HR. Conceptual questions from core subjects.",
    questionPatterns: ["Online aptitude test", "Basic coding problems", "Core CS concepts (OOP, DBMS)", "HR and situational"],
    difficulty: "easy",
    evaluationCriteria: ["Aptitude accuracy", "Basic coding correctness", "CS concept clarity", "Communication"],
    focusAreas: ["Aptitude", "Coding", "Core CS", "HR"],
    passingBar: 50
  },
  meta: {
    name: "Meta",
    type: "product",
    tier: "FAANG",
    logo: "🔵",
    style: "Speed + correctness. Expects optimal DSA solutions fast. Strong system design at senior levels. Behavioral around impact and moving fast.",
    questionPatterns: ["DSA (optimal solutions, speed matters)", "System design (social graph, feed, messaging at scale)", "Behavioral (impact, fast execution)", "Product sense questions"],
    difficulty: "hard",
    evaluationCriteria: ["Solution optimality", "Speed of problem solving", "System design at scale", "Impact-driven behavioral answers"],
    focusAreas: ["DSA", "System Design", "Behavioral", "Product Sense"],
    passingBar: 78
  },
// ── AI COMPANIES ──────────────────────────────────────────

  anthropic: {
    name: "Anthropic",
    type: "ai-safety",
    tier: "frontier-ai",
    logo: "🔶",
    style: `Mission-critical AI safety company. Every interview stage evaluates two things equally: technical depth AND values alignment. Interviewers are the people who wrote the research papers — surface familiarity with Claude or Constitutional AI will be spotted immediately. Behavioral questions are philosophically demanding: expect genuine ethical dilemmas with no clean answers, and follow-up questions probing how you *felt* not just what you did. They reward intellectual honesty, genuine uncertainty, and evidence that you've changed your mind about something important. Be skeptical and critical — enthusiasm without critique is a red flag. Strict no-AI-use policy during live interviews.`,
    questionPatterns: [
      "Values & Ethics (hardest round): 'Describe a time your values were tested at work. How did you feel then vs. now?'",
      "AI Safety reasoning: 'How would you measure whether an AI system is actually following its stated principles?'",
      "Constitutional AI & alignment: 'How does Constitutional AI differ from RLHF? What are its limitations?'",
      "System Design (LLM-scale): 'Design a distributed search system handling 1 billion documents with LLM inference'",
      "Live Coding (Python): Clean, tested, production-quality code. Correctness over speed.",
      "Mission alignment: 'Why Anthropic specifically — not just why AI safety?'"
    ],
    difficulty: "hard",
    evaluationCriteria: [
      "Intellectual honesty and genuine uncertainty (not rehearsed perfection)",
      "Constitutional AI and AI safety knowledge depth",
      "Ethical reasoning under novel dilemmas — no clean answers",
      "Production-quality Python code with concurrency awareness",
      "LLM infrastructure design (distributed training, inference pipelines, MCP)",
      "Evidence of belief updating — have you genuinely changed your mind about something?"
    ],
    focusAreas: ["AI Safety & Values", "LLM System Design", "Python Coding", "Constitutional AI"],
    passingBar: 80
  },

  openai: {
    name: "OpenAI",
    type: "ai-research",
    tier: "frontier-ai",
    logo: "⚫",
    style: `AGI-focused company moving fast with high technical and mission bars. Process is intentionally decentralized — expect variability by team. Coding questions are practical engineering problems (not abstract LeetCode puzzles): rate limiters, streaming chat systems, resumable iterators, token-generating functions scaled to 100k req/s. System design goes far deeper than typical big tech — distributed systems that resemble real production workloads at OpenAI scale. Behavioral emphasizes mission alignment with AGI safety, collaboration under ambiguity, and how fast you learn from mistakes. They value engineers who build things people love while keeping safety as a primary constraint, not an afterthought.`,
    questionPatterns: [
      "Practical Coding: 'Build a rate limiter with sliding window', 'Implement a Time Based Key-Value Store'",
      "System Design (LLM-scale): 'Build an LLM-powered enterprise search system', 'Design a streaming chat UI'",
      "Mission alignment: 'Why AGI safety specifically? How do you think about the alignment problem?'",
      "AI ethics discussion: 'What are the failure modes of RLHF? How would you mitigate them?'",
      "Past project deep-dive presentation: prepare slides on your most impactful project",
      "Behavioral (SPSIL): 'Tell me about a time you shipped something fast and it caused a production issue'"
    ],
    difficulty: "hard",
    evaluationCriteria: [
      "Practical engineering over algorithmic cleverness",
      "AGI safety mission alignment — genuine, not rehearsed",
      "System design for massive scale with real trade-offs",
      "Speed of iteration and learning from failure",
      "Collaboration across teams in high-ambiguity environment",
      "Understanding of LLM failure modes and safety considerations"
    ],
    focusAreas: ["Practical Engineering", "LLM System Design", "Mission Alignment", "AI Ethics"],
    passingBar: 78
  },

  deepmind: {
    name: "Google DeepMind",
    type: "ai-research",
    tier: "frontier-ai",
    logo: "🧠",
    style: `Academic rigor meets real-world AI impact. DeepMind is a research-first organization — they hire scientists who ship. Process is long (1.5–2 months) and involves presenting a research paper you choose, then a deep conversation with a senior scientist about it. ML fundamentals are tested deeply but entry-level questions can be straightforward (overfitting, regularization). The hard part is the paper presentation and the technical conversation that follows — your ability to reason about trade-offs, limitations, and future directions of published work matters more than memorized answers. Coding is LeetCode medium-hard. They value intellectual curiosity, rigor, and the ability to bridge theory and practice.`,
    questionPatterns: [
      "Paper presentation: Choose and present a recent ML paper — defend its contributions and limitations",
      "ML fundamentals deep-dive: 'Explain overfitting vs underfitting', 'Derive backpropagation from scratch'",
      "Live Coding: LeetCode Medium + 1 Hard problem",
      "Research reasoning: 'What would you change about this paper? What experiment would you run next?'",
      "System design for ML: 'Design a distributed training pipeline for a 70B parameter model'",
      "Behavioral with senior scientist: technical life story, why research, long-term vision"
    ],
    difficulty: "hard",
    evaluationCriteria: [
      "Research paper comprehension and critical analysis",
      "ML theory depth (transformers, attention, optimization, probability)",
      "Ability to identify limitations and propose improvements to published work",
      "Coding correctness on medium-hard algorithmic problems",
      "Intellectual curiosity and genuine excitement about open problems in AI",
      "Bridging theory to practical system constraints"
    ],
    focusAreas: ["ML Research", "Paper Analysis", "Coding", "System Design for ML"],
    passingBar: 82
  },

// ── ELON MUSK COMPANIES ──────────────────────────────────

  tesla: {
    name: "Tesla",
    type: "ev-tech",
    tier: "mission-driven",
    logo: "⚡",
    style: `Fast-paced, mission-driven engineering culture obsessed with first-principles thinking and execution speed. Tesla receives 3M+ applications annually — only candidates with real depth and speed get through. In 2025, Tesla introduced AI-conducted first-round screens. Technical rounds focus on LeetCode medium-to-hard problems plus system design scenarios grounded in EV and energy: telemetry pipelines from vehicle fleets, battery management systems, real-time charging infrastructure. Engineers own features end-to-end across small teams (5–10 people). They want people who question assumptions, rethink conventional solutions, and can ship fast without sacrificing correctness. Mission alignment with sustainable energy and transport is genuinely evaluated — not just lip service.`,
    questionPatterns: [
      "DSA: LeetCode medium-hard — arrays, graphs, DP, string manipulation at scale",
      "System Design (EV-specific): 'Design a system to collect and process real-time telemetry from Tesla's vehicle fleet'",
      "System Design: 'Design a fault-tolerant Supercharger network load balancing system'",
      "First-principles coding: optimize battery management algorithms, real-time data pipelines",
      "Behavioral (STAR): 'Tell me about a time you worked under an impossible deadline and what you shipped'",
      "Mission fit: 'Why sustainable energy? Why Tesla vs. other EV companies?'"
    ],
    difficulty: "hard",
    evaluationCriteria: [
      "First-principles thinking — question assumptions before solving",
      "Execution speed with correctness under pressure",
      "System design for real-time physical world data (vehicles, energy, sensors)",
      "Ability to own features end-to-end across hardware and software boundaries",
      "Mission alignment with sustainability — genuine not generic",
      "Cross-functional thinking: how does your code affect hardware, firmware, and UX?"
    ],
    focusAreas: ["DSA", "EV System Design", "Real-time Systems", "Mission Alignment"],
    passingBar: 74
  },

  spacex: {
    name: "SpaceX",
    type: "aerospace",
    tier: "mission-driven",
    logo: "🚀",
    style: `One of the most demanding technical interview processes anywhere. SpaceX interviewers don't ask trivia — they ask problems that test whether you can reason from first principles under pressure. Software questions bear real relation to SpaceX problems: spare parts tracking for rockets, telemetry pipeline from sensors to ground stations, fault-tolerant command propagation systems. Must be US citizen or permanent resident. Process involves a full-day onsite with 7–9 rounds including a technical project presentation. Interviewers care how you think, not just whether you reach a full solution. They want believers — genuine passion for space exploration is evaluated alongside technical depth. Behavioral questions are ownership-heavy, focused on high-stakes decisions and what you learned from failure.`,
    questionPatterns: [
      "Hybrid Algorithmic+Design: 'Track spare rocket parts moving in/out of refrigeration — write the logging system'",
      "System Design (aerospace): 'Design a telemetry pipeline from rocket sensors to ground stations with lossy comms'",
      "Fault-tolerant systems: 'Architect a command propagation system that survives partial network outages'",
      "Low-Level Design: 'Implement a launch sequence state machine with concurrency and rollback'",
      "First-principles reasoning: 'How would you regulate temperature of a component in space?'",
      "Behavioral (ownership): 'Tell me about a high-stakes decision you made with incomplete information'"
    ],
    difficulty: "hard",
    evaluationCriteria: [
      "First-principles reasoning under pressure — show your thinking process, not just the answer",
      "Aerospace-grounded system design: fault tolerance, lossy comms, real-time constraints",
      "Concurrency and low-level systems thinking (mutexes, state machines, hardware-facing code)",
      "Genuine passion and knowledge of SpaceX's mission, Starlink, Starship, Dragon",
      "Ownership mindset — take responsibility for high-stakes decisions and failures",
      "Asking the right questions before solving — requirements clarification is evaluated"
    ],
    focusAreas: ["First-Principles Engineering", "Aerospace System Design", "Low-Level Systems", "Ownership Behavioral"],
    passingBar: 76
  },

// ── FINANCE COMPANIES ─────────────────────────────────────

  jpmorgan: {
    name: "JP Morgan",
    type: "finance",
    tier: "top-bank",
    logo: "🏦",
    style: `One of the world's largest investment banks with a growing tech engineering arm. Interview style blends finance domain knowledge with solid software engineering. HireVue behavioral screening is first. Live coding uses practical, finance-adjacent problems. System design questions involve financial data platforms, transaction systems, and real-time trading infrastructure. Finance knowledge is genuinely evaluated — you must understand how interest rates, market events, and financial products work. Behavioral questions follow STAR format and test persistence, innovation, and client-centric thinking. Technical rounds cover DSA, system design, and SQL for financial data models. Culture values reliability, compliance-mindset, and building at global scale.`,
    questionPatterns: [
      "Finance knowledge: 'How have rising interest rates affected equity valuations? Walk me through the mechanism'",
      "System Design (finance): 'Design a real-time fraud detection system for credit card transactions at JP Morgan scale'",
      "DSA: LeetCode medium — sliding window, two pointers, hash maps with financial data framing",
      "SQL: 'Design a banking schema with Customers, Accounts, Credit Cards — write a query for running transaction totals'",
      "Behavioral (STAR): 'Tell me about a time you produced an innovative solution to a unique business problem'",
      "Market awareness: 'What is one major current economic event you find interesting and why does it matter for banks?'"
    ],
    difficulty: "medium",
    evaluationCriteria: [
      "Finance domain knowledge — interest rates, market events, financial products",
      "SQL and financial data modeling skills",
      "System design for compliance, reliability, and global financial scale",
      "DSA correctness with banking/transaction problem framing",
      "STAR behavioral answers demonstrating persistence and innovation",
      "Client-centric and risk-aware thinking in technical decisions"
    ],
    focusAreas: ["Finance Knowledge", "SQL & Data Modeling", "System Design", "Behavioral STAR"],
    passingBar: 65
  },

  goldman: {
    name: "Goldman Sachs",
    type: "finance",
    tier: "top-bank",
    logo: "🏛️",
    style: `Elite investment bank with a rigorous multi-stage process culminating in the famous 'Superday' — 5 back-to-back interviews with senior bankers. HireVue behavioral screening first, analyzed for verbal content AND communication patterns. Technical rounds cover DSA (LeetCode medium), financial system design, Low-Level Design with OOP and SQL schema for banking systems, and a Managing Director round. Goldman is known for pulling from a consistent question set (Trapping Rain Water, LRU Cache, Transaction Segments). They test financial engineering knowledge — options pricing, interest rate models — alongside coding. The bar is extremely high. Culture values precision, structured thinking, performance under pressure, and the ability to explain complex reasoning clearly to both engineers and non-technical stakeholders.`,
    questionPatterns: [
      "DSA (consistent patterns): Trapping Rain Water, Design LRU Cache, sliding window on transaction arrays",
      "Financial System Design: 'Design a scalable stock trading platform with order matching and real-time pricing'",
      "Low-Level Design: 'Design a banking system with Customers, Accounts, Credit Cards using Strategy Pattern'",
      "SQL: 'Design a Splitwise-style schema, write a query for running totals of portfolio value over time'",
      "Financial engineering: 'Explain how options are priced — what is delta and why does it matter?'",
      "Behavioral (Superday): 'Why Goldman Sachs specifically — what distinguishes us from JP Morgan or Morgan Stanley?'"
    ],
    difficulty: "hard",
    evaluationCriteria: [
      "DSA correctness — Goldman pulls from a known set, patterns must be second nature",
      "Financial engineering knowledge (options, interest rate models, derivatives)",
      "OOP + SQL design for banking systems with concurrency handling",
      "Ability to explain technical reasoning clearly to non-engineers",
      "Performance under pressure in back-to-back Superday format",
      "Precision and structured thinking — vague or informal answers fail here"
    ],
    focusAreas: ["DSA", "Financial System Design", "Low-Level Design + SQL", "Financial Engineering"],
    passingBar: 78
  },

// ── PRODUCT & PLATFORM COMPANIES ──────────────────────────

  apple: {
    name: "Apple",
    type: "product",
    tier: "FAANG",
    logo: "🍎",
    style: `Craft-obsessed company that values code quality, user empathy, and privacy-by-design above almost everything else. Interviews are highly team-specific — interviewer style varies significantly. Coding problems are medium difficulty but held to a strict correctness bar: clean, readable, modular code that handles edge cases properly. Unlike other FAANG, Apple heavily emphasizes on-device constraints: memory management, battery efficiency, privacy-preserving architectures, and hardware-software integration. System design often involves practical API design, iOS/macOS-relevant architectures (iCloud sync, offline-first, on-device ML), and realistic performance trade-offs. Behavioral questions probe ownership, craftsmanship, and user-centric decision making. 'Real artists ship' — balance perfectionism with execution.`,
    questionPatterns: [
      "Coding (medium, strict correctness): arrays, trees, graphs — 'Implement a thread-safe LRU Cache'",
      "Privacy-first system design: 'Design iCloud sync with offline-first architecture and conflict resolution'",
      "On-device constraints: 'How would this solution behave on a memory-constrained iOS device?'",
      "API design + OOP: 'Design a file deduplication system', 'Design an iOS background task scheduler'",
      "Behavioral (craftsmanship): 'Describe a time you pushed back on shipping something you felt wasn't ready'",
      "Product alignment: 'Why Apple specifically? Walk me through how a recent Apple product decision shows their engineering values'"
    ],
    difficulty: "medium",
    evaluationCriteria: [
      "Code quality: clean, modular, well-named, with edge case handling — correctness over speed",
      "Privacy-by-design thinking: proactively consider privacy in every system designed",
      "On-device and memory constraint awareness: hardware-software integration thinking",
      "Ownership and user empathy — decisions grounded in user experience outcomes",
      "Craftsmanship: attention to detail, polish, and the ability to articulate trade-offs",
      "Communication clarity while coding — process matters as much as solution"
    ],
    focusAreas: ["DSA (Correctness-First)", "Privacy System Design", "OOP & API Design", "Craftsmanship Behavioral"],
    passingBar: 70
  },

  netflix: {
    name: "Netflix",
    type: "product",
    tier: "FAANG",
    logo: "🔴",
    style: `High-performance culture defined by 'freedom and responsibility' — Netflix famously hires top-of-market talent, pays accordingly, and has no tolerance for average. System design interviews are genuinely scary: they go far beyond typical FAANG — ML infrastructure design (distributed training, feature stores, online serving), CDN architecture (global content delivery, cache-fill strategies, adaptive bitrate streaming), and fault-tolerant microservices at massive scale. Coding is medium-hard LeetCode but interviewers care deeply about how you reason about performance, memory efficiency, and online algorithms (reservoir sampling, sliding windows for streaming data). Culture fit questions probe your ability to operate with radical candor and minimal process.`,
    questionPatterns: [
      "Streaming System Design: 'Design Netflix's global CDN with cache-fill strategy, adaptive bitrate, and multi-region failover'",
      "ML Infrastructure Design: 'Design a real-time recommendation system — feature store, distributed training, online serving'",
      "Coding (performance-focused): Reservoir sampling, sliding window rate limiting, merge sorted streams",
      "Fault-tolerant systems: 'Design a microservice architecture that degrades gracefully during partial outages'",
      "Behavioral (radical candor): 'Tell me about a time you gave extremely direct feedback that was uncomfortable but necessary'",
      "Culture fit: 'Describe how you operate without close supervision — give a specific example where you defined your own direction'"
    ],
    difficulty: "hard",
    evaluationCriteria: [
      "System design depth — CDN architecture, distributed ML pipelines, not just textbook patterns",
      "Online algorithm thinking: streaming data, reservoir sampling, memory-efficient solutions",
      "Fault tolerance and graceful degradation design",
      "Freedom and responsibility culture fit — autonomous, high-output, minimal hand-holding",
      "Radical candor in behavioral answers — direct, honest, specific",
      "Performance-first thinking: latency, throughput, and scale are always in scope"
    ],
    focusAreas: ["Streaming System Design", "ML Infrastructure", "Performance Coding", "Culture Fit"],
    passingBar: 80
  },

  uber: {
    name: "Uber",
    type: "product",
    tier: "top-tech",
    logo: "⚫",
    style: `Marketplace and real-time systems company operating at global scale. Interviews focus heavily on distributed systems with real-world constraints: geo-distributed services, surge pricing algorithms, ride matching at scale, payment systems. Coding tends to be practical and scenario-based — problems that reflect Uber's actual engineering challenges. System design rounds go deep into consistency trade-offs, eventual consistency in payment systems, and real-time location data pipelines. Behavioral questions emphasize customer obsession, moving fast, and data-driven decision making. Culture values ownership and the ability to think at both the micro level (code quality) and macro level (business impact).`,
    questionPatterns: [
      "Real-time System Design: 'Design Uber's ride matching system — dispatch algorithm, geo-indexing, surge pricing'",
      "Distributed Systems: 'Design a payment processing system that handles eventual consistency across regions'",
      "DSA (scenario-based): 'Implement a geo-spatial proximity search', 'Design a rate limiter for driver location updates'",
      "Data pipeline design: 'Design a real-time driver location tracking system with 10M concurrent drivers'",
      "Behavioral (data-driven): 'Tell me about a time you used data to make a counter-intuitive engineering decision'",
      "Business + tech: 'How would you design surge pricing at a system level — what are the failure modes?'"
    ],
    difficulty: "medium",
    evaluationCriteria: [
      "Real-time systems thinking: geo-distribution, location data, marketplace dynamics",
      "Distributed systems depth: consistency trade-offs, eventual consistency, failure modes",
      "Practical DSA: scenario-grounded problems, not abstract puzzles",
      "Data-driven decision making in behavioral answers",
      "Customer obsession and business impact awareness alongside technical depth",
      "Ownership mindset: end-to-end thinking from system design to deployment"
    ],
    focusAreas: ["Real-time System Design", "Distributed Systems", "Practical DSA", "Marketplace Engineering"],
    passingBar: 68
  },

  nvidia: {
    name: "Nvidia",
    type: "ai-infrastructure",
    tier: "top-tech",
    logo: "🟢",
    style: `The company that powers AI. Nvidia interviews emphasize GPU architecture knowledge, CUDA programming, and ML infrastructure at the hardware-software boundary. Software engineering rounds include HackerRank assessments, system design for ML training infrastructure, and deep dives into parallel computing and GPU optimization. Interviewers expect you to understand how hardware decisions shape software architecture — unified memory, tensor cores, NVLink. The ML engineering bar is extremely high: distributed training systems, inference optimization, and GPU memory management are core topics. Culture is fast-moving, mission-critical (they're the backbone of AI globally), and deeply technical. Behavioral questions test whether you thrive in a high-stakes, rapidly evolving environment.`,
    questionPatterns: [
      "GPU/Parallel Computing: 'Explain how you would optimize a matrix multiplication kernel for GPU execution'",
      "ML Infrastructure: 'Design a distributed training system for a 70B parameter LLM across 1000 GPUs'",
      "CUDA concepts: 'Explain memory hierarchy in CUDA — shared memory, global memory, cache trade-offs'",
      "System Design (inference): 'Design an LLM inference serving system that minimizes P99 latency'",
      "DSA (HackerRank style): medium-hard problems with performance constraints",
      "Behavioral: 'Tell me about a time you optimized a system by 10x — what was your process?'"
    ],
    difficulty: "hard",
    evaluationCriteria: [
      "GPU architecture knowledge: CUDA, memory hierarchy, parallel execution models",
      "ML training infrastructure: distributed training, model parallelism, gradient checkpointing",
      "Inference optimization: batching strategies, quantization, latency vs throughput trade-offs",
      "Hardware-software co-design thinking: how hardware constraints shape software decisions",
      "DSA correctness with performance-first mindset",
      "Ability to reason about 10x optimization opportunities at system level"
    ],
    focusAreas: ["GPU Architecture", "ML Infrastructure", "Inference Optimization", "Systems Performance"],
    passingBar: 78
  },

  xai: {
    name: "xAI",
    type: "ai-research",
    tier: "frontier-ai",
    logo: "✖️",
    style: `Elon Musk's AI company building Grok. Small, elite team moving extremely fast. Conducts in-person onsites (San Francisco). No bureaucracy — expects candidates who operate at frontier AI quality without hand-holding. Interview style mirrors SpaceX's intensity: first-principles reasoning, extreme technical depth, and a genuine test of whether you can build frontier AI systems. Emphasis on practical ML engineering: you'll be expected to implement, debug, and reason about transformer architectures, RLHF pipelines, and large-scale training systems. Culture is move-fast, no-excuses, high-output. Behavioral questions are about impact and the ability to execute in a resource-constrained, high-pressure environment. Mission is to advance AI understanding of the universe.`,
    questionPatterns: [
      "ML Systems: 'Design the training infrastructure for a frontier LLM — data pipeline, distributed training, evaluation'",
      "Transformer deep-dive: 'Explain attention from first principles — derive why scaled dot-product attention works'",
      "Practical ML coding: 'Implement a simplified RLHF training loop in PyTorch from scratch'",
      "System Design: 'Design Grok's real-time data ingestion pipeline from Twitter/X at 500M tweets/day'",
      "First-principles reasoning: 'What are the fundamental limitations of current LLM architectures?'",
      "Impact behavioral: 'Tell me about the most technically ambitious thing you've built — what did you cut to ship it?'"
    ],
    difficulty: "hard",
    evaluationCriteria: [
      "Frontier AI engineering: transformer architecture depth, RLHF, pre-training at scale",
      "First-principles reasoning about AI limitations and trade-offs",
      "Ability to implement ML systems from scratch, not just use frameworks",
      "Speed of execution in ambiguous, resource-constrained environment",
      "Impact-driven behavioral answers — concrete, ambitious, shipped",
      "Genuine intellectual curiosity about unsolved problems in AI"
    ],
    focusAreas: ["Frontier ML Systems", "Transformer Architecture", "RLHF & Training", "First-Principles AI"],
    passingBar: 82
  }
};

module.exports = COMPANY_PROFILES;
