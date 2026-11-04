"use client";
import { useState, useRef, useEffect, useId } from "react";
import {
  X,
  ArrowRight,
  ArrowLeft,
  Check,
  CalendarDays,
  Scissors,
  User,
  Clock,
  Copy,
  CheckCircle2,
} from "lucide-react";
import type {
  PublicContent,
  Slot,
  BookingReceipt,
  ApiResult,
} from "@/lib/domain";
import {
  formatMoney,
  formatTime,
  formatAppointment,
  todaySP,
} from "@/lib/format";
import { customerSchema } from "@/lib/validation";
async function api<T>(url: string, init?: RequestInit): Promise<T> {
  const r = await fetch(url, init);
  const body: ApiResult<T> = await r.json();
  if (!body.ok) throw new Error(body.error.message);
  return body.data;
}
export function BookingLauncher({
  content,
  serviceId,
  children,
  className = "button",
}: {
  content: PublicContent;
  serviceId?: string;
  children: React.ReactNode;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button className={className} onClick={() => setOpen(true)}>
        {children}
      </button>
      {open && (
        <BookingDialog
          content={content}
          initialServiceId={serviceId}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  );
}
function BookingDialog({
  content: c,
  initialServiceId,
  onClose,
}: {
  content: PublicContent;
  initialServiceId?: string;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const [step, setStep] = useState(0);
  const [serviceId, setServiceId] = useState(
    initialServiceId || c.services[0]?.id || "",
  );
  const [professionalId, setProfessionalId] = useState("");
  const [date, setDate] = useState(todaySP());
  const [slots, setSlots] = useState<Slot[]>([]);
  const [slot, setSlot] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [consent, setConsent] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [receipt, setReceipt] = useState<BookingReceipt | null>(null);
  const [retry, setRetry] = useState(0);
  const [copied, setCopied] = useState(false);
  const service = c.services.find((s) => s.id === serviceId);
  const pros = c.professionals.filter((p) => p.serviceIds.includes(serviceId));
  const ready = c.configured && c.settings.bookingEnabled;
  const pro = c.professionals.find((p) => p.id === professionalId);
  useEffect(() => {
    ref.current?.showModal();
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);
  useEffect(() => {
    if (step !== 2 || !ready || !serviceId) return;
    let active = true;
    setLoading(true);
    setSlots([]);
    api<Slot[]>(
      `/api/slots?serviceId=${serviceId}&professionalId=${professionalId}&date=${date}`,
    )
      .then((v) => {
        if (active) setSlots(v);
      })
      .catch((e) => {
        if (active) setError(e.message);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [step, serviceId, professionalId, date, ready, retry]);
  const distinct = slots.filter(
    (s, i) => slots.findIndex((t) => t.startsAt === s.startsAt) === i,
  );
  function next() {
    setError("");
    if (step === 2) {
      const valid = customerSchema.safeParse({ name, phone, email });
      if (!slot || !valid.success) {
        setError("Escolha um horário e informe seu nome e telefone válidos.");
        return;
      }
    }
    setStep(step + 1);
  }
  async function confirm() {
    if (!service || !slot || !consent || !ready) return;
    setLoading(true);
    setError("");
    try {
      const result = await api<BookingReceipt>("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          serviceId,
          professionalId: professionalId || null,
          startsAt: slot,
          customer: { name, phone, email },
          consent: true,
        }),
      });
      setReceipt(result);
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : "Não foi possível confirmar a reserva.",
      );
      setSlot("");
      setStep(2);
      setRetry((v) => v + 1);
    } finally {
      setLoading(false);
    }
  }
  return (
    <dialog
      ref={ref}
      className="booking-dialog"
      aria-labelledby={titleId}
      onCancel={onClose}
      onClick={(e) => {
        if (e.target === ref.current) onClose();
      }}
    >
      <div className="dialog-content">
        <div className="dialog-header">
          <div>
            <p className="eyebrow dark">IMPERIAL BARBER</p>
            <h2 id={titleId}>
              {receipt ? "Seu momento está reservado." : "Reserve seu horário"}
            </h2>
          </div>
          <button
            className="icon-button"
            onClick={onClose}
            aria-label="Fechar agendamento"
          >
            <X size={22} />
          </button>
        </div>
        {receipt ? (
          <div className="booking-success">
            <CheckCircle2 size={52} />
            <h3>Esperamos por você!</h3>
            <p>
              Reserva <strong>#{receipt.code}</strong>
            </p>
            <div className="booking-summary">
              <p>
                <Scissors size={18} />
                {receipt.serviceName}
              </p>
              <p>
                <User size={18} />
                {receipt.professionalName}
              </p>
              <p>
                <CalendarDays size={18} />
                {formatAppointment(receipt.startsAt)}
              </p>
              <p>
                <Clock size={18} />
                {receipt.durationMinutes} minutos ·{" "}
                {formatMoney(receipt.priceCents)}
              </p>
            </div>
            <p>
              Guarde seu link privado para consultar, remarcar ou cancelar. Ele
              não será enviado automaticamente por mensagem.
            </p>
            <a
              className="button"
              href={`/agendamento/${receipt.managementToken}`}
            >
              Acompanhar minha reserva <ArrowRight size={16} />
            </a>
            <button
              className="text-button"
              onClick={async () => {
                try {
                  await navigator.clipboard.writeText(
                    `${location.origin}/agendamento/${receipt.managementToken}`,
                  );
                  setCopied(true);
                } catch {
                  setError("Abra a reserva e copie o endereço do navegador.");
                }
              }}
            >
              <Copy size={15} />
              {copied ? "Link copiado" : "Copiar link privado"}
            </button>
          </div>
        ) : (
          <>
            <ol className="wizard-steps">
              {["Serviço", "Profissional", "Data e hora", "Confirmar"].map(
                (label, i) => (
                  <li
                    key={label}
                    className={i === step ? "current" : i < step ? "done" : ""}
                  >
                    <span>{i < step ? <Check size={14} /> : i + 1}</span>
                    <small>{label}</small>
                  </li>
                ),
              )}
            </ol>
            {!ready && (
              <p className="notice">
                O agendamento ainda não está disponível. A barbearia está
                preparando sua agenda.
              </p>
            )}
            <div className="wizard-body">
              {step === 0 && (
                <>
                  <h3>Como podemos cuidar de você?</h3>
                  <div className="choice-list">
                    {c.services.map((s) => (
                      <label
                        className={`choice ${s.id === serviceId ? "selected" : ""}`}
                        key={s.id}
                      >
                        <input
                          type="radio"
                          name="service"
                          value={s.id}
                          checked={s.id === serviceId}
                          onChange={() => {
                            setServiceId(s.id);
                            setProfessionalId("");
                            setSlot("");
                          }}
                        />
                        <span>
                          <strong>{s.name}</strong>
                          <small>{s.description}</small>
                        </span>
                        <span className="choice-price">
                          <strong>{formatMoney(s.priceCents)}</strong>
                          <small>{s.durationMinutes} min</small>
                        </span>
                      </label>
                    ))}
                  </div>
                </>
              )}
              {step === 1 && (
                <>
                  <h3>Com quem você quer agendar?</h3>
                  {pros.length > 0 ? (
                    <div className="choice-list">
                      <label
                        className={`choice ${!professionalId ? "selected" : ""}`}
                      >
                        <input
                          type="radio"
                          name="professional"
                          checked={!professionalId}
                          onChange={() => {
                            setProfessionalId("");
                            setSlot("");
                          }}
                        />
                        <span>
                          <strong>Qualquer profissional disponível</strong>
                          <small>Encontre o melhor horário para você.</small>
                        </span>
                      </label>
                      {pros.map((p) => (
                        <label
                          key={p.id}
                          className={`choice ${professionalId === p.id ? "selected" : ""}`}
                        >
                          <input
                            type="radio"
                            name="professional"
                            checked={professionalId === p.id}
                            onChange={() => {
                              setProfessionalId(p.id);
                              setSlot("");
                            }}
                          />
                          {p.imageUrl && (
                            <img
                              src={p.imageUrl}
                              alt=""
                              className="choice-avatar"
                            />
                          )}
                          <span>
                            <strong>{p.name}</strong>
                            <small>{p.specialty}</small>
                          </span>
                        </label>
                      ))}
                    </div>
                  ) : (
                    <p className="empty-state">
                      Os profissionais estarão disponíveis em breve.
                    </p>
                  )}
                </>
              )}
              {step === 2 && (
                <>
                  <h3>Um momento só seu.</h3>
                  <label className="field">
                    Escolha a data{" "}
                    <input
                      type="date"
                      value={date}
                      min={todaySP()}
                      onChange={(e) => {
                        setDate(e.target.value);
                        setSlot("");
                      }}
                    />
                  </label>
                  <p className="field-caption">
                    Horários de Brasília · America/Sao_Paulo
                  </p>
                  {loading ? (
                    <p role="status" className="empty-state">
                      Consultando horários…
                    </p>
                  ) : (
                    <div className="slots-grid">
                      {distinct.map((s) => (
                        <button
                          key={s.startsAt}
                          className={
                            slot === s.startsAt ? "slot selected" : "slot"
                          }
                          onClick={() => setSlot(s.startsAt)}
                        >
                          {formatTime(s.startsAt)}
                        </button>
                      ))}
                      {!distinct.length && (
                        <p className="empty-state">
                          Nenhum horário disponível nesta data. Escolha outro
                          dia.
                        </p>
                      )}
                    </div>
                  )}
                  <div className="customer-fields">
                    <label className="field">
                      Seu nome
                      <input
                        autoComplete="name"
                        maxLength={120}
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Como podemos chamar você?"
                      />
                    </label>
                    <label className="field">
                      Telefone / WhatsApp
                      <input
                        type="tel"
                        autoComplete="tel"
                        maxLength={25}
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="(11) 99999-9999"
                      />
                    </label>
                    <label className="field full-width">
                      Email <span className="optional">(opcional)</span>
                      <input
                        type="email"
                        autoComplete="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="voce@exemplo.com"
                      />
                    </label>
                  </div>
                </>
              )}
              {step === 3 && service && (
                <>
                  <h3>Confira os detalhes.</h3>
                  <div className="booking-summary">
                    <p>
                      <Scissors size={18} />
                      <span>
                        {service.name}
                        <small>{service.durationMinutes} minutos</small>
                      </span>
                      <strong>{formatMoney(service.priceCents)}</strong>
                    </p>
                    <p>
                      <User size={18} />
                      {pro?.name || "Profissional disponível"}
                    </p>
                    <p>
                      <CalendarDays size={18} />
                      {slot && formatAppointment(slot)}
                    </p>
                    <p>
                      <User size={18} />
                      {name} · {phone}
                    </p>
                  </div>
                  <p className="field-caption">
                    Pagamento no estabelecimento. Você pode cancelar ou remarcar
                    até {c.settings.cancelHours} horas antes, pelo link privado
                    da reserva.
                  </p>
                  <label className="consent">
                    <input
                      type="checkbox"
                      checked={consent}
                      onChange={(e) => setConsent(e.target.checked)}
                    />
                    <span>
                      Concordo com o uso dos meus dados para este atendimento e
                      com a{" "}
                      <a
                        href="/privacidade"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        política de privacidade
                      </a>
                      .
                    </span>
                  </label>
                </>
              )}
            </div>
            <div role="alert" className="form-error">
              {error}
            </div>
            <div className="dialog-footer">
              {step > 0 ? (
                <button
                  className="button button-muted"
                  onClick={() => {
                    setStep(step - 1);
                    setError("");
                  }}
                  disabled={loading}
                >
                  <ArrowLeft size={16} />
                  Voltar
                </button>
              ) : (
                <span>Seu estilo começa aqui.</span>
              )}
              {step < 3 ? (
                <button
                  className="button"
                  onClick={next}
                  disabled={
                    !service ||
                    (step === 1 && !pros.length) ||
                    (step === 2 && (!slot || loading))
                  }
                >
                  Próximo <ArrowRight size={16} />
                </button>
              ) : (
                <button
                  className="button"
                  onClick={confirm}
                  disabled={!consent || loading || !ready}
                >
                  {loading ? "Confirmando…" : "Confirmar reserva"}
                  <Check size={17} />
                </button>
              )}
            </div>
          </>
        )}
      </div>
    </dialog>
  );
}
