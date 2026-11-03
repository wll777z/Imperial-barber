"use client";
import { useState, useEffect } from "react";
import { Plus, Trash2 } from "lucide-react";
import type { SiteSettings } from "@/lib/domain";
import { useAdmin, Feedback, ImageField, SaveButton } from "./ui";
import { adminRequest } from "./client";
export default function ContentEditor({
  settingsOnly,
}: {
  settingsOnly: boolean;
}) {
  const { data, error, loading } = useAdmin<SiteSettings>("settings");
  const [form, setForm] = useState<SiteSettings | null>(null);
  const [busy, setBusy] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [message, setMessage] = useState("");
  useEffect(() => {
    if (data) setForm(data);
  }, [data]);
  const patch = (p: Partial<SiteSettings>) =>
    setForm((f) => (f ? { ...f, ...p } : f));
  const text = (key: keyof SiteSettings, label: string, long = false) =>
    form && (
      <label className="field" key={key}>
        {label}
        {long ? (
          <textarea
            value={String(form[key])}
            onChange={(e) => patch({ [key]: e.target.value })}
          />
        ) : (
          <input
            value={String(form[key])}
            onChange={(e) => patch({ [key]: e.target.value })}
          />
        )}
      </label>
    );
  const toggle = (key: keyof SiteSettings, label: string) =>
    form && (
      <label key={key} className="checkbox-field">
        <input
          type="checkbox"
          checked={!!form[key]}
          onChange={(e) => patch({ [key]: e.target.checked })}
        />
        {label}
      </label>
    );
  return (
    <>
      <Feedback error={error} loading={loading} />
      {form && (
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            setBusy(true);
            setSaveError("");
            setMessage("");
            try {
              await adminRequest("settings", form);
              setMessage("Alterações salvas e disponíveis no site.");
            } catch (e) {
              setSaveError(e instanceof Error ? e.message : "Falha ao salvar.");
            } finally {
              setBusy(false);
            }
          }}
        >
          {settingsOnly ? (
            <>
              <section className="admin-card">
                <h2>Atendimento e contato</h2>
                <p className="field-caption">
                  Cadastre os dados reais do estabelecimento antes de divulgar o
                  site.
                </p>
                <div className="form-grid">
                  {text("phone", "WhatsApp com código do país (ex.: 5511…)")}
                  {text("email", "Email de contato")}
                  {text("instagram", "Instagram · URL HTTPS")}
                  {text("facebook", "Facebook · URL HTTPS")}
                </div>
                {text("address", "Endereço completo")}
                {text("hoursText", "Horários de funcionamento (texto no site)")}
                {toggle("showLocation", "Exibir seção de localização e mapa")}
              </section>
              <section className="admin-card">
                <h2>Regras de agendamento</h2>
                <p className="field-caption">
                  Fuso: America/Sao_Paulo. Configure equipe, serviços e jornadas
                  antes de ativar as reservas.
                </p>
                <div className="form-grid">
                  {(
                    [
                      [
                        "leadMinutes",
                        "Antecedência mínima (minutos)",
                        30,
                        10080,
                      ],
                      ["horizonDays", "Dias disponíveis no calendário", 1, 180],
                      [
                        "stepMinutes",
                        "Intervalo entre inícios (minutos)",
                        5,
                        60,
                      ],
                      ["cancelHours", "Prazo de cancelamento (horas)", 0, 168],
                    ] as const
                  ).map(([k, label, min, max]) => (
                    <label key={k} className="field">
                      {label}
                      <input
                        type="number"
                        min={min}
                        max={max}
                        required
                        value={form[k]}
                        onChange={(e) => patch({ [k]: Number(e.target.value) })}
                      />
                    </label>
                  ))}
                </div>
                {toggle("bookingEnabled", "Abrir agenda para reservas online")}
                <p className="field-caption">
                  O intervalo de início deve dividir uma hora: 5, 6, 10, 12, 15,
                  20, 30 ou 60 minutos.
                </p>
              </section>
            </>
          ) : (
            <>
              <p className="notice">
                Os textos e preços iniciais são sugestões. Publique somente
                fotos autorizadas, depoimentos reais e promoções que seu
                estabelecimento realmente oferece.
              </p>
              <section className="admin-card">
                <h2>Marca e primeira impressão</h2>
                <ImageField
                  label="Logo (opcional; vazio usa a marca Imperial Barber)"
                  value={form.logoUrl}
                  onChange={(v) => patch({ logoUrl: v })}
                />
                {text("eyebrow", "Frase acima do título")}
                {text("heroTitle", "Título principal")}
                {text("heroDescription", "Descrição principal", true)}
                <ImageField
                  label="Foto principal"
                  value={form.heroImage}
                  onChange={(v) => patch({ heroImage: v })}
                />
              </section>
              <section className="admin-card">
                <h2>Promoção e benefícios</h2>
                {text("promotion", "Texto da promoção")}
                {toggle("promotionActive", "Mostrar promoção no topo")}
                <label className="field">
                  Benefícios · um por linha, até cinco
                  <textarea
                    value={form.benefits.join("\n")}
                    onChange={(e) =>
                      patch({
                        benefits: e.target.value.split("\n").slice(0, 5),
                      })
                    }
                  />
                </label>
              </section>
              <section className="admin-card">
                <h2>Seções e chamadas</h2>
                {text("servicesTitle", "Título dos serviços")}
                {text("bookingTitle", "Título da chamada para agendar")}
                {text("bookingDescription", "Descrição da chamada", true)}
                {text("teamTitle", "Título da equipe")}
                {toggle("showTeam", "Mostrar seção de profissionais")}
                {text("footerText", "Texto do rodapé", true)}
                <ImageField
                  label="Foto da localização"
                  value={form.locationImage}
                  onChange={(v) => patch({ locationImage: v })}
                />
              </section>
              <section className="admin-card">
                <h2>Depoimentos</h2>
                {text("testimonialsTitle", "Título dos depoimentos")}
                {toggle("showTestimonials", "Exibir depoimentos no site")}
                {form.testimonials.map((t, i) => (
                  <div key={i} className="block-row">
                    <label className="field">
                      Nome do cliente
                      <input
                        value={t.name}
                        onChange={(e) =>
                          patch({
                            testimonials: form.testimonials.map((v, k) =>
                              k === i ? { ...v, name: e.target.value } : v,
                            ),
                          })
                        }
                      />
                    </label>
                    <label className="field">
                      Depoimento autorizado
                      <textarea
                        value={t.text}
                        onChange={(e) =>
                          patch({
                            testimonials: form.testimonials.map((v, k) =>
                              k === i ? { ...v, text: e.target.value } : v,
                            ),
                          })
                        }
                      />
                    </label>
                    <button
                      type="button"
                      className="text-button"
                      onClick={() =>
                        patch({
                          testimonials: form.testimonials.filter(
                            (_, k) => k !== i,
                          ),
                        })
                      }
                    >
                      <Trash2 size={15} />
                      Remover
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  className="text-button"
                  disabled={form.testimonials.length >= 12}
                  onClick={() =>
                    patch({
                      testimonials: [
                        ...form.testimonials,
                        { name: "", text: "" },
                      ],
                    })
                  }
                >
                  <Plus size={15} />
                  Adicionar depoimento
                </button>
              </section>
            </>
          )}
          <Feedback error={saveError} />
          {message && (
            <p className="success-message" role="status">
              {message}
            </p>
          )}
          <div className="sticky-save">
            <SaveButton busy={busy} />
          </div>
        </form>
      )}
    </>
  );
}
