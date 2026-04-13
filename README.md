# Secure Datacard Application

A secure web application for creating personalized datacards with LLM-powered auto-generation.

## MSc Cyber Security Project

This project demonstrates secure web application development practices including:
- JWT-based authentication
- AES-256 field-level encryption
- Input validation and sanitization
- Rate limiting and security headers
- LLM integration with prompt injection defenses

## Project Structure

```
secure-datacard-app/
├── backend/                 # Express.js REST API
│   ├── config/             # Database configuration
│   ├── controllers/        # Route handlers
│   ├── middleware/         # Auth, validation, rate limiting
│   ├── models/             # MongoDB schemas
│   ├── routes/             # API routes
│   ├── utils/              # Encryption, LLM service
│   └── server.js           # Entry point
├── frontend/               # React application
└── docs/                   # Documentation
```

## Getting Started

### Prerequisites
- Node.js v18+ (LTS recommended)
- MongoDB (local or Atlas)
- OpenAI API key (for LLM features)

### Backend Setup

1. Navigate to backend directory:
   ```bash
   cd backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create environment file:
   ```bash
   cp .env.example .env
   ```

4. Edit `.env` with your configuration:
   ```
   MONGODB_URI=your_mongodb_connection_string
   JWT_SECRET=your_secure_jwt_secret
   ENCRYPTION_KEY=your_32_character_key
   OPENAI_API_KEY=your_openai_api_key
   ```

5. Start the server:
   ```bash
   npm run dev
   ```

### Frontend Setup

1. Navigate to frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start development server:
   ```bash
   npm start
   ```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user (protected)

### Datacards
- `GET /api/cards` - List user's datacards (protected)
- `POST /api/cards` - Create datacard (protected)
- `GET /api/cards/:id` - Get single datacard (protected)
- `PUT /api/cards/:id` - Update datacard (protected)
- `DELETE /api/cards/:id` - Delete datacard (protected)
- `POST /api/cards/:id/share` - Generate share link (protected)
- `GET /api/cards/shared/:token` - View shared card (public)

### LLM Generation
- `POST /api/generate` - Generate datacard content (protected)
- `GET /api/generate/templates` - Get template suggestions (protected)

## Security Features

1. **Authentication**: JWT tokens with bcrypt password hashing
2. **Authorization**: User can only access their own datacards
3. **Encryption**: AES-256-GCM for sensitive field values
4. **Rate Limiting**: Prevents brute force and API abuse
5. **Input Validation**: express-validator for all inputs
6. **Security Headers**: Helmet.js configuration
7. **CORS**: Restricted to frontend origin
8. **Prompt Injection Defense**: Input sanitization for LLM

## Technologies

- **Backend**: Node.js, Express.js, MongoDB, Mongoose
- **Security**: bcryptjs, jsonwebtoken, helmet, express-rate-limit
- **Frontend**: React, Tailwind CSS, Axios
- **LLM**: OpenAI API / Claude API

## License

This project is for educational purposes as part of MSc Cyber Security coursework.
