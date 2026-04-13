# Secure Datacard Application
## Project Documentation

**Project Title:** Developing a Secure User Interface for LLM-Powered Datacard Generation
**Degree:** MSc Cyber Security
**Date:** February 2026

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Project Overview](#2-project-overview)
3. [System Architecture](#3-system-architecture)
4. [Technology Stack](#4-technology-stack)
5. [Implementation Progress](#5-implementation-progress)
6. [Backend Implementation](#6-backend-implementation)
7. [Security Features](#7-security-features)
8. [API Documentation](#8-api-documentation)
9. [Database Design](#9-database-design)
10. [Testing Results](#10-testing-results)
11. [File Structure](#11-file-structure)
12. [Setup Instructions](#12-setup-instructions)
13. [Next Steps](#13-next-steps)

---

## 1. Executive Summary

This project implements a secure web application that allows users to create personalized datacards with the assistance of Large Language Model (LLM) auto-generation. The system emphasizes security at every layer, implementing industry-standard practices for authentication, encryption, input validation, and API protection.

### Key Features
- **Secure Authentication:** JWT-based authentication with bcrypt password hashing
- **Field-Level Encryption:** AES-256-GCM encryption for sensitive data
- **LLM Integration:** AI-powered content generation with prompt injection defenses
- **Rate Limiting:** Protection against brute force and API abuse
- **Input Validation:** Comprehensive validation and sanitization

---

## 2. Project Overview

### 2.1 What is a Datacard?

A datacard is a structured, visual summary of information — similar to a digital ID card, business card, or profile card. Users can:

- Create custom datacards with various field types
- Mark sensitive fields for automatic encryption
- Use AI to auto-generate card content from natural language descriptions
- Share cards via secure, expiring links

### 2.2 Project Objectives

1. Develop a secure user interface for datacard creation
2. Implement robust authentication and authorization
3. Integrate LLM capabilities with security safeguards
4. Apply encryption for sensitive data protection
5. Follow OWASP security guidelines throughout

### 2.3 Scope

| In Scope | Out of Scope |
|----------|--------------|
| User registration and authentication | Mobile native applications |
| Datacard CRUD operations | Real-time collaboration |
| Field-level encryption | Payment processing |
| LLM-powered content generation | Third-party integrations |
| Secure sharing with expiry | Offline functionality |
| Rate limiting and security headers | Multi-language support |

---

## 3. System Architecture

### 3.1 High-Level Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              CLIENT LAYER                                    │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                        React.js Frontend                             │   │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌────────────┐  │   │
│  │  │   Auth UI   │  │  Dashboard  │  │ Card Editor │  │ Card View  │  │   │
│  │  │  - Login    │  │  - List     │  │  - Create   │  │  - Preview │  │   │
│  │  │  - Register │  │  - Search   │  │  - Edit     │  │  - Export  │  │   │
│  │  │  - Logout   │  │  - Delete   │  │  - LLM Gen  │  │  - Share   │  │   │
│  │  └─────────────┘  └─────────────┘  └─────────────┘  └────────────┘  │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      │ HTTPS (TLS 1.3)
                                      │ JWT Bearer Token
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                            SECURITY LAYER                                    │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────────────┐  │
│  │  HTTPS   │ │  CORS    │ │  Helmet  │ │   Rate   │ │ Input Validation │  │
│  │  (TLS)   │ │  Policy  │ │ Headers  │ │ Limiting │ │  & Sanitization  │  │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘ └──────────────────┘  │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                           APPLICATION LAYER                                  │
│                         Node.js + Express.js                                 │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                         API Gateway                                  │   │
│  │                    Express Router + Middleware                       │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                    │                                         │
│         ┌──────────────────────────┼──────────────────────────┐             │
│         │                          │                          │             │
│         ▼                          ▼                          ▼             │
│  ┌─────────────┐           ┌─────────────┐           ┌─────────────┐       │
│  │    Auth     │           │  Datacard   │           │     LLM     │       │
│  │  Service    │           │   Service   │           │   Service   │       │
│  │             │           │             │           │             │       │
│  │ - Register  │           │ - Create    │           │ - Generate  │       │
│  │ - Login     │           │ - Read      │           │ - Templates │       │
│  │ - Verify    │           │ - Update    │           │ - Sanitize  │       │
│  │ - Profile   │           │ - Delete    │           │             │       │
│  │             │           │ - Share     │           │             │       │
│  └──────┬──────┘           └──────┬──────┘           └──────┬──────┘       │
│         │                          │                          │             │
│         │    ┌─────────────────────┴─────────┐               │             │
│         │    │                               │               │             │
│         ▼    ▼                               ▼               ▼             │
│  ┌─────────────────┐               ┌─────────────────────────────┐         │
│  │   JWT Handler   │               │    Encryption Service       │         │
│  │  - Sign Token   │               │    - AES-256-GCM Encrypt   │         │
│  │  - Verify Token │               │    - Decrypt                │         │
│  │  - Refresh      │               │    - Hash (SHA-256)         │         │
│  └─────────────────┘               └─────────────────────────────┘         │
└─────────────────────────────────────────────────────────────────────────────┘
                    │                               │
                    ▼                               ▼
┌─────────────────────────────┐     ┌─────────────────────────────────────────┐
│        DATA LAYER           │     │           EXTERNAL SERVICES              │
│  ┌───────────────────────┐  │     │  ┌─────────────────────────────────┐   │
│  │     MongoDB Atlas     │  │     │  │        OpenAI / Claude API      │   │
│  │                       │  │     │  │                                 │   │
│  │  ┌─────────────────┐  │  │     │  │  - GPT-4 / Claude for content  │   │
│  │  │     Users       │  │  │     │  │  - Structured JSON output      │   │
│  │  │  - _id          │  │  │     │  │  - Rate limited access         │   │
│  │  │  - name         │  │  │     │  │                                 │   │
│  │  │  - email        │  │  │     │  └─────────────────────────────────┘   │
│  │  │  - password     │  │  │     │                                         │
│  │  │  (hashed)       │  │  │     │                                         │
│  │  └─────────────────┘  │  │     │                                         │
│  │                       │  │     │                                         │
│  │  ┌─────────────────┐  │  │     │                                         │
│  │  │   Datacards     │  │  │     │                                         │
│  │  │  - _id          │  │  │     │                                         │
│  │  │  - userId (ref) │  │  │     │                                         │
│  │  │  - title        │  │  │     │                                         │
│  │  │  - fields[]     │  │  │     │                                         │
│  │  │  (encrypted)    │  │  │     │                                         │
│  │  │  - template     │  │  │     │                                         │
│  │  │  - visibility   │  │  │     │                                         │
│  │  │  - shareToken   │  │  │     │                                         │
│  │  └─────────────────┘  │  │     │                                         │
│  └───────────────────────┘  │     │                                         │
└─────────────────────────────┘     └─────────────────────────────────────────┘
```

### 3.2 Request Flow Diagram

```
┌──────────┐     ┌──────────┐     ┌──────────┐     ┌──────────┐     ┌──────────┐
│  Client  │     │  Express │     │   Auth   │     │Controller│     │ Database │
│ (React)  │     │  Server  │     │Middleware│     │          │     │(MongoDB) │
└────┬─────┘     └────┬─────┘     └────┬─────┘     └────┬─────┘     └────┬─────┘
     │                │                │                │                │
     │  HTTP Request  │                │                │                │
     │  + JWT Token   │                │                │                │
     │───────────────>│                │                │                │
     │                │                │                │                │
     │                │  Validate      │                │                │
     │                │  Headers/CORS  │                │                │
     │                │───────────────>│                │                │
     │                │                │                │                │
     │                │                │  Verify JWT    │                │
     │                │                │  Extract User  │                │
     │                │                │───────────────>│                │
     │                │                │                │                │
     │                │                │                │  Query/Update  │
     │                │                │                │───────────────>│
     │                │                │                │                │
     │                │                │                │    Result      │
     │                │                │                │<───────────────│
     │                │                │                │                │
     │                │                │  Encrypt/      │                │
     │                │                │  Decrypt Data  │                │
     │                │                │<───────────────│                │
     │                │                │                │                │
     │   JSON Response│                │                │                │
     │<───────────────│                │                │                │
     │                │                │                │                │
```

### 3.3 Authentication Flow

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        AUTHENTICATION FLOW                               │
└─────────────────────────────────────────────────────────────────────────┘

REGISTRATION:
┌────────┐    ┌────────────┐    ┌────────────┐    ┌──────────┐    ┌──────┐
│ Client │───>│ Validation │───>│   Bcrypt   │───>│  Create  │───>│ JWT  │
│        │    │ - Email    │    │   Hash     │    │   User   │    │Token │
│        │    │ - Password │    │ (12 rounds)│    │    DB    │    │      │
└────────┘    └────────────┘    └────────────┘    └──────────┘    └──────┘
                   │                                                  │
                   │ Validation Error                                 │ Success
                   ▼                                                  ▼
            ┌────────────┐                                    ┌────────────┐
            │ 400 Error  │                                    │ 201 + JWT  │
            │ Response   │                                    │ + User     │
            └────────────┘                                    └────────────┘

LOGIN:
┌────────┐    ┌────────────┐    ┌────────────┐    ┌──────────┐    ┌──────┐
│ Client │───>│ Find User  │───>│  Compare   │───>│ Generate │───>│ JWT  │
│        │    │ by Email   │    │  Password  │    │   JWT    │    │Token │
└────────┘    └────────────┘    └────────────┘    └──────────┘    └──────┘
                   │                   │                              │
                   │ Not Found         │ Mismatch                     │ Success
                   ▼                   ▼                              ▼
            ┌────────────┐      ┌────────────┐                ┌────────────┐
            │ 401 Error  │      │ 401 Error  │                │ 200 + JWT  │
            └────────────┘      └────────────┘                └────────────┘

PROTECTED ROUTE ACCESS:
┌────────┐    ┌────────────┐    ┌────────────┐    ┌──────────┐    ┌──────┐
│Request │───>│  Extract   │───>│   Verify   │───>│  Attach  │───>│Route │
│+ Token │    │   Token    │    │    JWT     │    │   User   │    │Handler│
└────────┘    └────────────┘    └────────────┘    └──────────┘    └──────┘
                   │                   │
                   │ No Token          │ Invalid/Expired
                   ▼                   ▼
            ┌────────────┐      ┌────────────┐
            │ 401 Error  │      │ 401 Error  │
            └────────────┘      └────────────┘
```

### 3.4 Encryption Flow

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         ENCRYPTION FLOW (AES-256-GCM)                    │
└─────────────────────────────────────────────────────────────────────────┘

ENCRYPT (Saving Sensitive Field):
┌──────────────┐    ┌──────────────┐    ┌──────────────┐    ┌─────────────┐
│  Plain Text  │───>│ Generate IV  │───>│  AES-256-GCM │───>│  Encrypted  │
│  "SSN:123"   │    │  (16 bytes)  │    │   Encrypt    │    │   String    │
└──────────────┘    └──────────────┘    └──────────────┘    └─────────────┘
                                                                   │
                                                                   ▼
                                              ┌────────────────────────────────┐
                                              │  Format: IV:AuthTag:Ciphertext │
                                              │  (All hex encoded)             │
                                              └────────────────────────────────┘

DECRYPT (Reading Sensitive Field):
┌──────────────┐    ┌──────────────┐    ┌──────────────┐    ┌─────────────┐
│  Encrypted   │───>│  Parse IV,   │───>│  AES-256-GCM │───>│ Plain Text  │
│   String     │    │  AuthTag,    │    │   Decrypt    │    │  "SSN:123"  │
└──────────────┘    │  Ciphertext  │    └──────────────┘    └─────────────┘
                    └──────────────┘           │
                                               │ Auth Tag Mismatch
                                               ▼
                                        ┌─────────────┐
                                        │ Tamper Error│
                                        │  Detected   │
                                        └─────────────┘
```

### 3.5 LLM Integration Flow

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         LLM GENERATION FLOW                              │
└─────────────────────────────────────────────────────────────────────────┘

┌────────┐    ┌────────────┐    ┌────────────┐    ┌──────────┐    ┌──────┐
│ User   │───>│  Sanitize  │───>│   System   │───>│  OpenAI  │───>│Parse │
│ Prompt │    │   Input    │    │  Prompt +  │    │   API    │    │ JSON │
│        │    │            │    │User Prompt │    │          │    │      │
└────────┘    └────────────┘    └────────────┘    └──────────┘    └──────┘
                   │                                                  │
                   │ Injection                                        │ Success
                   │ Detected                                         ▼
                   ▼                                          ┌────────────┐
            ┌────────────┐                                    │ Generated  │
            │ 400 Error  │                                    │  Datacard  │
            │ Rejected   │                                    │   Fields   │
            └────────────┘                                    └────────────┘

PROMPT INJECTION DEFENSES:
┌─────────────────────────────────────────────────────────────────────────┐
│  1. Remove role keywords (system:, assistant:, user:)                   │
│  2. Remove code blocks (``` ... ```)                                    │
│  3. Remove JSON instruction patterns                                    │
│  4. Strip dangerous characters (< >)                                    │
│  5. Enforce length limits (10-500 chars)                                │
│  6. Separate system prompt from user input                              │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 4. Technology Stack

### 4.1 Backend Technologies

| Technology | Version | Purpose |
|------------|---------|---------|
| Node.js | 18+ LTS | JavaScript runtime |
| Express.js | 5.x | Web application framework |
| MongoDB | 6.x | NoSQL database |
| Mongoose | 9.x | MongoDB ODM |

### 4.2 Security Packages

| Package | Version | Purpose |
|---------|---------|---------|
| bcryptjs | 3.x | Password hashing |
| jsonwebtoken | 9.x | JWT authentication |
| helmet | 8.x | Security headers |
| express-rate-limit | 8.x | Rate limiting |
| express-validator | 7.x | Input validation |
| crypto (built-in) | - | AES-256 encryption |

### 4.3 Frontend Technologies (Planned)

| Technology | Purpose |
|------------|---------|
| React.js 18 | UI library |
| Tailwind CSS | Styling |
| React Router | Navigation |
| Axios | HTTP client |
| React Hook Form | Form handling |

### 4.4 DevOps & Tools

| Tool | Purpose |
|------|---------|
| Git/GitHub | Version control |
| Docker | Containerization |
| MongoDB Atlas | Cloud database |
| Postman | API testing |
| OWASP ZAP | Security testing |

---

## 5. Implementation Progress

### 5.1 Completed Components

| Component | Status | Description |
|-----------|--------|-------------|
| Project Structure | ✅ Complete | Full folder structure created |
| Express Server | ✅ Complete | Configured with all middleware |
| Database Connection | ✅ Complete | MongoDB connection handler |
| User Model | ✅ Complete | Schema with bcrypt hashing |
| Datacard Model | ✅ Complete | Schema with field encryption |
| Auth Controller | ✅ Complete | Register, login, profile |
| Card Controller | ✅ Complete | Full CRUD + sharing |
| LLM Controller | ✅ Complete | Generation with sanitization |
| Auth Middleware | ✅ Complete | JWT verification |
| Validation Middleware | ✅ Complete | Input validation rules |
| Rate Limiter | ✅ Complete | Multiple rate limit tiers |
| Encryption Utility | ✅ Complete | AES-256-GCM implementation |
| LLM Service | ✅ Complete | OpenAI integration ready |
| API Routes | ✅ Complete | All endpoints defined |
| Documentation | ✅ Complete | API docs, security docs |

### 5.2 Pending Components

| Component | Status | Week |
|-----------|--------|------|
| React Frontend | 🔲 Pending | Week 6-8 |
| Frontend Auth UI | 🔲 Pending | Week 6 |
| Dashboard UI | 🔲 Pending | Week 7 |
| Card Editor UI | 🔲 Pending | Week 8 |
| Unit Tests | 🔲 Pending | Week 10 |
| Security Audit | 🔲 Pending | Week 10 |
| Docker Setup | 🔲 Pending | Week 11 |
| Deployment | 🔲 Pending | Week 11 |

### 5.3 Progress Timeline

```
Week 1-2: ████████████████████ 100% - Environment & Database Setup
Week 3:   ████████████████████ 100% - Authentication System
Week 4:   ████████████████████ 100% - Datacard CRUD API
Week 5:   ████████████████████ 100% - LLM Integration
Week 6:   ░░░░░░░░░░░░░░░░░░░░   0% - Frontend Auth UI
Week 7:   ░░░░░░░░░░░░░░░░░░░░   0% - Dashboard
Week 8:   ░░░░░░░░░░░░░░░░░░░░   0% - Card Editor
Week 9:   ░░░░░░░░░░░░░░░░░░░░   0% - Security Hardening
Week 10:  ░░░░░░░░░░░░░░░░░░░░   0% - Testing
Week 11:  ░░░░░░░░░░░░░░░░░░░░   0% - Deployment
Week 12:  ░░░░░░░░░░░░░░░░░░░░   0% - Documentation

Overall Progress: ████████░░░░░░░░░░░░ 42%
```

---

## 6. Backend Implementation

### 6.1 Server Configuration

```javascript
// server.js - Main entry point
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

const app = express();

// Security middleware stack
app.use(helmet());                    // Security headers
app.use(cors({ origin: FRONTEND }));  // CORS policy
app.use(rateLimit({ max: 100 }));     // Rate limiting
app.use(express.json({ limit: '10kb' })); // Body parser with size limit

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/cards', cardRoutes);
app.use('/api/generate', llmRoutes);
```

### 6.2 Authentication Implementation

```javascript
// Password hashing (User model)
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// JWT token generation
const generateToken = (userId) => {
  return jwt.sign({ id: userId }, JWT_SECRET, { expiresIn: '7d' });
};

// JWT verification middleware
const protect = async (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  const decoded = jwt.verify(token, JWT_SECRET);
  req.user = await User.findById(decoded.id);
  next();
};
```

### 6.3 Encryption Implementation

```javascript
// AES-256-GCM Encryption
const encrypt = (text) => {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const authTag = cipher.getAuthTag();
  return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
};

// Decryption with tamper detection
const decrypt = (encryptedText) => {
  const [ivHex, authTagHex, encrypted] = encryptedText.split(':');
  const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
  decipher.setAuthTag(authTag);  // Verifies integrity
  return decipher.update(encrypted, 'hex', 'utf8') + decipher.final('utf8');
};
```

---

## 7. Security Features

### 7.1 Security Controls Matrix

| OWASP Top 10 | Vulnerability | Mitigation | Implementation |
|--------------|---------------|------------|----------------|
| A01 | Broken Access Control | JWT + Ownership checks | `middleware/auth.js` |
| A02 | Cryptographic Failures | AES-256-GCM, bcrypt, HTTPS | `utils/encryption.js` |
| A03 | Injection | Input validation, parameterized queries | `middleware/validator.js` |
| A04 | Insecure Design | Security-first architecture | Throughout |
| A05 | Security Misconfiguration | Helmet.js, secure defaults | `server.js` |
| A06 | Vulnerable Components | npm audit, dependency updates | `package.json` |
| A07 | Auth Failures | JWT, bcrypt (12 rounds), rate limiting | Multiple files |
| A08 | Data Integrity Failures | GCM auth tags, validation | `utils/encryption.js` |
| A09 | Logging Failures | Request logging (planned) | Week 9 |
| A10 | SSRF | URL validation (planned) | Week 9 |

### 7.2 Rate Limiting Configuration

```
┌─────────────────────────────────────────────────────────────┐
│                    RATE LIMITING TIERS                       │
├─────────────────────────────────────────────────────────────┤
│  Endpoint Type      │ Requests │ Window  │ Purpose          │
├─────────────────────┼──────────┼─────────┼──────────────────┤
│  General API        │   100    │ 15 min  │ Standard limit   │
│  Auth (login/reg)   │     5    │ 15 min  │ Brute force      │
│  LLM Generation     │    10    │  1 hour │ Cost control     │
│  Datacard CRUD      │    50    │ 15 min  │ Abuse prevention │
└─────────────────────┴──────────┴─────────┴──────────────────┘
```

### 7.3 Security Headers (Helmet.js)

```
┌─────────────────────────────────────────────────────────────┐
│                    SECURITY HEADERS                          │
├─────────────────────────────────────────────────────────────┤
│  Header                        │ Value / Purpose            │
├────────────────────────────────┼────────────────────────────┤
│  X-Content-Type-Options        │ nosniff                    │
│  X-Frame-Options               │ DENY (clickjacking)        │
│  X-XSS-Protection              │ 1; mode=block              │
│  Strict-Transport-Security     │ HTTPS enforcement          │
│  Content-Security-Policy       │ XSS prevention             │
│  Referrer-Policy               │ Privacy protection         │
│  X-Permitted-Cross-Domain      │ none                       │
└────────────────────────────────┴────────────────────────────┘
```

---

## 8. API Documentation

### 8.1 Endpoint Summary

```
┌─────────────────────────────────────────────────────────────┐
│                      API ENDPOINTS                           │
├─────────────────────────────────────────────────────────────┤
│  Method │ Endpoint              │ Auth │ Description        │
├─────────┼───────────────────────┼──────┼────────────────────┤
│  GET    │ /api/health           │  No  │ Health check       │
├─────────┼───────────────────────┼──────┼────────────────────┤
│  POST   │ /api/auth/register    │  No  │ User registration  │
│  POST   │ /api/auth/login       │  No  │ User login         │
│  GET    │ /api/auth/me          │ Yes  │ Get current user   │
│  PUT    │ /api/auth/update      │ Yes  │ Update profile     │
├─────────┼───────────────────────┼──────┼────────────────────┤
│  GET    │ /api/cards            │ Yes  │ List user cards    │
│  POST   │ /api/cards            │ Yes  │ Create card        │
│  GET    │ /api/cards/:id        │ Yes  │ Get single card    │
│  PUT    │ /api/cards/:id        │ Yes  │ Update card        │
│  DELETE │ /api/cards/:id        │ Yes  │ Delete card        │
│  POST   │ /api/cards/:id/share  │ Yes  │ Generate share link│
│  GET    │ /api/cards/shared/:t  │  No  │ View shared card   │
├─────────┼───────────────────────┼──────┼────────────────────┤
│  GET    │ /api/generate/templates│ Yes │ Get templates      │
│  POST   │ /api/generate         │ Yes  │ Generate content   │
└─────────┴───────────────────────┴──────┴────────────────────┘
```

### 8.2 Request/Response Examples

**Register User:**
```json
// POST /api/auth/register
// Request:
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "SecurePass123"
}

// Response (201):
{
  "success": true,
  "data": {
    "user": { "id": "...", "name": "John Doe", "email": "john@example.com" },
    "token": "eyJhbGciOiJIUzI1NiIs..."
  }
}
```

**Create Datacard:**
```json
// POST /api/cards
// Headers: Authorization: Bearer <token>
// Request:
{
  "title": "Professional Card",
  "fields": [
    { "label": "Name", "value": "John Doe", "type": "text", "encrypted": false },
    { "label": "SSN", "value": "123-45-6789", "type": "text", "encrypted": true }
  ],
  "template": "professional",
  "visibility": "private"
}

// Response (201):
{
  "success": true,
  "message": "Datacard created successfully",
  "data": { "datacard": { ... } }
}
```

**Generate with LLM:**
```json
// POST /api/generate
// Headers: Authorization: Bearer <token>
// Request:
{
  "prompt": "Create a professional business card for a software engineer"
}

// Response (200):
{
  "success": true,
  "data": {
    "generated": {
      "title": "Professional Profile",
      "fields": [
        { "label": "Full Name", "value": "John Doe", "type": "text" },
        { "label": "Job Title", "value": "Software Engineer", "type": "text" },
        { "label": "Email", "value": "john@example.com", "type": "email" }
      ],
      "template": "professional"
    },
    "generatedByLLM": true
  }
}
```

---

## 9. Database Design

### 9.1 Entity Relationship Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    DATABASE SCHEMA                           │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────┐         ┌─────────────────────────────┐
│       USERS         │         │         DATACARDS           │
├─────────────────────┤         ├─────────────────────────────┤
│ _id: ObjectId (PK)  │────────<│ userId: ObjectId (FK)       │
│ name: String        │    1:N  │ _id: ObjectId (PK)          │
│ email: String (U)   │         │ title: String               │
│ password: String    │         │ description: String         │
│ createdAt: Date     │         │ fields: [FieldSchema]       │
└─────────────────────┘         │ template: String            │
                                │ visibility: String          │
                                │ shareToken: String (U)      │
                                │ shareExpiry: Date           │
                                │ tags: [String]              │
                                │ generatedByLLM: Boolean     │
                                │ createdAt: Date             │
                                │ updatedAt: Date             │
                                └─────────────────────────────┘
                                              │
                                              │ embedded
                                              ▼
                                ┌─────────────────────────────┐
                                │      FIELD (Embedded)       │
                                ├─────────────────────────────┤
                                │ _id: ObjectId               │
                                │ label: String               │
                                │ value: String (encrypted?)  │
                                │ type: Enum                  │
                                │ encrypted: Boolean          │
                                └─────────────────────────────┘

Legend: PK = Primary Key, FK = Foreign Key, U = Unique
```

### 9.2 User Schema

```javascript
{
  name: {
    type: String,
    required: true,
    maxlength: 50
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true
  },
  password: {
    type: String,
    required: true,
    minlength: 8,
    select: false  // Never returned in queries
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}
```

### 9.3 Datacard Schema

```javascript
{
  userId: {
    type: ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  title: {
    type: String,
    required: true,
    maxlength: 100
  },
  fields: [{
    label: String,
    value: String,      // Encrypted if encrypted: true
    type: Enum['text', 'email', 'phone', 'date', 'url', 'image', 'textarea'],
    encrypted: Boolean
  }],
  template: Enum['default', 'professional', 'minimal', 'creative'],
  visibility: Enum['private', 'public'],
  shareToken: String,   // For sharing
  shareExpiry: Date,
  tags: [String],
  generatedByLLM: Boolean,
  timestamps: true      // createdAt, updatedAt
}
```

---

## 10. Testing Results

### 10.1 API Endpoint Tests

```
┌─────────────────────────────────────────────────────────────┐
│                    API TEST RESULTS                          │
├─────────────────────────────────────────────────────────────┤
│  Test                              │ Status │ Response      │
├────────────────────────────────────┼────────┼───────────────┤
│  Health check                      │   ✅   │ 200 OK        │
│  404 handler                       │   ✅   │ 404 Not Found │
│  Register validation (empty)       │   ✅   │ 400 Error     │
│  Register validation (weak pass)   │   ✅   │ 400 Error     │
│  Login validation (empty)          │   ✅   │ 400 Error     │
│  Protected route (no token)        │   ✅   │ 401 Unauth    │
│  Protected route (bad token)       │   ✅   │ 401 Unauth    │
│  Cards endpoint (no auth)          │   ✅   │ 401 Unauth    │
│  LLM endpoint (no auth)            │   ✅   │ 401 Unauth    │
│  Rate limiting                     │   ✅   │ 429 Limited   │
└────────────────────────────────────┴────────┴───────────────┘
```

### 10.2 Encryption Tests

```
┌─────────────────────────────────────────────────────────────┐
│                  ENCRYPTION TEST RESULTS                     │
├─────────────────────────────────────────────────────────────┤
│  Test                              │ Status │ Details       │
├────────────────────────────────────┼────────┼───────────────┤
│  Key generation                    │   ✅   │ 256-bit keys  │
│  AES-256-GCM encryption            │   ✅   │ Working       │
│  Decryption                        │   ✅   │ Data matches  │
│  Random IV per encryption          │   ✅   │ Unique each   │
│  Tamper detection                  │   ✅   │ Rejects bad   │
│  SHA-256 hashing                   │   ✅   │ 64 hex chars  │
└────────────────────────────────────┴────────┴───────────────┘
```

### 10.3 Security Validation

```
┌─────────────────────────────────────────────────────────────┐
│               SECURITY FEATURE VALIDATION                    │
├─────────────────────────────────────────────────────────────┤
│  Feature                           │ Status │ Notes         │
├────────────────────────────────────┼────────┼───────────────┤
│  Password hashing (bcrypt)         │   ✅   │ 12 rounds     │
│  JWT authentication                │   ✅   │ 7-day expiry  │
│  Input validation                  │   ✅   │ All endpoints │
│  Rate limiting                     │   ✅   │ 4 tiers       │
│  Security headers (Helmet)         │   ✅   │ All headers   │
│  CORS restriction                  │   ✅   │ Single origin │
│  AES-256 encryption                │   ✅   │ GCM mode      │
│  Prompt injection defense          │   ✅   │ Sanitization  │
└────────────────────────────────────┴────────┴───────────────┘
```

---

## 11. File Structure

```
secure-datacard-app/
│
├── backend/
│   ├── config/
│   │   └── db.js                 # MongoDB connection
│   │
│   ├── controllers/
│   │   ├── authController.js     # Auth logic (register, login)
│   │   ├── cardController.js     # CRUD + sharing logic
│   │   └── llmController.js      # LLM generation logic
│   │
│   ├── middleware/
│   │   ├── auth.js               # JWT verification
│   │   ├── validator.js          # Input validation rules
│   │   └── rateLimiter.js        # Rate limiting configs
│   │
│   ├── models/
│   │   ├── User.js               # User schema + bcrypt
│   │   └── Datacard.js           # Datacard schema
│   │
│   ├── routes/
│   │   ├── authRoutes.js         # /api/auth/*
│   │   ├── cardRoutes.js         # /api/cards/*
│   │   └── llmRoutes.js          # /api/generate/*
│   │
│   ├── utils/
│   │   ├── encryption.js         # AES-256-GCM functions
│   │   └── llmService.js         # OpenAI API integration
│   │
│   ├── .env                      # Environment variables
│   ├── .env.example              # Environment template
│   ├── .gitignore                # Git ignore rules
│   ├── package.json              # Dependencies
│   └── server.js                 # Express entry point
│
├── frontend/                      # (To be created - Week 6)
│
├── docs/
│   ├── API_DOCUMENTATION.md      # API reference
│   ├── SECURITY.md               # Security documentation
│   └── PROJECT_DOCUMENTATION.md  # This document
│
├── .gitignore                    # Root git ignore
├── README.md                     # Project overview
└── PROJECT_PLAN.md               # 12-week plan
```

---

## 12. Setup Instructions

### 12.1 Prerequisites

- Node.js v18+ (LTS)
- npm v9+
- MongoDB Atlas account (or local MongoDB)
- Git

### 12.2 Installation Steps

```bash
# 1. Clone the repository
git clone <repository-url>
cd secure-datacard-app

# 2. Install backend dependencies
cd backend
npm install

# 3. Configure environment
cp .env.example .env
# Edit .env with your values:
# - MONGODB_URI (from MongoDB Atlas)
# - JWT_SECRET (generate secure random string)
# - ENCRYPTION_KEY (32+ characters)

# 4. Start the server
npm run dev    # Development with nodemon
# OR
npm start      # Production
```

### 12.3 Environment Variables

```bash
# Server
PORT=5001
NODE_ENV=development

# Database
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/secure-datacard

# Security
JWT_SECRET=your-super-secret-jwt-key-min-32-chars
JWT_EXPIRE=7d
ENCRYPTION_KEY=your-32-character-encryption-key!

# Frontend
FRONTEND_URL=http://localhost:3000

# LLM (optional)
OPENAI_API_KEY=sk-your-openai-api-key
```

### 12.4 Testing the Installation

```bash
# Start server
npm run dev

# Test health endpoint
curl http://localhost:5001/api/health

# Expected response:
# {"status":"OK","message":"Secure Datacard API is running","database":"connected"}
```

---

## 13. Next Steps

### 13.1 Immediate (Week 6)

1. **Set up MongoDB Atlas**
   - Create account at mongodb.com/atlas
   - Create free M0 cluster
   - Configure network access
   - Get connection string
   - Update .env file

2. **Test with database connected**
   - Register a test user
   - Create test datacards
   - Verify encryption works

### 13.2 Short-term (Weeks 6-8)

1. **Create React frontend**
   - Initialize with create-react-app
   - Set up Tailwind CSS
   - Create auth components
   - Build dashboard and card editor

### 13.3 Medium-term (Weeks 9-11)

1. **Security hardening**
   - OWASP ZAP testing
   - Fix vulnerabilities
   - Add audit logging

2. **Testing**
   - Unit tests with Jest
   - Integration tests
   - Security tests

3. **Deployment**
   - Dockerize application
   - Deploy to cloud
   - Configure HTTPS

### 13.4 Final (Week 12)

1. **Documentation**
   - Complete project report
   - Prepare presentation
   - Create demo video

---

## Appendix A: Glossary

| Term | Definition |
|------|------------|
| JWT | JSON Web Token - secure token for authentication |
| AES-256-GCM | Advanced Encryption Standard with Galois/Counter Mode |
| bcrypt | Password hashing algorithm with salt |
| CORS | Cross-Origin Resource Sharing |
| OWASP | Open Web Application Security Project |
| LLM | Large Language Model (e.g., GPT-4, Claude) |
| ODM | Object Document Mapper (Mongoose) |

---

## Appendix B: References

1. OWASP Top 10 - https://owasp.org/Top10/
2. Express.js Security Best Practices - https://expressjs.com/en/advanced/best-practice-security.html
3. MongoDB Security Checklist - https://docs.mongodb.com/manual/administration/security-checklist/
4. JWT Best Practices - https://auth0.com/blog/jwt-handbook/
5. Node.js Crypto Documentation - https://nodejs.org/api/crypto.html

---

*Document Version: 1.0*
*Last Updated: February 2026*
*Author: MSc Cyber Security Project*
