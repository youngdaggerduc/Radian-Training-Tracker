import { useState, useRef } from 'react';
import { Icon } from './icons';
import * as RD from '../data';
import * as API from '../api';

// ── xlsx helpers ───────────────────────────────────────────────────────────

function toDateISO(val) {
  if (val == null || val === '') return RD.todayISO();
  if (val instanceof Date) {
    const y = val.getFullYear();
    const m = String(val.getMonth() + 1).padStart(2, '0');
    const d = String(val.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }
  if (typeof val === 'string') {
    const s = val.trim();
    if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
    const dm = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
    if (dm) return `${dm[3]}-${dm[2].padStart(2,'0')}-${dm[1].padStart(2,'0')}`;
  }
  if (typeof val === 'number') {
    // Excel serial date (epoch Jan 1 1900 with the 1900 leap year bug = -2 days)
    const d = new Date(Date.UTC(1900, 0, 1) + (val - 2) * 86400 * 1000);
    return d.toISOString().slice(0, 10);
  }
  return RD.todayISO();
}

async function parseFile(file) {
  const XLSX = await import('xlsx');
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const wb   = XLSX.read(e.target.result, { type: 'array', cellDates: true });
        const ws   = wb.Sheets[wb.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json(ws, { defval: '' });
        resolve(rows);
      } catch (err) { reject(err); }
    };
    reader.onerror = () => reject(new Error('Could not read file'));
    reader.readAsArrayBuffer(file);
  });
}

async function downloadTemplate(type) {
  const XLSX    = await import('xlsx');
  const courses = RD.getAllCourses().filter(c => c.active !== false);
  const wb      = XLSX.utils.book_new();

  if (type === 'leads') {
    const ws = XLSX.utils.aoa_to_sheet([
      ['Name', 'Company', 'Phone', 'Email', 'Gender', 'Course ID', 'Source', 'Priority', 'Status', 'Inquiry Date', 'Assigned To', 'Notes'],
      ['John Smith', 'ABC Construction Ltd', '868-555-0100', 'john@abc.com', 'Male', 'cisrs-l1', 'Referral', 'Medium', 'New Interest', '2026-05-21', 'Pierce Doman', 'Interested in Level 1'],
    ]);
    ws['!cols'] = [22, 24, 16, 26, 10, 18, 14, 10, 18, 14, 18, 32].map(w => ({ wch: w }));
    XLSX.utils.book_append_sheet(wb, ws, 'Leads');
  } else {
    const ws = XLSX.utils.aoa_to_sheet([
      ['Name', 'Company', 'Phone', 'Email', 'Gender', 'Course ID', 'Total Cost (TTD)', 'Registration Date', 'Payment Method', 'Amount Paid (TTD)', 'Payment Notes', 'Stage'],
      ['Jane Doe', 'XYZ Construction', '868-555-0200', 'jane@xyz.com', 'Female', 'cisrs-l1', 8437.50, '2026-05-21', 'invoice', 2000, 'First instalment paid', 'initial-payment'],
    ]);
    ws['!cols'] = [22, 24, 16, 26, 10, 18, 16, 18, 16, 16, 26, 16].map(w => ({ wch: w }));
    XLSX.utils.book_append_sheet(wb, ws, 'Trainees');
  }

  // Course reference sheet
  const courseWs = XLSX.utils.aoa_to_sheet([
    ['Course ID', 'Provider', 'Course Name', 'Price (TTD)', 'Days'],
    ...courses.map(c => [c.id, c.provider, c.name, c.price, c.days]),
  ]);
  courseWs['!cols'] = [20, 14, 46, 12, 6].map(w => ({ wch: w }));
  XLSX.utils.book_append_sheet(wb, courseWs, 'Course Reference');

  // Field guide sheet
  const guideRows = type === 'leads' ? [
    ['Column', 'Required', 'Notes / Valid Values'],
    ['Name', 'YES', 'Full name of the lead'],
    ['Company', 'no', 'Company or employer'],
    ['Phone', 'no', 'Format as text to preserve dashes e.g. 868-555-0100'],
    ['Email', 'no', 'Email address'],
    ['Gender', 'no', 'Male / Female / Other — leave blank if not specified'],
    ['Course ID', 'YES', 'Must match a Course ID in the "Course Reference" sheet exactly'],
    ['Source', 'no', 'Referral / Walk-in / Social Media / Website / Phone / Other'],
    ['Priority', 'no', 'High / Medium / Low  — defaults to Medium'],
    ['Status', 'no', 'New Interest / Follow Up Needed / Converted / Not Interested  — defaults to New Interest'],
    ['Inquiry Date', 'YES', 'YYYY-MM-DD  e.g. 2026-05-21'],
    ['Assigned To', 'no', 'Staff member name'],
    ['Notes', 'no', 'Free text — becomes the first note entry on the lead'],
  ] : [
    ['Column', 'Required', 'Notes / Valid Values'],
    ['Name', 'YES', 'Full name of the trainee'],
    ['Company', 'no', 'Company or employer'],
    ['Phone', 'no', 'Format as text to preserve dashes e.g. 868-555-0100'],
    ['Email', 'no', 'Email address'],
    ['Gender', 'no', 'Male / Female / Other — leave blank if not specified'],
    ['Course ID', 'YES', 'Must match a Course ID in the "Course Reference" sheet exactly'],
    ['Total Cost (TTD)', 'YES', 'Full course cost in TTD — must be greater than 0'],
    ['Registration Date', 'YES', 'YYYY-MM-DD  e.g. 2026-05-21'],
    ['Payment Method', 'no', 'cash / invoice / bank transfer'],
    ['Amount Paid (TTD)', 'no', 'Amount already collected — 0 if nothing paid yet'],
    ['Payment Notes', 'no', 'Free text'],
    ['Stage', 'no', 'initial-payment / in-progress / cert-pending / completed  — defaults to initial-payment'],
  ];
  const guideWs = XLSX.utils.aoa_to_sheet(guideRows);
  guideWs['!cols'] = [20, 10, 62].map(w => ({ wch: w }));
  XLSX.utils.book_append_sheet(wb, guideWs, 'Field Guide');

  XLSX.writeFile(wb, `radian_${type}_import_template.xlsx`);
}

