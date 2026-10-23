import { useEffect, useId, useRef, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { ArrowUpRight, X, FileText, Check, ArrowRight } from "lucide-react";
import {
  type Activity,
  type DocumentSlot,
  type Request,
  appHref,
  currentVersion,
  date,
  reviewLabel,
} from "./domain";

export function Brand({
  light = false,
  compact = false,
}: {
  light?: boolean;
  compact?: boolean;
}) {
  return (
    <Link
      to="/"
      className={`brand ${light ? "brand-light" : ""}`}
      aria-label="Кредитный кабинет — главная"
    >
      <span className="brand-symbol" aria-hidden="true">
        <i />
        <i />
        <i />
      </span>
      {!compact && (
        <span>
          кредитный
          <br />
          кабинет<span className="brand-dot">.</span>
        </span>
      )}
    </Link>
  );
}
export function Eyebrow({ children }: { children: ReactNode }) {
  return <div className="eyebrow">{children}</div>;
}
export function Badge({
  children,
  tone = "neutral",
}: {
  children: ReactNode;
  tone?: string;
}) {
  return (
    <span className={`badge badge-${tone}`}>
      <i />
      {children}
    </span>
  );
}
export function Empty({
  title,
  text,
  children,
}: {
  title: string;
  text: string;
  children?: ReactNode;
}) {
  return (
    <div className="empty-state">
      <span className="empty-icon">
        <FileText size={24} />
      </span>
      <h3>{title}</h3>
      <p>{text}</p>
      {children}
    </div>
  );
}
export function PageHead({
  eyebrow,
  title,
  text,
  children,
}: {
  eyebrow?: string;
  title: string;
  text?: string;
  children?: ReactNode;
}) {
  return (
    <div className="page-head">
      <div>
        {eyebrow && <Eyebrow>{eyebrow}</Eyebrow>}
        <h1>{title}</h1>
        {text && <p>{text}</p>}
      </div>
      <div className="page-head-actions">{children}</div>
    </div>
  );
}
export function Modal({
  title,
  children,
  onClose,
  wide = false,
}: {
  title: string;
  children: ReactNode;
  onClose: () => void;
  wide?: boolean;
}) {
  const titleId = useId();
  const ref = useRef<HTMLDivElement>(null);
  const close = useRef(onClose);
  close.current = onClose;
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    const old = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    ref.current?.focus();
    const key = (event: KeyboardEvent) => {
      if (event.key === "Escape") close.current();
      if (event.key !== "Tab") return;
      const elements = Array.from(
        ref.current?.querySelectorAll<HTMLElement>(
          'a[href],button:not([disabled]),input:not([disabled]),select,textarea,[tabindex="0"]',
        ) ?? [],
      );
      const first = elements[0],
        last = elements.at(-1);
      if (
        event.shiftKey &&
        (document.activeElement === first ||
          document.activeElement === ref.current)
      ) {
        event.preventDefault();
        last?.focus();
      } else if (
        !event.shiftKey &&
        (document.activeElement === last ||
          document.activeElement === ref.current)
      ) {
        event.preventDefault();
        first?.focus();
      }
    };
    document.addEventListener("keydown", key);
    return () => {
      document.body.style.overflow = old;
      document.removeEventListener("keydown", key);
      previous?.focus();
    };
  }, []);
  return (
    <div
      className="modal-backdrop"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        className={`modal ${wide ? "modal-wide" : ""}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        ref={ref}
      >
        <div className="modal-head">
          <h2 id={titleId}>{title}</h2>
          <button
            className="icon-button"
            aria-label="Закрыть"
            onClick={onClose}
          >
            <X size={20} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
export function RequestRow({
  request,
  compact = false,
}: {
  request: Request;
  compact?: boolean;
}) {
  return (
    <Link
      className={`request-row ${compact ? "compact" : ""}`}
      to={appHref(request.applicationId, `requests/${request.id}`)}
    >
      <span className={`request-icon ${request.resolved ? "done" : ""}`}>
        {request.resolved ? <Check size={18} /> : <FileText size={18} />}
      </span>
      <span className="request-copy">
        <strong>{request.title}</strong>
        <small>
          {request.resolved ? "Запрос закрыт" : request.author}
          {!compact && ` · ${request.description}`}
        </small>
      </span>
      <span className="request-due">
        {request.resolved ? (
          <Badge tone="success">Решён</Badge>
        ) : (
          <>
            <small>Срок ответа</small>
            <strong>{date(request.due)}</strong>
          </>
        )}
      </span>
      <ArrowUpRight size={18} className="muted" />
    </Link>
  );
}
export function SlotLink({ slot }: { slot: DocumentSlot }) {
  const version = currentVersion(slot);
  return (
    <div className="slot-card">
      <span className="file-icon">
        <FileText size={22} />
      </span>
      <div>
        <strong>{slot.title}</strong>
        <small>
          {version
            ? `Версия ${version.number} · ${version.filename}`
            : "Документ ещё не загружен"}
        </small>
      </div>
      {version ? (
        <Link
          className="text-link"
          to={appHref(
            slot.applicationId,
            `documents/${slot.id}/versions/${version.id}`,
          )}
        >
          {reviewLabel[version.review]} <ArrowUpRight size={16} />
        </Link>
      ) : (
        <span className="badge badge-warning">Ожидается</span>
      )}
    </div>
  );
}
export function Timeline({
  items,
  limit,
}: {
  items: Activity[];
  limit?: number;
}) {
  const shown = limit ? items.slice(0, limit) : items;
  return (
    <div className="timeline">
      {shown.map((item) => (
        <Link key={item.id} to={item.href} className="timeline-item">
          <span className="timeline-dot" />
          <div>
            <strong>{item.title}</strong>
            <p>{item.description}</p>
            <time>{date(item.at, true)}</time>
          </div>
          <ArrowUpRight size={16} />
        </Link>
      ))}
    </div>
  );
}
export function NextArrow() {
  return <ArrowRight size={18} aria-hidden="true" />;
}
