import { Document } from '@langchain/core/documents';

export interface ChatRequest {
	prompt: string;
	sessionId?: string,
	windowSize?: number
}

// Define a type for the token usage data
export interface TokenUsage {
	promptTokens: number;
	completionTokens: number;
	totalTokens: number;
}

// Define a type for the graph response
export interface GraphResponse {
	finalAnswer?: string;
	answer: string;
	context?: Document[];
	needsHumanAssistance?: boolean;
	category?: string;
	contextRelevance?: number;
	llmOutput?: {
		tokenUsage?: TokenUsage;
	};
}

// Define error response types for better client handling
export type ErrorCode = 'input_validation' | 'server_error' | 'database_error' | 'model_error' | 'timeout' | 'unknown';

export interface ErrorResponse {
	status: 'Error';
	code: ErrorCode;
	message: string;
	details?: unknown;
}