# Architecture Diagrams
## Secure Datacard Application

---

## 1. System Overview

```
╔══════════════════════════════════════════════════════════════════════════════╗
║                         SECURE DATACARD APPLICATION                           ║
║                              System Overview                                  ║
╠══════════════════════════════════════════════════════════════════════════════╣
║                                                                              ║
║    ┌─────────────────────────────────────────────────────────────────┐      ║
║    │                         USER BROWSER                            │      ║
║    │                                                                 │      ║
║    │    ┌─────────┐   ┌─────────┐   ┌─────────┐   ┌─────────┐      │      ║
║    │    │  Login  │   │Dashboard│   │  Card   │   │  Card   │      │      ║
║    │    │  Page   │   │  Page   │   │ Editor  │   │ Viewer  │      │      ║
║    │    └─────────┘   └─────────┘   └─────────┘   └─────────┘      │      ║
║    │                         REACT.JS                                │      ║
║    └─────────────────────────────────────────────────────────────────┘      ║
║                                    │                                         ║
║                                    │ HTTPS + JWT                             ║
║                                    ▼                                         ║
║    ┌─────────────────────────────────────────────────────────────────┐      ║
║    │                      BACKEND SERVER                             │      ║
║    │                       (Node.js)                                 │      ║
║    │                                                                 │      ║
║    │    ┌──────────┐   ┌──────────┐   ┌──────────┐                  │      ║
║    │    │   Auth   │   │ Datacard │   │   LLM    │                  │      ║
║    │    │ Service  │   │  Service │   │ Service  │                  │      ║
║    │    └────┬─────┘   └────┬─────┘   └────┬─────┘                  │      ║
║    │         │              │              │                         │      ║
║    │    ┌────┴──────────────┴──────────────┴────┐                   │      ║
║    │    │         SECURITY MIDDLEWARE            │                   │      ║
║    │    │  • JWT Auth  • Rate Limit  • Helmet   │                   │      ║
║    │    │  • CORS      • Validation  • Encrypt  │                   │      ║
║    │    └───────────────────────────────────────┘                   │      ║
║    └─────────────────────────────────────────────────────────────────┘      ║
║                         │                    │                               ║
║                         ▼                    ▼                               ║
║    ┌─────────────────────────┐    ┌─────────────────────────┐              ║
║    │     MongoDB Atlas       │    │     OpenAI / Claude     │              ║
║    │                         │    │         API             │              ║
║    │  • Users Collection     │    │                         │              ║
║    │  • Datacards Collection │    │  • Content Generation   │              ║
║    │  • Encrypted Fields     │    │  • Prompt Processing    │              ║
║    └─────────────────────────┘    └─────────────────────────┘              ║
║                                                                              ║
╚══════════════════════════════════════════════════════════════════════════════╝
```

---

## 2. Detailed Architecture

