import Image from 'next/image'
import logo from '@/src/lib/image/logo.png'
export default function Logo({ className }: { className?: string }) {
  return (
    <Image
      src={logo}
      alt="Moti 로고"
      width={141}
      height={42}
      className={className}
      priority // 로고는 보통 우선 로딩
    />
  )
}
