import {
  AlertTriangle,
  CalendarDays,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  CircleDollarSign,
  Database,
  Download,
  Edit3,
  FileUp,
  Filter,
  LayoutDashboard,
  ListFilter,
  Moon,
  Plus,
  RotateCcw,
  Save,
  Search,
  Settings,
  ShieldCheck,
  Sparkles,
  Sun,
  Trash2,
  WalletCards,
} from "lucide-react";
import {
  type ChangeEvent,
  type CSSProperties,
  type FormEvent,
  type ReactNode,
  useEffect,
  useMemo,
  useState,
} from "react";

type BillingCycle = "monthly" | "yearly" | "bimonthly" | "quarterly" | "semiannual" | "one-time";
type Category =
  | "家賃"
  | "光熱費"
  | "通信費"
  | "サブスク"
  | "保険"
  | "ローン"
  | "教育"
  | "交通"
  | "その他";
type Priority = "low" | "medium" | "high";
type ThemeMode = "light" | "dark";
type View = "dashboard" | "list" | "editor" | "calendar" | "settings";
type SortKey = "date" | "amount-desc" | "amount-asc" | "name";

type FixedCost = {
  id: string;
  name: string;
  amount: number;
  cycle: BillingCycle;
  nextPaymentDate: string;
  category: Category;
  paymentMethod: string;
  startDate: string;
  cancellationDate: string;
  memo: string;
  priority: Priority;
  createdAt: string;
  updatedAt: string;
};

type CostDraft = Omit<FixedCost, "id" | "createdAt" | "updatedAt">;

type CostPreset = {
  id: string;
  provider: string;
  plan: string;
  name: string;
  amount: number;
  cycle: BillingCycle;
  category: Category;
  paymentMethod: string;
  priority: Priority;
  memo: string;
};

const STORAGE_KEY = "fixed-flow-costs-v1";
const THEME_KEY = "fixed-flow-theme";

const cycleOptions: Array<{ value: BillingCycle; label: string; compact: string }> = [
  { value: "monthly", label: "月額", compact: "毎月" },
  { value: "yearly", label: "年額", compact: "毎年" },
  { value: "bimonthly", label: "隔月", compact: "隔月" },
  { value: "quarterly", label: "四半期", compact: "3か月" },
  { value: "semiannual", label: "半年", compact: "半年" },
  { value: "one-time", label: "単発予定", compact: "単発" },
];

const categories: Array<{ value: Category; label: Category; color: string }> = [
  { value: "家賃", label: "家賃", color: "#2563eb" },
  { value: "光熱費", label: "光熱費", color: "#eab308" },
  { value: "通信費", label: "通信費", color: "#0891b2" },
  { value: "サブスク", label: "サブスク", color: "#7c3aed" },
  { value: "保険", label: "保険", color: "#059669" },
  { value: "ローン", label: "ローン", color: "#dc2626" },
  { value: "教育", label: "教育", color: "#ea580c" },
  { value: "交通", label: "交通", color: "#475569" },
  { value: "その他", label: "その他", color: "#64748b" },
];

const priorityOptions: Array<{ value: Priority; label: string; hint: string }> = [
  { value: "low", label: "低", hint: "そのままでもよい" },
  { value: "medium", label: "中", hint: "次の更新前に確認" },
  { value: "high", label: "高", hint: "早めに見直す" },
];

