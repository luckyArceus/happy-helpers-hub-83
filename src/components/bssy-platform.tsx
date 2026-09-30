import {
  Activity,
  AlertTriangle,
  ArrowLeft,
  BarChart3,
  Bell,
  Building2,
  Check,
  ChevronDown,
  ChevronRight,
  CircleDollarSign,
  ClipboardCheck,
  FileClock,
  FileText,
  Filter,
  IndianRupee,
  Languages,
  LayoutDashboard,
  Lightbulb,
  ListChecks,
  Map,
  MapPin,
  Menu,
  MessageSquareWarning,
  Network,
  QrCode,
  RefreshCcw,
  Search,
  ShieldCheck,
  Sparkles,
  UserRound,
  Users,
  WalletCards,
  WifiOff,
  X,
  type LucideIcon,
} from "lucide-react";
import { useMemo, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";

type PageId =
  | "dashboard" | "work-orders" | "sansthas" | "workers" | "attendance" | "evidence"
  | "qr" | "grievances" | "ward-performance" | "grant" | "finance" | "gis"
  | "analytics" | "recommendations" | "workflow" | "notifications" | "audit"
  | "integrations" | "implementation";

type Status = "Draft" | "Assigned" | "In Progress" | "Submitted" | "Pending Verification" | "Verified" | "Returned for Correction" | "Needs Attention" | "Exception" | "Resolved" | "Closed" | "Not connected in demo";

const navGroups: { label?: string; items: { id: PageId; label: string; icon: LucideIcon }[] }[] = [
  { items: [{ id: "dashboard", label: "Command Dashboard", icon: LayoutDashboard }] },
  { label: "Operations", items: [
    { id: "work-orders", label: "Work Orders", icon: ClipboardCheck },
    { id: "sansthas", label: "Sansthas", icon: Building2 },
    { id: "workers", label: "Workers", icon: Users },
    { id: "attendance", label: "Attendance & Geo-monitoring", icon: MapPin },
    { id: "evidence", label: "Evidence & Verification", icon: FileClock },
  ] },
  { label: "Citizen Services", items: [
    { id: "qr", label: "QR Grievances", icon: QrCode },
    { id: "grievances", label: "Grievance Register", icon: MessageSquareWarning },
  ] },
  { label: "Performance & Finance", items: [
    { id: "ward-performance", label: "Ward Performance", icon: BarChart3 },
    { id: "grant", label: "Grant Recommendation", icon: IndianRupee },
    { id: "finance", label: "Financial Workflow", icon: WalletCards },
  ] },
  { label: "Insights", items: [
    { id: "gis", label: "GIS Overview", icon: Map },
    { id: "analytics", label: "MIS & Analytics", icon: Activity },
    { id: "recommendations", label: "Illustrative AI Recommendations", icon: Sparkles },
  ] },
  { label: "Governance", items: [
    { id: "workflow", label: "Workflow & Compliance", icon: ListChecks },
    { id: "notifications", label: "Notifications", icon: Bell },
    { id: "audit", label: "Audit Trail", icon: FileText },
    { id: "integrations", label: "Integrations", icon: Network },
    { id: "implementation", label: "Implementation Status", icon: ShieldCheck },
  ] },
];

const workOrders = [
  { id: "WO-BSSY-24018", activity: "Public area cleanliness activity", ward: "Demo Ward 04", beat: "Beat B-04C", sanstha: "Sanstha Prerna (Demo)", date: "Today — Demo", workers: 3, status: "In Progress" as Status, evidence: "Pending Verification" as Status },
  { id: "WO-BSSY-24021", activity: "Community lane cleaning", ward: "Demo Ward 07", beat: "Beat B-07A", sanstha: "Sanstha Udaan (Demo)", date: "Today — Demo", workers: 4, status: "Assigned" as Status, evidence: "Draft" as Status },
  { id: "WO-BSSY-24023", activity: "Market vicinity cleanliness", ward: "Demo Ward 11", beat: "Beat B-11D", sanstha: "Sanstha Sakhi (Demo)", date: "Yesterday — Demo", workers: 5, status: "Verified" as Status, evidence: "Verified" as Status },
  { id: "WO-BSSY-24027", activity: "Public access route cleaning", ward: "Demo Ward 04", beat: "Beat B-04F", sanstha: "Sanstha Prerna (Demo)", date: "Today — Demo", workers: 2, status: "Submitted" as Status, evidence: "Needs Attention" as Status },
];

const workers = [
  { id: "W-301", name: "Asha (Demo)", attendance: "Present", geo: "Inside demo zone", assignment: "WO-BSSY-24018" },
  { id: "W-302", name: "Ravi (Demo)", attendance: "Present", geo: "Location not captured", assignment: "WO-BSSY-24018" },
  { id: "W-303", name: "Meera (Demo)", attendance: "Pending", geo: "Location not captured", assignment: "WO-BSSY-24018" },
];

const roles = ["BMC Administrator", "Ward Officer / Supervisor", "Sanstha Coordinator", "Field Worker", "Accounts Officer", "Citizen"];

const journey = [
  ["work-orders", "Open work order"], ["sansthas", "Inspect Sanstha"], ["attendance", "Review attendance"],
  ["evidence", "Verify evidence"], ["grievances", "Resolve grievance"], ["ward-performance", "View performance"],
  ["grant", "Review recommendation"], ["dashboard", "Return to dashboard"],
] as [PageId, string][];

const pageMeta: Record<PageId, [string, string]> = {
  dashboard: ["BSSY Command Dashboard", "Illustrative operational view • Synthetic demo data"],
  "work-orders": ["Work Orders", "Plan, assign, and follow synthetic cleanliness activities"],
  sansthas: ["Sanstha Register", "Synthetic participating organisation view"],
  workers: ["Worker Register", "Fictional worker assignments with no personal data"],
  attendance: ["Attendance & Geo-monitoring", "Simulated daily attendance and location indicators"],
  evidence: ["Evidence & Verification", "Review synthetic evidence packages and record a demo decision"],
  qr: ["Citizen QR Grievance", "Demo intake and status lookup — no personal information is stored"],
  grievances: ["Grievance Register", "Track synthetic issues from intake to closure"],
  "ward-performance": ["Ward Performance", "Illustrative comparisons only — not an official assessment"],
  grant: ["Grant Recommendation", "Transparent illustrative review; no payment is initiated or authorised"],
  finance: ["Financial Workflow", "Workflow preview only — no funds or payments are processed"],
  gis: ["GIS Overview", "Illustrative only — no official BMC boundaries or live GIS"],
  analytics: ["MIS & Analytics", "Filterable synthetic operational summaries"],
  recommendations: ["Illustrative AI Recommendations", "No AI service connected; human review required"],
  workflow: ["Workflow & Compliance", "Illustrative workflow configuration and implementation considerations"],
  notifications: ["Notifications", "Demo notifications — no SMS, email, or push service connected"],
  audit: ["Audit Trail", "Illustrative read-only event log; not a production audit capability"],
  integrations: ["Integrations", "Connection placeholders only — no live systems are connected"],
  implementation: ["Implementation Status", "Illustrative planning view — not an official delivery status"],
};

function Button({ children, variant = "primary", className, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "secondary" | "ghost" | "danger" }) {
  return <button className={cn("inline-flex min-h-9 items-center justify-center gap-2 rounded-md px-3.5 text-sm font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:opacity-50", variant === "primary" && "bg-primary text-primary-foreground hover:bg-primary/90", variant === "secondary" && "border border-border bg-card text-foreground hover:bg-muted", variant === "ghost" && "text-muted-foreground hover:bg-muted hover:text-foreground", variant === "danger" && "bg-destructive text-destructive-foreground hover:bg-destructive/90", className)} {...props}>{children}</button>;
}

function StatusChip({ status }: { status: Status | string }) {
  const tone = status === "Verified" || status === "Resolved" || status === "Closed" || status === "Complete" || status === "Present" ? "success" : status === "Exception" ? "critical" : status === "Returned for Correction" ? "terracotta" : status.includes("Pending") || status.includes("Attention") || status === "In progress" ? "attention" : status === "Assigned" || status === "In Progress" || status === "Submitted" ? "blue" : "neutral";
  return <span className={cn("inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border px-2 py-0.5 text-xs font-semibold", `chip-${tone}`)}><span className="h-1.5 w-1.5 rounded-full bg-current" />{status}</span>;
}

function Card({ children, className }: { children: ReactNode; className?: string }) {
  return <section className={cn("rounded-lg border border-border bg-card shadow-civic", className)}>{children}</section>;
}

function SectionHeader({ title, aside }: { title: string; aside?: ReactNode }) {
  return <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 border-b border-border px-5 py-4"><h2 className="truncate font-display text-base font-bold text-foreground">{title}</h2>{aside}</div>;
}

function DemoMap({ onOpen }: { onOpen?: () => void }) {
  return <div className="relative h-64 overflow-hidden rounded-md border border-border bg-map" aria-label="Illustrative map schematic">
    <div className="absolute inset-0 map-grid" />
    <div className="absolute left-[10%] top-[15%] h-[48%] w-[34%] rotate-[-4deg] rounded-[35%_20%_30%_20%] border-2 border-dashed border-primary/30 bg-card/35" />
    <div className="absolute bottom-[12%] right-[10%] h-[52%] w-[38%] rotate-[8deg] rounded-[25%_40%_20%_35%] border-2 border-dashed border-accent/50 bg-card/35" />
    {[["04", "28%", "38%"], ["07", "64%", "31%"], ["11", "73%", "68%"]].map(([label,left,top]) => <button key={label} onClick={onOpen} className="absolute grid h-9 w-9 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border-4 border-card bg-primary text-xs font-bold text-primary-foreground shadow" style={{ left, top }} aria-label={`Open Demo Ward ${label}`}>{label}</button>)}
    <span className="absolute bottom-3 left-3 rounded bg-civic px-2 py-1 text-[11px] font-semibold text-civic-foreground">ILLUSTRATIVE • NO LIVE GIS</span>
  </div>;
}

function MetricCard({ label, value, detail, onClick }: { label: string; value: string; detail: string; onClick: () => void }) {
  return <button onClick={onClick} className="min-w-0 rounded-lg border border-border bg-card p-4 text-left shadow-civic transition hover:border-primary/40 hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-primary"><span className="block text-xs font-semibold uppercase text-muted-foreground">{label}</span><span className="mt-2 block font-display text-2xl font-bold text-foreground">{value}</span><span className="mt-1 block truncate text-xs text-muted-foreground">{detail}</span></button>;
}

function DataTable({ headers, rows, onRow }: { headers: string[]; rows: (ReactNode | string | number)[][]; onRow?: (index: number) => void }) {
  return <div className="overflow-x-auto"><table className="w-full min-w-[720px] text-left text-sm"><thead><tr className="border-b border-border bg-muted/60">{headers.map(h => <th key={h} className="px-4 py-3 text-xs font-semibold uppercase text-muted-foreground">{h}</th>)}</tr></thead><tbody>{rows.map((row,i) => <tr key={i} onClick={() => onRow?.(i)} className={cn("border-b border-border/70 last:border-0", onRow && "cursor-pointer hover:bg-muted/50")}>{row.map((cell,j) => <td key={j} className="px-4 py-3 text-foreground">{cell}</td>)}</tr>)}</tbody></table></div>;
}

export function BssyPlatform() {
  const [page, setPage] = useState<PageId>("dashboard");
  const [role, setRole] = useState(roles[0]);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [noticeOpen, setNoticeOpen] = useState(false);
  const [journeyStep, setJourneyStep] = useState(0);
  const [drawer, setDrawer] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [evidenceStatus, setEvidenceStatus] = useState<Status>("Pending Verification");
  const [grievanceStatus, setGrievanceStatus] = useState<Status>("Assigned");
  const [recommendation, setRecommendation] = useState("Needs review");
  const [readNotifications, setReadNotifications] = useState<number[]>([2]);
  const [auditEvents, setAuditEvents] = useState(["09:42 • Ward Supervisor (Demo) opened EV-24018", "09:18 • Sanstha Coordinator submitted attendance", "08:50 • Demo Admin assigned WO-BSSY-24018"]);
  const [search, setSearch] = useState("");

  const go = (next: PageId, step?: number) => { setPage(next); setMobileOpen(false); setDrawer(null); if (step !== undefined) setJourneyStep(step); window.scrollTo({ top: 0, behavior: "smooth" }); };
  const confirm = (message: string) => { setToast(message); window.setTimeout(() => setToast(null), 2800); };
  const logAction = (message: string) => setAuditEvents(events => [`Now • Demo profile — ${message}`, ...events]);
  const decideEvidence = (status: Status) => { setEvidenceStatus(status); logAction(`EV-24018 marked ${status}`); confirm(`${status} • Saved in demo only`); if (status === "Verified") setJourneyStep(4); };
  const filteredOrders = useMemo(() => workOrders.filter(w => `${w.id} ${w.activity} ${w.ward} ${w.sanstha}`.toLowerCase().includes(search.toLowerCase())), [search]);
  const meta = pageMeta[page];

  const genericPage = (kind: PageId) => {
    if (kind === "sansthas") return <div className="grid gap-4 lg:grid-cols-3">{[
      ["S-1007", "Sanstha Prerna (Demo)", "Demo Ward 04", "5 linked orders", "82% illustrative indicator"],
      ["S-1011", "Sanstha Udaan (Demo)", "Demo Ward 07", "3 linked orders", "76% illustrative indicator"],
      ["S-1015", "Sanstha Sakhi (Demo)", "Demo Ward 11", "4 linked orders", "89% illustrative indicator"],
    ].map((s,i) => <Card key={s[0]} className="p-5"><div className="flex items-start justify-between"><Building2 className="h-5 w-5 text-primary"/><StatusChip status={i === 1 ? "Needs Attention" : "In Progress"}/></div><p className="mt-5 text-xs font-bold text-muted-foreground">{s[0]}</p><h3 className="mt-1 font-display text-lg font-bold">{s[1]}</h3><p className="mt-2 text-sm text-muted-foreground">{s[2]} • {s[3]}</p><div className="mt-4 h-2 rounded-full bg-muted"><div className="h-full rounded-full bg-success" style={{width: i===0?"82%":i===1?"76%":"89%"}}/></div><p className="mt-2 text-xs text-muted-foreground">{s[4]}</p><Button variant="secondary" className="mt-4 w-full" onClick={() => setDrawer(String(s[0]))}>Open synthetic record <ChevronRight className="h-4 w-4"/></Button></Card>)}</div>;
    if (kind === "workers") return <Card><DataTable headers={["Worker", "Sanstha", "Demo ward", "Assignment", "Attendance", "Status"]} rows={workers.map(w => [<strong>{w.id} • {w.name}</strong>, "S-1007", "Demo Ward 04", w.assignment, <StatusChip status={w.attendance}/>, w.geo])} onRow={i => setDrawer(workers[i].id)} /></Card>;
    if (kind === "attendance") return <div className="grid gap-5 xl:grid-cols-[1.2fr_.8fr]"><Card><SectionHeader title="Daily attendance register" aside={<span className="text-xs text-muted-foreground">Today — Demo</span>}/><DataTable headers={["Worker", "Time", "Assignment", "Attendance", "Location indicator", "Action"]} rows={workers.map((w,i) => [<strong>{w.id} • {w.name}</strong>, i===0?"08:31 synthetic":i===1?"08:36 synthetic":"—", w.assignment, <StatusChip status={w.attendance}/>, w.geo, <Button variant="ghost" onClick={() => confirm(i===2?"Attendance marked • Saved in demo only":"Exception opened • Demo only")}>{i===2?"Mark attendance":"Review"}</Button>])}/></Card><Card className="p-5"><DemoMap onOpen={() => confirm("Demo zone selected")}/><div className="mt-4 flex gap-3 rounded-md border border-attention/30 bg-attention-soft p-3 text-sm text-attention"><AlertTriangle className="h-5 w-5 shrink-0"/><p>Location and attendance are simulated in this prototype.</p></div></Card></div>;
    if (kind === "ward-performance") return <div className="space-y-5"><div className="grid gap-4 sm:grid-cols-3">{[["Demo Ward 04","74%","2 exceptions"],["Demo Ward 07","68%","3 pending"],["Demo Ward 11","87%","1 open grievance"]].map((x,i)=><Card key={x[0]} className="p-5"><p className="text-sm font-bold">{x[0]}</p><p className="mt-3 font-display text-3xl font-bold">{x[1]}</p><div className="mt-3 h-2 rounded bg-muted"><div className="h-full rounded bg-primary" style={{width:x[1]}}/></div><p className="mt-2 text-xs text-muted-foreground">Illustrative completion • {x[2]}</p></Card>)}</div><Card><DataTable headers={["Synthetic ward","Assigned","Completed","Attendance submitted","Evidence verified","Open grievances","Exceptions"]} rows={[["Demo Ward 04",4,1,"67%","50%",1,2],["Demo Ward 07",3,2,"75%","67%",2,1],["Demo Ward 11",4,3,"90%","80%",1,1]]} onRow={() => go("work-orders")}/></Card></div>;
    if (kind === "gis") return <div className="grid gap-5 lg:grid-cols-[1.25fr_.75fr]"><Card className="p-5"><DemoMap onOpen={() => go("work-orders")}/></Card><Card><SectionHeader title="Accessible activity list"/><div className="divide-y divide-border">{workOrders.slice(0,3).map(w=><button key={w.id} onClick={()=>{go("work-orders");setDrawer(w.id)}} className="flex w-full items-center justify-between p-4 text-left hover:bg-muted"><span><strong className="block text-sm">{w.id}</strong><span className="text-xs text-muted-foreground">{w.ward} • {w.beat}</span></span><StatusChip status={w.status}/></button>)}</div></Card></div>;
    if (kind === "analytics") return <div className="space-y-5"><FilterBar search={search} setSearch={setSearch} onReset={()=>setSearch("")} onAction={()=>confirm("Export preview — demo only")}/><div className="grid gap-4 md:grid-cols-3">{[["Activity completion","62%","7 of 11 synthetic activities"],["Attendance submission","81%","Illustrative sample period"],["Grievances resolved","50%","2 of 4 demo records"]].map(x=><Card key={x[0]} className="p-5"><p className="text-sm font-semibold text-muted-foreground">{x[0]}</p><p className="mt-3 font-display text-3xl font-bold">{x[1]}</p><div className="mt-4 flex h-24 items-end gap-2">{[42,68,53,82,74,90,62].map((v,i)=><div key={i} className="flex-1 rounded-t bg-primary/70" style={{height:`${v}%`}}/>)}</div><p className="mt-3 text-xs text-muted-foreground">{x[2]}</p></Card>)}</div></div>;
    if (kind === "recommendations") return <div className="grid gap-4">{[
      ["Review evidence pending for WO-BSSY-24018", "Evidence not yet verified; one location indicator missing", "evidence"],
      ["Check an attendance exception before closing the activity", "W-302 location not captured; W-303 attendance pending", "attendance"],
      ["Review linked grievance before recommendation", "GR-25031 remains assigned for review", "grievances"],
    ].map(x=><Card key={x[0]} className="grid gap-4 p-5 sm:grid-cols-[auto_1fr_auto] sm:items-center"><div className="grid h-10 w-10 place-items-center rounded-md bg-accent-soft text-accent"><Lightbulb className="h-5 w-5"/></div><div><h3 className="font-bold">{x[0]}</h3><p className="mt-1 text-sm text-muted-foreground">Supporting factors: {x[1]}</p><p className="mt-2 text-xs font-semibold text-primary">Illustrative rule-based signal</p></div><Button variant="secondary" onClick={()=>go(x[2] as PageId)}>Review record</Button></Card>)}</div>;
    if (kind === "notifications") return <Card><div className="divide-y divide-border">{["Evidence EV-24018 awaits verification","GR-25031 status changed","Attendance location exception requires review","Illustrative pilot readiness milestone updated"].map((n,i)=><button key={n} onClick={()=>{setReadNotifications(r=>[...new Set([...r,i])]); go(i===0?"evidence":i===1?"grievances":i===2?"attendance":"implementation")}} className="grid w-full grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 p-4 text-left hover:bg-muted"><span className={cn("h-2.5 w-2.5 rounded-full",readNotifications.includes(i)?"bg-border":"bg-accent")}/><span className="min-w-0"><strong className="block truncate text-sm">{n}</strong><span className="text-xs text-muted-foreground">Synthetic event • Today</span></span><ChevronRight className="h-4 w-4"/></button>)}</div></Card>;
    if (kind === "audit") return <Card><DataTable headers={["Synthetic time","Demo user / role","Event","Record","Result"]} rows={auditEvents.map(e=>{const parts=e.split(" • ");return [parts[0],parts[1]||"Demo profile",parts.slice(2).join(" • "),e.match(/(?:WO|EV|GR|REC)-[A-Z]*\d+/)?.[0]||"—","Local only"]})}/></Card>;
    if (kind === "integrations") return <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{[["Identity & access",UserRound],["GIS and location",Map],["Messaging",Bell],["Finance systems",CircleDollarSign],["Departmental data",Network]].map(([n,I])=>{const Icon=I as LucideIcon;return <Card key={String(n)} className="p-5"><Icon className="h-6 w-6 text-primary"/><h3 className="mt-6 font-bold">{String(n)}</h3><p className="mt-2 text-sm text-muted-foreground">Potential implementation connection point. No endpoint or credentials configured.</p><div className="mt-4"><StatusChip status="Not connected in demo"/></div></Card>})}</div>;
    if (kind === "implementation") return <div className="space-y-5"><div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">{["Discovery / requirements","Design","Build / configuration","Testing","Training","Pilot / rollout","Commissioning","Operations & maintenance"].map((x,i)=><Card key={x} className="p-4"><p className="text-xs font-bold text-muted-foreground">PHASE {i+1}</p><h3 className="mt-2 font-bold">{x}</h3><StatusChip status={i<2?"Complete":i<4?"In progress":"Draft"}/><p className="mt-3 text-xs text-muted-foreground">Owner role: Illustrative • Milestone to be confirmed</p></Card>)}</div><Card><SectionHeader title="Readiness checklist"/><div className="grid gap-3 p-5 sm:grid-cols-2 lg:grid-cols-3">{["Governance","Data preparation","User onboarding & training","Support model","Security review","Rollout planning"].map((x,i)=><div key={x} className="flex items-center justify-between rounded-md border border-border p-3 text-sm"><span>{x}</span><StatusChip status={i<2?"In progress":"Draft"}/></div>)}</div></Card></div>;
    if (kind === "workflow") return <div className="space-y-5"><Card className="p-5"><div className="flex flex-wrap gap-2">{["Assignment","Execution","Attendance","Evidence","Verification","Grievance","Performance review","Financial recommendation"].map((x,i)=><div key={x} className="flex min-w-[130px] flex-1 items-center gap-2 rounded-md border border-border p-3"><span className={cn("grid h-7 w-7 shrink-0 place-items-center rounded-full text-xs font-bold",i<3?"bg-success text-success-foreground":i<5?"bg-attention-soft text-attention":"bg-muted text-muted-foreground")}>{i+1}</span><span className="text-xs font-semibold">{x}</span></div>)}</div></Card><div className="grid gap-5 lg:grid-cols-2"><Card><SectionHeader title="Illustrative configurable checklist"/><div className="space-y-3 p-5">{["Assignment linked","Attendance captured","Evidence pair submitted","Supervisor decision recorded","Grievance reviewed"].map((x,i)=><label key={x} className="flex items-center gap-3 text-sm"><input type="checkbox" defaultChecked={i<3} className="h-4 w-4 accent-primary"/>{x}{i===3&&<StatusChip status="Pending Verification"/>}</label>)}</div></Card><Card className="p-5"><h3 className="font-bold">Security & operating principles</h3><ul className="mt-4 space-y-3 text-sm text-muted-foreground">{["Role-oriented interface previews","Data minimisation and privacy considerations","Auditability as a target capability","Configurable retention and access policies","Security review and deployment requirements to be confirmed"].map(x=><li key={x} className="flex gap-2"><Check className="h-4 w-4 shrink-0 text-success"/>{x}</li>)}</ul><div className="mt-5 flex gap-2 rounded-md bg-muted p-3 text-xs text-muted-foreground"><WifiOff className="h-4 w-4 shrink-0"/>Offline-ready concept — sync is simulated; no data is stored remotely.</div></Card></div></div>;
    return null;
  };

  const renderPage = () => {
    if (page === "dashboard") return <Dashboard go={go} setDrawer={setDrawer} startJourney={()=>{setJourneyStep(1);go("work-orders",1)}} evidenceStatus={evidenceStatus} grievanceStatus={grievanceStatus} auditEvents={auditEvents}/>;
    if (page === "work-orders") return <div className="space-y-5"><FilterBar search={search} setSearch={setSearch} onReset={()=>setSearch("")} onAction={()=>{confirm("Demo work order created • Saved locally");logAction("Created a demo work order")}}/><Card><DataTable headers={["Work order","Activity / location","Ward","Sanstha","Planned","Workers","Status","Evidence"]} rows={filteredOrders.map(w=>[<strong>{w.id}</strong>,<span>{w.activity}<small className="block text-muted-foreground">{w.beat}</small></span>,w.ward,w.sanstha,w.date,w.workers,<StatusChip status={w.status}/>,<StatusChip status={w.id==="WO-BSSY-24018"?evidenceStatus:w.evidence}/>])} onRow={i=>setDrawer(filteredOrders[i]?.id||null)}/></Card></div>;
    if (page === "evidence") return <Evidence status={evidenceStatus} decide={decideEvidence}/>;
    if (page === "grievances") return <Grievances status={grievanceStatus} setStatus={s=>{setGrievanceStatus(s);logAction(`GR-25031 marked ${s}`);confirm(`${s} • Saved in demo only`)}}/>;
    if (page === "qr") return <QrGrievance confirm={confirm}/>;
    if (page === "grant") return <Grant status={recommendation} setStatus={s=>{setRecommendation(s);logAction(`REC-24018 updated: ${s}`);confirm(`${s} • Recommendation saved in demo only`)}}/>;
    if (page === "finance") return <Finance confirm={confirm}/>;
    return genericPage(page);
  };

  return <div className="min-h-screen bg-background text-foreground">
    {mobileOpen && <button className="fixed inset-0 z-40 bg-overlay lg:hidden" aria-label="Close navigation" onClick={()=>setMobileOpen(false)}/>}
    <aside className={cn("fixed inset-y-0 left-0 z-50 flex w-[280px] flex-col bg-civic text-civic-foreground transition-transform lg:translate-x-0",mobileOpen?"translate-x-0":"-translate-x-full")}>
      <div className="flex h-20 items-center justify-between border-b border-civic-border px-5"><div><p className="font-display text-sm font-bold">BMC | BSSY</p><p className="text-xs text-civic-muted">Digital Platform</p></div><Button variant="ghost" className="text-civic-foreground hover:bg-civic-hover lg:hidden" onClick={()=>setMobileOpen(false)} aria-label="Close menu"><X className="h-5 w-5"/></Button></div>
      <div className="mx-4 mt-4 rounded-md border border-demo/35 bg-demo/10 px-3 py-2 text-[11px] font-bold tracking-wide text-demo">DEMO • SYNTHETIC DATA</div>
      <nav className="mt-3 flex-1 overflow-y-auto px-3 pb-5">{navGroups.map((group,g)=><div key={g} className="mt-4">{group.label&&<p className="mb-1 px-3 text-[10px] font-bold uppercase tracking-wider text-civic-muted">{group.label}</p>}{group.items.map(item=>{const Icon=item.icon;return <button key={item.id} onClick={()=>go(item.id)} className={cn("mb-0.5 flex w-full items-center gap-3 rounded-md px-3 py-2 text-left text-[13px] font-medium transition",page===item.id?"bg-civic-active text-civic-foreground":"text-civic-muted hover:bg-civic-hover hover:text-civic-foreground")}><Icon className="h-4 w-4 shrink-0"/><span className="truncate">{item.label}</span></button>})}</div>)}</nav>
      <div className="border-t border-civic-border p-4 text-[11px] text-civic-muted"><div className="flex items-center gap-2"><WifiOff className="h-3.5 w-3.5"/>Sync simulated • No remote storage</div></div>
    </aside>

    <div className="lg:pl-[280px]">
      <header className="sticky top-0 z-30 grid h-16 grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 border-b border-border bg-card/95 px-4 backdrop-blur sm:px-6">
        <Button variant="ghost" className="px-2 lg:hidden" onClick={()=>setMobileOpen(true)} aria-label="Open menu"><Menu className="h-5 w-5"/></Button>
        <div className="min-w-0"><p className="truncate font-display text-sm font-bold lg:hidden">BMC | BSSY Digital Platform</p><p className="hidden truncate text-xs text-muted-foreground sm:block lg:block"><span className="font-semibold text-primary">Previewing role:</span> {role} • Interface preview only</p></div>
        <div className="flex shrink-0 items-center gap-1.5">
          <label className="hidden items-center gap-2 rounded-md border border-border bg-background px-2.5 py-1.5 md:flex"><UserRound className="h-4 w-4 text-muted-foreground"/><select value={role} onChange={e=>{setRole(e.target.value);const destinations:Record<string,PageId>={"BMC Administrator":"dashboard","Ward Officer / Supervisor":"evidence","Sanstha Coordinator":"work-orders","Field Worker":"attendance","Accounts Officer":"finance","Citizen":"qr"};go(destinations[e.target.value])}} className="max-w-48 bg-transparent text-xs font-semibold outline-none">{roles.map(r=><option key={r}>{r}</option>)}</select><ChevronDown className="h-3 w-3"/></label>
          <Button variant="ghost" className="px-2" aria-label="Language selector" onClick={()=>confirm("English / मराठी • Demo labels only")}><Languages className="h-5 w-5"/></Button>
          <div className="relative"><Button variant="ghost" className="relative px-2" aria-label="Notifications" onClick={()=>setNoticeOpen(v=>!v)}><Bell className="h-5 w-5"/><span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-accent"/></Button>{noticeOpen&&<div className="absolute right-0 top-11 w-[min(340px,calc(100vw-2rem))] rounded-lg border border-border bg-card p-2 shadow-xl"><p className="px-3 py-2 text-sm font-bold">Demo notifications</p>{["EV-24018 pending verification","GR-25031 assigned for review","Attendance exception detected"].map((n,i)=><button key={n} onClick={()=>{setNoticeOpen(false);go(i===0?"evidence":i===1?"grievances":"attendance")}} className="flex w-full items-center gap-3 rounded-md p-3 text-left text-xs hover:bg-muted"><span className="h-2 w-2 rounded-full bg-accent"/>{n}</button>)}</div>}</div>
          <div className="hidden h-8 w-8 place-items-center rounded-full bg-primary text-xs font-bold text-primary-foreground sm:grid">DP</div>
        </div>
      </header>

      <main className="mx-auto max-w-[1540px] px-4 py-6 sm:px-6 lg:px-8">
        <div className="mb-5 flex flex-wrap items-center gap-2 rounded-md border border-demo/35 bg-demo-soft px-3 py-2 text-xs text-demo-foreground"><strong>DEMO / PROTOTYPE — Synthetic data</strong><span className="text-demo-muted">No live BMC records, services, decisions, or integrations.</span></div>
        {journeyStep>0&&<div className="mb-6 overflow-x-auto rounded-lg border border-border bg-card p-3"><div className="flex min-w-[760px] items-center gap-2">{journey.map(([target,label],i)=><button key={label} onClick={()=>go(target,i+1)} className={cn("flex flex-1 items-center gap-2 rounded-md px-2 py-2 text-left text-xs font-semibold",journeyStep===i+1?"bg-primary text-primary-foreground":i+1<journeyStep?"bg-success-soft text-success":"bg-muted text-muted-foreground")}><span className="grid h-5 w-5 shrink-0 place-items-center rounded-full border border-current">{i+1<journeyStep?<Check className="h-3 w-3"/>:i+1}</span><span className="truncate">{label}</span></button>)}</div></div>}
        <div className="mb-6 grid grid-cols-[minmax(0,1fr)_auto] items-start gap-4"><div className="min-w-0">{page!=="dashboard"&&<button onClick={()=>go("dashboard")} className="mb-2 flex items-center gap-1 text-xs font-semibold text-primary hover:underline"><ArrowLeft className="h-3.5 w-3.5"/>Command Dashboard</button>}<h1 className="font-display text-2xl font-bold tracking-normal sm:text-3xl">{meta[0]}</h1><p className="mt-1 text-sm text-muted-foreground">{meta[1]}</p></div><StatusChip status="Synthetic / Illustrative"/></div>
        {renderPage()}
      </main>
    </div>
    {drawer&&<RecordDrawer id={drawer} close={()=>setDrawer(null)} go={go} confirm={confirm}/>} 
    {toast&&<div role="status" className="fixed bottom-5 right-5 z-[80] flex max-w-sm items-center gap-3 rounded-lg bg-civic px-4 py-3 text-sm font-semibold text-civic-foreground shadow-xl"><span className="grid h-6 w-6 place-items-center rounded-full bg-success"><Check className="h-4 w-4"/></span>{toast}</div>}
  </div>;
}

function FilterBar({ search, setSearch, onReset, onAction }: { search: string; setSearch: (v:string)=>void; onReset:()=>void; onAction:()=>void }) {
  return <Card className="p-3"><div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-[minmax(220px,1fr)_repeat(3,minmax(130px,.55fr))_auto_auto]"><label className="flex items-center gap-2 rounded-md border border-input bg-background px-3"><Search className="h-4 w-4 text-muted-foreground"/><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search synthetic records" className="min-h-9 min-w-0 flex-1 bg-transparent text-sm outline-none"/></label>{["All demo wards","All statuses","Today — Demo"].map(x=><label key={x} className="flex items-center gap-2 rounded-md border border-input bg-background px-3"><Filter className="h-3.5 w-3.5 text-muted-foreground"/><select className="min-h-9 min-w-0 flex-1 bg-transparent text-xs font-semibold outline-none"><option>{x}</option></select></label>)}<Button variant="ghost" onClick={onReset}><RefreshCcw className="h-4 w-4"/>Reset</Button><Button onClick={onAction}>Create demo work order</Button></div></Card>;
}

function Dashboard({go,setDrawer,startJourney,evidenceStatus,grievanceStatus,auditEvents}:{go:(p:PageId)=>void;setDrawer:(id:string)=>void;startJourney:()=>void;evidenceStatus:Status;grievanceStatus:Status;auditEvents:string[]}) {
  return <div className="space-y-5"><div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto]"><div className="flex flex-wrap gap-2">{["Today — Demo","All demo wards","All activities / statuses"].map(x=><button key={x} className="rounded-md border border-border bg-card px-3 py-2 text-xs font-semibold">{x} <ChevronDown className="ml-2 inline h-3 w-3"/></button>)}</div><Button onClick={startJourney}>Start demo journey <ChevronRight className="h-4 w-4"/></Button></div><div className="grid grid-cols-2 gap-3 md:grid-cols-4 xl:grid-cols-7"><MetricCard label="Sansthas" value="3" detail="Synthetic register" onClick={()=>go("sansthas")}/><MetricCard label="Active workers" value="11" detail="Across demo orders" onClick={()=>go("workers")}/><MetricCard label="Attendance" value="9/11" detail="Submitted today" onClick={()=>go("attendance")}/><MetricCard label="In progress" value="1" detail="Work orders" onClick={()=>go("work-orders")}/><MetricCard label="Evidence pending" value={evidenceStatus==="Verified"?"1":"2"} detail="Supervisor queue" onClick={()=>go("evidence")}/><MetricCard label="Open grievances" value={grievanceStatus==="Closed"?"3":"4"} detail="Synthetic register" onClick={()=>go("grievances")}/><MetricCard label="Exceptions" value="2" detail="Needs review" onClick={()=>go("workflow")}/></div>
    <div className="grid gap-5 xl:grid-cols-[1fr_1.3fr]"><Card><SectionHeader title="Operational status"/><div className="space-y-4 p-5">{[["Assigned",1,25],["In progress",1,25],["Submitted",1,25],["Verified",1,25],["Needs attention",1,25]].map(([x,v,w])=><button key={String(x)} onClick={()=>go("work-orders")} className="grid w-full grid-cols-[100px_minmax(0,1fr)_24px] items-center gap-3 text-left text-xs"><span>{x}</span><span className="h-2 rounded-full bg-muted"><span className="block h-full rounded-full bg-primary" style={{width:`${w}%`}}/></span><strong>{v}</strong></button>)}</div></Card><Card><SectionHeader title="Ward performance snapshot" aside={<Button variant="ghost" onClick={()=>go("ward-performance")}>View all <ChevronRight className="h-4 w-4"/></Button>}/><DataTable headers={["Synthetic ward","Activities","Attendance","Evidence","Open issues"]} rows={[["Demo Ward 04","2 / 4","67%","50%","2 exceptions"],["Demo Ward 07","2 / 3","75%","67%","2 grievances"],["Demo Ward 11","3 / 4","90%","80%","1 grievance"]]} onRow={()=>go("ward-performance")}/></Card></div>
    <div className="grid gap-5 xl:grid-cols-3"><Card className="p-5"><h2 className="mb-4 font-display font-bold">Illustrative GIS overview</h2><DemoMap onOpen={()=>go("gis")}/><Button variant="secondary" className="mt-4 w-full" onClick={()=>go("gis")}>Open accessible GIS overview</Button></Card><Card><SectionHeader title="Evidence verification queue"/><div className="p-5"><p className="text-xs font-bold text-muted-foreground">EV-24018 • WO-BSSY-24018</p><h3 className="mt-2 font-bold">Before / after evidence pair</h3><div className="mt-3 flex items-center justify-between"><StatusChip status={evidenceStatus}/><span className="text-xs text-muted-foreground">Ward Supervisor (Demo)</span></div><Button className="mt-5 w-full" onClick={()=>go("evidence")}>Review evidence</Button></div></Card><Card><SectionHeader title="Grievance summary"/><div className="space-y-3 p-5">{[["Assigned for review",grievanceStatus==="Closed"?0:1],["In progress",1],["Resolved / closed",grievanceStatus==="Closed"?3:2]].map(x=><div key={String(x[0])} className="flex items-center justify-between rounded-md bg-muted p-3 text-sm"><span>{x[0]}</span><strong>{x[1]}</strong></div>)}<Button variant="secondary" className="w-full" onClick={()=>go("grievances")}>Open grievance register</Button></div></Card></div>
    <div className="grid gap-5 xl:grid-cols-[1fr_.8fr]"><Card><SectionHeader title="Alerts & exceptions"/><div className="divide-y divide-border">{[["Attendance location not captured","W-302 • WO-BSSY-24018","attendance"],["Evidence awaiting supervisor decision","EV-24018","evidence"],["Citizen issue linked to active work","GR-25031","grievances"]].map(x=><button key={x[0]} onClick={()=>go(x[2] as PageId)} className="grid w-full grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 p-4 text-left hover:bg-muted"><AlertTriangle className="h-5 w-5 text-attention"/><span className="min-w-0"><strong className="block truncate text-sm">{x[0]}</strong><small className="text-muted-foreground">{x[1]}</small></span><span className="text-xs font-semibold text-primary">View record</span></button>)}</div></Card><Card><SectionHeader title="Recent demo activity"/><ol className="space-y-4 p-5">{auditEvents.slice(0,4).map((e,i)=><li key={`${e}-${i}`} className="grid grid-cols-[10px_1fr] gap-3 text-sm"><span className="mt-1.5 h-2.5 w-2.5 rounded-full bg-primary"/><span>{e}</span></li>)}</ol></Card></div></div>;
}

