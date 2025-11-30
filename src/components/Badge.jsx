function Badge({ children }) {
  return (
    <span className="bg-[rgba(85,171,68,0.15)] text-primary px-2 py-1 rounded-full text-xs">
      {children}
    </span>
  )
}

export default Badge