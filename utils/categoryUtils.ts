import { Document } from '@langchain/core/documents';

/**
 * Category types for our documents
 */
export enum DocumentCategory {
  Transport = 'Transport',
  Commodities = 'Commodities',
  Chemicals = 'Chemicals',
  Services = 'Services',
  General = 'General'
}

/**
 * Map of keywords that identify each category
 */
const categoryKeywords = {
  [DocumentCategory.Transport]: [
    'cargo', 'freight', 'logistics', 'transport', 
    'shipping', 'rail', 'truck', 'air', 'ocean',
    'multimodal', 'intermodal', 'oog'
  ],
  [DocumentCategory.Commodities]: [
    'barley', 'wheat', 'lentils', 'seeds', 'meal', 
    'oil', 'peas', 'chickpeas', 'millet', 'oats', 
    'flour', 'sunflower', 'rapeseed', 'flaxseed', 'soybean'
  ],
  [DocumentCategory.Chemicals]: [
    'ethylene', 'polyethylene', 'propylene', 'chemical'
  ],
  [DocumentCategory.Services]: [
    'services', 'solutions', 'operations', 'management', 
    'supply chain', 'financial'
  ]
};

/**
 * Common greetings and casual interactions that don't need human help
 */
const commonGreetings = [
  'hello', 'hi', 'hey', 'greetings', 'good morning', 
  'good afternoon', 'good evening', 'howdy', 
  'how are you', 'how\'s it going', 'what\'s up',
  'nice to meet you', 'pleasure to meet you',
  'thanks', 'thank you', 'appreciate it'
];

/**
 * Simple questions that don't require human assistance
 */
const simpleQuestionPatterns = [
  'who are you', 'what can you do', 'what is your name',
  'your purpose', 'how do you work', 'help me with',
  'tell me about', 'explain', 'what are you',
  'how can you help'
];

/**
 * Identifies the most relevant category based on a question
 */
export function identifyQuestionCategory(question: string): DocumentCategory {
  // Convert to lowercase for case-insensitive matching
  const normalizedQuestion = question.toLowerCase();
  
  // Score each category based on keyword matches
  const scores = Object.entries(categoryKeywords).map(([category, keywords]) => {
    const matchCount = keywords.filter(keyword => 
      normalizedQuestion.includes(keyword.toLowerCase())
    ).length;
    
    return { category: category as DocumentCategory, score: matchCount };
  });
  
  // Find the category with the highest score
  const topCategory = scores.sort((a, b) => b.score - a.score)[0];
  
  // Return the top category or General if no matches
  return topCategory.score > 0 ? topCategory.category : DocumentCategory.General;
}

/**
 * Identifies the category of a document based on its filename or content
 */
export function identifyDocumentCategory(filename: string, content?: string): DocumentCategory {
  // Convert to lowercase for case-insensitive matching
  const normalizedFilename = filename.toLowerCase();
  
  // First try to match by filename
  for (const [category, keywords] of Object.entries(categoryKeywords)) {
    if (keywords.some(keyword => normalizedFilename.includes(keyword.toLowerCase()))) {
      return category as DocumentCategory;
    }
  }
  
  // If we have content and no match by filename, try content-based matching
  if (content) {
    const normalizedContent = content.toLowerCase();
    
    // Score each category based on keyword frequency in content
    const scores = Object.entries(categoryKeywords).map(([category, keywords]) => {
      let score = 0;
      keywords.forEach(keyword => {
        // Count occurrences of keyword in content
        const regex = new RegExp('\\b' + keyword.toLowerCase() + '\\b', 'g');
        const matches = normalizedContent.match(regex);
        score += matches ? matches.length : 0;
      });
      
      return { category: category as DocumentCategory, score };
    });
    
    // Find the category with the highest score
    const topCategory = scores.sort((a, b) => b.score - a.score)[0];
    if (topCategory.score > 0) {
      return topCategory.category;
    }
  }
  
  // Default to General if no matches found
  return DocumentCategory.General;
}

/**
 * Evaluates the relevance of retrieved context to the question
 * Returns a score between 0 (irrelevant) and 1 (highly relevant)
 */
export function evaluateContextRelevance(context: Document[], question: string): number {
  if (!context.length) return 0;
  
  // Get question keywords (exclude common stop words)
  const stopWords = ['a', 'an', 'the', 'in', 'on', 'at', 'to', 'for', 'with', 'about'];
  const questionWords = question.toLowerCase()
    .split(/\W+/)
    .filter(word => word.length > 2 && !stopWords.includes(word));
  
  // Calculate relevance score for each document
  const relevanceScores = context.map(doc => {
    const content = doc.pageContent.toLowerCase();
    
    // Count how many question keywords appear in the document
    const matchingKeywords = questionWords.filter(word => 
      content.includes(word)
    );
    
    return matchingKeywords.length / questionWords.length;
  });
  
  // Average the relevance scores
  const averageRelevance = relevanceScores.reduce((sum, score) => sum + score, 0) / 
                           relevanceScores.length;
  
  return averageRelevance;
}

