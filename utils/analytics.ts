import { MongoClient } from 'mongodb';
import { Document } from '@langchain/core/documents';
import 'dotenv/config';

// MongoDB connection
const { MONGO_URI, MONGO_DB } = process.env;
let client: MongoClient | null = null;
let analyticsCollection: any = null;

/**
 * Analytics interface for interaction data
 */
interface ChatAnalytics {
  timestamp: Date;
  sessionId: string;
  question: string;
  answer: string;
  contextSources: string[];
  responseTimeMs: number;
  humanAssistanceNeeded: boolean;
  category: string;
  relevanceScore: number;
  userAgent?: string;
  ipAddress?: string;
}

/**
 * Initializes the analytics system
 * Returns true if analytics was successfully initialized, false otherwise
 */
export async function initAnalytics(): Promise<boolean> {
  try {
    if (!MONGO_URI || !MONGO_DB) {
      return false;
    }

    // Initialize MongoDB client
    client = new MongoClient(MONGO_URI);
    
    // Test connection
    await client.connect();
    
    // Set up analytics collection
    analyticsCollection = client.db(MONGO_DB).collection('analytics');
    
    // Create indexes for better query performance
    await analyticsCollection.createIndex({ timestamp: 1 });
    await analyticsCollection.createIndex({ sessionId: 1 });
    await analyticsCollection.createIndex({ humanAssistanceNeeded: 1 });
    
    return true;
  } catch (error) {
    console.error('Failed to initialize analytics:', error);
    client = null;
    analyticsCollection = null;
    return false;
  }
}

/**
 * Properly close the analytics MongoDB connection
 */
export async function closeAnalyticsConnection(): Promise<void> {
  if (client) {
    try {
      await client.close();
    } catch (error) {
      console.error('Error closing analytics MongoDB connection:', error);
    } finally {
      client = null;
      analyticsCollection = null;
    }
  }
}

/**
 * Logs chat interaction for analytics and improvement
 */
export async function logInteraction(
  sessionId: string,
  question: string,
  answer: string,
  context: Document[],
  responseTime: number,
  humanAssistanceNeeded: boolean = false,
  category: string = 'General',
  relevanceScore: number = 0,
  userInfo: { userAgent?: string; ipAddress?: string } = {}
): Promise<void> {
  try {
    // Check if analytics is enabled
    if (!analyticsCollection) {
      return;
    }
    
    const contextSources = context.map(doc => 
      doc.metadata?.source || 'Unknown Source'
    );
    
    const analyticsData: ChatAnalytics = {
      timestamp: new Date(),
      sessionId,
      question,
      answer,
      contextSources,
      responseTimeMs: responseTime,
      humanAssistanceNeeded,
      category,
      relevanceScore,
      userAgent: userInfo.userAgent,
      ipAddress: userInfo.ipAddress
    };
    
    // Insert analytics data
    await analyticsCollection.insertOne(analyticsData);
  } catch (error) {
    // Don't let analytics failures affect the main application
    console.error('Failed to log analytics:', error);
  }
}

/**
 * Gets summary statistics for the chatbot
 */
export async function getAnalyticsSummary(days: number = 7): Promise<any> {
  try {
    if (!analyticsCollection) {
      return null;
    }
    
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    
    // Get analytics from the specified time period
    const analyticsData = await analyticsCollection
      .find({ timestamp: { $gte: startDate } })
      .toArray();
    
    if (!analyticsData.length) {
      return {
        period: `Last ${days} days`,
        totalInteractions: 0,
        message: 'No interactions recorded in this period'
      };
    }
    
    // Calculate summary statistics
    const totalInteractions = analyticsData.length;
    const avgResponseTime = analyticsData.reduce(
      (sum, item) => sum + item.responseTimeMs, 0
    ) / totalInteractions;
    
    const humanAssistanceCount = analyticsData.filter(
      item => item.humanAssistanceNeeded
    ).length;
    
    const categoryCounts = analyticsData.reduce((counts, item) => {
      counts[item.category] = (counts[item.category] || 0) + 1;
      return counts;
    }, {});
    
    // Return summary data
    return {
      period: `Last ${days} days`,
      totalInteractions,
      avgResponseTimeMs: avgResponseTime,
      humanAssistancePercentage: (humanAssistanceCount / totalInteractions) * 100,
      categoryCounts
    };
  } catch (error) {
    console.error('Failed to get analytics summary:', error);
    return null;
  }
}

