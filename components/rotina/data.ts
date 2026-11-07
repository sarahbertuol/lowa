/**
 * Data model and rules for the routine panel. Ported 1:1 from
 * reference/rotina/Tracker Diario.dc.html (the handoff's source of truth).
 */

export type Area = "pro" | "pes";
export type Priority = "alta" | "media" | "baixa";
export type Status = "prazo" | "atencao" | "atrasado";

export type Task = {
  id: string;
  title: string;
  project: string; // project name
  area: Area;
  date: string; // YYYY-MM-DD or ""
  time: string; // HH:MM or ""
  priority: Priority;
  done: boolean;
  doneAt?: string;
  kind?: "email" | "milestone";
  owner?: "Cliente" | "LoWa";
};

export type Project = {
  id: string;
  name: string;
  area: Area;
  status: Status;
  next: string;
  nextDate: string;
  defaults?: number;
};

export type Email = {
  id: string;
  threadId: string;
  from: string;
  address: string;
  subject: string;
  urgency: Priority;
  received: string;
  suggestion: string;
  answered: boolean;
  example?: boolean;
};

export type Data = { tasks: Task[]; projects: Project[]; emails: Email[] };

export const STORAGE_KEY = "tracker-rotina-v1";

export const pad = (n: number) => String(n).padStart(2, "0");
export const ymd = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
export const parse = (s: string) => {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, m - 1, d);
};
export const addDays = (s: string, n: number) => {
  const d = parse(s);
  d.setDate(d.getDate() + n);
  return ymd(d);
};
export const uid = () => Math.random().toString(36).slice(2, 10);
const fmt = (s: string, o: Intl.DateTimeFormatOptions) => parse(s).toLocaleDateString("pt-BR", o).replace(/\./g, "");
export const fmtShort = (s: string) => fmt(s, { weekday: "short", day: "numeric", month: "short" });
export const fmtDM = (s: string) => fmt(s, { day: "numeric", month: "short" });

const PRO = ["Oclusal", "Suzano SEO", "VAIRIX", "Topiaris", "Fabiana Campos", "Documentall", "Preto Kayser", "Seatru", "Edu Kayser", "DP6"];
const PES = ["Lorena", "Viagem Florida"];

/** Text colours darkened from the handoff where it failed AA (see rotina.css). */
export const PRI: Record<Priority, { label: string; color: string; text: string }> = {
  alta: { label: "Alta", color: "#C4525C", text: "#A8434C" },
  media: { label: "Média", color: "#D98E99", text: "#706668" },
  baixa: { label: "Baixa", color: "#D6CACC", text: "#776C6F" },
};
export const PRI_ORDER: Record<Priority, number> = { alta: 0, media: 1, baixa: 2 };

export const STATUS: Record<Status, { label: string; color: string; bg: string }> = {
  prazo: { label: "No prazo", color: "#51705A", bg: "#E8F0EA" },
  atencao: { label: "Atenção", color: "#935862", bg: "#F8E7E9" },
  atrasado: { label: "Atrasado", color: "#A03E47", bg: "#F6DEDF" },
};

export const URG: Record<Priority, { label: string; color: string; bg: string; order: number }> = {
  alta: { label: "Urgente", color: "#A03E47", bg: "#F6DEDF", order: 0 },
  media: { label: "Hoje", color: "#935862", bg: "#F8E7E9", order: 1 },
  baixa: { label: "Pode esperar", color: "#706668", bg: "#F3EEED", order: 2 },
};

export const OWNER: Record<string, { color: string; bg: string }> = {
  LoWa: { color: "#A8434C", bg: "#F8E7E9" },
  Cliente: { color: "#6F6366", bg: "#F3EEED" },
};

export const PHRASES = [
  "Um passo de cada vez.",
  "Foco no que importa hoje.",
  "Leveza também é produtividade.",
  "Menos lista, mais presença.",
  "Feito é melhor que perfeito.",
  "O resto pode esperar.",
  "Comece pelo que destrava o dia.",
];

const DEFAULTS_V = 2;
const DEFAULT_TASKS: { title: string; owner: "Cliente" | "LoWa" }[] = [
  { title: "Pagamento entrada", owner: "Cliente" },
  { title: "Pagamento entrega", owner: "Cliente" },
  { title: "Entrega design", owner: "LoWa" },
  { title: "Entrega desenvolvimento", owner: "LoWa" },
  { title: "Entrega conteúdo", owner: "Cliente" },
  { title: "Entrega assets", owner: "Cliente" },
];

