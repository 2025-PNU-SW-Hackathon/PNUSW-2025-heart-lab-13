export const TaskIcon = ({ size = 20 }: { size?: number }) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 128 128"
      fill="none"
    >
      <path
        d="M104 8H24C15.1634 8 8 15.1634 8 24V104C8 112.837 15.1634 120 24 120H104C112.837 120 120 112.837 120 104V24C120 15.1634 112.837 8 104 8Z"
        fill="#4BADE8"
      />
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M92.9974 37.7531C96.4475 40.5132 97.0068 45.5475 94.2468 48.9976L62.2468 88.9976C59.4867 92.4477 54.4523 93.0071 51.0022 90.247C47.5522 87.4869 46.9928 82.4526 49.7529 79.0025L81.7529 39.0025C84.5129 35.5524 89.5473 34.993 92.9974 37.7531Z"
        fill="white"
      />
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M34.3431 62.3431C37.4673 59.219 42.5327 59.219 45.6569 62.3431L61.6569 78.3431C64.781 81.4673 64.781 86.5327 61.6569 89.6569C58.5327 92.781 53.4673 92.781 50.3431 89.6569L34.3431 73.6569C31.219 70.5327 31.219 65.4673 34.3431 62.3431Z"
        fill="white"
      />
    </svg>
  )
}

export const KAvatarIcon = ({ size = 16, title = 'K' }: { size?: number; title?: string }) => {
  const radius = 8
  const viewBoxSize = 16
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox={`0 0 ${viewBoxSize} ${viewBoxSize}`}
      role="img"
      aria-label={title}
    >
      <title>{title}</title>
      <circle cx={radius} cy={radius} r={radius} fill="#078a5d" />
      <text
        x="50%"
        y="50%"
        textAnchor="middle"
        dominantBaseline="central"
        fontSize="10"
        fontWeight="700"
        fill="#162f51"
        aria-hidden="true"
      >
        K
      </text>
    </svg>
  )
}

export const MAvatarIcon = ({ size = 16, title = 'M' }: { size?: number; title?: string }) => {
  const radius = 8
  const viewBoxSize = 16
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox={`0 0 ${viewBoxSize} ${viewBoxSize}`}
      role="img"
      aria-label={title}
    >
      <title>{title}</title>
      <circle cx={radius} cy={radius} r={radius} fill="#e0370e" />
      <text
        x="50%"
        y="50%"
        textAnchor="middle"
        dominantBaseline="central"
        fontSize="10"
        fontWeight="700"
        fill="#ffffff"
        aria-hidden="true"
      >
        M
      </text>
    </svg>
  )
}

export const JAvatarIcon = ({ size = 16, title = 'J' }: { size?: number; title?: string }) => {
  const radius = 8
  const viewBoxSize = 16
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox={`0 0 ${viewBoxSize} ${viewBoxSize}`}
      role="img"
      aria-label={title}
    >
      <title>{title}</title>
      <circle cx={radius} cy={radius} r={radius} fill="#00a3bf" />
      <text
        x="50%"
        y="50%"
        textAnchor="middle"
        dominantBaseline="central"
        fontSize="10"
        fontWeight="700"
        fill="#162f51"
        aria-hidden="true"
      >
        J
      </text>
    </svg>
  )
}
