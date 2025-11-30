function Card({ title, actionLabel, onAction, children, compact = false, dense = false, minH, className = '', actionButtonClassName, actionButtonStyle }) {
  const headerClass = dense
    ? 'flex items-center justify-between px-1.5 py-1 border-b border-[var(--border)]'
    : compact
    ? 'flex items-center justify-between px-2 py-1 border-b border-[var(--border)]'
    : 'flex items-center justify-between px-3 py-2 border-b border-[var(--border)]'
  const titleClass = dense ? 'text-sm font-semibold' : compact ? 'text-sm font-semibold' : 'text-base font-semibold'
  const buttonClass = dense
    ? 'px-2 py-0.5 text-[11px] rounded-md border border-[var(--border)] bg-white hover:bg-[#f8f8f8]'
    : compact
    ? 'px-2 py-1 text-xs rounded-md border border-[var(--border)] bg-white hover:bg-[#f8f8f8]'
    : 'px-3 py-1 rounded-md border border-[var(--border)] bg-white hover:bg-[#f8f8f8]'
  const bodyClass = dense ? 'p-1.5 flex-1' : compact ? 'p-2 flex-1' : 'p-3 flex-1'

  return (
    <section className={`bg-white border border-[var(--border)] rounded-xl shadow-sm flex flex-col min-h-0 ${className}`}>
      <div className={headerClass}>
        {title && <h3 className={titleClass}>{title}</h3>}
        {actionLabel && (
          <button className={actionButtonClassName ? actionButtonClassName : buttonClass} onClick={onAction} style={actionButtonStyle}>
            {actionLabel}
          </button>
        )}
      </div>
      <div
        className={`${bodyClass} overflow-auto`}
        style={minH ? { minHeight: typeof minH === 'number' ? `${minH}px` : minH } : undefined}
      >
        {children}
      </div>
    </section>
  )
}

export default Card