/**
 * Gets recent questions that required human assistance
 * Useful for identifying gaps in the bot's knowledge
 */
export async function getHumanAssistanceQuestions(limit: number = 10): Promise<string[]> {
  try {
    if (!analyticsCollection) {
      return [];
    }
    
    const results = await analyticsCollection
      .find({ humanAssistanceNeeded: true })
      .sort({ timestamp: -1 })
      .limit(limit)
      .project({ question: 1 })
      .toArray();
      
    return results.map(item => item.question);
  } catch (error) {
    console.error('Failed to get human assistance questions:', error);
    return [];
  }
}

/**
 * Gets analytics for a specific session
 */
export async function getSessionAnalytics(sessionId: string): Promise<any> {
  try {
    if (!analyticsCollection) {
      return null;
    }
    
    const interactions = await analyticsCollection
      .find({ sessionId })
      .sort({ timestamp: 1 })
      .toArray();
    
    if (!interactions.length) {
      return {
        sessionId,
        interactionCount: 0,
        message: 'No interactions found for this session'
      };
    }
    
    // Calculate session metrics
    const interactionCount = interactions.length;
    const firstInteraction = interactions[0].timestamp;
    const lastInteraction = interactions[interactions.length - 1].timestamp;
    const sessionDuration = new Date(lastInteraction).getTime() - new Date(firstInteraction).getTime();
    
    // Calculate average and total response times
    const totalResponseTime = interactions.reduce(
      (sum, item) => sum + item.responseTimeMs, 0
    );
    const avgResponseTime = totalResponseTime / interactionCount;
    
    // Track conversation flow
    const conversationFlow = interactions.map(i => ({
      timestamp: i.timestamp,
      question: i.question,
      category: i.category,
      relevanceScore: i.relevanceScore,
      humanAssistanceNeeded: i.humanAssistanceNeeded,
      responseTimeMs: i.responseTimeMs
    }));
    
    return {
      sessionId,
      interactionCount,
      firstInteraction,
      lastInteraction,
      sessionDurationMs: sessionDuration,
      avgResponseTimeMs: avgResponseTime,
      totalResponseTimeMs: totalResponseTime,
      conversationFlow,
      hasHumanAssistance: interactions.some(i => i.humanAssistanceNeeded)
    };
  } catch (error) {
    console.error('Failed to get session analytics:', error);
    return null;
  }
}

/**
 * Gets conversation quality metrics for active sessions
 */
export async function getConversationQualityMetrics(days: number = 7): Promise<any> {
  try {
    if (!analyticsCollection) {
      return null;
    }
    
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    
    // Get unique session IDs and their interaction counts
    const sessions = await analyticsCollection
      .aggregate([
        { $match: { timestamp: { $gte: startDate } } },
        { $group: { _id: "$sessionId", count: { $sum: 1 } } }
      ])
      .toArray();

    if (!sessions.length) {
      return {
        period: `Last ${days} days`,
        totalSessions: 0,
        message: 'No sessions recorded in this period'
      };
    }
    
    // Categorize sessions by length
    const singleQuestionSessions = sessions.filter(s => s.count === 1).length;
    const shortConversations = sessions.filter(s => s.count >= 2 && s.count <= 3).length;
    const mediumConversations = sessions.filter(s => s.count >= 4 && s.count <= 6).length;
    const longConversations = sessions.filter(s => s.count > 6).length;
    
    return {
      period: `Last ${days} days`,
      totalSessions: sessions.length,
      singleQuestionSessions,
      shortConversations,
      mediumConversations,
      longConversations,
      averageInteractionsPerSession: sessions.reduce((sum, s) => sum + s.count, 0) / sessions.length,
      engagementDistribution: {
        singleQuestion: (singleQuestionSessions / sessions.length) * 100,
        shortConversation: (shortConversations / sessions.length) * 100,
        mediumConversation: (mediumConversations / sessions.length) * 100,
        longConversation: (longConversations / sessions.length) * 100
      }
    };
  } catch (error) {
    console.error('Failed to get conversation quality metrics:', error);
    return null;
  }
}

/**
 * Analyzes follow-up question patterns
 */
