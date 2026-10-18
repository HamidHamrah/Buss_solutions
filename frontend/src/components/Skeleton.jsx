export function Skeleton({ className = '' }) {
  return <div aria-hidden="true" className={`animate-pulse motion-reduce:animate-none bg-gray-200/80 rounded-md ${className}`} />
}

export function SkeletonRows({ rows = 5, className = '' }) {
  return (
    <div role="status" aria-label="Laster" className={`space-y-3 ${className}`}>
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className="bg-white border border-gray-200 rounded-2xl px-5 py-4 flex items-center gap-4">
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-1/3" />
            <Skeleton className="h-3 w-2/3" />
          </div>
          <Skeleton className="h-6 w-20 rounded-full" />
        </div>
      ))}
    </div>
  )
}

export function SkeletonTable({ rows = 6, cols = 6 }) {
  return Array.from({ length: rows }, (_, r) => (
    <tr key={r} className="border-t border-gray-100" aria-hidden="true">
      {Array.from({ length: cols }, (_, c) => (
        <td key={c} className="px-5 py-4"><Skeleton className={`h-4 ${c === 0 ? 'w-32' : 'w-16'}`} /></td>
      ))}
    </tr>
  ))
}
