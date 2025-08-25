import type { ServiceKey } from '@/src/lib/constants/services'
import { API_BASE } from '@/src/lib/api/_config'

//서비스별 OAuth URL 반환
export const getOAuthUrl = (service: ServiceKey): string => {
  switch (service) {
    case 'Github':
      return `${API_BASE}/auth/github`
    case 'Jira':
      return `${API_BASE}/auth/jira`
    case 'Notion':
      return `${API_BASE}/auth/notion`
    default:
      throw new Error(`지원하지 않는 서비스: ${service}`)
  }
}
