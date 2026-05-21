// ============== COURSES (fixed catalog — no add) ==============
export const COURSES = [
  { id: "cisrs-l1", provider: "CISRS", name: "CISRS OSTS Scaffolder Level 1", price: 8437.50, days: 5 },
  { id: "cisrs-l2a", provider: "CISRS", name: "CISRS OSTS Scaffolder Level 2", price: 8437.50, days: 5 },
  { id: "cisrs-l2b", provider: "CISRS", name: "CISRS OSTS Scaffolder Level 2 (Advanced Cohort)", price: 9000.00, days: 5 },
  { id: "cisrs-basic-insp", provider: "CISRS", name: "CISRS OSTS Basic Scaffolder Inspection", price: 6750.00, days: 3 },
  { id: "cisrs-adv-insp", provider: "CISRS", name: "CISRS OSTS Advanced Scaffolder Inspection", price: 6500.00, days: 2 },
  { id: "cisrs-supv", provider: "CISRS", name: "CISRS OSTS Scaffolder Supervisor", price: 7875.00, days: 3 },
  { id: "gms-wah", provider: "GetmieSafe", name: "Getmie Safe Working at Height", price: 675.00, days: 1 },
  { id: "gms-basic-r", provider: "GetmieSafe", name: "Basic GetmieSafe Rescue Training", price: 1687.50, days: 1 },
  { id: "gms-adv-r", provider: "GetmieSafe", name: "Advanced GetmieSafe Rescue Training", price: 3375.00, days: 2 },
  { id: "gms-refresh", provider: "GetmieSafe", name: "GetmieSafe Rescue Refresher", price: 1687.50, days: 1 },
];

export const STAFF = [
  { id: "s1", name: "Pierce Doman",        initials: "PD" },
  { id: "s2", name: "Shanice Rattan",      initials: "SR" },
  { id: "s3", name: "Kelsey Ramkhelawan",  initials: "KR" },
  { id: "s4", name: "Ameer Mohammed",      initials: "AM" },
];

export const INSTRUCTORS = [
  { id: "i1", name: "Lloyd Bissessar" },
  { id: "i2", name: "Marcus Henderson" },
  { id: "i3", name: "Karima Edwards" },
];

export const LOCATIONS = [
  "Radian Training Yard — Couva",
  "Radian Training Yard — Point Lisas",
  "Client Site (Mobile Delivery)",
];