```
╔══════════════════════════════════════════════════════════════════════════════╗
║                           DETAILED ARCHITECTURE                               ║
╠══════════════════════════════════════════════════════════════════════════════╣
║                                                                              ║
║  ┌────────────────────────────────────────────────────────────────────────┐ ║
║  │                           PRESENTATION LAYER                           │ ║
║  │                             (React.js)                                 │ ║
║  │  ┌────────────┐ ┌────────────┐ ┌────────────┐ ┌────────────────────┐  │ ║
║  │  │   Auth     │ │  Dashboard │ │   Card     │ │      Card          │  │ ║
║  │  │ Components │ │ Components │ │  Editor    │ │     Viewer         │  │ ║
║  │  │            │ │            │ │            │ │                    │  │ ║
║  │  │ • Login    │ │ • CardList │ │ • Fields   │ │ • Templates        │  │ ║
║  │  │ • Register │ │ • Search   │ │ • LLM Gen  │ │ • Export (PDF/PNG) │  │ ║
║  │  │ • Profile  │ │ • Filters  │ │ • Preview  │ │ • Share Link       │  │ ║
║  │  └────────────┘ └────────────┘ └────────────┘ └────────────────────┘  │ ║
║  │                                                                        │ ║
║  │  ┌──────────────────────────────────────────────────────────────────┐ │ ║
║  │  │                      STATE MANAGEMENT                            │ │ ║
║  │  │  • AuthContext (User state, JWT token)                           │ │ ║
║  │  │  • CardContext (Datacards, CRUD operations)                      │ │ ║
║  │  └──────────────────────────────────────────────────────────────────┘ │ ║
║  └────────────────────────────────────────────────────────────────────────┘ ║
║                                      │                                       ║
║                                      │ HTTPS (TLS 1.3)                       ║
║                                      │ Authorization: Bearer <JWT>           ║
║                                      ▼                                       ║
║  ┌────────────────────────────────────────────────────────────────────────┐ ║
║  │                          SECURITY LAYER                                │ ║
║  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐    │ ║
║  │  │  CORS    │ │  Helmet  │ │   Rate   │ │  Input   │ │   JWT    │    │ ║
║  │  │  Policy  │ │  Headers │ │  Limiter │ │  Valid.  │ │  Verify  │    │ ║
║  │  └──────────┘ └──────────┘ └──────────┘ └──────────┘ └──────────┘    │ ║
║  └────────────────────────────────────────────────────────────────────────┘ ║
║                                      │                                       ║
║                                      ▼                                       ║
║  ┌────────────────────────────────────────────────────────────────────────┐ ║
║  │                         APPLICATION LAYER                              │ ║
║  │                         (Express.js)                                   │ ║
║  │                                                                        │ ║
║  │  ┌─────────────────────────────────────────────────────────────────┐  │ ║
║  │  │                        ROUTES                                    │  │ ║
║  │  │   /api/auth/*     /api/cards/*     /api/generate/*              │  │ ║
║  │  └─────────────────────────────────────────────────────────────────┘  │ ║
║  │                              │                                         │ ║
║  │  ┌───────────────┬───────────┴───────────┬───────────────┐            │ ║
║  │  │               │                       │               │            │ ║
║  │  ▼               ▼                       ▼               ▼            │ ║
║  │  ┌─────────┐ ┌─────────┐ ┌─────────────────┐ ┌─────────────────┐     │ ║
║  │  │  Auth   │ │  Card   │ │      LLM        │ │   Encryption    │     │ ║
║  │  │Controller│ │Controller│ │   Controller    │ │    Service      │     │ ║
║  │  │         │ │         │ │                 │ │                 │     │ ║
║  │  │register │ │create   │ │generateContent  │ │encrypt (AES256) │     │ ║
║  │  │login    │ │getCards │ │getTemplates     │ │decrypt          │     │ ║
║  │  │getMe    │ │getCard  │ │sanitizePrompt   │ │hash (SHA256)    │     │ ║
║  │  │update   │ │update   │ │                 │ │                 │     │ ║
║  │  │         │ │delete   │ │                 │ │                 │     │ ║
║  │  │         │ │share    │ │                 │ │                 │     │ ║
║  │  └─────────┘ └─────────┘ └─────────────────┘ └─────────────────┘     │ ║
║  └────────────────────────────────────────────────────────────────────────┘ ║
║                    │                │                    │                   ║
║                    ▼                ▼                    ▼                   ║
║  ┌────────────────────────────────────────────────────────────────────────┐ ║
║  │                           DATA LAYER                                   │ ║
║  │                                                                        │ ║
║  │  ┌─────────────────────┐        ┌─────────────────────────────────┐   │ ║
║  │  │      MongoDB        │        │          External APIs          │   │ ║
║  │  │      (Atlas)        │        │                                 │   │ ║
║  │  │                     │        │   ┌───────────────────────┐    │   │ ║
║  │  │  ┌───────────────┐  │        │   │     OpenAI API        │    │   │ ║
║  │  │  │    Users      │  │        │   │  (GPT-4 / GPT-3.5)    │    │   │ ║
║  │  │  │  • _id        │  │        │   └───────────────────────┘    │   │ ║
║  │  │  │  • name       │  │        │              OR                │   │ ║
║  │  │  │  • email      │  │        │   ┌───────────────────────┐    │   │ ║
║  │  │  │  • password   │  │        │   │     Claude API        │    │   │ ║
║  │  │  │    (hashed)   │  │        │   │   (Anthropic)         │    │   │ ║
║  │  │  └───────────────┘  │        │   └───────────────────────┘    │   │ ║
║  │  │                     │        │                                 │   │ ║
║  │  │  ┌───────────────┐  │        └─────────────────────────────────┘   │ ║
║  │  │  │  Datacards    │  │                                              │ ║
║  │  │  │  • _id        │  │                                              │ ║
║  │  │  │  • userId     │  │                                              │ ║
║  │  │  │  • title      │  │                                              │ ║
║  │  │  │  • fields[]   │  │                                              │ ║
║  │  │  │  (encrypted)  │  │                                              │ ║
║  │  │  │  • template   │  │                                              │ ║
║  │  │  │  • shareToken │  │                                              │ ║
║  │  │  └───────────────┘  │                                              │ ║
║  │  └─────────────────────┘                                              │ ║
║  └────────────────────────────────────────────────────────────────────────┘ ║
║                                                                              ║
╚══════════════════════════════════════════════════════════════════════════════╝
```