function Evidence({status,decide}:{status:Status;decide:(s:Status)=>void}) { const [note,setNote]=useState(""); return <div className="grid gap-5 xl:grid-cols-[1.2fr_.8fr]"><Card className="p-5"><div className="flex flex-wrap items-center justify-between gap-3"><div><p className="text-xs font-bold text-muted-foreground">EV-24018 • WO-BSSY-24018</p><h2 className="mt-1 font-display text-lg font-bold">Public area cleanliness activity</h2></div><StatusChip status={status}/></div><div className="mt-5 grid gap-4 sm:grid-cols-2">{["BEFORE — PLACEHOLDER","AFTER — PLACEHOLDER"].map((x,i)=><div key={x} className={cn("evidence-placeholder grid aspect-[4/3] place-items-center rounded-md border border-border",i===1&&"after")}><div className="text-center"><FileText className="mx-auto h-8 w-8 text-muted-foreground"/><p className="mt-2 text-xs font-bold text-muted-foreground">{x}</p><p className="mt-1 text-[11px] text-muted-foreground">Synthetic • no field photo fetched</p></div></div>)}</div><div className="mt-5 grid gap-3 text-sm sm:grid-cols-2"><p><span className="text-muted-foreground">Captured:</span> 09:36 synthetic</p><p><span className="text-muted-foreground">Worker / Sanstha:</span> W-301 / S-1007</p><p><span className="text-muted-foreground">Location:</span> Inside demo zone</p><p><span className="text-muted-foreground">Reviewer:</span> Ward Supervisor (Demo)</p></div></Card><Card><SectionHeader title="Verification decision"/><div className="p-5"><p className="text-xs text-muted-foreground">Illustrative configurable checklist</p><div className="mt-4 space-y-3">{["Before placeholder supplied","After placeholder supplied","Activity checklist complete","Location indicator available"].map((x,i)=><label key={x} className="flex items-center gap-3 text-sm"><input type="checkbox" defaultChecked={i<3} className="h-4 w-4 accent-primary"/>{x}</label>)}</div><label className="mt-5 block text-sm font-semibold">Reason / review note<textarea value={note} onChange={e=>setNote(e.target.value)} placeholder="Optional synthetic review note" className="mt-2 min-h-24 w-full rounded-md border border-input bg-background p-3 text-sm font-normal outline-none focus:border-primary"/></label><div className="mt-4 grid gap-2"><Button onClick={()=>decide("Verified")}><Check className="h-4 w-4"/>Verify</Button><Button variant="secondary" onClick={()=>decide("Returned for Correction")}>Return for correction</Button><Button variant="danger" onClick={()=>decide("Exception")}><AlertTriangle className="h-4 w-4"/>Flag exception</Button></div></div></Card></div> }

