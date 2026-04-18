"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError("Credenciales incorrectas. Intenta de nuevo.");
    } else {
      router.push("/dashboard");
      router.refresh();
    }
    setLoading(false);
  }

  return (
    <div className="min-h-screen grid-bg flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Logo area */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl mb-5"
            style={{ background: "linear-gradient(135deg, #00D9FF22, #00E5A022)", border: "1px solid #00D9FF33" }}>
            <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
              <path d="M14 2L26 8V20L14 26L2 20V8L14 2Z" stroke="#00D9FF" strokeWidth="1.5" fill="none"/>
              <path d="M14 8L20 11V17L14 20L8 17V11L14 8Z" fill="#00D9FF" fillOpacity="0.3"/>
              <circle cx="14" cy="14" r="2.5" fill="#00D9FF"/>
            </svg>
          </div>
          <h1 className="text-2xl font-semibold text-text-primary tracking-tight">
            Portfolio
          </h1>
          <p className="text-text-secondary text-sm mt-1">
            Control de inversiones familiares
          </p>
        </div>

        {/* Card */}
        <div className="rounded-2xl p-8"
          style={{ background: "#111C33", border: "1px solid #1A2744" }}>
          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-xs font-medium text-text-secondary mb-2 uppercase tracking-wider">
                Correo
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                className="w-full px-4 py-3 rounded-xl text-sm text-text-primary outline-none transition-all"
                style={{
                  background: "#080D1A",
                  border: "1px solid #1A2744",
                }}
                onFocus={(e) => (e.currentTarget.style.borderColor = "#00D9FF55")}
                onBlur={(e) => (e.currentTarget.style.borderColor = "#1A2744")}
                placeholder="tu@correo.com"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-text-secondary mb-2 uppercase tracking-wider">
                Contraseña
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                className="w-full px-4 py-3 rounded-xl text-sm text-text-primary outline-none transition-all"
                style={{
                  background: "#080D1A",
                  border: "1px solid #1A2744",
                }}
                onFocus={(e) => (e.currentTarget.style.borderColor = "#00D9FF55")}
                onBlur={(e) => (e.currentTarget.style.borderColor = "#1A2744")}
                placeholder="••••••••"
              />
            </div>

            {error && (
              <div className="text-xs text-accent-red py-2 px-3 rounded-lg"
                style={{ background: "#EF444411", border: "1px solid #EF444422" }}>
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl font-medium text-sm transition-all mt-2"
              style={{
                background: loading ? "#00D9FF44" : "linear-gradient(135deg, #00D9FF, #00B8D9)",
                color: "#080D1A",
                opacity: loading ? 0.7 : 1,
              }}>
              {loading ? "Ingresando..." : "Ingresar"}
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-text-muted mt-6">
          Acceso privado — familia Oviedo Mora
        </p>
      </div>
    </div>
  );
}
