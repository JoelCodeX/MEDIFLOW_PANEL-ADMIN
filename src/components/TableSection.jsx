function TableSection({ rows = [] }) {
  return (
    <table className="w-full border-collapse">
      <thead>
        <tr className="text-[var(--muted)] font-semibold">
          <th className="px-3 py-2 border-b border-[#eaeaea] text-left">Descripción</th>
          <th className="px-3 py-2 border-b border-[#eaeaea] text-left">Fecha</th>
          <th className="px-3 py-2 border-b border-[#eaeaea] text-left">Categoría</th>
          <th className="px-3 py-2 border-b border-[#eaeaea] text-left">Monto</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((r, idx) => (
          <tr key={idx}>
            <td className="px-3 py-2 border-b border-[#eaeaea]">{r.desc}</td>
            <td className="px-3 py-2 border-b border-[#eaeaea]">{r.date}</td>
            <td className="px-3 py-2 border-b border-[#eaeaea]">{r.cat}</td>
            <td className="px-3 py-2 border-b border-[#eaeaea]">{r.amount}</td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

export default TableSection