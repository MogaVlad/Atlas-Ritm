"use client";

import { ChevronLeft, ChevronRight, RotateCcw, ShoppingBag, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useId, useState } from "react";
import { canAfford, SIMULATED_SHOPS, usePendingPurchase, type Purchase } from "@/components/bank/purchases";
import { RULES } from "@/lib/engine/config";
import { formatLei } from "@/lib/format";
import { useT } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { useBank } from "./useBank";

const MODE_KEY = "atlas-demo-mode";

/** One-tap jumps next to the arrows: every 6 days, from payday to payday. */
const JUMPS = [1, 6, 12, 18, 24, 30] as const;

/** Demo mode is remembered in this browser, so a reload or a typed URL keeps the controls. */
function readMode(): boolean {
  try {
    const param = new URLSearchParams(window.location.search).get("demo");
    if (param === "1") window.localStorage.setItem(MODE_KEY, "1");
    if (param === "0") window.localStorage.removeItem(MODE_KEY);
    return window.localStorage.getItem(MODE_KEY) === "1";
  } catch {
    return false;
  }
}

const BUTTON =
  "flex size-9 min-[500px]:size-11 items-center justify-center rounded-full transition-colors hover:bg-white/15 disabled:opacity-35 disabled:hover:bg-transparent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring";
const JUMP =
  "flex h-9 min-w-9 items-center justify-center rounded-full px-2 tabular-nums transition-colors hover:bg-white/15 aria-pressed:bg-background aria-pressed:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring";
const DIVIDER = "mx-0.5 hidden h-6 w-px bg-background/25 min-[500px]:block";

/**
 * The demo clock: one small pill with previous day, the day, next day, jumps to days 1/6/12/18/24/30,
 * Reset demo and "Simulate a purchase". Visible in demo mode (?demo=1, remembered; ?demo=0 turns it
 * off). On a laptop it sits outside the phone, bottom right. On a phone it sits in the empty middle
 * of the top bar, so it never covers a Confirm button at the bottom; there tapping the day opens the
 * panel, which also holds the jumps and Reset.
 */
