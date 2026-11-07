"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type ChangeEvent, type KeyboardEvent, type ReactNode } from "react";
import {
  OWNER, PHRASES, PRI, STATUS, URG,
  addDays, fmtDM, fmtShort, loadData, nextText, parse, saveData, sortTasks, uid, withDefaults, ymd,
  type Area, type Data, type Email, type Priority, type Project, type Status, type Task,
} from "./data";

type ModalKind = "task" | "resched" | "project" | null;
type Form = {
  id?: string; title?: string; project?: string; date?: string; time?: string; priority?: Priority;
  name?: string; status?: Status; next?: string; nextDate?: string; err?: string; wasUndated?: boolean;
  area?: Area; done?: boolean; kind?: Task["kind"]; owner?: Task["owner"];
};

const NAME = "Sarah";
const SUBTABS = [{ key: "geral", label: "Visão geral" }]; // reserved for future subtabs

export default function Tracker({ logoutAction }: { logoutAction: string }) {
  const [data, setDataState] = useState<Data | null>(null);
  const [tab, setTab] = useState<Area>("pro");
  const [modal, setModal] = useState<ModalKind>(null);
  const [form, setForm] = useState<Form>({});
  const [weekOffset, setWeekOffset] = useState(0);
  const [toast, setToast] = useState("");
  const [emailsCollapsed, setEmailsCollapsed] = useState(false);
  const [openEmail, setOpenEmail] = useState<string | null>(null);
  const [projectId, setProjectId] = useState<string | null>(null);
  const [now, setNow] = useState(() => new Date());
  const fileRef = useRef<HTMLInputElement>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  // Load after mount (localStorage + "today" are client-only), then re-render every minute.
  useEffect(() => {
    setDataState(loadData());
    const tick = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(tick);
  }, []);
  useEffect(() => {
    if (data) saveData(data);
  }, [data]);

  const today = ymd(now);

  const setData = useCallback((fn: (d: Data) => Data) => setDataState((d) => (d ? fn(d) : d)), []);
  const updTask = (id: string, patch: Partial<Task>) =>
    setData((d) => ({ ...d, tasks: d.tasks.map((t) => (t.id === id ? { ...t, ...patch } : t)) }));
  const flash = (msg: string) => {
    clearTimeout(toastTimer.current);
    setToast(msg);
    toastTimer.current = setTimeout(() => setToast(""), 2400);
  };
  const close = useCallback(() => {
    setModal(null);
    setForm({});
  }, []);

  useEffect(() => {
    if (!modal) return;
    const onKey = (e: globalThis.KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [modal, close]);

  const setF = (k: keyof Form) => (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const v = e.target.value;
    setForm((f) => ({ ...f, [k]: v, err: "" }));
  };

  /* Tasks */
  const openNew = () => {
    setForm({ title: "", project: "", date: today, time: "", priority: "media" });
    setModal("task");
  };
  const openTask = (t: Task) => {
    setForm({ ...t });
    setModal("task");
  };
  const saveTask = () => {
    const f = form;
    if (!f.title || !f.title.trim()) return setForm({ ...f, err: "Dê um nome para a tarefa." });
    const clean = { title: f.title.trim(), project: f.project || "", date: f.date || "", time: f.time || "", priority: f.priority || "media" };
    if (f.id) updTask(f.id, clean);
    else setData((d) => ({ ...d, tasks: [...d.tasks, { id: uid(), area: tab, done: false, ...clean }] }));
    close();
    if (!f.id) flash("Tarefa adicionada");
  };
  const deleteTask = () => {
    const id = form.id;
    setData((d) => ({ ...d, tasks: d.tasks.filter((t) => t.id !== id) }));
    close();
    flash("Tarefa excluída");
  };
  const toggle = (t: Task) => updTask(t.id, t.done ? { done: false, doneAt: undefined } : { done: true, doneAt: today });
  const openResched = (t: Task) => {
    setForm({ id: t.id, title: t.title, wasUndated: !t.date, date: addDays(today, 1) });
    setModal("resched");
  };
  const resched = (date?: string) => {
    if (!date || !form.id) return;
    updTask(form.id, { date });
    close();
    flash(date === today ? "Mantida para hoje" : "Movida para " + fmtShort(date));
  };

  /* E-mails */
  const toggleEmail = (em: Email) =>
    setData((d) => {
      const emails = d.emails.map((x) => (x.id === em.id ? { ...x, answered: !x.answered } : x));
      const allDone = emails.every((x) => x.answered);
      return {
        ...d,
        emails,
        tasks: d.tasks.map((t) => (t.kind === "email" && t.date <= today ? { ...t, done: allDone, doneAt: allDone ? today : undefined } : t)),
      };
    });
  const copyReply = (em: Email) => {
    if (!navigator.clipboard) return flash("Não foi possível copiar");
    navigator.clipboard.writeText(em.suggestion).then(() => flash("Resposta copiada"), () => flash("Não foi possível copiar"));
  };

  /* Projects */
  const openProject = (p: Project) => {
    setProjectId(p.id);
    window.scrollTo(0, 0);
  };
  const editProject = (p: Project) => {
    setForm({ ...p });
    setModal("project");
  };
  const addProjectTask = (p: Project) => {
    setForm({ title: "", project: p.name, date: today, time: "", priority: "media" });
    setModal("task");
  };
  const newProject = () => {
    setForm({ name: "", status: "prazo", next: "", nextDate: "" });
    setModal("project");
  };
  const saveProject = () => {
    const f = form;
    const name = (f.name || "").trim();
    if (!name) return setForm({ ...f, err: "Dê um nome para o projeto." });
    const clean = { name, status: f.status || "prazo", next: (f.next || "").trim(), nextDate: f.nextDate || "" };
    setData((d) => {
      if (!f.id) return withDefaults({ ...d, projects: [...d.projects, { id: uid(), area: tab, ...clean }] });
      const old = d.projects.find((p) => p.id === f.id);
      return {
        ...d,
        projects: d.projects.map((p) => (p.id === f.id ? { ...p, ...clean } : p)),
        tasks:
          old && old.name !== name
            ? d.tasks.map((t) => (t.project === old.name && t.area === old.area ? { ...t, project: name } : t))
            : d.tasks,
      };
    });
    close();
  };
  const deleteProject = () => {
    const id = form.id;
    setData((d) => ({ ...d, projects: d.projects.filter((p) => p.id !== id) }));
    close();
    setProjectId(null);
    flash("Projeto arquivado");
  };

  /* Backup */
  const exportJson = () => {
    if (!data) return;
    const blob = new Blob([JSON.stringify({ version: 1, exportedAt: new Date().toISOString(), ...data }, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `tracker-${today}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 1500);
    flash("Backup exportado");
  };
  const onFile = (e: ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    const r = new FileReader();
    r.onload = () => {
      try {
        const d = JSON.parse(String(r.result));
        if (!Array.isArray(d.tasks) || !Array.isArray(d.projects)) throw new Error("invalid");
        setDataState({ tasks: d.tasks, projects: d.projects, emails: Array.isArray(d.emails) ? d.emails : [] });
        flash("Dados importados");
      } catch {
        flash("Arquivo inválido");
      }
    };
    r.readAsText(f);
    e.target.value = "";
  };

  const view = useMemo(() => (data ? buildView(data, tab, today, now, weekOffset) : null), [data, tab, today, now, weekOffset]);

  if (!data || !view) return <div className="rt-wrap" aria-busy="true" />;

  const project = projectId ? data.projects.find((p) => p.id === projectId) : undefined;

  /* Rows */
  const prio = (t: Task) => {
    const p = PRI[t.priority] || PRI.media;
    return (
      <span className="rt-prio" style={{ color: t.done ? "#B4A8AB" : p.text }}>
        <span className="rt-dot" style={{ background: p.color }} aria-hidden="true" />
        <span className="rt-sr">Prioridade </span>
        {p.label}
      </span>
    );
  };
  const check = (t: Task, variant = "") => (
    <button
      type="button"
      className={`rt-check ${t.done ? "on" : ""} ${variant}`}
      aria-pressed={t.done}
      aria-label={t.done ? `Desmarcar “${t.title}”` : `Concluir “${t.title}”`}
      onClick={() => toggle(t)}
    >
      <span className="box" aria-hidden="true">{t.done ? "✓" : ""}</span>
    </button>
  );

  const allEmails = view.emails;
  const answeredN = allEmails.filter((e) => e.answered).length;
  const urgentN = allEmails.filter((e) => !e.answered && e.urgency === "alta").length;
  const emailMeta = allEmails.length
    ? `${answeredN} de ${allEmails.length} respondidos` + (urgentN ? ` · ${urgentN} ${urgentN === 1 ? "urgente" : "urgentes"}` : "")
    : "Caixa em dia";

  const todayRow = (t: Task) => {
    const isEmail = t.kind === "email";
    const meta = [t.time, isEmail ? emailMeta : t.project].filter(Boolean).join(" · ");
    const showEmails = isEmail && !emailsCollapsed && allEmails.length > 0;
    return (
      <li key={t.id}>
        <div className="rt-row">
          {check(t)}
          <button type="button" className="rt-main" onClick={() => openTask(t)}>
            <span className="rt-texts">
              <span className={`rt-title ${t.done ? "done" : ""}`}>{t.title}</span>
              {meta && <span className="rt-meta">{meta}</span>}
            </span>
            {prio(t)}
          </button>
          {isEmail && (
            <button
              type="button"
              className="rt-chev"
              aria-expanded={!emailsCollapsed}
              aria-label={emailsCollapsed ? "Mostrar e-mails" : "Recolher e-mails"}
              onClick={() => setEmailsCollapsed((c) => !c)}
            >
              <span aria-hidden="true">{emailsCollapsed ? "▾" : "▴"}</span>
            </button>
          )}
        </div>
        {showEmails && (
          <ul className="rt-emails">
            {allEmails.map((em) => emailCard(em))}
            {allEmails.some((e) => e.example) && (
              <li>
                <p className="rt-hint">E-mails de exemplo. Serão substituídos pelos do Gmail quando a conta for conectada.</p>
              </li>
            )}
          </ul>
        )}
      </li>
    );
  };

  const emailCard = (em: Email) => {
    const u = URG[em.urgency] || URG.media;
    const open = openEmail === em.id;
    const q = em.threadId ? "#inbox/" + em.threadId : "#search/" + encodeURIComponent(`from:${em.address} subject:"${em.subject}"`);
    return (
      <li key={em.id} className={`rt-email ${em.answered ? "answered" : ""}`}>
        <div className="rt-email-top">
          <button
            type="button"
            className={`rt-check sm ${em.answered ? "on" : ""}`}
            aria-pressed={em.answered}
            aria-label={em.answered ? `Desmarcar resposta de ${em.from}` : `Marcar e-mail de ${em.from} como respondido`}
            onClick={() => toggleEmail(em)}
          >
            <span className="box" aria-hidden="true">{em.answered ? "✓" : ""}</span>
          </button>
          <div className="rt-email-texts">
            <div className="rt-email-from">
              <b>{em.from}</b>
              <span>{em.received}</span>
            </div>
            <div className="rt-email-subj">{em.subject}</div>
          </div>
          <span className="rt-chip sm" style={em.answered ? { color: "#776C6F", background: "#F6F1F0" } : { color: u.color, background: u.bg }}>
            {u.label}
          </span>
        </div>
        {!open && !em.answered && (
          <div className="rt-email-body">
            <button type="button" className="rt-link" onClick={() => setOpenEmail(em.id)}>
              Ver sugestão de resposta
            </button>
          </div>
        )}
        {open && (
          <div className="rt-email-body">
            <div className="rt-sugg">
              <span>SUGESTÃO</span>
              <p>{em.suggestion}</p>
            </div>
            <div className="rt-sugg-actions">
              <button type="button" className="rt-pill xs" onClick={() => copyReply(em)}>
                Copiar resposta
              </button>
              <a href={"https://mail.google.com/mail/u/0/" + q} target="_blank" rel="noopener noreferrer">
                Abrir no Gmail ↗<span className="rt-sr"> (abre em nova aba)</span>
              </a>
              <span className="grow" />
              <button type="button" className="rt-ghost" onClick={() => setOpenEmail(null)}>
                Fechar
              </button>
            </div>
          </div>
        )}
      </li>
    );
  };

  const pendRow = (t: Task) => (
    <li key={t.id}>
      <div className="rt-row">
        {check(t, "pend")}
        <button type="button" className="rt-main" onClick={() => openTask(t)}>
          <span className="rt-texts">
            <span className="rt-title">{t.title}</span>
            <span className="rt-meta">{["de " + (t.date ? fmtShort(t.date) : ""), t.project].filter(Boolean).join(" · ")}</span>
          </span>
        </button>
        <button type="button" className="rt-pill" onClick={() => openResched(t)}>
          Reagendar
        </button>
      </div>
    </li>
  );

  const pMeta = (t: Task) =>
    [t.date ? (t.date < today ? "pendente de " + fmtShort(t.date) : t.date === today ? "hoje" : fmtShort(t.date)) : "sem data", t.time, t.owner]
      .filter(Boolean)
      .join(" · ");

  const projRow = (t: Task) => (
    <li key={t.id}>
      <div className="rt-row">
        {check(t)}
        <button type="button" className="rt-main" onClick={() => openTask(t)}>
          <span className="rt-texts">
            <span className="rt-title">{t.title}</span>
            <span className="rt-meta">{pMeta(t)}</span>
          </span>
          {prio(t)}
        </button>
      </div>
    </li>
  );

  /* Header numbers */
  const h = now.getHours();
  const greet = h < 12 ? "Bom dia" : h < 18 ? "Boa tarde" : "Boa noite";
  const doy = Math.floor((now.getTime() - new Date(now.getFullYear(), 0, 0).getTime()) / 864e5);
  const toMon = (8 - parse(today).getDay()) % 7 || 7;

  return (
    <>
      <div className="rt-wrap">
        {!project && (
          <div className="rt-stack">
            <header className="rt-head">
              <div className="rt-head-text">
                <p className="rt-eyebrow" style={{ margin: 0 }}>
                  {now.toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" })}
                </p>
                <h1 className="rt-serif rt-h1">{NAME ? `${greet}, ${NAME}.` : `${greet}.`}</h1>
                <p className="rt-phrase" style={{ margin: 0 }}>{PHRASES[doy % PHRASES.length]}</p>
                <div className="rt-counts">
                  <span>
                    <span className="rt-dot" style={{ background: "#C4525C" }} aria-hidden="true" />
                    {view.openToday} para hoje
                  </span>
                  <span className="sep" aria-hidden="true">·</span>
                  <span className="pend">
                    <span className="rt-dot" style={{ background: "#D98E99" }} aria-hidden="true" />
                    {view.pend.length} {view.pend.length === 1 ? "pendente" : "pendentes"}
                  </span>
                </div>
              </div>
              <button type="button" className="rt-btn-primary" onClick={openNew}>
                <span className="plus" aria-hidden="true">+</span>Nova tarefa
              </button>
            </header>

            <nav className="rt-nav" aria-label="Áreas">
              <div className="rt-tabs" role="tablist">
                {(
                  [
                    ["pro", "Profissional"],
                    ["pes", "Pessoal"],
                  ] as const
                ).map(([k, label]) => (
                  <button
                    key={k}
                    type="button"
                    role="tab"
                    aria-selected={tab === k}
                    className="rt-tab"
                    onClick={() => {
                      setTab(k);
                      setProjectId(null);
                    }}
                  >
                    {label}
                  </button>
                ))}
              </div>
              <div className="rt-subtabs">
                {SUBTABS.map((s, i) => (
                  <span key={s.key} className={`rt-subtab ${i === 0 ? "on" : ""}`} aria-current={i === 0 ? "page" : undefined}>
                    {s.label}
                  </span>
                ))}
              </div>
            </nav>

            <div className="rt-grid">
              <div className="rt-col-main">
                <section className="rt-card" aria-labelledby="rt-hoje">
                  <div className="rt-card-head">
                    <h2 id="rt-hoje" className="rt-serif rt-h2 lg">Hoje</h2>
                    {view.todayAll.length > 0 && (
                      <span className="rt-note">
                        {view.todayAll.length - view.openToday} de {view.todayAll.length} feitas
                      </span>
                    )}
                  </div>
                  {view.todayAll.length > 0 ? (
                    <ul className="rt-list">{view.todayAll.map(todayRow)}</ul>
                  ) : (
                    <p className="rt-empty">Nada agendado para hoje. Aproveite o respiro.</p>
                  )}
                </section>

                {view.pend.length > 0 && (
                  <section className="rt-card pend" aria-labelledby="rt-pend">
                    <div className="rt-card-head" style={{ flexDirection: "column", alignItems: "stretch", gap: 4 }}>
                      <h2 id="rt-pend" className="rt-serif rt-h2">Pendentes</h2>
                      <p className="rt-sub">Ficaram de dias anteriores e já seguem com você hoje. Conclua quando puder ou escolha outro dia.</p>
                    </div>
                    <ul className="rt-list">{view.pend.map(pendRow)}</ul>
                  </section>
                )}
              </div>

              <section className="rt-card rt-col-side" style={{ gap: 8 }} aria-labelledby="rt-proj">
                <div className="rt-card-head flush">
                  <h2 id="rt-proj" className="rt-serif rt-h2">Projetos</h2>
                  <button type="button" className="rt-link" onClick={newProject}>
                    + Projeto
                  </button>
                </div>
                <ul className="rt-projects">
                  {view.projects.map((p) => {
                    const st = STATUS[p.status] || STATUS.prazo;
                    return (
                      <li key={p.id}>
                        <button type="button" className="rt-project" onClick={() => openProject(p)}>
                          <span className="rt-texts">
                            <span className="name">{p.name}</span>
                            <span className="next" style={{ color: p.next || p.nextDate ? "#6F6366" : "#776C6F" }}>{nextText(p)}</span>
                          </span>
                          <span className="rt-chip" style={{ color: st.color, background: st.bg }}>{st.label}</span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </section>
            </div>

            <section className="rt-card" style={{ gap: 18 }} aria-labelledby="rt-semana">
              <div className="rt-week-head">
                <div>
                  <h2 id="rt-semana" className="rt-serif rt-h2">Semana</h2>
                  <span className="rt-note">{view.weekLabel}</span>
                </div>
                <div className="rt-week-nav">
                  <button type="button" className="rt-round" aria-label="Semana anterior" onClick={() => setWeekOffset((w) => w - 1)}>
                    ‹
                  </button>
                  {weekOffset !== 0 && (
                    <button type="button" className="rt-link" onClick={() => setWeekOffset(0)}>
                      Esta semana
                    </button>
                  )}
                  <button type="button" className="rt-round" aria-label="Próxima semana" onClick={() => setWeekOffset((w) => w + 1)}>
                    ›
                  </button>
                </div>
              </div>
              <div className="rt-week-scroll">
                <ul className="rt-week">
                  {view.week.map((d) => (
                    <li key={d.date} className={`rt-day ${d.isToday ? "today" : ""}`}>
                      <div className="rt-day-top">
                        <span className="lbl">{d.label}</span>
                        <span className="rt-serif num">{d.num}</span>
                      </div>
                      <div className="rt-bar" aria-hidden="true">
                        <div style={{ width: "100%", transform: `scaleX(${d.pct / 100})`, background: d.pct === 100 ? "#8FAE98" : "#D98E99" }} />
                      </div>
                      <div className="sum">{d.total ? `${d.done} de ${d.total}` : "Livre"}</div>
                      <div className="rt-day-items">
                        {d.list.slice(0, 4).map((t) => (
                          <button key={t.id} type="button" className={`rt-day-item ${t.done ? "done" : ""}`} onClick={() => openTask(t)}>
                            <span
                              className="rt-dot"
                              aria-hidden="true"
                              style={{ background: t.done ? "#D6CACC" : d.past ? "#D98E99" : (PRI[t.priority] || PRI.media).color }}
                            />
                            <span className="t">{t.title}</span>
                          </button>
                        ))}
                        {d.total > 4 && <div className="more">+{d.total - 4}</div>}
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </section>
          </div>
        )}

        {project && <ProjectScreen
          project={project}
          tasks={data.tasks}
          today={today}
          onBack={() => setProjectId(null)}
          onEdit={() => editProject(project)}
          onAdd={() => addProjectTask(project)}
          row={projRow}
          undatedRow={(t) => (
            <li key={t.id}>
              <div className="rt-row">
                {check(t, "dashed")}
                <button type="button" className="rt-main" onClick={() => openTask(t)}>
                  <span className="rt-undated-texts">
                    <span className="rt-title wrap">{t.title}</span>
                    {t.owner && (
                      <span className="rt-chip xs" style={{ color: OWNER[t.owner]?.color, background: OWNER[t.owner]?.bg }}>
                        {t.owner}
                      </span>
                    )}
                  </span>
                </button>
                <button type="button" className="rt-link" onClick={() => openResched(t)}>
                  Agendar
                </button>
              </div>
            </li>
          )}
          doneRow={(t) => (
            <li key={t.id}>
              <div className="rt-row" style={{ minHeight: 50 }}>
                {check(t)}
                <button type="button" className="rt-main" onClick={() => openTask(t)}>
                  <span className="rt-title done">{t.title}</span>
                </button>
              </div>
            </li>
          )}
        />}

        <footer className="rt-foot">
          <span>Salvo neste navegador. O Google Calendar segue com suas reuniões.</span>
          <div className="rt-foot-actions">
            <button type="button" onClick={exportJson}>Exportar JSON</button>
            <button type="button" onClick={() => fileRef.current?.click()}>Importar JSON</button>
            <input ref={fileRef} type="file" accept="application/json,.json" onChange={onFile} hidden />
            <form method="post" action={logoutAction}>
              <button type="submit">Sair</button>
            </form>
          </div>
        </footer>
      </div>

      {modal && (
        <div className="rt-overlay" onClick={close}>
          <div className="rt-modal" role="dialog" aria-modal="true" aria-labelledby="rt-modal-title" onClick={(e) => e.stopPropagation()}>
            {modal === "task" && (
              <TaskModal
                form={form}
                setF={setF}
                setForm={setForm}
                projects={data.projects.filter((p) => p.area === tab)}
                onSave={saveTask}
                onDelete={deleteTask}
                onCancel={close}
              />
            )}
            {modal === "resched" && (
              <>
                <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                  <h3 id="rt-modal-title" className="rt-serif rt-h3">{form.wasUndated ? "Agendar" : "Reagendar"}</h3>
                  <div className="rt-meta" style={{ fontSize: 14 }}>{form.title}</div>
                </div>
                <div className="rt-quick">
                  {[
                    { label: "Hoje", sub: form.wasUndated ? fmtShort(today) : "manter no dia", date: today },
                    { label: "Amanhã", sub: fmtShort(addDays(today, 1)), date: addDays(today, 1) },
                    { label: "Segunda", sub: fmtShort(addDays(today, toMon)), date: addDays(today, toMon) },
                  ].map((q) => (
                    <button key={q.label} type="button" onClick={() => resched(q.date)}>
                      <b>{q.label}</b>
                      <span>{q.sub}</span>
                    </button>
                  ))}
                </div>
                <div className="rt-custom">
                  <label className="rt-field">
                    OUTRO DIA
                    <input type="date" value={form.date || ""} onChange={setF("date")} />
                  </label>
                  <button type="button" className="rt-btn-primary sm" onClick={() => resched(form.date)}>
                    Mover
                  </button>
                </div>
              </>
            )}
            {modal === "project" && (
              <ProjectModal form={form} setF={setF} setForm={setForm} onSave={saveProject} onDelete={deleteProject} onCancel={close} />
            )}
          </div>
        </div>
      )}

      {toast && (
        <div className="rt-toast" role="status" aria-live="polite">
          {toast}
        </div>
      )}
    </>
  );
}

/* ---------- derived view ---------- */

function buildView(data: Data, tab: Area, today: string, now: Date, weekOffset: number) {
  const tasks = data.tasks.filter((t) => t.area === tab);
  const projects = data.projects.filter((p) => p.area === tab);
  const emails = data.emails
    .slice()
    .sort((a, b) => Number(a.answered) - Number(b.answered) || (URG[a.urgency] || URG.media).order - (URG[b.urgency] || URG.media).order);
  const todayAll = tasks.filter((t) => t.date === today).sort(sortTasks);
  // Overdue is derived, the task keeps its original date.
  const pend = tasks.filter((t) => t.date && t.date < today && !t.done).sort((a, b) => (a.date < b.date ? -1 : 1));
  const openToday = todayAll.filter((t) => !t.done).length;

  const dow = (now.getDay() + 6) % 7;
  const mon = addDays(today, -dow + weekOffset * 7);
  const labels = ["seg", "ter", "qua", "qui", "sex", "sáb", "dom"];
  const week = labels.map((label, i) => {
    const date = addDays(mon, i);
    const list = tasks.filter((t) => t.date === date).sort(sortTasks);
    const done = list.filter((t) => t.done).length;
    const total = list.length;
    return {
      label, date, list, done, total,
      num: parse(date).getDate(),
      pct: total ? Math.round((done / total) * 100) : 0,
      isToday: date === today,
      past: date < today,
    };
  });

  return { tasks, projects, emails, todayAll, pend, openToday, week, weekLabel: `${fmtDM(mon)} – ${fmtDM(addDays(mon, 6))}` };
}

/* ---------- project screen ---------- */

function ProjectScreen(props: {
  project: Project;
  tasks: Task[];
  today: string;
  onBack: () => void;
  onEdit: () => void;
  onAdd: () => void;
  row: (t: Task) => ReactNode;
  undatedRow: (t: Task) => ReactNode;
  doneRow: (t: Task) => ReactNode;
}) {
  const { project: pr, today } = props;
  const pt = props.tasks.filter((t) => t.project === pr.name && t.area === pr.area);
  const dn = pt.filter((t) => t.done).length;
  const pct = pt.length ? Math.round((dn / pt.length) * 100) : 0;
  const st = STATUS[pr.status] || STATUS.prazo;
  const byDate = (a: Task, b: Task) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0) || sortTasks(a, b);
  const pToday = pt.filter((t) => !t.done && t.date && t.date <= today).sort(byDate);
  const pNext = pt.filter((t) => !t.done && t.date > today).sort(byDate);
  const pUndated = pt.filter((t) => !t.done && !t.date);
  const pDone = pt.filter((t) => t.done);

  return (
    <div className="rt-stack" style={{ gap: 24 }}>
      <button type="button" className="rt-back" onClick={props.onBack}>
        <span aria-hidden="true">←</span> Visão geral
      </button>
      <header className="rt-head">
        <div className="rt-head-text" style={{ gap: 8 }}>
          <p className="rt-eyebrow" style={{ margin: 0 }}>{pr.area === "pro" ? "Projeto · Profissional" : "Projeto · Pessoal"}</p>
          <h1 className="rt-serif rt-h1">{pr.name}</h1>
          <div className="rt-proj-meta">
            <span className="rt-chip" style={{ color: st.color, background: st.bg }}>{st.label}</span>
            <span className="next">{nextText(pr)}</span>
            <button type="button" className="rt-link" onClick={props.onEdit}>
              Editar projeto
            </button>
          </div>
        </div>
        <button type="button" className="rt-btn-primary" onClick={props.onAdd}>
          <span className="plus" aria-hidden="true">+</span>Nova tarefa
        </button>
      </header>

      <section className="rt-card" style={{ gap: 14 }} aria-label="Progresso">
        <div className="rt-progress-top">
          <span className="rt-serif pct">{pct}%</span>
          <span className="txt">{pt.length ? `${dn} de ${pt.length} tarefas concluídas` : "Nenhuma tarefa ainda"}</span>
        </div>
        <div
          className="rt-bar lg"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={pct}
          aria-label="Progresso do projeto"
        >
          <div style={{ width: "100%", transform: `scaleX(${pct / 100})`, background: pct === 100 ? "#8FAE98" : "#D98E99" }} />
        </div>
      </section>

      <div className="rt-two">
        <section className="rt-card" aria-labelledby="rt-ph">
          <h2 id="rt-ph" className="rt-serif rt-h2" style={{ margin: "0 10px 6px" }}>Para hoje</h2>
          {pToday.length > 0 ? <ul className="rt-list">{pToday.map(props.row)}</ul> : <p className="rt-empty sm">Nada deste projeto para hoje.</p>}
        </section>

        <section className="rt-card" aria-labelledby="rt-pa">
          <h2 id="rt-pa" className="rt-serif rt-h2" style={{ margin: "0 10px 6px" }}>Agendado</h2>
          {pNext.length > 0 && <ul className="rt-list">{pNext.map(props.row)}</ul>}
          {pUndated.length > 0 && (
            <div style={{ marginTop: 6 }}>
              <h3 className="rt-label">Pendentes · sem data</h3>
              <ul className="rt-list">{pUndated.map(props.undatedRow)}</ul>
            </div>
          )}
          {!pNext.length && !pUndated.length && <p className="rt-empty sm">Nenhuma tarefa futura.</p>}
        </section>
      </div>

      {pDone.length > 0 && (
        <section className="rt-card" style={{ gap: 4 }} aria-labelledby="rt-pd">
          <h2 id="rt-pd" className="rt-label" style={{ padding: "0 10px 6px" }}>Concluídas · {pDone.length}</h2>
          <ul className="rt-list">{pDone.map(props.doneRow)}</ul>
        </section>
      )}
    </div>
  );
}

/* ---------- modals ---------- */

type SetF = (k: keyof Form) => (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;

function TaskModal(props: {
  form: Form;
  setF: SetF;
  setForm: (fn: (f: Form) => Form) => void;
  projects: Project[];
  onSave: () => void;
  onDelete: () => void;
  onCancel: () => void;
}) {
  const { form, setF } = props;
  const onEnter = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") props.onSave();
  };
  const current = form.priority || "media";
  // Keep the task's project selectable even if it was archived.
  const names = props.projects.map((p) => p.name);
  const options = form.project && !names.includes(form.project) ? [...names, form.project] : names;
  return (
    <>
      <h3 id="rt-modal-title" className="rt-serif rt-h3">{form.id ? "Editar tarefa" : "Nova tarefa"}</h3>
      <label className="rt-field">
        TAREFA
        <input
          value={form.title || ""}
          onChange={setF("title")}
          onKeyDown={onEnter}
          placeholder="O que precisa ser feito?"
          autoFocus
          aria-invalid={form.err ? true : undefined}
          aria-describedby={form.err ? "rt-task-err" : undefined}
        />
      </label>
      {form.err && <p id="rt-task-err" className="rt-err" role="alert">{form.err}</p>}
      <label className="rt-field">
        PROJETO / CLIENTE
        <select value={form.project || ""} onChange={setF("project")}>
          <option value="">Sem projeto</option>
          {options.map((n) => (
            <option key={n} value={n}>{n}</option>
          ))}
        </select>
      </label>
      <div className="rt-row-fields">
        <label className="rt-field">
          DIA
          <input type="date" value={form.date || ""} onChange={setF("date")} />
        </label>
        <label className="rt-field">
          HORÁRIO (OPCIONAL)
          <input type="time" value={form.time || ""} onChange={setF("time")} />
        </label>
      </div>
      <fieldset className="rt-group">
        <legend>PRIORIDADE</legend>
        <div className="rt-opts">
          {(Object.keys(PRI) as Priority[]).map((k) => (
            <button key={k} type="button" className="rt-opt" aria-pressed={current === k} onClick={() => props.setForm((f) => ({ ...f, priority: k }))}>
              <span className="rt-dot" style={{ background: PRI[k].color }} aria-hidden="true" />
              {PRI[k].label}
            </button>
          ))}
        </div>
      </fieldset>
      <div className="rt-modal-actions">
        {form.id && (
          <button type="button" className="rt-ghost danger" onClick={props.onDelete}>
            Excluir
          </button>
        )}
        <span className="grow" />
        <button type="button" className="rt-ghost" onClick={props.onCancel}>
          Cancelar
        </button>
        <button type="button" className="rt-btn-primary sm" onClick={props.onSave}>
          Salvar
        </button>
      </div>
    </>
  );
}

function ProjectModal(props: {
  form: Form;
  setF: SetF;
  setForm: (fn: (f: Form) => Form) => void;
  onSave: () => void;
  onDelete: () => void;
  onCancel: () => void;
}) {
  const { form, setF } = props;
  const current = form.status || "prazo";
  return (
    <>
      <h3 id="rt-modal-title" className="rt-serif rt-h3">{form.id ? "Projeto" : "Novo projeto"}</h3>
      <label className="rt-field">
        NOME
        <input
          value={form.name || ""}
          onChange={setF("name")}
          placeholder="Nome do projeto"
          autoFocus
          aria-invalid={form.err ? true : undefined}
          aria-describedby={form.err ? "rt-proj-err" : undefined}
        />
      </label>
      {form.err && <p id="rt-proj-err" className="rt-err" role="alert">{form.err}</p>}
      <fieldset className="rt-group">
        <legend>STATUS</legend>
        <div className="rt-opts">
          {(Object.keys(STATUS) as Status[]).map((k) => {
            const on = current === k;
            const st = STATUS[k];
            return (
              <button
                key={k}
                type="button"
                className="rt-opt"
                aria-pressed={on}
                style={{ fontSize: 13.5, color: on ? st.color : "#706668", background: on ? st.bg : "#fff", borderColor: on ? st.bg : undefined }}
                onClick={() => props.setForm((f) => ({ ...f, status: k }))}
              >
                {st.label}
              </button>
            );
          })}
        </div>
      </fieldset>
      <label className="rt-field">
        PRÓXIMA ENTREGA
        <input value={form.next || ""} onChange={setF("next")} placeholder="Ex.: apresentação do layout" />
      </label>
      <label className="rt-field">
        DATA DA ENTREGA
        <input type="date" value={form.nextDate || ""} onChange={setF("nextDate")} />
      </label>
      <div className="rt-modal-actions">
        {form.id && (
          <button type="button" className="rt-ghost danger" onClick={props.onDelete}>
            Arquivar
          </button>
        )}
        <span className="grow" />
        <button type="button" className="rt-ghost" onClick={props.onCancel}>
          Cancelar
        </button>
        <button type="button" className="rt-btn-primary sm" onClick={props.onSave}>
          Salvar
        </button>
      </div>
    </>
  );
}
