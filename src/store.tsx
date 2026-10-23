import {
  createContext,
  useContext,
  useEffect,
  useReducer,
  useState,
  type ReactNode,
} from "react";
import {
  type DemoState,
  type User,
  type Draft,
  type Review,
  type Request,
  appHref,
  canAccess,
  currentVersion,
  decimalAmount,
  isStaff,
  emptyDraft,
  validateDraft,
  visibleNotifications,
} from "./domain";
import { createSeed } from "./seed";

export type Action =
  | { type: "login"; user: User }
  | { type: "logout" }
  | { type: "draft"; draft: Draft }
  | { type: "submit"; draft: Draft; id: string; asDraft: boolean }
  | { type: "send"; applicationId: string }
  | { type: "message"; applicationId: string; context: string; text: string }
  | {
      type: "upload";
      slotId: string;
      filename: string;
      size: number;
      id: string;
    }
  | {
      type: "review";
      slotId: string;
      versionId: string;
      review: Review;
      note: string;
    }
  | { type: "resolve"; requestId: string }
  | {
      type: "request";
      request: Request;
      newSlots: { id: string; title: string }[];
    }
  | { type: "read"; id?: string }
  | { type: "profile"; name: string };

export function reducer(state: DemoState, action: Action): DemoState {
  const now = new Date().toISOString();
  const user = state.user;
  const access = (id: string) =>
    !!state.applications.find((app) => app.id === id && canAccess(user, app));
  const event = (
    applicationId: string,
    title: string,
    href: string,
  ): DemoState["activities"] => [
    {
      id: crypto.randomUUID(),
      applicationId,
      title,
      description: user?.name ?? "",
      at: now,
      href,
    },
    ...state.activities,
  ];
  const touch = (applicationId: string) =>
    state.applications.map((a) =>
      a.id === applicationId ? { ...a, updated: now } : a,
    );
  if (action.type === "login") return { ...state, user: action.user };
  if (action.type === "logout") return { ...createSeed() };
  if (!user) return state;
  switch (action.type) {
    case "draft":
      return user.role === "client" ? { ...state, draft: action.draft } : state;
    case "send": {
      const app = state.applications.find((a) => a.id === action.applicationId);
      if (
        !app ||
        !access(app.id) ||
        app.status !== "draft" ||
        user.role !== "client"
      )
        return state;
      return {
        ...state,
        applications: state.applications.map((a) =>
          a.id === app.id ? { ...a, status: "review", updated: now } : a,
        ),
        activities: event(
          app.id,
          "Заявка отправлена на рассмотрение",
          appHref(app.id),
        ),
      };
    }
    case "submit": {
      if (
        user.role !== "client" ||
        Object.keys({
          ...validateDraft(action.draft, 1),
          ...validateDraft(action.draft, 2),
        }).length
      )
        return state;
      const d = action.draft;
      return {
        ...state,
        draft: { ...emptyDraft },
        applications: [
          {
            id: action.id,
            number: `КК–2026–${String(state.applications.length + 843).padStart(4, "0")}`,
            organizationId: user.organizationId,
            organization: d.organization,
            product: d.product,
            amount: decimalAmount(d.amount),
            currency: d.currency,
            term: Number(d.term),
            contact: d.contact,
            status: action.asDraft ? "draft" : "review",
            manager: "Мария Волкова",
            updated: now,
            participantIds: ["demo-manager", "demo-analyst"],
          },
          ...state.applications,
        ],
        activities: event(
          action.id,
          action.asDraft
            ? "Черновик сохранён"
            : "Заявка отправлена на рассмотрение",
          appHref(action.id),
        ),
      };
    }
    case "message": {
      if (
        !access(action.applicationId) ||
        !action.text.trim() ||
        action.text.length > 3000
      )
        return state;
      const validContext =
        action.context === "application" ||
        state.requests.some(
          (r) =>
            r.id === action.context && r.applicationId === action.applicationId,
        ) ||
        state.slots.some(
          (s) =>
            s.applicationId === action.applicationId &&
            s.versions.some((v) => v.id === action.context),
        );
      if (!validContext) return state;
      return {
        ...state,
        applications: touch(action.applicationId),
        messages: [
          ...state.messages,
          {
            id: crypto.randomUUID(),
            applicationId: action.applicationId,
            context: action.context,
            text: action.text.trim(),
            author: user.name,
            role: user.role,
            at: now,
          },
        ],
        activities: event(
          action.applicationId,
          "Новое сообщение",
          appHref(
            action.applicationId,
            action.context === "application"
              ? "messages"
              : state.requests.some((r) => r.id === action.context)
                ? `requests/${action.context}`
                : `documents/${state.slots.find((s) => s.versions.some((v) => v.id === action.context))!.id}/versions/${action.context}`,
          ),
        ),
      };
    }
    case "upload": {
      const slot = state.slots.find((s) => s.id === action.slotId);
      if (
        !slot ||
        !access(slot.applicationId) ||
        user.role !== "client" ||
        !/\.(pdf|png|jpe?g)$/i.test(action.filename) ||
        action.size > 20 * 1024 * 1024 ||
        action.size <= 0
      )
        return state;
      return {
        ...state,
        applications: touch(slot.applicationId),
        slots: state.slots.map((s) =>
          s.id !== slot.id
            ? s
            : {
                ...s,
                versions: [
                  ...s.versions,
                  {
                    id: action.id,
                    number: s.versions.length + 1,
                    filename: action.filename,
                    size: action.size,
                    uploaded: now,
                    author: user.name,
                    review: "pending",
                    note: "",
                    scan: "not_performed",
                  },
                ],
              },
        ),
        activities: event(
          slot.applicationId,
          `Загружена новая версия: ${slot.title}`,
          appHref(
            slot.applicationId,
            `documents/${slot.id}/versions/${action.id}`,
          ),
        ),
      };
    }
    case "review": {
      const slot = state.slots.find((s) => s.id === action.slotId);
      if (
        !slot ||
        !access(slot.applicationId) ||
        !isStaff(user) ||
        currentVersion(slot)?.id !== action.versionId ||
        (action.review === "changes" && !action.note.trim())
      )
        return state;
      return {
        ...state,
        applications: touch(slot.applicationId),
        slots: state.slots.map((s) =>
          s.id !== slot.id
            ? s
            : {
                ...s,
                versions: s.versions.map((v) =>
                  v.id !== action.versionId
                    ? v
                    : { ...v, review: action.review, note: action.note.trim() },
                ),
              },
        ),
        activities: event(
          slot.applicationId,
          action.review === "accepted"
            ? `Документ принят: ${slot.title}`
            : `Запрошены исправления: ${slot.title}`,
          appHref(
            slot.applicationId,
            `documents/${slot.id}/versions/${action.versionId}`,
          ),
        ),
      };
    }
    case "resolve": {
      const request = state.requests.find((r) => r.id === action.requestId);
      if (
        !request ||
        !access(request.applicationId) ||
        !isStaff(user) ||
        request.resolved ||
        !request.slotIds.every((id) => {
          const slot = state.slots.find((s) => s.id === id);
          return slot && currentVersion(slot)?.review === "accepted";
        })
      )
        return state;
      return {
        ...state,
        applications: touch(request.applicationId),
        requests: state.requests.map((r) =>
          r.id === request.id ? { ...r, resolved: true } : r,
        ),
        activities: event(
          request.applicationId,
          `Запрос закрыт: ${request.title}`,
          appHref(request.applicationId, `requests/${request.id}`),
        ),
      };
    }
    case "request": {
      const r = action.request;
      if (
        !isStaff(user) ||
        !access(r.applicationId) ||
        !r.title.trim() ||
        !r.description.trim() ||
        !r.slotIds.every(
          (id) =>
            state.slots.some(
              (s) => s.id === id && s.applicationId === r.applicationId,
            ) || action.newSlots.some((s) => s.id === id),
        )
      )
        return state;
      return {
        ...state,
        applications: touch(r.applicationId),
        requests: [r, ...state.requests],
        slots: [
          ...state.slots,
          ...action.newSlots.map((s) => ({
            ...s,
            applicationId: r.applicationId,
            required: true,
            versions: [],
          })),
        ],
        notifications: [
          {
            id: crypto.randomUUID(),
            title: "Новый запрос от банка",
            text: r.title,
            href: appHref(r.applicationId, `requests/${r.id}`),
            at: now,
            read: false,
          },
          ...state.notifications,
        ],
        activities: event(
          r.applicationId,
          `Создан запрос: ${r.title}`,
          appHref(r.applicationId, `requests/${r.id}`),
        ),
      };
    }
    case "read":
      return {
        ...state,
        notifications: state.notifications.map((n) =>
          (!action.id || action.id === n.id) &&
          visibleNotifications(state).some((visible) => visible.id === n.id)
            ? { ...n, read: true }
            : n,
        ),
      };
    case "profile":
      return action.name.trim()
        ? { ...state, user: { ...user, name: action.name.trim() } }
        : state;
  }
}