---

## 3. Security Architecture

```
╔══════════════════════════════════════════════════════════════════════════════╗
║                          SECURITY ARCHITECTURE                                ║
╠══════════════════════════════════════════════════════════════════════════════╣
║                                                                              ║
║                           DEFENSE IN DEPTH                                   ║
║                                                                              ║
║  ╔════════════════════════════════════════════════════════════════════════╗ ║
║  ║  LAYER 1: TRANSPORT SECURITY                                          ║ ║
║  ║  ┌──────────────────────────────────────────────────────────────────┐ ║ ║
║  ║  │  • HTTPS (TLS 1.3)                                               │ ║ ║
║  ║  │  • HSTS Header                                                   │ ║ ║
║  ║  │  • Certificate Pinning (optional)                                │ ║ ║
║  ║  └──────────────────────────────────────────────────────────────────┘ ║ ║
║  ╚════════════════════════════════════════════════════════════════════════╝ ║
║                                    │                                         ║
║                                    ▼                                         ║
║  ╔════════════════════════════════════════════════════════════════════════╗ ║
║  ║  LAYER 2: PERIMETER SECURITY                                          ║ ║
║  ║  ┌────────────────┐  ┌────────────────┐  ┌────────────────┐          ║ ║
║  ║  │  Rate Limiting │  │  CORS Policy   │  │   Helmet.js    │          ║ ║
║  ║  │                │  │                │  │   Headers      │          ║ ║
║  ║  │ • 100 req/15m  │  │ • Origin check │  │ • X-Frame      │          ║ ║
║  ║  │ • 5 auth/15m   │  │ • Credentials  │  │ • CSP          │          ║ ║
║  ║  │ • 10 LLM/hour  │  │ • Methods      │  │ • X-XSS        │          ║ ║
║  ║  └────────────────┘  └────────────────┘  └────────────────┘          ║ ║
║  ╚════════════════════════════════════════════════════════════════════════╝ ║
║                                    │                                         ║
║                                    ▼                                         ║
║  ╔════════════════════════════════════════════════════════════════════════╗ ║
║  ║  LAYER 3: AUTHENTICATION & AUTHORIZATION                              ║ ║
║  ║  ┌──────────────────────────┐  ┌──────────────────────────┐          ║ ║
║  ║  │   JWT Authentication     │  │    Access Control        │          ║ ║
║  ║  │                          │  │                          │          ║ ║
║  ║  │  • Sign with HS256       │  │  • User owns resource?   │          ║ ║
║  ║  │  • 7-day expiration      │  │  • Role-based access     │          ║ ║
║  ║  │  • Bearer token format   │  │  • Visibility checks     │          ║ ║
║  ║  │  • Secure secret key     │  │  • Share token valid?    │          ║ ║
║  ║  └──────────────────────────┘  └──────────────────────────┘          ║ ║
║  ╚════════════════════════════════════════════════════════════════════════╝ ║
║                                    │                                         ║
║                                    ▼                                         ║
║  ╔════════════════════════════════════════════════════════════════════════╗ ║
║  ║  LAYER 4: INPUT VALIDATION                                            ║ ║
║  ║  ┌──────────────────────────────────────────────────────────────────┐ ║ ║
║  ║  │  express-validator                                               │ ║ ║
║  ║  │                                                                  │ ║ ║
║  ║  │  • Type checking (string, number, email, etc.)                   │ ║ ║
║  ║  │  • Length limits (min/max)                                       │ ║ ║
║  ║  │  • Pattern matching (regex)                                      │ ║ ║
║  ║  │  • Sanitization (trim, escape)                                   │ ║ ║
║  ║  │  • Custom validators                                             │ ║ ║
║  ║  └──────────────────────────────────────────────────────────────────┘ ║ ║
║  ╚════════════════════════════════════════════════════════════════════════╝ ║
║                                    │                                         ║
║                                    ▼                                         ║
║  ╔════════════════════════════════════════════════════════════════════════╗ ║
║  ║  LAYER 5: DATA PROTECTION                                             ║ ║
║  ║  ┌────────────────┐  ┌────────────────┐  ┌────────────────┐          ║ ║
║  ║  │   Passwords    │  │   Sensitive    │  │   Database     │          ║ ║
║  ║  │                │  │    Fields      │  │   Security     │          ║ ║
║  ║  │ • bcrypt       │  │                │  │                │          ║ ║
║  ║  │ • 12 rounds    │  │ • AES-256-GCM  │  │ • Auth enabled │          ║ ║
║  ║  │ • Salt per pwd │  │ • Random IV    │  │ • IP whitelist │          ║ ║
║  ║  │ • Never stored │  │ • Auth tag     │  │ • TLS in trans │          ║ ║
║  ║  │   in plaintext │  │ • Key from env │  │                │          ║ ║
║  ║  └────────────────┘  └────────────────┘  └────────────────┘          ║ ║
║  ╚════════════════════════════════════════════════════════════════════════╝ ║
║                                    │                                         ║
║                                    ▼                                         ║
║  ╔════════════════════════════════════════════════════════════════════════╗ ║
║  ║  LAYER 6: LLM SECURITY                                                ║ ║
║  ║  ┌──────────────────────────────────────────────────────────────────┐ ║ ║
║  ║  │  Prompt Injection Defenses                                       │ ║ ║
║  ║  │                                                                  │ ║ ║
║  ║  │  • Remove role keywords (system:, assistant:, user:)             │ ║ ║
║  ║  │  • Strip code blocks (``` ... ```)                               │ ║ ║
║  ║  │  • Remove JSON injection patterns                                │ ║ ║
║  ║  │  • Limit input length (10-500 chars)                             │ ║ ║
║  ║  │  • Separate system/user prompts                                  │ ║ ║
║  ║  │  • Validate JSON output structure                                │ ║ ║
║  ║  └──────────────────────────────────────────────────────────────────┘ ║ ║
║  ╚════════════════════════════════════════════════════════════════════════╝ ║
║                                                                              ║
╚══════════════════════════════════════════════════════════════════════════════╝
```

