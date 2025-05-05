import { NextResponse } from 'next/server';
import { graph } from '@/scripts/rag';
import { sessionManager } from '@/utils/sessionManager';
import { logInteraction } from '@/utils/analytics';
import { identifyQuestionCategory, evaluateContextRelevance } from '@/utils/categoryUtils';

interface ChatRequest {
	prompt: string;
	sessionId?: string,
	windowSize?: number
}

export async function POST(req: Request) {
	try {
		const {prompt, sessionId, windowSize}: ChatRequest  = await req.json();

		// Validate input
		if (!prompt || typeof prompt !== 'string') {
			return NextResponse.json(
				{ error: 'Invalid prompt' },
				{ status: 400 }
			);
		}

		// Track start time for analytics
		const startTime = Date.now()

		// Get cor create session for conversation history
		const session = sessionManager.getOrCreateSession(sessionId)

		// Set conversation window size of provided
		if (windowSize && typeof windowSize === 'number' && windowSize > 0) {
			sessionManager.setConversationWindowSize(session.sessionId, windowSize)
		}

		// Get conversation history with current window size
		const history = sessionManager.getFormattedHistory(session.sessionId)

		// Invoke the enhanced converstional graoh
		const response = await graph.invoke({
			question: prompt.trim(),
			history: history,
			sessionId: session.sessionId
		});

		// Calculate response time for analytics
		const responseTime = Date.now() - startTime

		// Add the new interaction for conversation history
		sessionManager.addMessage(session.sessionId, {
			role: "assistant",
			content: response.finalAnswer || response.answer
		})

		// Extract token usage if available from the LLM output
		// Access it safely through the result object
		const tokenUsage = (response as any).llmOutput?.tokenUsage || {
			promptTokens: 0,
			completionTokens: 0,
			totalTokens: 0
		};
		
		// Log interaction for analytics (silently)
		const userAgent = req.headers['user-agent'];
		// let request: NextApiRequest
		// const ipAddress = request.socket.remoteAddress;
		
		logInteraction(
			session.sessionId,
			prompt,
			response.finalAnswer || response.answer,
			response.context || [],
			responseTime,
			response.needsHumanAssistance || false,
			response.category || 'General',
			response.contextRelevance || 0,
			{ userAgent }
		).catch(err => {
			// Only log analytics errors
			console.error('Analytics error:', err)
		});

		return NextResponse.json(
			{
				status: "Success",
				message: response.finalAnswer || response.answer,
				sessionId: session.sessionId,
				metadata: {
					sessionActive: true,
					conversationWindowSize: sessionManager.getConversationWindowSize(session.sessionId),
					needsHumanAssistance: response.needsHumanAssistance || false,
					responseTIme: responseTime,
					category: response.category || "General",
					contextRelevance: response.contextRelevance || 0,
					tokenUsage: tokenUsage
				}
			},
			{
				status: 200,
				headers: {
					'Content-Type': 'application/json',
				},
			}
		);
	} catch (error) {
		// Keep error logging
		console.error('Chat error:', error);
		
		// Prepare a user-friendly error message based on error type
		let errorMessage = 'An error occurred processing your request';
		
		if (error instanceof Error) {
			// For MongoDB errors, provide a more specific message
			if (error.name === 'MongoServerError' || error.message.includes('MongoDB')) {
				errorMessage = 'Our knowledge database is currently experiencing issues. Please try again shortly.';
			} else if (error.message.includes('token') || error.message.includes('index')) {
				errorMessage = 'There was an issue retrieving relevant information. Please try a different question.';
			} else {
				errorMessage = error.message;
			}
		}

		return NextResponse.json(
			{ status: "Error", message: errorMessage },
			{ status: 500 }
		);
	}
}
