import {
  Activity,
  AlertCircle,
  AlertTriangle,
  ArrowRight,
  BarChart3,
  Building2,
  Camera,
  Check,
  CheckCircle2,
  ChevronRight,
  ClipboardCheck,
  Clock,
  Download,
  FileCheck,
  FileClock,
  IndianRupee,
  Layers,
  LayoutDashboard,
  Map,
  MapPin,
  Menu,
  MessageSquareWarning,
  QrCode,
  RefreshCcw,
  Search,
  Send,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  UserCheck,
  UserRound,
  Users,
  WalletCards,
  X,
  type LucideIcon,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

export type RoleType =
  | "BMC Administrator"
  | "Ward Officer / Supervisor"
  | "Sanstha Coordinator"
  | "Field Worker"
  | "Accounts Officer"
  | "Citizen";

export type PageId =
  | "dashboard"
  | "work-orders"
  | "sansthas"
  | "workers"
  | "attendance"
  | "evidence"
  | "ward-performance"
  | "grievances"
  | "grant"
  | "finance"
  | "citizen-service"
  | "qr-lookup";

export type Status =
  | "Draft"
  | "Assigned"
  | "In Progress"
  | "Under Ward Review"
  | "Returned for Correction"
  | "Verified"
  | "Resolved"
  | "Closed"
  | "Unclear Ward / Unassigned";

export interface SansthaItem {
  id: string;
  name: string;
  ward: string;
  contactPerson: string;
  phone: string;
  activeUnits: number;
  status: "Active" | "Pending KYC";
}

export interface WorkerItem {
  id: string;
  name: string;
  phone: string;
  role: string;
  sanstha: string;
  attendance: "Present" | "Absent" | "Pending" | "Exception";
  geo: string;
  assignment: string;
  vasti: string;
  checkInTime: string;
}

export interface WorkOrderItem {
  id: string;
  activity: string;
  ward: string;
  beat: string;
  vastiUnit: string;
  sanstha: string;
  date: string;
  shift: string;
  workers: number;
  assignedWorkers: string[];
  status: Status;
  evidenceStatus: "Draft" | "Submitted" | "Returned for Correction" | "Verified";
  beforePhoto: string;
  afterPhoto?: string | undefined;
  correctionNotes?: string | undefined;
}

export interface GrievanceItem {
  id: string;
  category: string;
  description: string;
  location: string;
  vastiUnit: string;
  ward: string;
  sansthaAssigned?: string | undefined;
  supervisor: string;
  citizenName: string;
  citizenPhone: string;
  createdAt: string;
  status: Status;
  slaRemaining: string;
  beforePhoto: string;
  afterPhoto?: string | undefined;
  registeredBy: "Citizen (QR Scan)" | "Citizen (Form)" | "BMC Staff / Helpline 1916";
  isWardUnclear?: boolean | undefined;
  correctionNotes?: string | undefined;
  timeline: { title: string; time: string; note: string; actor: string }[];
}

const INITIAL_SANSTHAS: SansthaItem[] = [
  { id: "S-101", name: "Sanstha Prerna Swachhata Foundation", ward: "Ward G/North (Dharavi)", contactPerson: "Sunil Shinde", phone: "+91 98201 11223", activeUnits: 148, status: "Active" },
  { id: "S-102", name: "Sanstha Udaan Mahila Vikas", ward: "Ward F/North (Matunga)", contactPerson: "Meena Rathod", phone: "+91 98199 33445", activeUnits: 92, status: "Active" },
  { id: "S-103", name: "Sanstha Sakhi Kalyan Sanstha", ward: "Ward M/East (Govandi)", contactPerson: "Ramesh Pawar", phone: "+91 98670 55667", activeUnits: 185, status: "Active" },
];

const INITIAL_WORKERS: WorkerItem[] = [
  { id: "W-301", name: "Asha Kamble", phone: "+91 98201 44512", role: "Sanitary Lead", sanstha: "Sanstha Prerna Swachhata Foundation", attendance: "Present", geo: "Within Vasti Boundary (4.2m)", assignment: "WO-BSSY-24018", vasti: "Vasti Unit 04-D", checkInTime: "07:42 AM" },
  { id: "W-302", name: "Ravi Ghadge", phone: "+91 98202 55910", role: "Sanitary Worker", sanstha: "Sanstha Prerna Swachhata Foundation", attendance: "Present", geo: "Within Vasti Boundary (6.1m)", assignment: "WO-BSSY-24018", vasti: "Vasti Unit 04-D", checkInTime: "07:48 AM" },
  { id: "W-303", name: "Meera Shinde", phone: "+91 98203 66124", role: "Sanitary Worker", sanstha: "Sanstha Prerna Swachhata Foundation", attendance: "Exception", geo: "Out of Geofence Boundary (180m)", assignment: "WO-BSSY-24018", vasti: "Vasti Unit 04-D", checkInTime: "08:05 AM" },
  { id: "W-304", name: "Kishore Pawar", phone: "+91 98204 77890", role: "Cart Operator", sanstha: "Sanstha Udaan Mahila Vikas", attendance: "Present", geo: "Within Vasti Boundary (3.8m)", assignment: "WO-BSSY-24021", vasti: "Vasti Unit 07-B", checkInTime: "07:30 AM" },
  { id: "W-305", name: "Santosh Gaikwad", phone: "+91 98209 11029", role: "Sanitary Worker", sanstha: "Sanstha Prerna Swachhata Foundation", attendance: "Exception", geo: "Late Check-in • Geofence Mismatch", assignment: "WO-BSSY-24018", vasti: "Vasti Unit 04-D", checkInTime: "09:18 AM" },
];

const INITIAL_WORK_ORDERS: WorkOrderItem[] = [
  {
    id: "WO-BSSY-24018",
    activity: "Vasti Lane Deep Sweeping & Waste Carting",
    ward: "Ward G/North (Dharavi)",
    beat: "Beat 12",
    vastiUnit: "Vasti Unit 04-D (Kala Killa)",
    sanstha: "Sanstha Prerna Swachhata Foundation",
    date: "Today",
    shift: "Morning (07:00 - 10:30)",
    workers: 3,
    assignedWorkers: ["Asha Kamble (W-301)", "Ravi Ghadge (W-302)"],
    status: "Under Ward Review",
    evidenceStatus: "Submitted",
    beforePhoto: "/images/garbage_before.jpg",
    afterPhoto: "/images/garbage_after.jpg",
    correctionNotes: "",
  },
  {
    id: "WO-BSSY-24019",
    activity: "Community Waste Bin Enclosure Sanitization",
    ward: "Ward G/North (Dharavi)",
    beat: "Beat 12",
    vastiUnit: "Vasti Unit 04-D (Kala Killa Cross Rd)",
    sanstha: "Sanstha Prerna Swachhata Foundation",
    date: "Today",
    shift: "Mid-Day (11:00 - 13:00)",
    workers: 2,
    assignedWorkers: ["Asha Kamble (W-301)"],
    status: "In Progress",
    evidenceStatus: "Draft",
    beforePhoto: "/images/garbage_before.jpg",
    correctionNotes: "",
  },
  {
    id: "WO-BSSY-24020",
    activity: "Drainage Edge Disinfection & Lime Powder Spray",
    ward: "Ward G/North (Dharavi)",
    beat: "Beat 12",
    vastiUnit: "Vasti Unit 04-D (Toilet Block #8)",
    sanstha: "Sanstha Prerna Swachhata Foundation",
    date: "Today",
    shift: "Afternoon (13:30 - 15:30)",
    workers: 2,
    assignedWorkers: ["Asha Kamble (W-301)"],
    status: "Assigned",
    evidenceStatus: "Draft",
    beforePhoto: "/images/garbage_before.jpg",
    correctionNotes: "",
  },
  {
    id: "WO-BSSY-24021",
    activity: "Community Pathway Waste Collection",
    ward: "Ward F/North (Matunga)",
    beat: "Beat 07A",
    vastiUnit: "Vasti Unit 07-B (Labour Camp)",
    sanstha: "Sanstha Udaan Mahila Vikas",
    date: "Today",
    shift: "Morning (07:00 - 14:00)",
    workers: 4,
    assignedWorkers: ["Kishore Pawar (W-304)"],
    status: "Assigned",
    evidenceStatus: "Draft",
    beforePhoto: "/images/garbage_before.jpg",
  },
  {
    id: "WO-BSSY-24023",
    activity: "Secondary Collection Point Clearing",
    ward: "Ward M/East (Govandi)",
    beat: "Beat 11D",
    vastiUnit: "Vasti Unit 11-A (Baiganwadi)",
    sanstha: "Sanstha Sakhi Kalyan Sanstha",
    date: "Today",
    shift: "Morning (07:00 - 14:00)",
    workers: 5,
    assignedWorkers: [],
    status: "Verified",
    evidenceStatus: "Verified",
    beforePhoto: "/images/garbage_before.jpg",
    afterPhoto: "/images/garbage_after.jpg",
  },
];

const INITIAL_GRIEVANCES: GrievanceItem[] = [
  {
    id: "GR-BSSY-2026-0891",
    category: "Garbage / Waste Accumulation",
    description: "Solid waste accumulated near community bin; overflowing plastic and vegetable scraps.",
    location: "Kala Killa Lane 4, near Water Point",
    vastiUnit: "Vasti Unit 04-D (Dharavi Beat 12)",
    ward: "Ward G/North (Dharavi)",
    sansthaAssigned: "Sanstha Prerna Swachhata Foundation",
    supervisor: "Shri Rajesh Sawant (BMC AHS)",
    citizenName: "Milind Deshmukh",
    citizenPhone: "+91 98201 33412",
    createdAt: "Today, 08:30 AM",
    status: "Under Ward Review",
    slaRemaining: "2h 45m",
    beforePhoto: "/images/garbage_before.jpg",
    afterPhoto: "/images/garbage_after.jpg",
    registeredBy: "Citizen (QR Scan)",
    isWardUnclear: false,
    timeline: [
      { title: "Citizen Scanned QR & Submitted Complaint", time: "08:30 AM", note: "Uploaded photo with GPS coordinates", actor: "Citizen" },
      { title: "Ward Officer Reviewed & Assigned to Sanstha", time: "08:35 AM", note: "Ward Officer assigned corrective task to Sanstha Prerna", actor: "Ward Officer" },
      { title: "Sanstha Coordinator Directed Field Crew", time: "08:45 AM", note: "Workers W-301 & W-302 dispatched to Kala Killa", actor: "Sanstha Coordinator" },
      { title: "Field Worker Completed Cleaning & Sanstha Submitted Evidence", time: "10:14 AM", note: "Uploaded post-sweep photo. Awaiting Ward Officer closure.", actor: "Sanstha Coordinator" },
    ],
  },
  {
    id: "GR-BSSY-2026-1102",
    category: "Overflowing Community Waste Bin",
    description: "Bin near primary health post overflowing onto sidewalk. Needs urgent carting.",
    location: "Kala Killa Cross Road 2, opp. Health Post",
    vastiUnit: "Vasti Unit 04-D (Dharavi Beat 12)",
    ward: "Ward G/North (Dharavi)",
    sansthaAssigned: "Sanstha Prerna Swachhata Foundation",
    supervisor: "Shri Rajesh Sawant (BMC AHS)",
    citizenName: "Sunita Kamble",
    citizenPhone: "+91 98334 11223",
    createdAt: "Today, 08:45 AM",
    status: "Assigned",
    slaRemaining: "3h 15m",
    beforePhoto: "/images/garbage_before.jpg",
    registeredBy: "Citizen (QR Scan)",
    isWardUnclear: false,
    timeline: [
      { title: "Citizen Scanned QR & Submitted Complaint", time: "08:45 AM", note: "QR code on standee #14 scanned", actor: "Citizen" },
      { title: "Ward Officer Reviewed & Assigned to Sanstha", time: "08:50 AM", note: "Forwarded to Sanstha Prerna coordinator", actor: "Ward Officer" },
    ],
  },
  {
    id: "GR-BSSY-2026-1103",
    category: "Unswept Slum Pathway",
    description: "Plastic pouches and dry leaves scattered across pedestrian alley.",
    location: "Matunga Labour Camp Lane 7",
    vastiUnit: "Vasti Unit 07-B (Dharavi Beat 14)",
    ward: "Ward G/North (Dharavi)",
    sansthaAssigned: "Sanstha Udaan Mahila Vikas",
    supervisor: "Shri Rajesh Sawant (BMC AHS)",
    citizenName: "Rakesh Gupta",
    citizenPhone: "+91 98205 66778",
    createdAt: "Today, 09:00 AM",
    status: "In Progress",
    slaRemaining: "3h 30m",
    beforePhoto: "/images/garbage_before.jpg",
    registeredBy: "Citizen (QR Scan)",
    isWardUnclear: false,
    timeline: [
      { title: "Citizen Registered via QR", time: "09:00 AM", note: "Complaint logged for lane 7", actor: "Citizen" },
      { title: "Sanstha Allocated Crew", time: "09:15 AM", note: "Sanitary workers deployed with brooms and hand-carts", actor: "Sanstha Coordinator" },
    ],
  },
  {
    id: "GR-BSSY-2026-1104",
    category: "Garbage / Waste Accumulation",
    description: "Wet waste piled near public tap; causing foul smell.",
    location: "Sion-Bandra Link Road, Gate 3",
    vastiUnit: "Vasti Unit 04-D (Dharavi Beat 12)",
    ward: "Ward G/North (Dharavi)",
    sansthaAssigned: "Sanstha Prerna Swachhata Foundation",
    supervisor: "Shri Rajesh Sawant (BMC AHS)",
    citizenName: "Amina Sheikh",
    citizenPhone: "+91 98199 44332",
    createdAt: "Today, 09:20 AM",
    status: "Assigned",
    slaRemaining: "3h 50m",
    beforePhoto: "/images/garbage_before.jpg",
    registeredBy: "Citizen (Form)",
    isWardUnclear: false,
    timeline: [
      { title: "Citizen Logged Complaint", time: "09:20 AM", note: "Photo attached via citizen form", actor: "Citizen" },
    ],
  },
  {
    id: "GR-BSSY-2026-1105",
    category: "Unswept Slum Pathway",
    description: "Vegetable waste from morning bazaar dumped along walkway.",
    location: "90 Feet Road Market Alley",
    vastiUnit: "Vasti Unit 05-A (Dharavi Beat 13)",
    ward: "Ward G/North (Dharavi)",
    sansthaAssigned: "Sanstha Sakhi Kalyan Sanstha",
    supervisor: "Shri Rajesh Sawant (BMC AHS)",
    citizenName: "Prakash More",
    citizenPhone: "+91 98670 12345",
    createdAt: "Today, 09:35 AM",
    status: "Closed",
    slaRemaining: "Resolved",
    beforePhoto: "/images/garbage_before.jpg",
    afterPhoto: "/images/garbage_after.jpg",
    registeredBy: "Citizen (QR Scan)",
    isWardUnclear: false,
    timeline: [
      { title: "Citizen Registered via QR", time: "09:35 AM", note: "Submitted via market standee QR", actor: "Citizen" },
      { title: "Sanstha Swept Pathway", time: "10:05 AM", note: "Collected 4 sacks of waste", actor: "Sanstha Coordinator" },
      { title: "Ward Officer Verified & Closed", time: "10:30 AM", note: "Post-cleaning inspection passed", actor: "Ward Officer" },
    ],
  },
  {
    id: "GR-BSSY-2026-1106",
    category: "Overflowing Community Waste Bin",
    description: "Secondary collection bin overflowed onto drain channel.",
    location: "Kala Killa Lane 9, near School #4",
    vastiUnit: "Vasti Unit 04-D (Dharavi Beat 12)",
    ward: "Ward G/North (Dharavi)",
    sansthaAssigned: "Sanstha Prerna Swachhata Foundation",
    supervisor: "Shri Rajesh Sawant (BMC AHS)",
    citizenName: "Deepak Shinde",
    citizenPhone: "+91 98211 55443",
    createdAt: "Today, 09:50 AM",
    status: "Assigned",
    slaRemaining: "4h 10m",
    beforePhoto: "/images/garbage_before.jpg",
    registeredBy: "Citizen (QR Scan)",
    isWardUnclear: false,
    timeline: [
      { title: "Citizen Logged via QR", time: "09:50 AM", note: "Standee scanned outside school", actor: "Citizen" },
    ],
  },
  {
    id: "GR-BSSY-2026-1107",
    category: "Garbage / Waste Accumulation",
    description: "Construction rubble and debris dumped overnight.",
    location: "Transit Camp Road, Sector 3",
    vastiUnit: "Vasti Unit 06-C (Dharavi Beat 14)",
    ward: "Ward G/North (Dharavi)",
    sansthaAssigned: "Sanstha Udaan Mahila Vikas",
    supervisor: "Shri Rajesh Sawant (BMC AHS)",
    citizenName: "Farhan Ansari",
    citizenPhone: "+91 98203 77889",
    createdAt: "Today, 10:00 AM",
    status: "In Progress",
    slaRemaining: "4h 25m",
    beforePhoto: "/images/garbage_before.jpg",
    registeredBy: "Citizen (Form)",
    isWardUnclear: false,
    timeline: [
      { title: "Citizen Logged Form", time: "10:00 AM", note: "Rubble accumulation flagged", actor: "Citizen" },
      { title: "Sanstha Crew Arrived", time: "10:20 AM", note: "Loading debris onto dumper", actor: "Sanstha Coordinator" },
    ],
  },
  {
    id: "GR-BSSY-2026-1108",
    category: "Unswept Slum Pathway",
    description: "Clogged narrow lane with domestic refuse.",
    location: "Kala Killa Lane 12, near Masjid",
    vastiUnit: "Vasti Unit 04-D (Dharavi Beat 12)",
    ward: "Ward G/North (Dharavi)",
    sansthaAssigned: "Sanstha Prerna Swachhata Foundation",
    supervisor: "Shri Rajesh Sawant (BMC AHS)",
    citizenName: "Imran Khan",
    citizenPhone: "+91 98209 88112",
    createdAt: "Today, 10:15 AM",
    status: "Under Ward Review",
    slaRemaining: "1h 45m",
    beforePhoto: "/images/garbage_before.jpg",
    afterPhoto: "/images/garbage_after.jpg",
    registeredBy: "Citizen (QR Scan)",
    isWardUnclear: false,
    timeline: [
      { title: "Citizen Scanned QR", time: "10:15 AM", note: "Uploaded photo", actor: "Citizen" },
      { title: "Sanstha Submitted Cleaned Photo", time: "11:00 AM", note: "Awaiting Ward Officer inspection", actor: "Sanstha Coordinator" },
    ],
  },
  {
    id: "GR-BSSY-2026-1109",
    category: "Overflowing Community Waste Bin",
    description: "Large green community container filled to capacity.",
    location: "Mahim Phatak boundary, Beat 12",
    vastiUnit: "Vasti Unit 04-D (Dharavi Beat 12)",
    ward: "Ward G/North (Dharavi)",
    sansthaAssigned: "Sanstha Prerna Swachhata Foundation",
    supervisor: "Shri Rajesh Sawant (BMC AHS)",
    citizenName: "Sanjay Jadhav",
    citizenPhone: "+91 98204 33221",
    createdAt: "Today, 10:30 AM",
    status: "Closed",
    slaRemaining: "Resolved",
    beforePhoto: "/images/garbage_before.jpg",
    afterPhoto: "/images/garbage_after.jpg",
    registeredBy: "Citizen (QR Scan)",
    isWardUnclear: false,
    timeline: [
      { title: "Citizen Logged Complaint", time: "10:30 AM", note: "Bin capacity exceeded", actor: "Citizen" },
      { title: "Sanstha Carted Waste", time: "11:15 AM", note: "Cleared with BMC compactor vehicle", actor: "Sanstha Coordinator" },
      { title: "Ward Officer Closed", time: "11:45 AM", note: "Verified clean", actor: "Ward Officer" },
    ],
  },
  {
    id: "GR-BSSY-2026-1110",
    category: "Garbage / Waste Accumulation",
    description: "Litter scattered near community toilet block #8.",
    location: "Kala Killa Lane 2, near Toilet Block",
    vastiUnit: "Vasti Unit 04-D (Dharavi Beat 12)",
    ward: "Ward G/North (Dharavi)",
    sansthaAssigned: "Sanstha Prerna Swachhata Foundation",
    supervisor: "Shri Rajesh Sawant (BMC AHS)",
    citizenName: "Varsha Patil",
    citizenPhone: "+91 98207 44556",
    createdAt: "Today, 10:45 AM",
    status: "Assigned",
    slaRemaining: "4h 50m",
    beforePhoto: "/images/garbage_before.jpg",
    registeredBy: "Citizen (QR Scan)",
    isWardUnclear: false,
    timeline: [
      { title: "Citizen Scanned QR", time: "10:45 AM", note: "Logged at toilet block standee", actor: "Citizen" },
    ],
  },
  {
    id: "GR-BSSY-2026-0902",
    category: "Unswept Pathway Waste",
    description: "Waste dumped near boundary lane, landmark unclear between Dharavi and Sion border.",
    location: "Near Railway Crossing border",
    vastiUnit: "Border Area (Unspecified)",
    ward: "Unassigned / Unclear",
    supervisor: "Awaiting BMC Assignment",
    citizenName: "Ganesh Kadam",
    citizenPhone: "+91 98202 99887",
    createdAt: "Today, 09:10 AM",
    status: "Unclear Ward / Unassigned",
    slaRemaining: "3h 20m",
    beforePhoto: "/images/garbage_before.jpg",
    registeredBy: "Citizen (Form)",
    isWardUnclear: true,
    timeline: [
      { title: "Citizen Submitted Form (Location Unclear)", time: "09:10 AM", note: "Location boundary unclear. Escalated to BMC Administrator for ward assignment.", actor: "Citizen" },
    ],
  },
];

const ROLE_NAV: Record<RoleType, { label: string; id: PageId; icon: LucideIcon }[]> = {
  "BMC Administrator": [
    { id: "dashboard", label: "Admin Hub & Setup", icon: LayoutDashboard },
    { id: "sansthas", label: "Sansthas Directory", icon: Building2 },
    { id: "workers", label: "Users & Workers", icon: Users },
    { id: "work-orders", label: "All Work Orders", icon: ClipboardCheck },
    { id: "grievances", label: "Grievances & Routing", icon: MessageSquareWarning },
    { id: "ward-performance", label: "Ward Performance", icon: BarChart3 },
  ],
  "Ward Officer / Supervisor": [
    { id: "dashboard", label: "Ward Operations", icon: LayoutDashboard },
    { id: "work-orders", label: "Create & Assign Order", icon: ClipboardCheck },
    { id: "evidence", label: "Review Evidence Queue", icon: FileClock },
    { id: "grievances", label: "Grievance Management", icon: MessageSquareWarning },
    { id: "attendance", label: "Attendance Exceptions", icon: MapPin },
  ],
  "Sanstha Coordinator": [
    { id: "dashboard", label: "Sanstha Dispatch", icon: LayoutDashboard },
    { id: "work-orders", label: "Received Work Orders", icon: ClipboardCheck },
    { id: "workers", label: "Assign Crew", icon: Users },
    { id: "attendance", label: "Worker Attendance", icon: MapPin },
    { id: "evidence", label: "Submit Evidence", icon: Camera },
    { id: "grievances", label: "Corrective Action Tasks", icon: MessageSquareWarning },
  ],
  "Field Worker": [
    { id: "dashboard", label: "Today's Task", icon: ClipboardCheck },
    { id: "attendance", label: "Mark Geo Attendance", icon: MapPin },
    { id: "evidence", label: "Before / After Photo Proof", icon: Camera },
  ],
  "Accounts Officer": [
    { id: "dashboard", label: "Financial Review", icon: LayoutDashboard },
    { id: "grant", label: "Grant Recommendation", icon: IndianRupee },
    { id: "finance", label: "SAP Dual-Entry Export", icon: WalletCards },
  ],
  Citizen: [
    { id: "citizen-service", label: "Report Waste (QR / Form)", icon: Camera },
    { id: "qr-lookup", label: "Track My Complaint", icon: Search },
  ],
};

export function BssyPlatform() {
  const [role, setRole] = useState<RoleType>("BMC Administrator");
  const [page, setPage] = useState<PageId>("dashboard");
  const [mobileOpen, setMobileOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  // Core Data
  const [sansthasList, setSansthasList] = useState<SansthaItem[]>(INITIAL_SANSTHAS);
  const [workersList, setWorkersList] = useState<WorkerItem[]>(INITIAL_WORKERS);
  const [workOrdersList, setWorkOrdersList] = useState<WorkOrderItem[]>(INITIAL_WORK_ORDERS);
  const [grievanceList, setGrievanceList] = useState<GrievanceItem[]>(INITIAL_GRIEVANCES);
  const [selectedGrievance, setSelectedGrievance] = useState<GrievanceItem>(INITIAL_GRIEVANCES[0]!);

  // Modals
  const [setupSansthaModal, setSetupSansthaModal] = useState(false);
  const [setupWorkerModal, setSetupWorkerModal] = useState(false);
  const [wardCreateWoModal, setWardCreateWoModal] = useState(false);
  const [assignWorkerModal, setAssignWorkerModal] = useState<WorkOrderItem | null>(null);
  const [rejectEvidenceModal, setRejectEvidenceModal] = useState<WorkOrderItem | null>(null);
  const [rejectGrievanceModal, setRejectGrievanceModal] = useState<GrievanceItem | null>(null);
  const [assignWardModal, setAssignWardModal] = useState<GrievanceItem | null>(null);
  const [wardAssignGrievanceModal, setWardAssignGrievanceModal] = useState<GrievanceItem | null>(null);
  const [selectedSansthaForGrievance, setSelectedSansthaForGrievance] = useState<string>("Sanstha Prerna Swachhata Foundation");

  // Forms
  const [newSansthaForm, setNewSansthaForm] = useState({ name: "", ward: "Ward G/North (Dharavi)", contactPerson: "", phone: "" });
  const [newWorkerForm, setNewWorkerForm] = useState({ name: "", phone: "", role: "Sanitary Worker", sanstha: "Sanstha Prerna Swachhata Foundation", vasti: "Vasti Unit 04-D" });
  const [wardWoForm, setWardWoForm] = useState({
    activity: "Vasti Lane Deep Sweeping & Waste Carting",
    ward: "Ward G/North (Dharavi)",
    beat: "Beat 12",
    vastiUnit: "Vasti Unit 04-D (Kala Killa)",
    sanstha: "Sanstha Prerna Swachhata Foundation",
    shift: "Morning (07:00 - 14:00)",
    workers: 3,
  });
  const [correctionReason, setCorrectionReason] = useState("");
  const [unclearWardSelection, setUnclearWardSelection] = useState("Ward G/North (Dharavi)");
  const [wardTab, setWardTab] = useState<"overview" | "gis-map">("gis-map");
  const [selectedMapComplaintId, setSelectedMapComplaintId] = useState<string>("GR-BSSY-2026-0891");

  const confirm = (msg: string) => {
    setToast(msg);
    window.setTimeout(() => setToast(null), 3200);
  };

  const handleRoleChange = (newRole: RoleType) => {
    setRole(newRole);
    setPage(newRole === "Citizen" ? "qr-lookup" : "dashboard");
    confirm(`Switched to ${newRole}`);
  };

  // 1. BMC Admin Sets up Sanstha
  const handleSetupSanstha = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSansthaForm.name) return;
    const item: SansthaItem = {
      id: `S-${100 + sansthasList.length + 1}`,
      name: newSansthaForm.name,
      ward: newSansthaForm.ward,
      contactPerson: newSansthaForm.contactPerson || "Lead Coordinator",
      phone: newSansthaForm.phone || "+91 98000 00000",
      activeUnits: 50,
      status: "Active",
    };
    setSansthasList([...sansthasList, item]);
    setSetupSansthaModal(false);
    confirm(`Sanstha ${item.name} onboarded!`);
  };

  // 2. BMC Admin Sets up Worker
  const handleSetupWorker = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWorkerForm.name) return;
    const item: WorkerItem = {
      id: `W-${300 + workersList.length + 1}`,
      name: newWorkerForm.name,
      phone: newWorkerForm.phone || "+91 98000 00000",
      role: newWorkerForm.role,
      sanstha: newWorkerForm.sanstha,
      attendance: "Present",
      geo: "Within Vasti Boundary (GPS Verified)",
      assignment: "WO-BSSY-24018",
      vasti: newWorkerForm.vasti,
      checkInTime: "08:00 AM",
    };
    setWorkersList([...workersList, item]);
    setSetupWorkerModal(false);
    confirm(`Worker ${item.name} registered under ${item.sanstha}!`);
  };

  // 3. Ward Officer Creates & Assigns Work Order to Sanstha
  const handleWardCreateWo = (e: React.FormEvent) => {
    e.preventDefault();
    const newWo: WorkOrderItem = {
      id: `WO-BSSY-240${workOrdersList.length + 19}`,
      activity: wardWoForm.activity,
      ward: wardWoForm.ward,
      beat: wardWoForm.beat,
      vastiUnit: wardWoForm.vastiUnit,
      sanstha: wardWoForm.sanstha,
      date: "Today",
      shift: wardWoForm.shift,
      workers: Number(wardWoForm.workers) || 3,
      assignedWorkers: [],
      status: "Assigned",
      evidenceStatus: "Draft",
      beforePhoto: "/images/garbage_before.jpg",
    };
    setWorkOrdersList([newWo, ...workOrdersList]);
    setWardCreateWoModal(false);
    confirm(`Work Order ${newWo.id} created & assigned to ${newWo.sanstha}!`);
    setPage("work-orders");
  };

  // 4. Sanstha Coordinator Assigns Workers
  const handleAssignWorkersToWo = (woId: string, workerNames: string[]) => {
    setWorkOrdersList(list =>
      list.map(wo => (wo.id === woId ? { ...wo, assignedWorkers: workerNames, status: "In Progress" } : wo))
    );
    setAssignWorkerModal(null);
    confirm(`Workers assigned to ${woId}. Activity marked In Progress!`);
  };

  // 5. Field Worker Submits Work Evidence
  const handleFieldWorkerSubmitEvidence = (woId: string) => {
    setWorkOrdersList(list =>
      list.map(wo =>
        wo.id === woId
          ? {
              ...wo,
              status: "Under Ward Review",
              evidenceStatus: "Submitted",
              afterPhoto: "/images/garbage_after.jpg",
              correctionNotes: "",
            }
          : wo
      )
    );
    confirm(`Evidence submitted for ${woId}. Forwarded to Ward Officer for review.`);
  };

  // 6. Ward Officer Reviews Evidence -> Accepts or Returns for Correction
  const handleWardOfficerAcceptEvidence = (woId: string) => {
    setWorkOrdersList(list =>
      list.map(wo => (wo.id === woId ? { ...wo, status: "Verified", evidenceStatus: "Verified" } : wo))
    );
    confirm(`Work Order ${woId} certified clean & marked VERIFIED!`);
  };

  const handleWardOfficerReturnEvidence = (woId: string, reason: string) => {
    setWorkOrdersList(list =>
      list.map(wo =>
        wo.id === woId
          ? {
              ...wo,
              status: "Returned for Correction",
              evidenceStatus: "Returned for Correction",
              correctionNotes: reason || "Surface waste remaining near boundary wall. Re-sweep required.",
            }
          : wo
      )
    );
    setRejectEvidenceModal(null);
    confirm(`Work Order ${woId} returned to Sanstha Coordinator for correction!`);
  };

  // 7. Sanstha Resubmits Corrected Evidence
  const handleSansthaResubmitEvidence = (woId: string) => {
    setWorkOrdersList(list =>
      list.map(wo =>
        wo.id === woId
          ? {
              ...wo,
              status: "Under Ward Review",
              evidenceStatus: "Submitted",
              afterPhoto: "/images/garbage_after.jpg",
              correctionNotes: "",
            }
          : wo
      )
    );
    confirm(`Corrected evidence for ${woId} resubmitted to Ward Officer!`);
  };

  // 8. Citizen Registers Complaint (QR or Form)
  const handleCitizenSubmitComplaint = (newComp: GrievanceItem) => {
    setGrievanceList([newComp, ...grievanceList]);
    setSelectedGrievance(newComp);
    confirm(`Complaint ${newComp.id} registered! Routed to Ward Officer.`);
    setPage("qr-lookup");
  };

  // 9. BMC Officer Assigns Unclear Complaint to Ward
  const handleBmcAssignWard = (grievanceId: string, targetWard: string) => {
    const updated = grievanceList.map(g => {
      if (g.id === grievanceId) {
        return {
          ...g,
          ward: targetWard,
          isWardUnclear: false,
          status: "Assigned" as Status,
          sansthaAssigned: targetWard.includes("G/North") ? "Sanstha Prerna Swachhata Foundation" : "Sanstha Udaan Mahila Vikas",
          supervisor: targetWard.includes("G/North") ? "Shri Rajesh Sawant (Ward Officer)" : "Smt. Priya Patil (Ward Officer)",
          timeline: [
            ...g.timeline,
            {
              title: "Ward Assigned by BMC Administrator",
              time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
              note: `Location resolved and assigned to ${targetWard}`,
              actor: "BMC Administrator",
            },
          ],
        };
      }
      return g;
    });
    setGrievanceList(updated);
    setAssignWardModal(null);
    confirm(`Complaint assigned to ${targetWard}! Ward Officer notified.`);
  };

  // 10. Ward Officer Assigns Corrective Action to Sanstha
  const handleWardOfficerAssignGrievanceWithSanstha = (grievanceId: string, chosenSanstha: string) => {
    let assignedGrievanceItem: GrievanceItem | undefined;
    const updated = grievanceList.map(g => {
      if (g.id === grievanceId) {
        assignedGrievanceItem = {
          ...g,
          sansthaAssigned: chosenSanstha,
          status: "In Progress" as Status,
          timeline: [
            ...g.timeline,
            {
              title: "Ward Officer Assigned Corrective Action to Sanstha",
              time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
              note: `Assigned to ${chosenSanstha} for on-ground clearance`,
              actor: "Ward Officer",
            },
          ],
        };
        return assignedGrievanceItem;
      }
      return g;
    });
    setGrievanceList(updated);

    // Also automatically create/link a Work Order under "Assigned Work Orders from Ward Officer"
    if (assignedGrievanceItem) {
      const g = assignedGrievanceItem;
      const linkedWo: WorkOrderItem = {
        id: `WO-GR-${g.id.replace("GR-BSSY-", "")}`,
        activity: `[Citizen Grievance Resolution] ${g.category}`,
        ward: g.ward || "Ward G/North (Dharavi)",
        beat: "Beat 12",
        vastiUnit: `${g.location} (${g.vastiUnit})`,
        sanstha: chosenSanstha,
        date: "Today",
        shift: "Emergency / On-Demand",
        workers: 2,
        assignedWorkers: [],
        status: "Assigned",
        evidenceStatus: "Draft",
        beforePhoto: g.beforePhoto || "/images/garbage_before.jpg",
      };
      setWorkOrdersList(prev => [linkedWo, ...prev.filter(w => w.id !== linkedWo.id)]);
    }

    setWardAssignGrievanceModal(null);
    confirm(`Grievance assigned to ${chosenSanstha}! New work order added to Sanstha queue.`);
  };

  // 11. Sanstha Submits Completion Evidence for Grievance
  const handleSansthaSubmitGrievanceProof = (grievanceId: string) => {
    const updated = grievanceList.map(g => {
      if (g.id === grievanceId) {
        return {
          ...g,
          status: "Under Ward Review" as Status,
          afterPhoto: "/images/garbage_after.jpg",
          correctionNotes: "",
          timeline: [
            ...g.timeline,
            {
              title: "Sanstha Submitted Cleanliness Evidence",
              time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
              note: "Field workers swept area and uploaded post-clean photo. Awaiting Ward Officer confirmation.",
              actor: "Sanstha Coordinator",
            },
          ],
        };
      }
      return g;
    });
    setGrievanceList(updated);
    confirm(`Sanstha uploaded completion proof! Forwarded to Ward Officer.`);
  };

  // 12. Ward Officer Reviews Grievance Response -> Closes or Returns for Action
  const handleWardOfficerCloseGrievance = (grievanceId: string) => {
    const updated = grievanceList.map(g => {
      if (g.id === grievanceId) {
        return {
          ...g,
          status: "Closed" as Status,
          timeline: [
            ...g.timeline,
            {
              title: "Ward Officer Confirmed Cleanliness & Closed Complaint",
              time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
              note: "Inspection verified. SMS update dispatched to citizen.",
              actor: "Ward Officer",
            },
          ],
        };
      }
      return g;
    });
    setGrievanceList(updated);
    confirm(`Grievance ${grievanceId} verified and CLOSED! Citizen status updated.`);
  };

  const handleWardOfficerReturnGrievance = (grievanceId: string, reason: string) => {
    const updated = grievanceList.map(g => {
      if (g.id === grievanceId) {
        return {
          ...g,
          status: "Returned for Correction" as Status,
          correctionNotes: reason || "Debris remaining near drain outlet. Further clearance required.",
          timeline: [
            ...g.timeline,
            {
              title: "Ward Officer Returned Complaint for Further Action",
              time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
              note: reason || "Debris remaining near drain outlet. Further clearance required.",
              actor: "Ward Officer",
            },
          ],
        };
      }
      return g;
    });
    setGrievanceList(updated);
    setRejectGrievanceModal(null);
    confirm(`Complaint returned to Sanstha for further cleaning!`);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-foreground flex flex-col font-sans">
      {/* Mobile Drawer */}
      {mobileOpen && (
        <button
          className="fixed inset-0 z-40 bg-slate-900/60 backdrop-blur-xs lg:hidden"
          onClick={() => setMobileOpen(false)}
          aria-label="Close menu"
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-[260px] flex-col bg-slate-900 text-slate-100 transition-transform duration-200 lg:translate-x-0 border-r border-slate-800",
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex h-16 items-center justify-between border-b border-slate-800 px-5 bg-slate-950/40">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-lg bg-blue-600 grid place-items-center text-white font-black text-xs">
              BMC
            </div>
            <div>
              <p className="font-display text-sm font-bold text-white tracking-wide">BSSY PORTAL</p>
              <p className="text-[10px] text-slate-400">Slum Sanitation Management</p>
            </div>
          </div>
          <button className="text-slate-400 hover:text-white lg:hidden" onClick={() => setMobileOpen(false)}>
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Current Role Card */}
        <div className="mx-3 mt-3 rounded-lg border border-slate-800 bg-slate-950/60 p-3 text-xs">
          <span className="text-[9px] uppercase font-bold text-slate-400">Logged in as:</span>
          <p className="font-bold text-white truncate">{role}</p>
        </div>

        {/* Action Button Based on Role */}
        <div className="px-3 mt-3">
          {role === "Citizen" && (
            <button
              onClick={() => setPage("citizen-service")}
              className="w-full flex items-center justify-center gap-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 py-2 text-xs font-bold text-white transition shadow-sm"
            >
              <Camera className="h-3.5 w-3.5" />
              Report Garbage (QR)
            </button>
          )}
        </div>

        {/* Navigation */}
        <nav className="mt-3 flex-1 overflow-y-auto px-2 space-y-1">
          <p className="px-3 text-[9px] font-bold uppercase tracking-wider text-slate-400 mb-1">
            Menu
          </p>
          {ROLE_NAV[role].map(item => {
            const Icon = item.icon;
            const active = page === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setPage(item.id);
                  setMobileOpen(false);
                }}
                className={cn(
                  "w-full flex items-center gap-2.5 rounded-lg px-3 py-2 text-left text-xs font-medium transition",
                  active ? "bg-blue-600 text-white font-bold" : "text-slate-300 hover:bg-slate-800 hover:text-white"
                )}
              >
                <Icon className={cn("h-4 w-4 shrink-0", active ? "text-white" : "text-slate-400")} />
                <span className="truncate">{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="p-3 border-t border-slate-800 text-[10px] text-slate-400 flex items-center justify-between">
          <span className="text-emerald-400 flex items-center gap-1 font-semibold">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
            Workflow Verified
          </span>
          <span>BSSY v5.4</span>
        </div>
      </aside>

      {/* Main Container */}
      <div className="lg:pl-[260px] flex-1 flex flex-col">
        {/* Header */}
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border bg-card/95 px-4 backdrop-blur sm:px-6">
          <div className="flex items-center gap-3">
            <button
              className="p-1.5 rounded-lg border border-border lg:hidden text-foreground"
              onClick={() => setMobileOpen(true)}
              aria-label="Open menu"
            >
              <Menu className="h-5 w-5" />
            </button>
            <div>
              <h2 className="font-display font-bold text-sm text-foreground">
                Brihanmumbai Swachhata Seva Yojana (BSSY)
              </h2>
              <p className="text-xs text-muted-foreground hidden sm:block">
                Digital Evidence & Monitoring Platform
              </p>
            </div>
          </div>

          {/* Role Switcher */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 rounded-lg border border-blue-500/30 bg-blue-50 dark:bg-blue-950/40 px-2.5 py-1.5">
              <UserRound className="h-3.5 w-3.5 text-blue-600" />
              <div className="text-left">
                <span className="block text-[8px] uppercase font-bold text-blue-600">Switch Role:</span>
                <select
                  value={role}
                  onChange={e => handleRoleChange(e.target.value as RoleType)}
                  className="bg-transparent text-xs font-bold text-foreground outline-none cursor-pointer"
                >
                  <option value="BMC Administrator">1. BMC Administrator (Sets Up Users/Sansthas)</option>
                  <option value="Ward Officer / Supervisor">2. Ward Officer (Assigns Sanstha & Reviews)</option>
                  <option value="Sanstha Coordinator">3. Sanstha Coordinator (Assigns Crew)</option>
                  <option value="Field Worker">4. Field Worker (Cleans & Uploads Proof)</option>
                  <option value="Accounts Officer">5. Accounts Officer (Financials)</option>
                  <option value="Citizen">6. Citizen (Reports via QR / Form)</option>
                </select>
              </div>
            </div>

            {role !== "Citizen" && (
              <button
                onClick={() => handleRoleChange("Citizen")}
                className="hidden md:inline-flex items-center gap-1 rounded-lg border border-border px-2.5 py-1.5 text-xs font-semibold text-foreground hover:bg-muted"
              >
                <QrCode className="h-3.5 w-3.5 text-emerald-600" />
                Citizen Portal
              </button>
            )}
          </div>
        </header>

        {/* Workflow Guide Bar */}
        <div className="bg-slate-900 text-white px-4 py-2 border-b border-slate-800 text-xs">
          <div className="mx-auto max-w-[1540px] flex items-center justify-between">
            <div className="flex items-center gap-2 overflow-x-auto py-0.5 text-slate-300">
              <span className="h-2 w-2 rounded-full bg-emerald-400 shrink-0" />
              <span className="font-bold text-white shrink-0">Workflow:</span>
              <span className="truncate">
                BMC Admin sets up Sansthas/Workers → Ward Officer assigns Work Order to Sanstha → Sanstha directs Field Workers → Field Workers clean & upload proof → Ward Officer accepts or returns → Citizen reports handled
              </span>
            </div>
            <span className="ml-2 font-mono text-[10px] text-blue-300 font-bold shrink-0">
              {role} View
            </span>
          </div>
        </div>

        {/* Main Body */}
        <main className="mx-auto max-w-[1540px] w-full px-4 py-5 sm:px-6 flex-1">
          {page === "dashboard" && (
            <>
              {/* 1. BMC ADMIN DASHBOARD */}
              {role === "BMC Administrator" && (
                <div className="space-y-5">
                  <div className="flex items-center justify-between border-b border-border pb-3">
                    <div>
                      <h1 className="font-display text-xl font-bold text-foreground">Administrator & Setup Hub</h1>
                      <p className="text-xs text-muted-foreground">Sets up users, Sansthas, workers, and monitors overall municipal operations</p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setSetupSansthaModal(true)}
                        className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg shadow"
                      >
                        + Set Up Sanstha
                      </button>
                      <button
                        onClick={() => setSetupWorkerModal(true)}
                        className="px-3 py-1.5 bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold rounded-lg shadow"
                      >
                        + Register Worker
                      </button>
                    </div>
                  </div>

                  {/* KPIs */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="rounded-xl border border-border bg-card p-4">
                      <span className="text-[10px] font-bold text-muted-foreground uppercase">Registered Sansthas</span>
                      <p className="text-2xl font-black text-foreground mt-0.5">{sansthasList.length}</p>
                      <span className="text-[10px] text-emerald-600 font-bold">Contracted CBOs</span>
                    </div>
                    <div className="rounded-xl border border-border bg-card p-4">
                      <span className="text-[10px] font-bold text-muted-foreground uppercase">Onboarded Workers</span>
                      <p className="text-2xl font-black text-foreground mt-0.5">{workersList.length}</p>
                      <span className="text-[10px] text-blue-600 font-bold">Biometric / Geo Bound</span>
                    </div>
                    <div className="rounded-xl border border-border bg-card p-4">
                      <span className="text-[10px] font-bold text-muted-foreground uppercase">Active Work Orders</span>
                      <p className="text-2xl font-black text-foreground mt-0.5">{workOrdersList.length}</p>
                      <span className="text-[10px] text-blue-600 font-bold">Across 24 Wards</span>
                    </div>
                    <div className="rounded-xl border border-border bg-card p-4">
                      <span className="text-[10px] font-bold text-muted-foreground uppercase">Unassigned Complaints</span>
                      <p className="text-2xl font-black text-foreground mt-0.5">
                        {grievanceList.filter(g => g.isWardUnclear).length}
                      </p>
                      <span className="text-[10px] text-amber-600 font-bold">Needs Ward Assignment</span>
                    </div>
                  </div>

                  {/* Unclear Complaints Assignment Section */}
                  {grievanceList.filter(g => g.isWardUnclear).length > 0 && (
                    <div className="rounded-xl border border-amber-300 bg-amber-50/50 dark:bg-amber-950/30 p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <AlertTriangle className="h-4 w-4 text-amber-600" />
                          <h3 className="font-bold text-sm text-foreground">
                            Citizen Complaints with Unclear Location (Action Required)
                          </h3>
                        </div>
                        <span className="text-xs font-bold text-amber-700 dark:text-amber-300">
                          {grievanceList.filter(g => g.isWardUnclear).length} Pending Assignment
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mb-3">
                        When location or ward is unclear, the complaint goes to BMC officer for assignment to the correct ward.
                      </p>
                      <div className="space-y-2">
                        {grievanceList.filter(g => g.isWardUnclear).map(g => (
                          <div key={g.id} className="p-3 bg-card border border-border rounded-lg flex items-center justify-between text-xs">
                            <div>
                              <span className="font-mono font-bold text-blue-600">{g.id}</span>
                              <p className="font-bold text-foreground">{g.category} - {g.location}</p>
                              <p className="text-muted-foreground text-[11px]">{g.description}</p>
                            </div>
                            <button
                              onClick={() => { setAssignWardModal(g); setUnclearWardSelection("Ward G/North (Dharavi)"); }}
                              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg shadow-xs"
                            >
                              Assign to Ward Officer
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Work Orders Oversight */}
                  <div className="rounded-xl border border-border bg-card p-4">
                    <div className="flex items-center justify-between mb-3 border-b border-border pb-2">
                      <h3 className="font-bold text-sm text-foreground">Active Work Orders</h3>
                      <button onClick={() => setPage("work-orders")} className="text-xs text-blue-600 font-bold hover:underline">
                        View All Orders →
                      </button>
                    </div>
                    <div className="overflow-x-auto text-xs">
                      <table className="w-full text-left">
                        <thead className="bg-muted/50 text-muted-foreground uppercase text-[10px]">
                          <tr>
                            <th className="p-2.5 w-12 text-center">S.No.</th>
                            <th className="p-2.5">Order ID</th>
                            <th className="p-2.5">Vasti Unit & Ward</th>
                            <th className="p-2.5">Assigned Sanstha</th>
                            <th className="p-2.5">Workers Assigned</th>
                            <th className="p-2.5">Status</th>
                            <th className="p-2.5 text-right">Evidence</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border/60">
                          {workOrdersList.map((wo, idx) => (
                            <tr key={wo.id} className="hover:bg-muted/40 transition">
                              <td className="p-2.5 font-bold text-center text-muted-foreground">{idx + 1}</td>
                              <td className="p-2.5 font-mono font-bold text-blue-600">{wo.id}</td>
                              <td className="p-2.5 font-semibold text-foreground">
                                {wo.vastiUnit}
                                <span className="block text-[10px] text-muted-foreground font-normal">{wo.ward}</span>
                              </td>
                              <td className="p-2.5 text-foreground">{wo.sanstha}</td>
                              <td className="p-2.5 text-muted-foreground">
                                {wo.assignedWorkers.length > 0 ? wo.assignedWorkers.join(", ") : `${wo.workers} Required (Pending Sanstha Assignment)`}
                              </td>
                              <td className="p-2.5"><StatusChip status={wo.status} /></td>
                              <td className="p-2.5 text-right"><StatusChip status={wo.evidenceStatus} /></td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* 2. WARD OFFICER DASHBOARD */}
              {role === "Ward Officer / Supervisor" && (
                <div className="space-y-5">
                  {/* Header Row */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-border pb-3 gap-3">
                    <div>
                      <h1 className="font-display text-xl font-bold text-foreground">Ward Officer / Supervisor Dashboard</h1>
                      <p className="text-xs text-muted-foreground">Creates and assigns work orders to Sansthas, reviews evidence, and manages complaints</p>
                    </div>
                    <button
                      onClick={() => setWardCreateWoModal(true)}
                      className="self-start sm:self-auto px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg shadow-sm flex items-center gap-1.5"
                    >
                      + Create & Assign Work Order
                    </button>
                  </div>

                  {/* Dedicated Sub-Tabs Bar Below Header */}
                  <div className="flex items-center gap-2 border-b border-border pb-2.5">
                    <button
                      onClick={() => setWardTab("gis-map")}
                      className={cn(
                        "px-4 py-2 rounded-lg font-bold text-xs transition flex items-center gap-2 border",
                        wardTab === "gis-map"
                          ? "bg-blue-600 text-white border-blue-600 shadow-xs"
                          : "bg-card text-muted-foreground border-border hover:bg-muted/60 hover:text-foreground"
                      )}
                    >
                      <Map className="h-4 w-4" />
                      GIS Map & Grievances
                      <span className={cn(
                        "text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold",
                        wardTab === "gis-map" ? "bg-white/20 text-white" : "bg-muted text-muted-foreground"
                      )}>
                        {grievanceList.length}
                      </span>
                    </button>

                    <button
                      onClick={() => setWardTab("overview")}
                      className={cn(
                        "px-4 py-2 rounded-lg font-bold text-xs transition flex items-center gap-2 border",
                        wardTab === "overview"
                          ? "bg-blue-600 text-white border-blue-600 shadow-xs"
                          : "bg-card text-muted-foreground border-border hover:bg-muted/60 hover:text-foreground"
                      )}
                    >
                      <ClipboardCheck className="h-4 w-4" />
                      Ward Operations & Verification
                      <span className={cn(
                        "text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold",
                        wardTab === "overview" ? "bg-white/20 text-white" : "bg-muted text-muted-foreground"
                      )}>
                        {workOrdersList.length}
                      </span>
                    </button>
                  </div>

                  {/* SUB-TAB 1: WARD OPERATIONS OVERVIEW */}
                  {wardTab === "overview" && (
                    <div className="space-y-6">
                    {/* 1. Evidence Review Section as a Structured Table */}
                    <div className="rounded-xl border border-border bg-card p-4 space-y-3">
                      <div className="flex items-center justify-between border-b border-border pb-2">
                        <div>
                          <h3 className="font-bold text-sm text-foreground">Evidence Review & Verification Queue</h3>
                          <p className="text-[11px] text-muted-foreground">Inspect field worker before/after photographic proof and certify work</p>
                        </div>
                        <span className="text-xs text-blue-600 font-bold bg-blue-50 dark:bg-blue-950/40 px-2 py-0.5 rounded border border-blue-200">
                          {workOrdersList.filter(wo => wo.status === "Under Ward Review").length} Awaiting Verification
                        </span>
                      </div>

                      {workOrdersList.filter(wo => wo.status === "Under Ward Review").length === 0 ? (
                        <p className="text-xs text-muted-foreground py-6 text-center">No work orders currently awaiting review.</p>
                      ) : (
                        <div className="overflow-x-auto text-xs">
                          <table className="w-full text-left">
                            <thead className="bg-muted/50 text-muted-foreground uppercase text-[10px]">
                              <tr>
                                <th className="p-2.5 w-12 text-center">S.No.</th>
                                <th className="p-2.5">Order ID & Activity</th>
                                <th className="p-2.5">Location & Ward</th>
                                <th className="p-2.5">Contracted Sanstha</th>
                                <th className="p-2.5 text-center">Before & After Evidence</th>
                                <th className="p-2.5 text-right">Actions</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-border/60">
                              {workOrdersList.filter(wo => wo.status === "Under Ward Review").map((wo, idx) => (
                                <tr key={wo.id} className="hover:bg-muted/30 transition">
                                  <td className="p-2.5 font-bold text-center text-muted-foreground">{idx + 1}</td>
                                  <td className="p-2.5">
                                    <span className="font-mono font-bold text-blue-600">{wo.id}</span>
                                    <p className="font-bold text-foreground">{wo.activity}</p>
                                    <StatusChip status="Under Ward Review" />
                                  </td>
                                  <td className="p-2.5">
                                    <span className="font-semibold text-foreground">{wo.vastiUnit}</span>
                                    <span className="block text-[11px] text-muted-foreground">{wo.ward}</span>
                                  </td>
                                  <td className="p-2.5 text-foreground font-medium">{wo.sanstha}</td>
                                  <td className="p-2.5">
                                    <div className="flex gap-2 justify-center">
                                      <div className="w-20 rounded overflow-hidden border border-border">
                                        <img src={wo.beforePhoto} alt="Before" className="h-12 w-full object-cover" />
                                        <span className="block p-0.5 bg-slate-900 text-white text-[8px] text-center font-bold">BEFORE</span>
                                      </div>
                                      <div className="w-20 rounded overflow-hidden border border-border">
                                        <img src={wo.afterPhoto || "/images/garbage_after.jpg"} alt="After" className="h-12 w-full object-cover" />
                                        <span className="block p-0.5 bg-emerald-800 text-white text-[8px] text-center font-bold">AFTER</span>
                                      </div>
                                    </div>
                                  </td>
                                  <td className="p-2.5 text-right">
                                    <div className="flex flex-col gap-1.5 items-end">
                                      <button
                                        onClick={() => handleWardOfficerAcceptEvidence(wo.id)}
                                        className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded shadow-xs"
                                      >
                                        ✓ Accept & Verify
                                      </button>
                                      <button
                                        onClick={() => { setRejectEvidenceModal(wo); setCorrectionReason(""); }}
                                        className="px-3 py-1 border border-rose-300 text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/30 font-bold rounded"
                                      >
                                        Return for Correction
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>

                    {/* 2. Ward Complaint Management Section as a Structured Table */}
                    <div className="rounded-xl border border-border bg-card p-4 space-y-3">
                      <div className="flex items-center justify-between border-b border-border pb-2">
                        <div>
                          <h3 className="font-bold text-sm text-foreground">Ward Complaint Management Register</h3>
                          <p className="text-[11px] text-muted-foreground">Review citizen reported issues, assign to Sansthas, and confirm closures</p>
                        </div>
                        <span className="text-xs text-amber-600 font-bold bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 rounded border border-amber-200">
                          {grievanceList.length} Total Complaints
                        </span>
                      </div>

                      <div className="overflow-x-auto text-xs">
                        <table className="w-full text-left">
                          <thead className="bg-muted/50 text-muted-foreground uppercase text-[10px]">
                            <tr>
                              <th className="p-2.5 w-12 text-center">S.No.</th>
                              <th className="p-2.5">Complaint ID & Category</th>
                              <th className="p-2.5">Location & Citizen</th>
                              <th className="p-2.5">Assigned Sanstha</th>
                              <th className="p-2.5">Status</th>
                              <th className="p-2.5 text-center">Photo Evidence</th>
                              <th className="p-2.5 text-right">Action</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-border/60">
                            {grievanceList.filter(g => !g.isWardUnclear).map((g, idx) => (
                              <tr key={g.id} className="hover:bg-muted/30 transition">
                                <td className="p-2.5 font-bold text-center text-muted-foreground">{idx + 1}</td>
                                <td className="p-2.5">
                                  <span className="font-mono font-bold text-blue-600">{g.id}</span>
                                  <p className="font-bold text-foreground">{g.category}</p>
                                  <span className="text-[10px] text-muted-foreground">{g.registeredBy}</span>
                                </td>
                                <td className="p-2.5">
                                  <p className="font-semibold text-foreground">{g.location}</p>
                                  <p className="text-[11px] text-muted-foreground">{g.citizenName} ({g.citizenPhone})</p>
                                </td>
                                <td className="p-2.5">
                                  <span className="font-medium text-foreground">{g.sansthaAssigned || "Unassigned"}</span>
                                </td>
                                <td className="p-2.5">
                                  <StatusChip status={g.status} />
                                  {g.status === "Returned for Correction" && (
                                    <span className="block text-[10px] text-rose-600 mt-1 max-w-[140px] truncate" title={g.correctionNotes}>
                                      Note: {g.correctionNotes}
                                    </span>
                                  )}
                                </td>
                                <td className="p-2.5 text-center">
                                  <div className="flex gap-1.5 justify-center">
                                    <div className="w-14 rounded overflow-hidden border border-border" title="Citizen Reported Before Photo">
                                      <img src={g.beforePhoto} alt="Before" className="h-10 w-full object-cover" />
                                      <span className="block text-[8px] bg-slate-900 text-white font-bold p-0.2">REPORTED</span>
                                    </div>
                                    {g.afterPhoto && (
                                      <div className="w-14 rounded overflow-hidden border border-border" title="Sanstha Cleaned After Photo">
                                        <img src={g.afterPhoto} alt="After" className="h-10 w-full object-cover" />
                                        <span className="block text-[8px] bg-emerald-800 text-white font-bold p-0.2">CLEANED</span>
                                      </div>
                                    )}
                                  </div>
                                </td>
                                <td className="p-2.5 text-right">
                                  {g.status === "Assigned" && (
                                    <button
                                      onClick={() => {
                                        setWardAssignGrievanceModal(g);
                                        setSelectedSansthaForGrievance(g.sansthaAssigned || "Sanstha Prerna Swachhata Foundation");
                                      }}
                                      className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded shadow-xs"
                                    >
                                      Assign to Sanstha →
                                    </button>
                                  )}

                                  {g.status === "Under Ward Review" && (
                                    <div className="flex flex-col gap-1 items-end">
                                      <button
                                        onClick={() => handleWardOfficerCloseGrievance(g.id)}
                                        className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded shadow-xs text-[11px]"
                                      >
                                        ✓ Confirm & Close
                                      </button>
                                      <button
                                        onClick={() => { setRejectGrievanceModal(g); setCorrectionReason(""); }}
                                        className="px-2.5 py-1 border border-rose-300 text-rose-700 hover:bg-rose-50 font-bold rounded text-[11px]"
                                      >
                                        Return for Action
                                      </button>
                                    </div>
                                  )}

                                  {g.status === "In Progress" && (
                                    <span className="text-[11px] text-blue-600 font-semibold">Sanstha in progress</span>
                                  )}

                                  {g.status === "Closed" && (
                                    <span className="text-[11px] text-emerald-600 font-bold">✓ Closed</span>
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* 3. Attendance Exceptions & Field Verification Register as a Structured Table */}
                    <div className="rounded-xl border border-border bg-card p-4 space-y-3">
                      <div className="flex items-center justify-between border-b border-border pb-2">
                        <div>
                          <h3 className="font-bold text-sm text-foreground">Attendance Exceptions & Geo-Fence Register</h3>
                          <p className="text-[11px] text-muted-foreground">Monitor daily biometric check-ins, geofence compliance, and attendance anomalies</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-rose-600 font-bold bg-rose-50 dark:bg-rose-950/40 px-2 py-0.5 rounded border border-rose-200">
                            {workersList.filter(w => w.attendance === "Exception").length} Exceptions Flagged
                          </span>
                          <button
                            onClick={() => setPage("attendance")}
                            className="text-xs text-blue-600 font-bold hover:underline"
                          >
                            Full Log →
                          </button>
                        </div>
                      </div>

                      <div className="overflow-x-auto text-xs">
                        <table className="w-full text-left">
                          <thead className="bg-muted/50 text-muted-foreground uppercase text-[10px]">
                            <tr>
                              <th className="p-2.5 w-12 text-center">S.No.</th>
                              <th className="p-2.5">Worker ID & Name</th>
                              <th className="p-2.5">Associated Sanstha</th>
                              <th className="p-2.5">Assigned Vasti Beat</th>
                              <th className="p-2.5">Check-In Time</th>
                              <th className="p-2.5">Geo-Fence Status</th>
                              <th className="p-2.5 text-right">Attendance Status</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-border/60">
                            {workersList.map((w, idx) => (
                              <tr key={w.id} className={cn("hover:bg-muted/30 transition", w.attendance === "Exception" && "bg-rose-50/40 dark:bg-rose-950/20")}>
                                <td className="p-2.5 font-bold text-center text-muted-foreground">{idx + 1}</td>
                                <td className="p-2.5">
                                  <span className="font-mono font-bold text-blue-600">{w.id}</span>
                                  <p className="font-bold text-foreground">{w.name}</p>
                                  <span className="text-[10px] text-muted-foreground">{w.role}</span>
                                </td>
                                <td className="p-2.5 font-medium text-foreground">{w.sanstha}</td>
                                <td className="p-2.5 text-foreground">{w.vasti}</td>
                                <td className="p-2.5 font-mono text-foreground">{w.checkInTime}</td>
                                <td className="p-2.5">
                                  <span className={cn(
                                    "font-medium text-[11px]",
                                    w.attendance === "Exception" ? "text-rose-600 font-bold" : "text-emerald-700 dark:text-emerald-400"
                                  )}>
                                    {w.geo}
                                  </span>
                                </td>
                                <td className="p-2.5 text-right">
                                  <StatusChip status={w.attendance} />
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                )}

                  {/* SUB-TAB 2: GIS MAP (1/3) & COMPLAINT LIST TABLE (2/3) */}
                  {wardTab === "gis-map" && (
                    <div className="space-y-4">
                      {/* Top Metric Bar */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                        <div className="p-3 rounded-xl border border-border bg-card">
                          <p className="text-muted-foreground text-[11px]">Total Geocoded Complaints</p>
                          <p className="text-lg font-bold text-foreground font-mono">{grievanceList.length}</p>
                        </div>
                        <div className="p-3 rounded-xl border border-border bg-card">
                          <p className="text-muted-foreground text-[11px]">Action Required / Assigned</p>
                          <p className="text-lg font-bold text-amber-600 font-mono">
                            {grievanceList.filter(g => g.status === "Assigned" || g.status === "In Progress").length}
                          </p>
                        </div>
                        <div className="p-3 rounded-xl border border-border bg-card">
                          <p className="text-muted-foreground text-[11px]">Under Verification</p>
                          <p className="text-lg font-bold text-blue-600 font-mono">
                            {grievanceList.filter(g => g.status === "Under Ward Review").length}
                          </p>
                        </div>
                        <div className="p-3 rounded-xl border border-border bg-card">
                          <p className="text-muted-foreground text-[11px]">Resolved & Closed</p>
                          <p className="text-lg font-bold text-emerald-600 font-mono">
                            {grievanceList.filter(g => g.status === "Closed").length}
                          </p>
                        </div>
                      </div>

                      {/* Main 1/3 (GIS Map) vs 2/3 (Complaints Table) Split Layout with Equal Heights */}
                      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
                        {/* 1/3 Area: GIS Map (4 of 12 columns on LG screens) - Matched Height Flex Card */}
                        <div className="lg:col-span-4 rounded-xl border border-border bg-card p-4 flex flex-col justify-between h-[460px]">
                          <div className="flex items-center justify-between border-b border-border pb-2 shrink-0">
                            <div className="flex items-center gap-1.5">
                              <Map className="h-4 w-4 text-blue-600" />
                              <h3 className="font-bold text-sm text-foreground">Ward Beat GIS Map</h3>
                            </div>
                            <span className="text-[10px] bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 px-2 py-0.5 rounded font-mono font-bold">
                              GPS Live: 19.0438° N
                            </span>
                          </div>

                          {/* Real Leaflet GIS Map Canvas taking flexible height */}
                          <div className="flex-1 my-2 flex flex-col min-h-0">
                            <div className="flex-1 min-h-[220px] rounded-lg overflow-hidden border border-border">
                              <LeafletGisMap
                                grievances={grievanceList.filter(g => !g.isWardUnclear)}
                                selectedId={selectedMapComplaintId}
                                onSelect={id => setSelectedMapComplaintId(id)}
                              />
                            </div>

                            {/* Active Pin Detail Card below Leaflet map */}
                            {(() => {
                              const activeItem = grievanceList.find(g => g.id === selectedMapComplaintId) || grievanceList[0]!;
                              return (
                                <div className="mt-2 p-2 bg-muted/40 border border-border rounded-lg text-xs space-y-0.5 shrink-0">
                                  <div className="flex justify-between items-center">
                                    <span className="font-mono font-bold text-blue-600">{activeItem.id}</span>
                                    <StatusChip status={activeItem.status} />
                                  </div>
                                  <p className="font-bold text-foreground text-xs truncate">{activeItem.category}</p>
                                  <p className="text-[11px] text-muted-foreground truncate">{activeItem.location}</p>
                                  <p className="text-[11px] truncate">
                                    <strong>Sanstha: </strong>
                                    <span className="text-foreground">{activeItem.sansthaAssigned || "Pending Selection"}</span>
                                  </p>
                                </div>
                              );
                            })()}
                          </div>

                          <div className="flex items-center justify-between text-[10px] text-muted-foreground pt-1.5 border-t border-border/60 shrink-0">
                            <span className="flex items-center gap-1">
                              <span className="h-2 w-2 rounded-full bg-rose-600" /> Pending/Assigned
                            </span>
                            <span className="flex items-center gap-1">
                              <span className="h-2 w-2 rounded-full bg-amber-500" /> Under Review
                            </span>
                            <span className="flex items-center gap-1">
                              <span className="h-2 w-2 rounded-full bg-emerald-600" /> Closed
                            </span>
                          </div>
                        </div>

                        {/* 2/3 Area: Complaints List & Status Table (8 of 12 columns on LG screens) - Shows 5 items before scrolling */}
                        <div className="lg:col-span-8 rounded-xl border border-border bg-card p-4 flex flex-col h-[460px]">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-border pb-2 gap-2 shrink-0">
                            <div>
                              <h3 className="font-bold text-sm text-foreground">Ward Complaints Register & Status</h3>
                              <p className="text-[11px] text-muted-foreground">
                                Scrollable queue (showing 5 items per view • {grievanceList.filter(g => !g.isWardUnclear).length} total complaints)
                              </p>
                            </div>
                            <span className="text-xs text-blue-600 font-bold bg-blue-50 dark:bg-blue-950/40 px-2 py-0.5 rounded border border-blue-200 self-start sm:self-auto">
                              {grievanceList.length} Geocoded Issues
                            </span>
                          </div>

                          {/* Scrollable Table Container displaying 5 items then scrolling smoothly */}
                          <div className="flex-1 overflow-y-auto overflow-x-auto text-xs mt-2 pr-1">
                            <table className="w-full text-left">
                              <thead className="sticky top-0 bg-card z-10 text-muted-foreground uppercase text-[10px] border-b border-border shadow-xs">
                                <tr>
                                  <th className="p-2.5">Map # / ID</th>
                                  <th className="p-2.5">Category & Location</th>
                                  <th className="p-2.5">Assigned Sanstha</th>
                                  <th className="p-2.5">Current Status</th>
                                  <th className="p-2.5 text-center">Evidence</th>
                                  <th className="p-2.5 text-right">Actions</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-border/60">
                                {grievanceList.filter(g => !g.isWardUnclear).map((g, idx) => {
                                  const isSelected = selectedMapComplaintId === g.id;
                                  return (
                                    <tr
                                      key={g.id}
                                      onClick={() => setSelectedMapComplaintId(g.id)}
                                      className={cn(
                                        "cursor-pointer transition",
                                        isSelected
                                          ? "bg-blue-50/70 dark:bg-blue-950/40 border-l-4 border-l-blue-600"
                                          : "hover:bg-muted/30"
                                      )}
                                    >
                                      <td className="p-2.5">
                                        <div className="flex items-center gap-1.5">
                                          <span className="h-4 w-4 rounded-full bg-slate-900 text-white text-[9px] font-bold grid place-items-center shrink-0">
                                            {idx + 1}
                                          </span>
                                          <span className="font-mono font-bold text-blue-600">{g.id}</span>
                                        </div>
                                        <span className="text-[10px] text-muted-foreground block ml-5">{g.registeredBy}</span>
                                      </td>
                                      <td className="p-2.5">
                                        <p className="font-bold text-foreground">{g.category}</p>
                                        <p className="text-[11px] text-muted-foreground">{g.location}</p>
                                      </td>
                                      <td className="p-2.5">
                                        <span className="font-medium text-foreground">{g.sansthaAssigned || "Unassigned"}</span>
                                        <span className="block text-[10px] text-muted-foreground">Ward G/North</span>
                                      </td>
                                      <td className="p-2.5">
                                        <StatusChip status={g.status} />
                                        {g.status === "Returned for Correction" && (
                                          <span className="block text-[10px] text-rose-600 mt-1 max-w-[130px] truncate" title={g.correctionNotes}>
                                            {g.correctionNotes}
                                          </span>
                                        )}
                                      </td>
                                      <td className="p-2.5 text-center">
                                        <div className="flex gap-1 justify-center">
                                          <div className="w-11 rounded overflow-hidden border border-border" title="Reported Before Photo">
                                            <img src={g.beforePhoto} alt="Before" className="h-8 w-full object-cover" />
                                          </div>
                                          {g.afterPhoto && (
                                            <div className="w-11 rounded overflow-hidden border border-border" title="Cleaned After Photo">
                                              <img src={g.afterPhoto} alt="After" className="h-8 w-full object-cover" />
                                            </div>
                                          )}
                                        </div>
                                      </td>
                                      <td className="p-2.5 text-right">
                                        {g.status === "Assigned" && (
                                          <button
                                            onClick={e => {
                                              e.stopPropagation();
                                              setWardAssignGrievanceModal(g);
                                              setSelectedSansthaForGrievance(g.sansthaAssigned || "Sanstha Prerna Swachhata Foundation");
                                            }}
                                            className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded shadow-xs text-[11px]"
                                          >
                                            Assign Sanstha →
                                          </button>
                                        )}

                                        {g.status === "Under Ward Review" && (
                                          <div className="flex flex-col gap-1 items-end" onClick={e => e.stopPropagation()}>
                                            <button
                                              onClick={() => handleWardOfficerCloseGrievance(g.id)}
                                              className="px-2 py-0.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded shadow-xs text-[10px]"
                                            >
                                              ✓ Confirm & Close
                                            </button>
                                            <button
                                              onClick={() => { setRejectGrievanceModal(g); setCorrectionReason(""); }}
                                              className="px-2 py-0.5 border border-rose-300 text-rose-700 hover:bg-rose-50 font-bold rounded text-[10px]"
                                            >
                                              Return
                                            </button>
                                          </div>
                                        )}

                                        {g.status === "In Progress" && (
                                          <span className="text-[10px] text-blue-600 font-semibold">Sanstha in progress</span>
                                        )}

                                        {g.status === "Closed" && (
                                          <span className="text-[10px] text-emerald-600 font-bold">✓ Closed</span>
                                        )}
                                      </td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* 3. SANSTHA COORDINATOR DASHBOARD */}
              {role === "Sanstha Coordinator" && (
                <div className="space-y-5">
                  <div className="border-b border-border pb-3">
                    <span className="text-xs font-bold text-blue-600 uppercase">Sanstha Coordinator</span>
                    <h1 className="font-display text-xl font-bold text-foreground">Sanstha Prerna Swachhata Foundation</h1>
                    <p className="text-xs text-muted-foreground">Receives assigned work, coordinates Field Workers, submits evidence and responds to corrections</p>
                  </div>

                  {/* Sanstha Coordinator Assigned Work Orders Table */}
                  <div className="rounded-xl border border-border bg-card p-5 space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-border pb-3 gap-2">
                      <div>
                        <h3 className="font-bold text-base text-foreground">Assigned Work Orders & Grievance Actions</h3>
                        <p className="text-xs text-muted-foreground">All routine cleaning beats and emergency grievance tasks dispatched to your Sanstha</p>
                      </div>
                      <div className="flex gap-2 items-center">
                        <span className="text-xs text-blue-600 font-bold bg-blue-50 dark:bg-blue-950/40 px-2.5 py-1 rounded border border-blue-200">
                          {workOrdersList.length} Active Work Orders
                        </span>
                      </div>
                    </div>

                    <div className="overflow-x-auto text-xs">
                      <table className="w-full text-left">
                        <thead className="bg-muted/50 text-muted-foreground uppercase text-[10px]">
                          <tr>
                            <th className="p-2.5">Work Order ID & Task</th>
                            <th className="p-2.5">Location / Vasti</th>
                            <th className="p-2.5">Assigned Field Crew</th>
                            <th className="p-2.5">Status</th>
                            <th className="p-2.5 text-right">Sanstha Action Required</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border/60">
                          {workOrdersList.map(wo => (
                            <tr key={wo.id} className="hover:bg-muted/30 transition">
                              <td className="p-2.5">
                                <span className="font-mono font-bold text-blue-600">{wo.id}</span>
                                <p className="font-bold text-foreground">{wo.activity}</p>
                                <span className="text-[10px] text-muted-foreground">Shift: {wo.shift}</span>
                              </td>
                              <td className="p-2.5">
                                <span className="font-semibold text-foreground">{wo.vastiUnit}</span>
                                <span className="block text-[11px] text-muted-foreground">{wo.ward}</span>
                              </td>
                              <td className="p-2.5">
                                {wo.assignedWorkers.length > 0 ? (
                                  <span className="text-emerald-700 dark:text-emerald-400 font-medium">
                                    ✓ {wo.assignedWorkers.join(", ")}
                                  </span>
                                ) : (
                                  <span className="text-amber-600 font-medium">Pending Worker Allocation ({wo.workers} Required)</span>
                                )}
                              </td>
                              <td className="p-2.5">
                                <StatusChip status={wo.status} />
                                {wo.status === "Returned for Correction" && (
                                  <span className="block text-[10px] text-rose-600 mt-1 max-w-[150px] font-semibold" title={wo.correctionNotes}>
                                    ⚠️ Correction: {wo.correctionNotes}
                                  </span>
                                )}
                              </td>
                              <td className="p-2.5 text-right">
                                {wo.status === "Assigned" && (
                                  <button
                                    onClick={() => setAssignWorkerModal(wo)}
                                    className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded shadow-xs"
                                  >
                                    Assign Field Workers →
                                  </button>
                                )}

                                {wo.status === "Returned for Correction" && (
                                  <button
                                    onClick={() => handleSansthaResubmitEvidence(wo.id)}
                                    className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded shadow-xs"
                                  >
                                    Resubmit Corrected Proof →
                                  </button>
                                )}

                                {wo.status === "In Progress" && (
                                  <div className="flex flex-col gap-1 items-end">
                                    <span className="text-[11px] text-blue-600 font-medium">Workers deployed</span>
                                    <button
                                      onClick={() => handleFieldWorkerSubmitEvidence(wo.id)}
                                      className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded shadow-xs text-[11px] flex items-center gap-1"
                                    >
                                      <Camera className="h-3 w-3" />
                                      Submit Evidence
                                    </button>
                                  </div>
                                )}

                                {wo.status === "Under Ward Review" && (
                                  <span className="text-[11px] text-blue-600 font-semibold">Evidence Submitted • Awaiting Ward Approval</span>
                                )}

                                {wo.status === "Verified" && (
                                  <span className="text-[11px] text-emerald-600 font-bold">✓ Verified by Ward Officer</span>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* 4. FIELD WORKER DASHBOARD (INDIVIDUAL WORKER PORTAL - ASHA KAMBLE W-301) */}
              {role === "Field Worker" && (() => {
                const activeWorker = workersList.find(w => w.id === "W-301") || {
                  id: "W-301",
                  name: "Asha Kamble",
                  phone: "+91 98201 44512",
                  role: "Sanitary Lead",
                  sanstha: "Sanstha Prerna Swachhata Foundation",
                  attendance: "Present" as const,
                  geo: "Within Vasti Boundary (4.2m)",
                  assignment: "WO-BSSY-24018",
                  vasti: "Vasti Unit 04-D",
                  checkInTime: "07:42 AM",
                };

                // Filter tasks strictly assigned to Asha Kamble (multiple tasks on the same day)
                const workerTasks = workOrdersList.filter(wo =>
                  wo.assignedWorkers && wo.assignedWorkers.some(w => w.includes("W-301") || w.includes("Asha Kamble"))
                );

                return (
                  <div className="space-y-5 text-xs max-w-5xl mx-auto">
                    {/* Worker Profile Header Card */}
                    <div className="rounded-xl border border-border bg-card p-4 sm:p-5 shadow-xs">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-4">
                        <div className="flex items-center gap-3.5">
                          <div className="h-12 w-12 rounded-full bg-blue-600 text-white font-bold text-base flex items-center justify-center shrink-0 shadow-xs">
                            AK
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h2 className="font-display font-bold text-base sm:text-lg text-foreground">
                                {activeWorker.name}
                              </h2>
                              <span className="font-mono text-[11px] font-bold px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                                {activeWorker.id}
                              </span>
                            </div>
                            <p className="text-muted-foreground text-xs">
                              {activeWorker.role} • {activeWorker.sanstha}
                            </p>
                            <p className="text-[11px] text-muted-foreground font-mono">
                              Mobile: {activeWorker.phone} • Assigned Beat: Dharavi Beat 12 ({activeWorker.vasti})
                            </p>
                          </div>
                        </div>

                        <div className="flex flex-col items-start sm:items-end gap-1.5 shrink-0 bg-muted/30 sm:bg-transparent p-3 sm:p-0 rounded-lg">
                          <div className="flex items-center gap-2">
                            <span className="text-[11px] text-muted-foreground">My Today's Status:</span>
                            <StatusChip status={activeWorker.attendance} />
                          </div>
                          <span className="text-[11px] text-muted-foreground font-mono">
                            Check-in: <strong className="text-foreground">{activeWorker.checkInTime}</strong>
                          </span>
                        </div>
                      </div>

                      {/* Confidentiality & Geo Presence Strip */}
                      <div className="mt-3 pt-1 flex flex-col md:flex-row md:items-center justify-between gap-3 text-[11px]">
                        <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400 font-medium">
                          <MapPin className="h-4 w-4 shrink-0 text-emerald-600" />
                          <span>
                            <strong>Geo Verification:</strong> 19.0438° N, 72.8541° E (Within Vasti Unit 04-D boundary • 4.2m)
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => {
                              setWorkersList(prev =>
                                prev.map(w =>
                                  w.id === "W-301"
                                    ? {
                                        ...w,
                                        attendance: "Present",
                                        geo: "Within Vasti Boundary (4.2m - Re-verified)",
                                        checkInTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                                      }
                                    : w
                                )
                              );
                              confirm("Geo-attendance re-verified successfully for Asha Kamble (W-301)!");
                            }}
                            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg shadow-xs flex items-center gap-1.5 transition text-xs"
                          >
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            Mark / Re-verify My Attendance
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Quick Summary Metrics */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      <div className="rounded-xl border border-border bg-card p-3.5">
                        <span className="text-muted-foreground text-[10px] uppercase font-bold tracking-wider">Today's Assigned Tasks</span>
                        <p className="text-xl font-display font-bold text-foreground mt-1">{workerTasks.length} Tasks</p>
                        <span className="text-[10px] text-blue-600 font-medium">Same-Day Schedule</span>
                      </div>
                      <div className="rounded-xl border border-border bg-card p-3.5">
                        <span className="text-muted-foreground text-[10px] uppercase font-bold tracking-wider">Tasks Completed / In Review</span>
                        <p className="text-xl font-display font-bold text-emerald-600 mt-1">
                          {workerTasks.filter(t => t.status === "Under Ward Review" || t.status === "Verified").length}
                        </p>
                        <span className="text-[10px] text-muted-foreground">Evidence Submitted</span>
                      </div>
                      <div className="rounded-xl border border-border bg-card p-3.5">
                        <span className="text-muted-foreground text-[10px] uppercase font-bold tracking-wider">Pending Execution</span>
                        <p className="text-xl font-display font-bold text-amber-600 mt-1">
                          {workerTasks.filter(t => t.status === "In Progress" || t.status === "Assigned").length}
                        </p>
                        <span className="text-[10px] text-muted-foreground">Awaiting Clean/Proof</span>
                      </div>
                      <div className="rounded-xl border border-border bg-card p-3.5">
                        <span className="text-muted-foreground text-[10px] uppercase font-bold tracking-wider">Attendance Compliance</span>
                        <p className="text-xl font-display font-bold text-emerald-600 mt-1">100%</p>
                        <span className="text-[10px] text-emerald-600 font-medium">Geo-fence Matched</span>
                      </div>
                    </div>

                    {/* Section: Today's Assigned Multiple Tasks */}
                    <div className="rounded-xl border border-border bg-card overflow-hidden shadow-xs">
                      <div className="p-4 border-b border-border bg-muted/20 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div>
                          <h3 className="font-bold text-sm text-foreground flex items-center gap-2">
                            <ClipboardCheck className="h-4 w-4 text-blue-600" />
                            My Today's Assigned Tasks (Multiple Tasks Today)
                          </h3>
                          <p className="text-muted-foreground text-[11px]">
                            Sequential tasks assigned to Asha Kamble across morning, mid-day, and afternoon shifts
                          </p>
                        </div>
                        <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-blue-50 dark:bg-blue-950/60 text-blue-600 border border-blue-200 dark:border-blue-900 w-fit">
                          {workerTasks.length} Active Tasks Assigned Today
                        </span>
                      </div>

                      <div className="overflow-x-auto">
                        <table className="w-full text-left">
                          <thead className="bg-muted/50 text-muted-foreground uppercase text-[10px] border-b border-border">
                            <tr>
                              <th className="p-3 w-12 text-center">S.No.</th>
                              <th className="p-3">Order ID</th>
                              <th className="p-3">Task / Activity</th>
                              <th className="p-3">Shift & Schedule</th>
                              <th className="p-3">Assigned Location</th>
                              <th className="p-3">Status</th>
                              <th className="p-3 text-right">Work Evidence Action</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-border/60">
                            {workerTasks.map((t, idx) => (
                              <tr key={t.id} className="hover:bg-muted/30 transition">
                                <td className="p-3 font-bold text-center text-muted-foreground">{idx + 1}</td>
                                <td className="p-3 font-mono font-bold text-blue-600">{t.id}</td>
                                <td className="p-3">
                                  <p className="font-bold text-foreground">{t.activity}</p>
                                  <span className="text-[10px] text-muted-foreground font-medium">Assigned to: Asha Kamble (W-301)</span>
                                </td>
                                <td className="p-3 font-medium text-foreground">
                                  <span className="inline-flex items-center gap-1 font-mono text-[11px]">
                                    <Clock className="h-3 w-3 text-muted-foreground" />
                                    {t.shift}
                                  </span>
                                </td>
                                <td className="p-3 text-foreground">
                                  <p className="font-medium">{t.vastiUnit}</p>
                                  <span className="text-[10px] text-muted-foreground">{t.ward}</span>
                                </td>
                                <td className="p-3">
                                  <StatusChip status={t.status} />
                                </td>
                                <td className="p-3 text-right">
                                  {t.status === "Assigned" && (
                                    <button
                                      onClick={() => {
                                        setWorkOrdersList(list =>
                                          list.map(wo => wo.id === t.id ? { ...wo, status: "In Progress" } : wo)
                                        );
                                        confirm(`Task ${t.id} started!`);
                                      }}
                                      className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg shadow-xs text-xs"
                                    >
                                      Start Cleaning
                                    </button>
                                  )}

                                  {t.status === "In Progress" && (
                                    <button
                                      onClick={() => handleFieldWorkerSubmitEvidence(t.id)}
                                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg shadow-xs text-xs flex items-center gap-1.5 ml-auto"
                                    >
                                      <Camera className="h-3.5 w-3.5" />
                                      Submit Proof
                                    </button>
                                  )}

                                  {t.status === "Under Ward Review" && (
                                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-600 bg-amber-50 dark:bg-amber-950/40 px-2 py-1 rounded border border-amber-200">
                                      <FileClock className="h-3 w-3" />
                                      Evidence In Review
                                    </span>
                                  )}

                                  {t.status === "Verified" && (
                                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-1 rounded border border-emerald-200">
                                      <CheckCircle2 className="h-3 w-3" />
                                      Passed & Verified
                                    </span>
                                  )}

                                  {t.status === "Returned for Correction" && (
                                    <button
                                      onClick={() => handleFieldWorkerSubmitEvidence(t.id)}
                                      className="px-2.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-lg shadow-xs text-xs flex items-center gap-1 ml-auto"
                                    >
                                      <Camera className="h-3 w-3" />
                                      Re-upload Proof
                                    </button>
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* Section: Live Task Proof Submission Box */}
                    <div className="rounded-xl border border-border bg-card p-4 sm:p-5 space-y-3 shadow-xs">
                      <div className="border-b border-border pb-2 flex items-center justify-between">
                        <div>
                          <h3 className="font-bold text-sm text-foreground flex items-center gap-2">
                            <Camera className="h-4 w-4 text-blue-600" />
                            Work Photographic Proof Submission
                          </h3>
                          <p className="text-muted-foreground text-[11px]">
                            Live geo-tagged photographic evidence for your assigned active tasks
                          </p>
                        </div>
                        <span className="text-[10px] text-muted-foreground font-mono">
                          Auto Geo-Stamp: 19.0438° N, 72.8541° E
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                        <div className="rounded-lg overflow-hidden border border-border bg-muted/20">
                          <img src="/images/garbage_before.jpg" alt="Before Cleaning" className="h-36 w-full object-cover" />
                          <div className="p-2 bg-slate-900 text-white flex justify-between items-center text-[10px]">
                            <span className="font-bold">1. BEFORE PHOTO (Pre-cleaning)</span>
                            <span className="text-slate-400 font-mono">07:45 AM • Geo-stamped</span>
                          </div>
                        </div>
                        <div className="rounded-lg overflow-hidden border border-border bg-muted/20">
                          <img src="/images/garbage_after.jpg" alt="After Cleaning" className="h-36 w-full object-cover" />
                          <div className="p-2 bg-emerald-800 text-white flex justify-between items-center text-[10px]">
                            <span className="font-bold">2. AFTER PHOTO (Completed)</span>
                            <span className="text-emerald-200 font-mono">10:14 AM • Geo-stamped</span>
                          </div>
                        </div>
                      </div>

                      <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 bg-muted/30 p-3 rounded-lg">
                        <div className="text-[11px] text-muted-foreground">
                          Select one of your active tasks above or submit evidence for current task (<strong>WO-BSSY-24018 / 24019</strong>)
                        </div>
                        <button
                          onClick={() => handleFieldWorkerSubmitEvidence("WO-BSSY-24019")}
                          className="w-full sm:w-auto px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg shadow-xs flex items-center justify-center gap-1.5 transition text-xs"
                        >
                          <Camera className="h-4 w-4" />
                          Submit Evidence for Task WO-BSSY-24019
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* 5. ACCOUNTS OFFICER DASHBOARD */}
              {role === "Accounts Officer" && (
                <div className="space-y-5">
                  <div className="flex items-center justify-between border-b border-border pb-3">
                    <div>
                      <h1 className="font-display text-xl font-bold text-foreground">Accounts Officer Review</h1>
                      <p className="text-xs text-muted-foreground">Reviews completed work records and supporting evidence, then forwards for financial review</p>
                    </div>
                    <button
                      onClick={() => confirm("Work record package validated and forwarded for financial approval!")}
                      className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg shadow"
                    >
                      Forward for Financial Review
                    </button>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2 text-xs">
                    <div className="rounded-xl border border-border bg-card p-4 space-y-3">
                      <h3 className="font-bold text-sm text-foreground border-b border-border pb-2">Completed Work Verification Packages</h3>
                      <div className="p-3 border border-border rounded-lg space-y-1.5">
                        <div className="flex justify-between font-bold">
                          <span>Sanstha Prerna Swachhata Foundation</span>
                          <span className="text-emerald-600">Verified</span>
                        </div>
                        <p className="text-muted-foreground">Ward G/North • WO-BSSY-24018 • 148 Vasti Units</p>
                        <p className="text-foreground">Attendance: <strong>96% Present</strong> • Evidence: <strong>Certified Clean</strong></p>
                        <p className="font-mono text-emerald-600 font-bold text-sm pt-1">Grant Recommendation: ₹ 6,50,000</p>
                      </div>
                    </div>

                    <div className="rounded-xl border border-border bg-card p-4 space-y-3">
                      <h3 className="font-bold text-sm text-foreground border-b border-border pb-2">SAP ERP Dual-Entry Posting Register</h3>
                      <div className="p-3 bg-muted/40 rounded-lg font-mono space-y-1">
                        <p><span className="text-blue-600 font-bold">PK 40 (Debit):</span> G/L 4101002 (Slum SWM) - ₹ 6,50,000</p>
                        <p><span className="text-emerald-600 font-bold">PK 50 (Credit):</span> G/L 2102001 (Sanstha Vendor) - ₹ 6,50,000</p>
                      </div>
                      <button
                        onClick={() => confirm("SAP CSV Export generated!")}
                        className="w-full py-2 border border-border text-foreground hover:bg-muted font-bold rounded-lg"
                      >
                        Download SAP CSV Export (44 Fields)
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}

          {/* CITIZEN SERVICE PAGE (REPORT WASTE VIA QR OR FORM) */}
          {page === "citizen-service" && (
            <CitizenServiceView onSubmit={handleCitizenSubmitComplaint} />
          )}

          {/* CITIZEN LOOKUP PAGE */}
          {page === "qr-lookup" && (
            <CitizenLookupView
              grievances={grievanceList}
              onNew={() => setPage("citizen-service")}
            />
          )}

          {/* OTHER DIRECT MODULES */}
          {page === "work-orders" && (
            <div className="space-y-4 text-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-border pb-3 gap-2">
                <div>
                  <h2 className="font-display font-bold text-base text-foreground">Municipal Work Orders Directory</h2>
                  <p className="text-muted-foreground text-[11px]">Comprehensive list of all routine beat cleaning and corrective grievance work orders</p>
                </div>
                {role === "Ward Officer / Supervisor" && (
                  <button onClick={() => setWardCreateWoModal(true)} className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg shadow-xs flex items-center gap-1.5">
                    <ClipboardCheck className="h-3.5 w-3.5" />
                    + Assign Work Order
                  </button>
                )}
              </div>

              <div className="border border-border rounded-xl bg-card overflow-hidden shadow-xs">
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead className="bg-muted/60 text-muted-foreground uppercase text-[10px] border-b border-border">
                      <tr>
                        <th className="p-3 w-12 text-center">S.No.</th>
                        <th className="p-3">Order ID</th>
                        <th className="p-3">Task / Activity</th>
                        <th className="p-3">Location & Ward</th>
                        <th className="p-3">Assigned Sanstha</th>
                        <th className="p-3">Shift & Workers</th>
                        <th className="p-3">Status</th>
                        <th className="p-3 text-right">Evidence Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/60">
                      {workOrdersList.map((wo, idx) => (
                        <tr key={wo.id} className="hover:bg-muted/30 transition">
                          <td className="p-3 font-bold text-center text-muted-foreground">{idx + 1}</td>
                          <td className="p-3 font-mono font-bold text-blue-600">{wo.id}</td>
                          <td className="p-3 font-bold text-foreground">{wo.activity}</td>
                          <td className="p-3">
                            <span className="font-semibold text-foreground">{wo.vastiUnit}</span>
                            <span className="block text-[11px] text-muted-foreground">{wo.ward}</span>
                          </td>
                          <td className="p-3 text-foreground font-medium">{wo.sanstha}</td>
                          <td className="p-3">
                            <span className="text-foreground">{wo.shift}</span>
                            <span className="block text-[11px] text-muted-foreground">
                              {wo.assignedWorkers.length > 0 ? `Crew: ${wo.assignedWorkers.join(", ")}` : `${wo.workers} Required`}
                            </span>
                          </td>
                          <td className="p-3"><StatusChip status={wo.status} /></td>
                          <td className="p-3 text-right"><StatusChip status={wo.evidenceStatus} /></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {page === "sansthas" && (
            <div className="space-y-4 text-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-border pb-3 gap-2">
                <div>
                  <h2 className="font-display font-bold text-base text-foreground">Registered Sansthas Directory (Contracted CBOs)</h2>
                  <p className="text-muted-foreground text-[11px]">Authorised community-based organisations delivering sanitation operations under BSSY</p>
                </div>
                {role === "BMC Administrator" && (
                  <button onClick={() => setSetupSansthaModal(true)} className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg shadow-xs flex items-center gap-1.5">
                    <Building2 className="h-3.5 w-3.5" />
                    + Set Up Sanstha
                  </button>
                )}
              </div>

              <div className="border border-border rounded-xl bg-card overflow-hidden shadow-xs">
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead className="bg-muted/60 text-muted-foreground uppercase text-[10px] border-b border-border">
                      <tr>
                        <th className="p-3 w-12 text-center">S.No.</th>
                        <th className="p-3">Sanstha ID</th>
                        <th className="p-3">Organisation Name</th>
                        <th className="p-3">Assigned Municipal Ward</th>
                        <th className="p-3">Lead Contact Person</th>
                        <th className="p-3">Contact Phone</th>
                        <th className="p-3">Contracted Units</th>
                        <th className="p-3 text-right">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/60">
                      {sansthasList.map((s, idx) => (
                        <tr key={s.id} className="hover:bg-muted/30 transition">
                          <td className="p-3 font-bold text-center text-muted-foreground">{idx + 1}</td>
                          <td className="p-3 font-mono font-bold text-blue-600 uppercase">{s.id}</td>
                          <td className="p-3 font-bold text-foreground">{s.name}</td>
                          <td className="p-3 text-foreground">{s.ward}</td>
                          <td className="p-3 text-foreground font-medium">{s.contactPerson}</td>
                          <td className="p-3 font-mono text-muted-foreground">{s.phone}</td>
                          <td className="p-3 font-medium text-foreground">{s.activeUnits} Vasti Units</td>
                          <td className="p-3 text-right"><StatusChip status={s.status} /></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {page === "workers" && (
            <div className="space-y-4 text-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-border pb-3 gap-2">
                <div>
                  <h2 className="font-display font-bold text-base text-foreground">Registered Users & Sanitary Field Workers</h2>
                  <p className="text-muted-foreground text-[11px]">Biometrically linked frontline workers assigned to Vasti sanitation units</p>
                </div>
                {role === "BMC Administrator" && (
                  <button onClick={() => setSetupWorkerModal(true)} className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg shadow-xs flex items-center gap-1.5">
                    <Users className="h-3.5 w-3.5" />
                    + Register Worker
                  </button>
                )}
              </div>

              <div className="border border-border rounded-xl bg-card overflow-hidden shadow-xs">
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead className="bg-muted/60 text-muted-foreground uppercase text-[10px] border-b border-border">
                      <tr>
                        <th className="p-3 w-12 text-center">S.No.</th>
                        <th className="p-3">Worker ID</th>
                        <th className="p-3">Worker Full Name</th>
                        <th className="p-3">Designation / Role</th>
                        <th className="p-3">Associated Sanstha</th>
                        <th className="p-3">Assigned Vasti Beat</th>
                        <th className="p-3">Contact Mobile</th>
                        <th className="p-3">Geo-Bound Status</th>
                        <th className="p-3 text-right">Daily Attendance</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/60">
                      {workersList.map((w, idx) => (
                        <tr key={w.id} className="hover:bg-muted/30 transition">
                          <td className="p-3 font-bold text-center text-muted-foreground">{idx + 1}</td>
                          <td className="p-3 font-mono font-bold text-blue-600">{w.id}</td>
                          <td className="p-3 font-bold text-foreground">{w.name}</td>
                          <td className="p-3 text-muted-foreground font-medium">{w.role}</td>
                          <td className="p-3 text-foreground font-medium">{w.sanstha}</td>
                          <td className="p-3 text-foreground">{w.vasti}</td>
                          <td className="p-3 font-mono text-muted-foreground">{w.phone}</td>
                          <td className="p-3 text-emerald-700 dark:text-emerald-400 font-medium text-[11px]">{w.geo}</td>
                          <td className="p-3 text-right"><StatusChip status={w.attendance} /></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {page === "attendance" && (
            role === "Field Worker" ? (
              <div className="space-y-4 text-xs max-w-4xl mx-auto">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-border pb-3 gap-2">
                  <div>
                    <h2 className="font-display font-bold text-base text-foreground">My Personal Geo Attendance Register</h2>
                    <p className="text-muted-foreground text-[11px]">Individual biometric and geo-tagged check-in record for Asha Kamble (ID: W-301)</p>
                  </div>
                  <button
                    onClick={() => {
                      setWorkersList(prev =>
                        prev.map(w =>
                          w.id === "W-301"
                            ? {
                                ...w,
                                attendance: "Present",
                                geo: "Within Vasti Boundary (4.2m - Re-verified)",
                                checkInTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                              }
                            : w
                        )
                      );
                      confirm("Today's geo-attendance successfully recorded for Asha Kamble!");
                    }}
                    className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg shadow-xs flex items-center gap-1.5 self-start sm:self-auto"
                  >
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    Punch / Mark Today's Geo Attendance
                  </button>
                </div>

                {/* Personal Status Banner */}
                <div className="rounded-xl border border-emerald-300 dark:border-emerald-800 bg-emerald-50/60 dark:bg-emerald-950/30 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">Current Geo Status</span>
                    <p className="text-sm font-bold text-foreground">Present on Duty • GPS Lock Verified</p>
                    <p className="text-xs text-muted-foreground font-mono">
                      Location: 19.0438° N, 72.8541° E (4.2m from Dharavi Beat 12 Center)
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-muted-foreground uppercase font-bold">Today's Check-in</span>
                    <p className="font-mono text-base font-bold text-foreground">
                      {workersList.find(w => w.id === "W-301")?.checkInTime || "07:42 AM"}
                    </p>
                    <span className="text-[10px] text-emerald-600 font-bold">On-Time Punch</span>
                  </div>
                </div>

                {/* Personal 7-day Attendance Log Table */}
                <div className="border border-border rounded-xl bg-card overflow-hidden shadow-xs">
                  <div className="p-3 border-b border-border bg-muted/20">
                    <h3 className="font-bold text-xs text-foreground">Asha Kamble - Recent 7-Day Punch History</h3>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead className="bg-muted/60 text-muted-foreground uppercase text-[10px] border-b border-border">
                        <tr>
                          <th className="p-3 w-12 text-center">S.No.</th>
                          <th className="p-3">Date</th>
                          <th className="p-3">Assigned Shift</th>
                          <th className="p-3">Check-in Time</th>
                          <th className="p-3">Geo-Fencing Compliance</th>
                          <th className="p-3 text-right">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/60">
                        {[
                          { date: "Today (30 Sep 2026)", shift: "Morning (07:00 - 14:00)", time: workersList.find(w => w.id === "W-301")?.checkInTime || "07:42 AM", geo: "Within Vasti Boundary (4.2m)", status: "Present" },
                          { date: "Yesterday (29 Sep 2026)", shift: "Morning (07:00 - 14:00)", time: "07:35 AM", geo: "Within Vasti Boundary (3.9m)", status: "Present" },
                          { date: "28 Sep 2026", shift: "Morning (07:00 - 14:00)", time: "07:40 AM", geo: "Within Vasti Boundary (5.1m)", status: "Present" },
                          { date: "27 Sep 2026", shift: "Morning (07:00 - 14:00)", time: "07:38 AM", geo: "Within Vasti Boundary (4.0m)", status: "Present" },
                          { date: "26 Sep 2026", shift: "Morning (07:00 - 14:00)", time: "07:45 AM", geo: "Within Vasti Boundary (4.5m)", status: "Present" },
                        ].map((rec, idx) => (
                          <tr key={idx} className="hover:bg-muted/30 transition">
                            <td className="p-3 font-bold text-center text-muted-foreground">{idx + 1}</td>
                            <td className="p-3 font-semibold text-foreground">{rec.date}</td>
                            <td className="p-3 text-muted-foreground">{rec.shift}</td>
                            <td className="p-3 font-mono font-bold text-foreground">{rec.time}</td>
                            <td className="p-3 text-emerald-700 dark:text-emerald-400 font-medium text-[11px]">{rec.geo}</td>
                            <td className="p-3 text-right">
                              <StatusChip status={rec.status} />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-4 text-xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-border pb-3 gap-2">
                  <div>
                    <h2 className="font-display font-bold text-base text-foreground">Daily Field Worker Attendance & Exceptions Log</h2>
                    <p className="text-muted-foreground text-[11px]">Daily biometric geo-fenced logs, real-time presence checks, and shift attendance anomalies</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-rose-600 font-bold bg-rose-50 dark:bg-rose-950/40 px-2.5 py-1 rounded border border-rose-200">
                      {workersList.filter(w => w.attendance === "Exception").length} Exceptions Flagged
                    </span>
                    <span className="text-xs text-emerald-600 font-bold bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-1 rounded border border-emerald-200">
                      {workersList.filter(w => w.attendance === "Present").length} Active on Ground
                    </span>
                  </div>
                </div>

                <div className="border border-border rounded-xl bg-card overflow-hidden shadow-xs">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead className="bg-muted/60 text-muted-foreground uppercase text-[10px] border-b border-border">
                        <tr>
                          <th className="p-3 w-12 text-center">S.No.</th>
                          <th className="p-3">Worker ID & Name</th>
                          <th className="p-3">Designation / Role</th>
                          <th className="p-3">Contracted Sanstha</th>
                          <th className="p-3">Assigned Vasti Beat</th>
                          <th className="p-3">Check-In Timestamp</th>
                          <th className="p-3">Geo-Fence Distance</th>
                          <th className="p-3 text-right">Attendance Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/60">
                        {workersList.map((w, idx) => (
                          <tr key={w.id} className={cn("hover:bg-muted/30 transition", w.attendance === "Exception" && "bg-rose-50/40 dark:bg-rose-950/20")}>
                            <td className="p-3 font-bold text-center text-muted-foreground">{idx + 1}</td>
                            <td className="p-3">
                              <span className="font-mono font-bold text-blue-600">{w.id}</span>
                              <p className="font-bold text-foreground">{w.name}</p>
                              <span className="text-[10px] font-mono text-muted-foreground">{w.phone}</span>
                            </td>
                            <td className="p-3 font-medium text-foreground">{w.role}</td>
                            <td className="p-3 font-medium text-foreground">{w.sanstha}</td>
                            <td className="p-3 text-foreground">{w.vasti}</td>
                            <td className="p-3 font-mono font-bold text-foreground">{w.checkInTime}</td>
                            <td className="p-3">
                              <span className={cn(
                                "font-medium text-[11px]",
                                w.attendance === "Exception" ? "text-rose-600 font-bold" : "text-emerald-700 dark:text-emerald-400"
                              )}>
                                {w.geo}
                              </span>
                            </td>
                            <td className="p-3 text-right">
                              <StatusChip status={w.attendance} />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )
          )}

          {page === "evidence" && (
            <div className="max-w-2xl mx-auto rounded-xl border border-border bg-card p-5 space-y-4 text-xs">
              <h2 className="font-bold text-sm text-foreground border-b border-border pb-2">Evidence Review Screen</h2>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <img src="/images/garbage_before.jpg" alt="Before" className="h-32 w-full object-cover rounded border" />
                  <p className="font-bold text-center mt-1">1. Before Cleaning</p>
                </div>
                <div>
                  <img src="/images/garbage_after.jpg" alt="After" className="h-32 w-full object-cover rounded border" />
                  <p className="font-bold text-center mt-1 text-emerald-600">2. After Cleaning</p>
                </div>
              </div>
            </div>
          )}

          {page === "ward-performance" && (
            <div className="space-y-3 text-xs">
              <h2 className="font-bold text-sm text-foreground border-b border-border pb-2">Ward Cleanliness Performance</h2>
              <div className="grid gap-3 sm:grid-cols-3">
                {[
                  { ward: "Ward G/North (Dharavi)", score: "96%", status: "Verified" },
                  { ward: "Ward F/North (Matunga)", score: "94%", status: "Verified" },
                  { ward: "Ward M/East (Govandi)", score: "88%", status: "Verified" },
                ].map(w => (
                  <div key={w.ward} className="p-3 border border-border rounded-xl bg-card space-y-1">
                    <h3 className="font-bold text-foreground">{w.ward}</h3>
                    <p>Cleanliness Rating: <strong className="text-emerald-600">{w.score}</strong></p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {page === "grievances" && (
            <div className="space-y-3 text-xs">
              <h2 className="font-bold text-sm text-foreground border-b border-border pb-2">Grievance Register</h2>
              <div className="space-y-2">
                {grievanceList.map(g => (
                  <div key={g.id} className="p-3 border border-border rounded-xl bg-card flex justify-between items-center">
                    <div>
                      <span className="font-mono font-bold text-blue-600">{g.id}</span>
                      <p className="font-bold text-foreground text-sm">{g.category} - {g.location}</p>
                      <p className="text-muted-foreground">{g.ward} • Assigned: {g.sansthaAssigned || "Pending Ward Assignment"}</p>
                    </div>
                    <StatusChip status={g.status} />
                  </div>
                ))}
              </div>
            </div>
          )}

          {page === "grant" && (
            <div className="max-w-md mx-auto p-4 border border-border rounded-xl bg-card text-xs space-y-3">
              <h2 className="font-bold text-sm text-foreground border-b border-border pb-2">Grant Recommendation</h2>
              <p>Sanstha Prerna: <strong className="text-emerald-600 font-mono text-sm">₹ 6,50,000</strong></p>
              <button onClick={() => confirm("Approved and sent for financial review!")} className="w-full py-2 bg-emerald-600 text-white font-bold rounded">
                Forward for Financial Review
              </button>
            </div>
          )}

          {page === "finance" && (
            <div className="max-w-md mx-auto p-4 border border-border rounded-xl bg-card text-xs space-y-2 font-mono">
              <h2 className="font-sans font-bold text-sm text-foreground border-b border-border pb-2">SAP Financial Export</h2>
              <p>PK 40 Debit: ₹ 6,50,000</p>
              <p>PK 50 Credit: ₹ 6,50,000</p>
              <button onClick={() => confirm("SAP CSV Downloaded!")} className="w-full py-2 bg-blue-600 text-white font-bold rounded font-sans">
                Download SAP CSV
              </button>
            </div>
          )}
        </main>
      </div>

      {/* MODAL 1: BMC ADMIN SETS UP SANSTHA */}
      {setupSansthaModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-xl border border-border bg-card p-5 text-xs space-y-3">
            <div className="flex justify-between items-center border-b border-border pb-2">
              <h3 className="font-bold text-sm text-foreground">Set Up Contracted Sanstha (CBO)</h3>
              <button onClick={() => setSetupSansthaModal(false)}><X className="h-4 w-4" /></button>
            </div>
            <form onSubmit={handleSetupSanstha} className="space-y-3">
              <div>
                <label className="block font-bold text-muted-foreground mb-1">Sanstha Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Sanstha Sahyog Vikas Mandal"
                  value={newSansthaForm.name}
                  onChange={e => setNewSansthaForm({ ...newSansthaForm, name: e.target.value })}
                  className="w-full rounded border border-border bg-background p-2 text-xs"
                />
              </div>
              <div>
                <label className="block font-bold text-muted-foreground mb-1">Contracted Ward</label>
                <select
                  value={newSansthaForm.ward}
                  onChange={e => setNewSansthaForm({ ...newSansthaForm, ward: e.target.value })}
                  className="w-full rounded border border-border bg-background p-2 text-xs"
                >
                  <option>Ward G/North (Dharavi)</option>
                  <option>Ward F/North (Matunga)</option>
                  <option>Ward M/East (Govandi)</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-muted-foreground mb-1">Contact Person</label>
                  <input
                    type="text"
                    placeholder="Coordinator Name"
                    value={newSansthaForm.contactPerson}
                    onChange={e => setNewSansthaForm({ ...newSansthaForm, contactPerson: e.target.value })}
                    className="w-full rounded border border-border bg-background p-2 text-xs"
                  />
                </div>
                <div>
                  <label className="block font-bold text-muted-foreground mb-1">Phone</label>
                  <input
                    type="text"
                    placeholder="+91..."
                    value={newSansthaForm.phone}
                    onChange={e => setNewSansthaForm({ ...newSansthaForm, phone: e.target.value })}
                    className="w-full rounded border border-border bg-background p-2 text-xs font-mono"
                  />
                </div>
              </div>
              <button type="submit" className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded">
                Register Sanstha
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: BMC ADMIN SETS UP WORKER */}
      {setupWorkerModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-xl border border-border bg-card p-5 text-xs space-y-3">
            <div className="flex justify-between items-center border-b border-border pb-2">
              <h3 className="font-bold text-sm text-foreground">Register Sanitary Worker</h3>
              <button onClick={() => setSetupWorkerModal(false)}><X className="h-4 w-4" /></button>
            </div>
            <form onSubmit={handleSetupWorker} className="space-y-3">
              <div>
                <label className="block font-bold text-muted-foreground mb-1">Worker Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Suresh Bhosale"
                  value={newWorkerForm.name}
                  onChange={e => setNewWorkerForm({ ...newWorkerForm, name: e.target.value })}
                  className="w-full rounded border border-border bg-background p-2 text-xs"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-muted-foreground mb-1">Sanstha</label>
                  <select
                    value={newWorkerForm.sanstha}
                    onChange={e => setNewWorkerForm({ ...newWorkerForm, sanstha: e.target.value })}
                    className="w-full rounded border border-border bg-background p-2 text-xs"
                  >
                    {sansthasList.map(s => (
                      <option key={s.id} value={s.name}>{s.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-muted-foreground mb-1">Role</label>
                  <select
                    value={newWorkerForm.role}
                    onChange={e => setNewWorkerForm({ ...newWorkerForm, role: e.target.value })}
                    className="w-full rounded border border-border bg-background p-2 text-xs"
                  >
                    <option>Sanitary Worker</option>
                    <option>Sanitary Lead</option>
                    <option>Cart Operator</option>
                  </select>
                </div>
              </div>
              <button type="submit" className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded">
                Register Worker
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: WARD OFFICER CREATES & ASSIGNS WORK ORDER TO SANSTHA */}
      {wardCreateWoModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-xl border border-border bg-card p-5 text-xs space-y-3">
            <div className="flex justify-between items-center border-b border-border pb-2">
              <div>
                <span className="text-[10px] text-blue-600 font-bold uppercase">Ward Officer Action</span>
                <h3 className="font-bold text-sm text-foreground">Create & Assign Work Order to Sanstha</h3>
              </div>
              <button onClick={() => setWardCreateWoModal(false)}><X className="h-4 w-4" /></button>
            </div>
            <form onSubmit={handleWardCreateWo} className="space-y-3">
              <div>
                <label className="block font-bold text-muted-foreground mb-1">Cleanliness Activity</label>
                <select
                  value={wardWoForm.activity}
                  onChange={e => setWardWoForm({ ...wardWoForm, activity: e.target.value })}
                  className="w-full rounded border border-border bg-background p-2 text-xs"
                >
                  <option>Vasti Lane Deep Sweeping & Waste Carting</option>
                  <option>Community Pathway Waste Collection</option>
                  <option>Secondary Collection Point Clearing</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-muted-foreground mb-1">Ward</label>
                  <select
                    value={wardWoForm.ward}
                    onChange={e => setWardWoForm({ ...wardWoForm, ward: e.target.value })}
                    className="w-full rounded border border-border bg-background p-2 text-xs"
                  >
                    <option>Ward G/North (Dharavi)</option>
                    <option>Ward F/North (Matunga)</option>
                    <option>Ward M/East (Govandi)</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-muted-foreground mb-1">Vasti Unit</label>
                  <input
                    type="text"
                    value={wardWoForm.vastiUnit}
                    onChange={e => setWardWoForm({ ...wardWoForm, vastiUnit: e.target.value })}
                    className="w-full rounded border border-border bg-background p-2 text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-muted-foreground mb-1">Assign to Sanstha (3rd Party)</label>
                <select
                  value={wardWoForm.sanstha}
                  onChange={e => setWardWoForm({ ...wardWoForm, sanstha: e.target.value })}
                  className="w-full rounded border border-border bg-background p-2 text-xs"
                >
                  {sansthasList.map(s => (
                    <option key={s.id} value={s.name}>{s.name} ({s.ward})</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-muted-foreground mb-1">Shift</label>
                  <select
                    value={wardWoForm.shift}
                    onChange={e => setWardWoForm({ ...wardWoForm, shift: e.target.value })}
                    className="w-full rounded border border-border bg-background p-2 text-xs"
                  >
                    <option>Morning (07:00 - 14:00)</option>
                    <option>Afternoon (14:00 - 21:00)</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-muted-foreground mb-1">Workers Required</label>
                  <input
                    type="number"
                    min={1}
                    max={20}
                    value={wardWoForm.workers}
                    onChange={e => setWardWoForm({ ...wardWoForm, workers: Number(e.target.value) })}
                    className="w-full rounded border border-border bg-background p-2 text-xs"
                  />
                </div>
              </div>

              <button type="submit" className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded">
                Assign Work Order to Sanstha
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 4: SANSTHA COORDINATOR ASSIGNS WORKERS */}
      {assignWorkerModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-xl border border-border bg-card p-5 text-xs space-y-3">
            <div className="flex justify-between items-center border-b border-border pb-2">
              <div>
                <span className="text-[10px] text-blue-600 font-bold uppercase">Sanstha Dispatch</span>
                <h3 className="font-bold text-sm text-foreground">Assign Workers to {assignWorkerModal.id}</h3>
              </div>
              <button onClick={() => setAssignWorkerModal(null)}><X className="h-4 w-4" /></button>
            </div>
            <p className="text-muted-foreground">Select crew members to execute this activity:</p>
            <div className="space-y-2">
              {workersList.map(w => (
                <label key={w.id} className="flex items-center gap-2 p-2 border border-border rounded cursor-pointer hover:bg-muted/40">
                  <input type="checkbox" defaultChecked={w.id === "W-301" || w.id === "W-302"} className="accent-blue-600" id={`chk-${w.id}`} />
                  <div>
                    <p className="font-bold text-foreground">{w.name} ({w.id})</p>
                    <p className="text-[10px] text-muted-foreground">{w.role} - {w.attendance}</p>
                  </div>
                </label>
              ))}
            </div>
            <button
              onClick={() => handleAssignWorkersToWo(assignWorkerModal.id, ["Asha Kamble (W-301)", "Ravi Ghadge (W-302)"])}
              className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded"
            >
              Confirm Crew & Dispatch to Vasti
            </button>
          </div>
        </div>
      )}

      {/* MODAL 5: WARD OFFICER RETURNS EVIDENCE FOR CORRECTION */}
      {rejectEvidenceModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-xl border border-border bg-card p-5 text-xs space-y-3">
            <div className="flex justify-between items-center border-b border-border pb-2">
              <h3 className="font-bold text-sm text-foreground">Return Work Order for Correction</h3>
              <button onClick={() => setRejectEvidenceModal(null)}><X className="h-4 w-4" /></button>
            </div>
            <p className="text-muted-foreground">
              Provide feedback for <strong>{rejectEvidenceModal.sanstha}</strong>. They must re-sweep and submit fresh evidence:
            </p>
            <textarea
              rows={3}
              value={correctionReason}
              onChange={e => setCorrectionReason(e.target.value)}
              placeholder="e.g. Garbage remains along the west boundary wall. Re-cleaning required."
              className="w-full p-2 border border-border rounded bg-background"
            />
            <button
              onClick={() => handleWardOfficerReturnEvidence(rejectEvidenceModal.id, correctionReason)}
              className="w-full py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded"
            >
              Return to Sanstha Coordinator
            </button>
          </div>
        </div>
      )}

      {/* MODAL 6: WARD OFFICER RETURNS GRIEVANCE FOR CORRECTION */}
      {rejectGrievanceModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-xl border border-border bg-card p-5 text-xs space-y-3">
            <div className="flex justify-between items-center border-b border-border pb-2">
              <h3 className="font-bold text-sm text-foreground">Return Complaint for Further Action</h3>
              <button onClick={() => setRejectGrievanceModal(null)}><X className="h-4 w-4" /></button>
            </div>
            <p className="text-muted-foreground">
              Specify what work remains incomplete for <strong>{rejectGrievanceModal.sansthaAssigned}</strong>:
            </p>
            <textarea
              rows={3}
              value={correctionReason}
              onChange={e => setCorrectionReason(e.target.value)}
              placeholder="e.g. Silt still blocking drain outlet. Secondary clearing needed."
              className="w-full p-2 border border-border rounded bg-background"
            />
            <button
              onClick={() => handleWardOfficerReturnGrievance(rejectGrievanceModal.id, correctionReason)}
              className="w-full py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded"
            >
              Send Back to Sanstha
            </button>
          </div>
        </div>
      )}

      {/* MODAL 7: BMC OFFICER ASSIGNS UNCLEAR COMPLAINT TO WARD */}
      {assignWardModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-xl border border-border bg-card p-5 text-xs space-y-3">
            <div className="flex justify-between items-center border-b border-border pb-2">
              <div>
                <span className="text-[10px] text-amber-600 font-bold uppercase">BMC Assignment</span>
                <h3 className="font-bold text-sm text-foreground">Assign Unclear Complaint to Ward</h3>
              </div>
              <button onClick={() => setAssignWardModal(null)}><X className="h-4 w-4" /></button>
            </div>
            <p className="text-muted-foreground">
              Complaint <strong>{assignWardModal.id}</strong> location: <em>{assignWardModal.location}</em>. Select the responsible ward:
            </p>
            <select
              value={unclearWardSelection}
              onChange={e => setUnclearWardSelection(e.target.value)}
              className="w-full p-2 border border-border rounded bg-background"
            >
              <option>Ward G/North (Dharavi)</option>
              <option>Ward F/North (Matunga)</option>
              <option>Ward M/East (Govandi)</option>
            </select>
            <button
              onClick={() => handleBmcAssignWard(assignWardModal.id, unclearWardSelection)}
              className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded"
            >
              Confirm Ward Assignment
            </button>
          </div>
        </div>
      )}

      {/* MODAL 8: WARD OFFICER SELECTS & ASSIGNS SANSTHA FOR COMPLAINT */}
      {wardAssignGrievanceModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-xl border border-border bg-card p-5 text-xs space-y-4">
            <div className="flex justify-between items-center border-b border-border pb-2">
              <div>
                <span className="text-[10px] text-blue-600 font-bold uppercase">Ward Officer Action</span>
                <h3 className="font-bold text-sm text-foreground">Assign Complaint to Sanstha</h3>
              </div>
              <button onClick={() => setWardAssignGrievanceModal(null)}><X className="h-4 w-4" /></button>
            </div>

            <div className="p-3 bg-muted/40 rounded-lg space-y-1">
              <span className="font-mono font-bold text-blue-600">{wardAssignGrievanceModal.id}</span>
              <p className="font-bold text-foreground text-sm">{wardAssignGrievanceModal.category}</p>
              <p className="text-muted-foreground">{wardAssignGrievanceModal.location} • {wardAssignGrievanceModal.ward}</p>
              <p className="text-[11px] text-slate-600 dark:text-slate-300 italic">"{wardAssignGrievanceModal.description}"</p>
            </div>

            <div>
              <label className="block font-bold text-muted-foreground mb-1.5">
                Select Responsible Sanstha for this Ward:
              </label>
              <select
                value={selectedSansthaForGrievance}
                onChange={e => setSelectedSansthaForGrievance(e.target.value)}
                className="w-full p-2.5 border border-border rounded-lg bg-background font-medium"
              >
                {sansthasList.map(s => (
                  <option key={s.id} value={s.name}>
                    {s.name} ({s.ward})
                  </option>
                ))}
              </select>
              <p className="text-[10px] text-muted-foreground mt-1">
                Multiple Sansthas are registered in this ward. Choose the organization servicing this specific beat/lane.
              </p>
            </div>

            <div className="pt-2">
              <button
                onClick={() => handleWardOfficerAssignGrievanceWithSanstha(wardAssignGrievanceModal.id, selectedSansthaForGrievance)}
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg shadow"
              >
                Dispatch Work Order to {selectedSansthaForGrievance.split(" ")[1] || "Sanstha"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toast && (
        <div
          role="status"
          className="fixed bottom-5 right-5 z-[120] flex items-center gap-2 rounded-lg bg-slate-900 border border-slate-700 px-3.5 py-2.5 text-xs font-bold text-white shadow-xl animate-in fade-in"
        >
          <span className="grid h-4 w-4 place-items-center rounded-full bg-emerald-500 text-white">
            <Check className="h-3 w-3" />
          </span>
          <span>{toast}</span>
        </div>
      )}
    </div>
  );
}

/* =========================================================================
   CITIZEN SERVICE VIEW (QR & FORM REGISTRATION)
   ========================================================================= */

function CitizenServiceView({ onSubmit }: { onSubmit: (g: GrievanceItem) => void }) {
  const [method, setMethod] = useState<"QR" | "Form">("QR");
  const [cat, setCat] = useState("Garbage / Waste Accumulation");
  const [desc, setDesc] = useState("Solid waste accumulated near community bin.");
  const [location, setLocation] = useState("Kala Killa Lane 4, near Water Tap");
  const [ward, setWard] = useState("Ward G/North (Dharavi)");
  const [name, setName] = useState("Milind Deshmukh");
  const [phone, setPhone] = useState("+91 98201 33412");
  const [isUnclear, setIsUnclear] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newId = `GR-BSSY-2026-${Math.floor(1000 + Math.random() * 9000)}`;
    const newComp: GrievanceItem = {
      id: newId,
      category: cat,
      description: desc,
      location,
      vastiUnit: isUnclear ? "Unclear Location" : "Vasti Unit 04-D",
      ward: isUnclear ? "Unassigned / Unclear" : ward,
      sansthaAssigned: isUnclear ? undefined : "Sanstha Prerna Swachhata Foundation",
      supervisor: isUnclear ? "Awaiting BMC Assignment" : "Shri Rajesh Sawant (Ward Officer)",
      citizenName: name,
      citizenPhone: phone,
      createdAt: "Just now",
      status: isUnclear ? "Unclear Ward / Unassigned" : "Assigned",
      slaRemaining: "4h 00m",
      beforePhoto: "/images/garbage_before.jpg",
      afterPhoto: "/images/garbage_after.jpg",
      registeredBy: method === "QR" ? "Citizen (QR Scan)" : "Citizen (Form)",
      isWardUnclear: isUnclear,
      timeline: [
        {
          title: `Citizen Registered Complaint (${method})`,
          time: "Just now",
          note: isUnclear
            ? "Location boundary unclear. Escalated to BMC Administrator for ward assignment."
            : "Mapped to Ward Officer for review.",
          actor: "Citizen",
        },
      ],
    };
    onSubmit(newComp);
  };

  return (
    <div className="max-w-xl mx-auto rounded-xl border border-border bg-card p-5 text-xs space-y-4">
      <div className="border-b border-border pb-3 flex justify-between items-center">
        <div>
          <h2 className="font-bold text-sm text-foreground">Register Cleanliness Complaint</h2>
          <p className="text-muted-foreground text-[11px]">Submit through QR scan or citizen grievance form</p>
        </div>
        <div className="flex rounded border border-border overflow-hidden">
          <button
            type="button"
            onClick={() => { setMethod("QR"); setIsUnclear(false); }}
            className={cn("px-2.5 py-1 text-[11px] font-bold", method === "QR" ? "bg-blue-600 text-white" : "bg-muted text-muted-foreground")}
          >
            QR Scan
          </button>
          <button
            type="button"
            onClick={() => setMethod("Form")}
            className={cn("px-2.5 py-1 text-[11px] font-bold", method === "Form" ? "bg-blue-600 text-white" : "bg-muted text-muted-foreground")}
          >
            Citizen Form
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        {method === "QR" ? (
          <div>
            <label className="block font-bold text-muted-foreground mb-1">Scanned Standee Location</label>
            <input
              type="text"
              readOnly
              value="Vasti Unit 04-D (Dharavi Beat 12 - Ward G/North)"
              className="w-full p-2 border border-border rounded bg-muted font-semibold"
            />
            <p className="text-emerald-600 font-bold text-[10px] mt-1">✓ Verified QR Location Coordinates: 19.0438° N, 72.8541° E</p>
          </div>
        ) : (
          <div className="space-y-2">
            <div>
              <label className="block font-bold text-muted-foreground mb-1">Location Details</label>
              <input
                type="text"
                required
                value={location}
                onChange={e => setLocation(e.target.value)}
                placeholder="Enter street or landmark"
                className="w-full p-2 border border-border rounded bg-background"
              />
            </div>
            <label className="flex items-center gap-2 cursor-pointer pt-1">
              <input
                type="checkbox"
                checked={isUnclear}
                onChange={e => setIsUnclear(e.target.checked)}
                className="accent-amber-600"
              />
              <span className="text-amber-700 dark:text-amber-400 font-bold">
                Location or ward is unclear (Simulate escalation to BMC Officer for ward assignment)
              </span>
            </label>
          </div>
        )}

        <div>
          <label className="block font-bold text-muted-foreground mb-1">Issue Category</label>
          <select value={cat} onChange={e => setCat(e.target.value)} className="w-full p-2 border border-border rounded bg-background">
            <option>Garbage / Waste Accumulation</option>
            <option>Overflowing Community Waste Bin</option>
            <option>Unswept Slum Pathway</option>
          </select>
        </div>

        <div>
          <label className="block font-bold text-muted-foreground mb-1">Photo of Garbage Accumulation</label>
          <div className="h-28 w-36 rounded-lg overflow-hidden border border-border">
            <img src="/images/garbage_before.jpg" alt="Waste" className="h-full w-full object-cover" />
          </div>
        </div>

        <div>
          <label className="block font-bold text-muted-foreground mb-1">Description</label>
          <textarea rows={2} required value={desc} onChange={e => setDesc(e.target.value)} className="w-full p-2 border border-border rounded bg-background" />
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block font-bold text-muted-foreground mb-1">Your Name</label>
            <input type="text" value={name} onChange={e => setName(e.target.value)} className="w-full p-2 border border-border rounded bg-background" />
          </div>
          <div>
            <label className="block font-bold text-muted-foreground mb-1">Mobile (for SMS)</label>
            <input type="text" value={phone} onChange={e => setPhone(e.target.value)} className="w-full p-2 border border-border rounded bg-background font-mono" />
          </div>
        </div>

        <button type="submit" className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg shadow">
          Submit Complaint & Generate ID
        </button>
      </form>
    </div>
  );
}

/* =========================================================================
   CITIZEN LOOKUP VIEW (TRACK STATUS)
   ========================================================================= */

function CitizenLookupView({
  grievances,
  onNew,
}: {
  grievances: GrievanceItem[];
  onNew: () => void;
}) {
  const [ref, setRef] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("All");
  const [selectedModalItem, setSelectedModalItem] = useState<GrievanceItem | null>(null);

  const filtered = grievances.filter(g => {
    const matchSearch =
      g.id.toLowerCase().includes(ref.toLowerCase()) ||
      g.category.toLowerCase().includes(ref.toLowerCase()) ||
      g.location.toLowerCase().includes(ref.toLowerCase());
    const matchStatus = statusFilter === "All" || g.status === statusFilter;
    return matchSearch && matchStatus;
  });

  return (
    <div className="max-w-5xl mx-auto space-y-4 text-xs">
      {/* Top Professional Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-border pb-3 gap-3">
        <div>
          <h1 className="font-display text-lg font-bold text-foreground">Citizen Grievance Register & Tracking</h1>
          <p className="text-muted-foreground text-[11px]">Track the real-time status, field verification, and resolution of all registered complaints</p>
        </div>
        <button
          onClick={onNew}
          className="self-start sm:self-auto px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg shadow-xs flex items-center gap-1.5 text-xs transition"
        >
          <Camera className="h-4 w-4" />
          + File New Complaint
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-2.5 items-stretch sm:items-center justify-between">
        <div className="flex-1 flex gap-2 max-w-md">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search by Complaint ID, Category, or Street..."
              value={ref}
              onChange={e => setRef(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 border border-border rounded-lg bg-card text-xs font-mono"
            />
          </div>
          {ref && (
            <button
              onClick={() => setRef("")}
              className="px-2.5 py-1.5 border border-border hover:bg-muted text-muted-foreground rounded-lg"
            >
              Clear
            </button>
          )}
        </div>

        {/* Status Pill Filters */}
        <div className="flex gap-1 overflow-x-auto pb-1 sm:pb-0">
          {["All", "Assigned", "In Progress", "Under Ward Review", "Closed"].map(s => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={cn(
                "px-2.5 py-1 rounded-lg font-medium text-[11px] whitespace-nowrap transition border",
                statusFilter === s
                  ? "bg-blue-600 text-white border-blue-600 font-bold"
                  : "bg-card text-muted-foreground border-border hover:bg-muted"
              )}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Main Tabular View */}
      <div className="border border-border rounded-xl bg-card overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-muted/60 text-muted-foreground uppercase text-[10px] border-b border-border">
              <tr>
                <th className="p-3">Complaint ID</th>
                <th className="p-3">Issue Category</th>
                <th className="p-3">Location & Ward</th>
                <th className="p-3">Reporting Channel</th>
                <th className="p-3">Assigned Agency</th>
                <th className="p-3">Status</th>
                <th className="p-3 text-right">View Proof</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-6 text-center text-muted-foreground">
                    No complaints found matching your search.
                  </td>
                </tr>
              ) : (
                filtered.map(g => (
                  <tr
                    key={g.id}
                    onClick={() => setSelectedModalItem(g)}
                    className="hover:bg-muted/30 cursor-pointer transition"
                  >
                    <td className="p-3 font-mono font-bold text-blue-600">
                      {g.id}
                    </td>
                    <td className="p-3">
                      <p className="font-bold text-foreground">{g.category}</p>
                      <p className="text-[10px] text-muted-foreground truncate max-w-[200px]">{g.description}</p>
                    </td>
                    <td className="p-3">
                      <p className="font-semibold text-foreground">{g.location}</p>
                      <p className="text-[10px] text-muted-foreground">{g.ward}</p>
                    </td>
                    <td className="p-3 text-muted-foreground">
                      <span className="inline-block px-1.5 py-0.5 rounded bg-muted text-[10px] font-medium">
                        {g.registeredBy}
                      </span>
                    </td>
                    <td className="p-3 text-foreground font-medium">
                      {g.sansthaAssigned || "Ward Officer Triage"}
                    </td>
                    <td className="p-3">
                      <StatusChip status={g.status} />
                    </td>
                    <td className="p-3 text-right">
                      <button
                        onClick={e => {
                          e.stopPropagation();
                          setSelectedModalItem(g);
                        }}
                        className="px-2.5 py-1 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/40 rounded border border-blue-200 font-bold text-[11px]"
                      >
                        Inspect Details →
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Details & Proof Modal (Opened only when Citizen Clicks to Inspect) */}
      {selectedModalItem && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-lg rounded-xl border border-border bg-card p-5 text-xs space-y-4 shadow-2xl">
            <div className="flex justify-between items-center border-b border-border pb-2.5">
              <div>
                <span className="font-mono font-bold text-blue-600 text-xs">{selectedModalItem.id}</span>
                <h3 className="font-bold text-sm text-foreground">{selectedModalItem.category}</h3>
              </div>
              <button
                onClick={() => setSelectedModalItem(null)}
                className="p-1 hover:bg-muted rounded text-muted-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2 text-[11px]">
              <div className="p-2.5 bg-muted/40 rounded-lg">
                <span className="text-muted-foreground block text-[10px]">Location:</span>
                <strong>{selectedModalItem.location}</strong> ({selectedModalItem.ward})
              </div>
              <div className="p-2.5 bg-muted/40 rounded-lg">
                <span className="text-muted-foreground block text-[10px]">Current Status:</span>
                <StatusChip status={selectedModalItem.status} />
              </div>
            </div>

            {/* Side by side proof */}
            <div>
              <p className="font-bold text-muted-foreground mb-1.5 text-[11px]">Field Cleanliness Verification Evidence:</p>
              <div className="grid grid-cols-2 gap-2">
                <div className="rounded overflow-hidden border border-border">
                  <img src={selectedModalItem.beforePhoto} alt="Before" className="h-28 w-full object-cover" />
                  <span className="block p-1 bg-slate-900 text-white text-[9px] text-center font-bold">1. CITIZEN REPORTED PHOTO</span>
                </div>
                <div className="rounded overflow-hidden border border-border">
                  <img src={selectedModalItem.afterPhoto || "/images/garbage_after.jpg"} alt="After" className="h-28 w-full object-cover" />
                  <span className="block p-1 bg-emerald-800 text-white text-[9px] text-center font-bold">2. SANSTHA CLEANED PROOF</span>
                </div>
              </div>
            </div>

            {/* Timeline */}
            <div>
              <p className="font-bold text-muted-foreground mb-1 text-[11px]">Audit Trail & Progression:</p>
              <div className="space-y-1.5 pl-2 border-l-2 border-blue-600 max-h-32 overflow-y-auto">
                {selectedModalItem.timeline.map((t, idx) => (
                  <div key={idx} className="text-[11px]">
                    <p className="font-bold text-foreground">
                      {t.title} <span className="font-normal text-muted-foreground">({t.time})</span>
                    </p>
                    <p className="text-muted-foreground text-[10px]">{t.note}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-2 border-t border-border flex justify-end">
              <button
                onClick={() => setSelectedModalItem(null)}
                className="px-4 py-1.5 bg-slate-900 text-white hover:bg-slate-800 font-bold rounded-lg"
              >
                Close Details
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export function StatusChip({ status }: { status: Status | string }) {
  const isPositive = ["Verified", "Resolved", "Closed", "Approved", "Present", "Completed"].includes(status);
  const isDanger = ["Returned for Correction", "Exception"].includes(status);
  const isWarning = ["Under Ward Review", "Pending Verification", "Unclear Ward / Unassigned", "Pending"].includes(status);
  const isInfo = ["Assigned", "In Progress"].includes(status);

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-bold tracking-wide",
        isPositive && "border-emerald-500/30 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300",
        isDanger && "border-rose-500/30 bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300",
        isWarning && "border-amber-500/30 bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300",
        isInfo && "border-blue-500/30 bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300",
        !isPositive && !isDanger && !isWarning && !isInfo && "border-slate-300 bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300"
      )}
    >
      <span className={cn("h-1 w-1 rounded-full", isPositive && "bg-emerald-500", isDanger && "bg-rose-500", isWarning && "bg-amber-500", isInfo && "bg-blue-500")} />
      {status}
    </span>
  );
}

/* =========================================================================
   REAL LEAFLET GIS MAP COMPONENT (Ward G/North Dharavi Beat Boundaries & Grievance Pins)
   ========================================================================= */

function LeafletGisMap({
  grievances,
  selectedId,
  onSelect,
}: {
  grievances: GrievanceItem[];
  selectedId: string;
  onSelect: (id: string) => void;
}) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersRef = useRef<Record<string, L.Marker>>({});

  // Center on Dharavi Kala Killa / Sion Beat (Ward G/North, Mumbai)
  const DHARAVI_CENTER: [number, number] = [19.0438, 72.8541];

  // Geocoded coordinates for each complaint slot
  const COORDS: [number, number][] = [
    [19.0438, 72.8541],
    [19.0455, 72.8522],
    [19.0418, 72.8568],
    [19.0472, 72.8550],
    [19.0425, 72.8515],
  ];

  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (mapInstanceRef.current) return;

    // Initialize Leaflet map
    const map = L.map(mapContainerRef.current, {
      center: DHARAVI_CENTER,
      zoom: 15,
      zoomControl: true,
      attributionControl: false,
    });

    // Standard OpenStreetMap public tile server (100% free, no API key required)
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      attribution: "&copy; OpenStreetMap contributors",
    }).addTo(map);

    // Dharavi Ward G/North Slum Sanitation Beats Polygon
    const beatPolygonCoords: [number, number][] = [
      [19.0485, 72.8485],
      [19.0495, 72.8575],
      [19.0440, 72.8610],
      [19.0390, 72.8555],
      [19.0410, 72.8475],
    ];

    L.polygon(beatPolygonCoords, {
      color: "#2563eb",
      weight: 2,
      fillColor: "#3b82f6",
      fillOpacity: 0.1,
      dashArray: "4, 6",
    })
      .addTo(map)
      .bindTooltip("Ward G/North - Beat 12 & 14 (Dharavi Kala Killa)", {
        permanent: false,
        direction: "top",
      });

    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Update markers whenever grievances or selectedId changes
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    // Clear existing markers
    Object.values(markersRef.current).forEach(m => m.remove());
    markersRef.current = {};

    grievances.forEach((g, idx) => {
      const coord = COORDS[idx % COORDS.length]!;
      const isSelected = g.id === selectedId;

      const pinColor =
        g.status === "Closed"
          ? "#059669" // emerald
          : g.status === "Under Ward Review"
          ? "#d97706" // amber
          : "#e11d48"; // rose

      const customIcon = L.divIcon({
        className: "custom-leaflet-pin",
        html: `
          <div style="
            position: relative;
            display: flex;
            align-items: center;
            justify-content: center;
            width: ${isSelected ? "32px" : "26px"};
            height: ${isSelected ? "32px" : "26px"};
            background-color: ${pinColor};
            border: 2px solid #ffffff;
            border-radius: 9999px;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.3);
            color: #ffffff;
            font-size: ${isSelected ? "12px" : "10px"};
            font-weight: 800;
            cursor: pointer;
            transition: transform 0.2s ease;
            ${isSelected ? "transform: scale(1.15); outline: 3px solid #3b82f6;" : ""}
          ">
            ${idx + 1}
          </div>
        `,
        iconSize: [isSelected ? 32 : 26, isSelected ? 32 : 26],
        iconAnchor: [isSelected ? 16 : 13, isSelected ? 16 : 13],
      });

      const marker = L.marker(coord, { icon: customIcon }).addTo(map);

      marker.on("click", () => {
        onSelect(g.id);
        map.setView(coord, 16, { animate: true });
      });

      marker.bindPopup(`
        <div style="font-family: inherit; font-size: 11px; line-height: 1.4; min-width: 170px;">
          <div style="font-weight: 800; color: #2563eb; font-family: monospace;">${g.id}</div>
          <div style="font-weight: 700; color: #0f172a; margin-top: 2px;">${g.category}</div>
          <div style="color: #64748b; font-size: 10px;">${g.location}</div>
          <div style="margin-top: 4px; font-weight: 600; color: ${pinColor};">Status: ${g.status}</div>
        </div>
      `);

      if (isSelected) {
        marker.openPopup();
      }

      markersRef.current[g.id] = marker;
    });
  }, [grievances, selectedId, onSelect]);

  // Recenter map when selected complaint changes
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;
    const selectedIdx = grievances.findIndex(g => g.id === selectedId);
    if (selectedIdx !== -1) {
      const coord = COORDS[selectedIdx % COORDS.length]!;
      map.setView(coord, 16, { animate: true });
      const marker = markersRef.current[selectedId];
      if (marker && !marker.isPopupOpen()) {
        marker.openPopup();
      }
    }
  }, [selectedId, grievances]);

  return <div ref={mapContainerRef} className="h-full min-h-[360px] w-full rounded-lg border border-border overflow-hidden z-0" />;
}