interface ChatBubbleProps {
	content: string;
	role: string;
}

const ChatBubble = ({ content, role }: ChatBubbleProps) => {
	return (
		<div className={`chat__bubble ${role === 'user' ? 'user' : 'bot'}`}>
			<p className="content">{content}</p>
		</div>
	);
};

export default ChatBubble;
