import { Skeleton } from './ui/skeleton';

export function DashboardLayoutSkeleton() {
  return (
    <div className="min-h-screen" style={{ background: "#F0F2F5" }}>
      {/* Top nav skeleton */}
      <div className="bg-white shadow-[0_1px_3px_rgba(0,0,0,0.04)] sticky top-0 z-50">
        <div className="max-w-[1440px] mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <Skeleton className="h-9 w-24 rounded-md" />
            <div className="hidden md:flex items-center gap-2">
              <Skeleton className="h-9 w-28 rounded-xl" />
              <Skeleton className="h-9 w-24 rounded-xl" />
              <Skeleton className="h-9 w-20 rounded-xl" />
            </div>
          </div>
          <div className="flex items-center gap-2.5">
            <Skeleton className="h-8 w-8 rounded-full" />
            <div className="hidden sm:block space-y-1.5">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-2 w-12" />
            </div>
          </div>
        </div>
      </div>

      {/* Main content skeleton */}
      <div className="max-w-[1440px] mx-auto px-6 py-6 space-y-4">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-48 rounded-lg" />
          <Skeleton className="h-10 w-36 rounded-xl" />
        </div>
        <Skeleton className="h-48 w-full rounded-[20px]" />
        <div className="grid grid-cols-12 gap-3">
          <Skeleton className="col-span-3 h-24 rounded-[20px]" />
          <Skeleton className="col-span-3 h-24 rounded-[20px]" />
          <Skeleton className="col-span-3 h-24 rounded-[20px]" />
          <Skeleton className="col-span-3 h-24 rounded-[20px]" />
        </div>
        <div className="grid grid-cols-12 gap-3">
          <Skeleton className="col-span-7 h-64 rounded-[20px]" />
          <Skeleton className="col-span-5 h-64 rounded-[20px]" />
        </div>
      </div>
    </div>
  );
}
