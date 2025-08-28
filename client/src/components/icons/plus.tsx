import Image from 'next/image'
import plus from '@/src/lib/image/plus.svg'

export default function Plus({ className }: { className?: string }) {
  return <Image src={plus} alt="로고" width={12} height={12} className={className} />
}
