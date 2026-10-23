import { useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  ArrowUpRight,
  Check,
  CheckCheck,
  FileText,
  MessageSquare,
  CornerDownRight,
  Plus,
  Menu,
  X,
  ShieldCheck,
  Layers,
  History,
  Plug,
  MoveUpRight,
} from "lucide-react";
import { Brand, Eyebrow } from "./ui";

function FlowVisual() {
  return (
    <div
      className="flow-visual"
      aria-label="Иллюстрация: заявка объединяет документы, обсуждение и результат проверки"
      role="img"
    >
      <div className="flow-grid" />
      <div className="flow-orbit orbit-one" />
      <div className="flow-orbit orbit-two" />
      <svg
        className="flow-lines"
        viewBox="0 0 620 520"
        fill="none"
        aria-hidden="true"
      >
        <path
          d="M111 140H260V230M477 130H355V230M310 305V397H470M259 285H140V385"
          stroke="#57605e"
          strokeWidth="1"
        />
        <path
          className="flow-pulse"
          d="M111 140H260V230M310 305V397H470"
          stroke="#d25c55"
          strokeWidth="1.5"
        />
        <circle cx="260" cy="230" r="4" fill="#e9e7e0" />
        <circle cx="310" cy="305" r="4" fill="#e9e7e0" />
      </svg>
      <div className="flow-node flow-doc">
        <span className="node-index">01 / ДОКУМЕНТЫ</span>
        <div className="node-line">
          <span className="node-icon">
            <FileText size={18} />
          </span>
          <strong>Всё на своих местах</strong>
        </div>
        <div className="node-document">
          <span />
          <span />
          <span />
          <i>
            <Check size={11} />
          </i>
        </div>
        <span className="node-meta">
          Отчётность · версия 02 <b>Принята</b>
        </span>
      </div>
      <div className="flow-node flow-message">
        <span className="node-index">02 / КОНТЕКСТ</span>
        <div className="node-line">
          <span className="avatar tiny">МВ</span>
          <strong>Мария, менеджер</strong>
        </div>
        <p>
          Подпись добавлена.
          <br />
          Замечания сняты.
        </p>
        <span className="node-meta">
          <MessageSquare size={12} /> Обсуждение к документу
        </span>
      </div>
      <div className="flow-main">
        <div className="flow-main-top">
          <span className="brand-symbol" aria-hidden="true">
            <i />
            <i />
            <i />
          </span>
          <ArrowUpRight size={20} />
        </div>
        <span className="node-index">КК–2026–0842</span>
        <h3>
          Ваша заявка.
          <br />
          Общий контекст.
        </h3>
        <div className="flow-main-bottom">
          <span className="live-dot" /> На рассмотрении <span>↗</span>
        </div>
      </div>
      <div className="flow-node flow-result">
        <span className="result-check">
          <CheckCheck size={22} />
        </span>
        <div>
          <span className="node-index">03 / СЛЕДУЮЩИЙ ШАГ</span>
          <strong>Продолжить рассмотрение</strong>
        </div>
      </div>
      <span className="flow-caption">
        <span /> СВЯЗАНО КОНТЕКСТОМ, А НЕ ПЕРЕПИСКОЙ
      </span>
      <span className="flow-cross cross-one">+</span>
      <span className="flow-cross cross-two">+</span>
    </div>
  );
}