// ============== Date helpers ==============
export function todayISO(offset = 0) {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  return d.toISOString().slice(0, 10);
}
export function fmtDate(iso) {
  if (!iso) return "—";
  const d = new Date(iso + (iso.length === 10 ? "T00:00:00" : ""));
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}
export function fmtDateShort(iso) {
  if (!iso) return "—";
  const d = new Date(iso + (iso.length === 10 ? "T00:00:00" : ""));
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short" });
}
export function fmtMoney(n) {
  if (n == null || isNaN(n)) return "$0.00";
  return "$" + Number(n).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
export function daysBetween(a, b) {
  const d1 = new Date(a + "T00:00:00");
  const d2 = new Date(b + "T00:00:00");
  return Math.round((d2 - d1) / (1000 * 60 * 60 * 24));
}
export function daysUntil(iso) {
  return daysBetween(todayISO(), iso);
}
export function relTime(iso) {
  const d = daysUntil(iso);
  if (d === 0) return "Today";
  if (d === 1) return "Tomorrow";
  if (d === -1) return "Yesterday";
  if (d > 1 && d <= 30) return `in ${d} days`;
  if (d < -1 && d >= -30) return `${Math.abs(d)} days ago`;
  return fmtDate(iso);
}

// ============== SEED DATA ==============
export function buildSeed() {
  const leads = [
    {
      id: "L-1041", name: "Jevon Marcano", company: "BPTT", phone: "+1-868-732-4051", email: "jmarcano@bptt-eng.com",
      courseId: "cisrs-l1", source: "Website", priority: "High", status: "Interested",
      inquiryDate: todayISO(-3), assignedTo: "s1",
      notes: [
        { date: todayISO(-3), by: "s1", text: "Inquired about Level 1 — has 6 months yard experience. Wants June batch." },
        { date: todayISO(-1), by: "s1", text: "Confirmed budget approval from BPTT. Awaiting purchase order." },
      ],
      followUps: [
        { id: "F1", date: todayISO(1), time: "10:00", method: "Call", notes: "PO confirmation call", outcome: "" },
      ],
    },
    {
      id: "L-1042", name: "Ronaldo Persad", company: "Massy Energy", phone: "+1-868-680-2231", email: "rpersad@massy.tt",
      courseId: "cisrs-supv", source: "Referral", priority: "High", status: "Contacted",
      inquiryDate: todayISO(-5), assignedTo: "s2",
      notes: [
        { date: todayISO(-5), by: "s2", text: "Referred by L. Bissessar. Holds Level 2, needs supervisor cert." },
      ],
      followUps: [
        { id: "F2", date: todayISO(-1), time: "14:00", method: "WhatsApp", notes: "Send course outline + dates", outcome: "" },
      ],
    },
    {
      id: "L-1043", name: "Anisa Mohammed", company: "", phone: "+1-868-471-0089", email: "anisa.m@gmail.com",
      courseId: "gms-wah", source: "WhatsApp", priority: "Medium", status: "New Interest",
      inquiryDate: todayISO(-1), assignedTo: "s1",
      notes: [], followUps: [],
    },
    {
      id: "L-1044", name: "Kareem Joseph", company: "Atlantic LNG", phone: "+1-868-322-7766", email: "kjoseph@atlanticlng.com",
      courseId: "cisrs-adv-insp", source: "Phone", priority: "Medium", status: "Follow Up Needed",
      inquiryDate: todayISO(-10), assignedTo: "s3",
      notes: [
        { date: todayISO(-10), by: "s3", text: "Wants to confirm dates after site rotation ends." },
      ],
      followUps: [
        { id: "F3", date: todayISO(-2), time: "09:30", method: "Call", notes: "Rotation schedule check", outcome: "" },
      ],
    },
    {
      id: "L-1045", name: "Shanice Williams", company: "Trinity Exploration", phone: "+1-868-298-1145", email: "swilliams@trinity-exp.com",
      courseId: "gms-adv-r", source: "Website", priority: "Low", status: "New Interest",
      inquiryDate: todayISO(0), assignedTo: "s2",
      notes: [], followUps: [],
    },
    {
      id: "L-1046", name: "Devon Bachan", company: "NGC", phone: "+1-868-455-2009", email: "dbachan@ngc.co.tt",
      courseId: "cisrs-l2a", source: "Walk-in", priority: "High", status: "Interested",
      inquiryDate: todayISO(-2), assignedTo: "s1",
      notes: [
        { date: todayISO(-2), by: "s1", text: "Walked in with team manager. Possibly enrolling 3 staff." },
      ],
      followUps: [],
    },
  ];

  const trainees = [
    {
      id: "T-2008", leadId: "L-1040", name: "John Smith", company: "BHP Trinidad", phone: "+1-868-721-9912", email: "jsmith@bhp.com",
      courseId: "cisrs-l1", totalCost: 8437.50,
      registrationDate: todayISO(-22),
      paymentMethod: "Bank Transfer",
      paid: 4218.75,
      plan: [
        { id: "P1", amount: 4218.75, due: todayISO(-22), paid: true, paidOn: todayISO(-22), method: "Bank Transfer", ref: "BT-228841" },
        { id: "P2", amount: 4218.75, due: todayISO(1), paid: false, method: "", ref: "" },
      ],
      paymentNotes: "Deposit confirmed. Final payment due before enrollment.",
      enrollment: null,
      certificate: null,
      stage: "payment-plan",
    },
    {
      id: "T-2009", leadId: "L-1039", name: "Sarah Williams", company: "Heritage Petroleum", phone: "+1-868-689-5510", email: "swilliams@heritage-pet.com",
      courseId: "cisrs-supv", totalCost: 7875.00,
      registrationDate: todayISO(-18),
      paymentMethod: "Company Credit",
      paid: 3000.00,
      plan: [
        { id: "P1", amount: 3000.00, due: todayISO(-18), paid: true, paidOn: todayISO(-18), method: "Company Credit", ref: "INV-7741" },
        { id: "P2", amount: 2437.50, due: todayISO(-4), paid: false, method: "", ref: "" },
        { id: "P3", amount: 2437.50, due: todayISO(10), paid: false, method: "", ref: "" },
      ],
      paymentNotes: "PO# H-2206 issued; client AP delay flagged.",
      enrollment: null,
      certificate: null,
      stage: "payment-plan",
    },
    {
      id: "T-2010", leadId: "L-1037", name: "Marlon Cuffy", company: "Shell Trinidad", phone: "+1-868-712-3318", email: "mcuffy@shell.com",
      courseId: "cisrs-basic-insp", totalCost: 6750.00,
      registrationDate: todayISO(-30),
      paymentMethod: "Bank Transfer",
      paid: 6750.00,
      plan: [
        { id: "P1", amount: 6750.00, due: todayISO(-30), paid: true, paidOn: todayISO(-30), method: "Bank Transfer", ref: "BT-228812" },
      ],
      paymentNotes: "",
      enrollment: {
        startDate: todayISO(5), endDate: todayISO(7), instructor: "i1",
        location: "Radian Training Yard — Couva", batch: "CISRS-INS-26-04", status: "Enrolled",
        enrollmentDate: todayISO(-10),
      },
      certificate: null,
      stage: "enrolled",
    },
    {
      id: "T-2011", leadId: "L-1036", name: "Tina Ramnarine", company: "Phoenix Park Gas", phone: "+1-868-432-5567", email: "tramnarine@ppgpl.com",
      courseId: "gms-wah", totalCost: 675.00,
      registrationDate: todayISO(-15),
      paymentMethod: "Card",
      paid: 675.00,
      plan: [
        { id: "P1", amount: 675.00, due: todayISO(-15), paid: true, paidOn: todayISO(-15), method: "Card", ref: "VISA-...4421" },
      ],
      paymentNotes: "",
      enrollment: {
        startDate: todayISO(-2), endDate: todayISO(-2), instructor: "i3",
        location: "Radian Training Yard — Point Lisas", batch: "GMS-WAH-26-11", status: "Attending",
        enrollmentDate: todayISO(-8),
      },
      certificate: null,
      stage: "enrolled",
    },
    {
      id: "T-2007", leadId: "L-1031", name: "Hassan Ali", company: "Atlantic LNG", phone: "+1-868-655-2010", email: "hali@atlanticlng.com",
      courseId: "cisrs-l1", totalCost: 8437.50,
      registrationDate: todayISO(-45),
      paymentMethod: "Bank Transfer",
      paid: 8437.50,
      plan: [
        { id: "P1", amount: 8437.50, due: todayISO(-45), paid: true, paidOn: todayISO(-45), method: "Bank Transfer", ref: "BT-228701" },
      ],
      paymentNotes: "",
      enrollment: {
        startDate: todayISO(-12), endDate: todayISO(-8), instructor: "i2",
        location: "Radian Training Yard — Couva", batch: "CISRS-L1-26-03", status: "Completed",
        enrollmentDate: todayISO(-30),
      },
      certificate: {
        completionDate: todayISO(-8), number: "CISRS/L1/26/00141",
        status: "Ready for Collection", readyOn: todayISO(-3),
        collectionDate: null, collectedBy: "", idVerified: false, staffNotes: "",
      },
      stage: "cert-ready",
    },
    {
      id: "T-2006", leadId: "L-1028", name: "Renee Boodram", company: "Massy Energy", phone: "+1-868-789-3322", email: "rboodram@massy.tt",
      courseId: "cisrs-l2a", totalCost: 8437.50,
      registrationDate: todayISO(-60),
      paymentMethod: "Company Credit",
      paid: 8437.50,
      plan: [
        { id: "P1", amount: 8437.50, due: todayISO(-60), paid: true, paidOn: todayISO(-58), method: "Company Credit", ref: "INV-7689" },
      ],
      paymentNotes: "",
      enrollment: {
        startDate: todayISO(-25), endDate: todayISO(-21), instructor: "i1",
        location: "Radian Training Yard — Couva", batch: "CISRS-L2-26-02", status: "Completed",
        enrollmentDate: todayISO(-50),
      },
      certificate: {
        completionDate: todayISO(-21), number: "CISRS/L2/26/00098",
        status: "Collected", readyOn: todayISO(-18),
        collectionDate: todayISO(-12), collectedBy: "Renee Boodram", idVerified: true,
        staffNotes: "Drivers permit verified, signed for in pickup log.",
      },
      stage: "cert-collected",
    },
    {
      id: "T-2012", leadId: "L-1038", name: "Adrian Lewis", company: "", phone: "+1-868-411-5598", email: "adrian.lewis@yahoo.com",
      courseId: "gms-basic-r", totalCost: 1687.50,
      registrationDate: todayISO(-8),
      paymentMethod: "Cash",
      paid: 1687.50,
      plan: [
        { id: "P1", amount: 1687.50, due: todayISO(-8), paid: true, paidOn: todayISO(-8), method: "Cash", ref: "RCT-0091" },
      ],
      paymentNotes: "",
      enrollment: null,
      certificate: null,
      stage: "payment-complete",
    },
  ];

  return { leads, trainees };
}

// ============== STATE STORE ==============
const STORAGE_KEY = "radian_training_v1";

export function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (e) { return null; }
}
export function saveState(state) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch (e) {}
}
export function resetState() {
  localStorage.removeItem(STORAGE_KEY);
}

