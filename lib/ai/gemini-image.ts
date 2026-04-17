import { GoogleGenAI } from '@google/genai'

const ai = new GoogleGenAI({ apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY! })

export interface GeneratedImage {
  base64: string
  mimeType: string
}

export async function generateMenuImage(prompt: string): Promise<GeneratedImage> {
  const response = await ai.models.generateContent({
    model: 'gemini-3.1-flash-image-preview',
    contents: prompt,
  })

  for (const part of response.candidates?.[0]?.content?.parts ?? []) {
    if (part.inlineData?.data && part.inlineData?.mimeType) {
      return { base64: part.inlineData.data, mimeType: part.inlineData.mimeType }
    }
  }

  throw new Error('Gemini returned no image in response')
}
