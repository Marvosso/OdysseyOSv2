# API Routes Documentation

Minimal Next.js API routes with clean boundaries, error handling, and middleware support.

## Structure

```
src/
├── app/
│   └── api/
│       ├── stories/
│       │   ├── route.ts          # GET, POST /api/stories
│       │   └── [id]/
│       │       └── route.ts       # GET, PATCH, DELETE /api/stories/[id]
│       └── session/
│           └── route.ts          # GET, POST, DELETE /api/session
└── lib/
    └── api/
        ├── errors.ts              # Error handling
        ├── response.ts             # Response helpers
        ├── rateLimit.ts           # Rate limiting
        └── session.ts             # Session management (placeholder)
```

## API Endpoints

### Stories

#### `GET /api/stories`
List all stories (returns metadata only).

**Headers:**
- `Authorization: Bearer <token>` (placeholder)
- `X-Session-Token: <token>` (placeholder)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "story-123",
      "title": "My Story",
      "status": "draft",
      "wordCount": 5000,
      "updatedAt": "2024-01-01T00:00:00.000Z",
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  ],
  "meta": {
    "timestamp": "2024-01-01T00:00:00.000Z"
  }
}
```

#### `POST /api/stories`
Create a new story.

**Request Body:**
```json
{
  "title": "My New Story",
  "genre": "fiction",
  "targetAudience": "adults",
  "themes": ["adventure"],
  "status": "draft"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "story-123",
    "title": "My New Story",
    ...
  }
}
```

#### `GET /api/stories/[id]`
Get a story by ID.

#### `PATCH /api/stories/[id]`
Update a story.

**Request Body:**
```json
{
  "title": "Updated Title",
  "status": "published"
}
```

#### `DELETE /api/stories/[id]`
Delete a story.

### Session

#### `GET /api/session`
Get current session.

**Response:**
```json
{
  "success": true,
  "data": {
    "userId": "user-123",
    "sessionId": "session-456",
    "expiresAt": 1234567890,
    "user": {
      "email": "user@example.com",
      "name": "User"
    }
  }
}
```

#### `POST /api/session`
Create/login session (placeholder).

**Request Body:**
```json
{
  "userId": "user-123",
  "email": "user@example.com"
}
```

#### `DELETE /api/session`
Logout/invalidate session.

## Error Handling

All errors follow a consistent format:

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message",
    "details": {}
  },
  "meta": {
    "timestamp": "2024-01-01T00:00:00.000Z"
  }
}
```

### Error Codes

- `BAD_REQUEST` (400) - Invalid request
- `UNAUTHORIZED` (401) - Authentication required
- `FORBIDDEN` (403) - Access denied
- `NOT_FOUND` (404) - Resource not found
- `CONFLICT` (409) - Resource conflict
- `VALIDATION_ERROR` (422) - Validation failed
- `RATE_LIMIT_EXCEEDED` (429) - Too many requests
- `INTERNAL_ERROR` (500) - Server error
- `SERVICE_UNAVAILABLE` (503) - Service unavailable

## Rate Limiting

Rate limiting is implemented with configurable limits:

- **Strict**: 10 requests/minute
- **Standard**: 60 requests/minute
- **Relaxed**: 100 requests/minute

Rate limit headers are included in responses:
- `X-RateLimit-Remaining`: Remaining requests
- `X-RateLimit-Reset`: Reset timestamp

When rate limit is exceeded:
```json
{
  "success": false,
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Rate limit exceeded"
  }
}
```

## Session Management (Placeholder)

Currently returns mock sessions. To use:

1. Include `Authorization` header:
   ```
   Authorization: Bearer <token>
   ```

2. Or include `X-Session-Token` header:
   ```
   X-Session-Token: <token>
   ```

**TODO**: Implement actual authentication:
- JWT token validation
- Session cookies
- OAuth integration
- API key authentication

## Middleware Support

The API is designed to support future middleware:

### Current Middleware
- Rate limiting
- Session validation
- Error handling

### Future Middleware
- Authentication/authorization
- Request logging
- CORS handling
- Request validation
- Response caching
- API versioning

## Usage Examples

### Create a Story

```typescript
const response = await fetch('/api/stories', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer <token>',
  },
  body: JSON.stringify({
    title: 'My Story',
    genre: 'fiction',
  }),
});

const data = await response.json();
if (data.success) {
  console.log('Story created:', data.data);
}
```

### Get a Story

```typescript
const response = await fetch('/api/stories/story-123', {
  headers: {
    'Authorization': 'Bearer <token>',
  },
});

const data = await response.json();
if (data.success) {
  console.log('Story:', data.data);
}
```

### Update a Story

```typescript
const response = await fetch('/api/stories/story-123', {
  method: 'PATCH',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer <token>',
  },
  body: JSON.stringify({
    title: 'Updated Title',
  }),
});
```

## Testing

### Test with InMemoryAdapter

```typescript
// In test setup
import { getStoryStorage } from '@/lib/storage';
getStoryStorage({ adapterType: 'inMemory' });
```

### Mock Session

```typescript
// Include auth header in requests
const headers = {
  'Authorization': 'Bearer mock-token',
};
```

## Future Enhancements

- [ ] Implement actual authentication
- [ ] Add request validation middleware
- [ ] Add response caching
- [ ] Add API versioning
- [ ] Add request logging
- [ ] Add CORS configuration
- [ ] Add OpenAPI/Swagger documentation
- [ ] Add Redis for rate limiting
- [ ] Add database integration
