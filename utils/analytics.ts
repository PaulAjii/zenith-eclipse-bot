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
  userInfo?: {
    fullname: string;
    email: string;
    phone?: string;
  };
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
  userInfo: { userAgent?: string; ipAddress?: string; fullname?: string; email?: string; phone?: string } = {}
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
      ipAddress: userInfo.ipAddress,
      userInfo: userInfo.fullname && userInfo.email ? {
        fullname: userInfo.fullname,
        email: userInfo.email,
        phone: userInfo.phone,
      } : undefined,
    };
    
    // Insert analytics data
    await analyticsCollection.insertOne(analyticsData);
  } catch (error) {
    // Don't let analytics failures affect the main application
    console.error('Failed to log analytics:', error);
  }
}

/**
 * Enhanced: Gets conversation quality metrics for active sessions, including all fields expected by the frontend
 */
export async function getConversationQualityMetrics(days: number = 7): Promise<any> {
  try {
    if (!analyticsCollection) {
      return null;
    }
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    // Fetch all interactions in the period
    const analyticsData = await analyticsCollection.find({ timestamp: { $gte: startDate } }).toArray();
    if (!analyticsData.length) {
      return null;
    }
    // Average relevance score
    const avgRelevanceScore = analyticsData.reduce((sum, item) => sum + Number(item.relevanceScore || 0), 0) / analyticsData.length;
    // Human assistance rate
    const humanAssistanceCount = analyticsData.filter(item => item.humanAssistanceNeeded).length;
    const humanAssistanceRate = analyticsData.length > 0 ? humanAssistanceCount / analyticsData.length : 0;
    // Category distribution
    const categoryDistribution = analyticsData.reduce((counts, item) => {
      counts[item.category] = Number(counts[item.category] || 0) + 1;
      return counts;
    }, {} as Record<string, number>);
    // Quality over time (by day)
    const qualityOverTimeMap = {};
    analyticsData.forEach(item => {
      const date = new Date(item.timestamp).toLocaleDateString();
      if (!qualityOverTimeMap[date]) qualityOverTimeMap[date] = { relevanceSum: 0, count: 0 };
      qualityOverTimeMap[date].relevanceSum += item.relevanceScore || 0;
      qualityOverTimeMap[date].count += 1;
    });
    const qualityOverTime = Object.entries(qualityOverTimeMap).map(([date, val]) => {
      const v = val as { relevanceSum: number; count: number };
      return {
        date,
        relevanceScore: v.count > 0 ? v.relevanceSum / v.count : 0,
        responseQuality: v.count > 0 ? v.relevanceSum / v.count : 0
      };
    }).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    // Top human assistance queries
    const topHumanAssistance = analyticsData.filter(item => item.humanAssistanceNeeded);
    const queryCounts = {};
    topHumanAssistance.forEach(item => {
      queryCounts[item.question] = Number(queryCounts[item.question] || 0) + 1;
    });
    const topHumanAssistanceQueries = Object.entries(queryCounts)
      .map(([query, count]) => ({ query, count: Number(count) }))
      .sort((a, b) => Number(b.count) - Number(a.count))
      .slice(0, 5);
    return {
      period: `Last ${days} days`,
      avgRelevanceScore,
      avgResponseQuality: avgRelevanceScore, // No responseQuality, use relevanceScore
      humanAssistanceRate,
      categoryDistribution,
      qualityOverTime,
      topHumanAssistanceQueries
    };
  } catch (error) {
    console.error('Failed to get conversation quality metrics:', error);
    return null;
  }
}

/**
 * Enhanced: Gets the most common topics/categories by session interactions, with trends and percentages
 */
