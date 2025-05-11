# Zenith Eclipse Analytics API Documentation

## Overview

The Analytics API provides endpoints for retrieving chatbot usage statistics, session analytics, voice call analytics, conversation quality, and more. All endpoints are RESTful and return JSON. This documentation covers all available endpoints, their parameters, and example responses.

**Base URL (local development):**
```
http://localhost:3000
```

---

## Authentication

> **Note:**  
> If your API is public, no authentication is required. If you add authentication in the future, update this section accordingly.

---

## Endpoints

### 1. **GET `/api/analytics`**

**Description:**  
Returns a status message and a list of available analytics endpoints.

**Request:**  
```http
GET /api/analytics
```

**Response:**
```json
{
  "status": "Success",
  "message": "Analytics API is working",
  "endpoints": [
    "/api/analytics/summary",
    "/api/analytics/session/[sessionId]",
    "/api/analytics/conversation-quality",
    "/api/analytics/top-topics",
    "/api/analytics/conversation-windows",
    "/api/analytics/session/[sessionId]/recommended-window",
    "/api/voice-analytics"
  ]
}
```

---

### 2. **POST `/api/voice-analytics`**

**Description:**  
Logs a voice call interaction (user prompt and bot response) to the database.

**Request:**  
```http
POST /api/voice-analytics
Content-Type: application/json
```

**Body:**
```json
{
  "sessionId": "string (uuid)",
  "userInfo": {
    "fullname": "string",
    "email": "string",
    "phone": "string | null"
  },
  "prompt": "User's spoken prompt",
  "response": "Bot's spoken response",
  "timestamp": "ISO string (optional)",
  "metadata": { /* optional, any extra info */ }
}
```

**Response:**
```json
{
  "status": "Success",
  "message": "Voice interaction logged"
}
```

---

### 3. **GET `/api/voice-analytics`**

**Description:**  
Fetches all logged voice call interactions (for admin/testing).

**Request:**  
```http
GET /api/voice-analytics
```

**Response:**
```json
{
  "status": "Success",
  "data": [
    {
      "sessionId": "string",
      "userInfo": { "fullname": "string", "email": "string", "phone": "string | null" },
      "prompt": "string",
      "response": "string",
      "timestamp": "2024-05-11T13:47:04.044Z",
      "metadata": { /* ... */ }
    }
    // ...
  ]
}
```

---

### 4. **GET `/api/analytics/summary`**

**Description:**  
Returns overall analytics summary for the chatbot.

- `totalInteractions`: Total number of user-bot interactions (messages) in the period.
- `totalConversations`: Total number of unique conversations (distinct session IDs) in the period. All interactions within a session count as a single conversation.

**Request:**  
```http
GET /api/analytics/summary
```

**Query Parameters:**
- `days` (optional, default: 7): Number of days to include in the summary.

**Response:**
```json
{
  "period": "Last 7 days",
  "totalInteractions": 123,
  "totalConversations": 45,
  "avgResponseTimeMs": 1200.5,
  "humanAssistancePercentage": 8.1,
  "categoryCounts": {
    "General": 100,
    "Transport": 15,
    "Commodities": 8
  },
  "dailyInteractions": [
    { "date": "5/1/2024", "count": 20 },
    { "date": "5/2/2024", "count": 18 }
    // ...
  ]
}
```

---

### 5. **GET `/api/analytics/session/[sessionId]`**

**Description:**  
Returns analytics for a specific session, including user info and conversation flow.

**Request:**  
```http
GET /api/analytics/session/{sessionId}
```

**Response:**
```json
{
  "sessionId": "test-session-123",
  "interactionCount": 5,
  "firstInteraction": "2024-05-01T10:00:00.000Z",
  "lastInteraction": "2024-05-01T10:10:00.000Z",
  "sessionDurationMs": 600000,
  "avgResponseTimeMs": 1100,
  "totalResponseTimeMs": 5500,
  "conversationFlow": [
    {
      "timestamp": "2024-05-01T10:00:00.000Z",
      "question": "Hello, what services do you offer?",
      "answer": "We offer ...", // Bot's response
      "category": "General",
      "relevanceScore": 0.95,
      "humanAssistanceNeeded": false,
      "responseTimeMs": 1200
    }
    // ...
  ],
  "hasHumanAssistance": false,
  "userInfo": {
    "fullname": "Test User",
    "email": "test@example.com",
    "phone": "+1234567890"
  }
}
```

---

### 6. **GET `/api/analytics/session/[sessionId]/recommended-window`**

**Description:**  
Returns the recommended conversation window size for a specific session.

**Request:**  
```http
GET /api/analytics/session/{sessionId}/recommended-window
```

**Response:**
```json
{
  "sessionId": "test-session-123",
  "recommendedWindowSize": 7,
  "analysis": {
    "smallWindow": { "avgRelevanceScore": 0.8 },
    "mediumWindow": { "avgRelevanceScore": 0.9 },
    "largeWindow": { "avgRelevanceScore": 0.7 }
  }
}
```

---

### 7. **GET `/api/analytics/sessions`**

