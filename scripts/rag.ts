import { Document } from '@langchain/core/documents';
import { Annotation, StateGraph } from '@langchain/langgraph';
// import { ChatOpenAI } from '@langchain/openai';

import { vectorStore } from './dbconfig';
import { llm } from './embedding';
import { 
	identifyQuestionCategory, 
	evaluateContextRelevance,
	validateAnswerQuality,
	needsHumanHelp,
	reorderDocumentsByRelevance
} from '../utils/categoryUtils';
import { 
	createRagPromptTemplate, 
	createConversationalRagPromptTemplate,
	createRefinementPromptTemplate,
	generateHumanHandoffMessage
} from '../utils/prompts';
import { ChatMessage } from '../utils/sessionManager';

// Define the enhanced state annotation for our application
const StateAnnotation = Annotation.Root({
	// Input state
	question: Annotation<string>,                              // User's question
	history: Annotation<ChatMessage[]>,                        // Conversation history
	sessionId: Annotation<string>,                            // Session identifier
	
	// Processing state
	category: Annotation<string>,                              // Identified category
	context: Annotation<Document[]>,                           // Retrieved documents
	contextRelevance: Annotation<number>,                      // Relevance score
	
	// Output state
	answer: Annotation<string>,                                // Generated answer
	needsRefinement: Annotation<boolean>,                      // Whether answer needs improvement
	needsHumanAssistance: Annotation<boolean>,                 // Whether to suggest human handoff
	finalAnswer: Annotation<string>,                           // Final processed answer
});

// Add error-safe wrapper for vector search to prevent MongoDB filtering errors
async function safeSimilaritySearch(question: string, k: number = 8) {
	try {
		// First try without any filter
		return await vectorStore.similaritySearch(question, k);
	} catch (error) {
		// If error occurs, log it but don't crash
		console.error('Vector search error (continuing with empty results):', error.message);
		return []; // Return empty array as fallback
	}
}

// Define the enhanced application steps
// Step 1: Categorize the question
const categorize = async (state: typeof StateAnnotation.State) => {
	const category = identifyQuestionCategory(state.question);
	return { category: category.toString() };
};

// Step 2: Retrieve relevant documents
const retrieve = async (state: typeof StateAnnotation.State) => {
	// Retrieve documents without using category filter to avoid MongoDB index issues
	const retrievedDocs = await safeSimilaritySearch(state.question, 16);

	// Apply category filtering in memory instead of in the database query
	let filteredDocs = retrievedDocs;
	if (state.category !== 'General') {
		filteredDocs = retrievedDocs.filter(doc => 
			doc.metadata?.category === state.category
		);
		// If filtering resulted in too few documents, fall back to all retrieved docs
		if (filteredDocs.length < 3) {
			filteredDocs = retrievedDocs;
		}
	}

	// --- NEW: Boost FAQ and direct-answer chunks for direct questions ---
	const isDirectQuestion = /^(what|how|who|where|when|why|can|does|do|is|are|should|could|would|will|may|did|has|have|had)\b/i.test(state.question.trim());
	let boostedDocs = filteredDocs;
	if (isDirectQuestion) {
		const faqDocs = filteredDocs.filter(doc => doc.metadata?.is_faq);
		if (faqDocs.length > 0) {
			// Prioritize FAQ chunks
			boostedDocs = [...faqDocs, ...filteredDocs.filter(doc => !doc.metadata?.is_faq)];
		}
	}

	// --- NEW: Boost by tag/section if question contains tag keywords ---
	const questionLower = state.question.toLowerCase();
	const tagMatchDocs = boostedDocs.filter(doc => {
		if (!doc.metadata?.tags) return false;
		return doc.metadata.tags.some((tag: string) => questionLower.includes(tag.toLowerCase()));
	});
	if (tagMatchDocs.length > 0) {
		boostedDocs = [...tagMatchDocs, ...boostedDocs.filter(doc => !tagMatchDocs.includes(doc))];
	}

	// Reorder documents by relevance to the question
	const orderedDocs = reorderDocumentsByRelevance(boostedDocs, state.question);

	// Take only the top most relevant documents
	const selectedDocs = orderedDocs.slice(0, 4);

	// Evaluate context relevance for later use
	const relevance = evaluateContextRelevance(selectedDocs, state.question);

	// --- NEW: If no relevant chunk, return a clarifying question ---
	if (!selectedDocs.length || relevance < 0.15) {
		return {
			context: [],
			contextRelevance: 0,
			clarification: `I'm not sure I have enough information to answer that. Could you please clarify or provide more details about your request?`
		};
	}

	return { 
		context: selectedDocs,
		contextRelevance: relevance
	};
};

