export interface AiClient {
  generate(prompt: string): Promise<string>;
}