const costPresets: CostPreset[] = [
  {
    id: "apple-music-individual",
    provider: "Apple Music",
    plan: "個人",
    name: "Apple Music",
    amount: 1080,
    cycle: "monthly",
    category: "サブスク",
    paymentMethod: "Apple ID",
    priority: "medium",
    memo: "公式料金: 個人 月額1,080円。必要ならファミリー/学生に変更。",
  },
  {
    id: "apple-music-family",
    provider: "Apple Music",
    plan: "ファミリー",
    name: "Apple Music ファミリー",
    amount: 1680,
    cycle: "monthly",
    category: "サブスク",
    paymentMethod: "Apple ID",
    priority: "medium",
    memo: "公式料金: ファミリー 月額1,680円。",
  },
  {
    id: "apple-music-student",
    provider: "Apple Music",
    plan: "学生",
    name: "Apple Music 学生",
    amount: 580,
    cycle: "monthly",
    category: "サブスク",
    paymentMethod: "Apple ID",
    priority: "low",
    memo: "公式料金: 学生 月額580円。",
  },
  {
    id: "netflix-ads",
    provider: "Netflix",
    plan: "広告つきスタンダード",
    name: "Netflix 広告つきスタンダード",
    amount: 890,
    cycle: "monthly",
    category: "サブスク",
    paymentMethod: "クレジットカード",
    priority: "medium",
    memo: "日本向け料金の目安: 月額890円。最新価格は公式サイトで確認。",
  },
  {
    id: "netflix-standard",
    provider: "Netflix",
    plan: "スタンダード",
    name: "Netflix スタンダード",
    amount: 1590,
    cycle: "monthly",
    category: "サブスク",
    paymentMethod: "クレジットカード",
    priority: "medium",
    memo: "日本向け料金の目安: 月額1,590円。最新価格は公式サイトで確認。",
  },
  {
    id: "netflix-premium",
    provider: "Netflix",
    plan: "プレミアム",
    name: "Netflix プレミアム",
    amount: 2290,
    cycle: "monthly",
    category: "サブスク",
    paymentMethod: "クレジットカード",
    priority: "high",
    memo: "日本向け料金の目安: 月額2,290円。4K視聴が不要なら見直し候補。",
  },
  {
    id: "amazon-prime-monthly",
    provider: "Amazon",
    plan: "Prime 月払い",
    name: "Amazon Prime",
    amount: 600,
    cycle: "monthly",
    category: "サブスク",
    paymentMethod: "Amazon",
    priority: "low",
    memo: "公式料金: 月額600円。年払いは5,900円。",
  },
  {
    id: "amazon-prime-yearly",
    provider: "Amazon",
    plan: "Prime 年払い",
    name: "Amazon Prime 年間プラン",
    amount: 5900,
    cycle: "yearly",
    category: "サブスク",
    paymentMethod: "Amazon",
    priority: "low",
    memo: "公式料金: 年額5,900円。月払いより年間1,300円安い。",
  },
  {
    id: "spotify-standard",
    provider: "Spotify",
    plan: "Standard",
    name: "Spotify Premium Standard",
    amount: 1080,
    cycle: "monthly",
    category: "サブスク",
    paymentMethod: "クレジットカード",
    priority: "medium",
    memo: "公式料金: Standard 月額1,080円。",
  },
  {
    id: "spotify-duo",
    provider: "Spotify",
    plan: "Duo",
    name: "Spotify Premium Duo",
    amount: 1480,
    cycle: "monthly",
    category: "サブスク",
    paymentMethod: "クレジットカード",
    priority: "medium",
    memo: "公式料金: Duo 月額1,480円。",
  },
  {
    id: "spotify-family",
    provider: "Spotify",
    plan: "Family",
    name: "Spotify Premium Family",
    amount: 1880,
    cycle: "monthly",
    category: "サブスク",
    paymentMethod: "クレジットカード",
    priority: "medium",
    memo: "公式料金: Family 月額1,880円。",
  },
  {
    id: "youtube-premium",
    provider: "YouTube",
    plan: "Premium 個人",
    name: "YouTube Premium",
    amount: 1280,
    cycle: "monthly",
    category: "サブスク",
    paymentMethod: "Google Play",
    priority: "high",
    memo: "日本向け個人プランの目安。広告なし再生が不要なら見直し候補。",
  },
  {
    id: "youtube-lite",
    provider: "YouTube",
    plan: "Premium Lite",
    name: "YouTube Premium Lite",
    amount: 780,
    cycle: "monthly",
    category: "サブスク",
    paymentMethod: "Google Play",
    priority: "medium",
    memo: "日本向けLiteプランの目安。Music不要なら比較対象。",
  },
  {
    id: "disney-standard",
    provider: "Disney+",
    plan: "スタンダード",
    name: "Disney+ スタンダード",
    amount: 1250,
    cycle: "monthly",
    category: "サブスク",
    paymentMethod: "クレジットカード",
    priority: "medium",
    memo: "日本向け月額の目安。年額プランも比較。",
  },
  {
    id: "disney-premium",
    provider: "Disney+",
    plan: "プレミアム",
    name: "Disney+ プレミアム",
    amount: 1670,
    cycle: "monthly",
    category: "サブスク",
    paymentMethod: "クレジットカード",
    priority: "medium",
    memo: "日本向け月額の目安。4K視聴が不要ならスタンダードも候補。",
  },
  {
    id: "unext",
    provider: "U-NEXT",
    plan: "月額プラン",
    name: "U-NEXT",
    amount: 2189,
    cycle: "monthly",
    category: "サブスク",
    paymentMethod: "クレジットカード",
    priority: "high",
    memo: "動画サブスクの中では重め。利用頻度を月1回見直し。",
  },
  {
    id: "hulu",
    provider: "Hulu",
    plan: "月額",
    name: "Hulu",
    amount: 1026,
    cycle: "monthly",
    category: "サブスク",
    paymentMethod: "クレジットカード",
    priority: "medium",
    memo: "視聴が止まっていたらローテーション解約の候補。",
  },
  {
    id: "amex-green",
    provider: "American Express",
    plan: "グリーン 月会費",
    name: "アメックス・グリーン",
    amount: 1100,
    cycle: "monthly",
    category: "その他",
    paymentMethod: "口座振替",
    priority: "medium",
    memo: "公式料金: 月会費1,100円。カード特典の利用実績を確認。",
  },
  {
    id: "amex-gold",
    provider: "American Express",
    plan: "ゴールド・プリファード 年会費",
    name: "アメックス・ゴールド・プリファード",
    amount: 39600,
    cycle: "yearly",
    category: "その他",
    paymentMethod: "口座振替",
    priority: "high",
    memo: "公式料金: 年会費39,600円。特典回収できているか見直し。",
  },
  {
    id: "amex-platinum",
    provider: "American Express",
    plan: "プラチナ 年会費",
    name: "アメックス・プラチナ",
    amount: 165000,
    cycle: "yearly",
    category: "その他",
    paymentMethod: "口座振替",
    priority: "high",
    memo: "公式料金: 年会費165,000円。旅行/ホテル特典の利用実績を確認。",
  },
];

const viewTabs: Array<{ id: View; label: string; icon: ReactNode }> = [
  { id: "dashboard", label: "ダッシュボード", icon: <LayoutDashboard size={18} /> },
  { id: "list", label: "固定費一覧", icon: <ListFilter size={18} /> },
  { id: "editor", label: "追加・編集", icon: <Plus size={18} /> },
  { id: "calendar", label: "カレンダー", icon: <CalendarDays size={18} /> },
  { id: "settings", label: "設定", icon: <Settings size={18} /> },
];

const formatCurrency = new Intl.NumberFormat("ja-JP", {
  style: "currency",
  currency: "JPY",
  maximumFractionDigits: 0,
});

const formatShortDate = new Intl.DateTimeFormat("ja-JP", {
  month: "numeric",
  day: "numeric",
  weekday: "short",
});

