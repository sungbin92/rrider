export function extractJson(text: string): any {
  // ```json ``` 블록 제거
  const cleaned = text
    .replace(/```json/g, '')
    .replace(/```/g, '')
    .trim();

  const firstBrace = cleaned.indexOf('{');
  const lastBrace = cleaned.lastIndexOf('}');

  if (firstBrace === -1 || lastBrace === -1) {
    throw new Error('JSON block not found');
  }

  const jsonString = cleaned.slice(firstBrace, lastBrace + 1);

  return JSON.parse(jsonString);
}
