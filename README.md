# Zenith Eclipse Chatbot – System Context & Development Overview

## Project Vision & Product Context

Zenith Eclipse is an AI-powered chatbot web application built with Next.js and React. Its goal is to provide users with intelligent, context-aware responses using a Retrieval-Augmented Generation (RAG) approach, leveraging OpenAI, LangChain, and MongoDB for backend intelligence and persistence.

**Core Objectives:**
- User-friendly, natural chat interface
- Robust backend for context-aware, accurate responses
- Persistent conversation history for context
- Analytics tracking for system improvement
- Graceful error handling and recovery

**User Experience Goals:**
- Natural, flowing conversations
- Contextual understanding and memory
- Responsive, accessible interface
- Clear error feedback and resilience

---

## Technical Architecture

### Frontend
- **Framework:** Next.js 15.3.1, React 19
- **UI Components:** Modal-based chat (ChatModal), message bubbles, loading indicators, action buttons (clear/export), notification modals
- **State Management:** React `useState` for messages, loading, errors, modal visibility
- **UX Features:** Character counter, input validation, error modals, loading states, responsive design

### Backend
- **API Layer:** Next.js API routes (RESTful, JSON payloads)
- **AI Layer:** LangChain, LangGraph, OpenAI for RAG-based response generation
- **Database:** MongoDB for session and analytics persistence
- **Session Management:** Unique session IDs, conversation history, context windowing

### Analytics
- **Endpoints:** Track user interactions, performance metrics, session analytics
- **Logging:** Async, non-blocking analytics logging

---

## System Patterns & Data Flow

- **Client-Server:** React frontend communicates with backend API routes
- **Component-Based UI:** Modular React components for each UI element
- **Stateful Frontend:** Local state for chat, input, loading, and errors
- **API-Driven Backend:** Request/response with error handling and status codes

**Message Flow:**
1. User submits input via chat modal
2. Message sent to `/api/chat` endpoint
3. Backend processes with RAG, updates session, returns response
4. Frontend updates chat state and UI

**Analytics Flow:**
- User actions and system metrics are logged via analytics API endpoints

---

## Error Handling

- **Frontend:** Try/catch for async ops, error modals, loading state management
- **Backend:** Try/catch in API routes, user-friendly error messages, server-side logging

---

## Progress & Development Status

- **Completed:**
  - Modal chat interface with branding
  - Action buttons (clear/export)
  - API integration for chat and analytics
  - Session management and RAG-based AI
  - Comprehensive error handling and input validation
  - Responsive design foundations

- **In Progress / Next Steps:**
  - Improve mobile responsiveness
  - Build analytics dashboard
  - Enhance UI (timestamps, advanced bubble styling)
  - Add unit tests and documentation for RAG system

- **Blockers:**
  - Input validation and mobile responsiveness need improvement
  - Error feedback can be enhanced

---

## Development & System Rules

- **Component composition** for UI
- **TypeScript interfaces** for type safety
- **Async/await** for API calls
- **Service separation** for business logic
- **Session management** for context continuity
- **Error boundary pattern** for robust error handling

---

## Product & Stakeholder Requirements

- Maintain conversation context across exchanges
- Provide visual feedback during processing
- Handle errors gracefully
- Use RAG for enhanced response quality
- Track analytics for improvement
- Clean, minimal UI

**Stakeholders:**
- End users: Need accurate, helpful responses
- Developers: Need maintainable, well-structured code
- Product owners: Need analytics for performance
- Business: Needs scalable, cost-effective system

---

## Current Focus

- Enhancing mobile responsiveness
- Building analytics dashboard
- Improving UI/UX with advanced features

---

This document provides a high-level overview of the Zenith Eclipse chatbot system for new developers and stakeholders. For more details, refer to the codebase.