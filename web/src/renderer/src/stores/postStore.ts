import { proxy } from 'valtio'
import type { PostRecord, DashboardStats } from '../types'

interface PostState {
  posts: PostRecord[]
  stats: DashboardStats | null
  loading: boolean
}

export const postStore = proxy<PostState>({
  posts: [],
  stats: null,
  loading: false
})

export function setPosts(posts: PostRecord[]): void {
  postStore.posts = posts
}

export function setStats(stats: DashboardStats): void {
  postStore.stats = stats
}

export function setPostLoading(loading: boolean): void {
  postStore.loading = loading
}
