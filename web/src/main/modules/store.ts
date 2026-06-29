import Store from 'electron-store'
import type { ConfigStore, ThemeMode } from '../../shared/types'

const defaultConfig: ConfigStore = {
  theme: 'dark'
}

let configStore: Store<ConfigStore>

export function initConfigStore(): void {
  configStore = new Store<ConfigStore>({
    name: 'config',
    defaults: defaultConfig
  })
}

export function getConfigStore(): Store<ConfigStore> {
  if (!configStore) {
    initConfigStore()
  }
  return configStore
}

export function getTheme(): ThemeMode {
  return getConfigStore().get('theme', 'dark')
}

export function setTheme(theme: ThemeMode): void {
  getConfigStore().set('theme', theme)
}

export function toggleTheme(): ThemeMode {
  const current = getTheme()
  const newTheme: ThemeMode = current === 'dark' ? 'light' : 'dark'
  setTheme(newTheme)
  return newTheme
}

export function getConfig(): ConfigStore {
  return getConfigStore().store
}

export function saveConfig(config: Partial<ConfigStore>): void {
  getConfigStore().set(config)
}