---

## 4. Data Flow Diagram

```
╔══════════════════════════════════════════════════════════════════════════════╗
║                            DATA FLOW DIAGRAM                                  ║
╠══════════════════════════════════════════════════════════════════════════════╣
║                                                                              ║
║  ┌─────────────────────────────────────────────────────────────────────────┐║
║  │                         CREATE DATACARD FLOW                            │║
║  └─────────────────────────────────────────────────────────────────────────┘║
║                                                                              ║
║   User                API                  Service              Database     ║
║    │                   │                      │                    │        ║
║    │  POST /api/cards  │                      │                    │        ║
║    │  + JWT + Body     │                      │                    │        ║
║    │──────────────────>│                      │                    │        ║
║    │                   │                      │                    │        ║
║    │                   │  Validate JWT        │                    │        ║
║    │                   │─────────────────────>│                    │        ║
║    │                   │                      │                    │        ║
║    │                   │  Validate Input      │                    │        ║
║    │                   │─────────────────────>│                    │        ║
║    │                   │                      │                    │        ║
║    │                   │                      │  Encrypt sensitive │        ║
║    │                   │                      │  fields (AES-256)  │        ║
║    │                   │                      │───────────────────>│        ║
║    │                   │                      │                    │        ║
║    │                   │                      │                    │ Save   ║
║    │                   │                      │                    │ Card   ║
║    │                   │                      │<───────────────────│        ║
║    │                   │                      │                    │        ║
║    │   201 Created     │                      │                    │        ║
║    │   + Datacard      │                      │                    │        ║
║    │<──────────────────│                      │                    │        ║
║    │                   │                      │                    │        ║
║                                                                              ║
║  ┌─────────────────────────────────────────────────────────────────────────┐║
║  │                        LLM GENERATION FLOW                              │║
║  └─────────────────────────────────────────────────────────────────────────┘║
║                                                                              ║
║   User                API              LLM Service           OpenAI API     ║
║    │                   │                   │                     │          ║
║    │  POST /generate   │                   │                     │          ║
║    │  + prompt         │                   │                     │          ║
║    │──────────────────>│                   │                     │          ║
║    │                   │                   │                     │          ║
║    │                   │  Rate limit check │                     │          ║
║    │                   │──────────────────>│                     │          ║
║    │                   │                   │                     │          ║
║    │                   │                   │  Sanitize prompt    │          ║
║    │                   │                   │  (remove injection) │          ║
║    │                   │                   │                     │          ║
║    │                   │                   │  System prompt +    │          ║
║    │                   │                   │  User prompt        │          ║
║    │                   │                   │────────────────────>│          ║
║    │                   │                   │                     │          ║
║    │                   │                   │    JSON response    │          ║
║    │                   │                   │<────────────────────│          ║
║    │                   │                   │                     │          ║
║    │                   │  Parse & validate │                     │          ║
║    │                   │<──────────────────│                     │          ║
║    │                   │                   │                     │          ║
║    │   200 OK          │                   │                     │          ║
║    │   + Generated     │                   │                     │          ║
║    │     Datacard      │                   │                     │          ║
║    │<──────────────────│                   │                     │          ║
║    │                   │                   │                     │          ║
║                                                                              ║
╚══════════════════════════════════════════════════════════════════════════════╝
```

