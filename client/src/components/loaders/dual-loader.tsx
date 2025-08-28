import React from 'react'

type DualLoaderProps = {
  label?: string
  size?: number
}

const DualLoader = ({ label = '콘텐츠 로딩 중', size = 80 }: DualLoaderProps) => {
  const box = `${size}px`
  const blob = `${Math.round(size * (78 / 140))}px`
  const glass = `${Math.round(size * (88 / 140))}px`
  const offset = `${Math.round(size * (34 / 140))}px`

  return (
    <div
      className="flex flex-col items-center justify-center gap-3"
      role="status"
      aria-label={label}
    >
      <div className="relative isolate" style={{ width: box, height: box }} aria-hidden="true">
        {/* orbit A */}
        <div className="absolute inset-0 grid place-items-center origin-center animate-spin [animation-duration:2.2s]">
          <div
            className="rounded-full bg-gradient-to-b from-[#2f7bff] to-[#1c4ed8] [box-shadow:inset_0_-2px_0_rgba(0,0,0,0.25),0_3px_6px_rgba(0,0,0,0.25)]"
            style={{ width: blob, height: blob, transform: `translateX(${offset})` }}
          />
        </div>

        {/* orbit B */}
        <div className="absolute inset-0 grid place-items-center origin-center animate-spin [animation-duration:2.2s] [animation-direction:reverse]">
          <div
            className="relative overflow-hidden rounded-full [background:rgba(255,255,255,0.22)] border border-white/55 backdrop-blur-[10px] [backdrop-filter:saturate(1.4)] shadow-none [box-shadow:inset_0_1px_0_rgba(255,255,255,0.8),inset_0_-10px_18px_rgba(255,255,255,0.15),0_6px_22px_rgba(26,87,255,0.18)]"
            style={{ width: glass, height: glass, transform: `translateX(${offset})` }}
          >
            <div className="before:content-[''] before:absolute before:[inset:-20%_-20%_40%_-20%] before:[background:linear-gradient(to_bottom,rgba(255,255,255,0.7),rgba(255,255,255,0))] before:-rotate-[20deg] after:content-[''] after:absolute after:inset-0 after:rounded-full after:[background:radial-gradient(60%_60%_at_35%_35%,rgba(255,255,255,0.25),rgba(255,255,255,0)_60%)] after:mix-blend-screen" />
          </div>
        </div>
      </div>
      <span className="sr-only">{label}</span>
    </div>
  )
}

export default DualLoader
