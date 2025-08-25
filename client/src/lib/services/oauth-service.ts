import type { ServiceKey } from '../constants/services'
import { getOAuthUrl } from '../api/auth/oauth/oauth'

export async function prepareOAuth(service: ServiceKey) {
  const url = getOAuthUrl(service)
  return { url }
}