/** Every professional project gets the six default milestones (once per DEFAULTS_V). */
export function withDefaults(d: Data): Data {
  let tasks = d.tasks.slice();
  const titles = DEFAULT_TASKS.map((x) => x.title);
  const projects = d.projects.map((p) => {
    if (p.area !== "pro" || p.defaults === DEFAULTS_V) return p;
    const mine = (t: Task) => t.project === p.name && t.area === p.area;
    tasks = tasks.filter((t) => !(mine(t) && t.kind === "milestone" && !t.done && !t.date && !titles.includes(t.title)));
    DEFAULT_TASKS.forEach(({ title, owner }) => {
      const ex = tasks.find((t) => mine(t) && t.title === title);
      if (ex) tasks = tasks.map((t) => (t === ex ? { ...t, owner, kind: "milestone" as const } : t));
      else
        tasks.push({ id: uid(), title, owner, project: p.name, area: p.area, date: "", time: "", priority: "media", done: false, kind: "milestone" });
    });
    return { ...p, defaults: DEFAULTS_V };
  });
  return { ...d, projects, tasks };
}

export function seedEmails(): Email[] {
  const e = (from: string, address: string, subject: string, urgency: Priority, received: string, suggestion: string): Email => ({
    id: uid(), threadId: "", from, address, subject, urgency, received, suggestion, answered: false, example: true,
  });
  return [
    e("Cliente Suzano", "contato@exemplo.com", "Aprovação do relatório de SEO", "alta", "08:12", "Olá! Obrigada pelo retorno. Vou revisar os pontos levantados e envio a versão final até o fim do dia de hoje. Qualquer dúvida, estou à disposição."),
    e("Equipe VAIRIX", "time@exemplo.com", "Ajuste no escopo da sprint", "media", "ontem", "Oi, pessoal! Recebi a proposta de ajuste. Podemos conversar sobre isso no alinhamento de hoje às 14h30? Assim fechamos o escopo juntos."),
    e("Fabiana Campos", "fabiana@exemplo.com", "Dúvida sobre o cronograma", "media", "09:40", "Oi, Fabiana! O cronograma segue como combinado. Te envio amanhã a atualização com as próximas entregas."),
    e("Newsletter Documentall", "news@exemplo.com", "Novidades do mês", "baixa", "seg", "Sem necessidade de resposta. Arquivar."),
  ];
}

export function seed(): Data {
  const t = ymd(new Date());
  const projects: Project[] = [
    ...PRO.map((n) => ({ id: uid(), name: n, area: "pro" as const, status: "prazo" as const, next: "", nextDate: "" })),
    ...PES.map((n) => ({ id: uid(), name: n, area: "pes" as const, status: "prazo" as const, next: "", nextDate: "" })),
  ];
  const mk = (title: string, project: string, area: Area, date: string, time: string, priority: Priority): Task => ({
    id: uid(), title, project, area, date, time, priority, done: false,
  });
  const tasks: Task[] = [
    mk("Revisar cronograma da semana", "Oclusal", "pro", t, "10:00", "alta"),
    mk("Alinhamento com o time", "VAIRIX", "pro", t, "14:30", "media"),
    { ...mk("Responder e-mails pendentes", "", "pro", t, "", "media"), kind: "email" },
    mk("Enviar relatório mensal", "Suzano SEO", "pro", addDays(t, -1), "", "alta"),
    mk("Planejamento da sprint", "DP6", "pro", addDays(t, 1), "09:30", "media"),
    mk("Reservar hotel", "Viagem Florida", "pes", t, "", "media"),
    mk("Checklist de documentos da viagem", "Viagem Florida", "pes", addDays(t, -2), "", "baixa"),
  ];
  return withDefaults({ tasks, projects, emails: seedEmails() });
}

export function loadData(): Data {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const d = raw ? JSON.parse(raw) : null;
    if (d && Array.isArray(d.tasks) && Array.isArray(d.projects)) {
      if (!Array.isArray(d.emails)) d.emails = seedEmails();
      d.tasks = d.tasks.map((t: Task) =>
        !t.kind && /e-?mails?/i.test(t.title) && /respond/i.test(t.title) ? { ...t, kind: "email" } : t,
      );
      return withDefaults(d as Data);
    }
  } catch {
    /* corrupted or blocked storage: start fresh */
  }
  return seed();
}

export function saveData(d: Data) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(d));
  } catch {
    /* storage full or blocked */
  }
}

export const sortTasks = (a: Task, b: Task) =>
  Number(a.done) - Number(b.done) ||
  ((a.time || "99") < (b.time || "99") ? -1 : (a.time || "99") > (b.time || "99") ? 1 : 0) ||
  PRI_ORDER[a.priority] - PRI_ORDER[b.priority];

export const nextText = (p: Project) =>
  p.next
    ? p.next + (p.nextDate ? " · até " + fmtDM(p.nextDate) : "")
    : p.nextDate
      ? "Entrega em " + fmtDM(p.nextDate)
      : "Sem próxima entrega definida";