// Step 3: Generate answer based on retrieved documents
const generate = async (state: typeof StateAnnotation.State) => {
	// Format the context with source attribution
	const formattedContext = state.context.map(doc => {
		const source = doc.metadata?.source || 'Company Document';
		return `Source: ${source}\n${doc.pageContent}`;
	}).join('\n\n');
	
	// Choose the appropriate prompt template based on history
	const promptTemplate = state.history?.length 
		? createConversationalRagPromptTemplate() 
		: createRagPromptTemplate();
	
	// Format history if available
	const historyText = state.history?.length
		? state.history.map(msg => `${msg.role}: ${msg.content}`).join('\n\n')
		: '';
	
	// Create prompt with all available information
	const messages = await promptTemplate.invoke({
		question: state.question,
		context: formattedContext,
		history: historyText
	});
	
	// Generate response with LLM
	const response = await llm.invoke(messages);
	
	return { answer: response.content };
};

// Step 4: Validate the answer quality
const validate = async (state: typeof StateAnnotation.State) => {
	// Check if the answer is acceptable
	const isValid = validateAnswerQuality(state.answer, state.question);
	
	// Check if human assistance is needed
	const humanHelp = needsHumanHelp(state.question, state.context, state.answer);
	
	return { 
		needsRefinement: !isValid,
		needsHumanAssistance: humanHelp
	};
};

// Step 5: Refine the answer if needed
const refine = async (state: typeof StateAnnotation.State) => {
	// If refinement not needed, skip
	if (!state.needsRefinement) {
		return { finalAnswer: state.answer };
	}
	
	// Create refinement prompt
	const refinementPrompt = createRefinementPromptTemplate();
	
	// Format context for refinement
	const contextText = state.context.map(doc => doc.pageContent).join('\n\n');
	
	// Invoke refinement prompt
	const refinementMessages = await refinementPrompt.invoke({
		question: state.question,
		context: contextText,
		answer: state.answer
	});
	
	// Generate improved answer
	const refinedResponse = await llm.invoke(refinementMessages);
	
	return { finalAnswer: refinedResponse.content };
};

// Step 6: Handle human assistance if needed
const handleHumanAssistance = async (state: typeof StateAnnotation.State) => {
	// If human assistance not needed, use the refined or original answer
	if (!state.needsHumanAssistance) {
		return { 
			finalAnswer: state.finalAnswer || state.answer 
		};
	}
	
	// Generate human handoff message
	const handoffMessage = generateHumanHandoffMessage(state.question);
	
	return { finalAnswer: handoffMessage };
};

// Define conditional edges for the graph
const shouldRefine = (state: typeof StateAnnotation.State) => {
	return state.needsRefinement ? 'refine' : 'handleHumanAssistance';
};

// Create and compile the enhanced state graph
export const graph = new StateGraph(StateAnnotation)
	.addNode('categorize', categorize)
	.addNode('retrieve', retrieve)
	.addNode('generate', generate)
	.addNode('validate', validate)
	.addNode('refine', refine)
	.addNode('handleHumanAssistance', handleHumanAssistance)
	.addEdge('__start__', 'categorize')
	.addEdge('categorize', 'retrieve')
	.addEdge('retrieve', 'generate')
	.addEdge('generate', 'validate')
	.addConditionalEdges(
		'validate',
		shouldRefine,
		{
			'refine': 'refine',
			'handleHumanAssistance': 'handleHumanAssistance'
		}
	)
	.addEdge('refine', 'handleHumanAssistance')
	.addEdge('handleHumanAssistance', '__end__')
	.compile();
	