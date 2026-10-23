export type Role = "client" | "manager" | "analyst" | "admin";
export type Review = "pending" | "changes" | "accepted";
export interface User {
  id: string;
  name: string;
  role: Role;
  organizationId: string;
}
export interface Application {
  id: string;
  number: string;
  organizationId: string;
  organization: string;
  product: string;
  amount: string;
  currency: string;
  term: number;
  contact: string;
  status: "draft" | "review" | "documents";
  manager: string;
  updated: string;
  participantIds: string[];
}
export interface Version {
  id: string;
  number: number;
  filename: string;
  size: number;
  uploaded: string;
  author: string;
  review: Review;
  note: string;
  scan: "not_performed";
}
export interface DocumentSlot {
  id: string;
  applicationId: string;
  title: string;
  required: boolean;
  versions: Version[];
}
export interface Request {
  id: string;
  applicationId: string;
  title: string;
  description: string;
  author: string;
  due: string;
  resolved: boolean;
  slotIds: string[];
  created: string;
}
export interface Message {
  id: string;
  applicationId: string;
  context: string;
  author: string;
  role: Role;
  text: string;
  at: string;
}
export interface Activity {
  id: string;
  applicationId: string;
  title: string;
  description: string;
  at: string;
  href: string;
}
export interface Notification {
  id: string;
  title: string;
  text: string;
  href: string;
  at: string;
  read: boolean;
}
export interface Draft {
  organization: string;
  product: string;
  amount: string;
  currency: string;
  term: string;
  contact: string;
}
export interface DemoState {
  user: User | null;
  applications: Application[];
  slots: DocumentSlot[];
  requests: Request[];
  messages: Message[];
  activities: Activity[];
  notifications: Notification[];
  draft: Draft;
}
export const organizationId = "org-sever";
export const emptyDraft: Draft = {
  organization: "ООО «Северная мануфактура»",
  product: "Оборотный кредит",
  amount: "",
  currency: "RUB",
  term: "12",
  contact: "anna@sever.example",
};
export const isStaff = (user: User | null) =>
  user?.role === "manager" || user?.role === "analyst";
// Demo membership only. Real resource and action authorization belongs on the server.
export const canAccess = (user: User | null, app: Application) =>
  !!user &&
  (user.role === "client"
    ? user.organizationId === app.organizationId
    : isStaff(user) && app.participantIds.includes(user.id));
export const currentVersion = (slot: DocumentSlot) => slot.versions.at(-1);
export const documentNeedsClientAction = (slot: DocumentSlot) =>
  currentVersion(slot)?.review === "changes" ||
  (slot.required && !currentVersion(slot));
export const visibleNotifications = (state: DemoState) =>
  state.notifications.filter((n) => {
    const id = n.href.match(/^\/app\/applications\/([^/]+)/)?.[1];
    const app = state.applications.find((a) => a.id === id);
    return !!app && canAccess(state.user, app);
  });
export function decimalAmount(value: string) {
  const [whole, fraction = ""] = value.replace(",", ".").split(".");
  return `${whole.replace(/^0+(?=\d)/, "")}.${fraction.padEnd(2, "0")}`;
}
export function readiness(slots: DocumentSlot[]) {
  const required = slots.filter((slot) => slot.required);
  return {
    accepted: required.filter(
      (slot) => currentVersion(slot)?.review === "accepted",
    ).length,
    total: required.length,
  };
}
export const money = (value: string, currency = "RUB") =>
  new Intl.NumberFormat("ru-RU", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(Number(value));
export const date = (value: string, time = false) =>
  value
    ? new Intl.DateTimeFormat("ru-RU", {
        day: "numeric",
        month: "short",
        ...(time ? { hour: "2-digit", minute: "2-digit" } : {}),
      }).format(new Date(value))
    : "Без срока";
export const appHref = (id: string, tab = "overview") =>
  `/app/applications/${id}/${tab}`;
export const reviewLabel: Record<Review, string> = {
  pending: "На проверке",
  changes: "Нужны исправления",
  accepted: "Принят",
};
export const statusLabel = {
  draft: "Черновик",
  review: "На рассмотрении",
  documents: "Сбор документов",
};
export const roleLabel: Record<Role, string> = {
  client: "Представитель бизнеса",
  manager: "Менеджер банка",
  analyst: "Аналитик банка",
  admin: "Администратор",
};
export function sortedRequests(requests: Request[]) {
  return [...requests].sort(
    (a, b) =>
      Number(a.resolved) - Number(b.resolved) ||
      (a.due || "9999").localeCompare(b.due || "9999"),
  );
}
export function validateDraft(
  draft: Draft,
  step: number,
): Record<string, string> {
  const errors: Record<string, string> = {};
  if (step === 1) {
    if (!draft.organization.trim())
      errors.organization = "Выберите организацию";
    if (
      ![
        "Оборотный кредит",
        "Инвестиционный кредит",
        "Кредитная линия",
      ].includes(draft.product)
    )
      errors.product = "Выберите продукт из списка";
  }
  if (step >= 2) {
    if (
      !/^\d{1,12}([.,]\d{1,2})?$/.test(draft.amount) ||
      Number(draft.amount.replace(",", ".")) <= 0
    )
      errors.amount =
        "Укажите положительную сумму, не более двух знаков после запятой";
    if (
      !/^\d+$/.test(draft.term) ||
      Number(draft.term) < 1 ||
      Number(draft.term) > 120
    )
      errors.term = "Укажите срок от 1 до 120 месяцев";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(draft.contact))
      errors.contact = "Укажите корректный email";
  }
  return errors;
}