// ── Row mapping ────────────────────────────────────────────────────────────

function mapLead(row) {
  return {
    name:        String(row['Name']        || '').trim(),
    company:     String(row['Company']     || '').trim(),
    phone:       String(row['Phone']       || '').trim(),
    email:       String(row['Email']       || '').trim(),
    gender:      String(row['Gender']      || '').trim(),
    courseId:    String(row['Course ID']   || '').trim(),
    source:      String(row['Source']      || '').trim(),
    priority:    String(row['Priority']    || 'Medium').trim(),
    status:      String(row['Status']      || 'New Interest').trim(),
    inquiryDate: toDateISO(row['Inquiry Date']),
    assignedTo:  String(row['Assigned To'] || '').trim(),
    notes:       row['Notes'] ? [{ text: String(row['Notes']).trim(), date: RD.todayISO() }] : [],
    followUps:   [],
  };
}

function mapTrainee(row) {
  return {
    leadId:           'imported',
    name:             String(row['Name']             || '').trim(),
    company:          String(row['Company']          || '').trim(),
    phone:            String(row['Phone']            || '').trim(),
    email:            String(row['Email']            || '').trim(),
    gender:           String(row['Gender']           || '').trim(),
    courseId:         String(row['Course ID']        || '').trim(),
    totalCost:        Number(row['Total Cost (TTD)']) || 0,
    registrationDate: toDateISO(row['Registration Date']),
    paymentMethod:    String(row['Payment Method']   || '').trim(),
    paid:             Number(row['Amount Paid (TTD)']) || 0,
    paymentNotes:     String(row['Payment Notes']    || '').trim(),
    plan:             [],
    notes:            [],
    stage:            String(row['Stage']            || 'initial-payment').trim(),
  };
}

// ── Validation ─────────────────────────────────────────────────────────────

const VALID_PRIORITIES = new Set(['High', 'Medium', 'Low']);
const VALID_STAGES     = new Set(['initial-payment', 'in-progress', 'cert-pending', 'completed', 'cert-ready', 'cert-collected']);

