import { ChatPromptTemplate } from '@langchain/core/prompts';
import { ChatMessage } from './sessionManager.js';

/**
 * Company-specific system prompt for RAG
 * This establishes the identity and tone of the assistant
 */
export const COMPANY_SYSTEM_PROMPT = `
You are an expert representative for our agricultural commodities and logistics company.

## YOUR IDENTITY
You are a knowledgeable and professional representative with expertise in:
- Agricultural commodities (grains, oilseeds, pulses)
- Logistics and transportation services (air, ocean, rail, truck)
- Supply chain solutions and management
- Chemical products (ethylene, polyethylene, propylene)

## TONE & STYLE
- Professional but approachable
- Confident and authoritative on our areas of expertise
- Helpful and solution-oriented
- Clear and concise in explanations
- Structured responses with appropriate formatting when needed

## GUIDELINES
When discussing our products and services:
- Provide detailed, accurate information about specifications and capabilities
- Emphasize our quality, reliability, and industry expertise
- Highlight our value propositions where relevant 
- NEVER make specific price commitments (direct pricing questions to our sales team)
- NEVER share information that isn't provided in the context
- If unsure about something, acknowledge limitations and offer to connect with a human expert

## RESPONSE FORMAT
For complex questions, structure your responses with:
- A direct answer to the main question
- Relevant details from our documentation
- Additional helpful information if applicable
- Clear next steps or recommendations when appropriate

## HUMAN HANDOFF
For questions about pricing, custom solutions, specific accounts, or complex contract terms,
offer to connect the customer with our sales team.

Always base your answers on the provided context. If the context doesn't contain relevant information,
politely explain that you don't have that specific information and offer to connect them with the right department.
`;

/**
 * Create a RAG prompt template with our company-specific system prompt
 */
export const createRagPromptTemplate = () => {
  return ChatPromptTemplate.fromMessages([
    ["system", COMPANY_SYSTEM_PROMPT],
    ["human", "{question}"],
    ["system", "Here is relevant context from our company documentation:\n\n{context}"],
    ["system", "Remember to follow our company guidelines when responding. Focus on information from the context provided and maintain our professional tone."]
  ]);
};

/**
 * Format chat history for inclusion in the prompt
 */
export const formatChatHistoryForPrompt = (history: ChatMessage[]): string => {
  if (!history.length) return '';
  
  return history.map(msg => {
    if (msg.role === 'human') {
      return `Human: ${msg.content}`;
    } else if (msg.role === 'assistant') {
      return `Assistant: ${msg.content}`;
    }
    return '';
  }).join('\n\n');
};

/**
 * Create a prompt template that includes conversation history
 */
export const createConversationalRagPromptTemplate = () => {
  return ChatPromptTemplate.fromMessages([
    ["system", COMPANY_SYSTEM_PROMPT],
    ["system", "Previous conversation history:\n{history}"],
    ["human", "{question}"],
    ["system", "Here is relevant context from our company documentation:\n\n{context}"],
    ["system", "Remember to maintain continuity with the previous conversation. Use the conversation history for context but focus on answering the current question using the provided documentation context."]
  ]);
};

/**
 * Human handoff message generator
 */
export const generateHumanHandoffMessage = (question: string): string => {
  const summary = question.length > 50 
    ? question.substring(0, 50) + '...' 
    : question;
    
  return `I understand your question about ${summary}. To ensure you get the most accurate and helpful information, I'd like to connect you with one of our specialists who can provide more specific details. 

Would you like me to:
1. Have a representative contact you directly? (Please provide your preferred contact method)
2. Direct you to our contact form on our website?
3. Continue the conversation with me, understanding I may have limitations on this specific topic?

Our team is available during business hours and will be happy to assist you with detailed information about your inquiry.`;
};

/**
 * Refinement prompt for improving low-quality answers
 */
export const createRefinementPromptTemplate = () => {
  return ChatPromptTemplate.fromMessages([
    ["system", "You are an expert editor for our company's AI assistant. Your task is to improve the quality of the following answer while maintaining accuracy and our company's professional tone."],
    ["system", "Original question: {question}"],
    ["system", "Context information: {context}"],
    ["system", "Original answer: {answer}"],
    ["system", "Improve this answer by making it more comprehensive, accurate, and aligned with our company voice. Maintain all factual information but enhance clarity, professionalism, and helpfulness. Only use information from the provided context."]
  ]);
}; 