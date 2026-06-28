export const SkeletonCard = ({ className = '' }) => (
  <div className={`skeleton h-full w-full rounded-2xl ${className}`} />
);

export const SkeletonLine = ({ width = 'w-full', height = 'h-4' }) => (
  <div className={`skeleton ${width} ${height} rounded-lg`} />
);

export const SkeletonAnalysis = () => (
  <div className="space-y-6 animate-pulse">
    {/* Top row */}
    <div className="grid md:grid-cols-2 gap-6">
      <div className="bg-slate-800/40 border border-slate-700/50 rounded-2xl p-6 space-y-4">
        <SkeletonLine width="w-1/3" height="h-3" />
        <SkeletonLine width="w-3/4" height="h-7" />
        <SkeletonLine width="w-1/2" height="h-3" />
        <div className="grid grid-cols-2 gap-4 pt-2">
          <SkeletonLine height="h-8" />
          <SkeletonLine height="h-8" />
        </div>
      </div>
      <div className="bg-slate-800/40 border border-slate-700/50 rounded-2xl p-6 space-y-4">
        <SkeletonLine width="w-1/3" height="h-3" />
        {[1,2,3,4].map(i => (
          <div key={i} className="space-y-1.5">
            <SkeletonLine width="w-1/2" height="h-3" />
            <SkeletonLine height="h-2" />
          </div>
        ))}
      </div>
    </div>

    {/* Middle row */}
    <div className="grid md:grid-cols-2 gap-6">
      {[1,2].map(i => (
        <div key={i} className="bg-slate-800/40 border border-slate-700/50 rounded-2xl p-6 space-y-3">
          <SkeletonLine width="w-1/3" height="h-3" />
          <SkeletonLine height="h-4" />
          <SkeletonLine width="w-4/5" height="h-4" />
          <SkeletonLine width="w-2/3" height="h-4" />
        </div>
      ))}
    </div>

    {/* Code block */}
    <div className="bg-slate-950 rounded-2xl border border-slate-800 h-48">
      <div className="flex items-center gap-2 p-4 border-b border-slate-800">
        <SkeletonLine width="w-24" height="h-3" />
      </div>
      <div className="p-4 space-y-2">
        {[1,2,3,4,5].map(i => (
          <SkeletonLine key={i} width={`w-${[4,3,5,4,3][i-1]}/6`} height="h-3" />
        ))}
      </div>
    </div>
  </div>
);

export const SkeletonHistoryRow = () => (
  <div className="flex items-center gap-4 p-4 border-b border-slate-700/40 animate-pulse">
    <SkeletonLine width="w-8" height="h-8" />
    <div className="flex-1 space-y-2">
      <SkeletonLine width="w-1/3" height="h-4" />
      <SkeletonLine width="w-1/2" height="h-3" />
    </div>
    <SkeletonLine width="w-20" height="h-6" />
    <SkeletonLine width="w-24" height="h-6" />
  </div>
);

export const SkeletonStat = () => (
  <div className="bg-slate-800/40 border border-slate-700/50 rounded-2xl p-6 space-y-3 animate-pulse">
    <SkeletonLine width="w-1/3" height="h-3" />
    <SkeletonLine width="w-1/2" height="h-8" />
    <SkeletonLine width="w-2/3" height="h-3" />
  </div>
);