function newId() {
  return crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function parseISODate(value: string) {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function toISODate(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function startOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function endOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0);
}

function daysInMonth(year: number, monthIndex: number) {
  return new Date(year, monthIndex + 1, 0).getDate();
}

function addDays(date: Date, days: number) {
  const copy = new Date(date);
  copy.setDate(copy.getDate() + days);
  return copy;
}

function addMonths(date: Date, months: number) {
  const target = new Date(date);
  const day = target.getDate();
  target.setDate(1);
  target.setMonth(target.getMonth() + months);
  target.setDate(Math.min(day, daysInMonth(target.getFullYear(), target.getMonth())));
  return target;
}

function isSameMonth(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth();
}

function isSameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function diffDays(from: Date, to: Date) {
  const oneDay = 24 * 60 * 60 * 1000;
  return Math.round((startOfDay(to).getTime() - startOfDay(from).getTime()) / oneDay);
}

function cycleLabel(cycle: BillingCycle) {
  return cycleOptions.find((option) => option.value === cycle)?.label ?? cycle;
}

function cycleCompact(cycle: BillingCycle) {
  return cycleOptions.find((option) => option.value === cycle)?.compact ?? cycle;
}

function cycleMonths(cycle: BillingCycle) {
  switch (cycle) {
    case "monthly":
      return 1;
    case "bimonthly":
      return 2;
    case "quarterly":
      return 3;
    case "semiannual":
      return 6;
    case "yearly":
      return 12;
    default:
      return null;
  }
}

function monthlyEquivalent(cost: FixedCost | CostDraft) {
  switch (cost.cycle) {
    case "monthly":
      return cost.amount;
    case "bimonthly":
      return cost.amount / 2;
    case "quarterly":
      return cost.amount / 3;
    case "semiannual":
      return cost.amount / 6;
    case "yearly":
      return cost.amount / 12;
    case "one-time":
      return 0;
  }
}

function annualEquivalent(cost: FixedCost) {
  if (cost.cycle === "one-time") {
    const paymentYear = parseISODate(cost.nextPaymentDate).getFullYear();
    return paymentYear === new Date().getFullYear() ? cost.amount : 0;
  }
  return monthlyEquivalent(cost) * 12;
}

function nextOccurrenceDate(cost: FixedCost, baseDate = new Date()) {
  const base = startOfDay(baseDate);
  const cancellation = cost.cancellationDate ? parseISODate(cost.cancellationDate) : null;
  let next = parseISODate(cost.nextPaymentDate);

  if (cost.cycle === "one-time") {
    if (next < base || (cancellation && next > cancellation)) return null;
    return next;
  }

  const months = cycleMonths(cost.cycle);
  if (!months) return null;

  while (next < base) {
    next = addMonths(next, months);
  }

  if (cancellation && next > cancellation) return null;
  return next;
}

function occurrencesInMonth(cost: FixedCost, targetMonth: Date) {
  const start = startOfMonth(targetMonth);
  const end = endOfMonth(targetMonth);
  const cancellation = cost.cancellationDate ? parseISODate(cost.cancellationDate) : null;
  const dates: Date[] = [];
  let cursor = parseISODate(cost.nextPaymentDate);

  if (cost.cycle === "one-time") {
    if (cursor >= start && cursor <= end && (!cancellation || cursor <= cancellation)) {
      dates.push(cursor);
    }
    return dates;
  }

  const months = cycleMonths(cost.cycle);
  if (!months) return dates;

  while (cursor < start) {
    cursor = addMonths(cursor, months);
  }

  while (cursor <= end) {
    if (!cancellation || cursor <= cancellation) {
      dates.push(cursor);
    }
    cursor = addMonths(cursor, months);
  }

  return dates;
}

function safeNumber(value: unknown) {
  const numeric = Number(value);
  return Number.isFinite(numeric) && numeric >= 0 ? Math.round(numeric) : 0;
}

function normalizeImportedCost(raw: Partial<FixedCost>, index: number): FixedCost | null {
  if (!raw.name || !raw.nextPaymentDate) return null;

  const category = categories.some((item) => item.value === raw.category) ? raw.category! : "その他";
  const cycle = cycleOptions.some((item) => item.value === raw.cycle) ? raw.cycle! : "monthly";
  const priority = priorityOptions.some((item) => item.value === raw.priority) ? raw.priority! : "medium";
  const now = new Date().toISOString();

  return {
    id: raw.id || `${Date.now()}-${index}`,
    name: String(raw.name),
    amount: safeNumber(raw.amount),
    cycle,
    nextPaymentDate: raw.nextPaymentDate,
    category,
    paymentMethod: raw.paymentMethod || "未設定",
    startDate: raw.startDate || "",
    cancellationDate: raw.cancellationDate || "",
    memo: raw.memo || "",
    priority,
    createdAt: raw.createdAt || now,
    updatedAt: raw.updatedAt || now,
  };
}

function emptyDraft(): CostDraft {
  return {
    name: "",
    amount: 0,
    cycle: "monthly",
    nextPaymentDate: toISODate(new Date()),
    category: "サブスク",
    paymentMethod: "クレジットカード",
    startDate: "",
    cancellationDate: "",
    memo: "",
    priority: "medium",
  };
}

function createCost(draft: CostDraft): FixedCost {
  const now = new Date().toISOString();
  return {
    ...draft,
    id: newId(),
    amount: safeNumber(draft.amount),
    createdAt: now,
    updatedAt: now,
  };
}

function nextDayOfMonth(day: number) {
  const now = new Date();
  const target = new Date(now.getFullYear(), now.getMonth(), day);
  if (target < startOfDay(now)) {
    return toISODate(addMonths(target, 1));
  }
  return toISODate(target);
}

function nextMonthDay(day: number) {
  const now = new Date();
  return toISODate(new Date(now.getFullYear(), now.getMonth() + 1, day));
}

function buildSampleCosts(): FixedCost[] {
  const base: CostDraft[] = [
    {
      name: "家賃",
      amount: 120000,
      cycle: "monthly",
      nextPaymentDate: nextMonthDay(1),
      category: "家賃",
      paymentMethod: "銀行振込",
      startDate: "2025-04-01",
      cancellationDate: "",
      memo: "住居費。更新月と火災保険も別途確認。",
      priority: "low",
    },
    {
      name: "電気代",
      amount: 11000,
      cycle: "monthly",
      nextPaymentDate: nextDayOfMonth(18),
      category: "光熱費",
      paymentMethod: "クレジットカード",
      startDate: "2025-04-01",
      cancellationDate: "",
      memo: "季節変動あり。月額は直近平均。",
      priority: "medium",
    },
    {
      name: "水道代",
      amount: 7200,
      cycle: "bimonthly",
      nextPaymentDate: nextDayOfMonth(25),
      category: "光熱費",
      paymentMethod: "口座振替",
      startDate: "2025-04-01",
      cancellationDate: "",
      memo: "隔月請求。",
      priority: "low",
    },
    {
      name: "スマホ回線",
      amount: 4980,
      cycle: "monthly",
      nextPaymentDate: nextDayOfMonth(27),
      category: "通信費",
      paymentMethod: "クレジットカード",
      startDate: "2024-09-01",
      cancellationDate: "",
      memo: "データ使用量を見てプラン変更候補。",
      priority: "high",
    },
    {
      name: "自宅インターネット",
      amount: 5200,
      cycle: "monthly",
      nextPaymentDate: nextDayOfMonth(30),
      category: "通信費",
      paymentMethod: "クレジットカード",
      startDate: "2024-05-01",
      cancellationDate: "",
      memo: "更新月の解約金を確認。",
      priority: "medium",
    },
    {
      name: "生命保険",
      amount: 36000,
      cycle: "yearly",
      nextPaymentDate: toISODate(addMonths(new Date(), 4)),
      category: "保険",
      paymentMethod: "口座振替",
      startDate: "2022-08-01",
      cancellationDate: "",
      memo: "保障内容と重複を年1回確認。",
      priority: "medium",
    },
    {
      name: "ジム",
      amount: 8800,
      cycle: "monthly",
      nextPaymentDate: nextDayOfMonth(20),
      category: "その他",
      paymentMethod: "クレジットカード",
      startDate: "2025-01-10",
      cancellationDate: "",
      memo: "月4回未満なら都度利用と比較。",
      priority: "high",
    },
    {
      name: "Apple Music",
      amount: 1080,
      cycle: "monthly",
      nextPaymentDate: nextDayOfMonth(12),
      category: "サブスク",
      paymentMethod: "Apple ID",
      startDate: "2024-03-12",
      cancellationDate: "",
      memo: "個人プラン。公式料金を元に設定。",
      priority: "medium",
    },
    {
      name: "Netflix スタンダード",
      amount: 1590,
      cycle: "monthly",
      nextPaymentDate: nextDayOfMonth(16),
      category: "サブスク",
      paymentMethod: "クレジットカード",
      startDate: "2023-11-16",
      cancellationDate: "",
      memo: "視聴していない月はローテーション解約候補。",
      priority: "medium",
    },
    {
      name: "Amazon Prime 年間プラン",
      amount: 5900,
      cycle: "yearly",
      nextPaymentDate: toISODate(addMonths(new Date(), 5)),
      category: "サブスク",
      paymentMethod: "Amazon",
      startDate: "2022-10-01",
      cancellationDate: "",
      memo: "公式料金を元に設定。月換算も確認。",
      priority: "low",
    },
    {
      name: "アメックス・グリーン",
      amount: 1100,
      cycle: "monthly",
      nextPaymentDate: nextDayOfMonth(10),
      category: "その他",
      paymentMethod: "口座振替",
      startDate: "2025-02-10",
      cancellationDate: "",
      memo: "月会費。特典の利用実績を確認。",
      priority: "medium",
    },
    {
      name: "奨学金返済",
      amount: 17000,
      cycle: "monthly",
      nextPaymentDate: nextDayOfMonth(27),
      category: "ローン",
      paymentMethod: "口座振替",
      startDate: "2020-04-27",
      cancellationDate: "",
      memo: "残回数と繰上返済可否を確認。",
      priority: "low",
    },
  ];

  return base.map(createCost);
}

function loadInitialCosts() {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored === null) return buildSampleCosts();

  try {
    const parsed = JSON.parse(stored) as FixedCost[];
    if (!Array.isArray(parsed)) return buildSampleCosts();
    return parsed.map(normalizeImportedCost).filter(Boolean) as FixedCost[];
  } catch {
    return buildSampleCosts();
  }
}

