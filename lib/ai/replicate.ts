import Replicate from 'replicate'

export const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN,
})

export const MENU_MODEL = 'google/nano-banana-2' as const
