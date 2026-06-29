import { proxy } from 'valtio'
import type { PostTemplate } from '../types'

interface TemplateState {
  templates: PostTemplate[]
  currentTemplate: PostTemplate | null
  loading: boolean
}

export const templateStore = proxy<TemplateState>({
  templates: [],
  currentTemplate: null,
  loading: false
})

export function setTemplates(templates: PostTemplate[]): void {
  templateStore.templates = templates
}

export function setCurrentTemplate(template: PostTemplate | null): void {
  templateStore.currentTemplate = template
}

export function setTemplateLoading(loading: boolean): void {
  templateStore.loading = loading
}
