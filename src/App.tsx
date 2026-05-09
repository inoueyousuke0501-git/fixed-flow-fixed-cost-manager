import {
  Bell,
  CalendarDays,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ChartPie,
  Database,
  Download,
  Edit3,
  FileUp,
  Filter,
  GraduationCap,
  House,
  Landmark,
  LayoutDashboard,
  ListFilter,
  MoreHorizontal,
  Moon,
  Music,
  Plus,
  RotateCcw,
  Save,
  Search,
  Settings,
  ShieldCheck,
  Sparkles,
  Sun,
  Trash2,
  TrainFront,
  Tv,
  WalletCards,
  Wifi,
  Zap,
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
type EditorStep = "service" | "plan" | "form" | "details";

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

type ServiceTile =
  | {
      id: string;
      kind: "provider";
      provider: string;
      label: string;
      summary: string;
    }
  | {
      id: string;
      kind: "category";
      category: Category;
      label: string;
      summary: string;
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

const categoryShortcuts: Array<{
  category: Category;
  label: string;
  name: string;
  paymentMethod: string;
  priority: Priority;
  memo: string;
}> = [
  { category: "家賃", label: "家賃", name: "家賃", paymentMethod: "口座振替", priority: "high", memo: "更新月や管理費込みかをメモ。" },
  { category: "光熱費", label: "光熱費", name: "光熱費", paymentMethod: "クレジットカード", priority: "medium", memo: "電気・ガス・水道など。" },
  { category: "通信費", label: "通信費", name: "通信費", paymentMethod: "クレジットカード", priority: "high", memo: "スマホ・光回線・Wi-Fiなど。" },
  { category: "サブスク", label: "その他サブスク", name: "サブスク", paymentMethod: "クレジットカード", priority: "medium", memo: "テンプレにないサービスを手入力。" },
  { category: "保険", label: "保険", name: "保険", paymentMethod: "口座振替", priority: "medium", memo: "補償内容と更新月を確認。" },
  { category: "ローン", label: "ローン", name: "ローン", paymentMethod: "口座振替", priority: "high", memo: "残高・金利・完済予定をメモ。" },
  { category: "教育", label: "教育", name: "教育費", paymentMethod: "クレジットカード", priority: "medium", memo: "教材・スクール・学習サービスなど。" },
  { category: "交通", label: "交通", name: "交通費", paymentMethod: "IC/カード", priority: "low", memo: "定期券・駐車場・車関連など。" },
  { category: "その他", label: "その他", name: "固定費", paymentMethod: "未設定", priority: "medium", memo: "" },
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
  { id: "dashboard", label: "ホーム", icon: <LayoutDashboard size={18} /> },
  { id: "list", label: "契約", icon: <ListFilter size={18} /> },
  { id: "calendar", label: "要対応", icon: <Bell size={18} /> },
  { id: "settings", label: "内訳", icon: <ChartPie size={18} /> },
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
  const [listPage, setListPage] = useState(0);
  const [presetPage, setPresetPage] = useState(0);
  const [editorStep, setEditorStep] = useState<EditorStep>("service");
  const [calendarMonth, setCalendarMonth] = useState(startOfMonth(new Date()));
  const [selectedPresetProvider, setSelectedPresetProvider] = useState<string | null>(null);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(costs));
  }, [costs]);

  useEffect(() => {
    localStorage.setItem(THEME_KEY, theme);
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  useEffect(() => {
    setListPage(0);
  }, [categoryFilter, costs.length, paymentFilter, query, sortKey]);

  const today = useMemo(() => startOfDay(new Date()), []);

  const paymentMethods = useMemo(() => {
    return Array.from(new Set(costs.map((cost) => cost.paymentMethod).filter(Boolean))).sort();
  }, [costs]);

  const presetGroups = useMemo(() => Object.entries(groupPresets()), []);
  const serviceTiles = useMemo<ServiceTile[]>(() => {
    const providerTiles = presetGroups.map(([provider, presets]) => {
      const summary = presetSummary(presets);
      return {
        id: `provider-${provider}`,
        kind: "provider" as const,
        provider,
        label: providerLabel(provider),
        summary: `${presets.length}プラン・${formatCurrency.format(summary.minimum)}から`,
      };
    });
    const fixedCostTiles = categoryShortcuts.map((shortcut) => ({
      id: `category-${shortcut.category}`,
      kind: "category" as const,
      category: shortcut.category,
      label: shortcut.label,
      summary: "金額を入力",
    }));
    return [...providerTiles, ...fixedCostTiles];
  }, [presetGroups]);
  const presetPageSize = 6;
  const presetPageCount = Math.max(1, Math.ceil(serviceTiles.length / presetPageSize));
  const visibleServiceTiles = serviceTiles.slice(presetPage * presetPageSize, (presetPage + 1) * presetPageSize);

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

  const listPageSize = 2;
  const listPageCount = Math.max(1, Math.ceil(filteredCosts.length / listPageSize));
  const visibleCosts = filteredCosts.slice(listPage * listPageSize, (listPage + 1) * listPageSize);

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
      setSelectedPresetProvider(null);
      setPresetPage(0);
      setEditorStep("service");
    }
    setActiveView(view);
  }

  function openCreate() {
    setEditingId(null);
    setDraft(emptyDraft());
    setSelectedPresetProvider(null);
    setPresetPage(0);
    setEditorStep("service");
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
    setEditorStep("form");
    setActiveView("editor");
  }

  function updateDraft<K extends keyof CostDraft>(key: K, value: CostDraft[K]) {
    setDraft((current) => ({ ...current, [key]: value }));
  }

  function selectPresetProvider(provider: string) {
    const firstPreset = presetGroups.find(([itemProvider]) => itemProvider === provider)?.[1][0];
    if (!firstPreset) return;
    setSelectedPresetProvider(provider);
    setDraft((current) => ({
      ...current,
      name: firstPreset.name,
      amount: firstPreset.amount,
      cycle: firstPreset.cycle,
      category: firstPreset.category,
      paymentMethod: firstPreset.paymentMethod,
      memo: firstPreset.memo,
      priority: firstPreset.priority,
    }));
    setEditorStep("plan");
  }

  function selectCategoryShortcut(category: Category) {
    const shortcut = categoryShortcuts.find((item) => item.category === category);
    if (!shortcut) return;
    setSelectedPresetProvider(null);
    setDraft((current) => ({
      ...current,
      name: shortcut.name,
      amount: 0,
      cycle: "monthly",
      category: shortcut.category,
      paymentMethod: shortcut.paymentMethod,
      memo: shortcut.memo,
      priority: shortcut.priority,
    }));
    setEditorStep("form");
  }

  function applyPreset(presetId: string) {
    const preset = costPresets.find((item) => item.id === presetId);
    if (!preset) return;
    setSelectedPresetProvider(preset.provider);
    setEditorStep("form");

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
    setSelectedPresetProvider(null);
    setEditorStep("service");
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

  const renderDashboard = () => {
    const decisionItems = upcoming.slice(0, 3);
    const topCategories = categoryTotals.slice(0, 5);
    const reviewingCount = costs.filter((cost) => cost.priority === "high").length;
    const trialCount = costs.filter((cost) => decisionKind(cost).variant === "danger").length;
    const renewalCount = upcoming.filter((item) => item.days <= 30 && decisionKind(item.cost).variant === "info").length;
    const unsetCount = costs.filter((cost) => !cost.cancellationDate).length;

    return (
      <div className="concept-screen home-concept">
        <section className="monthly-card">
          <p>月額の固定費</p>
          <strong>{formatCurrency.format(monthlyTotal)}</strong>
          <div className="monthly-card-foot">
            <span>
              年額
              <b>{formatCurrency.format(annualTotal)}</b>
            </span>
            <span>
              日あたり
              <b>{formatCurrency.format(Math.round(annualTotal / 365))}</b>
            </span>
          </div>
        </section>

        <section className="concept-section">
          <h2>次に判断するもの</h2>
          <div className="decision-list">
            {decisionItems.map((item) => (
              <button className="decision-row" type="button" key={item.cost.id} onClick={() => openEdit(item.cost)}>
                <CostLogo name={item.cost.name} category={item.cost.category} size="md" />
                <div>
                  <strong>{displayCostName(item.cost.name)}</strong>
                  <span>{decisionKind(item.cost).label}</span>
                  <em className={`deadline deadline-${deadlineTone(item.days)}`}>
                    {item.days === 0 ? "今日" : `あと${item.days}日`}
                  </em>
                </div>
                <b>{formatCurrency.format(item.cost.amount)} /月</b>
                <ChevronRight size={17} />
              </button>
            ))}
          </div>
        </section>

        <section className="concept-section compact-home-section">
          <h2>固定費の内訳</h2>
          <div className="breakdown-bars">
            {topCategories.map((category) => (
              <div className="breakdown-row" key={category.value}>
                <span className="category-swatch" style={{ background: category.color }} />
                <strong>{category.label}</strong>
                <i>
                  <span style={{ width: `${(category.total / maxCategoryTotal) * 100}%`, background: category.color }} />
                </i>
                <b>{formatCurrency.format(category.total)}</b>
                <small>{Math.round((category.total / Math.max(1, monthlyTotal)) * 100)}%</small>
              </div>
            ))}
          </div>
        </section>

        <section className="concept-section">
          <h2>棚卸し状況</h2>
          <div className="inventory-grid">
            {[
              { label: "見直し中", value: reviewingCount, icon: <Edit3 size={24} />, tone: "blue" },
              { label: "無料期間中", value: trialCount, icon: <Sparkles size={24} />, tone: "green" },
              { label: "更新前", value: renewalCount, icon: <CalendarDays size={24} />, tone: "orange" },
              { label: "期限未設定", value: unsetCount, icon: <MoreHorizontal size={24} />, tone: "gray" },
            ].map((item) => (
              <button className={`inventory-tile inventory-${item.tone}`} type="button" key={item.label} onClick={() => setActiveView(item.label === "期限未設定" ? "list" : "calendar")}>
                {item.icon}
                <span>{item.label}</span>
                <strong>{item.value}件</strong>
              </button>
            ))}
          </div>
        </section>
      </div>
    );
  };

  const renderList = () => (
    <div className="concept-screen contracts-screen">
      <section className="contract-tools">
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
        <div className="contract-tabs">
          <button className="active" type="button" onClick={() => setCategoryFilter("all")}>すべて</button>
          <button type="button" onClick={() => setSortKey("amount-desc")}>見直し中</button>
          <button type="button" onClick={() => setSortKey("date")}>期限あり</button>
          <button type="button" onClick={() => setPaymentFilter("all")}>期限なし</button>
        </div>
      </section>

      <div className="contract-list">
        {filteredCosts.slice(0, 5).map((cost) => (
          <button className="contract-card" type="button" key={cost.id} onClick={() => openEdit(cost)}>
            <CostLogo name={cost.name} category={cost.category} size="lg" />
            <div>
              <strong>{displayCostName(cost.name)}</strong>
              <span>{cost.category}</span>
              <b>{formatCurrency.format(monthlyEquivalent(cost))}/月</b>
            </div>
            <em className={`status-pill status-${decisionKind(cost).variant}`}>{decisionKind(cost).label}</em>
            <ChevronRight size={18} />
          </button>
        ))}
      </div>
    </div>
  );

  const renderEditor = () => {
    const selectedPresets = selectedPresetProvider
      ? presetGroups.find(([provider]) => provider === selectedPresetProvider)?.[1] ?? []
      : [];

    const backFromForm = () => {
      if (editorStep === "details") {
        setEditorStep("form");
        return;
      }
      if (editingId) {
        setActiveView("list");
        return;
      }
      setEditorStep(selectedPresetProvider ? "plan" : "service");
    };

    return (
      <section className={`panel editor-panel editor-step-${editorStep}`}>
        {editingId && (
          <div className="section-heading">
            <div>
              <p className="eyebrow">Edit</p>
              <h2>固定費を編集</h2>
            </div>
            <button className="danger-ghost-button" onClick={() => deleteCost(editingId)} type="button">
              <Trash2 size={16} />
              削除
            </button>
          </div>
        )}

        {editorStep === "service" && (
          <div className="preset-picker service-picker">
            <div className="preset-picker-head">
              <div>
                <p className="eyebrow">Choose</p>
                <h3>ロゴ・アイコンから選ぶ</h3>
              </div>
              <span>プランは次の画面で選択</span>
            </div>
            <div className="service-tile-grid">
              {visibleServiceTiles.map((tile) =>
                tile.kind === "provider" ? (
                  <button
                    className="service-choice-tile"
                    type="button"
                    key={tile.id}
                    onClick={() => selectPresetProvider(tile.provider)}
                  >
                    <CostLogo provider={tile.provider} size="xl" />
                    <strong>{tile.label}</strong>
                    <small>{tile.summary}</small>
                  </button>
                ) : (
                  <button
                    className="service-choice-tile"
                    type="button"
                    key={tile.id}
                    onClick={() => selectCategoryShortcut(tile.category)}
                  >
                    <CostLogo category={tile.category} size="xl" />
                    <strong>{tile.label}</strong>
                    <small>{tile.summary}</small>
                  </button>
                ),
              )}
            </div>
            <div className="mini-pager">
              <button
                className="ghost-button"
                type="button"
                onClick={() => setPresetPage((current) => Math.max(0, current - 1))}
                disabled={presetPage === 0}
              >
                <ChevronLeft size={15} />
              </button>
              <span>{presetPage + 1} / {presetPageCount}</span>
              <button
                className="ghost-button"
                type="button"
                onClick={() => setPresetPage((current) => Math.min(presetPageCount - 1, current + 1))}
                disabled={presetPage >= presetPageCount - 1}
              >
                <ChevronRight size={15} />
              </button>
            </div>
          </div>
        )}

        {editorStep === "plan" && selectedPresetProvider && (
          <div className="preset-picker plan-picker">
            <div className="plan-drawer-head">
              <div className="selected-service-head">
                <CostLogo provider={selectedPresetProvider} size="lg" />
                <div>
                  <p className="eyebrow">Plan</p>
                  <h3>{providerLabel(selectedPresetProvider)}</h3>
                  <span>料金プランを選ぶか、金額を手入力できます</span>
                </div>
              </div>
              <button
                className="ghost-button"
                type="button"
                onClick={() => {
                  setSelectedPresetProvider(null);
                  setEditorStep("service");
                }}
              >
                選び直す
              </button>
            </div>
            <div className="plan-tile-grid">
              {selectedPresets.map((preset) => {
                const isApplied = draft.name === preset.name && draft.amount === preset.amount && draft.cycle === preset.cycle;
                return (
                  <button
                    className={`plan-tile ${isApplied ? "active" : ""}`}
                    type="button"
                    key={preset.id}
                    onClick={() => applyPreset(preset.id)}
                  >
                    <span>{preset.plan}</span>
                    <strong>{formatCurrency.format(preset.amount)}</strong>
                    <small>{cycleCompact(preset.cycle)}</small>
                  </button>
                );
              })}
            </div>
            <div className="custom-plan-box">
              <div>
                <strong>金額を手入力</strong>
                <span>キャンペーン価格、家族割、年払いなどはここで調整できます。</span>
              </div>
              <div className="custom-plan-controls">
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
                  <span>周期</span>
                  <select value={draft.cycle} onChange={(event) => updateDraft("cycle", event.target.value as BillingCycle)}>
                    {cycleOptions.map((option) => (
                      <option value={option.value} key={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>
                <button className="primary-button" type="button" onClick={() => setEditorStep("form")}>
                  入力へ
                </button>
              </div>
            </div>
          </div>
        )}

        {(editorStep === "form" || editorStep === "details") && (
          <form className="editor-form" onSubmit={saveCost}>
            {editorStep === "form" ? (
              <>
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
              </>
            ) : (
              <>
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
              </>
            )}
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
              <button className="ghost-button" type="button" onClick={backFromForm}>
                {editorStep === "details" || !editingId ? "戻る" : "キャンセル"}
              </button>
              {editorStep === "form" && (
                <button className="ghost-button" type="button" onClick={() => setEditorStep("details")}>
                  詳細項目
                </button>
              )}
              <button className="primary-button" type="submit">
                <Save size={16} />
                保存
              </button>
            </div>
          </form>
        )}
      </section>
    );
  };

  const renderCalendar = () => {
    const weekItems = upcoming.filter((item) => item.days <= 7);
    const monthItems = upcoming.filter((item) => item.days > 7 && item.days <= 45);
    const unsetItems = costs.filter((cost) => !cost.cancellationDate).slice(0, 2);

    return (
      <div className="concept-screen action-screen">
        <section className="action-summary">
          <div>
            <CalendarDays size={28} />
            <span>今週</span>
            <strong>{weekItems.length}件</strong>
          </div>
          <div>
            <CalendarDays size={28} />
            <span>今月</span>
            <strong>{monthItems.length + weekItems.length}件</strong>
          </div>
        </section>

        <ActionGroup title="今週" items={weekItems} onEdit={openEdit} />
        <ActionGroup title="今月" items={monthItems.slice(0, 3)} onEdit={openEdit} />

        <section className="concept-section action-group">
          <h2>未設定</h2>
          <div className="action-list">
            {unsetItems.map((cost) => (
              <button className="action-row" type="button" key={cost.id} onClick={() => openEdit(cost)}>
                <em className="deadline deadline-muted">期限なし</em>
                <CostLogo name={cost.name} category={cost.category} size="md" />
                <div>
                  <strong>{displayCostName(cost.name)}</strong>
                  <span>期限未設定</span>
                </div>
                <b>{formatCurrency.format(monthlyEquivalent(cost))}</b>
                <ChevronRight size={17} />
              </button>
            ))}
          </div>
        </section>
      </div>
    );
  };

  const renderSettings = () => {
    const ranked = costs
      .slice()
      .sort((a, b) => monthlyEquivalent(b) - monthlyEquivalent(a))
      .slice(0, 3);

    return (
      <div className="concept-screen detail-screen">
        <section className="total-strip">
          <div>
            <span>月額</span>
            <strong>{formatCurrency.format(monthlyTotal)}</strong>
          </div>
          <div>
            <span>年額</span>
            <strong>{formatCurrency.format(annualTotal)}</strong>
          </div>
          <div>
            <span>日あたり</span>
            <strong>{formatCurrency.format(Math.round(annualTotal / 365))}</strong>
          </div>
        </section>

        <section className="concept-section donut-section">
          <h2>カテゴリ別内訳</h2>
          <div className="donut-layout">
            <div
              className="donut-chart"
              style={{
                background: `conic-gradient(${categoryTotals
                  .map((category, index) => {
                    const start = categoryTotals.slice(0, index).reduce((sum, item) => sum + item.total, 0);
                    const end = start + category.total;
                    return `${category.color} ${(start / Math.max(1, monthlyTotal)) * 100}% ${(end / Math.max(1, monthlyTotal)) * 100}%`;
                  })
                  .join(", ")})`,
              }}
            />
            <div className="donut-legend">
              {categoryTotals.slice(0, 6).map((category) => (
                <div key={category.value}>
                  <span className="category-swatch" style={{ background: category.color }} />
                  <strong>{category.label}</strong>
                  <b>{formatCurrency.format(category.total)}</b>
                  <small>{Math.round((category.total / Math.max(1, monthlyTotal)) * 100)}%</small>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="concept-section ranking-section">
          <h2>月額換算の高い順</h2>
          <div className="ranking-list">
            {ranked.map((cost, index) => (
              <button className="ranking-row" type="button" key={cost.id} onClick={() => openEdit(cost)}>
                <span>{index + 1}</span>
                <div>
                  <strong>{displayCostName(cost.name)}</strong>
                  <small>{cost.category}</small>
                </div>
                <b>{formatCurrency.format(monthlyEquivalent(cost))}/月</b>
              </button>
            ))}
          </div>
          <button className="see-all-button" type="button" onClick={() => setActiveView("list")}>
            すべて見る
            <ChevronRight size={17} />
          </button>
        </section>
      </div>
    );
  };
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
            <h1>{pageTitle(activeView)}</h1>
          </div>
          {activeView === "dashboard" && <button className="month-chip" type="button">2026年5月⌄</button>}
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
            <span>{tab.label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}

function ActionGroup({
  title,
  items,
  onEdit,
}: {
  title: string;
  items: Array<{ cost: FixedCost; date: Date; days: number }>;
  onEdit: (cost: FixedCost) => void;
}) {
  if (items.length === 0) return null;

  return (
    <section className="concept-section action-group">
      <h2>{title}</h2>
      <div className="action-list">
        {items.map((item) => (
          <button className="action-row" type="button" key={`${item.cost.id}-${item.days}`} onClick={() => onEdit(item.cost)}>
            <em className={`deadline deadline-${deadlineTone(item.days)}`}>
              {item.days === 0 ? "今日" : `あと${item.days}日`}
            </em>
            <CostLogo name={item.cost.name} category={item.cost.category} size="md" />
            <div>
              <strong>{displayCostName(item.cost.name)}</strong>
              <span>{decisionKind(item.cost).label}</span>
            </div>
            <b>{formatCurrency.format(item.cost.amount)}</b>
            <ChevronRight size={17} />
          </button>
        ))}
      </div>
    </section>
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
  const weightClass = monthly >= 8000 ? "heavy" : monthly >= 2500 ? "medium" : "light";

  return (
    <article className={`cost-card weight-${weightClass}`}>
      <div className="cost-card-main">
        <div className="cost-title-row">
          <CostLogo name={cost.name} category={cost.category} size="sm" />
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

function CompactCostCard({
  cost,
  today,
  onEdit,
}: {
  cost: FixedCost;
  today: Date;
  onEdit: () => void;
}) {
  const next = nextOccurrenceDate(cost, today);
  const days = next ? diffDays(today, next) : null;
  const monthly = monthlyEquivalent(cost);

  return (
    <article
      className="compact-cost-card"
      onClick={onEdit}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onEdit();
        }
      }}
      role="button"
      tabIndex={0}
    >
      <div className="compact-cost-main">
        <CostLogo name={cost.name} category={cost.category} size="sm" />
        <div>
          <h3>{cost.name}</h3>
          <p>{cost.category}・{cost.paymentMethod}</p>
        </div>
      </div>
      <div className="compact-cost-amount">
        <strong>{formatCurrency.format(cost.amount)}</strong>
        <span>{cycleCompact(cost.cycle)}</span>
      </div>
      <div className="compact-cost-meta">
        <span>{next ? `${days === 0 ? "今日" : `${days}日後`}・${formatShortDate.format(next)}` : "予定なし"}</span>
        <span>月換算 {formatCurrency.format(monthly)}</span>
        <span className={`priority-text priority-${cost.priority}`}>見直し {priorityLabel(cost.priority)}</span>
      </div>
    </article>
  );
}

function CostLogo({
  provider,
  name,
  category,
  size = "md",
}: {
  provider?: string | null;
  name?: string;
  category?: Category;
  size?: "sm" | "md" | "lg" | "xl";
}) {
  const resolvedProvider = provider ?? (name ? providerFromCostName(name) : null);

  if (resolvedProvider) {
    const brand = providerBrand(resolvedProvider);
    return (
      <span className={`cost-logo cost-logo-${size} ${brand.className}`} aria-hidden="true">
        {brand.icon ?? <span>{brand.mark}</span>}
      </span>
    );
  }

  const categoryInfo = categories.find((item) => item.value === category);
  return (
    <span
      className={`cost-logo cost-logo-${size} category-logo`}
      style={{ "--logo-accent": categoryInfo?.color ?? "#64748b" } as CSSProperties}
      aria-hidden="true"
    >
      {categoryIcon(category, size === "xl" ? 28 : size === "lg" ? 22 : 16)}
    </span>
  );
}

function providerBrand(provider: string): { mark: string; className: string; icon?: ReactNode } {
  switch (provider) {
    case "Apple Music":
      return { mark: "AM", className: "logo-apple-music", icon: <Music size={20} /> };
    case "Netflix":
      return { mark: "N", className: "logo-netflix" };
    case "Amazon":
      return { mark: "a", className: "logo-amazon" };
    case "Spotify":
      return { mark: "SP", className: "logo-spotify" };
    case "YouTube":
      return { mark: "YT", className: "logo-youtube" };
    case "Disney+":
      return { mark: "D+", className: "logo-disney" };
    case "U-NEXT":
      return { mark: "UN", className: "logo-unext" };
    case "Hulu":
      return { mark: "HU", className: "logo-hulu" };
    case "American Express":
      return { mark: "AMEX", className: "logo-amex" };
    default:
      return { mark: providerInitial(provider), className: "logo-generic" };
  }
}

function providerFromCostName(name: string) {
  const normalized = name.toLowerCase();
  if (normalized.includes("apple music")) return "Apple Music";
  if (normalized.includes("netflix")) return "Netflix";
  if (normalized.includes("amazon")) return "Amazon";
  if (normalized.includes("spotify")) return "Spotify";
  if (normalized.includes("youtube")) return "YouTube";
  if (normalized.includes("disney")) return "Disney+";
  if (normalized.includes("u-next") || normalized.includes("unext")) return "U-NEXT";
  if (normalized.includes("hulu")) return "Hulu";
  if (name.includes("アメックス") || normalized.includes("american express") || normalized.includes("amex")) return "American Express";
  return null;
}

function categoryIcon(category: Category | undefined, size: number) {
  switch (category) {
    case "家賃":
      return <House size={size} />;
    case "光熱費":
      return <Zap size={size} />;
    case "通信費":
      return <Wifi size={size} />;
    case "サブスク":
      return <Tv size={size} />;
    case "保険":
      return <ShieldCheck size={size} />;
    case "ローン":
      return <Landmark size={size} />;
    case "教育":
      return <GraduationCap size={size} />;
    case "交通":
      return <TrainFront size={size} />;
    default:
      return <MoreHorizontal size={size} />;
  }
}

function priorityLabel(priority: Priority) {
  if (priority === "high") return "高";
  if (priority === "medium") return "中";
  return "低";
}

function decisionKind(cost: FixedCost) {
  const text = `${cost.name} ${cost.memo}`.toLowerCase();
  if (text.includes("無料") || text.includes("trial")) {
    return { label: "無料体験終了", variant: "danger" as const };
  }
  if (text.includes("割引")) {
    return { label: "割引終了", variant: "warn" as const };
  }
  if (cost.priority === "high") {
    return { label: "見直し中", variant: "info" as const };
  }
  if (cost.cancellationDate) {
    return { label: "解約予定", variant: "warn" as const };
  }
  return { label: "自動更新", variant: "success" as const };
}

function deadlineTone(days: number) {
  if (days <= 7) return "danger";
  if (days <= 14) return "warn";
  return "info";
}

function displayCostName(name: string) {
  if (name.includes("Netflix")) return "Netflix";
  if (name.includes("Amazon Prime")) return "Amazon Prime";
  if (name.includes("Apple Music")) return "Apple Music";
  if (name.includes("スマホ")) return "スマホ回線";
  if (name.includes("インターネット")) return "自宅ネット";
  if (name.includes("アメックス")) return "アメックス";
  if (name.length > 12) return `${name.slice(0, 12)}...`;
  return name;
}

function pageTitle(view: View) {
  switch (view) {
    case "dashboard":
      return "固定費";
    case "list":
      return "契約";
    case "editor":
      return "追加・編集";
    case "calendar":
      return "要対応";
    case "settings":
      return "内訳";
  }
}

function groupPresets() {
  return costPresets.reduce<Record<string, CostPreset[]>>((groups, preset) => {
    groups[preset.provider] = groups[preset.provider] || [];
    groups[preset.provider].push(preset);
    return groups;
  }, {});
}

function presetSummary(presets: CostPreset[]) {
  return {
    minimum: Math.min(...presets.map((preset) => preset.amount)),
  };
}

function providerLabel(provider: string) {
  return provider === "American Express" ? "AMEX" : provider;
}

function providerInitial(provider: string) {
  if (provider === "American Express") return "AX";
  if (provider === "Apple Music") return "AM";
  if (provider === "Amazon") return "AZ";
  if (provider === "YouTube") return "YT";
  if (provider === "Disney+") return "D+";
  return provider.slice(0, 2).toUpperCase();
}
