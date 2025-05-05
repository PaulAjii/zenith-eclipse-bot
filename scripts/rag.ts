import { pull } from 'langchain/hub';
import { ChatPromptTemplate } from '@langchain/core/prompts';
import { Document } from '@langchain/core/documents';
import { Annotation, StateGraph } from '@langchain/langgraph';

import { vectorStore } from './dbconfig';
import { llm } from './embedding';

// Define prompt
const promptTemplate = await pull<ChatPromptTemplate>('rlm/rag-prompt');

// Define state for application
const InputStateAnnotation = Annotation.Root({
	question: Annotation<string>,
});

const StateAnnotation = Annotation.Root({
	question: Annotation<string>,
	context: Annotation<Document[]>,
	answer: Annotation<string>,
});

// Define application steps
const retrieve = async (state: typeof InputStateAnnotation.State) => {
	const retrievedDocs = await vectorStore.similaritySearch(state.question);
	return { context: retrievedDocs };
};

const generate = async (state: typeof StateAnnotation.State) => {
	const docsContent = state.context.map((doc) => doc.pageContent).join('\n');
	const messages = await promptTemplate.invoke({
		question: state.question,
		context: docsContent,
	});
	const response = await llm.invoke(messages);
	return { answer: response.content };
};

export const graph = new StateGraph(StateAnnotation)
	.addNode('retrieve', retrieve)
	.addNode('generate', generate)
	.addEdge('__start__', 'retrieve')
	.addEdge('retrieve', 'generate')
	.addEdge('generate', '__end__')
	.compile();
