"use client";
import { tableFromSearch } from "../lib/tables";
import { useState, useEffect, useRef, useMemo } from "react";
import {
  ShoppingBag,
  Plus,
  Minus,
  Star,
  Beer,
  Wine,
  UtensilsCrossed,
  Flame,
  Heart,
  Search,
  SlidersHorizontal,
  ArrowUpRight,
  ArrowLeft,
  ArrowRight,
  ChevronDown,
  MapPin,
  Sparkles,
  X,
  Send,
  Info,
  GlassWater,
  Menu as MenuIcon,
  Leaf,
  RotateCw,
  Check,
  Share2,
  Download,
  ShieldCheck,
  Clock,
  ArrowDown,
} from "lucide-react";
import type { Bar, Product, Lang } from "../lib/types";
import { ui, allergenNames, profiles } from "../lib/i18n";
import {
  money,
  localProduct,
  normalize,
  safeAccent,
  langs,
  displaySize,
} from "../lib/menu";
import Modal from "../components/modal";
import Price from "../components/price";
import { customer } from "../lib/customer-copy";
import {
  changeQuantity,
  orderItems,
  orderTotal,
  orderMessage,
  whatsappLink,
  type OrderLine,
} from "../lib/order";
const flags = { es: "🇲🇽", en: "🇺🇸", fr: "🇫🇷", zh: "🇨🇳", ru: "🇷🇺" };
const languageNames = {
  es: "Español",
  en: "English",
  fr: "Français",
  zh: "中文",
  ru: "Русский",
};
const icons: any = {
  beer: Beer,
  bottle: Beer,
  wine: Wine,
  glass: GlassWater,
  utensils: UtensilsCrossed,
  burger: UtensilsCrossed,
  citrus: Leaf,
  cake: UtensilsCrossed,
};
type Message = {
  role: "user" | "assistant";
  text: string;
  ids?: string[];
  mode?: string;
  plan?: { totalMXN: number; people: number };
};
export default function Menu({
  initial,
  own = false,
}: {
  initial: Bar;
  own?: boolean;
}) {
  const [bar, setBar] = useState(initial),
    [lang, setLang] = useState<Lang>(initial.sourceLanguage || "es"),
    [currency, setCurrency] = useState<string>(initial.baseCurrency || "MXN"),
    [category, setCategory] = useState("all"),
    [query, setQuery] = useState(""),
    [popular, setPopular] = useState(false),
    [style, setStyle] = useState(""),
    [bitter, setBitter] = useState(""),
    [alcohol, setAlcohol] = useState(""),
    [profile, setProfile] = useState(""),
    [saved, setSaved] = useState<string[]>([]),
    [tab, setTab] = useState("menu"),
    [sheet, setSheet] = useState(""),
    [chatOpen, setChatOpen] = useState(false),
    [messages, setMessages] = useState<Message[]>([]),
    [input, setInput] = useState(""),
    [busy, setBusy] = useState(false),
    [toast, setToast] = useState(""),
    [online, setOnline] = useState(true),
    [install, setInstall] = useState<any>(null),
    [focused, setFocused] = useState("");
  const listRef = useRef<HTMLElement>(null),
    chatEnd = useRef<HTMLDivElement>(null);
  const [order, setOrder] = useState<OrderLine[]>([]),
    [orderReady, setOrderReady] = useState(false),
    [table, setTable] = useState(""),
    [orderNotes, setOrderNotes] = useState(""),
    [customerName, setCustomerName] = useState(""),
    [nameError, setNameError] = useState(false);
  useEffect(() => {
    try {
      const incoming = tableFromSearch(window.location.search);
      if (incoming && /^[1-9]\d{0,2}$/.test(incoming)) {
        setTable(incoming);
        sessionStorage.setItem("crafted-table-" + bar.id, incoming);
      } else {
        const stored = sessionStorage.getItem("crafted-table-" + bar.id);
        if (stored && /^[1-9]\d{0,2}$/.test(stored)) setTable(stored);
      }
    } catch {}
  }, [bar.id]);
  function goToWhatsApp(e: React.FormEvent) {
    e.preventDefault();
    if (!customerName.trim()) {
      setNameError(true);
      return;
    }
    if (wa && count > 0) window.open(wa, "_blank", "noopener,noreferrer");
  }
  const c = customer[lang];
  const configuredPhone =
    bar.website === "https://craftedkt.com/" &&
    (!bar.whatsappNumber ||
      bar.whatsappNumber.replace(/^\+/, "") === "525538601646")
      ? "18323165870"
      : bar.whatsappNumber;
  const reviewLink =
    bar.reviewUrl ||
    (bar.website === "https://craftedkt.com/"
      ? "https://search.google.com/local/writereview?placeid=ChIJTaSvdG4kQYYRNtlb07BKbhI"
      : undefined);
  const lines = orderItems(order, bar, lang),
    count = lines.reduce((sum, l) => sum + l.quantity, 0),
    total = orderTotal(order, bar),
    message = orderMessage(order, bar, lang, table, orderNotes, customerName),
    wa = whatsappLink(configuredPhone, message);
  useEffect(() => {
    try {
      const value = JSON.parse(
        sessionStorage.getItem("crafted-order-" + bar.id) || "[]",
      );
      if (Array.isArray(value)) setOrder(value);
    } catch {}
    setOrderReady(true);
  }, [bar.id]);
  useEffect(() => {
    if (orderReady)
      sessionStorage.setItem("crafted-order-" + bar.id, JSON.stringify(order));
  }, [order, bar.id, orderReady]);
  function adjust(id: string, option: number, delta: number) {
    setOrder((old) => changeQuantity(old, id, option, delta));
  }
  const t = ui[lang];
  const accent = safeAccent(bar.accent);
  const identity = bar.translations?.[lang];
  const tagline = identity?.tagline || bar.tagline,
    promotion = identity?.promotion || bar.promotion,
    hours = identity?.hours || bar.hours;
  function event(kind: string, productId = "", value = "") {
    fetch("/api/events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ bar: bar.slug, kind, productId, value }),
      keepalive: true,
    }).catch(() => {});
  }
  useEffect(() => {
    const link = document.querySelector<HTMLLinkElement>(
      'link[rel="manifest"]',
    );
    if (link) link.href = "/api/manifest?bar=" + encodeURIComponent(bar.slug);
  }, [bar.slug]);
  useEffect(() => {
    try {
      const preferences = JSON.parse(
        localStorage.getItem("barra-preferences") || "{}",
      );
      if (langs.includes(preferences.lang)) setLang(preferences.lang);
      if (["MXN", "USD", "EUR"].includes(preferences.currency))
        setCurrency(preferences.currency);
    } catch {}
    if ("serviceWorker" in navigator)
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    const on = () => setOnline(navigator.onLine);
    on();
    window.addEventListener("online", on);
    window.addEventListener("offline", on);
    const offer = (e: any) => {
      e.preventDefault();
      setInstall(e);
    };
    window.addEventListener("beforeinstallprompt", offer);
    return () => {
      window.removeEventListener("online", on);
      window.removeEventListener("offline", on);
      window.removeEventListener("beforeinstallprompt", offer);
    };
  }, []);
  useEffect(() => {
    if (!own) return;
    fetch("/api/bootstrap")
      .then((r) => r.json())
      .then((d: any) => {
        if (d.bar) setBar(d.bar);
      })
      .catch(() => {});
  }, [own]);
  useEffect(() => {
    try {
      setSaved(
        JSON.parse(localStorage.getItem("barra-saved-" + bar.id) || "[]"),
      );
    } catch {}
  }, [bar.id]);
  useEffect(() => {
    document.documentElement.lang = lang;
    localStorage.setItem(
      "barra-preferences",
      JSON.stringify({ lang, currency }),
    );
  }, [lang, currency]);
  useEffect(() => {
    const refresh = () =>
      fetch(
        "/api/catalog?bar=" +
          encodeURIComponent(bar.slug) +
          "&revision=" +
          bar.revision,
      )
        .then((r) => (r.status === 200 ? r.json() : null))
        .then((d: any) => {
          if (d?.bar && d.bar.revision > bar.revision) setBar(d.bar);
        })
        .catch(() => {});
    if (["demo", "crafted"].includes(bar.id)) return;
    const timer = setInterval(() => {
      if (!document.hidden) refresh();
    }, 3000);
    return () => clearInterval(timer);
  }, [bar.slug, bar.id, bar.revision]);
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(""), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);
  useEffect(() => {
    chatEnd.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, busy, chatOpen]);
  const filtered = useMemo(
    () =>
      bar.products.filter(
        (p) =>
          (tab !== "saved" || saved.includes(p.id)) &&
          (category === "all" || p.category === category) &&
          (!popular || p.popular) &&
          (!style || p.style === style) &&
          (!query ||
            normalize(
              [p.name, p.style, p.description, localProduct(p, lang).name].join(
                " ",
              ),
            ).includes(normalize(query))) &&
          (!bitter ||
            (p.ibuKnown !== false &&
              (p.category === "tap" ||
                p.category === "bottle" ||
                p.id.startsWith("drink-")) &&
              (bitter === "low"
                ? p.ibu <= 20
                : bitter === "medium"
                  ? p.ibu > 20 && p.ibu <= 45
                  : p.ibu > 45))) &&
          (!alcohol ||
            (alcohol === "zero"
              ? p.abv === 0
              : alcohol === "soft"
                ? p.abv > 0 && p.abv <= 5
                : p.abv > 5)) &&
          (!profile || p.profile === profile),
      ),
    [
      bar,
      tab,
      saved,
      category,
      popular,
      style,
      query,
      bitter,
      alcohol,
      profile,
      lang,
    ],
  );
  const activeFilters = [style, bitter, alcohol, profile].filter(
    Boolean,
  ).length;
  const categoryName =
    category === "all"
      ? t.all
      : bar.categories.find((c) => c.id === category)?.names[lang] ||
        bar.categories.find((c) => c.id === category)?.name;
  function clear() {
    setCategory("all");
    setQuery("");
    setPopular(false);
    setStyle("");
    setBitter("");
    setAlcohol("");
    setProfile("");
  }
  function save(id: string) {
    setSaved((old) => {
      const next = old.includes(id)
        ? old.filter((v) => v !== id)
        : [...old, id];
      localStorage.setItem("barra-saved-" + bar.id, JSON.stringify(next));
      return next;
    });
  }
  function jump(id: string) {
    setTab("menu");
    clear();
    setFocused(id);
    setTimeout(() => {
      document
        .getElementById("product-" + id)
        ?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 100);
    setTimeout(() => setFocused(""), 2500);
  }
  async function ask(value: string) {
    if (busy || !value.trim()) return;
    setChatOpen(true);
    setMessages((m) => [...m, { role: "user", text: value }]);
    setInput("");
    setBusy(true);
    event("chat", "", "consulta");
    try {
      const r = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bar: bar.slug,
          message: value,
          lang,
          history: messages
            .filter((m) => m.role === "user")
            .slice(-3)
            .map((m) => m.text),
        }),
      });
      const d: any = await r.json();
      if (!r.ok) throw new Error();
      if (d.topic) event("topic", "", d.topic);
      setMessages((m) => [
        ...m,
        {
          role: "assistant",
          text: d.text,
          ids: d.ids,
          mode: d.mode,
          plan: d.plan,
        },
      ]);
    } catch {
      setMessages((m) => [...m, { role: "assistant", text: t.retry }]);
    } finally {
      setBusy(false);
    }
  }
  async function share() {
    const url =
      bar.id === "demo" ? location.href : location.origin + "/b/" + bar.slug;
    try {
      if (navigator.share) await navigator.share({ title: bar.name, url });
      else {
        await navigator.clipboard.writeText(url);
        setToast(t.copied);
      }
    } catch {}
  }
  function chooseCategory(id: string) {
    setCategory(id);
    setTab("menu");
    listRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }
  return (
    <div className="app" style={{ "--accent": accent } as React.CSSProperties}>
      <a className="skip" href="#catalog">
        {t.backMenu}
      </a>
      <header className="topbar">
        <a href="/" className="wordmark">
          <span className="brand-symbol" aria-hidden="true">
            {bar.logo && <img src={bar.logo} alt="" />}L<span>’</span>
          </span>
          <span>
            {bar.name}
            <small>CRAFT BEER & KITCHEN</small>
          </span>
        </a>
        <div className="top-actions">
          <span className="top-location">
            <MapPin size={14} />
            {bar.location}
          </span>
          <button className="utility" onClick={() => setSheet("currency")}>
            {currency === "EUR" ? "€" : "$"} {currency}
            <ChevronDown size={13} />
          </button>
          <button className="utility language" onClick={() => setSheet("lang")}>
            <span>{flags[lang]}</span>
            {lang.toUpperCase()}
            <ChevronDown size={13} />
          </button>
          <a className="admin-link" href="/admin">
            {t.admin}
            <ArrowUpRight size={14} />
          </a>
        </div>
      </header>
      {!online && <div className="offline">{t.offline}</div>}
      <main>
        <section
          className="welcome-panel"
          style={{
            backgroundImage: `url(${JSON.stringify(!bar.banner || bar.banner === "/images/crafted/interior.jpg" ? "/images/crafted/welcome-wall.webp" : bar.banner)})`,
          }}
        >
          <div>
            <p className="welcome-location">Katy, Texas</p>
            {table && (
              <span className="table-indicator">
                {c.tableLabel} {table}
              </span>
            )}
            <h1>{c.welcome}</h1>
            <p>{c.tagline}</p>
            <div className="social-links">
              {bar.instagram && (
                <a
                  href={bar.instagram}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={c.instagram}
                >
                  <Instagram size={16} />
                  <span>Instagram</span>
                </a>
              )}
              {reviewLink && (
                <a
                  href={reviewLink}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={c.reviews}
                >
                  <Star size={15} />
                  <span>Google</span>
                </a>
              )}
            </div>
          </div>
        </section>
        <div className="menu-layout">
          <section className="catalog" ref={listRef} id="catalog">
            <div className="catalog-tools">
              <h2>{tab === "saved" ? t.saved : t.menu}</h2>
              <div>
                <button
                  className={tab === "saved" ? "selected" : ""}
                  aria-label={t.favorites}
                  onClick={() => {
                    setTab(tab === "saved" ? "menu" : "saved");
                    clear();
                  }}
                >
                  <Heart size={17} />
                </button>
                <button
                  className="assistant-entry"
                  aria-label={t.bartender}
                  onClick={() => setChatOpen(true)}
                >
                  <Sparkles size={17} />
                  <span>{c.assistant}</span>
                </button>
              </div>
            </div>
            <div className="mobile-categories">
              <button
                className={category === "all" ? "selected" : ""}
                onClick={() => setCategory("all")}
              >
                {t.all}
              </button>
              {bar.categories.map((c) => (
                <button
                  key={c.id}
                  className={category === c.id ? "selected" : ""}
                  onClick={() => setCategory(c.id)}
                >
                  {c.names[lang] || c.name}
                </button>
              ))}
            </div>
            <div className="search-row">
              <label className="search-box">
                <Search size={19} />
                <input
                  type="search"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder={t.search}
                  aria-label={t.search}
                />
                {query && (
                  <button aria-label={t.clear} onClick={() => setQuery("")}>
                    <X size={16} />
                  </button>
                )}
              </label>
              <button
                aria-label={t.filters}
                className={"filter-button " + (activeFilters ? "active" : "")}
                onClick={() => setSheet("filters")}
              >
                <SlidersHorizontal size={18} />
                <span>{t.filters}</span>
                {activeFilters > 0 && <b>{activeFilters}</b>}
              </button>
            </div>
            {(popular || query || activeFilters > 0 || category !== "all") && (
              <button className="clear-filter compact-clear" onClick={clear}>
                {t.clear}
                <X size={12} />
              </button>
            )}
            {filtered.length ? (
              <div className="product-grid">
                {filtered.map((p, i) => (
                  <ProductCard
                    key={bar.id + p.id}
                    p={p}
                    bar={bar}
                    lang={lang}
                    currency={currency}
                    saved={saved.includes(p.id)}
                    onSave={() => save(p.id)}
                    onPair={jump}
                    track={event}
                    highlight={focused === p.id}
                    index={i}
                    order={order}
                    onQuantity={adjust}
                  />
                ))}
              </div>
            ) : (
              <div className="empty">
                <span className="empty-icon">
                  {tab === "saved" ? <Heart /> : <Search />}
                </span>
                <h3>{tab === "saved" ? t.emptySaved : t.empty}</h3>
                <p>{tab === "saved" ? t.emptySavedHelp : t.emptyHelp}</p>
                {tab !== "saved" && (
                  <button className="primary" onClick={clear}>
                    {t.clear}
                  </button>
                )}
              </div>
            )}
            <div className="catalog-footer">
              <span className="small-mark">
                {bar.name === "CRAFTED" ? "CRAFTED" : "L’"}
              </span>
              <p>
                {bar.baseCurrency === "USD"
                  ? {
                      es: "Los precios en MXN/EUR son de referencia. El cobro se realiza en USD.",
                      en: "MXN/EUR prices are estimates. Payment is in USD.",
                      fr: "Prix MXN/EUR indicatifs. Paiement en USD.",
                      zh: "墨西哥比索和欧元价格仅供参考，结账以美元为准。",
                      ru: "Цены в MXN/EUR справочные. Оплата в USD.",
                    }[lang]
                  : t.notice}
              </p>
              <p>{bar.demo ? t.demo : bar.rateDate}</p>
              <p>{t.allergy}</p>
              <div>
                <a href="/admin">{t.admin}</a>
                <button onClick={share}>
                  {t.share}
                  <Share2 size={12} />
                </button>
              </div>
            </div>
          </section>
        </div>
      </main>
      <Modal
        open={sheet === "lang"}
        onClose={() => setSheet("")}
        title="Idioma · Language"
      >
        <div className="choice-grid">
          {langs.map((l) => (
            <button
              key={l}
              className={l === lang ? "selected" : ""}
              onClick={() => {
                setLang(l);
                setSheet("");
                event("language", "", l);
                setMessages([]);
              }}
            >
              <span className="flag">{flags[l]}</span>
              <strong>{languageNames[l]}</strong>
              <small>{l.toUpperCase()}</small>
              {lang === l && <Check size={15} />}
            </button>
          ))}
        </div>
      </Modal>
      <Modal
        open={sheet === "currency"}
        onClose={() => setSheet("")}
        title={lang === "es" ? "Moneda" : "Currency"}
      >
        <div className="choice-list">
          {["MXN", "USD", "EUR"].map((c) => (
            <button
              key={c}
              className={currency === c ? "selected" : ""}
              onClick={() => {
                setCurrency(c);
                setSheet("");
                event("currency", "", c);
              }}
            >
              <strong>
                {c === "EUR" ? "€" : "$"} {c}
              </strong>
              <span>
                {c === "MXN"
                  ? "Peso mexicano"
                  : c === "USD"
                    ? "US Dollar"
                    : "Euro"}
              </span>
              {currency === c && <Check size={16} />}
            </button>
          ))}
        </div>
        <p className="modal-note">
          {bar.baseCurrency === "USD"
            ? {
                es: "Los precios en MXN/EUR son de referencia. El cobro se realiza en USD.",
                en: "MXN/EUR prices are estimates. Payment is in USD.",
                fr: "Prix MXN/EUR indicatifs. Paiement en USD.",
                zh: "墨西哥比索和欧元价格仅供参考，结账以美元为准。",
                ru: "Цены в MXN/EUR справочные. Оплата в USD.",
              }[lang]
            : t.notice}
        </p>
      </Modal>
      <Modal
        open={sheet === "filters"}
        onClose={() => setSheet("")}
        title={t.filters}
      >
        <div className="filter-fields">
          <label>
            {t.style}
            <select value={style} onChange={(e) => setStyle(e.target.value)}>
              <option value="">{t.all}</option>
              {Array.from(
                new Set(
                  bar.products
                    .filter(
                      (p) =>
                        p.family === "beer" ||
                        ["tap", "bottle"].includes(p.category),
                    )
                    .map((p) => p.style),
                ),
              ).map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
          </label>
          <label>
            {t.bitterness}
            <select value={bitter} onChange={(e) => setBitter(e.target.value)}>
              <option value="">{t.all}</option>
              <option value="low">{t.low}</option>
              <option value="medium">{t.medium}</option>
              <option value="high">{t.high}</option>
            </select>
          </label>
          <label>
            {t.alcohol}
            <select
              value={alcohol}
              onChange={(e) => setAlcohol(e.target.value)}
            >
              <option value="">{t.all}</option>
              <option value="soft">{t.soft}</option>
              <option value="strong">{t.strong}</option>
              <option value="zero">{t.zero}</option>
            </select>
          </label>
          <label>
            {t.profile}
            <select
              value={profile}
              onChange={(e) => setProfile(e.target.value)}
            >
              <option value="">{t.all}</option>
              {Array.from(new Set(bar.products.map((p) => p.profile))).map(
                (p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ),
              )}
            </select>
          </label>
          <button className="primary" onClick={() => setSheet("")}>
            {t.apply}
            <ArrowRight size={17} />
          </button>
          <button className="text-button" onClick={clear}>
            {t.clear}
          </button>
        </div>
      </Modal>
      <Modal
        open={chatOpen}
        onClose={() => setChatOpen(false)}
        title={t.bartender}
        className="chat-modal"
      >
        <div className="chat-subhead">
          <span className="live-dot" />
          {t.catalog}
        </div>
        <div className="chat-messages" aria-live="polite">
          <div className="assistant-message">
            <span className="assistant-avatar">
              <Sparkles size={17} />
            </span>
            <div>
              <p>{t.intro}</p>
              <div className="chat-prompts">
                {[t.prompt1, t.prompt2, t.prompt3].map((q) => (
                  <button key={q} disabled={busy} onClick={() => ask(q)}>
                    {q}
                    <ArrowUpRight size={13} />
                  </button>
                ))}
              </div>
            </div>
          </div>
          {messages.map((m, i) => (
            <div
              key={i}
              className={
                m.role === "user" ? "user-message" : "assistant-message"
              }
            >
              {m.role === "assistant" && (
                <span className="assistant-avatar">
                  <Sparkles size={16} />
                </span>
              )}
              <div>
                <p>{m.text}</p>
                {m.plan && (
                  <div className="plan-total">
                    <strong>
                      {lang === "es"
                        ? "Propuesta para compartir"
                        : lang === "en"
                          ? "Sharing suggestion"
                          : lang === "fr"
                            ? "À partager"
                            : lang === "zh"
                              ? "分享建议"
                              : "На компанию"}{" "}
                      · {money(m.plan.totalMXN, currency, bar)} {currency}
                    </strong>
                    <small>
                      {lang === "es"
                        ? "Una unidad de cada opción. Confirma con el personal si las porciones alcanzan para tu grupo."
                        : lang === "en"
                          ? "One of each option. Confirm portions with staff."
                          : lang === "fr"
                            ? "Une unité de chaque. Confirmez les portions auprès du personnel."
                            : lang === "zh"
                              ? "每款一份，请向工作人员确认份量。"
                              : "По одной порции каждой позиции. Уточните размер порций у персонала."}
                    </small>
                  </div>
                )}
                {m.ids?.map((id) => {
                  const p = bar.products.find((p) => p.id === id);
                  if (!p) return null;
                  return (
                    <button
                      key={id}
                      className="chat-product"
                      onClick={() => {
                        setChatOpen(false);
                        jump(id);
                      }}
                    >
                      <img src={p.image || "/images/beer.jpg"} alt="" />
                      <span>
                        <strong>{localProduct(p, lang).name}</strong>
                        <small>{localProduct(p, lang).style}</small>
                        <b>
                          {money(p.price, currency, bar)}{" "}
                          <small>{currency}</small>
                        </b>
                      </span>
                      <ArrowUpRight size={17} />
                    </button>
                  );
                })}
                {m.mode && (
                  <small className="chat-mode">
                    {m.mode === "ai" ? t.ai : t.catalog}
                  </small>
                )}
              </div>
            </div>
          ))}
          {busy && (
            <p className="typing">
              <span /> {t.loading}
            </p>
          )}
          <div ref={chatEnd} />
        </div>
        <form
          className="chat-form"
          onSubmit={(e) => {
            e.preventDefault();
            ask(input);
          }}
        >
          <input
            maxLength={800}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={t.placeholder}
            aria-label={t.placeholder}
          />
          <button aria-label={t.send} disabled={busy || !input.trim()}>
            <Send size={19} />
          </button>
        </form>
        <small className="privacy-note">{t.privacy}</small>
      </Modal>
      {count > 0 && (
        <div className="order-island" role="region" aria-label={c.review}>
          <button
            className="order-preview"
            aria-label={c.view}
            onClick={() => setSheet("order")}
          >
            <span className="order-count">{count}</span>
            <span>
              <small>{c.review}</small>
              <strong>{money(total, currency, bar)}</strong>
            </span>
          </button>
          <button
            className="order-send"
            onClick={() => {
              setNameError(false);
              setSheet("order");
            }}
          >
            {c.order}
            <ArrowRight size={17} />
          </button>
        </div>
      )}
      <Modal
        open={sheet === "order"}
        onClose={() => setSheet("")}
        title={c.review}
        className="order-modal"
      >
        <form className="order-body" onSubmit={goToWhatsApp}>
          {lines.length ? (
            lines.map((l) => (
              <div className="order-line" key={l.id + ":" + l.option}>
                <img src={l.product.image} alt="" />
                <div>
                  <strong>{l.name}</strong>
                  <small>{displaySize(l.label, lang)}</small>
                  <b>{money(l.price * l.quantity, currency, bar)}</b>
                </div>
                <Quantity
                  quantity={l.quantity}
                  onChange={(delta) => adjust(l.id, l.option, delta)}
                  lang={lang}
                  name={l.name}
                />
              </div>
            ))
          ) : (
            <p>{c.empty}</p>
          )}
          {lines.length > 0 && (
            <>
              <label className="customer-name-field">
                {c.name}
                <input
                  required
                  autoComplete="given-name"
                  maxLength={80}
                  placeholder={c.namePlaceholder}
                  value={customerName}
                  aria-invalid={nameError || undefined}
                  onChange={(e) => {
                    setCustomerName(e.target.value);
                    setNameError(false);
                  }}
                />
                {nameError && <small role="alert">{c.nameRequired}</small>}
              </label>
              <label>
                {c.table}
                <input
                  maxLength={40}
                  value={table}
                  onChange={(e) => {
                    setTable(e.target.value);
                    try {
                      sessionStorage.setItem(
                        "crafted-table-" + bar.id,
                        e.target.value,
                      );
                    } catch {}
                  }}
                />
              </label>
              <label>
                {c.notes}
                <textarea
                  maxLength={600}
                  rows={2}
                  value={orderNotes}
                  onChange={(e) => setOrderNotes(e.target.value)}
                />
              </label>
              <div className="order-subtotal">
                <span>{c.subtotal}</span>
                <strong>
                  {money(total, bar.baseCurrency || "MXN", bar)}{" "}
                  {bar.baseCurrency || "MXN"}
                </strong>
              </div>
              <p className="order-disclaimer">{c.disclaimer}</p>
              {wa ? (
                <button
                  type="submit"
                  className="primary"
                  disabled={!customerName.trim()}
                >
                  {c.order}
                  <ArrowUpRight size={17} />
                </button>
              ) : (
                <p className="notice-box">{c.unavailable}</p>
              )}
              <button
                type="button"
                className="text-button"
                onClick={async () => {
                  try {
                    await navigator.clipboard.writeText(message);
                    setToast(c.copied);
                  } catch {
                    setToast(t.retry);
                  }
                }}
              >
                {c.copy}
              </button>
            </>
          )}
        </form>
      </Modal>
      {toast && (
        <div className="toast" role="status">
          <Check size={16} />
          {toast}
        </div>
      )}
    </div>
  );
}
function ProductCard({
  p,
  bar,
  lang,
  currency,
  saved,
  onSave,
  onPair,
  track,
  highlight,
  index,
  order,
  onQuantity,
}: {
  p: Product;
  bar: Bar;
  lang: Lang;
  currency: string;
  saved: boolean;
  onSave: () => void;
  onPair: (id: string) => void;
  track: (kind: string, id: string) => void;
  highlight: boolean;
  index: number;
  order: OrderLine[];
  onQuantity: (id: string, option: number, delta: number) => void;
}) {
  const [flipped, setFlipped] = useState(false);
  const [option, setOption] = useState(0);
  const selection = p.options?.[option];
  const shownPrice = selection?.price ?? p.price;
  const c = customer[lang];
  const quantity =
    order.find((l) => l.id === p.id && l.option === option)?.quantity || 0;
  const ref = useRef<HTMLElement>(null),
    video = useRef<HTMLVideoElement>(null),
    viewed = useRef(false);
  const t = ui[lang],
    item = localProduct(p, lang),
    pair = bar.products.find((v) => v.id === p.pairing && v.available),
    missing =
      lang !== "es" &&
      ["description", "ingredients", "preparation"].some(
        (k) => !(p.translations[lang] as any)?.[k],
      );
  useEffect(() => {
    const ob = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            if (!viewed.current) {
              track("view", p.id);
              viewed.current = true;
            }
            if (
              !matchMedia("(prefers-reduced-motion: reduce)").matches &&
              !(navigator as any).connection?.saveData
            )
              video.current?.play().catch(() => {});
          } else video.current?.pause();
        }
      },
      { threshold: 0.6 },
    );
    if (ref.current) ob.observe(ref.current);
    return () => ob.disconnect();
  }, [p.id]);
  return (
    <article
      ref={ref}
      id={"product-" + p.id}
      className={
        "product-card " +
        (flipped ? "flipped " : "") +
        (!p.available ? "unavailable " : "") +
        (highlight ? "highlight" : "")
      }
      style={{ animationDelay: `${Math.min(index, 6) * 40}ms` }}
    >
      <div className="card-inner">
        <div className="card-front" inert={flipped} aria-hidden={flipped}>
          <div className="product-media">
            <img
              src={p.image || "/images/beer.jpg"}
              alt={item.name}
              loading={index < 3 ? "eager" : "lazy"}
              onError={(e) => {
                if (!e.currentTarget.src.endsWith("/images/beer.jpg"))
                  e.currentTarget.src = "/images/beer.jpg";
              }}
            />
            {p.video && (
              <video
                ref={video}
                src={p.video}
                poster={p.image}
                muted
                loop
                playsInline
                preload="none"
              />
            )}
            <div className="media-shade" />
            {p.imagePending && <span className="photo-pending">{c.photo}</span>}
            {p.popular && (
              <span className="popular-badge">
                <Flame size={12} />
                {t.popular}
              </span>
            )}
            <button
              className={"heart-button " + (saved ? "saved" : "")}
              aria-label={t.save + " " + item.name}
              aria-pressed={saved}
              onClick={onSave}
            >
              <Heart size={18} fill={saved ? "currentColor" : "none"} />
            </button>
            <span className="volume-badge">
              {displaySize(selection?.label || p.size, lang)}
            </span>
            {!p.available && <span className="sold-overlay">{t.sold}</span>}
          </div>
          <div className="product-content">
            {p.options && p.options.length > 1 && (
              <select
                className="portion-select"
                aria-label={c.size + " · " + item.name}
                value={option}
                onChange={(e) => setOption(Number(e.target.value))}
              >
                {p.options.map((o, i) => (
                  <option value={i} key={i}>
                    {o.label} · {money(o.price, currency, bar)}
                  </option>
                ))}
              </select>
            )}
            <div className="product-style">{item.style}</div>
            <h3>{item.name}</h3>
            <p className="product-description">{item.description}</p>
            <div className="product-specs">
              {p.abv > 0 && p.abvKnown !== false ? (
                <>
                  <span>
                    <b>{p.abv}%</b> ABV
                  </span>
                  {p.ibuKnown !== false &&
                    (p.family === "beer" ||
                      ["tap", "bottle"].includes(p.category)) && (
                      <>
                        <i />
                        <span>
                          <b>{p.ibu}</b> IBU
                        </span>
                      </>
                    )}
                </>
              ) : (
                <span>
                  {p.category === "zero" ? t.zero : displaySize(p.size, lang)}
                </span>
              )}
              <span className="profile-label">
                {profiles[p.profile]?.[langs.indexOf(lang)] || p.profile}
              </span>
            </div>
            <div className="product-bottom">
              <strong>
                {p.priceKnown === false ? (
                  c.unknown
                ) : (
                  <Price value={shownPrice} currency={currency} bar={bar} />
                )}
              </strong>
              <button
                className="detail-button"
                onClick={() => {
                  setFlipped(true);
                  track("flip", p.id);
                }}
                aria-label={t.details + " " + item.name}
              >
                <RotateCw size={15} />
                <span>{t.details}</span>
              </button>
            </div>
            <div className="product-choice">
              {quantity > 0 ? (
                <Quantity
                  quantity={quantity}
                  onChange={(delta) => onQuantity(p.id, option, delta)}
                  lang={lang}
                  name={item.name}
                />
              ) : (
                <button
                  className="choose-button"
                  disabled={!p.available || p.priceKnown === false}
                  onClick={() => onQuantity(p.id, option, 1)}
                >
                  {c.choose}
                  <Plus size={16} />
                </button>
              )}
            </div>
          </div>
        </div>
        <div className="card-back" inert={!flipped} aria-hidden={!flipped}>
          <div className="back-heading">
            <span className="overline">{item.style}</span>
            <button
              className="icon-button"
              aria-label={t.back}
              onClick={() => setFlipped(false)}
            >
              <X size={18} />
            </button>
          </div>
          <h3>{item.name}</h3>
          <div className="back-scroll">
            {missing && <p className="translation-note">{t.missing}</p>}
            <h4>{t.ingredients}</h4>
            <p>{item.ingredients}</p>
            <h4>{t.preparation}</h4>
            <p>{item.preparation}</p>
            <h4>{t.allergens}</h4>
            <div className="allergen-list">
              {p.allergens.map((a) => (
                <span key={a}>
                  {allergenNames[a]?.[langs.indexOf(lang)] || a}
                </span>
              ))}
            </div>
            <p className="allergy-note">{t.allergy}</p>
          </div>
          {pair && (
            <button className="pairing" onClick={() => onPair(pair.id)}>
              <span>
                {t.pairing}
                <strong>
                  {localProduct(pair, lang).name} ·{" "}
                  {money(pair.price, currency, bar)}
                </strong>
              </span>
              <ArrowUpRight size={18} />
            </button>
          )}
          <button className="back-button" onClick={() => setFlipped(false)}>
            <ArrowLeft size={15} />
            {t.back}
          </button>
        </div>
      </div>
    </article>
  );
}

function Quantity({
  quantity,
  onChange,
  lang,
  name,
}: {
  quantity: number;
  onChange: (delta: number) => void;
  lang: Lang;
  name: string;
}) {
  const c = customer[lang];
  return (
    <div className="quantity-control">
      <button
        type="button"
        aria-label={c.remove + " " + name}
        onClick={() => onChange(-1)}
      >
        <Minus size={16} />
      </button>
      <output aria-live="polite">{quantity}</output>
      <button
        type="button"
        disabled={quantity >= 99}
        aria-label={c.add + " " + name}
        onClick={() => onChange(1)}
      >
        <Plus size={16} />
      </button>
    </div>
  );
}

function Instagram({ size = 16 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      aria-hidden="true"
    >
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.3" cy="6.7" r=".8" fill="currentColor" stroke="none" />
    </svg>
  );
}