export function ProductPreview({ staff = false }: { staff?: boolean }) {
  return (
    <div className="product-preview">
      <div className="preview-chrome">
        <span className="window-dots">
          <i />
          <i />
          <i />
        </span>
        <span>Кредитный кабинет / Заявка КК–2026–0842</span>
        <span className="preview-illustration">Иллюстрация интерфейса</span>
      </div>
      <div className="preview-body">
        <aside className="preview-side">
          <Brand compact />
          <div className="preview-side-items">
            <span>
              ▦ <b>Обзор</b>
            </span>
            <span className="selected">
              ▤ <b>Заявки</b>
            </span>
            <span>
              ♧ <b>Уведомления</b>
            </span>
          </div>
          <span className="preview-side-bottom">
            СЕВЕРНАЯ
            <br />
            МАНУФАКТУРА ↗
          </span>
        </aside>
        <div className="preview-content">
          <div className="preview-breadcrumb">
            Заявки <span>/</span> КК–2026–0842{" "}
            <span className="preview-user">
              ● {staff ? "Мария Волкова · Банк" : "Анна Смирнова · Клиент"}
            </span>
          </div>
          <div className="preview-title">
            <div>
              <small>ОБОРОТНЫЙ КРЕДИТ</small>
              <h3>Заявка КК–2026–0842</h3>
              <p>ООО «Северная мануфактура» · 15 000 000 ₽ · 24 месяца</p>
            </div>
            <span className="badge badge-warning">
              <i />
              Сбор документов
            </span>
          </div>
          <div className="preview-tabs">
            <span>Обзор</span>
            <span className="selected">
              Запросы <b>2</b>
            </span>
            <span>Документы</span>
            <span>Переписка</span>
            <span>История</span>
          </div>
          <div className="preview-work">
            <div className="preview-request">
              <div className="preview-card-label">
                <span>ЗАПРОС БАНКА</span>
                <span>01 / 02</span>
              </div>
              <h4>
                Уточнить обороты
                <br />
                по счетам
              </h4>
              <p>
                Добавьте помесячную разбивку
                <br />
                за последние 6 месяцев.
              </p>
              <div className="preview-deadline">
                <span className="mini-calendar">24</span>
                <div>
                  <small>Срок ответа</small>
                  <strong>До указанного срока</strong>
                </div>
              </div>
              <Link to="/login" className="preview-upload">
                {staff ? "Проверить документ" : "Загрузить новую версию"}
                <ArrowUpRight size={15} />
              </Link>
            </div>
            <div className="preview-thread">
              <div className="preview-card-label">
                <span>ОБСУЖДЕНИЕ ДОКУМЕНТА</span>
                <MessageSquare size={14} />
              </div>
              <div className="preview-chat">
                <span className="avatar">МВ</span>
                <div>
                  <strong>
                    Мария Волкова <small>Менеджер банка</small>
                  </strong>
                  <p>Добавьте подпись на последней странице отчётности.</p>
                </div>
              </div>
              <div className="preview-file">
                <FileText size={23} />
                <div>
                  <strong>Бухгалтерская отчётность.pdf</strong>
                  <small>
                    Версия 1 <span>→</span> Версия 2
                  </small>
                </div>
                <span className="badge badge-success">
                  <Check size={12} />
                  Принят
                </span>
              </div>
              <div className="preview-chat">
                <span className="avatar client">АС</span>
                <div>
                  <strong>
                    Анна Смирнова <small>Клиент</small>
                  </strong>
                  <p>Обновлённый документ загружен. Спасибо!</p>
                </div>
              </div>
              <div className="preview-resolved">
                <CheckCheck size={15} />
                Замечание снято · версия 2 принята
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function Landing() {
  const [menu, setMenu] = useState(false);
  const [staff, setStaff] = useState(false);
  return (
    <div className="landing">
      <header className="landing-header">
        <div className="landing-nav">
          <Brand light />
          <nav className={menu ? "open" : ""} aria-label="Основная навигация">
            <a href="#capabilities" onClick={() => setMenu(false)}>
              Возможности
            </a>
            <a href="#workflow" onClick={() => setMenu(false)}>
              Как это работает
            </a>
            <a href="#business" onClick={() => setMenu(false)}>
              Для бизнеса
            </a>
            <a href="#bank" onClick={() => setMenu(false)}>
              Для банка
            </a>
          </nav>
          <div className="landing-nav-actions">
            <Link to="/login" className="nav-login">
              Войти <ArrowUpRight size={14} />
            </Link>
            <Link to="/login" className="button button-white small">
              Открыть демо <ArrowUpRight size={15} />
            </Link>
            <button
              className="mobile-menu icon-button"
              aria-expanded={menu}
              aria-label={menu ? "Закрыть меню" : "Открыть меню"}
              onClick={() => setMenu(!menu)}
            >
              {menu ? <X /> : <Menu />}
            </button>
          </div>
        </div>
      </header>
      <main id="main">
        <section className="hero">
          <div className="hero-topline">
            <span>
              <i /> БИЗНЕС И БАНК. НА ОДНОЙ СТОРОНЕ.
            </span>
            <span>
              SMART CREDIT CABINET <span className="hero-edition">/ 2026</span>
            </span>
          </div>
          <div className="hero-main">
            <div className="hero-copy">
              <div className="prototype-label">
                <span />
                ПРОТОТИП ДЛЯ ХАКАТОНА
              </div>
              <h1>
                Кредитная
                <br />
                заявка.
                <br />
                <span>
                  Один общий
                  <br />
                  контекст.
                </span>
              </h1>
              <p>
                Документы, запросы и переписка с банком —
                <br className="desktop-break" /> в одном пространстве, где
                всегда понятен
                <br className="desktop-break" /> следующий шаг.
              </p>
              <Link to="/login" className="button button-red hero-cta">
                Открыть демо <ArrowUpRight size={19} />
              </Link>
              <span className="hero-cta-note">
                Без регистрации. На демонстрационных данных.
              </span>
            </div>
            <FlowVisual />
          </div>
          <div className="hero-bottom">
            <a href="#problem">
              <span className="scroll-arrow">↓</span> МЕНЬШЕ ШУМА. БОЛЬШЕ
              ЯСНОСТИ.
            </a>
            <span>01 — ОБЩЕЕ ПРОСТРАНСТВО</span>
          </div>
        </section>
        <section className="problem-section section-wrap" id="problem">
          <div className="section-heading">
            <Eyebrow>
              <span className="section-number">01 /</span> ПРОБЛЕМА НЕ В
              ДОКУМЕНТАХ
            </Eyebrow>
            <h2>
              Контекст теряется.
              <br />
              <span>Заявка останавливается.</span>
            </h2>
          </div>
          <div className="problem-grid">
            {[
              [
                "01",
                "Запросы теряются",
                "в переписке",
                "Важное уточнение остаётся среди писем, чатов и пересланных файлов.",
              ],
              [
                "02",
                "Версии документов",
                "сложно сопоставить",
                "Непонятно, какой файл актуален и к какой версии относится замечание.",
              ],
              [
                "03",
                "Следующий шаг",
                "неочевиден",
                "Кто отвечает? Что подготовить? К какому сроку? Ответы не должны теряться.",
              ],
            ].map(([n, line1, line2, text]) => (
              <div className="problem-item" key={n}>
                <span className="problem-number">{n}</span>
                <h3>
                  {line1}
                  <br />
                  {line2}
                  <ArrowUpRight size={20} />
                </h3>
                <p>{text}</p>
              </div>
            ))}
          </div>
          <div className="section-caption">
            <CornerDownRight size={20} />
            <p>
              Не ещё один канал связи.
              <br />
              <strong>Одно рабочее пространство вокруг заявки.</strong>
            </p>
          </div>
          <ProductPreview />
          <div className="preview-footnote">
            <span>ЗАПРОС → ДОКУМЕНТ → ОБСУЖДЕНИЕ → СЛЕДУЮЩИЙ ШАГ</span>
            <span>Синтетические данные · иллюстрация</span>
          </div>
        </section>
        <section className="workflow-section" id="workflow">
          <div className="section-wrap">
            <div className="section-heading split">
              <div>
                <Eyebrow>
                  <span className="section-number">02 /</span> КАК ЭТО РАБОТАЕТ
                </Eyebrow>
                <h2>
                  От заявки —<br />к понятному действию.
                </h2>
              </div>
              <p>
                У каждого шага есть контекст.
                <br />У каждого запроса — ответственный.
                <br />У вас — полная картина.
              </p>
            </div>
            <div className="workflow-grid">
              {[
                [
                  "01",
                  "Создайте заявку",
                  "Организация, продукт и параметры кредита. Только то, что нужно для старта.",
                  <Plus size={26} />,
                ],
                [
                  "02",
                  "Получите понятный список требований",
                  "Что подготовить, в каком формате и к какому сроку — в одном списке.",
                  <FileText size={26} />,
                ],
                [
                  "03",
                  "Загрузите документы и обсудите замечания",
                  "Новая версия не стирает предыдущую. Обсуждение остаётся рядом.",
                  <MessageSquare size={26} />,
                ],
                [
                  "04",
                  "Отслеживайте результат и следующие действия",
                  "Статусы проверки и история изменений — без поиска по переписке.",
                  <CheckCheck size={26} />,
                ],
              ].map(([n, title, text, icon], index) => (
                <div className="workflow-step" key={String(n)}>
                  <div className="step-top">
                    <span>{n}</span>
                    {index < 3 ? <ArrowRight size={18} /> : <Check size={18} />}
                  </div>
                  <div className="step-icon">{icon}</div>
                  <h3>{title}</h3>
                  <p>{text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
        <section className="demo-section section-wrap" id="business">
          <div className="section-heading split">
            <div>
              <Eyebrow>
                <span className="section-number">03 /</span> ДВЕ СТОРОНЫ. ОДНА
                ЗАЯВКА.
              </Eyebrow>
              <h2>
                Общий язык
                <br />
                <span>бизнеса и банка.</span>
              </h2>
            </div>
            <div className="demo-description">
              <p>
                {staff
                  ? "Банк видит, какие материалы готовы к проверке, а какие требуют уточнений."
                  : "Бизнес видит, что именно нужно сделать, и получает ответ в контексте документа."}
              </p>
              <div className="segmented" aria-label="Вид иллюстрации">
                <button
                  className={!staff ? "active" : ""}
                  aria-pressed={!staff}
                  onClick={() => setStaff(false)}
                >
                  Для бизнеса
                </button>
                <button
                  className={staff ? "active" : ""}
                  aria-pressed={staff}
                  onClick={() => setStaff(true)}
                >
                  Для банка
                </button>
              </div>
            </div>
          </div>
          <ProductPreview staff={staff} />
          <div className="demo-footer">
            <p>
              <span className="live-dot" />
              Посмотрите, как это работает, на реальной последовательности
              действий.
            </p>
            <Link to="/login" className="text-link">
              Перейти в интерактивное демо <ArrowUpRight size={18} />
            </Link>
          </div>
        </section>
        <section className="capabilities-section" id="capabilities">
          <div className="section-wrap">
            <div className="section-heading split">
              <div>
                <Eyebrow>
                  <span className="section-number">04 /</span> СВЯЗАНО ПО СМЫСЛУ
                </Eyebrow>
                <h2>
                  Всё необходимое.
                  <br />
                  <span>Ничего лишнего.</span>
                </h2>
              </div>
              <p>
                Кабинет помогает общаться
                <br />и проверять документы.
                <br />
                Кредитные решения остаются за банком.
              </p>
            </div>
            <div className="capability-grid">
              {[
                [
                  <MessageSquare />,
                  "Контекстные запросы",
                  "Вопрос, документ, срок и обсуждение связаны. Не нужно восстанавливать цепочку событий.",
                ],
                [
                  <Layers />,
                  "Версии документов",
                  "Каждая версия хранит свои замечания и результат проверки. Актуальная версия всегда видна.",
                ],
                [
                  <History />,
                  "Общая история",
                  "Загрузка, комментарий, проверка — действия складываются в прозрачную историю заявки.",
                ],
                [
                  <Plug />,
                  "Открыто для интеграций",
                  "Существующие системы могут подключаться через серверные интеграции.",
                ],
              ].map(([icon, title, text]) => (
                <article key={String(title)} className="capability">
                  <div className="capability-icon">
                    {icon}
                    <ArrowUpRight size={16} />
                  </div>
                  <h3>{title}</h3>
                  <p>{text}</p>
                </article>
              ))}
            </div>
            <div className="connectors" id="bank">
              <div>
                <ShieldCheck size={20} />
                <span>СЕРВЕРНЫЕ ИНТЕГРАЦИИ</span>
              </div>
              <span>
                Банковская АБС <small>Планируется</small>
              </span>
              <span>
                Электронный документооборот <small>Планируется</small>
              </span>
              <span>
                Проверка файлов <small>Планируется</small>
              </span>
            </div>
            <p className="connector-note">
              В прототипе внешние сервисы не подключены. Данные и сценарии —
              демонстрационные.
            </p>
          </div>
        </section>
        <section className="closing-section section-wrap">
          <Eyebrow>
            <span className="section-number">05 /</span> НАЧНИТЕ С ЯСНОСТИ
          </Eyebrow>
          <div className="closing-content">
            <h2>
              Меньше уточнений.
              <br />
              <span>
                Понятнее движение
                <br />
                заявки.
              </span>
            </h2>
            <Link
              to="/login"
              className="closing-arrow"
              aria-label="Попробовать демо"
            >
              <MoveUpRight />
            </Link>
          </div>
          <div className="closing-bottom">
            <p>Один кабинет. Общий контекст. Следующий шаг.</p>
            <Link to="/login" className="button button-dark">
              Попробовать демо <ArrowUpRight size={18} />
            </Link>
          </div>
        </section>
      </main>
      <footer className="landing-footer">
        <div>
          <Brand light />
          <span>
            Smart Credit Cabinet
            <br />
            <small>Хакатон · демонстрационный прототип</small>
          </span>
        </div>
        <div>
          <a href="#capabilities">
            Возможности <ArrowUpRight size={13} />
          </a>
          <Link to="/login">
            Открыть демо <ArrowUpRight size={13} />
          </Link>
          <span className="footer-year">© 2026</span>
        </div>
      </footer>
    </div>
  );
}
