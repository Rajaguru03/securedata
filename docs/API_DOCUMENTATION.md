# API Documentation

## Base URL
```
http://localhost:5000/api
```

## Authentication

All protected routes require a JWT token in the Authorization header:
```
Authorization: Bearer <your_jwt_token>
```

---

## Auth Endpoints

### Register User
```http
POST /auth/register
```

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "SecurePass123"
}
```

**Response (201):**
```json
{
  "success": true,
  "message": "Registration successful",
  "data": {
    "user": {
      "id": "user_id",
      "name": "John Doe",
      "email": "john@example.com"
    },
    "token": "jwt_token_here"
  }
}
```

### Login User
```http
POST /auth/login
```

**Request Body:**
```json
{
  "email": "john@example.com",
  "password": "SecurePass123"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "id": "user_id",
      "name": "John Doe",
      "email": "john@example.com"
    },
    "token": "jwt_token_here"
  }
}
```

### Get Current User
```http
GET /auth/me
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "user_id",
      "name": "John Doe",
      "email": "john@example.com",
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  }
}
```

---

## Datacard Endpoints

### List All Cards
```http
GET /cards
Authorization: Bearer <token>
```

**Query Parameters:**
- `page` (default: 1)
- `limit` (default: 10)
- `sort` (default: -createdAt)

**Response (200):**
```json
{
  "success": true,
  "data": {
    "datacards": [...],
    "pagination": {
      "current": 1,
      "pages": 5,
      "total": 50
    }
  }
}
```

### Create Card
```http
POST /cards
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "title": "My Professional Card",
  "description": "Business contact info",
  "fields": [
    {
      "label": "Name",
      "value": "John Doe",
      "type": "text",
      "encrypted": false
    },
    {
      "label": "Email",
      "value": "john@example.com",
      "type": "email",
      "encrypted": false
    },
    {
      "label": "SSN",
      "value": "123-45-6789",
      "type": "text",
      "encrypted": true
    }
  ],
  "template": "professional",
  "visibility": "private",
  "tags": ["work", "contact"]
}
```

**Response (201):**
```json
{
  "success": true,
  "message": "Datacard created successfully",
  "data": {
    "datacard": { ... }
  }
}
```

### Get Single Card
```http
GET /cards/:id
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "datacard": { ... }
  }
}
```

### Update Card
```http
PUT /cards/:id
Authorization: Bearer <token>
```

**Request Body:** Same as Create Card

**Response (200):**
```json
{
  "success": true,
  "message": "Datacard updated successfully",
  "data": {
    "datacard": { ... }
  }
}
```

### Delete Card
```http
DELETE /cards/:id
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "success": true,
  "message": "Datacard deleted successfully"
}
```

### Generate Share Link
```http
POST /cards/:id/share
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "expiryDays": 7
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "shareToken": "random_token_here",
    "shareExpiry": "2024-01-08T00:00:00.000Z",
    "shareUrl": "http://localhost:3000/card/shared/random_token_here"
  }
}
```

### View Shared Card
```http
GET /cards/shared/:token
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "datacard": {
      "title": "Card Title",
      "fields": [
        { "label": "Name", "value": "John", "encrypted": false },
        { "label": "SSN", "value": "••••••••", "encrypted": true }
      ]
    }
  }
}
```

---

## LLM Generation Endpoints

### Generate Datacard Content
```http
POST /generate
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "prompt": "Create a professional business card for a software engineer"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Datacard content generated successfully",
  "data": {
    "generated": {
      "title": "Professional Profile",
      "description": "Business contact information card",
      "fields": [...],
      "template": "professional",
      "tags": ["professional", "business"]
    },
    "generatedByLLM": true
  }
}
```

### Get Templates
```http
GET /generate/templates
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "templates": [
      {
        "id": "professional",
        "name": "Professional Profile",
        "description": "Business card style",
        "examplePrompt": "Create a professional profile card..."
      }
    ]
  }
}
```

---

## Error Responses

### Validation Error (400)
```json
{
  "error": "Validation failed",
  "details": [
    { "field": "email", "message": "Please provide a valid email" }
  ]
}
```

### Unauthorized (401)
```json
{
  "error": "Not authorized to access this route. Please log in."
}
```

### Forbidden (403)
```json
{
  "error": "Not authorized to access this datacard"
}
```

### Not Found (404)
```json
{
  "error": "Datacard not found"
}
```

### Rate Limited (429)
```json
{
  "error": "Too many requests from this IP, please try again after 15 minutes"
}
```

### Server Error (500)
```json
{
  "error": "Internal server error"
}
```
