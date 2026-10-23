import { useState } from "react";
import { Link, Navigate, useNavigate, useSearchParams } from "react-router-dom";
import {
  ArrowDown,
  ArrowRight,
  ArrowUpRight,
  Check,
  FileText,
  Plus,
  Search,
  SlidersHorizontal,
  Clock3,
  FolderCheck,
  Activity,
} from "lucide-react";
import { useDemo } from "./store";
import {
  appHref,
  canAccess,
  currentVersion,
  date,
  documentNeedsClientAction,
  isStaff,
  money,
  readiness,
  sortedRequests,
  statusLabel,
  validateDraft,
  type Application,
} from "./domain";
import { AccessDenied } from "./App";
import {
  Badge,
  Empty,
  Eyebrow,
  PageHead,
  RequestRow,
  SlotLink,
  Timeline,
} from "./ui";

export function ApplicationTable({
  applications,
}: {
  applications: Application[];
}) {
  return (
    <div className="table-scroll">
      <table className="data-table">
        <thead>
          <tr>
            <th>Заявка / продукт</th>
            <th>Сумма</th>
            <th>Статус</th>
            <th>Менеджер</th>
            <th>
              Обновлено <ArrowDown size={11} />
            </th>
            <th>
              <span className="sr-only">Перейти</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {applications.map((app) => (
            <tr key={app.id}>
              <td>
                <Link to={appHref(app.id)} className="table-primary">
                  {app.number}
                </Link>
                <small>{app.product}</small>
                <small className="table-org">{app.organization}</small>
              </td>
              <td className="amount-cell">
                {money(app.amount, app.currency)}
                <small>{app.term} мес.</small>
              </td>
              <td>
                <Badge
                  tone={
                    app.status === "documents"
                      ? "warning"
                      : app.status === "review"
                        ? "blue"
                        : "neutral"
                  }
                >
                  {statusLabel[app.status]}
                </Badge>
              </td>
              <td>
                <span className="manager-cell">
                  <span className="avatar tiny">
                    {app.manager === "Не назначен"
                      ? "—"
                      : app.manager
                          .split(" ")
                          .map((n) => n[0])
                          .join("")}
                  </span>
                  {app.manager}
                </span>
              </td>
              <td className="nowrap">{date(app.updated)}</td>
              <td>
                <Link
                  className="icon-button"
                  to={appHref(app.id)}
                  aria-label={`Открыть ${app.number}`}
                >
                  <ArrowUpRight size={17} />
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
export function Dashboard({ bank = false }: { bank?: boolean }) {
  const { state } = useDemo();
  if (state.user?.role === "admin")
    return <Navigate to="/admin/integrations" replace />;
  if (!bank && isStaff(state.user))
    return <Navigate to="/bank/dashboard" replace />;
  const apps = state.applications.filter((a) => canAccess(state.user, a));
  const slots = state.slots.filter((s) =>
    apps.some((a) => a.id === s.applicationId),
  );
  const requests = sortedRequests(
    state.requests.filter(
      (r) => apps.some((a) => a.id === r.applicationId) && !r.resolved,
    ),
  );
  const pending = slots.filter((s) => currentVersion(s)?.review === "pending");
  const actionSlots = slots.filter(documentNeedsClientAction);
  const activity = state.activities.filter((a) =>
    apps.some((app) => app.id === a.applicationId),
  );
  const accepted = readiness(slots);
  const actions = bank ? pending : actionSlots;
  return (
    <>
      <PageHead
        eyebrow={
          bank ? "РАБОЧЕЕ ПРОСТРАНСТВО БАНКА" : "ВАШЕ РАБОЧЕЕ ПРОСТРАНСТВО"
        }
        title={
          bank
            ? "Очередь без лишнего шума."
            : `Добрый день, ${state.user?.name.split(" ")[0]}.`
        }
        text={
          bank
            ? "Материалы, которым нужно ваше внимание, — на первом месте."
            : "Всё, что нужно для движения ваших заявок, — здесь."
        }
      >
        {!bank && (
          <Link className="button button-dark" to="/app/applications/new">
            <Plus size={17} />
            Новая заявка
          </Link>
        )}
        <span className="today-date">
          {new Date().toLocaleDateString("ru-RU", {
            day: "numeric",
            month: "long",
            weekday: "long",
          })}
        </span>
      </PageHead>
      <section className="stats-grid" aria-label="Сводка">
        <Link to="/app/applications?status=active" className="stat-card">
          <span>
            Активные заявки <BriefcaseIcon />
          </span>
          <strong>
            {apps
              .filter((a) => a.status !== "draft")
              .length.toString()
              .padStart(2, "0")}
          </strong>
          <small>В доступном рабочем пространстве</small>
        </Link>
        <Link to="/app/applications?view=requests" className="stat-card">
          <span>
            Открытые запросы <Clock3 size={17} />
          </span>
          <strong>
            {requests.length.toString().padStart(2, "0")}
            <i className="stat-dot" />
          </strong>
          <small>Ожидают ответа или проверки</small>
        </Link>
        <Link
          to={`/app/applications?view=documents&review=${bank ? "pending" : "action"}`}
          className="stat-card"
        >
          <span>
            {bank ? "Документы на проверке" : "Документы требуют действия"}{" "}
            <FileText size={17} />
          </span>
          <strong>{actions.length.toString().padStart(2, "0")}</strong>
          <small>
            {bank
              ? "Новые версии ожидают проверки"
              : `Принято ${accepted.accepted} из ${accepted.total} обязательных`}
          </small>
        </Link>
      </section>
      <div className="dashboard-columns">
        <div className="dashboard-primary">
          <section className="panel action-panel">
            <div className="panel-title">
              <div>
                <span className="attention-dot" />
                <h2>
                  {bank ? "Требует вашей проверки" : "Требует вашего действия"}
                </h2>
                <span className="count-pill">
                  {bank ? pending.length : requests.length}
                </span>
              </div>
              <span className="muted small-text">Сначала срочное</span>
            </div>
            {bank ? (
              pending.length ? (
                pending.map((s) => (
                  <Link
                    className="request-row"
                    key={s.id}
                    to={appHref(
                      s.applicationId,
                      `documents/${s.id}/versions/${currentVersion(s)!.id}`,
                    )}
                  >
                    <span className="request-icon">
                      <FileText size={18} />
                    </span>
                    <span className="request-copy">
                      <strong>{s.title}</strong>
                      <small>
                        Новая версия {currentVersion(s)!.number} · Ожидает
                        решения сотрудника
                      </small>
                    </span>
                    <Badge tone="blue">На проверке</Badge>
                    <ArrowUpRight size={17} />
                  </Link>
                ))
              ) : (
                <Empty
                  title="Все поступившие версии проверены"
                  text="Новые материалы появятся здесь после загрузки клиентом. Открытые запросы перечислены ниже."
                />
              )
            ) : requests.length ? (
              requests.map((r) => <RequestRow key={r.id} request={r} compact />)
            ) : (
              <Empty
                title="Сейчас всё в порядке"
                text="Новых задач нет. Мы сообщим, когда потребуется ваше участие."
              />
            )}
          </section>
          {bank && (
            <section className="panel">
              <div className="panel-title">
                <h2>Ожидают ответа клиента</h2>
                <span className="count-pill">{requests.length}</span>
              </div>
              {requests.map((r) => (
                <RequestRow key={r.id} request={r} compact />
              ))}
            </section>
          )}
          <section className="panel">
            <div className="panel-title">
              <div>
                <h2>{bank ? "Доступные заявки" : "Мои заявки"}</h2>
                <span className="count-pill">{apps.length}</span>
              </div>
              <Link className="text-link" to="/app/applications">
                Все заявки <ArrowUpRight size={15} />
              </Link>
            </div>
            {apps.length ? (
              <ApplicationTable applications={apps} />
            ) : (
              <Empty
                title="Начните с первой заявки"
                text="Выберите продукт и укажите основные параметры."
              >
                <Link
                  className="button button-dark small"
                  to="/app/applications/new"
                >
                  Создать заявку
                </Link>
              </Empty>
            )}
          </section>
          <div className="help-strip">
            <span className="help-mark">?</span>
            <div>
              <strong>Вопрос относится к конкретному документу?</strong>
              <p>
                Оставьте сообщение в его обсуждении — менеджер сразу увидит
                контекст.
              </p>
            </div>
            <Link
              to={appHref("a-0842", "messages")}
              className="icon-button"
              aria-label="Открыть переписку"
            >
              <ArrowUpRight size={20} />
            </Link>
          </div>
        </div>
        <aside className="dashboard-secondary">
          <section className="panel">
            <div className="panel-title">
              <h2>Последние события</h2>
              <Activity size={16} className="muted" />
            </div>
            {activity.length ? (
              <Timeline items={activity} limit={4} />
            ) : (
              <Empty
                title="История начинается здесь"
                text="Создайте заявку, чтобы увидеть первые события."
              />
            )}
            <Link
              className="panel-bottom-link"
              to={appHref("a-0842", "history")}
            >
              Вся история заявки <ArrowRight size={15} />
            </Link>
          </section>
          <div className="manager-panel">
            <Eyebrow>ВАШ КОНТАКТ В БАНКЕ</Eyebrow>
            <span className="avatar manager-avatar">МВ</span>
            <h3>Мария Волкова</h3>
            <p>Менеджер по работе с бизнесом</p>
            <Link to={appHref("a-0842", "messages")}>
              Написать в кабинете <ArrowUpRight size={15} />
            </Link>
            <small>Демонстрационный профиль</small>
          </div>
        </aside>
      </div>
    </>
  );
}
function BriefcaseIcon() {
  return <FolderCheck size={17} />;
}
export function Applications() {
  const { state } = useDemo();
  const [params, setParams] = useSearchParams();
  const [query, setQuery] = useState("");
  const status = params.get("status") ?? "all";
  const view = params.get("view") ?? "applications";
  if (state.user?.role === "admin") return <AccessDenied />;
  const accessible = state.applications.filter((a) => canAccess(state.user, a));
  const apps = accessible
    .filter(
      (a) =>
        status === "all" ||
        (status === "active" ? a.status !== "draft" : a.status === status),
    )
    .filter((a) =>
      `${a.number} ${a.product} ${a.organization}`
        .toLowerCase()
        .includes(query.toLowerCase()),
    )
    .sort((a, b) => b.updated.localeCompare(a.updated));
  const requests = sortedRequests(
    state.requests
      .filter(
        (r) => !r.resolved && accessible.some((a) => a.id === r.applicationId),
      )
      .filter((r) =>
        `${r.title} ${r.description}`
          .toLowerCase()
          .includes(query.toLowerCase()),
      ),
  );
  const slots = state.slots
    .filter((s) => accessible.some((a) => a.id === s.applicationId))
    .filter((s) =>
      params.get("review") === "pending"
        ? currentVersion(s)?.review === "pending"
        : documentNeedsClientAction(s),
    )
    .filter((s) => s.title.toLowerCase().includes(query.toLowerCase()));
  const count =
    view === "requests"
      ? requests.length
      : view === "documents"
        ? slots.length
        : apps.length;
  return (
    <>
      <PageHead
        eyebrow="ОБЩИЙ КОНТЕКСТ"
        title="Заявки"
        text="Документы, запросы и решения по каждой доступной заявке."
      >
        {state.user?.role === "client" && (
          <Link className="button button-dark" to="/app/applications/new">
            <Plus size={17} />
            Новая заявка
          </Link>
        )}
      </PageHead>
      <div
        className="segmented inline-segment"
        aria-label="Материалы по всем заявкам"
      >
        <button
          className={view === "applications" ? "active" : ""}
          onClick={() => {
            setParams({});
            setQuery("");
          }}
        >
          Заявки
        </button>
        <button
          className={view === "requests" ? "active" : ""}
          onClick={() => {
            setParams({ view: "requests" });
            setQuery("");
          }}
        >
          Открытые запросы
        </button>
        <button
          className={view === "documents" ? "active" : ""}
          onClick={() => {
            setParams({
              view: "documents",
              review: isStaff(state.user) ? "pending" : "action",
            });
            setQuery("");
          }}
        >
          Документы к действию
        </button>
      </div>
      <div className="list-toolbar">
        <label className="search-input">
          <Search size={17} />
          <input
            aria-label="Поиск материалов"
            placeholder={
              view === "applications"
                ? "Номер, организация или продукт"
                : "Название материала"
            }
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </label>
        {view === "applications" && (
          <label className="filter-select">
            <SlidersHorizontal size={16} />
            <select
              aria-label="Статус заявки"
              value={status}
              onChange={(e) => setParams({ status: e.target.value })}
            >
              <option value="all">Все статусы</option>
              <option value="active">Активные заявки</option>
              <option value="documents">Сбор документов</option>
              <option value="review">На рассмотрении</option>
              <option value="draft">Черновики</option>
            </select>
          </label>
        )}
        <span className="muted small-text" role="status">
          Найдено: {count}
        </span>
      </div>
      <section className="panel">
        {!count ? (
          <Empty
            title="Материалов не найдено"
            text="Попробуйте изменить поиск или фильтр. Новые материалы появятся здесь."
          />
        ) : view === "requests" ? (
          requests.map((r) => <RequestRow key={r.id} request={r} />)
        ) : view === "documents" ? (
          slots.map((s) => (
            <div className="cross-app-document" key={s.id}>
              <small>
                {accessible.find((a) => a.id === s.applicationId)?.number}
              </small>
              <SlotLink slot={s} />
              {!currentVersion(s) && (
                <Link
                  className="text-link"
                  to={appHref(s.applicationId, "documents")}
                >
                  Перейти к загрузке <ArrowUpRight size={15} />
                </Link>
              )}
            </div>
          ))
        ) : (
          <ApplicationTable applications={apps} />
        )}
      </section>
    </>
  );
}
export function Wizard() {
  const { state, dispatch } = useDemo();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const draft = state.draft;
  if (state.user?.role !== "client") return <AccessDenied />;
  const update = (key: keyof typeof draft, value: string) => {
    dispatch({ type: "draft", draft: { ...draft, [key]: value } });
    setErrors((prev) => ({ ...prev, [key]: "" }));
  };
  function next() {
    const e = validateDraft(draft, step);
    setErrors(e);
    if (!Object.keys(e).length) setStep(step + 1);
  }
  function finish(asDraft: boolean) {
    const e = { ...validateDraft(draft, 1), ...validateDraft(draft, 2) };
    setErrors(e);
    if (Object.keys(e).length) {
      setStep(2);
      return;
    }
    const id = `a-${crypto.randomUUID()}`;
    dispatch({ type: "submit", draft, id, asDraft });
    navigate(appHref(id));
  }
  return (
    <>
      <Link className="back-link" to="/app/applications">
        ← Все заявки
      </Link>
      <PageHead
        eyebrow="ПЕРВЫЙ ШАГ К ОБЩЕМУ КОНТЕКСТУ"
        title="Новая заявка"
        text="Только необходимые сведения. Документы можно будет добавить позже."
      />
      <div className="wizard-layout">
        <aside className="wizard-steps">
          {[
            "Организация и продукт",
            "Параметры кредита",
            "Проверка и отправка",
          ].map((title, i) => (
            <div
              className={step === i + 1 ? "active" : step > i + 1 ? "done" : ""}
              key={title}
            >
              <span>{step > i + 1 ? <Check size={16} /> : `0${i + 1}`}</span>
              <strong>{title}</strong>
            </div>
          ))}
          <p>
            Черновик формы сохраняется при переходах по кабинету в рамках
            демо-сессии. Не вводите реальные данные.
          </p>
        </aside>
        <section className="panel wizard-panel">
          <Eyebrow>ШАГ 0{step} / 03</Eyebrow>
          <h2>
            {
              ["Организация и продукт", "Параметры кредита", "Всё верно?"][
                step - 1
              ]
            }
          </h2>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (step < 3) next();
              else finish(false);
            }}
            noValidate
          >
            {step === 1 && (
              <>
                <label className="field-label">
                  Организация
                  <select
                    value={draft.organization}
                    onChange={(e) => update("organization", e.target.value)}
                  >
                    <option>ООО «Северная мануфактура»</option>
                  </select>
                  <small>Организация, в которой у вас есть доступ.</small>
                </label>
                <label className="field-label">
                  Кредитный продукт
                  <select
                    value={draft.product}
                    onChange={(e) => update("product", e.target.value)}
                  >
                    <option>Оборотный кредит</option>
                    <option>Инвестиционный кредит</option>
                    <option>Кредитная линия</option>
                  </select>
                </label>
                <div className="info-banner">
                  <FileText size={20} />
                  <p>
                    Выбранный продукт задаёт контекст заявки. Перечень
                    требований уточнит сотрудник банка — здесь нет
                    автоматического скоринга.
                  </p>
                </div>
              </>
            )}
            {step === 2 && (
              <>
                <div className="form-grid">
                  <label className="field-label">
                    Запрашиваемая сумма
                    <input
                      autoFocus
                      inputMode="decimal"
                      placeholder="Например, 15 000 000"
                      value={draft.amount}
                      onChange={(e) =>
                        update("amount", e.target.value.replace(/\s/g, ""))
                      }
                      aria-invalid={!!errors.amount}
                      aria-describedby={
                        errors.amount ? "amount-error" : undefined
                      }
                    />
                    {errors.amount && (
                      <span id="amount-error" className="field-error">
                        {errors.amount}
                      </span>
                    )}
                  </label>
                  <label className="field-label">
                    Валюта
                    <select
                      value={draft.currency}
                      onChange={(e) => update("currency", e.target.value)}
                    >
                      <option value="RUB">RUB · Российский рубль</option>
                    </select>
                  </label>
                </div>
                <label className="field-label">
                  Срок, месяцев
                  <input
                    inputMode="numeric"
                    value={draft.term}
                    onChange={(e) => update("term", e.target.value)}
                    aria-invalid={!!errors.term}
                  />
                  {errors.term && (
                    <span className="field-error">{errors.term}</span>
                  )}
                </label>
                <label className="field-label">
                  Контактный email
                  <input
                    type="email"
                    value={draft.contact}
                    onChange={(e) => update("contact", e.target.value)}
                    aria-invalid={!!errors.contact}
                  />
                  {errors.contact && (
                    <span className="field-error">{errors.contact}</span>
                  )}
                </label>
              </>
            )}
            {step === 3 && (
              <>
                <p className="muted">
                  Проверьте параметры перед отправкой в демо-банк.
                </p>
                <dl className="review-list">
                  <div>
                    <dt>Организация</dt>
                    <dd>{draft.organization}</dd>
                  </div>
                  <div>
                    <dt>Продукт</dt>
                    <dd>{draft.product}</dd>
                  </div>
                  <div>
                    <dt>Сумма</dt>
                    <dd>
                      {money(draft.amount.replace(",", "."), draft.currency)}
                    </dd>
                  </div>
                  <div>
                    <dt>Срок</dt>
                    <dd>{draft.term} месяцев</dd>
                  </div>
                  <div>
                    <dt>Контакт</dt>
                    <dd>{draft.contact}</dd>
                  </div>
                </dl>
                <div className="info-banner">
                  <ShieldIcon />
                  <p>
                    Отправка создаст заявку в демо-пространстве. Это не заявка
                    на реальное финансирование.
                  </p>
                </div>
              </>
            )}
            <div className="form-actions">
              {step > 1 ? (
                <button
                  className="button button-outline"
                  type="button"
                  onClick={() => setStep(step - 1)}
                >
                  Назад
                </button>
              ) : (
                <Link className="button button-outline" to="/app/applications">
                  Отмена
                </Link>
              )}
              <div>
                {step === 3 && (
                  <button
                    className="button button-outline"
                    type="button"
                    onClick={() => finish(true)}
                  >
                    Сохранить черновик
                  </button>
                )}
                <button className="button button-dark" type="submit">
                  {step < 3 ? "Продолжить" : "Отправить заявку"}
                  <ArrowRight size={16} />
                </button>
              </div>
            </div>
          </form>
        </section>
      </div>
    </>
  );
}
function ShieldIcon() {
  return <Check size={20} />;
}
