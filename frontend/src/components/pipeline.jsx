import * as RD from '../data';

// Pipeline kanban view
export function PipelineView({ state, openDrawer }) {
  const stages = RD.PIPELINE_STAGES;

  const byStage = {};
  stages.forEach(s => byStage[s.id] = []);

  state.leads.forEach(l => {
    const stage = RD.leadStage(l);
    byStage[stage].push({ kind: "lead", ...l });
  });
  state.trainees.forEach(t => {
    const stage = RD.traineeStage(t);
    if (byStage[stage]) byStage[stage].push({ kind: "trainee", ...t });
  });

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="eyebrow">All Stages</div>
          <h1>Pipeline View</h1>
        </div>
        <div className="actions">
          <span style={{fontSize: 12, color: "var(--navy-500)"}}>Click any card to open details</span>
        </div>
      </div>

      <div className="pipeline">
        {stages.map(stage => {
          const items = byStage[stage.id];
          return (
            <div key={stage.id} className="pipe-col">
              <div className="pipe-col-head">
                <div className="ttl">{stage.label}</div>
                <div className="ct">{items.length}</div>
              </div>
              {items.length === 0 ? (
                <div style={{padding:"24px 12px", textAlign:"center", color:"var(--navy-300)", fontSize:12}}>—</div>
              ) : items.map(it => {
                const course = RD.getCourse(it.courseId);
                return (
                  <div key={it.kind + it.id} className="pipe-card"
                    onClick={() => openDrawer({ type: it.kind, id: it.id })}>
                    <div className="nm">{it.name}</div>
                    <div className="crs">{course.provider} · {course.name}</div>
                    <div className="ftr">
                      <span className="amt">
                        {it.kind === "lead" ? RD.fmtMoney(course.price) :
                          (it.totalCost - it.paid > 0 ? "Bal: " + RD.fmtMoney(it.totalCost - it.paid) : "✓ Paid")}
                      </span>
                      {it.kind === "lead" && it.priority === "High" && <span className="pill high" style={{padding:"2px 7px", fontSize:10}}>High</span>}
                      {it.kind === "trainee" && it.certificate?.status === "Ready for Collection" && (
                        <span className="pill ready" style={{padding:"2px 7px", fontSize:10}}>Ready</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
}
