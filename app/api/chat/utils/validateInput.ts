// validate input
const validateInput = (prompt: unknown): string | null => {
	if (!prompt) {
		return 'Prompt is required';
	}
	
	if (typeof prompt !== 'string') {
		return 'Prompt must be a string';
	}
	
	const trimmedPrompt = prompt.trim();
	
	if (!trimmedPrompt) {
		return 'Prompt cannot be empty';
	}
	
	if (trimmedPrompt.length > 1000) {
		return 'Prompt is too long (maximum 1000 characters)';
	}
	
	return null;
};

export default validateInput