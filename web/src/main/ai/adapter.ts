// AI 图片生成适配器接口（参考 createImage/lib/ai/adapter.ts）

export interface GenParams {
  prompt: string
  size?: string
  n?: number
  quality?: 'standard' | 'hd'
}

export interface EditParams {
  prompt: string
  image: Buffer | ArrayBuffer
  size?: string
  n?: number
}

export interface GenResult {
  images: Array<{
    url: string
    localPath?: string
    id: string
    b64_json?: string
  }>
  metadata?: {
    model?: string
    revisedPrompt?: string
  }
}

export interface ImageGenAdapter {
  name: string
  modelId: string
  generate(params: GenParams): Promise<GenResult>
  edit?(params: EditParams): Promise<GenResult>
  isAvailable(): Promise<boolean>
}