export async function analyzeFollowUpPatterns(limit: number = 100): Promise<any> {
  try {
    if (!analyticsCollection) {
      return null;
    }
    
    // Get sessions with multiple interactions
    const multiInteractionSessions = await analyticsCollection
      .aggregate([
        { $sort: { timestamp: 1 } },
        { $group: { 
          _id: "$sessionId", 
          count: { $sum: 1 },
          interactions: { $push: "$$ROOT" }
        }},
        { $match: { count: { $gt: 1 } } },
        { $sort: { count: -1 } },
        { $limit: limit }
      ])
      .toArray();
    
    if (!multiInteractionSessions.length) {
      return {
        sessionsAnalyzed: 0,
        message: 'No multi-interaction sessions found'
      };
    }
    
    // Extract common follow-up patterns
    const followUpCategories = {};
    
    multiInteractionSessions.forEach(session => {
      // Sort interactions by timestamp (should already be sorted, but just to be safe)
      const interactions = session.interactions.sort((a, b) => 
        new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
      );
      
      // Analyze category transitions
      for (let i = 1; i < interactions.length; i++) {
        const fromCategory = interactions[i-1].category;
        const toCategory = interactions[i].category;
        const transitionKey = `${fromCategory} → ${toCategory}`;
        
        followUpCategories[transitionKey] = (followUpCategories[transitionKey] || 0) + 1;
      }
    });
    
    return {
      sessionsAnalyzed: multiInteractionSessions.length,
      followUpPatterns: Object.entries(followUpCategories)
        .map(([transition, count]) => ({ transition, count }))
        .sort((a, b) => (b.count as number) - (a.count as number))
    };
  } catch (error) {
    console.error('Failed to analyze follow-up patterns:', error);
    return null;
  }
}

/**
 * Analyzes user retention based on sessionId patterns
 */
export async function analyzeUserRetention(days: number = 30): Promise<any> {
  try {
    if (!analyticsCollection) {
      return null;
    }
    
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    
    // Aggregate sessions by user agent and IP to identify potential returning users
    const userSessions = await analyticsCollection
      .aggregate([
        { $match: { 
          timestamp: { $gte: startDate },
          userAgent: { $exists: true, $ne: null },
          ipAddress: { $exists: true, $ne: null }
        }},
        { $group: { 
          _id: { 
            userAgent: "$userAgent", 
            ipAddress: "$ipAddress" 
          },
          sessions: { $addToSet: "$sessionId" },
          firstSeen: { $min: "$timestamp" },
          lastSeen: { $max: "$timestamp" }
        }}
      ])
      .toArray();
    
    if (!userSessions.length) {
      return {
        period: `Last ${days} days`,
        totalUniqueUsers: 0,
        message: 'No user data available for this period'
      };
    }
    
    const usersWithMultipleSessions = userSessions.filter(u => u.sessions.length > 1);
    
    // Calculate retention metrics
    return {
      period: `Last ${days} days`,
      totalUniqueUsers: userSessions.length,
      returningUsers: usersWithMultipleSessions.length,
      returningPercentage: (usersWithMultipleSessions.length / userSessions.length) * 100,
      averageSessionsPerReturningUser: usersWithMultipleSessions.length > 0 ? 
        usersWithMultipleSessions.reduce((sum, u) => sum + u.sessions.length, 0) / usersWithMultipleSessions.length : 0
    };
  } catch (error) {
    console.error('Failed to analyze user retention:', error);
    return null;
  }
}

/**
 * Gets the most common topics/categories by session interactions
 */
export async function getTopSessionTopics(days: number = 30, limit: number = 10): Promise<any> {
  try {
    if (!analyticsCollection) {
      return null;
    }
    
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    
    // Get categories that lead to longer sessions
    const topicAnalysis = await analyticsCollection
      .aggregate([
        { $match: { timestamp: { $gte: startDate } } },
        // Group by session and get unique categories
        { $group: {
          _id: "$sessionId",
          categories: { $addToSet: "$category" },
          interactionCount: { $sum: 1 }
        }},
        // Unwind categories to count them across sessions
        { $unwind: "$categories" },
        // Group by category and calculate stats
        { $group: {
          _id: "$categories",
          sessionCount: { $sum: 1 },
          totalInteractions: { $sum: "$interactionCount" },
          avgInteractionsPerSession: { $avg: "$interactionCount" }
        }},
        { $sort: { sessionCount: -1 } },
        { $limit: limit }
      ])
      .toArray();
    
    return {
      period: `Last ${days} days`,
      topTopics: topicAnalysis.map(t => ({
        category: t._id,
        sessionCount: t.sessionCount,
        totalInteractions: t.totalInteractions,
        avgInteractionsPerSession: t.avgInteractionsPerSession
      }))
    };
  } catch (error) {
    console.error('Failed to get top session topics:', error);
    return null;
  }
}