/**
 * Assesses if an answer meets quality standards
 * Returns true if the answer is acceptable, false if it needs refinement
 */
export function validateAnswerQuality(answer: string, question: string): boolean {
  // Check for "I don't know" type responses
  const uncertaintyPhrases = [
    "i don't know", "i'm not sure", "i don't have enough information",
    "i can't answer", "cannot provide", "don't have specific",
    "unable to provide", "don't have information"
  ];
  
  const hasUncertainty = uncertaintyPhrases.some(phrase => 
    answer.toLowerCase().includes(phrase)
  );
  
  // Check if answer is too short (likely insufficient)
  const isTooShort = answer.split(' ').length < 20;
  
  // Check if question looks answered (presence of key terms from question)
  const keyTerms = extractKeyTerms(question);
  const relevantTermsInAnswer = keyTerms.filter(term => 
    answer.toLowerCase().includes(term.toLowerCase())
  );
  const addressesQuestion = relevantTermsInAnswer.length > 0;
  
  // An answer is valid if it addresses the question, isn't too short, and isn't uncertain
  return addressesQuestion && !isTooShort && !hasUncertainty;
}

/**
 * Extracts key terms from a question for checking answer relevance
 */
function extractKeyTerms(question: string): string[] {
  // Simple extraction of nouns and important words
  // In a production system, consider NLP or more sophisticated approaches
  const words = question.toLowerCase().split(/\W+/).filter(w => w.length > 3);
  
  // Remove common question words and stop words
  const stopWords = ['what', 'where', 'when', 'which', 'who', 'how', 'why', 
                    'about', 'tell', 'give', 'does', 'mean', 'information'];
  return words.filter(word => !stopWords.includes(word));
}

/**
 * Checks if the input is a common greeting or casual interaction
 * that doesn't require document-based knowledge or human assistance
 */
function isGreetingOrCasualInteraction(input: string): boolean {
  const normalizedInput = input.toLowerCase().trim();
  
  // Check if input matches any common greeting patterns
  const isGreeting = commonGreetings.some(greeting => 
    normalizedInput === greeting || 
    normalizedInput.startsWith(greeting + ' ') ||
    normalizedInput.includes(greeting)
  );
  
  // Check if input is a simple question about the bot itself
  const isSimpleQuestion = simpleQuestionPatterns.some(pattern =>
    normalizedInput.includes(pattern)
  );
  
  // Also check if this is just a very short input (likely a greeting)
  const isVeryShortInput = normalizedInput.split(' ').length <= 2 && normalizedInput.length < 15;
  
  return isGreeting || isSimpleQuestion || isVeryShortInput;
}

/**
 * Detects if a question requires human assistance
 */
export function needsHumanHelp(
  question: string, 
  context: Document[], 
  answer: string
): boolean {
  // First check if this is just a greeting or casual interaction
  // Greetings should never trigger human assistance
  if (isGreetingOrCasualInteraction(question)) {
    return false;
  }
  
  // Check if question is too short to warrant human assistance
  if (question.split(' ').length < 3) {
    return false;
  }
  
  // Check for low context relevance
  const contextRelevance = evaluateContextRelevance(context, question);
  
  // Check for uncertainty in the answer
  const uncertaintyPhrases = [
    "i don't know", "i'm not sure", "i don't have enough information",
    "i can't answer", "cannot provide", "don't have specific"
  ];
  
  const hasUncertainty = uncertaintyPhrases.some(phrase => 
    answer.toLowerCase().includes(phrase)
  );
  
  // Check for complex requests that might need human assistance
  const complexRequestIndicators = [
    "quote", "pricing", "custom", "contact", "representative",
    "discount", "negotiate", "specific offer", "personal", "account"
  ];
  
  const isComplexRequest = complexRequestIndicators.some(indicator => 
    question.toLowerCase().includes(indicator)
  );
  
  // Only suggest human assistance for complex requests with uncertainty
  // or very low context relevance, never for greetings or simple questions
  return (contextRelevance < 0.3) && (hasUncertainty || isComplexRequest);
}

/**
 * Creates a brief summary of a question (for human handoff messages)
 */
export function summarizeQuestion(question: string): string {
  // Simple implementation: return first 8 words if question is long
  const words = question.split(' ');
  if (words.length > 8) {
    return words.slice(0, 8).join(' ') + '...';
  }
  return question;
}

/**
 * Reorders documents by relevance to the question
 */
export function reorderDocumentsByRelevance(docs: Document[], question: string): Document[] {
  const keyTerms = extractKeyTerms(question);
  
  // Calculate relevance score for each document
  const scoredDocs = docs.map(doc => {
    let score = 0;
    
    // Count occurrences of key terms in document
    keyTerms.forEach(term => {
      const regex = new RegExp('\\b' + term.toLowerCase() + '\\b', 'gi');
      const matches = doc.pageContent.toLowerCase().match(regex);
      score += matches ? matches.length : 0;
    });
    
    return { doc, score };
  });
  
  // Sort by score (descending) and return docs
  return scoredDocs
    .sort((a, b) => b.score - a.score)
    .map(item => item.doc);
} 