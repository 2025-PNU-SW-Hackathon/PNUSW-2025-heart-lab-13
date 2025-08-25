export const SERVICES = [
  { key: 'Github', label: 'GitHub' },
  { key: 'Jira', label: 'Jira' },
  { key: 'Notion', label: 'Notion' }
] as const

export type Service = (typeof SERVICES)[number]
export type ServiceKey = Service['key']
// 'Github' | 'Jira' | 'Notion'
