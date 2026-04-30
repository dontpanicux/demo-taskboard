interface AvatarProps {
  name?: string | null
  email?: string | null
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

const COLORS = [
  'bg-sky-500',
  'bg-violet-500',
  'bg-emerald-500',
  'bg-amber-500',
  'bg-rose-500',
  'bg-indigo-500',
]

function getColor(seed: string): string {
  let hash = 0
  for (let i = 0; i < seed.length; i++) {
    hash = seed.charCodeAt(i) + ((hash << 5) - hash)
  }
  return COLORS[Math.abs(hash) % COLORS.length]
}

function getInitials(name?: string | null, email?: string | null): string {
  if (name) {
    const parts = name.trim().split(/\s+/)
    if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
    return name[0].toUpperCase()
  }
  if (email) return email[0].toUpperCase()
  return '?'
}

const sizes = {
  sm: 'w-6 h-6 text-xs',
  md: 'w-8 h-8 text-sm',
  lg: 'w-10 h-10 text-base',
}

export function Avatar({ name, email, size = 'md', className = '' }: AvatarProps) {
  const seed = name ?? email ?? 'unknown'
  const color = getColor(seed)
  const initials = getInitials(name, email)

  return (
    <div
      className={`${sizes[size]} ${color} rounded-full flex items-center justify-center text-white font-medium shrink-0 ${className}`}
      title={name ?? email ?? undefined}
      aria-label={name ?? email ?? 'User avatar'}
    >
      {initials}
    </div>
  )
}