const Context = createContext<{
  state: DemoState;
  dispatch: React.Dispatch<Action>;
  files: Record<string, File>;
  rememberFile: (id: string, file: File) => void;
} | null>(null);
const storageKey = "credit-cabinet-demo-v2";
function initialState(): DemoState {
  try {
    // Only synthetic demo state. Never reuse this persistence in API mode.
    const saved = sessionStorage.getItem(storageKey);
    if (saved) return JSON.parse(saved);
  } catch {
    /* Storage is optional, e.g. private browser mode. */
  }
  return createSeed();
}
export function DemoProvider({ children }: { children: ReactNode }) {
  const [state, rawDispatch] = useReducer(reducer, undefined, initialState);
  const [files, setFiles] = useState<Record<string, File>>({});
  function dispatch(action: Action) {
    rawDispatch(action);
    if (action.type === "logout") setFiles({});
  }
  // Persist after the committed render; uploaded bytes are intentionally memory-only.
  useDemoPersistence(state);
  return (
    <Context.Provider
      value={{
        state,
        dispatch,
        files,
        rememberFile: (id, file) =>
          setFiles((prev) => ({ ...prev, [id]: file })),
      }}
    >
      {children}
    </Context.Provider>
  );
}
function useDemoPersistence(state: DemoState) {
  useEffect(() => {
    try {
      sessionStorage.setItem(storageKey, JSON.stringify(state));
    } catch {
      /* memory-only fallback */
    }
  }, [state]);
}
export function useDemo() {
  const value = useContext(Context);
  if (!value) throw new Error("DemoProvider is required");
  return value;
}
