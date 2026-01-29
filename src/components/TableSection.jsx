function TableSection({ rows = [] }) {
  return (
    <table className="w-full border-collapse">
      <thead>
        <tr className="text-[var(--text)] font-semibold">
          <th className="px-3 py-2 border-b border-[var(--border)] text-left">Descripción</th>
          <th className="px-3 py-2 border-b border-[var(--border)] text-left">Fecha</th>
          <th className="px-3 py-2 border-b border-[var(--border)] text-left">Categoría</th>
          <th className="px-3 py-2 border-b border-[var(--border)] text-left">Monto</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((r, idx) => (
          <tr key={idx}>
            <td className="px-3 py-2 border-b border-[var(--border)]">{r.desc}</td>
            <td className="px-3 py-2 border-b border-[var(--border)]">{r.date}</td>
            <td className="px-3 py-2 border-b border-[var(--border)]">{r.cat}</td>
            <td className="px-3 py-2 border-b border-[var(--border)]">{r.amount}</td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

export default TableSection