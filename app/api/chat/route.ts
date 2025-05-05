import { NextResponse } from 'next/server';
import { graph } from '@/scripts/rag';

interface ChatRequest {
	prompt: string;
}

export async function POST(req: Request) {
	try {
		const body = await req.json();
		const { prompt } = body as ChatRequest;

		if (!prompt || typeof prompt !== 'string') {
			return NextResponse.json(
				{ error: 'Invalid prompt' },
				{ status: 400 }
			);
		}

		const response = await graph.invoke({
			question: prompt.trim(),
		});

		return NextResponse.json(
			{ message: response.answer },
			{
				status: 200,
				headers: {
					'Content-Type': 'application/json',
				},
			}
		);
	} catch (error) {
		console.error('error');
		return NextResponse.json(
			{ error: 'An error occurred' },
			{ status: 500 }
		);
	}
}