---

## 5. Component Diagram

```
╔══════════════════════════════════════════════════════════════════════════════╗
║                           COMPONENT DIAGRAM                                   ║
╠══════════════════════════════════════════════════════════════════════════════╣
║                                                                              ║
║  backend/                                                                    ║
║  │                                                                           ║
║  ├── server.js ─────────────────────────────────────────────────────────┐   ║
║  │   │  Entry point: initializes Express, middleware, routes            │   ║
║  │   │                                                                  │   ║
║  │   └──► Uses: config/db.js, routes/*, middleware/*                    │   ║
║  │                                                                           ║
║  ├── config/                                                                 ║
║  │   └── db.js ──────────────────────────────────────────────────────┐      ║
║  │       │  MongoDB connection using Mongoose                        │      ║
║  │       │  Exports: connectDB()                                     │      ║
║  │       └──► Uses: mongoose, process.env.MONGODB_URI                │      ║
║  │                                                                           ║
║  ├── models/                                                                 ║
║  │   ├── User.js ────────────────────────────────────────────────────┐      ║
║  │   │   │  User schema with bcrypt password hashing                 │      ║
║  │   │   │  Exports: User model                                      │      ║
║  │   │   └──► Uses: mongoose, bcryptjs                               │      ║
║  │   │                                                                      ║
║  │   └── Datacard.js ────────────────────────────────────────────────┐      ║
║  │       │  Datacard schema with embedded fields                     │      ║
║  │       │  Exports: Datacard model                                  │      ║
║  │       └──► Uses: mongoose                                         │      ║
║  │                                                                           ║
║  ├── middleware/                                                             ║
║  │   ├── auth.js ────────────────────────────────────────────────────┐      ║
║  │   │   │  JWT verification middleware                              │      ║
║  │   │   │  Exports: protect, generateToken                          │      ║
║  │   │   └──► Uses: jsonwebtoken, models/User                        │      ║
║  │   │                                                                      ║
║  │   ├── validator.js ───────────────────────────────────────────────┐      ║
║  │   │   │  Input validation rules                                   │      ║
║  │   │   │  Exports: registerValidation, loginValidation, etc.       │      ║
║  │   │   └──► Uses: express-validator                                │      ║
║  │   │                                                                      ║
║  │   └── rateLimiter.js ─────────────────────────────────────────────┐      ║
║  │       │  Rate limiting configurations                             │      ║
║  │       │  Exports: authLimiter, llmLimiter, etc.                   │      ║
║  │       └──► Uses: express-rate-limit                               │      ║
║  │                                                                           ║
║  ├── controllers/                                                            ║
║  │   ├── authController.js ──────────────────────────────────────────┐      ║
║  │   │   │  Authentication business logic                            │      ║
║  │   │   │  Exports: registerUser, loginUser, getMe, updateUser      │      ║
║  │   │   └──► Uses: models/User, middleware/auth                     │      ║
║  │   │                                                                      ║
║  │   ├── cardController.js ──────────────────────────────────────────┐      ║
║  │   │   │  Datacard CRUD + sharing logic                            │      ║
║  │   │   │  Exports: createCard, getCards, updateCard, etc.          │      ║
║  │   │   └──► Uses: models/Datacard, utils/encryption                │      ║
║  │   │                                                                      ║
║  │   └── llmController.js ───────────────────────────────────────────┐      ║
║  │       │  LLM generation with prompt sanitization                  │      ║
║  │       │  Exports: generateContent, getTemplates                   │      ║
║  │       └──► Uses: utils/llmService                                 │      ║
║  │                                                                           ║
║  ├── routes/                                                                 ║
║  │   ├── authRoutes.js ──► /api/auth/*    (register, login, me)            ║
║  │   ├── cardRoutes.js ──► /api/cards/*   (CRUD, share)                    ║
║  │   └── llmRoutes.js ───► /api/generate/* (generate, templates)           ║
║  │                                                                           ║
║  └── utils/                                                                  ║
║      ├── encryption.js ──────────────────────────────────────────────┐      ║
║      │   │  AES-256-GCM encryption utilities                         │      ║
║      │   │  Exports: encrypt, decrypt, generateEncryptionKey, hash   │      ║
║      │   └──► Uses: crypto (Node.js built-in)                        │      ║
║      │                                                                      ║
║      └── llmService.js ──────────────────────────────────────────────┐      ║
║          │  OpenAI API integration                                   │      ║
║          │  Exports: generateDatacard, SYSTEM_PROMPT                 │      ║
║          └──► Uses: openai (when configured)                         │      ║
║                                                                              ║
╚══════════════════════════════════════════════════════════════════════════════╝
```

