import Link from "next/link";
import { STATUS_LABEL, type Status } from "@/lib/engine/status";

export type OppRow = {
  id: string;
  name: string;
  city: string;
  status: Status;
  captured_at: string;
  contacted_at: string | null;
  /** Research stopped on a failed step (shown as Paused). */
  paused?: boolean;
};

const day = (iso: string) =>
  new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", timeZone: "America/New_York" }).format(new Date(iso));

function detail(o: OppRow) {
  if (o.contacted_at && o.status !== "captured") return `contacted ${day(o.contacted_at)}`;
  return day(o.captured_at);
}

/** List of opportunities; each row opens the detail. */
export default function OppList({ rows }: { rows: OppRow[] }) {
  return (
    <ul className="dx-list">
      {rows.map((o) => (
        <li key={o.id}>
          <Link className="dx-item dx-item-link" href={`/discover/o/${o.id}`}>
            <span className="dx-thumb" aria-hidden="true">{o.name.trim().charAt(0).toUpperCase()}</span>
            <span className="dx-item-txt">
              <b>{o.name}</b>
              <span>{o.city} · {detail(o)}</span>
            </span>
            <span className={`dx-chip s-${o.paused ? "paused" : o.status}`}>
              {o.status === "researching" && !o.paused && <span className="dx-pulse" aria-hidden="true" />}
              {o.paused ? "Paused" : STATUS_LABEL[o.status] ?? o.status}
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
