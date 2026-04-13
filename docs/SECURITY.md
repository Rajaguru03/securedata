# Security Documentation

## Overview

This document outlines the security measures implemented in the Secure Datacard Application.

---

## 1. Authentication & Authorization

### JWT (JSON Web Tokens)
- **Implementation**: `middleware/auth.js`
- Tokens are signed with a secret key (JWT_SECRET)
- Default expiration: 7 days
- Tokens must be sent in the Authorization header as Bearer tokens

### Password Security
- **Implementation**: `models/User.js`
- Passwords hashed using bcrypt with 12 salt rounds
- Passwords never stored in plain text
- Password field excluded from queries by default (`select: false`)

### Password Requirements
- Minimum 8 characters
- At least one uppercase letter
- At least one lowercase letter
- At least one number

---

## 2. Data Encryption

### Field-Level Encryption (AES-256-GCM)
- **Implementation**: `utils/encryption.js`
- Algorithm: AES-256-GCM (Authenticated Encryption)
- Random IV (Initialization Vector) for each encryption
- Authentication tag prevents tampering
- Format: `iv:authTag:encryptedData`

### What Gets Encrypted
- Any datacard field marked with `encrypted: true`
- Decrypted only for the owner
- Masked as `••••••••` for public/shared access

### Key Management
- Encryption key stored in environment variable
- Key is hashed with SHA-256 to ensure 32-byte length
- Never committed to version control

---

## 3. Input Validation & Sanitization

### Express Validator
- **Implementation**: `middleware/validator.js`
- All user inputs validated before processing
- Type checking, length limits, format validation
- Custom error messages for each validation rule

### Validated Inputs
| Field | Validations |
|-------|-------------|
| Email | Valid email format, normalized |
| Password | Min 8 chars, complexity requirements |
| Name | 2-50 characters, trimmed |
| Datacard title | Max 100 characters |
| Datacard fields | Max 20 fields, field validation |
| LLM prompt | 10-500 characters |

---

## 4. Rate Limiting

### Implementation
- **File**: `middleware/rateLimiter.js`
- Uses `express-rate-limit` package

### Limits by Endpoint
| Endpoint Type | Limit | Window |
|---------------|-------|--------|
| General API | 100 requests | 15 minutes |
| Auth (login/register) | 5 attempts | 15 minutes |
| LLM Generation | 10 requests | 1 hour |
| Datacard CRUD | 50 requests | 15 minutes |

---

## 5. Security Headers

### Helmet.js Configuration
- **Implementation**: `server.js`

Headers set:
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `X-XSS-Protection: 1; mode=block`
- `Strict-Transport-Security` (HSTS)
- `Content-Security-Policy`
- `Referrer-Policy`

---

## 6. CORS (Cross-Origin Resource Sharing)

### Configuration
```javascript
cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
})
```

- Only allows requests from the configured frontend URL
- Credentials (cookies, auth headers) allowed

---

## 7. LLM Prompt Injection Defense

### Implementation
- **File**: `controllers/llmController.js`

### Sanitization Steps
1. Remove system/assistant/user role keywords
2. Remove markdown code blocks
3. Remove potential JSON injection patterns
4. Strip `<>` characters
5. Trim whitespace
6. Enforce 500 character limit
7. Require minimum 10 characters

### System Prompt Design
- Clear separation between system and user messages
- Explicit output format requirements
- Instructions to only output JSON

---

## 8. Database Security

### MongoDB
- Connection string stored in environment variable
- User authentication required
- IP whitelist configuration (MongoDB Atlas)

### Mongoose Security
- Schema validation enforced
- `select: false` for sensitive fields
- Index on userId for efficient queries

---

## 9. Authorization Checks

### Datacard Access Control
- Users can only CRUD their own datacards
- Ownership verified on every request
- Public visibility option for sharing
- Share links with expiration

### Middleware Chain
```
Request → Rate Limit → Auth → Validation → Controller
```

---

## 10. Error Handling

### Production vs Development
- Development: Detailed error messages
- Production: Generic error messages
- Errors logged but not exposed to users

### Sensitive Data
- Stack traces hidden in production
- No database error details exposed
- Generic "Internal server error" message

---

## 11. Security Checklist

### Environment Variables
- [ ] `JWT_SECRET` - Strong random string (32+ chars)
- [ ] `ENCRYPTION_KEY` - 32 bytes for AES-256
- [ ] `MONGODB_URI` - Secure connection string
- [ ] `OPENAI_API_KEY` - API key (never expose)

### Before Deployment
- [ ] Change all default secrets
- [ ] Enable HTTPS only
- [ ] Set `NODE_ENV=production`
- [ ] Configure proper CORS origin
- [ ] Review rate limits
- [ ] Enable MongoDB authentication
- [ ] Set up SSL/TLS certificates

---

## 12. OWASP Top 10 Coverage

| Vulnerability | Mitigation |
|--------------|------------|
| A01: Broken Access Control | JWT auth, ownership checks |
| A02: Cryptographic Failures | AES-256-GCM, bcrypt, HTTPS |
| A03: Injection | Input validation, parameterized queries |
| A04: Insecure Design | Security-first architecture |
| A05: Security Misconfiguration | Helmet.js, secure defaults |
| A06: Vulnerable Components | Regular npm audit |
| A07: Auth Failures | JWT, bcrypt, rate limiting |
| A08: Data Integrity Failures | Input validation, auth tags |
| A09: Logging Failures | Request logging (to implement) |
| A10: SSRF | URL validation (to implement) |

---

## 13. Incident Response

### If a breach is suspected:
1. Rotate JWT_SECRET immediately
2. Rotate ENCRYPTION_KEY (re-encrypt all data)
3. Force password reset for all users
4. Review access logs
5. Notify affected users

---

## 14. Future Improvements

- [ ] Implement refresh tokens
- [ ] Add 2FA (Two-Factor Authentication)
- [ ] Implement audit logging
- [ ] Add CAPTCHA for registration
- [ ] Implement account lockout
- [ ] Add password reset functionality
- [ ] Implement session management
- [ ] Add Content Security Policy headers