---

## 6. Deployment Architecture (Planned)

```
╔══════════════════════════════════════════════════════════════════════════════╗
║                       DEPLOYMENT ARCHITECTURE                                 ║
╠══════════════════════════════════════════════════════════════════════════════╣
║                                                                              ║
║                              PRODUCTION                                      ║
║                                                                              ║
║     ┌─────────────────────────────────────────────────────────────────┐     ║
║     │                         INTERNET                                │     ║
║     └───────────────────────────┬─────────────────────────────────────┘     ║
║                                 │                                            ║
║                                 ▼                                            ║
║     ┌─────────────────────────────────────────────────────────────────┐     ║
║     │                      CLOUDFLARE                                 │     ║
║     │            (CDN, DDoS Protection, SSL/TLS)                      │     ║
║     └───────────────────────────┬─────────────────────────────────────┘     ║
║                                 │                                            ║
║           ┌─────────────────────┴─────────────────────┐                     ║
║           │                                           │                     ║
║           ▼                                           ▼                     ║
║     ┌───────────────────┐                   ┌───────────────────┐          ║
║     │   VERCEL          │                   │  RENDER.COM       │          ║
║     │  (Frontend)       │                   │   (Backend)       │          ║
║     │                   │                   │                   │          ║
║     │  React App        │                   │  Node.js App      │          ║
║     │  Static Files     │ ────────────────> │  Express API      │          ║
║     │  Client-side JS   │   API Calls       │  Docker Container │          ║
║     │                   │                   │                   │          ║
║     └───────────────────┘                   └─────────┬─────────┘          ║
║                                                       │                     ║
║                          ┌────────────────────────────┼────────────┐        ║
║                          │                            │            │        ║
║                          ▼                            ▼            ▼        ║
║     ┌───────────────────────────┐  ┌────────────────────┐  ┌───────────┐   ║
║     │     MONGODB ATLAS         │  │    OPENAI API      │  │  ENV VARS │   ║
║     │                           │  │                    │  │           │   ║
║     │  • M0 Free Tier           │  │  • GPT-4 / 3.5     │  │ • Secrets │   ║
║     │  • Auto-scaling           │  │  • Rate limited    │  │ • Keys    │   ║
║     │  • Backups                │  │  • Pay-per-use     │  │ • Config  │   ║
║     │  • Encryption at rest     │  │                    │  │           │   ║
║     └───────────────────────────┘  └────────────────────┘  └───────────┘   ║
║                                                                              ║
║  ┌────────────────────────────────────────────────────────────────────────┐ ║
║  │                         MONITORING & LOGGING                           │ ║
║  │                                                                        │ ║
║  │  • Application logs (Render dashboard)                                 │ ║
║  │  • Error tracking (Sentry - optional)                                  │ ║
║  │  • Uptime monitoring (UptimeRobot - free)                              │ ║
║  │  • Database metrics (MongoDB Atlas dashboard)                          │ ║
║  └────────────────────────────────────────────────────────────────────────┘ ║
║                                                                              ║
╚══════════════════════════════════════════════════════════════════════════════╝
```