**Description:**  
Returns a list of session summaries for the given time range.

**Request:**  
```http
GET /api/analytics/sessions
```

**Query Parameters:**
- `days` (optional, default: 7): Number of days to include.

**Response:**
```json
[
  {
    "sessionId": "test-session-123",
    "interactionCount": 5,
    "firstInteraction": "2024-05-01T10:00:00.000Z",
    "lastInteraction": "2024-05-01T10:10:00.000Z",
    "sessionDurationMs": 600000,
    "avgResponseTimeMs": 1100
  }
  // ...
]
```

---

### 8. **GET `/api/analytics/conversation-quality`**

**Description:**  
Returns conversation quality metrics (relevance, human assistance rate, etc).

**Request:**  
```http
GET /api/analytics/conversation-quality
```

**Query Parameters:**
- `days` (optional, default: 7): Number of days to include.

**Response:**
```json
{
  "period": "Last 7 days",
  "avgRelevanceScore": 0.92,
  "avgResponseQuality": 0.92,
  "humanAssistanceRate": 0.08,
  "categoryDistribution": {
    "General": 100,
    "Transport": 15
  },
  "qualityOverTime": [
    { "date": "5/1/2024", "relevanceScore": 0.9, "responseQuality": 0.9 }
    // ...
  ],
  "topHumanAssistanceQueries": [
    { "query": "How do I get a quote?", "count": 3 }
    // ...
  ]
}
```

---

### 9. **GET `/api/analytics/top-topics`**

**Description:**  
Returns the most common topics/categories by session interactions.

**Request:**  
```http
GET /api/analytics/top-topics
```

**Query Parameters:**
- `days` (optional, default: 30): Number of days to include.
- `limit` (optional, default: 10): Number of top topics to return.

**Response:**
```json
{
  "period": "Last 30 days",
  "totalTopics": 5,
  "totalConversations": 100,
  "topTopics": [
    { "topic": "General", "count": 60, "percentage": 60 },
    { "topic": "Transport", "count": 25, "percentage": 25 }
    // ...
  ],
  "topicTrends": [
    { "date": "5/1/2024", "topics": { "General": 10, "Transport": 5 } }
    // ...
  ]
}
```

---

### 10. **GET `/api/analytics/conversation-windows`**

**Description:**  
Returns analysis of conversation window patterns and optimal context window sizes.

**Request:**  
```http
GET /api/analytics/conversation-windows
```

**Query Parameters:**
- `days` (optional, default: 30): Number of days to include.

**Response:**
```json
{
  "period": "Last 30 days",
  "sessionsAnalyzed": 20,
  "windowSizeEffectiveness": {
    "smallWindow": {
      "size": "1-3 messages",
      "avgRelevanceScore": 0.8,
      "interactionsAnalyzed": 10
    },
    "mediumWindow": {
      "size": "4-7 messages",
      "avgRelevanceScore": 0.9,
      "interactionsAnalyzed": 7
    },
    "largeWindow": {
      "size": "8+ messages",
      "avgRelevanceScore": 0.7,
      "interactionsAnalyzed": 3
    }
  },
  "recommendedWindowSize": "7 messages"
}
```

---

## Deprecated/Unsupported Endpoints

- **User Retention** (`/api/analytics/user-retention`): _No longer supported/maintained._
- **Follow-up Patterns** (`/api/analytics/follow-up-patterns`): _No longer supported/maintained._

---

## General Notes

- All endpoints return JSON.
- All endpoints are **GET** requests (except `/api/chat` and `/api/voice-analytics`, which are POST for logging interactions).
- For endpoints with `[sessionId]`, replace with the actual session ID you want to query.
- Query parameters are optional unless otherwise specified.
- If you receive a 404 or 500 error, check your server logs and ensure your MongoDB connection is active.

---

## Example Usage in JavaScript (Frontend)

```js
// Log a voice call interaction
fetch('/api/voice-analytics', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    sessionId: 'your-session-id',
    userInfo: { fullname: 'Jane Doe', email: 'jane@example.com', phone: '+1234567890' },
    prompt: 'Hello, can you help me?',
    response: 'Of course! How can I assist you?',
    timestamp: new Date().toISOString()
  })
});

// Fetch all voice analytics
fetch('/api/voice-analytics')
  .then(res => res.json())
  .then(data => {
    console.log('Voice Analytics:', data);
  });
```

---

## Error Handling

All error responses will have the following structure:

```json
{
  "status": "Error",
  "message": "Description of the error"
}
```

---

## FAQ

**Q: How do I get a list of all sessions?**  
A: Use `GET /api/analytics/sessions`.

**Q: How do I get analytics for a specific user?**  
A: Use `GET /api/analytics/session/[sessionId]` and look at the `userInfo` field.

**Q: How do I get trending topics?**  
A: Use `GET /api/analytics/top-topics`.

**Q: How do I get voice call analytics?**  
A: Use `GET /api/voice-analytics`.

---

## Contact

For questions or issues, contact the backend team or check the server logs for more details.

---

**End of Documentation** 