import { getMe } from '@/src/lib/api/user/user'
import { useAppStore } from '@/src/store/user-store'

// 사용자 정보 및 연동 상태를 가져와서 스토어에 저장
export const loadUserData = async (): Promise<void> => {
  try {
    const response = await getMe()
    useAppStore.getState().setUser(response)
  } catch (error) {
    console.error('사용자 정보 로드 실패:', error)

    // 401 에러인 경우 로그인이 필요함을 명확히 표시
    if (error instanceof Error && error.message.includes('401')) {
      console.log('로그인이 필요합니다. /sign-in으로 리다이렉트하세요.')
    }

    throw error
  }
}