export function DemoControls() {
  const t = useT();
  const [mode, setMode] = useState(false);
  const [panelOpen, setPanelOpen] = useState(false);
  const demoDay = useBank((s) => s.demoDay);
  const setDemoDay = useBank((s) => s.setDemoDay);
  const resetDemo = useBank((s) => s.resetDemo);

  // Browser-only value, read once after mount (keeps the page prerenderable).
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time read of a browser-only value
    setMode(readMode());
  }, []);

  if (!mode) return null;

  const jumps = (className: string, buttonClass: string) => (
    <div className={className}>
      {JUMPS.map((day) => (
        <button
          key={day}
          type="button"
          onClick={() => setDemoDay(day)}
          aria-pressed={demoDay === day}
          aria-label={t("common.demo.jumpTo", { day })}
          className={buttonClass}
        >
          {day}
        </button>
      ))}
    </div>
  );

  return (
    <>
      <div
        role="group"
        aria-label={t("common.demo.title")}
        className="fixed top-2.5 left-1/2 z-50 flex -translate-x-[70%] items-center rounded-full bg-foreground/85 text-xs font-medium text-background shadow-lg backdrop-blur min-[500px]:top-auto min-[500px]:right-4 min-[500px]:bottom-4 min-[500px]:left-auto min-[500px]:translate-x-0 min-[500px]:p-0.5 min-[500px]:text-sm"
      >
        <button
          type="button"
          onClick={() => setDemoDay(demoDay - 1)}
          disabled={demoDay <= 1}
          aria-label={t("common.demo.prevDay")}
          className={BUTTON}
        >
          <ChevronLeft className="size-5" aria-hidden="true" />
        </button>
        {/* Tapping the day opens the demo tools: on a phone the pill has no room for another button. */}
        <button
          type="button"
          onClick={() => setPanelOpen((o) => !o)}
          aria-expanded={panelOpen}
          className="min-h-9 min-w-12 rounded-full px-1 text-center tabular-nums underline decoration-background/40 decoration-dotted underline-offset-4 transition-colors hover:bg-white/15 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring min-[500px]:min-h-11 min-[500px]:min-w-16 min-[500px]:no-underline"
        >
          <span aria-live="polite">{t("common.demo.day", { day: demoDay })}</span>
        </button>
        <button
          type="button"
          onClick={() => setDemoDay(demoDay + 1)}
          disabled={demoDay >= RULES.cycleLength}
          aria-label={t("common.demo.nextDay")}
          className={BUTTON}
        >
          <ChevronRight className="size-5" aria-hidden="true" />
        </button>
        <span className={DIVIDER} aria-hidden="true" />
        {jumps("hidden items-center gap-0.5 min-[500px]:flex", JUMP)}
        <span className={DIVIDER} aria-hidden="true" />
        <button type="button" onClick={resetDemo} aria-label={t("common.demo.reset")} className={`${BUTTON} max-[499px]:hidden`}>
          <RotateCcw className="size-4" aria-hidden="true" />
        </button>
        <button
          type="button"
          onClick={() => setPanelOpen((o) => !o)}
          aria-expanded={panelOpen}
          className={cn(BUTTON, "gap-2 px-4 whitespace-nowrap max-[499px]:hidden min-[500px]:w-auto")}
        >
          <ShoppingBag className="size-4" aria-hidden="true" />
          {t("common.demo.buy.button")}
        </button>
      </div>

      {panelOpen && (
        <section
          aria-label={t("common.demo.buy.button")}
          onKeyDown={(e) => e.key === "Escape" && setPanelOpen(false)}
          className="fixed inset-x-3 top-14 z-50 max-h-[80dvh] overflow-y-auto rounded-2xl border bg-background p-4 text-sm text-foreground shadow-2xl min-[500px]:inset-x-auto min-[500px]:top-auto min-[500px]:right-4 min-[500px]:bottom-20 min-[500px]:w-80"
        >
          <div className="flex items-center justify-between gap-2">
            <h2 className="font-semibold">{t("common.demo.title")}</h2>
            <button
              type="button"
              onClick={() => setPanelOpen(false)}
              aria-label={t("common.demo.buy.close")}
              className="-mr-2 flex size-11 items-center justify-center rounded-full hover:bg-muted focus-visible:outline-2 focus-visible:outline-ring"
            >
              <X className="size-4" aria-hidden="true" />
            </button>
          </div>

          {/* On a phone the pill has no room for the jumps and Reset: they live here. */}
          <div className="mb-4 flex flex-col gap-2 border-b pb-4 min-[500px]:hidden">
            {jumps(
              "grid grid-cols-6 gap-1.5",
              "min-h-11 rounded-lg bg-muted font-medium tabular-nums aria-pressed:bg-foreground aria-pressed:text-background focus-visible:outline-2 focus-visible:outline-ring",
            )}
            <button
              type="button"
              onClick={resetDemo}
              className="flex min-h-11 items-center justify-center gap-2 rounded-lg border font-medium focus-visible:outline-2 focus-visible:outline-ring"
            >
              <RotateCcw className="size-4" aria-hidden="true" />
              {t("common.demo.reset")}
            </button>
          </div>

          <PurchaseSimulator onOnline={() => setPanelOpen(false)} />
        </section>
      )}
    </>
  );
}

/**
 * Any purchase, from outside the phone. Online goes to Atlas's approval screen (where the Speed
 * bump may pause it); in store is paid at once. Never more than the current balance.
 */
