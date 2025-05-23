import { NextResponse } from 'next/server';
import { graph } from '@/scripts/rag';
import { sessionManager } from '@/utils/sessionManager';
import { logInteraction } from '@/utils/analytics';
import type { ErrorCode } from "./types"
import { ChatRequest, GraphResponse, ErrorResponse } from "./types"
import validateInput from "./utils/validateInput"
import { ensureAnalyticsInitialized } from '@/app/api/init';

export async function POST(req: Request) {
	try {
		// Ensure analytics is initialized
		const initError = await ensureAnalyticsInitialized();
		if (initError) return initError;
		// Extract request body
		const body = await req.json().catch(() => ({}));
		const { prompt, sessionId, windowSize, userInfo }: ChatRequest = body;
		
		// Validate input
		const validationError = validateInput(prompt);
		if (validationError) {
			return NextResponse.json(
				{
					status: 'Error',
					code: 'input_validation',
					message: validationError
				} as ErrorResponse,
				{ status: 400 }
			);
		}

		// Track start time for analytics
		const startTime = Date.now();

		// Get or create session for conversation history
		const session = sessionManager.getOrCreateSession(sessionId, userInfo);

		// Set conversation window size if provided
		if (windowSize !== undefined) {
			if (typeof windowSize !== 'number' || windowSize < 0 || windowSize > 20) {
				return NextResponse.json(
					{
						status: 'Error',
						code: 'input_validation',
						message: 'Window size must be a positive number between 0 and 20'
					} as ErrorResponse,
					{ status: 400 }
				);
			}
			
			sessionManager.setConversationWindowSize(session.sessionId, windowSize);
		}

		// Add user message to history
		sessionManager.addMessage(session.sessionId, {
			role: "human",
			content: prompt.trim()
		}, userInfo);

		// Get conversation history with current window size
		const history = sessionManager.getFormattedHistory(session.sessionId);

		// Define timeout for the graph invocation
		const timeoutMs = 25000; // 25 seconds
		
		// Use Promise.race to implement timeout
		const graphPromise = graph.invoke({
			question: prompt.trim(),
			history: history,
			sessionId: session.sessionId
		});
		
		const timeoutPromise = new Promise((_, reject) => {
			setTimeout(() => reject(new Error('Request timed out')), timeoutMs);
		});
		
		// Execute with timeout
		const response = await Promise.race([
			graphPromise,
			timeoutPromise
		]) as GraphResponse;

		// Calculate response time for analytics
		const responseTime = Date.now() - startTime;

		// Add the new interaction for conversation history
		sessionManager.addMessage(session.sessionId, {
			role: "assistant",
			content: response.finalAnswer || response.answer
		}, userInfo);

		// Extract token usage if available from the LLM output
		// Access it safely through the result object
		const tokenUsage = response.llmOutput?.tokenUsage || {
			promptTokens: 0,
			completionTokens: 0,
			totalTokens: 0
		};
		
		// Prepare the response payload
		const responsePayload = {
			status: "Success",
			message: response.finalAnswer || response.answer,
			sessionId: session.sessionId,
			metadata: {
				sessionActive: true,
				conversationWindowSize: sessionManager.getConversationWindowSize(session.sessionId),
				needsHumanAssistance: response.needsHumanAssistance || false,
				responseTime: responseTime,
				category: response.category || "General",
				contextRelevance: response.contextRelevance || 0,
				tokenUsage: tokenUsage
			}
		};

		// Fire and forget: Log analytics data without waiting for it to complete
		const userAgent = req.headers.get('user-agent') || 'Unknown';
		
		// After getting the session, ensure userInfo is available
		const effectiveUserInfo = userInfo || session.userInfo;
		
		// Don't await this promise - let it run in the background
		Promise.resolve().then(() => {
			logInteraction(
				session.sessionId,
				prompt,
				response.finalAnswer || response.answer,
				response.context || [],
				responseTime,
				response.needsHumanAssistance || false,
				response.category || 'General',
				response.contextRelevance || 0,
				{
					userAgent,
					fullname: effectiveUserInfo?.fullname,
					email: effectiveUserInfo?.email,
					phone: effectiveUserInfo?.phone,
				}
			).catch(err => {
				// Only log analytics errors
				console.error('Analytics error:', err);
			});
		});

		// Return the response immediately without waiting for analytics
		return NextResponse.json(
			responsePayload,
			{
				status: 200,
				headers: {
					'Content-Type': 'application/json',
				},
			}
		);
	} catch (error: unknown) {
		// Log the full error for debugging
		console.error('Chat error:', error);
		
		// Initialize error response
		let errorCode: ErrorCode = 'unknown';
		let errorMessage = 'An error occurred processing your request';
		let statusCode = 500;
		let errorDetails = undefined;
		
		// Categorize error types for better client-side handling
		if (error instanceof Error) {
			const errorString = error.toString().toLowerCase();
			
			// Handle timeout errors
			if (error.message === 'Request timed out' || errorString.includes('timeout')) {
				errorCode = 'timeout';
				errorMessage = 'Your request took too long to process. Please try a simpler question or try again later.';
				statusCode = 408; // Request Timeout
			}
			// Handle MongoDB/database errors
			else if (
				error.name === 'MongoServerError' || 
				errorString.includes('mongo') || 
				errorString.includes('database')
			) {
				errorCode = 'database_error';
				errorMessage = 'Our knowledge database is currently experiencing issues. Please try again shortly.';
			}
			// Handle model/token errors
			else if (
				errorString.includes('token') || 
				errorString.includes('model') || 
				errorString.includes('openai') ||
				errorString.includes('capacity')
			) {
				errorCode = 'model_error';
				errorMessage = 'There was an issue with our AI model. Please try a different question or try again later.';
			}
			// Server errors
			else if (
				errorString.includes('server') || 
				errorString.includes('internal')
			) {
				errorCode = 'server_error';
				errorMessage = 'Our server encountered an issue. Our team has been notified.';
			}
			// For development, include more details
			if (process.env.NODE_ENV === 'development') {
				errorDetails = {
					name: error.name,
					message: error.message,
					stack: error.stack
				};
			}
		}

		return NextResponse.json(
			{ 
				status: "Error", 
				code: errorCode,
				message: errorMessage,
				...(errorDetails ? { details: errorDetails } : {})
			} as ErrorResponse,
			{ status: statusCode }
		);
	}
}