function Grievances({status,setStatus}:{status:Status;setStatus:(s:Status)=>void}) { const [note,setNote]=useState(""); return <div className="grid gap-5 xl:grid-cols-[1.15fr_.85fr]"><Card><DataTable headers={["Reference","Category","Linked location / work","Received","Status","Assigned role","Illustrative age"]} rows={[[<strong>GR-25031</strong>,"Waste not cleared","Beat B-04C • WO-BSSY-24018","Today 10:05",<StatusChip status={status}/>,"Ward Supervisor","2h 15m"],["GR-25035","Public area needs review","Demo Ward 07","Today 09:40",<StatusChip status="In Progress"/>,"Ward team","2h 40m"],["GR-25027","Cleanliness follow-up","Demo Ward 11","Yesterday",<StatusChip status="Resolved"/>,"Ward team","1 day"]]}/></Card><Card><SectionHeader title="GR-25031 — linked record"/><div className="p-5"><StatusChip status={status}/><h3 className="mt-4 font-bold">Waste not cleared</h3><p className="mt-2 text-sm text-muted-foreground">Synthetic citizen report linked to Beat B-04C and WO-BSSY-24018.</p><div className="my-5 space-y-3 border-l-2 border-border pl-4 text-xs"><p><strong>10:05</strong> • Submitted via demo QR</p><p><strong>10:12</strong> • Routed to ward review</p><p><strong>10:24</strong> • Linked to work order</p></div><label className="text-sm font-semibold">Resolution note<textarea value={note} onChange={e=>setNote(e.target.value)} placeholder="Add a synthetic closure note" className="mt-2 min-h-20 w-full rounded-md border border-input bg-background p-3 text-sm font-normal outline-none"/></label><div className="mt-4 grid grid-cols-2 gap-2"><Button variant="secondary" onClick={()=>setStatus("Assigned")}>Acknowledge</Button><Button variant="secondary" onClick={()=>setStatus("In Progress")}>Assign</Button><Button onClick={()=>setStatus("Resolved")}>Resolve</Button><Button onClick={()=>setStatus("Closed")}>Close</Button></div></div></Card></div> }