function PurchaseSimulator({ onOnline }: { onOnline: () => void }) {
  const t = useT();
  const router = useRouter();
  const ids = { shop: useId(), amount: useId() };
  const locale = useBank((s) => s.locale);
  const ritm = useBank((s) => s.ritm);
  const setLevel = useBank((s) => s.setLevel);
  const addTransaction = useBank((s) => s.addTransaction);
  const setPurchase = usePendingPurchase((s) => s.setPurchase);

  const [shopIndex, setShopIndex] = useState(0);
  const [amountText, setAmountText] = useState(String(SIMULATED_SHOPS[0].amount));
  const [online, setOnline] = useState(true);
  const [message, setMessage] = useState<{ error: boolean; text: string } | null>(null);

  const shop = SIMULATED_SHOPS[shopIndex];
  const amount = Number(amountText);
  const valid = Number.isFinite(amount) && amount > 0;
  const lei = (value: number) => formatLei(value, locale);

  // What the Speed bump will do with this payment, so the demo never surprises the presenter.
  let hint: string;
  if (!online) hint = t("common.demo.buy.inStoreNote");
  else if (!ritm.enabled) hint = t("common.demo.buy.ritmOff");
  else if (ritm.level === "headsup") hint = t("common.demo.buy.headsUpOnly");
  else if (valid && amount < ritm.speedBumpThreshold) hint = t("common.demo.buy.underThreshold", { threshold: lei(ritm.speedBumpThreshold) });
  else hint = t("common.demo.buy.willPause");

  function pay() {
    if (!valid) return setMessage({ error: true, text: t("common.demo.buy.invalid") });
    const values = { amount: lei(amount), merchant: shop.merchant };
    if (!canAfford(amount)) {
      return setMessage({
        error: true,
        text: t("bank.payments.insufficient", { ...values, balance: lei(useBank.getState().balances.current) }),
      });
    }
    const purchase: Purchase = { ...shop, amount, channel: online ? "card_online" : "card_in_store" };
    if (online) {
      setPurchase(purchase);
      setMessage(null);
      onOnline();
      router.push("/payments/confirm");
      return;
    }
    addTransaction(purchase);
    // The store recomputes the pace synchronously, so this is the number after the payment.
    const { pace } = useBank.getState();
    setMessage({
      error: false,
      text: ritm.enabled
        ? t("bank.payments.tapToast", { ...values, safe: lei(pace.safeToSpendToday) })
        : t("bank.payments.tapToastNoRitm", values),
    });
  }

  const choice = (on: boolean) =>
    cn(
      "min-h-11 flex-1 rounded-lg border font-medium focus-visible:outline-2 focus-visible:outline-ring",
      on && "border-foreground bg-foreground text-background",
    );

  return (
    <div className="flex flex-col gap-3">
      <h3 className="font-semibold">{t("common.demo.buy.title")}</h3>

      <div className="flex flex-col gap-1">
        <label htmlFor={ids.shop} className="text-muted-foreground">
          {t("common.demo.buy.shop")}
        </label>
        <select
          id={ids.shop}
          value={shopIndex}
          onChange={(e) => {
            const index = Number(e.target.value);
            setShopIndex(index);
            setAmountText(String(SIMULATED_SHOPS[index].amount));
            setMessage(null);
          }}
          className="min-h-11 rounded-lg border bg-background px-3"
        >
          {SIMULATED_SHOPS.map((s, i) => (
            <option key={s.merchant} value={i}>
              {s.merchant}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor={ids.amount} className="text-muted-foreground">
          {t("common.demo.buy.amount")}
        </label>
        <input
          id={ids.amount}
          type="number"
          inputMode="decimal"
          min={1}
          step={1}
          value={amountText}
          // No minus sign: a purchase is never negative.
          onChange={(e) => {
            setAmountText(e.target.value.replace(/-/g, ""));
            setMessage(null);
          }}
          onKeyDown={(e) => ["-", "+", "e", "E"].includes(e.key) && e.preventDefault()}
          className="min-h-11 rounded-lg border bg-background px-3 tabular-nums"
        />
      </div>

      <div role="radiogroup" aria-label={t("common.demo.buy.channel")} className="flex gap-2">
        <button type="button" role="radio" aria-checked={online} onClick={() => setOnline(true)} className={choice(online)}>
          {t("common.demo.buy.online")}
        </button>
        <button type="button" role="radio" aria-checked={!online} onClick={() => setOnline(false)} className={choice(!online)}>
          {t("common.demo.buy.inStore")}
        </button>
      </div>

      <p className="text-muted-foreground">{hint}</p>
      {online && ritm.enabled && ritm.level === "headsup" && (
        <button
          type="button"
          onClick={() => setLevel("speedbump")}
          className="min-h-11 rounded-lg border font-medium focus-visible:outline-2 focus-visible:outline-ring"
        >
          {t("common.demo.buy.enableSpeedBump")}
        </button>
      )}

      <button
        type="button"
        onClick={pay}
        className="min-h-11 rounded-lg bg-foreground font-medium text-background focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
      >
        {t("common.demo.buy.pay", { amount: valid ? lei(amount) : "…" })}
      </button>

      <p aria-live="polite" className={cn("min-h-5", message?.error ? "text-destructive" : "text-muted-foreground")}>
        {message?.text}
      </p>
    </div>
  );
}
