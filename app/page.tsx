'use client';

import { useState } from 'react';
import { Message } from 'ai';

import Header from './components/Header';
import ChatBubble from './components/ChatBubble';
import LoadingBubble from './components/LoadingBubble';

export default function Page() {
	const [isLoading, setIsLoading] = useState(false);
	const [messages, setMessages] = useState<Message[]>([]);
	const [input, setInput] = useState('');

	const handleSubmit = async (e: React.FormEvent, prompt: string) => {
		try {
			e.preventDefault();
			setIsLoading(true);
			const newMessage: Message = {
				role: 'user',
				content: prompt,
				id: String(messages.length + 1),
			};
			setMessages((prev) => [...prev, newMessage]);

			const res = await fetch('api/chat', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({prompt: prompt}),
			});

			if (!res.ok) {
				throw new Error('Failed to fetch response');
			}

			const data = await res.json();

			const assistantMessage: Message = {
				role: 'assistant',
				content: data.message,
				id: data._id,
			};

			setMessages((prev) => [...prev, assistantMessage]);
			setInput('');
		} catch (err) {
			console.log(err);
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<>
			<Header />
			<main>
				<div className="container">
					<section className="chat__container">
						<ChatBubble
							content="Hello, how can I help you?"
							role="assistant"
						/>
						{messages.map((message, index) => (
							<ChatBubble
								key={`message-${index}`}
								content={message.content}
								role={message.role}
							/>
						))}
						{isLoading && <LoadingBubble />}
					</section>
					<div className="input__container">
						<form onSubmit={(e) => handleSubmit(e, input)}>
							<input
								type="text"
								placeholder="Ask me anything..."
								className="input__field"
								autoComplete="off"
								autoFocus
								value={input}
								onChange={(e) => setInput(e.target.value)}
							/>
							<button
								type="submit"
								className="submit__button"
							>
								&gt;
							</button>
						</form>

						<div className="action__btns">
							This is the action buttons
						</div>
					</div>
				</div>
			</main>
		</>
	);
}
