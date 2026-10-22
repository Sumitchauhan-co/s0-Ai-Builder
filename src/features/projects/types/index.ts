export const MessageRole = {
	USER: 'USER',
	ASSISTANT: 'ASSISTANT',
} as const;

export type MessageRole = (typeof MessageRole)[keyof typeof MessageRole];

export const MessageType = {
	RESULT: 'RESULT',
	ERROR: 'ERROR',
} as const;

export type MessageType = (typeof MessageType)[keyof typeof MessageType];