// src/app/(dashboard)/materials/loading.tsx
export default function MaterialsLoading() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="h-7 w-48 bg-muted rounded-xl animate-pulse" />
          <div className="h-4 w-32 bg-muted/60 rounded-lg animate-pulse" />
        </div>
        <div className="h-9 w-36 bg-muted rounded-xl animate-pulse" />
      </div>
      <div className="flex gap-3">
        <div className="flex-1 h-10 bg-muted rounded-xl animate-pulse" />
        <div className="h-10 w-24 bg-muted rounded-xl animate-pulse" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="rounded-2xl border border-border bg-muted/20 animate-pulse">
            <div className="h-44 bg-muted/50 rounded-t-2xl" />
            <div className="p-4 space-y-3">
              <div className="h-5 bg-muted rounded-lg w-1/3" />
              <div className="h-4 bg-muted rounded-lg w-full" />
              <div className="h-4 bg-muted rounded-lg w-3/4" />
              <div className="flex gap-2">
                <div className="h-5 bg-muted rounded-md w-12" />
                <div className="h-5 bg-muted rounded-md w-16" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
