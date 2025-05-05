import { v4 as uuidv4 } from 'uuid';

/**
 * Represents a chat message
 */
export interface ChatMessage {
  role: 'human' | 'assistant' | 'system';
  content: string;
  timestamp?: Date;
}

/**
 * Structure for storing chat sessions
 */
interface SessionStore {
  [sessionId: string]: {
    history: ChatMessage[];
    lastUpdated: Date;
    conversationWindowSize?: number;
  };
}

/**
 * Simple in-memory session manager for chat history
 * In a production environment, consider using MongoDB or Redis for persistence
 */
class SessionManager {
  private sessions: SessionStore = {};
  private readonly maxSessionAge: number = 1000 * 60 * 60 * 24; // 24 hours
  private defaultWindowSize: number = 10; // Default window size
  
  /**
   * Gets a session by ID or creates a new one
   */
  public getOrCreateSession(sessionId?: string): { sessionId: string; history: ChatMessage[] } {
    // Generate a new ID if none provided
    const id = sessionId || uuidv4();
    
    // Create new session if it doesn't exist or has expired
    if (!this.sessions[id] || this.isSessionExpired(id)) {
      this.sessions[id] = {
        history: [],
        lastUpdated: new Date(),
        conversationWindowSize: this.defaultWindowSize
      };
    } else {
      // Update the last activity time
      this.sessions[id].lastUpdated = new Date();
    }
    
    return {
      sessionId: id,
      history: this.sessions[id].history
    };
  }
  
  /**
   * Adds a message to a session's history
   */
  public addMessage(sessionId: string, message: ChatMessage): void {
    const session = this.getOrCreateSession(sessionId);
    
    // Add timestamp if not provided
    if (!message.timestamp) {
      message.timestamp = new Date();
    }
    
    this.sessions[sessionId].history.push(message);
    this.sessions[sessionId].lastUpdated = new Date();
  }
  
  /**
   * Checks if a session has expired
   */
  private isSessionExpired(sessionId: string): boolean {
    if (!this.sessions[sessionId]) return true;
    
    const lastUpdated = this.sessions[sessionId].lastUpdated;
    const now = new Date();
    return now.getTime() - lastUpdated.getTime() > this.maxSessionAge;
  }
  
  /**
   * Cleans up expired sessions (call this periodically)
   */
  public cleanupExpiredSessions(): void {
    const now = Date.now();
    
    Object.keys(this.sessions).forEach(sessionId => {
      if (this.isSessionExpired(sessionId)) {
        delete this.sessions[sessionId];
      }
    });
  }
  
  /**
   * Gets the formatted chat history for context window
   * Limited to the configured window size (or default)
   */
  public getFormattedHistory(sessionId: string, overrideWindowSize?: number): ChatMessage[] {
    const session = this.getOrCreateSession(sessionId);
    const history = session.history;
    
    // Determine window size to use
    const windowSize = overrideWindowSize || 
                      this.sessions[sessionId].conversationWindowSize || 
                      this.defaultWindowSize;
    
    // Get the last N messages from history
    return history.slice(-windowSize);
  }
  
  /**
   * Sets the conversation window size for a specific session
   */
  public setConversationWindowSize(sessionId: string, windowSize: number): void {
    if (this.sessions[sessionId]) {
      this.sessions[sessionId].conversationWindowSize = windowSize;
    }
  }
  
  /**
   * Gets the conversation window size for a specific session
   */
  public getConversationWindowSize(sessionId: string): number {
    return this.sessions[sessionId]?.conversationWindowSize || this.defaultWindowSize;
  }
  
  /**
   * Sets the default conversation window size for new sessions
   */
  public setDefaultWindowSize(size: number): void {
    if (size > 0) {
      this.defaultWindowSize = size;
    }
  }
  
  /**
   * Gets the full chat history for a session (without window limitations)
   */
  public getFullHistory(sessionId: string): ChatMessage[] {
    const session = this.getOrCreateSession(sessionId);
    return [...session.history]; // Return a copy to avoid external mutation
  }
}

// Export a singleton instance
export const sessionManager = new SessionManager();

// Setup cleanup interval (every hour)
setInterval(() => {
  sessionManager.cleanupExpiredSessions();
}, 1000 * 60 * 60); 