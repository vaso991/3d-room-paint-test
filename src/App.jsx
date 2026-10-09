import { useMemo, useState } from 'react'
import RoomViewer from './RoomViewer.jsx'
import colors from './colors.json'

// LRV (light reflectance value) is the color's relative luminance as a percentage.
const lrv = (hex) => {
  const [r, g, b] = [1, 3, 5].map((i) => {
    const c = parseInt(hex.slice(i, i + 2), 16) / 255
    return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
  })
  return Math.round((0.2126 * r + 0.7152 * g + 0.0722 * b) * 100)
}

export default function App() {
  const [selected, setSelected] = useState(null)
  const [query, setQuery] = useState('')

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return q ? colors.filter((c) => c.name.toLowerCase().includes(q) || c.hex.toLowerCase().includes(q)) : colors
  }, [query])

  return (
    <div className="app">
      <div className="viewer">
        <RoomViewer wallColor={selected?.hex} />
      </div>
      <aside className="sidebar">
        <h2>Wall color</h2>
        <div className="current">
          {selected ? (
            <>
              <span className="chip" style={{ background: selected.hex }} />
              <span className="meta">
                <strong>{selected.name}</strong>
                <span>{selected.hex} · LRV {lrv(selected.hex)}</span>
              </span>
            </>
          ) : (
            <span className="meta">Select a color</span>
          )}
        </div>
        <input
          className="search"
          type="search"
          placeholder="Search name or hex"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <ul className="swatch-grid">
          {filtered.map((c) => (
            <li key={c.id}>
              <button
                className={'tile' + (selected?.id === c.id ? ' active' : '')}
                style={{ background: c.hex }}
                title={`${c.name} ${c.hex}`}
                aria-label={c.ariaLabel}
                aria-pressed={selected?.id === c.id}
                onClick={() => setSelected(c)}
              />
            </li>
          ))}
        </ul>
        {filtered.length === 0 && <p className="empty">No matching colors</p>}
      </aside>
    </div>
  )
}
