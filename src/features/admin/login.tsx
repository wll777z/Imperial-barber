"use client";
import { useState } from "react";
import { ArrowUpRight, LockKeyhole, ArrowLeft } from "lucide-react";
import Brand from "@/components/site/brand";
export default function Login({ configured }: { configured: boolean }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const r = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const v = await r.json();
      if (!v.ok) throw Error(v.error.message);
      location.assign("/admin");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Não foi possível entrar.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <main className="admin-login">
      <div className="login-brand">
        <Brand />
        <p>
          Precisão no corte.
          <br />
          Controle no seu negócio.
        </p>
      </div>
      <form className="login-card" onSubmit={submit}>
        <div className="login-lock">
          <LockKeyhole strokeWidth={1} />
        </div>
        <p className="eyebrow dark">ÁREA EXCLUSIVA</p>
        <h1>Bem-vindo de volta.</h1>
        <p>Acesse o painel da sua barbearia.</p>
        {!configured && (
          <p className="notice">
            O acesso será liberado após a configuração segura do Supabase e a
            criação do administrador. Nenhuma senha padrão é utilizada.
          </p>
        )}
        <label className="field">
          Email
          <input
            type="email"
            required
            autoComplete="username"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </label>
        <label className="field">
          Senha
          <input
            type="password"
            required
            minLength={8}
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </label>
        <p role="alert" className="form-error">
          {error}
        </p>
        <button className="button" disabled={busy || !configured}>
          {busy ? "Entrando…" : "Entrar no painel"}
          <ArrowUpRight size={18} />
        </button>
        <p className="login-help">
          Esqueceu sua senha? Solicite a recuperação ao responsável pelo
          estabelecimento.
        </p>
        <a className="text-button" href="/">
          <ArrowLeft size={14} />
          Voltar ao site
        </a>
      </form>
    </main>
  );
}
