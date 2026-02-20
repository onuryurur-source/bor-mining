"use client";

import { useEffect, useMemo, useState } from "react";

type Mine = { id: string; level: number };

export default function Home() {
  const api = process.env.NEXT_PUBLIC_API_BASE!;
  const [telegramId, setTelegramId] = useState<string>("");
  const [username, setUsername] = useState<string | undefined>();
  const [bor, setBor] = useState<number>(0);
  const [hourly, setHourly] = useState<number>(0);
  const [mines, setMines] = useState<Mine[]>([]);
  const [msg, setMsg] = useState<string>("");

  useEffect(() => {
    // Telegram Mini App’te gerçek kullanıcı:
    const tg = (window as any).Telegram?.WebApp;
    tg?.ready?.();

    const user = tg?.initDataUnsafe?.user;
    if (user?.id) {
      setTelegramId(String(user.id));
      setUsername(user.username);
      return;
    }

    // Telegram yoksa (tarayıcıdan test)
    setTelegramId("demo-123");
    setUsername("onur");
  }, []);

  async function ensureUser() {
    await fetch(`${api}/user/ensure`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-telegram-id": telegramId
      },
      body: JSON.stringify({ username })
    });
  }

  async function loadState() {
    const r = await fetch(`${api}/state`, {
      headers: { "x-telegram-id": telegramId }
    });
    const data = await r.json();
    setBor(data.user.borBalance);
    setHourly(data.hourlyProduction);
    setMines(data.mines);
  }

  useEffect(() => {
    if (!telegramId) return;
    (async () => {
      await ensureUser();
      await loadState();
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [telegramId]);

  async function buyMine(level: number) {
    setMsg("");
    const starsPaid = level === 1 ? 10 : level === 2 ? 20 : 30;

    const r = await fetch(`${api}/mine/buy`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-telegram-id": telegramId
      },
      body: JSON.stringify({ level, starsPaid }) // MVP: stars doğrulaması sonra
    });

    const data = await r.json();
    if (!r.ok) setMsg(data.message ?? "Hata");
    else setMsg("Maden satın alındı ✅");

    await loadState();
  }

  async function claim(adWatched: boolean) {
    setMsg("");
    const r = await fetch(`${api}/claim`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-telegram-id": telegramId
      },
      body: JSON.stringify({ adWatched })
    });

    const data = await r.json();
    if (!r.ok) setMsg(data.message ?? "Hata");
    else setMsg(`+${data.earned} BOR topladın!`);

    await loadState();
  }

  const mineCounts = useMemo(() => {
    const c: Record<number, number> = {};
    for (const m of mines) c[m.level] = (c[m.level] ?? 0) + 1;
    return c;
  }, [mines]);

  return (
    <main style={{ padding: 16, fontFamily: "system-ui", maxWidth: 520, margin: "0 auto" }}>
      <h1 style={{ fontSize: 28, marginBottom: 8 }}>⛏️ Bor Mining</h1>
      <p style={{ marginTop: 0, opacity: 0.8 }}>Madencilik imparatorluğunu kur.</p>

      <div style={{ display: "flex", gap: 12, marginTop: 16 }}>
        <div style={{ flex: 1, padding: 12, border: "1px solid #ddd", borderRadius: 12 }}>
          <div style={{ fontSize: 12, opacity: 0.7 }}>BOR</div>
          <div style={{ fontSize: 22, fontWeight: 700 }}>{bor}</div>
        </div>
        <div style={{ flex: 1, padding: 12, border: "1px solid #ddd", borderRadius: 12 }}>
          <div style={{ fontSize: 12, opacity: 0.7 }}>Saatlik Üretim</div>
          <div style={{ fontSize: 22, fontWeight: 700 }}>{hourly} / saat</div>
        </div>
      </div>

      <h2 style={{ marginTop: 24 }}>Madenlerim</h2>
      <ul>
        <li>Seviye 1: {mineCounts[1] ?? 0}</li>
        <li>Seviye 2: {mineCounts[2] ?? 0}</li>
        <li>Seviye 3: {mineCounts[3] ?? 0}</li>
      </ul>

      <h2 style={{ marginTop: 24 }}>Maden Satın Al</h2>
      <div style={{ display: "grid", gap: 10 }}>
        <button onClick={() => buyMine(1)}>L1 — 200 BOR + 10⭐ → +10/saat</button>
        <button onClick={() => buyMine(2)}>L2 — 400 BOR + 20⭐ → +20/saat</button>
        <button onClick={() => buyMine(3)}>L3 — 800 BOR + 30⭐ → +40/saat</button>
      </div>

      <h2 style={{ marginTop: 24 }}>Kazancı Topla</h2>
      <p style={{ opacity: 0.8 }}>
        Free kullanıcılar için claim öncesi reklam zorunlu. (Şimdilik “reklam izledim” simülasyonu)
      </p>
      <button onClick={() => claim(true)}>🎥 Reklam izledim → Claim</button>

      {msg && (
        <div style={{ marginTop: 12, padding: 10, borderRadius: 10, background: "#f6f6f6" }}>
          {msg}
        </div>
      )}

      <hr style={{ margin: "24px 0" }} />
      <small style={{ opacity: 0.7 }}>
        MVP: Stars ödeme doğrulaması + gerçek Telegram initData doğrulaması sonraki adım.
      </small>
    </main>
  );
}