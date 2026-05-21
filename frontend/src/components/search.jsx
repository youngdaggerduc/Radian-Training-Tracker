import { useState, useEffect, useRef, useMemo } from 'react';
import { Icon } from './icons';
import { getCourse } from '../data';

export function SearchModal({ state, onClose, openDrawer }) {
  const [query, setQuery] = useState("");
  const inputRef = useRef(null);

  useEffect(() => {
    inputRef.current?.focus();
    const handler = (e) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (q.length < 2) return [];
    const leads = (state.leads || [])
      .filter(l =>
        l.name.toLowerCase().includes(q) ||
        (l.company || "").toLowerCase().includes(q) ||
        (l.phone || "").includes(q) ||
        (l.email || "").toLowerCase().includes(q)
      )
      .slice(0, 5)
      .map(l => ({ type: "lead", id: l.id, name: l.name, sub: (l.company || "Individual") + " · " + getCourse(l.courseId).name, badge: l.status }));

    const trainees = (state.trainees || [])
      .filter(t =>
        t.name.toLowerCase().includes(q) ||
        (t.company || "").toLowerCase().includes(q) ||
        (t.phone || "").includes(q) ||
        (t.email || "").toLowerCase().includes(q)
      )
      .slice(0, 5)
      .map(t => ({ type: "trainee", id: t.id, name: t.name, sub: (t.company || "Individual") + " · " + getCourse(t.courseId).name, badge: t.stage }));

    return [...leads, ...trainees];
  }, [query, state]);

  const go = (r) => { openDrawer({ type: r.type, id: r.id }); onClose(); };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: "var(--paper)", borderRadius: "var(--radius-lg)",
          width: "100%", maxWidth: 580,
          boxShadow: "var(--shadow-lg)",
          overflow: "hidden",
          animation: "slideUp 0.18s ease",
        }}
      >
        {/* Search input */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 18px", borderBottom: "1px solid var(--navy-100)" }}>
          <Icon name="search" size={16} style={{ color: "var(--navy-400)", flexShrink: 0 }}/>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search leads and trainees by name, company, phone or email…"
            style={{ flex: 1, border: "none", outline: "none", fontSize: 14, color: "var(--navy-800)", background: "transparent" }}
          />
          <kbd style={{ fontSize: 10, color: "var(--navy-400)", border: "1px solid var(--navy-100)", borderRadius: 4, padding: "2px 6px", fontFamily: "var(--mono)" }}>ESC</kbd>
        </div>

        {/* Results */}
        <div style={{ maxHeight: 420, overflowY: "auto" }}>
          {query.trim().length < 2 ? (
            <div style={{ padding: "20px 18px", display: "flex", flexDirection: "column", gap: 18 }}>
              <div style={{ fontSize: 11, letterSpacing: "0.16em", textTransform: "uppercase", color: "var(--navy-400)" }}>Quick tip</div>
              <div style={{ fontSize: 13, color: "var(--navy-500)", lineHeight: 1.6 }}>
                Type at least 2 characters to search across all leads and trainees. You can search by name, company, phone number, or email address.
              </div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {["Name", "Company", "Phone", "Email"].map(hint => (
                  <span key={hint} style={{ fontSize: 11, padding: "3px 10px", background: "var(--warm-100)", borderRadius: 100, color: "var(--navy-600)" }}>{hint}</span>
                ))}
              </div>
            </div>
          ) : results.length === 0 ? (
            <div style={{ padding: "28px 18px", textAlign: "center", color: "var(--navy-400)", fontSize: 13 }}>
              No results for "<strong style={{ color: "var(--navy-700)" }}>{query}</strong>"
            </div>
          ) : (
            <>
              {["lead", "trainee"].map(type => {
                const group = results.filter(r => r.type === type);
                if (!group.length) return null;
                return (
                  <div key={type}>
                    <div style={{ padding: "10px 18px 4px", fontSize: 10, letterSpacing: "0.18em", textTransform: "uppercase", color: "var(--navy-400)", fontWeight: 600 }}>
                      {type === "lead" ? "Training Leads" : "Trainees"}
                    </div>
                    {group.map(r => (
                      <div
                        key={r.id}
                        className="panel-row"
                        style={{ borderRadius: 0, cursor: "pointer", padding: "10px 18px", gap: 12 }}
                        onClick={() => go(r)}
                      >
                        <div style={{
                          width: 28, height: 28, borderRadius: "50%", flexShrink: 0,
                          background: type === "lead" ? "#E6EEFB" : "var(--green-lt)",
                          color: type === "lead" ? "#1E4FA3" : "var(--green)",
                          display: "flex", alignItems: "center", justifyContent: "center",
                        }}>
                          <Icon name={type === "lead" ? "leads" : "user"} size={13}/>
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div className="nm" style={{ fontSize: 13 }}>{r.name}</div>
                          <div className="sub" style={{ fontSize: 11 }}>{r.sub}</div>
                        </div>
                        <Icon name="chevR" size={13} style={{ color: "var(--navy-300)", flexShrink: 0 }}/>
                      </div>
                    ))}
                  </div>
                );
              })}
            </>
          )}
        </div>

        {/* Footer hint */}
        {results.length > 0 && (
          <div style={{ padding: "8px 18px", borderTop: "1px solid var(--navy-50)", display: "flex", gap: 16, alignItems: "center" }}>
            <span style={{ fontSize: 11, color: "var(--navy-400)" }}>
              <kbd style={{ fontSize: 10, border: "1px solid var(--navy-100)", borderRadius: 3, padding: "1px 5px", fontFamily: "var(--mono)", marginRight: 5 }}>↵</kbd>
              Open
            </span>
            <span style={{ fontSize: 11, color: "var(--navy-400)" }}>
              <kbd style={{ fontSize: 10, border: "1px solid var(--navy-100)", borderRadius: 3, padding: "1px 5px", fontFamily: "var(--mono)", marginRight: 5 }}>ESC</kbd>
              Close
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