function validateLead(lead) {
  const e = [];
  if (!lead.name)     e.push('Name is required');
  if (!lead.courseId) e.push('Course ID is required');
  else if (!RD.getAllCourses().find(c => c.id === lead.courseId))
    e.push(`Unknown course "${lead.courseId}" — see Course Reference sheet`);
  if (!lead.inquiryDate || !/^\d{4}-\d{2}-\d{2}$/.test(lead.inquiryDate))
    e.push('Inquiry Date must be YYYY-MM-DD');
  if (lead.priority && !VALID_PRIORITIES.has(lead.priority))
    e.push('Priority must be High, Medium, or Low');
  return e;
}

function validateTrainee(trainee) {
  const e = [];
  if (!trainee.name)     e.push('Name is required');
  if (!trainee.courseId) e.push('Course ID is required');
  else if (!RD.getAllCourses().find(c => c.id === trainee.courseId))
    e.push(`Unknown course "${trainee.courseId}" — see Course Reference sheet`);
  if (!trainee.registrationDate || !/^\d{4}-\d{2}-\d{2}$/.test(trainee.registrationDate))
    e.push('Registration Date must be YYYY-MM-DD');
  if (!trainee.totalCost || trainee.totalCost <= 0)
    e.push('Total Cost (TTD) must be greater than 0');
  if (trainee.stage && !VALID_STAGES.has(trainee.stage))
    e.push(`Unknown stage "${trainee.stage}"`);
  return e;
}

// ── Drop zone ──────────────────────────────────────────────────────────────

