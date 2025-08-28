import Image from 'next/image'
import circle from '@/src/lib/image/circle.png'
export default function Circle({ className }: { className?: string }) {
  return <Image src={circle} alt="circle 로고" width={141} height={42} className={className} />
}
