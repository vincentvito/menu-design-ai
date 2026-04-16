import Replicate from 'replicate'

export const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN,
})

export const MENU_MODEL = 'qwen/qwen-image-2' as const
