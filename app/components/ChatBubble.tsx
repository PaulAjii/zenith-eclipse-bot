import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface ChatBubbleProps {
	content: string;
	role: string;
}

const ChatBubble = ({ content, role }: ChatBubbleProps) => {
	return (
		<div className={`chat__bubble ${role === 'user' ? 'user' : 'bot'}`}>
			<div className="content">
				<ReactMarkdown 
					remarkPlugins={[remarkGfm]}
					components={{
						// Override h3 to add proper styling
						h3: ({node, ...props}) => <h3 className="markdown-h3" {...props} />,
						// Style lists properly
						ul: ({node, ...props}) => <ul className="markdown-ul" {...props} />,
						ol: ({node, ...props}) => <ol className="markdown-ol" {...props} />,
						// Style list items
						li: ({node, ...props}) => <li className="markdown-li" {...props} />,
						// Style paragraphs
						p: ({node, ...props}) => <p className="markdown-p" {...props} />,
						// Style bold text
						strong: ({node, ...props}) => <strong className="markdown-strong" {...props} />
					}}
				>
					{content}
				</ReactMarkdown>
			</div>
		</div>
	);
};

export default ChatBubble;
