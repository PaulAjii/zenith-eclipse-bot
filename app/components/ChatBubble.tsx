interface ChatBubbleProps {
	content: string;
	role: string;
}

const ChatBubble = ({ content, role }: ChatBubbleProps) => {
	const formattedContent = content.split('\n').map((line, index, array) => (
		<span key={index}>
			{line}
			{index < array.length - 1 && <br />}
		</span>
	));
	return (
		<div className={`chat__bubble ${role === 'user' ? 'user' : 'bot'}`}>
			<p className="content">{formattedContent}</p>
		</div>
	);
};

export default ChatBubble;
