import Image from 'next/image';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface ChatBubbleProps {
	content: string;
	role: string;
}

const ChatBubble = ({ content, role }: ChatBubbleProps) => {
	const isUser = role === 'user';
	
	return (
		<div className={`chat__bubble-container ${isUser ? 'user' : 'bot'}`}>
			{!isUser && (
				<div className="avatar-container">
					<Image 
						src="/avatar-bot.svg" 
						alt="Bot"
						width={40}
						height={40}
						className="avatar"
					/>
				</div>
			)}
			
			<div className={`chat__bubble ${isUser ? 'user' : 'bot'}`}>
				<div className="content">
					<ReactMarkdown 
						remarkPlugins={[remarkGfm]}
						components={{
							// Override h3 to add proper styling
							h3: ({...props}) => <h3 className="markdown-h3" {...props} />,
							// Style lists properly
							ul: ({...props}) => <ul className="markdown-ul" {...props} />,
							ol: ({...props}) => <ol className="markdown-ol" {...props} />,
							// Style list items
							li: ({...props}) => <li className="markdown-li" {...props} />,
							// Style paragraphs
							p: ({...props}) => <p className="markdown-p" {...props} />,
							// Style bold text
							strong: ({...props}) => <strong className="markdown-strong" {...props} />,
							// Ensure all links open in a new tab
							a: ({href, children, ...props}) => (
								<a href={href} target="_blank" rel="noopener noreferrer" {...props}>
									{children}
								</a>
							),
						}}
					>
						{content}
					</ReactMarkdown>
				</div>
			</div>
			
			{isUser && (
				<div className="avatar-container">
					<Image 
						src="/avatar-user.svg" 
						alt="User"
						width={40}
						height={40}
						className="avatar"
					/>
				</div>
			)}
		</div>
	);
};

export default ChatBubble;