export const PIPELINE_STAGES = [
  { id: "new", label: "New Interest" },
  { id: "contacted", label: "Contacted" },
  { id: "followup", label: "Follow-up Scheduled" },
  { id: "interested", label: "Interested" },
  { id: "initial-payment", label: "Initial Payment" },
  { id: "payment-plan", label: "Payment Plan Active" },
  { id: "enrolled", label: "Enrolled" },
  { id: "payment-complete", label: "Payment Complete" },
  { id: "training-completed", label: "Training Completed" },
  { id: "cert-ready", label: "Certificate Ready" },
  { id: "cert-collected", label: "Certificate Collected" },
];

export function leadStage(lead) {
  if (lead.status === "New Interest") return "new";
  if (lead.status === "Contacted") return "contacted";
  if (lead.status === "Follow Up Needed") return "followup";
  if (lead.status === "Interested") return "interested";
  return "new";
}

export function traineeStage(t) {
  if (t.stage) return t.stage;
  if (t.certificate?.status === "Collected") return "cert-collected";
  if (t.certificate?.status === "Ready for Collection") return "cert-ready";
  if (t.enrollment?.status === "Completed") return "training-completed";
  if (t.enrollment) return "enrolled";
  if (t.paid >= t.totalCost) return "payment-complete";
  if (t.plan.length > 1) return "payment-plan";
  return "initial-payment";
}

// Dynamic course list — updated from API at login, falls back to hardcoded COURSES
let _courses = COURSES;
export function setCourses(list) { if (list && list.length) _courses = list; }
export function getAllCourses()  { return _courses; }
export function getCourse(id)    { return _courses.find(c => c.id === id) || { name: "—", price: 0, days: 0, provider: "" }; }

export function getStaff(id)      { return STAFF.find(s => s.id === id) || { name: "—", initials: "?" }; }
export function getInstructor(id) { return INSTRUCTORS.find(i => i.id === id) || { name: "—" }; }
