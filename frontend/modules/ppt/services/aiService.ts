import { AIModel } from '../types';
import { sendMessageToGemini } from './geminiService';

export const sendMessageToAI = async (
  userMessage: string,
  model: AIModel,
  currentMarkdown: string,
  onMarkdownUpdate: (newMarkdown: string) => void,
  onPartialAssistantMessage?: (text: string) => void
): Promise<string> => {
  return sendMessageToGemini(
    userMessage,
    currentMarkdown,
    onMarkdownUpdate,
    model,
    onPartialAssistantMessage
  );
};