---

## 7. Database Schema Diagram

```
╔══════════════════════════════════════════════════════════════════════════════╗
║                          DATABASE SCHEMA                                      ║
╠══════════════════════════════════════════════════════════════════════════════╣
║                                                                              ║
║  ┌─────────────────────────────────────────────────────────────────────┐    ║
║  │                            USERS                                     │    ║
║  ├─────────────────────────────────────────────────────────────────────┤    ║
║  │  _id            │ ObjectId    │ PK       │ Auto-generated          │    ║
║  │  name           │ String      │ Required │ 2-50 characters         │    ║
║  │  email          │ String      │ Unique   │ Lowercase, validated    │    ║
║  │  password       │ String      │ Required │ bcrypt hash (12 rounds) │    ║
║  │  createdAt      │ Date        │ Auto     │ Registration timestamp  │    ║
║  └─────────────────────────────────────────────────────────────────────┘    ║
║                                         │                                    ║
║                                         │ 1:N                                ║
║                                         │                                    ║
║                                         ▼                                    ║
║  ┌─────────────────────────────────────────────────────────────────────┐    ║
║  │                          DATACARDS                                   │    ║
║  ├─────────────────────────────────────────────────────────────────────┤    ║
║  │  _id            │ ObjectId    │ PK       │ Auto-generated          │    ║
║  │  userId         │ ObjectId    │ FK→Users │ Card owner              │    ║
║  │  title          │ String      │ Required │ Max 100 chars           │    ║
║  │  description    │ String      │ Optional │ Max 500 chars           │    ║
║  │  fields         │ [Field]     │ Array    │ Max 20 fields           │    ║
║  │  template       │ String      │ Enum     │ default/professional/   │    ║
║  │                 │             │          │ minimal/creative        │    ║
║  │  visibility     │ String      │ Enum     │ private/public          │    ║
║  │  shareToken     │ String      │ Unique   │ For share links         │    ║
║  │  shareExpiry    │ Date        │ Optional │ Link expiration         │    ║
║  │  tags           │ [String]    │ Array    │ Max 30 chars each       │    ║
║  │  generatedByLLM │ Boolean     │ Default  │ false                   │    ║
║  │  createdAt      │ Date        │ Auto     │ Mongoose timestamp      │    ║
║  │  updatedAt      │ Date        │ Auto     │ Mongoose timestamp      │    ║
║  └─────────────────────────────────────────────────────────────────────┘    ║
║                                         │                                    ║
║                                         │ Embedded                           ║
║                                         │                                    ║
║                                         ▼                                    ║
║  ┌─────────────────────────────────────────────────────────────────────┐    ║
║  │                        FIELD (Embedded)                              │    ║
║  ├─────────────────────────────────────────────────────────────────────┤    ║
║  │  _id            │ ObjectId    │ Auto     │ Unique field ID         │    ║
║  │  label          │ String      │ Required │ Max 50 chars            │    ║
║  │  value          │ String      │ Optional │ Plain or encrypted      │    ║
║  │  type           │ String      │ Enum     │ text/email/phone/date/  │    ║
║  │                 │             │          │ url/image/textarea      │    ║
║  │  encrypted      │ Boolean     │ Default  │ false                   │    ║
║  └─────────────────────────────────────────────────────────────────────┘    ║
║                                                                              ║
║  ┌─────────────────────────────────────────────────────────────────────┐    ║
║  │                            INDEXES                                   │    ║
║  ├─────────────────────────────────────────────────────────────────────┤    ║
║  │  Collection  │ Index                    │ Purpose                   │    ║
║  ├─────────────┼──────────────────────────┼────────────────────────────┤    ║
║  │  users       │ email (unique)           │ Fast lookup, uniqueness   │    ║
║  │  datacards   │ userId, createdAt (desc) │ User's cards, sorted      │    ║
║  │  datacards   │ shareToken (unique)      │ Share link lookup         │    ║
║  └─────────────────────────────────────────────────────────────────────┘    ║
║                                                                              ║
╚══════════════════════════════════════════════════════════════════════════════╝
```