function QrGrievance({confirm}:{confirm:(m:string)=>void}) { const [submitted,setSubmitted]=useState(false); const [lookup,setLookup]=useState(""); return <div className="grid gap-5 lg:grid-cols-[.8fr_1.2fr]"><Card className="p-6 text-center"><div className="mx-auto grid h-48 w-48 grid-cols-5 gap-1 rounded-lg border-8 border-foreground bg-card p-2" aria-label="Non-scannable QR placeholder">{Array.from({length:25},(_,i)=><span key={i} className={cn("rounded-sm",[0,1,2,5,7,10,11,12,14,17,19,20,22,23,24].includes(i)?"bg-foreground":"bg-card")}/>)}</div><h2 className="mt-5 font-display text-xl font-bold">Scan / Enter QR code</h2><p className="mt-2 text-sm text-muted-foreground">Visual placeholder only — not a live scannable service.</p><label className="mt-5 block text-left text-sm font-semibold">Demo QR or reference<input value={lookup} onChange={e=>setLookup(e.target.value)} placeholder="Try GR-25031" className="mt-2 min-h-10 w-full rounded-md border border-input bg-background px-3 font-normal outline-none"/></label><Button className="mt-3 w-full" onClick={()=>confirm(lookup?`${lookup} found • Synthetic status displayed`:"Enter a demo reference first")}>Look up demo status</Button></Card><Card><SectionHeader title="Submit a synthetic issue"/><form className="space-y-4 p-6" onSubmit={e=>{e.preventDefault();setSubmitted(true);confirm("GR-DEMO-25041 created locally")}}><label className="block text-sm font-semibold">Demo location / work order<select className="mt-2 min-h-10 w-full rounded-md border border-input bg-background px-3 font-normal"><option>Beat B-04C • WO-BSSY-24018</option><option>Demo Ward 07 • WO-BSSY-24021</option></select></label><label className="block text-sm font-semibold">Issue category<select className="mt-2 min-h-10 w-full rounded-md border border-input bg-background px-3 font-normal"><option>Waste not cleared</option><option>Public area needs review</option><option>Other demo category</option></select></label><label className="block text-sm font-semibold">Description<textarea required placeholder="Describe a synthetic issue; do not enter personal information" className="mt-2 min-h-28 w-full rounded-md border border-input bg-background p-3 font-normal outline-none"/></label><label className="block text-sm font-semibold">Optional contact placeholder<input placeholder="Do not enter real personal information" className="mt-2 min-h-10 w-full rounded-md border border-input bg-background px-3 font-normal outline-none"/></label><Button type="submit" className="w-full">Submit demo grievance</Button>{submitted&&<div className="rounded-md border border-success/30 bg-success-soft p-4 text-sm text-success"><strong>GR-DEMO-25041 created</strong><p className="mt-1">Demo status: Received • Stored only in this browser session.</p></div>}</form><div className="grid grid-cols-4 border-t border-border">{["QR / reference","Submission","Routing & review","Resolution & closure"].map((x,i)=><div key={x} className="border-r border-border p-3 text-center text-[10px] font-semibold last:border-0"><span className="mx-auto mb-2 grid h-5 w-5 place-items-center rounded-full bg-muted">{i+1}</span>{x}</div>)}</div></Card></div> }

