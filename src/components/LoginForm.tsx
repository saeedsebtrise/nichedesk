"use client";

import { useState } from "react";

import { Banner, Button, FieldLabel, TextInput } from "@/components/ui/primitives";

export function LoginForm({ next }: { next: string }) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setError(null);

    const response = await fetch("/api/session", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ password }),
    }).catch(() => null);

    if (response?.ok) {
      window.location.assign(next);
      return;
    }

    const body = await response?.json().catch(() => null);
    setError(body?.error ?? "Could not reach NicheDesk.");
    setBusy(false);
  };

  return (
    <form onSubmit={submit} className="mt-6 space-y-4">
      {error ? <Banner tone="error">{error}</Banner> : null}
      <label className="block space-y-1">
        <FieldLabel>Password</FieldLabel>
        <TextInput
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          autoComplete="current-password"
          autoFocus
          required
        />
      </label>
      <Button type="submit" variant="primary" disabled={busy} className="w-full justify-center">
        {busy ? "Checking…" : "Log in"}
      </Button>
    </form>
  );
}
