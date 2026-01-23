import { AiClient } from './ai.client';
import { OpenAI } from 'openai';

export class OpenAiClient implements AiClient {
  private client: OpenAI;

  constructor(apiKey: string) {
    this.client = new OpenAI({
      apiKey,
    });
  }

  async generate(prompt: string): Promise<string> {
    const completion = await this.client.chat.completions.create({
      model: 'gpt-4.1-mini',
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.7,
    });

    return completion.choices[0].message.content ?? '';
  }
}