export async function getTopSessionTopics(days: number = 30, limit: number = 10): Promise<any> {
  try {
    if (!analyticsCollection) {
      return null;
    }
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    // Get all interactions in the period
    const analyticsData = await analyticsCollection.find({ timestamp: { $gte: startDate } }).toArray();
    if (!analyticsData.length) {
      return null;
    }
    // Count topics
    const topicCounts = analyticsData.reduce((counts, item) => {
      counts[item.category] = Number(counts[item.category] || 0) + 1;
      return counts;
    }, {} as Record<string, number>);
    const totalCount = Object.values(topicCounts).reduce((a, b) => Number(a) + Number(b), 0);
    // Build topTopics array
    const topTopics = Object.entries(topicCounts)
      .map(([topic, count]) => ({ topic, count: Number(count), percentage: Number(totalCount) > 0 ? (Number(count) / Number(totalCount)) * 100 : 0 }))
      .sort((a, b) => Number(b.count) - Number(a.count))
      .slice(0, limit);
    // Topic trends over time (by day)
    const topicTrendsMap = {};
    analyticsData.forEach(item => {
      const date = new Date(item.timestamp).toLocaleDateString();
      if (!topicTrendsMap[date]) topicTrendsMap[date] = {};
      topicTrendsMap[date][item.category] = (topicTrendsMap[date][item.category] || 0) + 1;
    });
    const topicTrends = Object.entries(topicTrendsMap).map(([date, topics]) => {
      return { date, topics: topics as Record<string, number> };
    }).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    return {
      period: `Last ${days} days`,
      totalTopics: topTopics.length,
      totalConversations: totalCount,
      topTopics,
      topicTrends
    };
  } catch (error) {
    console.error('Failed to get top session topics:', error);
    return null;
  }
}

/**
 * Enhanced: Analyzes user retention and returns all fields expected by the frontend
 */
export async function analyzeUserRetention(days: number = 30): Promise<any> {
  try {
    if (!analyticsCollection) {
      return null;
    }
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    // Aggregate by user (userAgent+ipAddress)
    const userSessions = await analyticsCollection.aggregate([
      { $match: { timestamp: { $gte: startDate }, userAgent: { $exists: true, $ne: null }, ipAddress: { $exists: true, $ne: null } } },
      { $group: {
        _id: { userAgent: "$userAgent", ipAddress: "$ipAddress" },
        sessions: { $addToSet: "$sessionId" },
        firstSeen: { $min: "$timestamp" },
        lastSeen: { $max: "$timestamp" },
        activity: { $push: "$timestamp" }
      } }
    ]).toArray();
    if (!userSessions.length) {
      return null;
    }
    // Total users
    const totalUsers = userSessions.length;
    // New users (firstSeen in period)
    const newUsers = userSessions.filter(u => u.firstSeen >= startDate).length;
    // Returning users (more than one session)
    const returningUsers = userSessions.filter(u => u.sessions.length > 1).length;
    // Return rate
    const returnRate = totalUsers > 0 ? (returningUsers / totalUsers) * 100 : 0;
    // Avg sessions per user
    const avgSessionsPerUser = totalUsers > 0 ? userSessions.reduce((sum, u) => sum + u.sessions.length, 0) / totalUsers : 0;
    // Retention by day (Day N retention: % of users active on day N after firstSeen)
    const retentionByDay = Array.from({ length: 7 }, (_, i) => {
      const day = i + 1;
      let retained = 0;
      userSessions.forEach(u => {
        const first = new Date(u.firstSeen).setHours(0,0,0,0);
        const daysActive = new Set(u.activity.map(ts => Number(Math.floor((new Date(ts).getTime() - first) / 86400000) + 1)));
        if (daysActive.has(day)) retained++;
      });
      return { day, retention: totalUsers > 0 ? (retained / totalUsers) * 100 : 0 };
    });
    // Cohort retention (group users by week of firstSeen)
    const cohortMap = {};
    userSessions.forEach(u => {
      const cohort = (() => {
        const d = new Date(u.firstSeen);
        return `${d.getMonth() + 1}/${d.getDate()}`;
      })();
      if (!cohortMap[cohort]) cohortMap[cohort] = [];
      // For each day 1-7, check if user was active
      const first = new Date(u.firstSeen).setHours(0,0,0,0);
      const daysActive = new Set(u.activity.map(ts => Number(Math.floor((new Date(ts).getTime() - first) / 86400000) + 1)));
      const retention = Array.from({ length: 7 }, (_, i) => daysActive.has(i + 1) ? 100 : 0); // 100% if active, 0% if not
      cohortMap[cohort].push(retention);
    });
    const cohortRetention = Object.entries(cohortMap).map(([cohort, arr]) => {
      const arrTyped = arr as number[][];
      // Average retention for each day
      const dayAverages = Array.from({ length: 7 }, (_, i) => {
        const vals = arrTyped.map(ret => Number(ret[i]));
        return vals.length > 0 ? vals.reduce((a, b) => Number(a) + Number(b), 0) / vals.length : 0;
      });
      return { cohort, retention: dayAverages };
    });
    return {
      period: `Last ${days} days`,
      totalUsers,
      newUsers,
      returningUsers,
      returnRate,
      avgSessionsPerUser,
      retentionByDay,
      cohortRetention
    };
  } catch (error) {
    console.error('Failed to analyze user retention:', error);
    return null;
  }
}