function Grant({status,setStatus}:{status:string;setStatus:(s:string)=>void}) { return <div className="grid gap-5 lg:grid-cols-[1.1fr_.9fr]"><Card className="p-6"><div className="flex items-start justify-between gap-3"><div><p className="text-xs font-bold text-muted-foreground">REC-24018 • WO-BSSY-24018</p><h2 className="mt-2 font-display text-xl font-bold">Illustrative grant recommendation</h2></div><StatusChip status={status}/></div><div className="mt-6 rounded-md border border-attention/30 bg-attention-soft p-4 text-sm text-attention"><strong>Recommendation only</strong> — no payment is initiated or authorised. No amount, formula, threshold, eligibility, or sanction decision is represented.</div><div className="mt-6 flex flex-wrap gap-2"><Button onClick={()=>setStatus("Ready for review")}>Prepare illustrative recommendation</Button><Button variant="secondary" onClick={()=>setStatus("Reviewed")}>Send to review</Button><Button variant="secondary" onClick={()=>setStatus("Needs attention")}>Request more evidence</Button></div></Card><Card><SectionHeader title="Recommendation factors"/><div className="space-y-4 p-5">{[["Verified activity completion","Pending evidence decision","attention"],["Evidence completeness","3 of 4 illustrative items","attention"],["Attendance exceptions","2 records require review","critical"],["Unresolved grievances","GR-25031 open","attention"],["Supervisor review","Pending","neutral"]].map(x=><div key={x[0]} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3"><div><p className="text-sm font-semibold">{x[0]}</p><p className="text-xs text-muted-foreground">{x[1]}</p></div><span className={cn("h-2.5 w-2.5 rounded-full",x[2]==="critical"?"bg-destructive":x[2]==="attention"?"bg-attention":"bg-muted-foreground")}/></div>)}</div></Card></div> }

function Finance({confirm}:{confirm:(m:string)=>void}) { return <div className="space-y-5"><Card className="p-5"><div className="grid gap-2 md:grid-cols-5">{["Evidence pack received","Verification review","Discrepancy follow-up","Recommendation review","Decision recorded"].map((x,i)=><button key={x} onClick={()=>confirm(`${x} opened • Demo only`)} className="flex items-center gap-3 rounded-md border border-border p-3 text-left"><span className={cn("grid h-7 w-7 shrink-0 place-items-center rounded-full text-xs font-bold",i<1?"bg-success text-success-foreground":i===1?"bg-attention-soft text-attention":"bg-muted text-muted-foreground")}>{i+1}</span><span className="text-xs font-semibold">{x}</span></button>)}</div></Card><div className="grid gap-5 lg:grid-cols-2"><Card><SectionHeader title="FIN-24018 — supporting pack"/><div className="space-y-3 p-5">{["Evidence summary placeholder","Attendance review placeholder","Supervisor note placeholder","Recommendation record REC-24018"].map(x=><button key={x} onClick={()=>confirm("Document placeholder opened • Demo only")} className="flex w-full items-center justify-between rounded-md border border-border p-3 text-left text-sm hover:bg-muted"><span className="flex items-center gap-2"><FileText className="h-4 w-4 text-primary"/>{x}</span><ChevronRight className="h-4 w-4"/></button>)}</div></Card><Card className="p-5"><h3 className="font-bold">Reviewer note</h3><textarea placeholder="Add a local synthetic note" className="mt-3 min-h-28 w-full rounded-md border border-input bg-background p-3 text-sm outline-none"/><Button className="mt-3" onClick={()=>confirm("Reviewer note saved in demo only")}>Save demo note</Button></Card></div></div> }

function RecordDrawer({id,close,go,confirm}:{id:string;close:()=>void;go:(p:PageId)=>void;confirm:(m:string)=>void}) { return <><button className="fixed inset-0 z-[60] bg-overlay" aria-label="Close record" onClick={close}/><aside className="fixed inset-y-0 right-0 z-[70] w-full max-w-xl overflow-y-auto border-l border-border bg-background shadow-2xl"><div className="sticky top-0 flex items-center justify-between border-b border-border bg-card px-5 py-4"><div><p className="text-xs font-bold text-muted-foreground">SYNTHETIC RECORD</p><h2 className="font-display text-xl font-bold">{id}</h2></div><Button variant="ghost" onClick={close} aria-label="Close drawer"><X className="h-5 w-5"/></Button></div><div className="space-y-5 p-5"><div><StatusChip status={id.startsWith("WO")?"In Progress":"Assigned"}/><h3 className="mt-4 font-bold">Public area cleanliness activity</h3><p className="mt-2 text-sm text-muted-foreground">Demo Ward 04 • Beat B-04C • Sanstha S-1007</p></div><Card><SectionHeader title="Linked demo records"/><div className="grid gap-2 p-4">{[["Sanstha S-1007","sansthas"],["Workers W-301, W-302, W-303","workers"],["Attendance register","attendance"],["Evidence EV-24018","evidence"],["Grievance GR-25031","grievances"]].map(x=><button key={x[0]} onClick={()=>{close();go(x[1] as PageId)}} className="flex items-center justify-between rounded-md border border-border p-3 text-left text-sm hover:bg-muted">{x[0]}<ChevronRight className="h-4 w-4"/></button>)}</div></Card><Card><SectionHeader title="Illustrative checklist"/><div className="space-y-3 p-4">{["Assignment confirmed","Worker roster linked","Attendance submitted","Before/after evidence captured","Supervisor verification pending"].map((x,i)=><div key={x} className="flex items-center gap-3 text-sm"><span className={cn("grid h-5 w-5 place-items-center rounded-full",i<4?"bg-success-soft text-success":"bg-attention-soft text-attention")}>{i<4?<Check className="h-3 w-3"/>:<FileClock className="h-3 w-3"/>}</span>{x}</div>)}</div></Card><div className="grid grid-cols-2 gap-2"><Button variant="secondary" onClick={()=>confirm("Sanstha assignment opened • Demo only")}>Assign Sanstha</Button><Button onClick={()=>confirm("Activity record opened • Demo only")}>Open activity record</Button></div></div></aside></> }