/**
 * Analyzes conversation window patterns to identify optimal context window sizes
 */
export async function analyzeConversationWindows(days: number = 30): Promise<any> {
  try {
    if (!analyticsCollection) {
      return null;
    }
    
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    
    // Get sessions with varying lengths
    const sessions = await analyticsCollection
      .aggregate([
        { $match: { timestamp: { $gte: startDate } } },
        { $sort: { timestamp: 1 } },
        { $group: { 
          _id: "$sessionId", 
          interactions: { $push: "$$ROOT" },
          count: { $sum: 1 }
        }},
        { $match: { count: { $gt: 3 } } }, // Only analyze sessions with more than 3 messages
      ])
      .toArray();
    
    if (!sessions.length) {
      return {
        period: `Last ${days} days`,
        sessionsAnalyzed: 0,
        message: 'Not enough data for conversation window analysis'
      };
    }
    
    // Analyze effectiveness of different context window sizes
    const windowAnalysis = {
      smallWindow: { size: '1-3 messages', relevanceSum: 0, count: 0 },
      mediumWindow: { size: '4-7 messages', relevanceSum: 0, count: 0 },
      largeWindow: { size: '8+ messages', relevanceSum: 0, count: 0 }
    };
    
    // Track conversation effectiveness by window size
    sessions.forEach(session => {
      const interactions = session.interactions.sort((a, b) => 
        new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
      );
      
      for (let i = 0; i < interactions.length; i++) {
        const contextSize = Math.min(i, 10); // Maximum context of 10 previous messages
        
        if (contextSize <= 0) continue;
        
        // Categorize by window size
        if (contextSize >= 1 && contextSize <= 3) {
          windowAnalysis.smallWindow.relevanceSum += interactions[i].relevanceScore || 0;
          windowAnalysis.smallWindow.count++;
        } else if (contextSize >= 4 && contextSize <= 7) {
          windowAnalysis.mediumWindow.relevanceSum += interactions[i].relevanceScore || 0;
          windowAnalysis.mediumWindow.count++;
        } else if (contextSize >= 8) {
          windowAnalysis.largeWindow.relevanceSum += interactions[i].relevanceScore || 0;
          windowAnalysis.largeWindow.count++;
        }
      }
    });
    
    // Calculate average relevance scores for each window size
    const result = {
      period: `Last ${days} days`,
      sessionsAnalyzed: sessions.length,
      windowSizeEffectiveness: {
        smallWindow: {
          size: windowAnalysis.smallWindow.size,
          avgRelevanceScore: windowAnalysis.smallWindow.count > 0 
            ? windowAnalysis.smallWindow.relevanceSum / windowAnalysis.smallWindow.count
            : 0,
          interactionsAnalyzed: windowAnalysis.smallWindow.count
        },
        mediumWindow: {
          size: windowAnalysis.mediumWindow.size,
          avgRelevanceScore: windowAnalysis.mediumWindow.count > 0 
            ? windowAnalysis.mediumWindow.relevanceSum / windowAnalysis.mediumWindow.count
            : 0,
          interactionsAnalyzed: windowAnalysis.mediumWindow.count
        },
        largeWindow: {
          size: windowAnalysis.largeWindow.size,
          avgRelevanceScore: windowAnalysis.largeWindow.count > 0 
            ? windowAnalysis.largeWindow.relevanceSum / windowAnalysis.largeWindow.count
            : 0,
          interactionsAnalyzed: windowAnalysis.largeWindow.count
        }
      },
      recommendedWindowSize: 'Unknown'
    };
    
    // Recommend optimal window size
    const scores = [
      { size: 'smallWindow', score: result.windowSizeEffectiveness.smallWindow.avgRelevanceScore },
      { size: 'mediumWindow', score: result.windowSizeEffectiveness.mediumWindow.avgRelevanceScore },
      { size: 'largeWindow', score: result.windowSizeEffectiveness.largeWindow.avgRelevanceScore }
    ].filter(x => x.score > 0);
    
    if (scores.length > 0) {
      const optimalSize = scores.reduce((best, current) => 
        current.score > best.score ? current : best
      );
      
      result.recommendedWindowSize = optimalSize.size === 'smallWindow' 
        ? '3 messages' 
        : optimalSize.size === 'mediumWindow' 
          ? '7 messages' 
          : '10 messages';
    }
    
    return result;
  } catch (error) {
    console.error('Failed to analyze conversation windows:', error);
    return null;
  }
} 