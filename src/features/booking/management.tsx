"use client";
import { useEffect, useState } from "react";
import { CalendarDays, Scissors, User, ArrowLeft } from "lucide-react";
import type { BookingView, ApiResult, Slot } from "@/lib/domain";
import {
  formatAppointment,
  formatMoney,
  formatTime,
  todaySP,
} from "@/lib/format";
const labels = {
  confirmed: "Confirmado",
  cancelled: "Cancelado",
  completed: "Concluído",
  no_show: "Não compareceu",
};
export default function Management({ token }: { token: string }) {
  const [b, setB] = useState<BookingView | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(true);
  const [reschedule, setReschedule] = useState(false);
  const [date, setDate] = useState(todaySP());
  const [slots, setSlots] = useState<Slot[]>([]);
  const [selected, setSelected] = useState("");
  const [message, setMessage] = useState("");
  async function perform(
    action: "view" | "cancel" | "reschedule",
    startsAt?: string,
  ) {
    setBusy(true);
    setError("");
    try {
      const r = await fetch("/api/bookings/manage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, action, startsAt }),
      });
      const v: ApiResult<BookingView> = await r.json();
      if (!v.ok) throw Error(v.error.message);
      setB(v.data);
      if (action !== "view") {
        setMessage(
          action === "cancel"
            ? "Sua reserva foi cancelada."
            : "Seu horário foi atualizado.",
        );
        setReschedule(false);
      }
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : "Não foi possível consultar a reserva.",
      );
    } finally {
      setBusy(false);
    }
  }
  useEffect(() => {
    void perform("view"); /* The token is immutable for this page. */
  }, [token]);
  useEffect(() => {
    if (!reschedule || !b) return;
    let active = true;
    setSelected("");
    setSlots([]);
    fetch("/api/bookings/manage", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, action: "slots", date }),
    })
      .then((r) => r.json())
      .then((v: ApiResult<Slot[]>) => {
        if (!active) return;
        if (!v.ok) throw Error(v.error.message);
        setSlots(v.data);
      })
      .catch((e) => {
        if (active) setError(e.message);
      });
    return () => {
      active = false;
    };
  }, [date, reschedule, b]);
  return (
    <main className="management-page">
      <div className="management-card">
        <p className="eyebrow dark">IMPERIAL BARBER · LINK PRIVADO</p>
        <h1>Seu próximo momento.</h1>
        {busy && !b && <p role="status">Consultando sua reserva…</p>}
        {b && (
          <>
            <p>
              <span className={`status-badge status-${b.status}`}>
                {labels[b.status]}
              </span>{" "}
              <small>#{b.code}</small>
            </p>
            <div className="booking-summary">
              <p>
                <Scissors />
                {b.serviceName}
                <strong>{formatMoney(b.priceCents)}</strong>
              </p>
              <p>
                <User />
                {b.professionalName}
              </p>
              <p>
                <CalendarDays />
                {formatAppointment(b.startsAt)}
              </p>
              <p>
                {b.customerName} · {b.durationMinutes} minutos
              </p>
            </div>
            <p className="field-caption">
              Guarde este link. Ele permite gerenciar sua reserva sem senha.
              Alterações estão sujeitas ao prazo informado no agendamento.
            </p>
            {message && (
              <p role="status" className="notice">
                {message}
              </p>
            )}
            {b.status === "confirmed" && !reschedule && (
              <div className="management-actions">
                <button
                  className="button"
                  disabled={busy}
                  onClick={() => setReschedule(true)}
                >
                  Remarcar horário
                </button>
                <button
                  className="button button-muted"
                  disabled={busy}
                  onClick={() => {
                    if (window.confirm("Deseja cancelar sua reserva?"))
                      void perform("cancel");
                  }}
                >
                  Cancelar reserva
                </button>
              </div>
            )}
            {reschedule && (
              <>
                <label className="field">
                  Nova data
                  <input
                    type="date"
                    value={date}
                    min={todaySP()}
                    onChange={(e) => setDate(e.target.value)}
                  />
                </label>
                <p className="field-caption">
                  São Paulo · A duração e o preço originais serão mantidos.
                </p>
                <div className="slots-grid">
                  {slots.map((s) => (
                    <button
                      key={s.startsAt}
                      className={`slot ${selected === s.startsAt ? "selected" : ""}`}
                      onClick={() => setSelected(s.startsAt)}
                    >
                      {formatTime(s.startsAt)}
                    </button>
                  ))}
                  {!slots.length && (
                    <p className="empty-state">
                      Sem horários disponíveis nesta data.
                    </p>
                  )}
                </div>
                <div className="management-actions">
                  <button
                    className="button"
                    disabled={!selected || busy}
                    onClick={() => void perform("reschedule", selected)}
                  >
                    Confirmar remarcação
                  </button>
                  <button
                    className="button button-muted"
                    onClick={() => setReschedule(false)}
                  >
                    Voltar
                  </button>
                </div>
              </>
            )}
          </>
        )}
        <p role="alert" className="form-error">
          {error}
        </p>
        {error && !b && (
          <button className="text-button" onClick={() => void perform("view")}>
            Tentar novamente
          </button>
        )}
        <a className="text-button" href="/">
          <ArrowLeft size={16} />
          Voltar ao site
        </a>
      </div>
    </main>
  );
}
