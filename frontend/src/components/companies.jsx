import { useState } from 'react';
import { Icon } from './icons';
import * as RD from '../data';

function buildCompanies(leads, trainees) {
  const map = {};

  const ensure = (name) => {
    if (!map[name]) map[name] = { name, leads: [], trainees: [] };
    return map[name];
  };

  leads.forEach(l => ensure(l.company || "Individual").leads.push(l));
  trainees.forEach(t => ensure(t.company || "Individual").trainees.push(t));

  return Object.values(map).sort((a, b) => {
    if (a.name === "Individual") return 1;
    if (b.name === "Individual") return -1;
    return a.name.localeCompare(b.name);
  });
}

export function CompaniesView({ state, openDrawer }) {
  const [search, setSearch] = useState("");
  const [expanded, setExpanded] = useState(null);

  const companies = buildCompanies(state.leads, state.trainees)
    .filter(c => !search || c.name.toLowerCase().includes(search.toLowerCase()));

  const toggle = (name) => setExpanded(e => e === name ? null : name);

  const totalRevenue = companies.reduce((s, c) => s + c.trainees.reduce((a, t) => a + t.paid, 0), 0);
  const totalOutstanding = companies.reduce((s, c) => s + c.trainees.reduce((a, t) => a + Math.max(0, t.totalCost - t.paid), 0), 0);

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="eyebrow">CRM · Overview</div>
          <h1>Companies</h1>
        </div>
      </div>

      <div className="three-col">
        <div className="panel" style={{padding:"22px"}}>
          <div style={{fontSize:11, letterSpacing:"0.16em", textTransform:"uppercase", color:"var(--navy-500)", marginBottom:14}}>Companies & Individuals</div>
          <div className="amount-lg" style={{fontSize:32}}>{companies.length}</div>
          <div style={{fontSize:12, color:"var(--navy-500)", marginTop:10}}>unique employer accounts</div>
        </div>
        <div className="panel" style={{padding:"22px"}}>
          <div style={{fontSize:11, letterSpacing:"0.16em", textTransform:"uppercase", color:"var(--green)", marginBottom:14}}>Total Revenue Collected</div>
          <div className="amount-lg"><span className="cur">TT$</span>{Number(totalRevenue).toLocaleString("en-US",{minimumFractionDigits:2,maximumFractionDigits:2})}</div>
          <div style={{fontSize:12, color:"var(--navy-500)", marginTop:10}}>across all trainees</div>
        </div>
        <div className="panel" style={{padding:"22px"}}>
          <div style={{fontSize:11, letterSpacing:"0.16em", textTransform:"uppercase", color:"var(--orange-dk)", marginBottom:14}}>Total Outstanding</div>
          <div className="amount-lg"><span className="cur">TT$</span>{Number(totalOutstanding).toLocaleString("en-US",{minimumFractionDigits:2,maximumFractionDigits:2})}</div>
          <div style={{fontSize:12, color:"var(--navy-500)", marginTop:10}}>balance remaining</div>
        </div>
      </div>

      <div className="toolbar">
        <input className="search-input" placeholder="Search by company name…" value={search} onChange={e => setSearch(e.target.value)}/>
      </div>

      <div className="panel">
        {companies.length === 0 ? (
          <div className="empty">
            <div className="icon">∅</div>
            <div className="ttl">No companies match</div>
          </div>
        ) : companies.map(company => {
          const revenue = company.trainees.reduce((s, t) => s + t.paid, 0);
          const outstanding = company.trainees.reduce((s, t) => s + Math.max(0, t.totalCost - t.paid), 0);
          const isOpen = expanded === company.name;

          return (
            <div key={company.name} style={{borderBottom:"1px solid var(--navy-50)"}}>
              <div
                onClick={() => toggle(company.name)}
                style={{
                  display:"grid", gridTemplateColumns:"1fr 90px 90px 120px 120px 36px",
                  padding:"14px 20px", alignItems:"center", cursor:"pointer", gap:16,
                  background: isOpen ? "var(--warm-100)" : "transparent",
                }}
                className="panel-row"
              >
                <div>
                  <div className="nm" style={{display:"flex", alignItems:"center", gap:8}}>
                    <Icon name="company" size={14} style={{color:"var(--orange)", flexShrink:0}}/>
                    {company.name}
                  </div>
                  <div className="sub">
                    {company.leads.length > 0 && `${company.leads.length} lead${company.leads.length===1?"":"s"}`}
                    {company.leads.length > 0 && company.trainees.length > 0 && " · "}
                    {company.trainees.length > 0 && `${company.trainees.length} trainee${company.trainees.length===1?"":"s"}`}
                  </div>
                </div>
                <div style={{textAlign:"right"}}>
                  <div style={{fontSize:11, color:"var(--navy-500)", marginBottom:2}}>Leads</div>
                  <div style={{fontWeight:600}}>{company.leads.length}</div>
                </div>
                <div style={{textAlign:"right"}}>
                  <div style={{fontSize:11, color:"var(--navy-500)", marginBottom:2}}>Trainees</div>
                  <div style={{fontWeight:600}}>{company.trainees.length}</div>
                </div>
                <div style={{textAlign:"right"}}>
                  <div style={{fontSize:11, color:"var(--navy-500)", marginBottom:2}}>Collected</div>
                  <div className="tnum" style={{color:"var(--green)", fontWeight:500}}>{RD.fmtMoney(revenue)}</div>
                </div>
                <div style={{textAlign:"right"}}>
                  <div style={{fontSize:11, color:"var(--navy-500)", marginBottom:2}}>Outstanding</div>
                  <div className="tnum" style={{color: outstanding > 0 ? "var(--orange-dk)" : "var(--navy-300)", fontWeight:500}}>{RD.fmtMoney(outstanding)}</div>
                </div>
                <Icon name={isOpen ? "chevD" : "chevR"} size={14} style={{color:"var(--navy-300)"}}/>
              </div>

              {isOpen && (
                <div style={{background:"var(--warm-100)", borderTop:"1px solid var(--navy-50)"}}>
                  {company.trainees.length > 0 && (
                    <>
                      <div style={{padding:"10px 20px 6px", fontSize:10, letterSpacing:"0.16em", textTransform:"uppercase", color:"var(--navy-500)", fontWeight:600}}>Trainees</div>
                      {company.trainees.map(t => {
                        const course = RD.getCourse(t.courseId);
                        const rem = t.totalCost - t.paid;
                        return (
                          <div key={t.id} className="panel-row"
                            style={{padding:"10px 28px", cursor:"pointer", borderRadius:0}}
                            onClick={() => openDrawer({ type: "trainee", id: t.id })}>
                            <div style={{flex:1}}>
                              <div className="nm">{t.name} <span style={{fontSize:11, color:"var(--navy-300)", fontWeight:400}}>· {t.id}</span></div>
                              <div className="sub">{course.name}</div>
                            </div>
                            <div className="tnum" style={{fontSize:12, color:"var(--green)", marginRight:16}}>{RD.fmtMoney(t.paid)}</div>
                            {rem > 0 && <div className="tnum" style={{fontSize:12, color:"var(--orange-dk)", marginRight:16}}>–{RD.fmtMoney(rem)}</div>}
                            <Icon name="chevR" size={12} style={{color:"var(--navy-300)"}}/>
                          </div>
                        );
                      })}
                    </>
                  )}

                  {company.leads.length > 0 && (
                    <>
                      <div style={{padding:"10px 20px 6px", fontSize:10, letterSpacing:"0.16em", textTransform:"uppercase", color:"var(--navy-500)", fontWeight:600}}>Active Leads</div>
                      {company.leads.map(l => {
                        const course = RD.getCourse(l.courseId);
                        return (
                          <div key={l.id} className="panel-row"
                            style={{padding:"10px 28px", cursor:"pointer", borderRadius:0}}
                            onClick={() => openDrawer({ type: "lead", id: l.id })}>
                            <div style={{flex:1}}>
                              <div className="nm">{l.name} <span style={{fontSize:11, color:"var(--navy-300)", fontWeight:400}}>· {l.id}</span></div>
                              <div className="sub">{course.name} · {l.status}</div>
                            </div>
                            <Icon name="chevR" size={12} style={{color:"var(--navy-300)"}}/>
                          </div>
                        );
                      })}
                    </>
                  )}

                  {company.trainees.length === 0 && company.leads.length === 0 && (
                    <div style={{padding:"14px 28px", color:"var(--navy-300)", fontSize:13}}>No records</div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
