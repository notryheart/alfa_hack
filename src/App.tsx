import { useEffect, useState, type ReactNode } from "react";
import {
  Link,
  Navigate,
  NavLink,
  Outlet,
  Route,
  Routes,
  useLocation,
  useNavigate,
} from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  Bell,
  Building2,
  ChevronDown,
  LayoutDashboard,
  LogOut,
  Menu,
  Plus,
  Settings as SettingsIcon,
  ShieldCheck,
  BriefcaseBusiness,
  X,
} from "lucide-react";
import { Landing } from "./Landing";
import { useDemo } from "./store";
import { Brand, Badge, Empty, Eyebrow, Modal, PageHead } from "./ui";
import { isStaff, roleLabel, visibleNotifications, type Role } from "./domain";
import { Applications, Dashboard, Wizard } from "./pages";
import { Workspace } from "./Workspace";

function ScrollReset() {
  const { pathname, hash } = useLocation();
  useEffect(() => {
    if (hash) document.getElementById(hash.slice(1))?.scrollIntoView();
    else window.scrollTo(0, 0);
    document.title =
      pathname === "/"
        ? "Кредитный кабинет — один общий контекст"
        : "Рабочее пространство — Кредитный кабинет";
  }, [pathname, hash]);
  return null;
}
function Protected({
  children,
  staff = false,
  admin = false,
}: {
  children: ReactNode;
  staff?: boolean;
  admin?: boolean;
}) {
  const { state } = useDemo();
  const location = useLocation();
  if (!state.user)
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  if ((staff && !isStaff(state.user)) || (admin && state.user.role !== "admin"))
    return <AccessDenied />;
  return children;
}
export function AccessDenied({ missing = false }: { missing?: boolean }) {
  const { state } = useDemo();
  return (
    <div className="error-page">
      <span className="empty-icon">
        <ShieldCheck size={30} />
      </span>
      <Eyebrow>
        {missing ? "404 / СТРАНИЦА НЕ НАЙДЕНА" : "403 / ДОСТУП ОГРАНИЧЕН"}
      </Eyebrow>
      <h1>
        {missing ? "Здесь пока ничего нет" : "Нет доступа к этому разделу"}
      </h1>
      <p>
        {missing
          ? "Проверьте адрес или вернитесь в рабочее пространство."
          : "У вашей роли нет нужных прав, либо вы не участвуете в этой заявке. Обратитесь к менеджеру банка."}
      </p>
      <Link
        className="button button-dark"
        to={
          state.user
            ? isStaff(state.user)
              ? "/bank/dashboard"
              : state.user.role === "admin"
                ? "/admin/integrations"
                : "/app/dashboard"
            : "/"
        }
      >
        Вернуться к обзору <ArrowRight size={17} />
      </Link>
    </div>
  );
}
function Login() {
  const { state, dispatch } = useDemo();
  const [role, setRole] = useState<Role>("client");
  const navigate = useNavigate();
  const location = useLocation();
  function enter() {
    dispatch({
      type: "login",
      user: {
        id: `demo-${role}`,
        name:
          role === "client"
            ? "Анна Смирнова"
            : role === "admin"
              ? "Алексей Морозов"
              : role === "analyst"
                ? "Денис Орлов"
                : "Мария Волкова",
        role,
        organizationId: role === "client" ? "org-sever" : "bank",
      },
    });
    const from = (location.state as { from?: string } | null)?.from;
    navigate(
      from?.startsWith("/app/") ||
        from?.startsWith("/bank/") ||
        from?.startsWith("/admin/")
        ? from
        : role === "admin"
          ? "/admin/integrations"
          : role === "client"
            ? "/app/dashboard"
            : "/bank/dashboard",
    );
  }
  return (
    <main className="login-page">
      <section className="login-art">
        <Brand light />
        <div>
          <Eyebrow>ОБЩЕЕ ПРОСТРАНСТВО</Eyebrow>
          <h1>
            На одной
            <br />
            стороне.
            <br />
            <span>
              В одном
              <br />
              контексте.
            </span>
          </h1>
          <p>
            Бизнес и банк.
            <br />
            От первого запроса до следующего шага.
          </p>
        </div>
        <span className="login-art-footer">
          SMART CREDIT CABINET / 2026 <ArrowUpRight size={18} />
        </span>
      </section>
      <section className="login-form">
        <Link to="/" className="back-link">
          <ArrowLeft size={16} /> На главную
        </Link>
        <div className="login-form-content">
          <Eyebrow>ИНТЕРАКТИВНЫЙ ПРОТОТИП</Eyebrow>
          <h2>
            Ваш следующий шаг —<br />
            попробовать.
          </h2>
          <p>
            Выберите роль и исследуйте общий кабинет
            <br />
            бизнеса и банка. Регистрация не нужна.
          </p>
          <div className="login-roles">
            {(["client", "manager"] as Role[]).map((r) => (
              <button
                key={r}
                className={role === r ? "role-card active" : "role-card"}
                onClick={() => setRole(r)}
              >
                {r === "client" ? (
                  <Building2 size={23} />
                ) : (
                  <BriefcaseBusiness size={23} />
                )}
                <span>
                  <strong>
                    {r === "client"
                      ? "Я представляю бизнес"
                      : "Я сотрудник банка"}
                  </strong>
                  <small>
                    {r === "client"
                      ? "Заявки, документы и ответы на запросы"
                      : "Очередь задач, проверка и уточнения"}
                  </small>
                </span>
                <span className="radio-dot" />
              </button>
            ))}
          </div>
          <label className="field-label" htmlFor="demo-role">
            Роль в демо
            <select
              id="demo-role"
              value={role}
              onChange={(e) => setRole(e.target.value as Role)}
            >
              <option value="client">Представитель бизнеса</option>
              <option value="manager">Менеджер банка</option>
              <option value="analyst">Аналитик банка</option>
              <option value="admin">Системный администратор</option>
            </select>
          </label>
          <button className="button button-red full-width" onClick={enter}>
            Открыть демо <ArrowRight size={18} />
          </button>
          {state.user && (
            <p className="form-hint">
              Вы уже вошли как {state.user.name}. Выбор другой роли не удалит
              синтетические данные сессии.
            </p>
          )}
          <div className="demo-disclaimer">
            <ShieldCheck size={20} />
            <p>
              Только демонстрационные данные.
              <br />
              Не загружайте реальные документы. Внешние банковские системы не
              подключены. Вход в реальную систему пока недоступен.
            </p>
          </div>
        </div>
        <span className="login-footnote">
          Хакатон · демонстрационный прототип
        </span>
      </section>
    </main>
  );
}
function Sidebar({ close }: { close?: () => void }) {
  const { state, dispatch } = useDemo();
  const navigate = useNavigate();
  const staff = isStaff(state.user),
    admin = state.user?.role === "admin";
  const unread = visibleNotifications(state).filter((n) => !n.read).length;
  const links = admin
    ? [
        {
          to: "/admin/integrations",
          text: "Интеграции",
          icon: <ShieldCheck size={18} />,
        },
      ]
    : [
        {
          to: staff ? "/bank/dashboard" : "/app/dashboard",
          text: staff ? "Рабочая очередь" : "Обзор",
          icon: <LayoutDashboard size={18} />,
        },
        {
          to: "/app/applications",
          text: "Заявки",
          icon: <BriefcaseBusiness size={18} />,
        },
        {
          to: "/app/notifications",
          text: "Уведомления",
          icon: <Bell size={18} />,
          count: unread,
        },
        {
          to: "/app/settings",
          text: "Настройки",
          icon: <SettingsIcon size={18} />,
        },
      ];
  return (
    <>
      <div className="sidebar-brand">
        <Brand />
        {close && (
          <button
            className="icon-button"
            onClick={close}
            aria-label="Закрыть навигацию"
          >
            <X size={20} />
          </button>
        )}
      </div>
      <div className="org-card">
        <span className="org-icon">
          <Building2 size={19} />
        </span>
        <div>
          <strong>
            {staff || admin ? "Демо-банк" : "Северная мануфактура"}
          </strong>
          <small>
            {staff || admin
              ? "Рабочее пространство банка"
              : "ООО · Демо-организация"}
          </small>
        </div>
      </div>
      <div className="sidebar-section-label">РАБОЧЕЕ ПРОСТРАНСТВО</div>
      <nav className="sidebar-nav" aria-label="Рабочее пространство">
        {links.map((link) => (
          <NavLink key={link.to} to={link.to} onClick={close}>
            {link.icon}
            <span>{link.text}</span>
            {!!link.count && <b>{link.count}</b>}
          </NavLink>
        ))}
      </nav>
      <div className="sidebar-bottom">
        <div className="demo-card">
          <span className="live-dot" />
          <strong>Демонстрационный режим</strong>
          <p>
            Все данные синтетические.
            <br />
            Можно смело исследовать.
          </p>
          <Link to="/login" onClick={close}>
            Сменить роль <ArrowUpRight size={14} />
          </Link>
        </div>
        <button
          className="sidebar-user"
          onClick={() => {
            dispatch({ type: "logout" });
            navigate("/login");
            close?.();
          }}
        >
          <span className="avatar">
            {state.user?.name
              .split(" ")
              .map((n) => n[0])
              .join("")}
          </span>
          <span>
            <strong>{state.user?.name}</strong>
            <small>{state.user ? roleLabel[state.user.role] : ""}</small>
          </span>
          <LogOut size={16} />
        </button>
      </div>
    </>
  );
}
function Shell() {
  const { state } = useDemo();
  const { pathname } = useLocation();
  const [mobile, setMobile] = useState(false);
  const unread = visibleNotifications(state).filter((n) => !n.read).length;
  const section = pathname.includes("/applications")
    ? "Заявки"
    : pathname.includes("/notifications")
      ? "Уведомления"
      : pathname.includes("/settings")
        ? "Настройки"
        : pathname.includes("/integrations")
          ? "Интеграции"
          : isStaff(state.user)
            ? "Рабочая очередь"
            : "Обзор";
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <Sidebar />
      </aside>
      {mobile && (
        <Modal title="Навигация" onClose={() => setMobile(false)}>
          <div className="mobile-sidebar">
            <Sidebar close={() => setMobile(false)} />
          </div>
        </Modal>
      )}
      <div className="app-main">
        <header className="app-topbar">
          <div>
            <button
              className="mobile-menu icon-button"
              aria-label="Открыть навигацию"
              onClick={() => setMobile(true)}
            >
              <Menu size={20} />
            </button>
            <span className="topbar-home">Кабинет</span>
            <span className="breadcrumb-slash">/</span>
            <strong>{section}</strong>
          </div>
          <div>
            <span className="topbar-org">
              {isStaff(state.user) || state.user?.role === "admin"
                ? "Демо-банк"
                : "ООО «Северная мануфактура»"}
            </span>
            <Link
              to="/app/notifications"
              className="icon-button notification-button"
              aria-label={`Уведомления: ${unread} непрочитанных`}
            >
              <Bell size={18} />
              {unread > 0 && <i />}
            </Link>
            <Link
              to="/app/settings"
              className="avatar small-avatar"
              aria-label="Открыть профиль"
            >
              {state.user?.name
                .split(" ")
                .map((n) => n[0])
                .join("")}
            </Link>
          </div>
        </header>
        <div className="demo-bar">
          <span>
            <span className="live-dot" />
            Демо-пространство
          </span>
          <span>Синтетические данные · Внешние сервисы не подключены</span>
          <Link to="/login">
            Сменить роль <ChevronDown size={13} />
          </Link>
        </div>
        <main className="app-content" id="main">
          <Outlet />
        </main>
        <footer className="app-footer">
          <span>Кредитный кабинет / Smart Credit Cabinet</span>
          <span>Хакатон · прототип 2026</span>
        </footer>
      </div>
    </div>
  );
}
function Notifications() {
  const { state, dispatch } = useDemo();
  const [filter, setFilter] = useState(false);
  const notifications = visibleNotifications(state);
  const items = notifications.filter((n) => !filter || !n.read);
  return (
    <>
      <PageHead
        eyebrow="ВСЁ ВАЖНОЕ — РЯДОМ"
        title="Уведомления"
        text="Обновления по вашим заявкам и документам."
      >
        <button
          className="button button-outline small"
          onClick={() => dispatch({ type: "read" })}
        >
          Прочитать все
        </button>
      </PageHead>
      <div className="segmented inline-segment">
        <button
          className={!filter ? "active" : ""}
          onClick={() => setFilter(false)}
        >
          Все ({notifications.length})
        </button>
        <button
          className={filter ? "active" : ""}
          onClick={() => setFilter(true)}
        >
          Непрочитанные ({notifications.filter((n) => !n.read).length})
        </button>
      </div>
      <section className="panel">
        {items.length ? (
          items.map((n) => (
            <Link
              className={`notification-row ${!n.read ? "unread" : ""}`}
              key={n.id}
              to={n.href}
              onClick={() => dispatch({ type: "read", id: n.id })}
            >
              <span className="request-icon">
                <Bell size={19} />
              </span>
              <div>
                <strong>
                  {n.title}
                  {!n.read && <span className="unread-dot" />}
                </strong>
                <p>{n.text}</p>
                <time>{new Date(n.at).toLocaleString("ru-RU")}</time>
              </div>
              <ArrowUpRight size={18} />
            </Link>
          ))
        ) : (
          <Empty
            title="Вы ничего не пропустили"
            text="Новых уведомлений пока нет. Здесь появятся обновления по вашим заявкам."
          />
        )}
      </section>
    </>
  );
}
function Settings() {
  const { state, dispatch } = useDemo();
  const [name, setName] = useState(state.user?.name ?? ""),
    [saved, setSaved] = useState(false),
    [confirm, setConfirm] = useState(false);
  const navigate = useNavigate();
  return (
    <>
      <PageHead
        title="Настройки"
        text="Профиль и информация о вашей организации."
      />
      <div className="settings-grid">
        <section className="panel padded">
          <h2>Личный профиль</h2>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              dispatch({ type: "profile", name });
              setSaved(true);
            }}
          >
            <label className="field-label">
              Имя и фамилия
              <input
                value={name}
                maxLength={80}
                onChange={(e) => {
                  setName(e.target.value);
                  setSaved(false);
                }}
                required
              />
            </label>
            <label className="field-label">
              Роль
              <input
                readOnly
                value={state.user ? roleLabel[state.user.role] : ""}
              />
            </label>
            <button className="button button-dark small" type="submit">
              Сохранить изменения
            </button>
            <span className="success-message" role="status">
              {saved ? "Профиль обновлён в демо-сессии" : ""}
            </span>
          </form>
        </section>
        <section className="panel padded">
          <h2>Организация</h2>
          <div className="organization-detail">
            <Building2 size={28} />
            <h3>
              {state.user?.role === "client"
                ? "ООО «Северная мануфактура»"
                : "Демо-банк"}
            </h3>
            <Badge>Демонстрационная организация</Badge>
            <p>
              Доступ к заявкам ограничен участием в организации. Переключение
              организаций в прототипе недоступно.
            </p>
          </div>
        </section>
      </div>
      <section className="panel padded reset-panel">
        <div>
          <h2>Начать демонстрацию заново</h2>
          <p>
            Выйти и удалить изменения, сообщения и загруженные файлы текущей
            демо-сессии.
          </p>
        </div>
        <button
          className="button button-outline small"
          onClick={() => setConfirm(true)}
        >
          Сбросить демо
        </button>
      </section>
      {confirm && (
        <Modal title="Сбросить демо-сессию?" onClose={() => setConfirm(false)}>
          <p>
            Изменения в синтетических данных будут удалены. Исходный пример
            восстановится.
          </p>
          <div className="form-actions">
            <button
              className="button button-outline"
              onClick={() => setConfirm(false)}
            >
              Отмена
            </button>
            <button
              className="button button-red"
              onClick={() => {
                dispatch({ type: "logout" });
                navigate("/login");
              }}
            >
              Сбросить и выйти
            </button>
          </div>
        </Modal>
      )}
    </>
  );
}
function Integrations() {
  return (
    <>
      <PageHead
        eyebrow="СИСТЕМНОЕ АДМИНИСТРИРОВАНИЕ"
        title="Интеграции"
        text="Архитектурный задел. Коннекторы пока не реализованы."
      />
      <div className="info-banner">
        <ShieldCheck size={20} />
        <p>
          В прототипе нет внешних подключений и проверок файлов. Не вводите
          реальные ключи и не загружайте конфиденциальные данные.
        </p>
      </div>
      <div className="integration-grid">
        {[
          "Банковская АБС",
          "Электронный документооборот",
          "Антивирусная проверка",
        ].map((title) => (
          <section key={title} className="panel padded">
            <Badge>Планируется</Badge>
            <h2>{title}</h2>
            <p>
              Подключение через серверный адаптер Django после согласования
              контракта и прав доступа.
            </p>
            <button className="button button-outline small" disabled>
              Настройка недоступна
            </button>
          </section>
        ))}
      </div>
    </>
  );
}
export function App() {
  return (
    <>
      <a className="skip-link" href="#main">
        К основному содержимому
      </a>
      <ScrollReset />
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route
          element={
            <Protected>
              <Shell />
            </Protected>
          }
        >
          <Route path="/app/dashboard" element={<Dashboard />} />
          <Route path="/app/applications" element={<Applications />} />
          <Route path="/app/applications/new" element={<Wizard />} />
          <Route path="/app/applications/:id/*" element={<Workspace />} />
          <Route path="/app/notifications" element={<Notifications />} />
          <Route path="/app/settings" element={<Settings />} />
          <Route
            path="/bank/dashboard"
            element={
              <Protected staff>
                <Dashboard bank />
              </Protected>
            }
          />
          <Route
            path="/admin/integrations"
            element={
              <Protected admin>
                <Integrations />
              </Protected>
            }
          />
        </Route>
        <Route path="*" element={<AccessDenied missing />} />
      </Routes>
    </>
  );
}