function DropZone({ onFile }) {
  const [dragging, setDragging] = useState(false);
  const ref = useRef();
  return (
    <div
      className={`import-drop${dragging ? ' drag-over' : ''}`}
      onDragOver={e => { e.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={e => { e.preventDefault(); setDragging(false); if (e.dataTransfer.files[0]) onFile(e.dataTransfer.files[0]); }}
      onClick={() => ref.current.click()}
    >
      <Icon name="upload" size={30} style={{ color: 'var(--navy-300)' }}/>
      <div style={{ marginTop: 12, fontSize: 13, color: 'var(--navy-600)' }}>
        Drop your Excel file here, or{' '}
        <span style={{ color: 'var(--orange)', fontWeight: 600 }}>browse</span>
      </div>
      <div style={{ marginTop: 5, fontSize: 11, color: 'var(--muted)' }}>.xlsx or .csv accepted</div>
      <input ref={ref} type="file" accept=".xlsx,.xls,.csv" style={{ display: 'none' }}
        onChange={e => { if (e.target.files[0]) onFile(e.target.files[0]); e.target.value = ''; }}/>
    </div>
  );
}

// ── Import section ─────────────────────────────────────────────────────────

function ImportSection({ type, onImported }) {
  const isLead = type === 'leads';
  const [fileName, setFileName]   = useState('');
  const [rows, setRows]           = useState(null);
  const [rowErrors, setRowErrors] = useState([]);
  const [importing, setImporting] = useState(false);
  const [progress, setProgress]   = useState({ done: 0, total: 0 });
  const [result, setResult]       = useState(null);

  const handleFile = async (file) => {
    setResult(null); setRows(null); setFileName(file.name);
    try {
      const raw    = await parseFile(file);
      const mapped = raw.map(isLead ? mapLead : mapTrainee);
      setRows(mapped);
      setRowErrors(mapped.map(isLead ? validateLead : validateTrainee));
    } catch (err) {
      setFileName('');
      alert('Could not read file: ' + err.message);
    }
  };

  const handleImport = async () => {
    const validRows = rows.filter((_, i) => rowErrors[i].length === 0);
    setImporting(true);
    setProgress({ done: 0, total: validRows.length });
    let done = 0, failed = 0;
    const failedNames = [];
    for (const row of validRows) {
      try {
        if (isLead) await API.createLead(row);
        else        await API.createTrainee(row);
        done++;
      } catch {
        failed++;
        failedNames.push(row.name || '?');
      }
      setProgress(p => ({ done: p.done + 1, total: p.total }));
    }
    setImporting(false);
    setResult({ done, failed, failedNames });
    if (done > 0) onImported();
  };

  const reset = () => { setFileName(''); setRows(null); setRowErrors([]); setResult(null); };

  const validCount = rows ? rows.filter((_, i) => rowErrors[i].length === 0).length : 0;
  const errorCount = rows ? rows.filter((_, i) => rowErrors[i].length > 0).length  : 0;

  return (
    <div style={{ background: 'var(--paper)', border: '1px solid var(--navy-100)', borderRadius: 'var(--radius-lg)', overflow: 'visible' }}>

      {/* Navy panel header — matches exports page design */}
      <div style={{
        background: 'var(--navy-800)',
        borderRadius: 'var(--radius-lg) var(--radius-lg) 0 0',
        borderBottom: '2px solid var(--orange)',
        padding: '18px 22px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
      }}>
        <div>
          <div style={{ fontSize: 10, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--orange)', marginBottom: 5, fontWeight: 600 }}>
            Bulk Import
          </div>
          <h3 style={{ color: 'var(--ivory)', fontSize: 19, margin: 0, fontFamily: 'var(--serif)', fontWeight: 500 }}>
            {isLead ? 'Training Leads' : 'Trainees'}
          </h3>
        </div>
        <button
          onClick={() => downloadTemplate(type)}
          style={{
            display: 'flex', alignItems: 'center', gap: 7,
            padding: '8px 14px', borderRadius: 'var(--radius)',
            background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)',
            color: 'var(--ivory)', fontSize: 12, cursor: 'pointer', fontWeight: 500,
            transition: 'background 0.15s',
            flexShrink: 0,
          }}
          onMouseOver={e => e.currentTarget.style.background = 'rgba(255,255,255,0.18)'}
          onMouseOut={e => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
        >
          <Icon name="download" size={13}/>
          Download Template
        </button>
      </div>

      <div style={{ padding: '20px 22px 24px' }}>
        <p style={{ fontSize: 13, color: 'var(--navy-500)', margin: '0 0 18px', lineHeight: 1.55 }}>
          {isLead
            ? 'Import enquiries and pipeline leads from a filled template. Rows with errors are skipped.'
            : 'Import existing registered trainees. Payment plans can be set up in the app after import.'}
        </p>

        {/* Drop zone */}
        {!rows && !result && <DropZone onFile={handleFile}/>}

        {/* Preview */}
        {rows && !result && (
          <>
            {/* File info bar */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14,
              padding: '8px 12px', background: 'var(--bg)', borderRadius: 'var(--radius)',
              fontSize: 12, border: '1px solid var(--navy-100)',
            }}>
              <Icon name="file" size={13} style={{ color: 'var(--orange)', flexShrink: 0 }}/>
              <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: 'var(--navy-700)' }}>
                {fileName}
              </span>
              {validCount > 0 && <span style={{ color: 'var(--green)', fontWeight: 600, flexShrink: 0 }}>{validCount} ready</span>}
              {errorCount > 0 && <span style={{ color: 'var(--red)',   fontWeight: 600, flexShrink: 0 }}>{errorCount} error{errorCount !== 1 ? 's' : ''}</span>}
              <button onClick={reset} style={{ background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', fontSize: 12, padding: '0 4px', flexShrink: 0 }}>
                Change
              </button>
            </div>

            {/* Preview table */}
            <div style={{ overflowX: 'auto' }}>
              <table className="tbl">
                <thead>
                  <tr>
                    <th style={{ width: 32 }}>#</th>
                    <th>Name</th>
                    <th>Company</th>
                    <th>Course</th>
                    <th>{isLead ? 'Inquiry Date' : 'Reg. Date'}</th>
                    {!isLead && <th>Cost</th>}
                    <th style={{ width: 70 }}></th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row, i) => {
                    const errs   = rowErrors[i];
                    const ok     = errs.length === 0;
                    const course = RD.getAllCourses().find(c => c.id === row.courseId);
                    return (
                      <tr key={i} style={{ background: ok ? '' : 'rgba(220,38,38,0.04)' }}>
                        <td style={{ color: 'var(--muted)', fontSize: 11 }}>{i + 1}</td>
                        <td style={{ fontWeight: 500 }}>
                          {row.name || <em style={{ color: 'var(--red)', fontWeight: 400 }}>missing</em>}
                        </td>
                        <td style={{ color: 'var(--muted)', fontSize: 12 }}>{row.company || '—'}</td>
                        <td style={{ fontSize: 12 }}>
                          {course
                            ? <span title={course.name}>{course.name.length > 26 ? course.name.slice(0,24)+'…' : course.name}</span>
                            : <span style={{ color: 'var(--red)' }}>{row.courseId || <em>missing</em>}</span>}
                        </td>
                        <td style={{ fontSize: 12 }}>
                          {RD.fmtDate(isLead ? row.inquiryDate : row.registrationDate)}
                        </td>
                        {!isLead && <td style={{ fontSize: 12 }}>{RD.fmtMoney(row.totalCost)}</td>}
                        <td>
                          {ok
                            ? <span className="pill active"  style={{ fontSize: 10, padding: '2px 8px' }}>Ready</span>
                            : <span className="pill overdue" style={{ fontSize: 10, padding: '2px 8px', cursor: 'help' }} title={errs.join('\n')}>Error</span>}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Error list */}
            {errorCount > 0 && (
              <div style={{ marginTop: 12, padding: '10px 14px', background: 'rgba(220,38,38,0.06)', borderRadius: 'var(--radius)', borderLeft: '3px solid var(--red)', fontSize: 12, color: 'var(--red)' }}>
                {rows.map((row, i) => rowErrors[i].length > 0 ? (
                  <div key={i} style={{ marginBottom: 3 }}>
                    <strong>Row {i + 1}{row.name ? ` — ${row.name}` : ''}:</strong> {rowErrors[i].join('; ')}
                  </div>
                ) : null)}
              </div>
            )}

            {importing && (
              <div style={{ marginTop: 12, fontSize: 13, color: 'var(--muted)' }}>
                Importing {progress.done} / {progress.total}…
              </div>
            )}

            <div style={{ marginTop: 16, display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
              <button className="btn btn-orange" disabled={validCount === 0 || importing} onClick={handleImport}>
                <Icon name="upload" size={14}/>
                Import {validCount} {isLead ? `Lead${validCount !== 1 ? 's' : ''}` : `Trainee${validCount !== 1 ? 's' : ''}`}
              </button>
              {errorCount > 0 && (
                <span style={{ fontSize: 12, color: 'var(--muted)' }}>
                  {errorCount} row{errorCount !== 1 ? 's' : ''} with errors will be skipped
                </span>
              )}
            </div>
          </>
        )}

        {/* Result */}
        {result && (
          <div style={{ padding: '28px 0', textAlign: 'center' }}>
            <div style={{
              width: 54, height: 54, borderRadius: '50%', margin: '0 auto 14px',
              background: result.done > 0 ? 'rgba(22,163,74,0.1)' : 'rgba(220,38,38,0.1)',
              color: result.done > 0 ? 'var(--green)' : 'var(--red)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Icon name={result.done > 0 ? 'check' : 'warn'} size={24}/>
            </div>
            <div style={{ fontWeight: 600, fontSize: 15, color: 'var(--navy-900)', marginBottom: 6 }}>
              {result.done > 0
                ? `${result.done} ${isLead ? 'lead' : 'trainee'}${result.done !== 1 ? 's' : ''} imported successfully`
                : 'Import failed — no records were saved'}
            </div>
            {result.failed > 0 && (
              <div style={{ fontSize: 12, color: 'var(--red)', marginBottom: 4 }}>
                {result.failed} failed: {result.failedNames.join(', ')}
              </div>
            )}
            <button className="btn btn-outline" style={{ marginTop: 14 }} onClick={reset}>
              Import more
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────

export function ImportView({ onImported }) {
  return (
    <div>
      <div className="page-header">
        <div>
          <div className="eyebrow">Management · Admin</div>
          <h1>Import Data</h1>
        </div>
      </div>
      <p style={{ fontSize: 14, color: 'var(--navy-500)', margin: '-8px 0 28px', lineHeight: 1.6, maxWidth: 580 }}>
        Download a template, fill it with existing records, and upload to import in bulk.
        Each template includes a <strong>Course Reference</strong> sheet with valid IDs and a <strong>Field Guide</strong> explaining every column.
      </p>
      <div className="two-col">
        <ImportSection type="leads"    onImported={onImported}/>
        <ImportSection type="trainees" onImported={onImported}/>
      </div>
    </div>
  );
}