---

## 8. File Structure Diagram

```
secure-datacard-app/
│
├── 📁 backend/
│   │
│   ├── 📁 config/
│   │   └── 📄 db.js                    ← MongoDB connection
│   │
│   ├── 📁 controllers/
│   │   ├── 📄 authController.js        ← Auth: register, login, profile
│   │   ├── 📄 cardController.js        ← CRUD: create, read, update, delete
│   │   └── 📄 llmController.js         ← LLM: generate, templates
│   │
│   ├── 📁 middleware/
│   │   ├── 📄 auth.js                  ← JWT verification
│   │   ├── 📄 validator.js             ← Input validation rules
│   │   └── 📄 rateLimiter.js           ← Rate limiting configs
│   │
│   ├── 📁 models/
│   │   ├── 📄 User.js                  ← User schema + bcrypt
│   │   └── 📄 Datacard.js              ← Datacard schema
│   │
│   ├── 📁 routes/
│   │   ├── 📄 authRoutes.js            ← /api/auth/*
│   │   ├── 📄 cardRoutes.js            ← /api/cards/*
│   │   └── 📄 llmRoutes.js             ← /api/generate/*
│   │
│   ├── 📁 utils/
│   │   ├── 📄 encryption.js            ← AES-256-GCM functions
│   │   └── 📄 llmService.js            ← OpenAI integration
│   │
│   ├── 📄 .env                         ← Environment variables
│   ├── 📄 .env.example                 ← Environment template
│   ├── 📄 .gitignore                   ← Git ignore rules
│   ├── 📄 package.json                 ← NPM dependencies
│   └── 📄 server.js                    ← Express entry point
│
├── 📁 frontend/                         ← (Week 6: React app)
│
├── 📁 docs/
│   ├── 📄 API_DOCUMENTATION.md         ← API reference
│   ├── 📄 ARCHITECTURE_DIAGRAMS.md     ← This file
│   ├── 📄 PROJECT_DOCUMENTATION.md     ← Full project docs
│   └── 📄 SECURITY.md                  ← Security documentation
│
├── 📄 .gitignore                       ← Root git ignore
├── 📄 PROJECT_PLAN.md                  ← 12-week timeline
└── 📄 README.md                        ← Project overview
```

---

*Diagrams created for MSc Cyber Security Project*
*Last Updated: February 2026*
