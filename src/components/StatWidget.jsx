function StatWidget({ label, value, delta, items = [], compact = false, dense = false }) {
  const ringClass = dense ? 'w-[80px] h-[80px]' : compact ? 'w-[90px] h-[90px]' : 'w-[110px] h-[110px]'
  const innerClass = dense ? 'w-[52px] h-[52px]' : compact ? 'w-[60px] h-[60px]' : 'w-[72px] h-[72px]'
  const valueClass = dense ? 'text-xs font-bold' : compact ? 'text-sm font-bold' : 'text-base font-bold'
  const deltaClass = dense ? 'text-primary text-[9px] font-semibold' : compact ? 'text-primary text-[10px] font-semibold' : 'text-primary text-xs font-semibold'
  const listClass = dense ? 'grid gap-0.5 m-0 p-0 list-none text-[11px]' : compact ? 'grid gap-0.5 m-0 p-0 list-none text-xs' : 'grid gap-0.5 m-0 p-0 list-none text-sm'
  const dotClass = dense ? 'inline-block mr-1 w-[5px] h-[5px] rounded-full' : compact ? 'inline-block mr-1 w-[6px] h-[6px] rounded-full' : 'inline-block mr-1 w-[8px] h-[8px] rounded-full'
  const containerClass = dense ? 'flex gap-1.5 items-center' : compact ? 'flex gap-2 items-center' : 'flex gap-3 items-center'

  return (
    <div className={containerClass}>
      <div
        className={`${ringClass} rounded-full grid place-items-center`}
        aria-label={label}
        style={{ background: 'conic-gradient(var(--primary) 0 40%, #a5b4fc 40% 70%, #93c5fd 70% 100%)' }}
      >
        <div className={`bg-white ${innerClass} rounded-full grid place-items-center shadow-sm`}>
          <div className={valueClass}>{value}</div>
          <div className={deltaClass}>{delta}</div>
        </div>
      </div>
      <ul className={listClass}>
        {items.map((i) => (
          <li key={i.label}>
            <span className={dotClass} style={{ backgroundColor: i.color || '#55AB44' }} />
            {i.label}
          </li>
        ))}
      </ul>
    </div>
  )
}

export default StatWidget