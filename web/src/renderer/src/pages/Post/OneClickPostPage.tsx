import { useState } from 'react'
import { Steps, Card, Button, Select, Checkbox, message, Spin, Input, Tag } from 'antd'
import { Sparkles, Image, Send } from 'lucide-react'
import { useSnapshot } from 'valtio'
import { templateStore } from '../../stores/templateStore'
import { platformStore, isPlatformLoggedIn } from '../../stores/platformStore'
import type { PlatformCode } from '@shared/types'
import type { PostTemplate } from '../../types'
import { aiApi } from '../../api/ai'

const platformLabels: Record<PlatformCode, string> = {
  xiaohongshu: '小红书',
  douyin: '抖音',
  kuaishou: '快手'
}

export function OneClickPostPage(): React.ReactElement {
  const [current, setCurrent] = useState(0)
  const [selectedTemplate, setSelectedTemplate] = useState<PostTemplate | null>(null)
  const [generatedText, setGeneratedText] = useState('')
  const [generatedImages, setGeneratedImages] = useState<string[]>([])
  const [selectedPlatforms, setSelectedPlatforms] = useState<PlatformCode[]>([])
  const [generating, setGenerating] = useState(false)
  const [publishing, setPublishing] = useState(false)

  const { templates } = useSnapshot(templateStore)
  const { accounts } = useSnapshot(platformStore)

  const availablePlatforms = (Object.keys(accounts) as PlatformCode[]).filter((code) =>
    isPlatformLoggedIn(code)
  )

  const handleGenerate = async (): Promise<void> => {
    if (!selectedTemplate) return
    setGenerating(true)
    try {
      // Generate text via backend
      const textRes = await aiApi.generateText({
        prompt: selectedTemplate.text_prompt,
        style: selectedTemplate.image_style,
        hashtags: JSON.parse(selectedTemplate.hashtags || '[]')
      }) as { code: number; data?: { text: string }; msg?: string }

      if (textRes.code === 200 && textRes.data) {
        setGeneratedText(textRes.data.text)
      }

      // Generate image via Electron main process
      const imageRes = await window.app?.ai?.generateImage({
        prompt: selectedTemplate.text_prompt
      })

      if (imageRes?.code === 200 && imageRes.data) {
        setGeneratedImages(imageRes.data.images.map((img) => img.localPath).filter(Boolean) as string[])
      }

      setCurrent(2)
    } catch {
      message.error('生成失败，请重试')
    } finally {
      setGenerating(false)
    }
  }

  const handlePublish = async (): Promise<void> => {
    setPublishing(true)
    try {
      for (const platform of selectedPlatforms) {
        const api = window.app?.[platform]
        if (!api) continue

        const res = await api.publish({
          text: generatedText,
          imagePaths: generatedImages,
          hashtags: selectedTemplate ? JSON.parse(selectedTemplate.hashtags || '[]') : []
        })

        if (res.code === 200) {
          message.success(`${platformLabels[platform]} 发布成功`)
        } else {
          message.error(`${platformLabels[platform]} 发布失败: ${res.msg}`)
        }
      }
      setCurrent(4)
    } catch {
      message.error('发布出错')
    } finally {
      setPublishing(false)
    }
  }

  const steps = [
    { title: '选择模板' },
    { title: '生成内容' },
    { title: '选择平台' },
    { title: '确认发布' },
    { title: '发布完成' }
  ]

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold">一键发帖</h2>
      <Steps current={current} items={steps} />

      <Card className="min-h-100">
        <Spin spinning={generating || publishing}>
          {current === 0 && (
            <div className="space-y-4">
              <h3 className="font-medium">选择发帖模板</h3>
              <Select
                placeholder="选择模板"
                className="w-full"
                size="large"
                onChange={(value) => {
                  const t = templates.find((t) => t.id === value) || null
                  setSelectedTemplate(t)
                }}
                options={templates.map((t) => ({ label: t.name, value: t.id }))}
              />
              <Button
                type="primary"
                disabled={!selectedTemplate}
                onClick={() => { handleGenerate(); setCurrent(1) }}
              >
                下一步：生成内容
              </Button>
            </div>
          )}

          {current === 1 && (
            <div className="space-y-4">
              <h3 className="font-medium">AI 生成内容</h3>
              <div>
                <label className="font-medium text-sm mb-1 block">文案内容</label>
                <Input.TextArea
                  rows={6}
                  value={generatedText}
                  onChange={(e) => setGeneratedText(e.target.value)}
                  placeholder="AI 生成的文案将显示在这里..."
                />
              </div>
              {generatedImages.length > 0 && (
                <div>
                  <label className="font-medium text-sm mb-1 block">生成的图片</label>
                  <div className="flex gap-2">
                    {generatedImages.map((img, i) => (
                      <Tag key={i}>{img.split('/').pop()}</Tag>
                    ))}
                  </div>
                </div>
              )}
              <Button icon={<Sparkles size={14} />} onClick={handleGenerate} loading={generating}>
                重新生成
              </Button>
              <Button type="primary" onClick={() => setCurrent(2)} className="ml-2">
                下一步：选择平台
              </Button>
            </div>
          )}

          {current === 2 && (
            <div className="space-y-4">
              <h3 className="font-medium">选择发布平台</h3>
              <Checkbox.Group
                value={selectedPlatforms}
                onChange={(vals) => setSelectedPlatforms(vals as PlatformCode[])}
              >
                <div className="grid grid-cols-3 gap-4">
                  {availablePlatforms.map((code) => (
                    <Checkbox key={code} value={code} className="text-lg">
                      {platformLabels[code]}
                    </Checkbox>
                  ))}
                </div>
              </Checkbox.Group>
              {availablePlatforms.length === 0 && (
                <p className="text-gray-500">没有已登录的平台，请先去平台管理页登录</p>
              )}
              <Button
                type="primary"
                disabled={selectedPlatforms.length === 0}
                onClick={() => setCurrent(3)}
              >
                下一步：确认发布
              </Button>
            </div>
          )}

          {current === 3 && (
            <div className="space-y-4">
              <h3 className="font-medium">确认发布内容</h3>
              <Card size="small" title="文案预览">
                <p>{generatedText}</p>
              </Card>
              <Card size="small" title="发布平台">
                {selectedPlatforms.map((p) => (
                  <Tag key={p} color="green">{platformLabels[p]}</Tag>
                ))}
              </Card>
              <Button type="primary" icon={<Send size={14} />} onClick={handlePublish} loading={publishing}>
                确认发布
              </Button>
            </div>
          )}

          {current === 4 && (
            <div className="text-center py-12">
              <p className="text-2xl text-green-500 mb-4">发布完成！</p>
              <Button type="primary" onClick={() => { setCurrent(0); setGeneratedText(''); setGeneratedImages([]); setSelectedPlatforms([]) }}>
                继续发帖
              </Button>
            </div>
          )}
        </Spin>
      </Card>
    </div>
  )
}