function loadInitialTheme(): ThemeMode {
  const stored = localStorage.getItem(THEME_KEY);
  if (stored === "light" || stored === "dark") return stored;
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function StatCard({
  icon,
  label,
  value,
  sub,
  tone = "default",
}: {
  icon: ReactNode;
  label: string;
  value: string;
  sub: string;
  tone?: "default" | "strong" | "warn";
}) {
  return (
    <article className={`stat-card tone-${tone}`}>
      <div className="stat-icon">{icon}</div>
      <div>
        <p>{label}</p>
        <strong>{value}</strong>
        <span>{sub}</span>
      </div>
    </article>
  );
}

function EmptyState({ title, description, action }: { title: string; description: string; action?: ReactNode }) {
  return (
    <div className="empty-state">
      <Sparkles size={28} />
      <strong>{title}</strong>
      <p>{description}</p>
      {action}
    </div>
  );
}

export default function App() {
  const [costs, setCosts] = useState<FixedCost[]>(loadInitialCosts);
  const [theme, setTheme] = useState<ThemeMode>(loadInitialTheme);
  const [activeView, setActiveView] = useState<View>("dashboard");
  const [draft, setDraft] = useState<CostDraft>(emptyDraft);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<Category | "all">("all");
  const [paymentFilter, setPaymentFilter] = useState("all");
  const [sortKey, setSortKey] = useState<SortKey>("date");
  const [calendarMonth, setCalendarMonth] = useState(startOfMonth(new Date()));

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(costs));
  }, [costs]);

  useEffect(() => {
    localStorage.setItem(THEME_KEY, theme);
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  const today = useMemo(() => startOfDay(new Date()), []);

  const paymentMethods = useMemo(() => {
    return Array.from(new Set(costs.map((cost) => cost.paymentMethod).filter(Boolean))).sort();
  }, [costs]);

  const currentMonthOccurrences = useMemo(() => {
    return costs.flatMap((cost) =>
      occurrencesInMonth(cost, today).map((date) => ({
        cost,
        date,
      })),
    );
  }, [costs, today]);

  const thisMonthTotal = useMemo(() => {
    return currentMonthOccurrences.reduce((sum, occurrence) => sum + occurrence.cost.amount, 0);
  }, [currentMonthOccurrences]);

  const monthlyTotal = useMemo(() => costs.reduce((sum, cost) => sum + monthlyEquivalent(cost), 0), [costs]);
  const annualTotal = useMemo(() => costs.reduce((sum, cost) => sum + annualEquivalent(cost), 0), [costs]);

  const upcoming = useMemo(() => {
    const until = addDays(today, 45);
    return costs
      .map((cost) => {
        const date = nextOccurrenceDate(cost, today);
        return date ? { cost, date, days: diffDays(today, date) } : null;
      })
      .filter((item): item is { cost: FixedCost; date: Date; days: number } => Boolean(item))
      .filter((item) => item.date <= until)
      .sort((a, b) => a.date.getTime() - b.date.getTime());
  }, [costs, today]);

  const categoryTotals = useMemo(() => {
    return categories
      .map((category) => {
        const total = costs
          .filter((cost) => cost.category === category.value)
          .reduce((sum, cost) => sum + monthlyEquivalent(cost), 0);
        return { ...category, total };
      })
      .filter((category) => category.total > 0)
      .sort((a, b) => b.total - a.total);
  }, [costs]);

  const maxCategoryTotal = Math.max(1, ...categoryTotals.map((category) => category.total));

  const reviewCandidates = useMemo(() => {
    return costs
      .map((cost) => {
        const monthly = monthlyEquivalent(cost);
        const cancelSoon = cost.cancellationDate
          ? diffDays(today, parseISODate(cost.cancellationDate)) <= 90 &&
            diffDays(today, parseISODate(cost.cancellationDate)) >= 0
          : false;
        const score =
          (cost.priority === "high" ? 3 : cost.priority === "medium" ? 1 : 0) +
          (monthly >= 5000 ? 2 : monthly >= 1500 ? 1 : 0) +
          (cancelSoon ? 2 : 0);
        return { cost, monthly, score, cancelSoon };
      })
      .filter((item) => item.score >= 2)
      .sort((a, b) => b.score - a.score || b.monthly - a.monthly)
      .slice(0, 6);
  }, [costs, today]);

  const filteredCosts = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return costs
      .filter((cost) => {
        const matchesQuery =
          !normalizedQuery ||
          `${cost.name} ${cost.memo} ${cost.paymentMethod}`.toLowerCase().includes(normalizedQuery);
        const matchesCategory = categoryFilter === "all" || cost.category === categoryFilter;
        const matchesPayment = paymentFilter === "all" || cost.paymentMethod === paymentFilter;
        return matchesQuery && matchesCategory && matchesPayment;
      })
      .sort((a, b) => {
        if (sortKey === "amount-desc") return b.amount - a.amount;
        if (sortKey === "amount-asc") return a.amount - b.amount;
        if (sortKey === "name") return a.name.localeCompare(b.name, "ja");
        const aDate = nextOccurrenceDate(a, today)?.getTime() ?? Number.MAX_SAFE_INTEGER;
        const bDate = nextOccurrenceDate(b, today)?.getTime() ?? Number.MAX_SAFE_INTEGER;
        return aDate - bDate;
      });
  }, [categoryFilter, costs, paymentFilter, query, sortKey, today]);

  const calendarOccurrences = useMemo(() => {
    return costs.flatMap((cost) =>
      occurrencesInMonth(cost, calendarMonth).map((date) => ({
        cost,
        date,
      })),
    );
  }, [calendarMonth, costs]);

  const calendarTotal = calendarOccurrences.reduce((sum, occurrence) => sum + occurrence.cost.amount, 0);

  function switchView(view: View) {
    if (view === "editor" && activeView !== "editor") {
      setEditingId(null);
      setDraft(emptyDraft());
    }
    setActiveView(view);
  }

  function openCreate() {
    setEditingId(null);
    setDraft(emptyDraft());
    setActiveView("editor");
  }

  function openEdit(cost: FixedCost) {
    setEditingId(cost.id);
    setDraft({
      name: cost.name,
      amount: cost.amount,
      cycle: cost.cycle,
      nextPaymentDate: cost.nextPaymentDate,
      category: cost.category,
      paymentMethod: cost.paymentMethod,
      startDate: cost.startDate,
      cancellationDate: cost.cancellationDate,
      memo: cost.memo,
      priority: cost.priority,
    });
    setActiveView("editor");
  }

  function updateDraft<K extends keyof CostDraft>(key: K, value: CostDraft[K]) {
    setDraft((current) => ({ ...current, [key]: value }));
  }

  function applyPreset(presetId: string) {
    const preset = costPresets.find((item) => item.id === presetId);
    if (!preset) return;

    setDraft((current) => ({
      ...current,
      name: preset.name,
      amount: preset.amount,
      cycle: preset.cycle,
      category: preset.category,
      paymentMethod: preset.paymentMethod,
      memo: preset.memo,
      priority: preset.priority,
    }));
  }

  function saveCost(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!draft.name.trim()) {
      alert("名称を入力してください。");
      return;
    }

    const normalizedDraft = {
      ...draft,
      name: draft.name.trim(),
      amount: safeNumber(draft.amount),
      paymentMethod: draft.paymentMethod.trim() || "未設定",
      memo: draft.memo.trim(),
    };

    if (editingId) {
      setCosts((current) =>
        current.map((cost) =>
          cost.id === editingId
            ? {
                ...cost,
                ...normalizedDraft,
                updatedAt: new Date().toISOString(),
              }
            : cost,
        ),
      );
    } else {
      setCosts((current) => [createCost(normalizedDraft), ...current]);
    }

    setDraft(emptyDraft());
    setEditingId(null);
    setActiveView("list");
  }

  function deleteCost(id: string) {
    const target = costs.find((cost) => cost.id === id);
    if (!target) return;
    if (!window.confirm(`${target.name} を削除しますか？`)) return;
    setCosts((current) => current.filter((cost) => cost.id !== id));
    if (editingId === id) {
      setEditingId(null);
      setDraft(emptyDraft());
      setActiveView("list");
    }
  }

  function advancePayment(id: string) {
    setCosts((current) =>
      current.map((cost) => {
        if (cost.id !== id) return cost;
        const months = cycleMonths(cost.cycle);
        if (!months) return cost;

        let next = addMonths(parseISODate(cost.nextPaymentDate), months);
        while (next < today) {
          next = addMonths(next, months);
        }

        return {
          ...cost,
          nextPaymentDate: toISODate(next),
          updatedAt: new Date().toISOString(),
        };
      }),
    );
  }

  function exportJson() {
    const payload = {
      app: "Fixed Flow",
      version: 1,
      exportedAt: new Date().toISOString(),
      costs,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `fixed-flow-${toISODate(new Date())}.json`;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  async function importJson(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const parsed = JSON.parse(text) as { costs?: Partial<FixedCost>[] } | Partial<FixedCost>[];
      const rawCosts = Array.isArray(parsed) ? parsed : parsed.costs;
      if (!Array.isArray(rawCosts)) throw new Error("Invalid JSON");
      const imported = rawCosts.map(normalizeImportedCost).filter(Boolean) as FixedCost[];
      if (imported.length === 0) throw new Error("No valid costs");
      setCosts(imported);
      alert(`${imported.length}件の固定費をインポートしました。`);
    } catch {
      alert("JSONの読み込みに失敗しました。エクスポートした形式に合わせてください。");
    } finally {
      event.target.value = "";
    }
  }

  function resetSampleData() {
    if (!window.confirm("現在のデータをサンプルデータで上書きしますか？")) return;
    setCosts(buildSampleCosts());
    setActiveView("dashboard");
  }

  function deleteAllData() {
    if (!window.confirm("すべての固定費データを削除しますか？この操作は戻せません。")) return;
    setCosts([]);
    setActiveView("dashboard");
  }

  const renderDashboard = () => (
    <div className="view-grid">
      <section className="stats-grid">
        <StatCard
          icon={<WalletCards size={22} />}
          label="今月の固定費合計"
          value={formatCurrency.format(thisMonthTotal)}
          sub={`${currentMonthOccurrences.length}件の支払予定`}
          tone="strong"
        />
        <StatCard
          icon={<CircleDollarSign size={22} />}
          label="月額換算"
          value={formatCurrency.format(monthlyTotal)}
          sub="周期をならした毎月の重さ"
        />
        <StatCard
          icon={<CalendarDays size={22} />}
          label="年間換算額"
          value={formatCurrency.format(annualTotal)}
          sub="単発予定は今年分だけ加算"
        />
        <StatCard
          icon={<AlertTriangle size={22} />}
          label="見直し候補"
          value={`${reviewCandidates.length}件`}
          sub="高優先度・高額・解約予定から抽出"
          tone="warn"
        />
      </section>

      <section className="panel hero-panel wide-panel">
        <div className="hero-copy">
          <p className="eyebrow">Fixed Flow</p>
          <h1>固定費の重さを、毎日見えるところに。</h1>
          <p>
            次回支払日、月額換算、年額インパクトを一画面にまとめます。
            localStorage保存なので、まずは個人用の家計メンテナンスに集中できます。
          </p>
        </div>
        <div className="weight-meter" aria-label="月額換算の重さ">
          <div>
            <span>月額換算</span>
            <strong>{formatCurrency.format(monthlyTotal)}</strong>
          </div>
          <div className="meter-track">
            <span style={{ width: `${Math.min(100, (monthlyTotal / 180000) * 100)}%` }} />
          </div>
          <small>
            {monthlyTotal >= 150000
              ? "住居費・ローンを含めてかなり重めです"
              : monthlyTotal >= 80000
                ? "固定費の見直し余地を探せます"
                : "軽めに保てています"}
          </small>
        </div>
      </section>

      <section className="panel">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Next payments</p>
            <h2>次回支払予定</h2>
          </div>
          <button className="ghost-button" onClick={openCreate} type="button">
            <Plus size={16} />
            追加
          </button>
        </div>
        {upcoming.length > 0 ? (
          <div className="upcoming-list">
            {upcoming.slice(0, 7).map(({ cost, date, days }) => (
              <article className="upcoming-item" key={`${cost.id}-${date.toISOString()}`}>
                <div>
                  <span className={`priority-dot priority-${cost.priority}`} />
                  <strong>{cost.name}</strong>
                  <small>{days === 0 ? "今日" : `${days}日後`}・{formatShortDate.format(date)}</small>
                </div>
                <span>{formatCurrency.format(cost.amount)}</span>
              </article>
            ))}
          </div>
        ) : (
          <EmptyState title="45日以内の支払いはありません" description="カレンダーで先の月も確認できます。" />
        )}
      </section>

      <section className="panel">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Categories</p>
            <h2>カテゴリ別の支出</h2>
          </div>
          <span className="muted">月額換算</span>
        </div>
        {categoryTotals.length > 0 ? (
          <div className="category-list">
            {categoryTotals.map((category) => (
              <div className="category-row" key={category.value}>
                <div>
                  <span className="category-swatch" style={{ background: category.color }} />
                  <strong>{category.label}</strong>
                </div>
                <div className="category-bar-wrap">
                  <span
                    className="category-bar"
                    style={{ width: `${(category.total / maxCategoryTotal) * 100}%`, background: category.color }}
                  />
                </div>
                <span>{formatCurrency.format(category.total)}</span>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState title="カテゴリ集計はまだありません" description="固定費を追加すると自動で表示します。" />
        )}
      </section>

      <section className="panel wide-panel">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Review queue</p>
            <h2>見直し候補</h2>
          </div>
          <button className="ghost-button" type="button" onClick={() => setActiveView("list")}>
            一覧で確認
          </button>
        </div>
        {reviewCandidates.length > 0 ? (
          <div className="review-grid">
            {reviewCandidates.map(({ cost, monthly, cancelSoon }) => (
              <article className="review-card" key={cost.id}>
                <div className="review-card-top">
                  <span className={`chip chip-${cost.priority}`}>優先度 {priorityLabel(cost.priority)}</span>
                  <button className="icon-button" onClick={() => openEdit(cost)} aria-label={`${cost.name}を編集`}>
                    <Edit3 size={16} />
                  </button>
                </div>
                <strong>{cost.name}</strong>
                <p>{cost.memo || "利用頻度・代替プラン・年払い割引を確認しましょう。"}</p>
                <div className="review-card-foot">
                  <span>月換算 {formatCurrency.format(monthly)}</span>
                  {cancelSoon && <span>解約予定近い</span>}
                </div>
              </article>
            ))}
          </div>
        ) : (
          <EmptyState title="大きな見直し候補はありません" description="優先度を高にするとここへ集められます。" />
        )}
      </section>
    </div>
  );

  const renderList = () => (
    <div className="view-grid">
      <section className="panel wide-panel">
        <div className="section-heading list-heading">
          <div>
            <p className="eyebrow">Fixed costs</p>
            <h2>固定費一覧</h2>
          </div>
          <button className="primary-button" onClick={openCreate} type="button">
            <Plus size={16} />
            新規追加
          </button>
        </div>
        <div className="toolbar">
          <label className="search-box">
            <Search size={16} />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="名称・メモ・支払方法で検索"
            />
          </label>
          <label>
            <Filter size={15} />
            <select value={categoryFilter} onChange={(event) => setCategoryFilter(event.target.value as Category | "all")}>
              <option value="all">全カテゴリ</option>
              {categories.map((category) => (
                <option value={category.value} key={category.value}>
                  {category.label}
                </option>
              ))}
            </select>
          </label>
          <label>
            <WalletCards size={15} />
            <select value={paymentFilter} onChange={(event) => setPaymentFilter(event.target.value)}>
              <option value="all">全支払方法</option>
              {paymentMethods.map((method) => (
                <option value={method} key={method}>
                  {method}
                </option>
              ))}
            </select>
          </label>
          <label>
            <ListFilter size={15} />
            <select value={sortKey} onChange={(event) => setSortKey(event.target.value as SortKey)}>
              <option value="date">支払日が近い順</option>
              <option value="amount-desc">金額が高い順</option>
              <option value="amount-asc">金額が低い順</option>
              <option value="name">名称順</option>
            </select>
          </label>
        </div>

        {filteredCosts.length > 0 ? (
          <div className="cost-list">
            {filteredCosts.map((cost) => (
              <CostCard
                cost={cost}
                key={cost.id}
                today={today}
                onEdit={() => openEdit(cost)}
                onDelete={() => deleteCost(cost.id)}
                onAdvance={() => advancePayment(cost.id)}
              />
            ))}
          </div>
        ) : (
          <EmptyState
            title="条件に合う固定費がありません"
            description="フィルターを外すか、新しい固定費を追加してください。"
            action={
              <button className="primary-button" onClick={openCreate} type="button">
                <Plus size={16} />
                追加する
              </button>
            }
          />
        )}
      </section>
    </div>
  );

  const renderEditor = () => (
    <section className="panel editor-panel">
      <div className="section-heading">
        <div>
          <p className="eyebrow">{editingId ? "Edit" : "Add new"}</p>
          <h2>{editingId ? "固定費を編集" : "固定費を追加"}</h2>
        </div>
        {editingId && (
          <button className="danger-ghost-button" onClick={() => deleteCost(editingId)} type="button">
            <Trash2 size={16} />
            削除
          </button>
        )}
      </div>

      <div className="preset-strip">
        <label>
          <Sparkles size={16} />
          <select defaultValue="" onChange={(event) => applyPreset(event.target.value)}>
            <option value="" disabled>
              サブスク/カードのテンプレートを選択
            </option>
            {Object.entries(groupPresets()).map(([provider, presets]) => (
              <optgroup label={provider} key={provider}>
                {presets.map((preset) => (
                  <option value={preset.id} key={preset.id}>
                    {preset.plan} - {formatCurrency.format(preset.amount)} / {cycleCompact(preset.cycle)}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
        </label>
        <span>金額はあとから自由に編集できます。</span>
      </div>

      <form className="editor-form" onSubmit={saveCost}>
        <label className="field span-2">
          <span>名称</span>
          <input value={draft.name} onChange={(event) => updateDraft("name", event.target.value)} placeholder="例: Netflix" />
        </label>
        <label className="field">
          <span>金額</span>
          <input
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            min="0"
            value={draft.amount}
            onChange={(event) => updateDraft("amount", safeNumber(event.target.value))}
          />
        </label>
        <label className="field">
          <span>支払周期</span>
          <select value={draft.cycle} onChange={(event) => updateDraft("cycle", event.target.value as BillingCycle)}>
            {cycleOptions.map((option) => (
              <option value={option.value} key={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
        <label className="field">
          <span>次回支払日</span>
          <input
            type="date"
            value={draft.nextPaymentDate}
            onChange={(event) => updateDraft("nextPaymentDate", event.target.value)}
          />
        </label>
        <label className="field">
          <span>カテゴリ</span>
          <select value={draft.category} onChange={(event) => updateDraft("category", event.target.value as Category)}>
            {categories.map((category) => (
              <option value={category.value} key={category.value}>
                {category.label}
              </option>
            ))}
          </select>
        </label>
        <label className="field">
          <span>支払方法</span>
          <input
            value={draft.paymentMethod}
            onChange={(event) => updateDraft("paymentMethod", event.target.value)}
            placeholder="例: 楽天カード"
            list="payment-methods"
          />
          <datalist id="payment-methods">
            {paymentMethods.map((method) => (
              <option value={method} key={method} />
            ))}
          </datalist>
        </label>
        <label className="field">
          <span>契約開始日</span>
          <input type="date" value={draft.startDate} onChange={(event) => updateDraft("startDate", event.target.value)} />
        </label>
        <label className="field">
          <span>解約予定日</span>
          <input
            type="date"
            value={draft.cancellationDate}
            onChange={(event) => updateDraft("cancellationDate", event.target.value)}
          />
        </label>
        <div className="field span-2">
          <span>見直し優先度</span>
          <div className="segmented">
            {priorityOptions.map((option) => (
              <button
                className={draft.priority === option.value ? "active" : ""}
                type="button"
                key={option.value}
                onClick={() => updateDraft("priority", option.value)}
                title={option.hint}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
        <label className="field span-2">
          <span>メモ</span>
          <textarea
            value={draft.memo}
            onChange={(event) => updateDraft("memo", event.target.value)}
            rows={4}
            placeholder="利用頻度、更新月、解約条件、割引の有無など"
          />
        </label>
        <div className="form-summary span-2">
          <div>
            <span>月額換算</span>
            <strong>{formatCurrency.format(monthlyEquivalent(draft))}</strong>
          </div>
          <div>
            <span>年額インパクト</span>
            <strong>
              {formatCurrency.format(draft.cycle === "one-time" ? draft.amount : monthlyEquivalent(draft) * 12)}
            </strong>
          </div>
        </div>
        <div className="form-actions span-2">
          <button className="ghost-button" type="button" onClick={() => setActiveView(editingId ? "list" : "dashboard")}>
            キャンセル
          </button>
          <button className="primary-button" type="submit">
            <Save size={16} />
            保存
          </button>
        </div>
      </form>
    </section>
  );

  const renderCalendar = () => {
    const first = startOfMonth(calendarMonth);
    const last = endOfMonth(calendarMonth);
    const blankCount = first.getDay();
    const days = [
      ...Array.from({ length: blankCount }, (_, index) => null),
      ...Array.from({ length: last.getDate() }, (_, index) => new Date(first.getFullYear(), first.getMonth(), index + 1)),
    ];

    return (
      <div className="view-grid">
        <section className="panel wide-panel">
          <div className="calendar-header">
            <div>
              <p className="eyebrow">Calendar</p>
              <h2>{calendarMonth.getFullYear()}年 {calendarMonth.getMonth() + 1}月</h2>
              <span>{formatCurrency.format(calendarTotal)} / {calendarOccurrences.length}件</span>
            </div>
            <div className="calendar-controls">
              <button className="icon-button" onClick={() => setCalendarMonth(addMonths(calendarMonth, -1))} aria-label="前月">
                <ChevronLeft size={18} />
              </button>
              <button className="ghost-button" onClick={() => setCalendarMonth(startOfMonth(new Date()))} type="button">
                今月
              </button>
              <button className="icon-button" onClick={() => setCalendarMonth(addMonths(calendarMonth, 1))} aria-label="翌月">
                <ChevronRight size={18} />
              </button>
            </div>
          </div>
          <div className="calendar-grid week-row">
            {["日", "月", "火", "水", "木", "金", "土"].map((day) => (
              <span key={day}>{day}</span>
            ))}
          </div>
          <div className="calendar-grid">
            {days.map((day, index) => {
              const dayOccurrences = day ? calendarOccurrences.filter((item) => isSameDay(item.date, day)) : [];
              return (
                <div className={`calendar-cell ${day && isSameDay(day, today) ? "today" : ""}`} key={day ? toISODate(day) : `blank-${index}`}>
                  {day && <strong>{day.getDate()}</strong>}
                  <div className="calendar-events">
                    {dayOccurrences.slice(0, 3).map(({ cost }) => (
                      <button type="button" key={cost.id} onClick={() => openEdit(cost)} title={`${cost.name}を編集`}>
                        {cost.name}
                        <span>{formatCurrency.format(cost.amount)}</span>
                      </button>
                    ))}
                    {dayOccurrences.length > 3 && <small>+{dayOccurrences.length - 3}件</small>}
                  </div>
                </div>
              );
            })}
          </div>
          <div className="mobile-calendar-list">
            {calendarOccurrences.length > 0 ? (
              calendarOccurrences
                .slice()
                .sort((a, b) => a.date.getTime() - b.date.getTime())
                .map(({ cost, date }) => (
                  <article className="upcoming-item" key={`${cost.id}-${date.toISOString()}`}>
                    <div>
                      <strong>{formatShortDate.format(date)}</strong>
                      <small>{cost.name}</small>
                    </div>
                    <span>{formatCurrency.format(cost.amount)}</span>
                  </article>
                ))
            ) : (
              <EmptyState title="この月の支払予定はありません" description="翌月以降も確認できます。" />
            )}
          </div>
        </section>
      </div>
    );
  };

  const renderSettings = () => (
    <div className="view-grid">
      <section className="panel">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Data</p>
            <h2>データ管理</h2>
          </div>
          <Database size={22} />
        </div>
        <div className="settings-actions">
          <button className="primary-button" onClick={exportJson} type="button">
            <Download size={16} />
            JSONエクスポート
          </button>
          <label className="upload-button">
            <FileUp size={16} />
            JSONインポート
            <input type="file" accept="application/json,.json" onChange={importJson} />
          </label>
          <button className="ghost-button" onClick={resetSampleData} type="button">
            <RotateCcw size={16} />
            サンプルデータ投入
          </button>
          <button className="danger-button" onClick={deleteAllData} type="button">
            <Trash2 size={16} />
            全データ削除
          </button>
        </div>
      </section>

      <section className="panel">
        <div className="section-heading">
          <div>
            <p className="eyebrow">PWA</p>
            <h2>スマホ利用</h2>
          </div>
          <ShieldCheck size={22} />
        </div>
        <div className="pwa-note">
          <CheckCircle2 size={20} />
          <p>ホーム画面追加、オフライン起動、localStorage保存に対応しています。</p>
        </div>
        <div className="mini-stats">
          <div>
            <span>登録件数</span>
            <strong>{costs.length}件</strong>
          </div>
          <div>
            <span>支払方法</span>
            <strong>{paymentMethods.length}種類</strong>
          </div>
          <div>
            <span>高優先度</span>
            <strong>{costs.filter((cost) => cost.priority === "high").length}件</strong>
          </div>
        </div>
      </section>

      <section className="panel wide-panel">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Preset catalog</p>
            <h2>テンプレート収録サービス</h2>
          </div>
          <span className="muted">{costPresets.length}プラン</span>
        </div>
        <div className="preset-grid">
          {costPresets.map((preset) => (
            <button
              className="preset-card"
              key={preset.id}
              type="button"
              onClick={() => {
                setActiveView("editor");
                setEditingId(null);
                setDraft({
                  ...emptyDraft(),
                  name: preset.name,
                  amount: preset.amount,
                  cycle: preset.cycle,
                  category: preset.category,
                  paymentMethod: preset.paymentMethod,
                  priority: preset.priority,
                  memo: preset.memo,
                });
              }}
            >
              <span>{preset.provider}</span>
              <strong>{preset.plan}</strong>
              <small>
                {formatCurrency.format(preset.amount)} / {cycleCompact(preset.cycle)}
              </small>
            </button>
          ))}
        </div>
      </section>
    </div>
  );

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <span className="brand-mark">F</span>
          <div>
            <strong>Fixed Flow</strong>
            <small>固定費管理</small>
          </div>
        </div>
        <nav>
          {viewTabs.map((tab) => (
            <button
              className={activeView === tab.id ? "active" : ""}
              onClick={() => switchView(tab.id)}
              type="button"
              key={tab.id}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </nav>
        <button className="theme-toggle" type="button" onClick={() => setTheme(theme === "dark" ? "light" : "dark")}>
          {theme === "dark" ? <Sun size={17} /> : <Moon size={17} />}
          {theme === "dark" ? "ライトモード" : "ダークモード"}
        </button>
      </aside>

      <main>
        <header className="topbar">
          <div>
            <p className="eyebrow">Local first PWA</p>
            <h1>{pageTitle(activeView)}</h1>
          </div>
          <div className="topbar-actions">
            <button className="ghost-button desktop-only" type="button" onClick={() => setActiveView("settings")}>
              <Database size={16} />
              データ
            </button>
            <button className="primary-button" type="button" onClick={openCreate}>
              <Plus size={16} />
              追加
            </button>
          </div>
        </header>

        {activeView === "dashboard" && renderDashboard()}
        {activeView === "list" && renderList()}
        {activeView === "editor" && renderEditor()}
        {activeView === "calendar" && renderCalendar()}
        {activeView === "settings" && renderSettings()}
      </main>

      <nav className="mobile-nav">
        {viewTabs.map((tab) => (
          <button
            className={activeView === tab.id ? "active" : ""}
            onClick={() => switchView(tab.id)}
            type="button"
            key={tab.id}
            aria-label={tab.label}
          >
            {tab.icon}
            <span>{tab.label.replace("ダッシュボード", "ホーム").replace("固定費一覧", "一覧").replace("追加・編集", "追加").replace("カレンダー", "予定")}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}

function CostCard({
  cost,
  today,
  onEdit,
  onDelete,
  onAdvance,
}: {
  cost: FixedCost;
  today: Date;
  onEdit: () => void;
  onDelete: () => void;
  onAdvance: () => void;
}) {
  const next = nextOccurrenceDate(cost, today);
  const days = next ? diffDays(today, next) : null;
  const monthly = monthlyEquivalent(cost);
  const annual = cost.cycle === "one-time" ? cost.amount : monthly * 12;
  const category = categories.find((item) => item.value === cost.category);
  const weightClass = monthly >= 8000 ? "heavy" : monthly >= 2500 ? "medium" : "light";

  return (
    <article className={`cost-card weight-${weightClass}`}>
      <div className="cost-card-main">
        <div className="cost-title-row">
          <span className="category-swatch" style={{ background: category?.color }} />
          <div>
            <h3>{cost.name}</h3>
            <p>{cost.category}・{cost.paymentMethod}</p>
          </div>
        </div>
        <div className="cost-price">
          <strong>{formatCurrency.format(cost.amount)}</strong>
          <span>{cycleLabel(cost.cycle)}</span>
        </div>
      </div>
      <div className="cost-meta-grid">
        <div>
          <span>次回支払</span>
          <strong>{next ? formatShortDate.format(next) : "予定なし"}</strong>
          {days !== null && <small>{days === 0 ? "今日" : days > 0 ? `${days}日後` : `${Math.abs(days)}日前`}</small>}
        </div>
        <div>
          <span>月額換算</span>
          <strong>{formatCurrency.format(monthly)}</strong>
        </div>
        <div>
          <span>年額</span>
          <strong>{formatCurrency.format(annual)}</strong>
        </div>
        <div>
          <span>見直し</span>
          <strong className={`priority-text priority-${cost.priority}`}>{priorityLabel(cost.priority)}</strong>
        </div>
      </div>
      {cost.memo && <p className="cost-memo">{cost.memo}</p>}
      <div className="cost-actions">
        {cycleMonths(cost.cycle) && (
          <button className="ghost-button" type="button" onClick={onAdvance}>
            <CheckCircle2 size={15} />
            次回へ
          </button>
        )}
        <button className="ghost-button" type="button" onClick={onEdit}>
          <Edit3 size={15} />
          編集
        </button>
        <button className="danger-ghost-button" type="button" onClick={onDelete}>
          <Trash2 size={15} />
          削除
        </button>
      </div>
    </article>
  );
}

function priorityLabel(priority: Priority) {
  if (priority === "high") return "高";
  if (priority === "medium") return "中";
  return "低";
}

function pageTitle(view: View) {
  switch (view) {
    case "dashboard":
      return "固定費ダッシュボード";
    case "list":
      return "固定費一覧";
    case "editor":
      return "追加・編集";
    case "calendar":
      return "支払カレンダー";
    case "settings":
      return "設定 / データ管理";
  }
}

function groupPresets() {
  return costPresets.reduce<Record<string, CostPreset[]>>((groups, preset) => {
    groups[preset.provider] = groups[preset.provider] || [];
    groups[preset.provider].push(preset);
    return groups;
  }, {});
}
