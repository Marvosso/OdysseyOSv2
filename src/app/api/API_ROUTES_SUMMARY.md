# Next.js API Routes - Summary

## ✅ Completed

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
├── lib/
│   └── api/
│       ├── errors.ts              # Error handling utilities
│       ├── response.ts            # Response helpers
│       ├── rateLimit.ts           # Rate limiting foundation
│       └── session.ts             # Session management (placeholder)
└── middleware.ts                  # Next.js global middleware
```

## API Endpoints

### Stories CRUD

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/stories` | List all stories (metadata) |
| POST | `/api/stories` | Create a new story |
| GET | `/api/stories/[id]` | Get a story by ID |
| PATCH | `/api/stories/[id]` | Update a story |
| DELETE | `/api/stories/[id]` | Delete a story |

### Session (Placeholder)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/session` | Get current session |
| POST | `/api/session` | Create/login session |
| DELETE | `/api/session` | Logout/invalidate session |

## Features

### ✅ Clean API Boundaries
- Consistent response format
- Type-safe request/response handling
- Clear separation of concerns

### ✅ Error Handling
- Standardized error responses
- Error codes and messages
- Proper HTTP status codes

### ✅ Rate Limiting Foundation
- In-memory rate limiting
- Configurable limits per endpoint
- Rate limit headers in responses
- Ready for Redis integration

### ✅ Session Placeholder
- Mock session management
- Ready for auth provider integration
- Session validation

### ✅ Middleware Support
- Global Next.js middleware
- Rate limiting
- CORS headers
- Request/response headers

## Response Format

### Success Response
```json
{
  "success": true,
  "data": { ... },
  "meta": {
    "timestamp": "2024-01-01T00:00:00.000Z"
  }
}
```

### Error Response
```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Error message",
    "details": { ... }
  },
  "meta": {
    "timestamp": "2024-01-01T00:00:00.000Z"
  }
}
```

## Rate Limiting

- **Strict**: 10 requests/minute (session endpoints)
- **Standard**: 60 requests/minute (story endpoints)
- **Relaxed**: 100 requests/minute (optional)

Rate limit headers:
- `X-RateLimit-Limit`: Maximum requests
- `X-RateLimit-Remaining`: Remaining requests
- `X-RateLimit-Reset`: Reset timestamp

## Session Management

Currently returns mock sessions when:
- `Authorization: Bearer <token>` header is present
- `X-Session-Token: <token>` header is present

**TODO**: Implement actual authentication

## Usage Example

```typescript
// Create a story
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
} else {
  console.error('Error:', data.error);
}
```

## Error Codes

- `BAD_REQUEST` (400)
- `UNAUTHORIZED` (401)
- `FORBIDDEN` (403)
- `NOT_FOUND` (404)
- `CONFLICT` (409)
- `VALIDATION_ERROR` (422)
- `RATE_LIMIT_EXCEEDED` (429)
- `INTERNAL_ERROR` (500)
- `SERVICE_UNAVAILABLE` (503)

## Future Enhancements

- [ ] Implement actual authentication
- [ ] Add request validation middleware
- [ ] Add response caching
- [ ] Add API versioning
- [ ] Add request logging
- [ ] Add OpenAPI/Swagger docs
- [ ] Add Redis for rate limiting
- [ ] Add database integration

## Testing

### Test with Mock Session
```typescript
const headers = {
  'Authorization': 'Bearer mock-token',
};
```

### Test with InMemoryAdapter
```typescript
import { getStoryStorage } from '@/lib/storage';
getStoryStorage({ adapterType: 'inMemory' });
```

---

**API routes are ready to use!** 🎉
