import { useEffect, useRef, useState, type FormEvent } from "react";
import { Link, Navigate, useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  CalendarDays,
  Check,
  CheckCheck,
  Clock3,
  Download,
  FileText,
  MessageSquare,
  Plus,
  Search,
  Send,
  Upload,
} from "lucide-react";
import { useDemo } from "./store";
import {
  type Application,
  type DocumentSlot,
  type Request,
  type Version,
  appHref,
  canAccess,
  currentVersion,
  date,
  isStaff,
  money,
  readiness,
  reviewLabel,
  sortedRequests,
  statusLabel,
} from "./domain";
import { AccessDenied } from "./App";
import {
  Badge,
  Empty,
  Eyebrow,
  Modal,
  RequestRow,
  SlotLink,
  Timeline,
} from "./ui";

function UploadButton({
  slot,
  compact = false,
}: {
  slot: DocumentSlot;
  compact?: boolean;
}) {
  const { dispatch, rememberFile } = useDemo();
  const input = useRef<HTMLInputElement>(null);
  const [message, setMessage] = useState(""),
    [error, setError] = useState(false);
  function upload(file?: File) {
    if (!file) return;
    if (
      !/\.(pdf|png|jpe?g)$/i.test(file.name) ||
      !["application/pdf", "image/png", "image/jpeg"].includes(file.type) ||
      file.size > 20 * 1024 * 1024 ||
      file.size === 0
    ) {
      setError(true);
      setMessage("Выберите непустой PDF, PNG или JPG размером до 20 МБ.");
      return;
    }
    const id = `v-${crypto.randomUUID()}`;
    rememberFile(id, file);
    dispatch({
      type: "upload",
      slotId: slot.id,
      filename: file.name,
      size: file.size,
      id,
    });
    setError(false);
    setMessage(
      "Версия загружена и ожидает проверки. Запрос остаётся открытым.",
    );
    if (input.current) input.current.value = "";
  }
  return (
    <div className="upload-control">
      <input
        className="sr-only"
        type="file"
        accept=".pdf,.png,.jpg,.jpeg"
        ref={input}
        tabIndex={-1}
        onChange={(e) => upload(e.target.files?.[0])}
        aria-label={`Загрузить: ${slot.title}`}
      />
      <button
        className={`button ${compact ? "button-outline small" : "button-dark small"}`}
        onClick={() => input.current?.click()}
      >
        <Upload size={15} />
        {currentVersion(slot) ? "Новая версия" : "Загрузить документ"}
      </button>
      <span
        role="status"
        className={
          error
            ? "field-error upload-feedback"
            : "success-message upload-feedback"
        }
      >
        {message}
      </span>
    </div>
  );
}
function Conversation({
  applicationId,
  context,
  title = "Обсуждение",
}: {
  applicationId: string;
  context: string;
  title?: string;
}) {
  const { state, dispatch } = useDemo();
  const [text, setText] = useState("");
  const messages = state.messages.filter(
    (m) => m.applicationId === applicationId && m.context === context,
  );
  function submit(e: FormEvent) {
    e.preventDefault();
    if (!text.trim()) return;
    dispatch({ type: "message", applicationId, context, text });
    setText("");
  }
  return (
    <section className="conversation">
      <div className="conversation-title">
        <MessageSquare size={17} />
        <h3>{title}</h3>
        <span className="count-pill">{messages.length}</span>
      </div>
      <div className="message-list" aria-live="polite">
        {messages.length ? (
          messages.map((m) => (
            <article className="message" key={m.id}>
              <span className={`avatar ${m.role === "client" ? "client" : ""}`}>
                {m.author
                  .split(" ")
                  .map((n) => n[0])
                  .join("")}
              </span>
              <div>
                <div className="message-meta">
                  <strong>{m.author}</strong>
                  <span>{m.role === "client" ? "Клиент" : "Банк"}</span>
                  <time>{date(m.at, true)}</time>
                </div>
                <p>{m.text}</p>
              </div>
            </article>
          ))
        ) : (
          <p className="conversation-empty">
            Пока нет сообщений. Задайте вопрос — он останется в контексте{" "}
            {context === "application" ? "заявки" : "этого материала"}.
          </p>
        )}
      </div>
      <form className="message-form" onSubmit={submit}>
        <label className="sr-only" htmlFor={`message-${context}`}>
          Ваше сообщение
        </label>
        <textarea
          id={`message-${context}`}
          placeholder="Напишите сообщение…"
          value={text}
          onChange={(e) => setText(e.target.value)}
          maxLength={3000}
          rows={2}
          required
        />
        <div>
          <small>
            {text.length} / 3000 · Не вводите конфиденциальные данные
          </small>
          <button
            className="button button-dark small"
            disabled={!text.trim()}
            type="submit"
          >
            Отправить <Send size={14} />
          </button>
        </div>
      </form>
    </section>
  );
}
function Overview({ app }: { app: Application }) {
  const { state, dispatch } = useDemo();
  const slots = state.slots.filter((s) => s.applicationId === app.id);
  const ready = readiness(slots);
  const requests = sortedRequests(
    state.requests.filter((r) => r.applicationId === app.id && !r.resolved),
  );
  const first = requests[0];
  const pendingSlot = isStaff(state.user)
    ? slots.find((slot) => currentVersion(slot)?.review === "pending")
    : undefined;
  const events = state.activities.filter((a) => a.applicationId === app.id);
  return (
    <div className="overview-layout">
      <div>
        <section className="next-action-panel">
          <div className="next-action-label">
            <span className="attention-dot" />
            СЛЕДУЮЩИЙ ШАГ
          </div>
          <h2>
            {app.status === "draft"
              ? "Отправьте заявку на рассмотрение"
              : pendingSlot
                ? "Проверьте новую версию документа"
                : first
                  ? isStaff(state.user)
                    ? "Проконтролируйте ответ по запросу"
                    : first.title
                  : "Ожидайте следующего шага от банка"}
          </h2>
          <p>
            {app.status === "draft"
              ? "Параметры сохранены. Отправьте черновик, когда будете готовы."
              : pendingSlot
                ? `${pendingSlot.title} · версия ${currentVersion(pendingSlot)!.number} ожидает вашего решения.`
                : first
                  ? first.description
                  : "Сейчас открытых запросов нет. Новые требования и обновления появятся в кабинете."}
          </p>
          <div>
            {pendingSlot ? (
              <Link
                className="button button-dark small"
                to={appHref(
                  app.id,
                  `documents/${pendingSlot.id}/versions/${currentVersion(pendingSlot)!.id}`,
                )}
              >
                Проверить версию <ArrowUpRight size={16} />
              </Link>
            ) : first ? (
              <>
                <Link
                  className="button button-dark small"
                  to={appHref(app.id, `requests/${first.id}`)}
                >
                  Открыть запрос <ArrowUpRight size={16} />
                </Link>
                <span>
                  <CalendarDays size={15} />
                  Срок: {date(first.due)}
                </span>
              </>
            ) : app.status === "draft" && state.user?.role === "client" ? (
              <button
                className="button button-dark small"
                onClick={() =>
                  dispatch({ type: "send", applicationId: app.id })
                }
              >
                Отправить заявку <ArrowRight size={16} />
              </button>
            ) : (
              <Link className="text-link" to={appHref(app.id, "messages")}>
                Написать менеджеру <ArrowUpRight size={16} />
              </Link>
            )}
          </div>
        </section>
        <section className="panel padded">
          <div className="panel-heading">
            <h2>Движение заявки</h2>
            <Badge tone={app.status === "documents" ? "warning" : "blue"}>
              {statusLabel[app.status]}
            </Badge>
          </div>
          <div className="stage-timeline">
            {["Заявка создана", "Сбор документов", "Рассмотрение"].map(
              (name, i) => {
                const active =
                  app.status === "draft"
                    ? 0
                    : app.status === "documents"
                      ? 1
                      : 2;
                return (
                  <div key={name} className={i <= active ? "complete" : ""}>
                    <span>
                      {i < active ? <Check size={14} /> : `0${i + 1}`}
                    </span>
                    <strong>{name}</strong>
                    <small>
                      {i === active
                        ? "Текущий этап"
                        : i < active
                          ? "Предыдущий этап"
                          : "Следующий этап"}
                    </small>
                  </div>
                );
              },
            )}
          </div>
          <p className="small-text muted">
            Этап заявки и готовность документов — разные показатели. Решение по
            кредиту принимает банк вне прототипа.
          </p>
        </section>
        <section className="panel">
          <div className="panel-title">
            <h2>Открытые запросы</h2>
            <span className="count-pill">{requests.length}</span>
            <Link className="text-link" to={appHref(app.id, "requests")}>
              Все <ArrowUpRight size={15} />
            </Link>
          </div>
          {requests.length ? (
            requests.map((r) => <RequestRow key={r.id} request={r} compact />)
          ) : (
            <Empty
              title="Открытых запросов нет"
              text="Банк сообщит, когда потребуются дополнительные материалы."
            />
          )}
        </section>
        <section className="panel">
          <div className="panel-title">
            <h2>Последние события</h2>
            <Link className="text-link" to={appHref(app.id, "history")}>
              Вся история <ArrowUpRight size={15} />
            </Link>
          </div>
          <Timeline items={events} limit={3} />
        </section>
      </div>
      <aside>
        <section className="panel padded document-readiness">
          <Eyebrow>ГОТОВНОСТЬ ДОКУМЕНТОВ</Eyebrow>
          <div className="readiness-number">
            {ready.accepted}
            <span>/ {ready.total}</span>
            <FolderCheckIcon />
          </div>
          <h3>
            {ready.total
              ? "обязательных документов принято"
              : "Требования ещё не определены"}
          </h3>
          <div className="progress-track">
            <i
              style={{
                width: `${ready.total ? (ready.accepted / ready.total) * 100 : 0}%`,
              }}
            />
          </div>
          <ul>
            {slots
              .filter((s) => s.required)
              .map((s) => (
                <li key={s.id}>
                  <span
                    className={
                      currentVersion(s)?.review === "accepted"
                        ? "ready-check"
                        : "not-ready"
                    }
                  >
                    {currentVersion(s)?.review === "accepted" ? (
                      <Check size={13} />
                    ) : (
                      <Clock3 size={13} />
                    )}
                  </span>
                  <span>{s.title}</span>
                </li>
              ))}
          </ul>
          <Link className="text-link" to={appHref(app.id, "documents")}>
            Перейти к документам <ArrowRight size={15} />
          </Link>
          <p className="readiness-note">
            Учитываются только принятые текущие версии. Проверка безопасности не
            заменяет решение сотрудника.
          </p>
        </section>
        <section className="panel padded participants">
          <Eyebrow>УЧАСТНИКИ ЗАЯВКИ</Eyebrow>
          <div>
            <span className="avatar">
              {app.manager
                .split(" ")
                .map((name) => name[0])
                .join("")}
            </span>
            <span>
              <strong>{app.manager}</strong>
              <small>Менеджер банка</small>
            </span>
          </div>
          <div>
            <span className="avatar client">
              {app.organizationId === "org-sever" ? "АС" : "ИК"}
            </span>
            <span>
              <strong>
                {app.organizationId === "org-sever"
                  ? "Анна Смирнова"
                  : "Иван Кузнецов"}
              </strong>
              <small>Представитель организации</small>
            </span>
          </div>
          <Link className="text-link" to={appHref(app.id, "messages")}>
            Переписка по заявке <MessageSquare size={14} />
          </Link>
        </section>
      </aside>
    </div>
  );
}
function FolderCheckIcon() {
  return <CheckCheck size={28} />;
}
function CreateRequest({
  app,
  onClose,
}: {
  app: Application;
  onClose: () => void;
}) {
  const { state, dispatch } = useDemo();
  const [title, setTitle] = useState(""),
    [description, setDescription] = useState(""),
    [due, setDue] = useState(""),
    [selected, setSelected] = useState<string[]>([]),
    [newTitle, setNewTitle] = useState(""),
    [error, setError] = useState("");
  const slots = state.slots.filter((s) => s.applicationId === app.id);
  function submit(e: FormEvent) {
    e.preventDefault();
    if (!title.trim() || !description.trim()) {
      setError("Укажите заголовок и пояснение запроса.");
      return;
    }
    const newSlots = newTitle.trim()
      ? [{ id: `s-${crypto.randomUUID()}`, title: newTitle.trim() }]
      : [];
    dispatch({
      type: "request",
      request: {
        id: `r-${crypto.randomUUID()}`,
        applicationId: app.id,
        title: title.trim(),
        description: description.trim(),
        due: due ? new Date(`${due}T18:00:00`).toISOString() : "",
        author: state.user!.name,
        resolved: false,
        slotIds: [...selected, ...newSlots.map((s) => s.id)],
        created: new Date().toISOString(),
      },
      newSlots,
    });
    onClose();
  }
  return (
    <Modal title="Новый запрос клиенту" onClose={onClose}>
      <form onSubmit={submit}>
        <p className="muted">
          Укажите, что необходимо для продолжения работы по заявке.
        </p>
        <label className="field-label">
          Заголовок
          <input
            required
            maxLength={160}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Например, уточнить структуру выручки"
          />
        </label>
        <label className="field-label">
          Пояснение
          <textarea
            required
            maxLength={3000}
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Что нужно подготовить и почему"
          />
        </label>
        <label className="field-label">
          Срок ответа · необязательно
          <input
            type="date"
            value={due}
            onChange={(e) => setDue(e.target.value)}
          />
        </label>
        <fieldset className="document-checks">
          <legend>Связанные документы</legend>
          {slots.map((slot) => (
            <label key={slot.id}>
              <input
                type="checkbox"
                checked={selected.includes(slot.id)}
                onChange={(e) =>
                  setSelected((prev) =>
                    e.target.checked
                      ? [...prev, slot.id]
                      : prev.filter((id) => id !== slot.id),
                  )
                }
              />
              {slot.title}
            </label>
          ))}
        </fieldset>
        <label className="field-label">
          Новый обязательный документ · необязательно
          <input
            maxLength={160}
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            placeholder="Название нового требования"
          />
        </label>
        <span role="alert" className="field-error">
          {error}
        </span>
        <div className="form-actions">
          <button
            type="button"
            className="button button-outline"
            onClick={onClose}
          >
            Отмена
          </button>
          <button type="submit" className="button button-dark">
            Создать запрос <Plus size={16} />
          </button>
        </div>
      </form>
    </Modal>
  );
}
function RequestList({ app }: { app: Application }) {
  const { state } = useDemo();
  const [filter, setFilter] = useState("open"),
    [query, setQuery] = useState(""),
    [create, setCreate] = useState(false);
  const all = state.requests.filter((r) => r.applicationId === app.id);
  const requests = sortedRequests(
    all
      .filter(
        (r) =>
          filter === "all" || (filter === "open" ? !r.resolved : r.resolved),
      )
      .filter((r) =>
        `${r.title} ${r.description}`
          .toLowerCase()
          .includes(query.toLowerCase()),
      ),
  );
  return (
    <>
      <div className="section-toolbar">
        <div>
          <h2>Запросы банка</h2>
          <p>Требования, сроки и обсуждения — в контексте заявки.</p>
        </div>
        {isStaff(state.user) && (
          <button
            className="button button-dark small"
            onClick={() => setCreate(true)}
          >
            <Plus size={16} />
            Новый запрос
          </button>
        )}
      </div>
      <div className="list-toolbar">
        <div className="segmented">
          <button
            className={filter === "open" ? "active" : ""}
            onClick={() => setFilter("open")}
          >
            Открытые ({all.filter((r) => !r.resolved).length})
          </button>
          <button
            className={filter === "resolved" ? "active" : ""}
            onClick={() => setFilter("resolved")}
          >
            Решённые ({all.filter((r) => r.resolved).length})
          </button>
          <button
            className={filter === "all" ? "active" : ""}
            onClick={() => setFilter("all")}
          >
            Все
          </button>
        </div>
        <label className="search-input">
          <Search size={16} />
          <input
            aria-label="Поиск запросов"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Найти запрос"
          />
        </label>
      </div>
      <section className="panel">
        {requests.length ? (
          requests.map((r) => <RequestRow key={r.id} request={r} />)
        ) : (
          <Empty
            title="Запросов не найдено"
            text="Измените фильтр или поисковую фразу. Новые запросы банка появятся здесь."
          />
        )}
      </section>
      {create && <CreateRequest app={app} onClose={() => setCreate(false)} />}
    </>
  );
}
function RequestDetail({
  request,
  onClose,
}: {
  request: Request;
  onClose: () => void;
}) {
  const { state, dispatch } = useDemo();
  const slots = state.slots.filter((s) => request.slotIds.includes(s.id));
  const ready = request.slotIds.every((id) => {
    const s = slots.find((s) => s.id === id);
    return s && currentVersion(s)?.review === "accepted";
  });
  return (
    <Modal title={request.title} onClose={onClose} wide>
      <div className="detail-meta">
        <Badge tone={request.resolved ? "success" : "warning"}>
          {request.resolved ? "Запрос решён" : "Открытый запрос"}
        </Badge>
        <span>
          <CalendarDays size={14} />
          {date(request.due)}
        </span>
        <span>
          {request.author} · {date(request.created)}
        </span>
      </div>
      <p className="request-description">{request.description}</p>
      <div className="request-detail-grid">
        <div>
          <h3>Запрошенные документы</h3>
          {slots.length ? (
            slots.map((slot) => (
              <div className="request-document" key={slot.id}>
                <SlotLink slot={slot} />
                {state.user?.role === "client" && !request.resolved && (
                  <UploadButton slot={slot} />
                )}
                <small className="muted">
                  PDF, PNG или JPG · до 20 МБ · только тестовые файлы
                </small>
              </div>
            ))
          ) : (
            <p className="muted">
              Файл не требуется. Ответьте на запрос в обсуждении.
            </p>
          )}
          <div className="request-rule">
            <CheckCheck size={20} />
            <p>
              Загрузка не закрывает запрос. Банк проверяет текущую версию и
              отдельно отмечает запрос решённым.
            </p>
          </div>
          {isStaff(state.user) && !request.resolved && (
            <>
              <button
                className="button button-dark small"
                disabled={!ready}
                onClick={() =>
                  dispatch({ type: "resolve", requestId: request.id })
                }
              >
                Отметить решённым <Check size={16} />
              </button>
              {!ready && (
                <p className="form-hint">
                  Сначала примите текущие версии всех запрошенных документов.
                </p>
              )}
            </>
          )}
        </div>
        <Conversation
          applicationId={request.applicationId}
          context={request.id}
          title="Обсуждение запроса"
        />
      </div>
    </Modal>
  );
}
function Documents({ app }: { app: Application }) {
  const { state } = useDemo();
  const [filter, setFilter] = useState("all");
  const all = state.slots.filter((s) => s.applicationId === app.id);
  const slots = all.filter(
    (s) =>
      filter === "all" ||
      (filter === "missing"
        ? !currentVersion(s)
        : currentVersion(s)?.review === filter),
  );
  return (
    <>
      <div className="section-toolbar">
        <div>
          <h2>Документы заявки</h2>
          <p>
            У каждого документа — свои версии, замечания и результат проверки.
          </p>
        </div>
        <label className="filter-select">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            aria-label="Фильтр документов"
          >
            <option value="all">Все документы ({all.length})</option>
            <option value="changes">Нужны исправления</option>
            <option value="pending">На проверке</option>
            <option value="accepted">Принятые</option>
            <option value="missing">Не загружены</option>
          </select>
        </label>
      </div>
      <section className="panel">
        {slots.length ? (
          <div className="table-scroll">
            <table className="data-table document-table">
              <thead>
                <tr>
                  <th>Документ</th>
                  <th>Текущая версия</th>
                  <th>Проверка</th>
                  <th>Действие</th>
                </tr>
              </thead>
              <tbody>
                {slots.map((slot) => {
                  const v = currentVersion(slot);
                  return (
                    <tr key={slot.id}>
                      <td>
                        <div className="document-cell">
                          <span className="file-icon">
                            <FileText size={21} />
                          </span>
                          <div>
                            <strong>{slot.title}</strong>
                            <small>
                              {slot.required
                                ? "Обязательный документ"
                                : "Дополнительный документ"}
                            </small>
                          </div>
                        </div>
                      </td>
                      <td>
                        {v ? (
                          <>
                            <Link
                              className="text-link"
                              to={appHref(
                                app.id,
                                `documents/${slot.id}/versions/${v.id}`,
                              )}
                            >
                              Версия {v.number} <ArrowUpRight size={13} />
                            </Link>
                            <small>{date(v.uploaded)}</small>
                          </>
                        ) : (
                          <span className="muted">—</span>
                        )}
                      </td>
                      <td>
                        <Badge
                          tone={
                            !v
                              ? "neutral"
                              : v.review === "accepted"
                                ? "success"
                                : v.review === "changes"
                                  ? "warning"
                                  : "blue"
                          }
                        >
                          {v ? reviewLabel[v.review] : "Не загружен"}
                        </Badge>
                      </td>
                      <td>
                        {state.user?.role === "client" ? (
                          <UploadButton slot={slot} compact />
                        ) : v ? (
                          <Link
                            className="button button-outline small"
                            to={appHref(
                              app.id,
                              `documents/${slot.id}/versions/${v.id}`,
                            )}
                          >
                            Открыть <ArrowUpRight size={14} />
                          </Link>
                        ) : (
                          <span className="muted small-text">
                            Ожидаем клиента
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <Empty
            title={
              all.length
                ? "Нет документов с таким статусом"
                : "Требования ещё не добавлены"
            }
            text={
              all.length
                ? "Выберите другой фильтр."
                : "Сотрудник банка добавит требования в запросе по заявке."
            }
          />
        )}
      </section>
      <div className="info-banner">
        <FileText size={19} />
        <p>
          Новая версия всегда требует отдельного рассмотрения. Содержимое
          тестовых загрузок хранится только в памяти вкладки; после перезагрузки
          остаются лишь метаданные. Антивирусная проверка не подключена.
        </p>
      </div>
    </>
  );
}
function VersionDetail({
  slot,
  version,
  onClose,
}: {
  slot: DocumentSlot;
  version: Version;
  onClose: () => void;
}) {
  const { state, dispatch, files } = useDemo();
  const [note, setNote] = useState(""),
    [error, setError] = useState("");
  const file = files[version.id];
  const [url, setUrl] = useState("");
  const seeded = !/^v-[0-9a-f]{8}-/.test(version.id);
  const current = currentVersion(slot)?.id === version.id;
  useEffect(() => {
    if (!file) {
      setUrl("");
      return;
    }
    const blob = URL.createObjectURL(file);
    setUrl(blob);
    return () => URL.revokeObjectURL(blob);
  }, [file]);
  function review(value: "accepted" | "changes") {
    if (value === "changes" && !note.trim()) {
      setError(
        "Опишите конкретное исправление, чтобы клиент знал следующий шаг.",
      );
      return;
    }
    dispatch({
      type: "review",
      slotId: slot.id,
      versionId: version.id,
      review: value,
      note: note || "Документ принят. Замечаний нет.",
    });
    setError("");
    setNote("");
  }
  return (
    <Modal title={slot.title} onClose={onClose} wide>
      <div className="version-toolbar">
        <div>
          <Badge
            tone={
              version.review === "accepted"
                ? "success"
                : version.review === "changes"
                  ? "warning"
                  : "blue"
            }
          >
            {reviewLabel[version.review]}
          </Badge>
          <span className="muted small-text">
            {version.filename} · {(version.size / 1024 / 1024).toFixed(1)} МБ
          </span>
        </div>
        <div className="version-links" aria-label="Версии документа">
          {slot.versions.map((v) => (
            <Link
              key={v.id}
              className={v.id === version.id ? "active" : ""}
              to={appHref(
                slot.applicationId,
                `documents/${slot.id}/versions/${v.id}`,
              )}
            >
              Версия {v.number}
              {v.id === currentVersion(slot)?.id && " · текущая"}
            </Link>
          ))}
        </div>
      </div>
      <div className="version-detail-grid">
        <div>
          <div className="document-preview">
            {url ? (
              file.type.startsWith("image/") ? (
                <img src={url} alt={version.filename} />
              ) : (
                <iframe src={url} title={version.filename} sandbox="" />
              )
            ) : (
              <div className="sample-document">
                <div className="sample-stamp">ДЕМОНСТРАЦИОННЫЙ ОБРАЗЕЦ</div>
                <span className="sample-document-top">
                  СЕВЕРНАЯ МАНУФАКТУРА / ДОКУМЕНТ
                </span>
                <h3>{slot.title}</h3>
                <p>Иллюстрация просмотра документа</p>
                <div className="sample-document-lines">
                  {Array.from({ length: 8 }, (_, i) => (
                    <span key={i} />
                  ))}
                </div>
                <div className="sample-document-table">
                  {Array.from({ length: 9 }, (_, i) => (
                    <i key={i} />
                  ))}
                </div>
                <div className="sample-signature">
                  Документ · версия {version.number}
                  <span>
                    {version.review === "accepted"
                      ? "✓ Принят сотрудником"
                      : "Ожидает уточнений"}
                  </span>
                </div>
                <p className="sample-warning">
                  {seeded
                    ? "Это не содержимое реального файла."
                    : "Оригинал недоступен в этой сессии. Это не содержимое файла."}
                </p>
              </div>
            )}
          </div>
          {url && (
            <a
              className="text-link download-link"
              href={url}
              download={version.filename}
            >
              Скачать тестовый файл <Download size={15} />
            </a>
          )}
          <p className="preview-security-note">
            Проверка безопасности: не выполнялась. Файлы не передаются на
            сервер. Используйте только тестовые материалы.
          </p>
        </div>
        <div>
          <div className="version-info">
            <Eyebrow>{current ? "ТЕКУЩАЯ ВЕРСИЯ" : "АРХИВНАЯ ВЕРСИЯ"}</Eyebrow>
            <p>
              Загрузил(а): {version.author}
              <br />
              {date(version.uploaded, true)}
            </p>
            {version.note && (
              <div className={`review-note ${version.review}`}>
                <strong>
                  {version.review === "accepted"
                    ? "Результат проверки"
                    : "Замечание сотрудника"}
                </strong>
                <p>{version.note}</p>
              </div>
            )}
            {!current && (
              <p className="info-banner">
                Эта версия заменена. Её принятие не учитывается в готовности
                документов.
              </p>
            )}
            {isStaff(state.user) && current && (
              <div className="review-form">
                <label className="field-label">
                  Комментарий к проверке
                  <textarea
                    rows={3}
                    value={note}
                    maxLength={3000}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder="Что нужно исправить или почему версия принята"
                  />
                </label>
                <span className="field-error" role="alert">
                  {error}
                </span>
                <div className="review-actions">
                  <button
                    className="button button-outline small"
                    onClick={() => review("changes")}
                  >
                    На исправление
                  </button>
                  <button
                    className="button button-dark small"
                    onClick={() => review("accepted")}
                  >
                    Принять <Check size={14} />
                  </button>
                </div>
              </div>
            )}
          </div>
          <Conversation
            applicationId={slot.applicationId}
            context={version.id}
            title="Обсуждение версии"
          />
        </div>
      </div>
    </Modal>
  );
}
const tabs = [
  { path: "overview", title: "Обзор" },
  { path: "requests", title: "Запросы" },
  { path: "documents", title: "Документы" },
  { path: "messages", title: "Переписка" },
  { path: "history", title: "История" },
];
export function Workspace() {
  const { id, "*": path = "" } = useParams();
  const { state } = useDemo();
  const navigate = useNavigate();
  const app = state.applications.find((a) => a.id === id);
  if (!app) return <AccessDenied missing />;
  if (!canAccess(state.user, app)) return <AccessDenied />;
  if (!path) return <Navigate to={appHref(app.id)} replace />;
  const segments = path.split("/");
  const tab = segments[0];
  if (!tabs.some((t) => t.path === tab)) return <AccessDenied missing />;
  const request =
    tab === "requests" && segments.length === 2
      ? state.requests.find(
          (r) => r.id === segments[1] && r.applicationId === app.id,
        )
      : undefined;
  const slot =
    tab === "documents" && segments.length === 4 && segments[2] === "versions"
      ? state.slots.find(
          (s) => s.id === segments[1] && s.applicationId === app.id,
        )
      : undefined;
  const version = slot?.versions.find((v) => v.id === segments[3]);
  if (segments.length > 1 && !request && !version)
    return <AccessDenied missing />;
  const requests = state.requests.filter(
    (r) => r.applicationId === app.id && !r.resolved,
  );
  return (
    <>
      <Link to="/app/applications" className="back-link">
        <ArrowLeft size={15} />
        Все заявки
      </Link>
      <header className="workspace-header">
        <div>
          <Eyebrow>{app.product.toUpperCase()}</Eyebrow>
          <h1>Заявка {app.number}</h1>
          <p>{app.organization}</p>
        </div>
        <Badge tone={app.status === "documents" ? "warning" : "blue"}>
          {statusLabel[app.status]}
        </Badge>
      </header>
      <div className="application-meta">
        <div>
          <small>Запрашиваемая сумма</small>
          <strong>{money(app.amount, app.currency)}</strong>
        </div>
        <div>
          <small>Срок кредита</small>
          <strong>{app.term} месяцев</strong>
        </div>
        <div>
          <small>Менеджер банка</small>
          <strong>{app.manager}</strong>
        </div>
        <div>
          <small>Последнее обновление заявки</small>
          <strong>{date(app.updated, true)}</strong>
        </div>
      </div>
      <nav className="workspace-tabs" aria-label="Разделы заявки">
        {tabs.map((t) => (
          <Link
            key={t.path}
            className={tab === t.path ? "active" : ""}
            aria-current={tab === t.path ? "page" : undefined}
            to={appHref(app.id, t.path)}
          >
            {t.title}
            {t.path === "requests" && requests.length > 0 && (
              <span>{requests.length}</span>
            )}
          </Link>
        ))}
      </nav>
      {tab === "overview" && <Overview app={app} />}
      {tab === "requests" && <RequestList app={app} />}
      {tab === "documents" && <Documents app={app} />}
      {tab === "messages" && (
        <section className="panel padded application-conversation">
          <Eyebrow>ОБЩИЕ ВОПРОСЫ ПО ЗАЯВКЕ</Eyebrow>
          <h2>Переписка с участниками</h2>
          <p className="muted">
            Для замечаний к документам используйте обсуждение запроса или
            конкретной версии.
          </p>
          <Conversation
            applicationId={app.id}
            context="application"
            title="Переписка по заявке"
          />
        </section>
      )}
      {tab === "history" && (
        <section className="panel">
          <div className="panel-title">
            <h2>История заявки</h2>
            <span className="muted small-text">
              Действия всех участников в одном месте
            </span>
          </div>
          <Timeline
            items={state.activities.filter((a) => a.applicationId === app.id)}
          />
        </section>
      )}
      {request && (
        <RequestDetail
          key={request.id}
          request={request}
          onClose={() => navigate(appHref(app.id, "requests"))}
        />
      )}
      {slot && version && (
        <VersionDetail
          key={version.id}
          slot={slot}
          version={version}
          onClose={() => navigate(appHref(app.id, "documents"))}
        />
      )}
    </>
  );
}