/**
 * Enhanced: Gets summary statistics for the chatbot, including daily interactions
 */
export async function getAnalyticsSummary(days: number = 7): Promise<any> {
  try {
    if (!analyticsCollection) {
      return null;
    }
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    // Get analytics from the specified time period
    const analyticsData = await analyticsCollection.find({ timestamp: { $gte: startDate } }).toArray();
    if (!analyticsData.length) {
      return {
        period: `Last ${days} days`,
        totalInteractions: 0,
        totalConversations: 0,
        avgResponseTimeMs: 0,
        humanAssistancePercentage: 0,
        categoryCounts: {},
        dailyInteractions: []
      };
    }
    // Calculate summary statistics
    const totalInteractions = analyticsData.length;
    const uniqueSessionIds = new Set(analyticsData.map(item => item.sessionId));
    const totalConversations = uniqueSessionIds.size;
    const avgResponseTime = analyticsData.reduce((sum, item) => sum + item.responseTimeMs, 0) / totalInteractions;
    const humanAssistanceCount = analyticsData.filter(item => item.humanAssistanceNeeded).length;
    const categoryCounts = analyticsData.reduce((counts, item) => {
      counts[item.category] = Number(counts[item.category] || 0) + 1;
      return counts;
    }, {});
    // Daily interactions
    const dailyMap = {};
    analyticsData.forEach(item => {
      const date = new Date(item.timestamp).toLocaleDateString();
      dailyMap[date] = Number(dailyMap[date] || 0) + 1;
    });
    const dailyInteractions = Object.entries(dailyMap).map(([date, count]) => ({ date, count: count as number })).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    return {
      period: `Last ${days} days`,
      totalInteractions,
      totalConversations,
      avgResponseTimeMs: avgResponseTime,
      humanAssistancePercentage: (humanAssistanceCount / totalInteractions) * 100,
      categoryCounts,
      dailyInteractions
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
      answer: i.answer,
      category: i.category,
      relevanceScore: i.relevanceScore,
      humanAssistanceNeeded: i.humanAssistanceNeeded,
      responseTimeMs: i.responseTimeMs
    }));
    
    // Get userInfo from the first interaction that has it
    const userInfo = interactions.find(i => i.userInfo)?.userInfo;
    
    return {
      sessionId,
      interactionCount,
      firstInteraction,
      lastInteraction,
      sessionDurationMs: sessionDuration,
      avgResponseTimeMs: avgResponseTime,
      totalResponseTimeMs: totalResponseTime,
      conversationFlow,
      hasHumanAssistance: interactions.some(i => i.humanAssistanceNeeded),
      userInfo: userInfo || null,
    };
  } catch (error) {
    console.error('Failed to get session analytics:', error);
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

/**
 * Gets a list of session summaries for the given time range
 */
export async function getSessionSummaries(days: number = 7): Promise<any[]> {
  try {
    if (!analyticsCollection) {
      return null;
    }
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    // Aggregate sessions
    const sessions = await analyticsCollection.aggregate([
      { $match: { timestamp: { $gte: startDate } } },
      { $group: {
        _id: "$sessionId",
        interactionCount: { $sum: 1 },
        firstInteraction: { $min: "$timestamp" },
        lastInteraction: { $max: "$timestamp" },
        totalResponseTime: { $sum: "$responseTimeMs" },
        userInfo: { $first: "$userInfo" }
      }},
      { $project: {
        sessionId: "$_id",
        interactionCount: 1,
        firstInteraction: 1,
        lastInteraction: 1,
        sessionDurationMs: { $subtract: ["$lastInteraction", "$firstInteraction"] },
        avgResponseTimeMs: { $cond: [ { $eq: ["$interactionCount", 0] }, 0, { $divide: ["$totalResponseTime", "$interactionCount"] } ] },
        fullname: "$userInfo.fullname"
      }},
      { $sort: { lastInteraction: -1 } }
    ]).toArray();
    return sessions;
  } catch (error) {
    console.error('Failed to get session summaries:', error);
    return null;
  }
} 