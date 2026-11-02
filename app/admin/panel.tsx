"use client";
import { crafted } from "../../lib/crafted";
import TableManager from "../../components/table-manager";
import { useState, useEffect } from "react";
import {
  ArrowLeft,
  ArrowUpRight,
  ArrowUp,
  ArrowDown,
  Plus,
  Search,
  Save,
  Settings2,
  Palette,
  LayoutGrid,
  BarChart3,
  Beer,
  Check,
  Copy,
  Trash2,
  Edit3,
  Upload,
  Image as ImageIcon,
  Film,
  GripVertical,
  Eye,
  ExternalLink,
  LogOut,
  RefreshCw,
  Languages,
  Sparkles,
  X,
  LoaderCircle,
  Download,
  ShieldCheck,
  AlertCircle,
  FolderPlus,
} from "lucide-react";
import type { Bar, Product, Lang, Category } from "../../lib/types";
import { demo } from "../../lib/seed";
import { safeAccent, money, langs, normalize } from "../../lib/menu";
import Modal from "../../components/modal";
import { newId } from "../../lib/client-id";
const emptyProduct = (bar: Bar): Product => ({
  id: "p-" + newId(),
  name: "",
  category: bar.categories[0].id,
  style: "",
  description: "",
  ingredients: "",
  preparation: "",
  price: 0,
  size: "",
  abv: 0,
  ibu: 0,
  profile: "suave",
  allergens: [],
  popular: false,
  available: true,
  image: "",
  video: "",
  pairing: "",
  translations: {},
});
export default function Admin() {
  const [identityLang, setIdentityLang] = useState<Lang>("es"),
    [autoTranslate, setAutoTranslate] = useState(true);
  const [bar, setBar] = useState<Bar | null>(null),
    [loading, setLoading] = useState(true),
    [auth, setAuth] = useState(false),
    [sample, setSample] = useState(false),
    [view, setView] = useState("catalog"),
    [dirty, setDirty] = useState(false),
    [saving, setSaving] = useState(false),
    [toast, setToast] = useState(""),
    [error, setError] = useState(""),
    [query, setQuery] = useState(""),
    [catFilter, setCatFilter] = useState("all"),
    [editing, setEditing] = useState<Product | null>(null),
    [editLang, setEditLang] = useState<Lang>("es"),
    [deleteId, setDeleteId] = useState(""),
    [catEdit, setCatEdit] = useState<Category | null>(null),
    [analytics, setAnalytics] = useState<any[]>([]),
    [drag, setDrag] = useState(""),
    [uploading, setUploading] = useState(""),
    [copied, setCopied] = useState(false);
  useEffect(() => {
    fetch("/api/bootstrap")
      .then((r) => r.json())
      .then((d: any) => {
        setAuth(!!d.authenticated);
        if (d.bar) {
          const oldPhone =
            d.bar.website === "https://craftedkt.com/" &&
            (!d.bar.whatsappNumber ||
              d.bar.whatsappNumber.replace(/^\+/, "") === "525538601646");
          setBar(
            oldPhone ? { ...d.bar, whatsappNumber: "18323165870" } : d.bar,
          );
          if (oldPhone) setDirty(true);
        }
      })
      .catch(() => setError("No pudimos conectar. Inténtalo de nuevo."))
      .finally(() => setLoading(false));
  }, []);
  useEffect(() => {
    const fn = (e: BeforeUnloadEvent) => {
      if (dirty) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", fn);
    return () => window.removeEventListener("beforeunload", fn);
  }, [dirty]);
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(""), 3500);
    return () => clearTimeout(timer);
  }, [toast]);
  useEffect(() => {
    if (view === "analytics" && bar && !sample) loadStats();
  }, [view, bar?.id]);
  function patch(update: Partial<Bar>) {
    if (!bar) return;
    setBar({ ...bar, ...update });
    setDirty(true);
    setError("");
  }
  async function create() {
    setSaving(true);
    setError("");
    try {
      const r = await fetch("/api/bootstrap", { method: "POST" }),
        d: any = await r.json();
      if (!r.ok) throw new Error(d.error);
      setBar(d.bar);
      setToast("Tu menú ya está creado. Personalízalo antes de compartir.");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSaving(false);
    }
  }
  async function save(next = bar) {
    if (!next || saving) return;
    setSaving(true);
    setError("");
    if (sample) {
      setBar(next);
      setDirty(false);
      setToast("Cambio aplicado en la prueba. Inicia sesión para guardarlo.");
      setSaving(false);
      return;
    }
    try {
      const r = await fetch("/api/catalog", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(next),
        }),
        d: any = await r.json();
      if (!r.ok) throw new Error(d.error);
      setBar(d.bar);
      setDirty(false);
      setToast("Menú guardado. Los cambios ya están disponibles.");
    } catch (e) {
      setError((e as Error).message);
      setDirty(true);
    } finally {
      setSaving(false);
    }
  }
  function trial() {
    setBar({ ...structuredClone(crafted), slug: "mi-bar-ejemplo" });
    setSample(true);
  }
  async function loadStats() {
    try {
      const r = await fetch("/api/events");
      const d: any = await r.json();
      if (!r.ok) throw new Error(d.error);
      setAnalytics(d.events || []);
    } catch (e) {
      setError((e as Error).message);
    }
  }
  async function updateProduct() {
    if (!bar || !editing) return;
    if (!editing.name.trim() || editing.price < 0) {
      setError("Añade un nombre y un precio válido.");
      return;
    }
    let product = editing;
    const original = bar.products.find((p) => p.id === editing.id);
    const changed =
      !original ||
      ["name", "style", "description", "ingredients", "preparation"].some(
        (k) => (original as any)[k] !== (editing as any)[k],
      );
    let pending = false;
    if (autoTranslate && changed && !sample) {
      setUploading("translate");
      try {
        const r = await fetch("/api/translate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sourceLanguage: bar?.sourceLanguage || "es",
            name: editing.name,
            style: editing.style,
            description: editing.description,
            ingredients: editing.ingredients,
            preparation: editing.preparation,
          }),
        });
        const d: any = await r.json();
        if (r.ok) product = { ...editing, translations: d.translations };
        else pending = true;
      } catch {
        pending = true;
      } finally {
        setUploading("");
      }
    }
    const list = bar.products.some((p) => p.id === product.id)
      ? bar.products.map((p) => (p.id === product.id ? product : p))
      : [...bar.products, product];
    patch({ products: list });
    setEditing(null);
    setToast(
      pending
        ? "Producto aplicado. La traducción automática no está conectada o falló."
        : "Producto listo. Guarda el menú para aplicar los cambios.",
    );
  }
  function setSpanish(key: string, value: string) {
    setEditing((p) => {
      if (!p) return p;
      const translations = Object.fromEntries(
        Object.entries(p.translations).map(([l, t]) => [
          l,
          { ...t, [key]: "" },
        ]),
      );
      return { ...p, [key]: value, translations };
    });
  }
  function moveProduct(id: string, delta: number) {
    if (!bar) return;
    const list = [...bar.products],
      index = list.findIndex((p) => p.id === id),
      target = index + delta;
    if (target < 0 || target >= list.length) return;
    [list[index], list[target]] = [list[target], list[index]];
    patch({ products: list });
  }
  function moveCategory(id: string, delta: number) {
    if (!bar) return;
    const list = [...bar.categories],
      index = list.findIndex((c) => c.id === id),
      target = index + delta;
    if (target < 0 || target >= list.length) return;
    [list[index], list[target]] = [list[target], list[index]];
    patch({ categories: list });
  }
  async function upload(file: File, target: string) {
    if (!bar) return;
    if (sample) {
      setToast("La carga necesita una sesión para guardar el archivo.");
      return;
    }
    setUploading(target);
    setError("");
    try {
      let source = file;
      if (file.type.startsWith("image/")) source = await compressImage(file);
      const form = new FormData();
      form.append("file", source);
      const r = await fetch("/api/upload", { method: "POST", body: form }),
        d: any = await r.json();
      if (!r.ok) throw new Error(d.error);
      if (target === "image" || target === "video")
        setEditing((p) => (p ? { ...p, [target]: d.url } : null));
      else {
        let extra: any = {};
        if (target === "logo") extra.accent = await extractColor(file);
        patch({ [target]: d.url, ...extra });
      }
      setToast("Archivo cargado. Guarda los cambios del menú.");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setUploading("");
    }
  }
  async function translate() {
    if (!editing) return;
    setUploading("translate");
    setError("");
    try {
      const r = await fetch("/api/translate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sourceLanguage: bar?.sourceLanguage || "es",
            name: editing.name,
            style: editing.style,
            description: editing.description,
            ingredients: editing.ingredients,
            preparation: editing.preparation,
          }),
        }),
        d: any = await r.json();
      if (!r.ok) throw new Error(d.error);
      setEditing({ ...editing, translations: d.translations });
      setToast("Traducciones listas. Revísalas antes de guardar.");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setUploading("");
    }
  }
  async function rates() {
    setUploading("rates");
    try {
      const r = await fetch("/api/rates", { method: "POST" }),
        d: any = await r.json();
      if (!r.ok) throw new Error(d.error);
      patch({ rates: d.rates, rateDate: d.date, rateMode: "auto" });
      setToast("Tasas actualizadas. Guarda para aplicarlas.");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setUploading("");
    }
  }
  const color = bar ? safeAccent(bar.accent) : "#e9b56b";
  const count = (kind: string) =>
    analytics.filter((e) => e.kind === kind).reduce((n, e) => n + e.count, 0);
  if (loading)
    return (
      <div className="admin-loading">
        <LoaderCircle className="spin" />
        <p>Cargando tu barra…</p>
      </div>
    );
  if (!bar)
    return (
      <div className="admin-onboarding">
        <a className="back-link" href="/">
          <ArrowLeft size={17} />
          Volver al menú
        </a>
        <div className="onboarding-card">
          <span className="info-brand">L’</span>
          <span className="overline">EL CONTROL DE TU BARRA</span>
          <h1>
            Tu menú.
            <br />
            <em>A tu manera.</em>
          </h1>
          <p>
            Actualiza precios, marca un barril agotado y haz que cada producto
            se vea como merece.
          </p>
          <div className="onboarding-features">
            <span>
              <Check size={17} />
              Menú para teléfonos
            </span>
            <span>
              <Check size={17} />
              Cambios en un solo lugar
            </span>
            <span>
              <Check size={17} />
              Acceso protegido
            </span>
          </div>
          {auth ? (
            <button className="primary" disabled={saving} onClick={create}>
              {saving ? (
                <LoaderCircle className="spin" size={18} />
              ) : (
                <Plus size={18} />
              )}
              Crear mi menú
            </button>
          ) : (
            <a
              className="primary"
              href="/signin-with-chatgpt?return_to=%2Fadmin"
              target="_top"
            >
              Iniciar sesión con ChatGPT
              <ArrowUpRight size={18} />
            </a>
          )}
          <button className="text-button" onClick={trial}>
            Explorar el panel con datos de ejemplo
            <ArrowRightIcon />
          </button>
          {error && <div className="error-box">{error}</div>}
          <small>
            El menú inicial incluye ejemplos. Cámbialos por tu catálogo real.
          </small>
        </div>
      </div>
    );
  const visible = bar.products.filter(
    (p) =>
      (catFilter === "all" || p.category === catFilter) &&
      normalize(p.name + " " + p.style).includes(normalize(query)),
  );
  const nav = [
    ["catalog", LayoutGrid, "Productos"],
    ["categories", FolderPlus, "Categorías"],
    ["identity", Palette, "Identidad"],
    ["tables", LayoutGrid, "Mesas y pedidos"],
    ["settings", Settings2, "Divisas y asistente"],
    ["analytics", BarChart3, "Estadísticas"],
  ];
  const link =
    typeof window !== "undefined"
      ? window.location.origin + "/b/" + bar.slug
      : "/b/" + bar.slug;
  return (
    <div
      className="admin-app"
      style={{ "--accent": color } as React.CSSProperties}
    >
      <aside className="admin-sidebar">
        <a className="wordmark" href="/">
          <img
            src={bar.logo}
            alt=""
            width={42}
            height={42}
            style={{ objectFit: "contain", borderRadius: 6 }}
          />
          <span>
            {bar.name}
            <small>PANEL DEL NEGOCIO</small>
          </span>
        </a>
        <div className="business-chip">
          <span>
            {bar.logo ? <img src={bar.logo} alt="" /> : <Beer size={22} />}
          </span>
          <div>
            <strong>{bar.name}</strong>
            <small>
              {bar.demo ? "Catálogo de ejemplo" : "Tu menú digital"}
            </small>
          </div>
        </div>
        <nav>
          {nav.map(([id, Icon, label]: any) => (
            <button
              className={view === id ? "active" : ""}
              key={id}
              onClick={() => {
                setView(id);
                setError("");
              }}
            >
              <Icon size={18} />
              {label}
            </button>
          ))}
        </nav>
        <a
          className="preview-link"
          href={sample ? "/preview" : link}
          target="_blank"
          rel="noreferrer"
        >
          <Eye size={17} />
          Ver menú
          <ArrowUpRight size={15} />
        </a>
        <div className="admin-sidebar-bottom">
          <ShieldCheck size={16} />
          <span>{sample ? "Modo de prueba" : "Sesión protegida"}</span>
          {!sample && (
            <a
              title="Cerrar sesión"
              href="/signout-with-chatgpt?return_to=%2F"
              target="_top"
            >
              <LogOut size={16} />
            </a>
          )}
        </div>
      </aside>
      <div className="admin-main">
        <header className="admin-topbar">
          <div className="breadcrumbs">
            La Barra<span>/</span>
            <strong>{nav.find((n) => n[0] === view)?.[2] as string}</strong>
          </div>
          <div className="admin-header-actions">
            <a
              className="secondary compact"
              href={sample ? "/preview" : link}
              target="_blank"
              rel="noreferrer"
            >
              <Eye size={16} />
              <span>Ver menú</span>
            </a>
            <button
              className="primary compact"
              disabled={saving || !dirty}
              onClick={() => save()}
            >
              {saving ? (
                <LoaderCircle className="spin" size={16} />
              ) : (
                <Save size={16} />
              )}
              <span>{saving ? "Guardando…" : "Guardar cambios"}</span>
            </button>
          </div>
        </header>
        <nav className="admin-mobile-nav">
          {nav.map(([id, Icon, label]: any) => (
            <button
              className={view === id ? "active" : ""}
              key={id}
              onClick={() => setView(id)}
            >
              <Icon size={17} />
              {label}
            </button>
          ))}
        </nav>
        {sample && (
          <div className="sample-banner">
            <InfoIcon />
            Estás probando el panel. Los cambios duran mientras permanezcas
            aquí.
            <a href="/signin-with-chatgpt?return_to=%2Fadmin" target="_top">
              Iniciar sesión
            </a>
          </div>
        )}
        {error && (
          <div role="alert" className="error-box admin-error">
            <AlertCircle size={18} />
            {error}
            <button
              className="icon-button"
              aria-label="Cerrar aviso"
              onClick={() => setError("")}
            >
              <X size={16} />
            </button>
          </div>
        )}
        <div className="admin-content">
          {bar.demo && bar.name === "LA BARRA" && (
            <button
              className="primary"
              onClick={() => {
                setBar({
                  ...structuredClone(crafted),
                  id: bar.id,
                  slug: "crafted",
                  revision: bar.revision,
                });
                setDirty(true);
              }}
            >
              Cargar catálogo real de Crafted al borrador
            </button>
          )}
          <div className="admin-page-title">
            <div>
              <div className="overline">TU BARRA, AL DÍA</div>
              <h1>
                {view === "catalog"
                  ? "Un buen menú empieza aquí."
                  : view === "categories"
                    ? "Cada cosa en su lugar."
                    : view === "identity"
                      ? "Que se vea como tu bar."
                      : view === "tables"
                        ? "Cada pedido, en su mesa."
                        : view === "settings"
                          ? "Los detalles hacen la diferencia."
                          : "Conoce lo que más interesa."}
              </h1>
              <p>
                {view === "catalog"
                  ? "Cuida tu carta. Tus clientes verán los cambios al guardar."
                  : view === "analytics"
                    ? "Actividad registrada en los últimos 30 días. Sin cifras de ejemplo."
                    : "Edita los datos y guarda para actualizar el menú."}
              </p>
            </div>
            {dirty && (
              <span className="dirty-badge">
                <span />
                Cambios sin guardar
              </span>
            )}
          </div>
          {view === "catalog" && (
            <>
              <div className="stat-grid">
                <Stat
                  label="Productos en el menú"
                  value={bar.products.length}
                  icon={<LayoutGrid />}
                />
                <Stat
                  label="Disponibles ahora"
                  value={bar.products.filter((p) => p.available).length}
                  icon={<Beer />}
                />
                <Stat
                  label="Más pedidos destacados"
                  value={bar.products.filter((p) => p.popular).length}
                  icon={<Sparkles />}
                />
                <Stat
                  label="Categorías"
                  value={bar.categories.length}
                  icon={<FolderPlus />}
                />
              </div>
              <div className="admin-toolbar">
                <label className="search-box">
                  <Search size={18} />
                  <input
                    aria-label="Buscar producto"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Buscar producto…"
                  />
                </label>
                <select
                  aria-label="Filtrar categoría"
                  value={catFilter}
                  onChange={(e) => setCatFilter(e.target.value)}
                >
                  <option value="all">Todas las categorías</option>
                  {bar.categories.map((c) => (
                    <option value={c.id} key={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
                <button
                  className="primary"
                  onClick={() => {
                    setEditing(emptyProduct(bar));
                    setEditLang(bar.sourceLanguage || "es");
                  }}
                >
                  <Plus size={18} />
                  Nuevo producto
                </button>
              </div>
              <div className="admin-product-list">
                <div className="table-head">
                  <span>PRODUCTO</span>
                  <span>CATEGORÍA</span>
                  <span>PRECIO</span>
                  <span>DISPONIBLE</span>
                  <span>ACCIONES</span>
                </div>
                {visible.map((p) => (
                  <div
                    className="admin-product-row"
                    key={p.id}
                    draggable
                    onDragStart={() => setDrag(p.id)}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => {
                      e.preventDefault();
                      if (!drag || drag === p.id) return;
                      const next = [...bar.products],
                        from = next.findIndex((v) => v.id === drag),
                        to = next.findIndex((v) => v.id === p.id);
                      const [item] = next.splice(from, 1);
                      next.splice(to, 0, item);
                      patch({ products: next });
                      setDrag("");
                    }}
                  >
                    <div className="admin-product-name">
                      <GripVertical size={15} className="drag-grip" />
                      <img src={p.image || "/images/beer.jpg"} alt="" />
                      <div>
                        <strong>{p.name}</strong>
                        <small>
                          {p.style} {p.popular && "· ★ Más pedido"}
                        </small>
                      </div>
                    </div>
                    <span className="table-category">
                      {bar.categories.find((c) => c.id === p.category)?.name}
                    </span>
                    <strong className="table-price">
                      {money(p.price, bar.baseCurrency || "MXN", bar)}
                    </strong>
                    <label className="availability">
                      <input
                        type="checkbox"
                        aria-label={
                          (p.available
                            ? "Marcar agotado "
                            : "Marcar disponible ") + p.name
                        }
                        checked={p.available}
                        disabled={saving}
                        onChange={() => {
                          const next = {
                            ...bar,
                            products: bar.products.map((v) =>
                              v.id === p.id
                                ? { ...v, available: !v.available }
                                : v,
                            ),
                          };
                          setBar(next);
                          setDirty(true);
                          save(next);
                        }}
                      />
                      <span className="switch" />
                      <small>{p.available ? "Sí" : "Agotado"}</small>
                    </label>
                    <div className="row-actions">
                      <button
                        className="icon-button"
                        title="Subir producto"
                        onClick={() => moveProduct(p.id, -1)}
                      >
                        <ArrowUp size={15} />
                      </button>
                      <button
                        className="icon-button"
                        title="Bajar producto"
                        onClick={() => moveProduct(p.id, 1)}
                      >
                        <ArrowDown size={15} />
                      </button>
                      <button
                        className="icon-button"
                        title="Editar producto"
                        onClick={() => {
                          setEditing(structuredClone(p));
                          setEditLang(bar.sourceLanguage || "es");
                        }}
                      >
                        <Edit3 size={16} />
                      </button>
                      <button
                        className="icon-button"
                        title="Duplicar producto"
                        onClick={() => {
                          setEditing({
                            ...structuredClone(p),
                            id: "p-" + newId(),
                            name: p.name + " (copia)",
                          });
                          setEditLang(bar.sourceLanguage || "es");
                        }}
                      >
                        <Copy size={16} />
                      </button>
                      <button
                        className="icon-button danger"
                        title="Eliminar producto"
                        onClick={() => setDeleteId(p.id)}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))}
                {!visible.length && (
                  <div className="empty">
                    <Search />
                    <h3>No hay productos</h3>
                    <p>Crea uno o cambia tu búsqueda.</p>
                  </div>
                )}
              </div>
              <p className="form-help">
                Arrastra las filas para ordenar. En teléfono, usa las flechas.
                El interruptor de disponibilidad guarda el menú completo.
              </p>
            </>
          )}
          {view === "categories" && (
            <div className="settings-card">
              <div className="settings-card-head">
                <div>
                  <h2>Categorías del menú</h2>
                  <p>El orden también se aplica en el menú del cliente.</p>
                </div>
                <button
                  className="primary"
                  onClick={() =>
                    setCatEdit({
                      id: "cat-" + newId(),
                      name: "",
                      names: {},
                      icon: "beer",
                    })
                  }
                >
                  <Plus size={17} />
                  Añadir
                </button>
              </div>
              <div className="category-list">
                {bar.categories.map((c, i) => (
                  <div key={c.id}>
                    <span className="category-number">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <span>
                      <strong>{c.name}</strong>
                      <small>
                        {bar.products.filter((p) => p.category === c.id).length}{" "}
                        productos
                      </small>
                    </span>
                    <button
                      className="icon-button"
                      title="Subir categoría"
                      onClick={() => moveCategory(c.id, -1)}
                    >
                      <ArrowUp size={16} />
                    </button>
                    <button
                      className="icon-button"
                      title="Bajar categoría"
                      onClick={() => moveCategory(c.id, 1)}
                    >
                      <ArrowDown size={16} />
                    </button>
                    <button
                      className="icon-button"
                      title="Editar categoría"
                      onClick={() => setCatEdit(structuredClone(c))}
                    >
                      <Edit3 size={16} />
                    </button>
                    <button
                      className="icon-button danger"
                      title="Eliminar categoría"
                      disabled={bar.categories.length <= 1}
                      onClick={() => {
                        if (bar.products.some((p) => p.category === c.id)) {
                          setError(
                            "Mueve o elimina los productos de esa categoría antes de borrarla.",
                          );
                          return;
                        }
                        patch({
                          categories: bar.categories.filter(
                            (v) => v.id !== c.id,
                          ),
                        });
                      }}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
          {view === "tables" && (
            <>
              <section className="settings-card order-settings-card">
                <h2>Pedidos por WhatsApp</h2>
                <p>
                  Este número recibe el mensaje cuando el cliente pulsa Enviar
                  en WhatsApp. No se confirma un pedido de forma automática.
                </p>
                <Field
                  label="WhatsApp con código de país"
                  value={bar.whatsappNumber || ""}
                  onChange={(v) =>
                    patch({
                      whatsappNumber: v.replace(/[^0-9+]/g, "") || undefined,
                    })
                  }
                />
                <small>
                  Crafted: +1 832 316 5870. Escribe código de país y número, sin
                  espacios.
                </small>
              </section>
              <TableManager
                menuUrl={link}
                count={bar.tableCount || 12}
                onCount={(n) => patch({ tableCount: n })}
                dirty={dirty}
                sample={sample}
              />
            </>
          )}
          {view === "identity" && (
            <div className="settings-grid">
              <section className="settings-card">
                <h2>Identidad del negocio</h2>
                <div className="editor-tabs identity-tabs">
                  {langs.map((l) => (
                    <button
                      key={l}
                      className={identityLang === l ? "active" : ""}
                      onClick={() => setIdentityLang(l)}
                    >
                      {l.toUpperCase()}
                    </button>
                  ))}
                </div>
                <p>Los cambios que guardes aparecen en el menú enlazado.</p>
                <Field
                  label="Instagram"
                  value={bar.instagram || ""}
                  onChange={(v) => patch({ instagram: v || undefined })}
                />
                <Field
                  label="Enlace de reseñas de Google"
                  value={bar.reviewUrl || ""}
                  onChange={(v) => patch({ reviewUrl: v || undefined })}
                />
                <div className="form-grid">
                  <Field
                    label="Nombre del bar"
                    value={bar.name}
                    onChange={(v) => patch({ name: v })}
                  />
                  <Field
                    label="Frase de bienvenida"
                    value={
                      identityLang === "es"
                        ? bar.tagline
                        : bar.translations?.[identityLang]?.tagline || ""
                    }
                    onChange={(v) =>
                      identityLang === "es"
                        ? patch({ tagline: v })
                        : patch({
                            translations: {
                              ...bar.translations,
                              [identityLang]: {
                                ...{ tagline: "", promotion: "", hours: "" },
                                ...bar.translations?.[identityLang],
                                tagline: v,
                              },
                            },
                          })
                    }
                  />
                  <Field
                    label="Ubicación"
                    value={bar.location}
                    onChange={(v) => patch({ location: v })}
                  />
                  <Field
                    label="Horario"
                    value={
                      identityLang === "es"
                        ? bar.hours
                        : bar.translations?.[identityLang]?.hours || ""
                    }
                    onChange={(v) =>
                      identityLang === "es"
                        ? patch({ hours: v })
                        : patch({
                            translations: {
                              ...bar.translations,
                              [identityLang]: {
                                ...{ tagline: "", promotion: "", hours: "" },
                                ...bar.translations?.[identityLang],
                                hours: v,
                              },
                            },
                          })
                    }
                  />
                  <Field
                    label="Promoción o mensaje del día"
                    value={
                      identityLang === "es"
                        ? bar.promotion
                        : bar.translations?.[identityLang]?.promotion || ""
                    }
                    onChange={(v) =>
                      identityLang === "es"
                        ? patch({ promotion: v })
                        : patch({
                            translations: {
                              ...bar.translations,
                              [identityLang]: {
                                ...{ tagline: "", promotion: "", hours: "" },
                                ...bar.translations?.[identityLang],
                                promotion: v,
                              },
                            },
                          })
                    }
                  />
                  <Field
                    label="Enlace del menú (fijo para conservar tus QR)"
                    readOnly={!sample}
                    value={bar.slug}
                    onChange={(v) =>
                      patch({
                        slug: v.toLowerCase().replace(/[^a-z0-9-]/g, ""),
                      })
                    }
                  />
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={bar.demo}
                      onChange={(e) => patch({ demo: e.target.checked })}
                    />
                    Mostrar aviso de menú de ejemplo
                  </label>
                </div>
              </section>
              <div>
                <section className="settings-card">
                  <h2>Color de la marca</h2>
                  <p>Ajustamos tonos oscuros para mejorar la lectura.</p>
                  <div className="color-picker">
                    <input
                      aria-label="Color de marca"
                      type="color"
                      value={bar.accent}
                      onChange={(e) => patch({ accent: e.target.value })}
                    />
                    <Field
                      label="Color hexadecimal"
                      value={bar.accent}
                      onChange={(v) =>
                        /^#[0-9a-fA-F]{0,6}$/.test(v) && patch({ accent: v })
                      }
                    />
                  </div>
                  <div className="color-preview" style={{ color: color }}>
                    Así se verá tu acento <Check size={19} />
                  </div>
                </section>
                <section className="settings-card">
                  <h2>Logo y portada</h2>
                  <p>
                    Las fotos se reducen en el teléfono antes de subir. Con
                    Cloudinary conectado también optimizamos los archivos en la
                    nube. Sin él, sube videos listos para web. Máximo 15 MB.
                  </p>
                  {[
                    ["logo", "Logotipo"],
                    ["banner", "Foto de portada"],
                    ["bannerVideo", "Video de portada"],
                  ].map(([key, label]) => (
                    <MediaField
                      key={key}
                      label={label}
                      value={(bar as any)[key]}
                      video={key === "bannerVideo"}
                      loading={uploading === key}
                      onChange={(v) => patch({ [key]: v })}
                      onUpload={(f) => upload(f, key)}
                    />
                  ))}
                </section>
              </div>
            </div>
          )}
          {view === "settings" && (
            <div className="settings-grid">
              <section className="settings-card">
                <h2>Divisas</h2>
                <p>
                  La moneda de cobro es {bar.baseCurrency || "MXN"}. Los otros
                  precios son de referencia.
                </p>
                <label>
                  Tipo de cambio
                  <select
                    value={bar.rateMode}
                    onChange={(e) => patch({ rateMode: e.target.value as any })}
                  >
                    <option value="manual">Tasa fija del negocio</option>
                    <option value="auto">Referencia externa</option>
                  </select>
                </label>
                <div className="form-grid">
                  <Field
                    label={
                      bar.baseCurrency === "USD"
                        ? "1 USD equivale a MXN"
                        : "1 MXN equivale a USD"
                    }
                    type="number"
                    step="0.000001"
                    value={
                      bar.baseCurrency === "USD"
                        ? bar.rates.MXN || 1
                        : bar.rates.USD
                    }
                    onChange={(v) =>
                      patch({
                        rates: {
                          ...bar.rates,
                          [bar.baseCurrency === "USD" ? "MXN" : "USD"]:
                            Number(v),
                        },
                      })
                    }
                  />
                  <Field
                    label={
                      "1 " + (bar.baseCurrency || "MXN") + " equivale a EUR"
                    }
                    type="number"
                    step="0.000001"
                    value={bar.rates.EUR}
                    onChange={(v) =>
                      patch({ rates: { ...bar.rates, EUR: Number(v) } })
                    }
                  />
                </div>
                {bar.rateMode === "auto" && (
                  <button
                    className="secondary"
                    disabled={!!uploading}
                    onClick={rates}
                  >
                    <RefreshCw
                      size={16}
                      className={uploading === "rates" ? "spin" : ""}
                    />
                    Consultar tasas de referencia
                  </button>
                )}
                <p className="form-help">
                  Última referencia: {bar.rateDate}. En modo automático se
                  consultan tasas al cargar el menú, con caché de hasta 6 horas.
                  Si el proveedor falla, se usa la última tasa guardada.
                </p>
              </section>
              <section className="settings-card">
                <span className="sparkle-box">
                  <Sparkles size={22} />
                </span>
                <h2>Notas del asistente</h2>
                <p>
                  Define reglas del negocio. Al conectar IA, estas notas ayudan
                  a elegir productos; los nombres, precios e ingredientes
                  siempre salen del catálogo.
                </p>
                <label>
                  Información interna
                  <textarea
                    rows={7}
                    value={bar.notes}
                    onChange={(e) => patch({ notes: e.target.value })}
                    maxLength={3000}
                  />
                </label>
                <div className="notice-box">
                  <strong>Asistente del catálogo disponible</strong>
                  <p>
                    La IA y las traducciones automáticas necesitan la clave
                    privada GEMINI_API_KEY. Sin ella, el asistente usa reglas de
                    búsqueda. No inventa productos ni precios.
                  </p>
                  <p>
                    Las notas permanecen en el servidor. Las promociones
                    visibles se editan en Identidad.
                  </p>
                </div>
              </section>
              <section className="settings-card">
                <h2>Respaldo del menú</h2>
                <p>Descarga tu catálogo en JSON para conservar una copia.</p>
                <button
                  className="secondary"
                  onClick={() => {
                    const a = document.createElement("a");
                    a.href = URL.createObjectURL(
                      new Blob([JSON.stringify(bar, null, 2)], {
                        type: "application/json",
                      }),
                    );
                    a.download = bar.slug + "-menu.json";
                    a.click();
                    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
                  }}
                >
                  <Download size={17} />
                  Descargar catálogo
                </button>
              </section>
              <section className="settings-card">
                <h2>Enlace para tus mesas</h2>
                <p>
                  El sitio está privado para revisión. El acceso de clientes
                  necesita habilitar la publicación pública.
                </p>
                <div className="menu-link">
                  <code>{link}</code>
                  <button
                    className="icon-button"
                    title="Copiar enlace"
                    onClick={async () => {
                      await navigator.clipboard.writeText(link);
                      setCopied(true);
                      setTimeout(() => setCopied(false), 2000);
                    }}
                  >
                    {copied ? <Check size={18} /> : <Copy size={18} />}
                  </button>
                </div>
              </section>
            </div>
          )}
          {view === "analytics" && (
            <>
              <div className="stat-grid">
                <Stat
                  label="Vistas de productos"
                  value={count("view")}
                  icon={<Eye />}
                />
                <Stat
                  label="Fichas abiertas"
                  value={count("flip")}
                  icon={<RefreshCw />}
                />
                <Stat
                  label="Consultas al asistente"
                  value={count("chat")}
                  icon={<Sparkles />}
                />
                <Stat
                  label="Cambios de idioma"
                  value={count("language")}
                  icon={<Languages />}
                />
              </div>
              <button className="text-button" onClick={loadStats}>
                <RefreshCw size={15} />
                Actualizar datos
              </button>
              <div className="settings-grid">
                <section className="settings-card">
                  <h2>Productos más vistos</h2>
                  <MetricList
                    items={analytics
                      .filter((e) => e.kind === "view")
                      .map((e) => ({
                        label:
                          bar.products.find((p) => p.id === e.productId)
                            ?.name || "Producto retirado",
                        count: e.count,
                      }))}
                  />
                </section>
                <section className="settings-card">
                  <h2>Fichas más abiertas</h2>
                  <MetricList
                    items={analytics
                      .filter((e) => e.kind === "flip")
                      .map((e) => ({
                        label:
                          bar.products.find((p) => p.id === e.productId)
                            ?.name || "Producto retirado",
                        count: e.count,
                      }))}
                  />
                </section>
                <section className="settings-card">
                  <h2>Idiomas utilizados</h2>
                  <MetricList
                    items={analytics
                      .filter((e) => e.kind === "language")
                      .map((e) => ({
                        label: e.value.toUpperCase(),
                        count: e.count,
                      }))}
                  />
                </section>
                <section className="settings-card">
                  <h2>Temas del asistente</h2>
                  <MetricList
                    items={analytics
                      .filter((e) => e.kind === "topic")
                      .map((e) => ({ label: e.value, count: e.count }))}
                  />
                </section>
                <section className="settings-card">
                  <h2>Divisas utilizadas</h2>
                  <MetricList
                    items={analytics
                      .filter((e) => e.kind === "currency")
                      .map((e) => ({ label: e.value, count: e.count }))}
                  />
                </section>
              </div>
              <p className="form-help">
                Las vistas se deduplican por producto y día con una huella
                temporal. Los cambios de idioma y moneda cuentan acciones, no
                personas. No se almacena el texto de conversaciones.
              </p>
            </>
          )}
        </div>
      </div>
      <Modal
        open={!!editing}
        onClose={() => setEditing(null)}
        title={
          bar.products.some((p) => p.id === editing?.id)
            ? "Editar producto"
            : "Nuevo producto"
        }
        className="product-editor"
      >
        {editing && (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              updateProduct();
            }}
          >
            <div className="editor-tabs">
              {langs.map((l) => (
                <button
                  type="button"
                  className={l === editLang ? "active" : ""}
                  key={l}
                  onClick={() => setEditLang(l)}
                >
                  {l.toUpperCase()}
                </button>
              ))}
              <button
                type="button"
                disabled={!!uploading || sample}
                className="auto-translate"
                onClick={translate}
              >
                {uploading === "translate" ? (
                  <LoaderCircle className="spin" size={14} />
                ) : (
                  <Sparkles size={14} />
                )}
                Traducir
              </button>
            </div>
            <div className="editor-body">
              {editLang === (bar.sourceLanguage || "es") ? (
                <>
                  <div className="form-grid two">
                    <Field
                      required
                      label="Nombre"
                      value={editing.name}
                      onChange={(v) => setSpanish("name", v)}
                    />
                    <label>
                      Categoría
                      <select
                        value={editing.category}
                        onChange={(e) =>
                          setEditing({ ...editing, category: e.target.value })
                        }
                      >
                        {bar.categories.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.name}
                          </option>
                        ))}
                      </select>
                    </label>
                    <Field
                      label="Estilo o subtítulo"
                      value={editing.style}
                      onChange={(v) => setSpanish("style", v)}
                    />
                    <Field
                      required
                      label={"Precio " + (bar.baseCurrency || "MXN")}
                      type="number"
                      min="0"
                      max="100000"
                      step="0.01"
                      value={editing.price}
                      onChange={(v) =>
                        setEditing({
                          ...editing,
                          price: Number(v),
                          priceKnown: true,
                          options: editing.options?.map((o, i) =>
                            i === 0 ? { ...o, price: Number(v) } : o,
                          ),
                        })
                      }
                    />
                    <Field
                      label="Tamaño / porción"
                      value={editing.size}
                      onChange={(v) =>
                        setEditing({
                          ...editing,
                          size: v,
                          options: editing.options?.map((o, i) =>
                            i === 0 ? { ...o, label: v } : o,
                          ),
                        })
                      }
                    />
                    <label>
                      Perfil
                      <select
                        value={editing.profile}
                        onChange={(e) =>
                          setEditing({ ...editing, profile: e.target.value })
                        }
                      >
                        {[
                          "suave",
                          "frutal",
                          "tostado",
                          "amargo",
                          "ahumado",
                          "seco",
                          "dulce",
                          "citrico",
                          "salado",
                          "picante",
                        ].map((p) => (
                          <option key={p}>{p}</option>
                        ))}
                      </select>
                    </label>
                    <Field
                      label="Alcohol · % ABV"
                      type="number"
                      min="0"
                      max="100"
                      step="0.1"
                      value={editing.abv}
                      onChange={(v) =>
                        setEditing({ ...editing, abv: Number(v) })
                      }
                    />
                    <Field
                      label="Amargor · IBU"
                      type="number"
                      min="0"
                      max="150"
                      value={editing.ibu}
                      onChange={(v) =>
                        setEditing({ ...editing, ibu: Number(v) })
                      }
                    />
                  </div>
                  {(["description", "ingredients", "preparation"] as const).map(
                    (key, i) => (
                      <label key={key}>
                        {
                          ["Descripción breve", "Ingredientes", "Preparación"][
                            i
                          ]
                        }
                        <textarea
                          rows={key === "description" ? 2 : 3}
                          maxLength={key === "description" ? 1200 : 2000}
                          value={editing[key]}
                          onChange={(e) => setSpanish(key, e.target.value)}
                        />
                      </label>
                    ),
                  )}
                  <label>Alérgenos y avisos</label>
                  <div className="allergen-checkboxes">
                    {[
                      "gluten",
                      "lacteos",
                      "huevo",
                      "nueces",
                      "mariscos",
                      "picante",
                    ].map((a) => (
                      <label className="checkbox-label" key={a}>
                        <input
                          type="checkbox"
                          checked={editing.allergens.includes(a)}
                          onChange={() =>
                            setEditing({
                              ...editing,
                              allergens: editing.allergens.includes(a)
                                ? editing.allergens.filter((v) => v !== a)
                                : [...editing.allergens, a],
                            })
                          }
                        />
                        {a}
                      </label>
                    ))}
                  </div>
                  <h3>Presentaciones y precios</h3>
                  {(editing.options || []).map((o, i) => (
                    <div className="form-grid two" key={i}>
                      <Field
                        label="Presentación"
                        value={o.label}
                        onChange={(v) =>
                          setEditing({
                            ...editing,
                            options: editing.options!.map((x, j) =>
                              i === j ? { ...x, label: v } : x,
                            ),
                            ...(i === 0 ? { size: v } : {}),
                          })
                        }
                      />
                      <Field
                        label={"Precio " + (bar.baseCurrency || "MXN")}
                        type="number"
                        min="0"
                        step="0.01"
                        value={o.price}
                        onChange={(v) =>
                          setEditing({
                            ...editing,
                            options: editing.options!.map((x, j) =>
                              i === j ? { ...x, price: Number(v) } : x,
                            ),
                            ...(i === 0 ? { price: Number(v) } : {}),
                          })
                        }
                      />
                      <button
                        type="button"
                        className="text-button"
                        onClick={() =>
                          setEditing({
                            ...editing,
                            options: editing.options!.filter((_, j) => j !== i),
                          })
                        }
                      >
                        Quitar presentación
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    className="secondary"
                    onClick={() =>
                      setEditing({
                        ...editing,
                        options: [
                          ...(editing.options || []),
                          { label: "", price: editing.price },
                        ],
                      })
                    }
                  >
                    Añadir presentación
                  </button>
                  <label>
                    Maridaje
                    <select
                      value={editing.pairing}
                      onChange={(e) =>
                        setEditing({ ...editing, pairing: e.target.value })
                      }
                    >
                      <option value="">Sin sugerencia</option>
                      {bar.products
                        .filter((p) => p.id !== editing.id)
                        .map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name} · ${p.price}
                          </option>
                        ))}
                    </select>
                  </label>
                  <div className="form-grid two">
                    <MediaField
                      label="Fotografía"
                      value={editing.image}
                      loading={uploading === "image"}
                      onChange={(v) => setEditing({ ...editing, image: v })}
                      onUpload={(f) => upload(f, "image")}
                    />
                    <MediaField
                      label="Video corto · 3–5 segundos"
                      video
                      value={editing.video}
                      loading={uploading === "video"}
                      onChange={(v) => setEditing({ ...editing, video: v })}
                      onUpload={(f) => upload(f, "video")}
                    />
                  </div>
                  <div className="form-grid two">
                    <label className="checkbox-label">
                      <input
                        type="checkbox"
                        checked={editing.popular}
                        onChange={(e) =>
                          setEditing({ ...editing, popular: e.target.checked })
                        }
                      />
                      Destacar como más pedido
                    </label>
                    <label className="checkbox-label">
                      <input
                        type="checkbox"
                        checked={editing.available}
                        onChange={(e) =>
                          setEditing({
                            ...editing,
                            available: e.target.checked,
                          })
                        }
                      />
                      Disponible
                    </label>
                  </div>
                </>
              ) : (
                <>
                  <div className="notice-box">
                    Edita la traducción o usa el servicio de IA si está
                    conectado. Si falta un campo, el cliente verá el texto
                    original del catálogo.
                  </div>
                  {(
                    [
                      "name",
                      "style",
                      "description",
                      "ingredients",
                      "preparation",
                    ] as const
                  ).map((key, i) => (
                    <label key={key}>
                      {
                        [
                          "Nombre",
                          "Estilo",
                          "Descripción",
                          "Ingredientes",
                          "Preparación",
                        ][i]
                      }
                      <textarea
                        rows={key === "name" ? 1 : 3}
                        value={editing.translations[editLang]?.[key] || ""}
                        onChange={(e) =>
                          setEditing({
                            ...editing,
                            translations: {
                              ...editing.translations,
                              [editLang]: {
                                name: "",
                                description: "",
                                ingredients: "",
                                preparation: "",
                                ...editing.translations[editLang],
                                [key]: e.target.value,
                              },
                            },
                          })
                        }
                      />
                      <small className="form-help">
                        Original: {editing[key]}
                      </small>
                    </label>
                  ))}
                </>
              )}
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={autoTranslate}
                  onChange={(e) => setAutoTranslate(e.target.checked)}
                />
                Traducir al aplicar (requiere conectar IA)
              </label>
              {error && <div className="error-box">{error}</div>}
            </div>
            <div className="editor-footer">
              <button
                type="button"
                className="secondary"
                onClick={() => setEditing(null)}
              >
                Cancelar
              </button>
              <button className="primary" type="submit" disabled={!!uploading}>
                <Check size={17} />
                Aplicar al borrador
              </button>
            </div>
          </form>
        )}
      </Modal>
      <Modal
        open={!!deleteId}
        onClose={() => setDeleteId("")}
        title="Eliminar producto"
      >
        <div className="confirm-body">
          <p>
            ¿Eliminar{" "}
            <strong>{bar.products.find((p) => p.id === deleteId)?.name}</strong>
            ? También quitaremos sus referencias de maridaje.
          </p>
          <div>
            <button className="secondary" onClick={() => setDeleteId("")}>
              Cancelar
            </button>
            <button
              className="danger-button"
              onClick={() => {
                patch({
                  products: bar.products
                    .filter((p) => p.id !== deleteId)
                    .map((p) => ({
                      ...p,
                      pairing: p.pairing === deleteId ? "" : p.pairing,
                    })),
                });
                setDeleteId("");
              }}
            >
              Eliminar del borrador
            </button>
          </div>
        </div>
      </Modal>
      <Modal
        open={!!catEdit}
        onClose={() => setCatEdit(null)}
        title="Editar categoría"
      >
        {catEdit && (
          <form
            className="filter-fields"
            onSubmit={(e) => {
              e.preventDefault();
              if (!catEdit.name.trim()) return;
              patch({
                categories: bar.categories.some((c) => c.id === catEdit.id)
                  ? bar.categories.map((c) =>
                      c.id === catEdit.id ? catEdit : c,
                    )
                  : [...bar.categories, catEdit],
              });
              setCatEdit(null);
            }}
          >
            <Field
              required
              label="Nombre en español"
              value={catEdit.name}
              onChange={(v) => setCatEdit({ ...catEdit, name: v })}
            />
            {langs
              .filter((l) => l !== "es")
              .map((l) => (
                <Field
                  key={l}
                  label={"Nombre · " + l.toUpperCase()}
                  value={catEdit.names[l] || ""}
                  onChange={(v) =>
                    setCatEdit({
                      ...catEdit,
                      names: { ...catEdit.names, [l]: v },
                    })
                  }
                />
              ))}
            <label>
              Icono
              <select
                value={catEdit.icon}
                onChange={(e) =>
                  setCatEdit({ ...catEdit, icon: e.target.value })
                }
              >
                {[
                  "beer",
                  "bottle",
                  "wine",
                  "glass",
                  "utensils",
                  "burger",
                  "citrus",
                  "cake",
                ].map((v) => (
                  <option key={v}>{v}</option>
                ))}
              </select>
            </label>
            <button className="primary" type="submit">
              Aplicar al borrador
              <Check size={16} />
            </button>
          </form>
        )}
      </Modal>
      {toast && (
        <div className="toast" role="status">
          <Check size={17} />
          {toast}
        </div>
      )}
    </div>
  );
}
function ArrowRightIcon() {
  return <ArrowUpRight size={15} />;
}
function InfoIcon() {
  return <AlertCircle size={16} />;
}
function Stat({
  label,
  value,
  icon,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
}) {
  return (
    <div className="stat-card">
      <div>
        <span>{label}</span>
        <strong>{value.toString().padStart(2, "0")}</strong>
      </div>
      <span className="stat-icon">{icon}</span>
    </div>
  );
}
function Field({
  label,
  value,
  onChange,
  ...props
}: {
  label: string;
  value: string | number;
  onChange: (value: string) => void;
  [key: string]: any;
}) {
  return (
    <label>
      {label}
      <input
        {...props}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </label>
  );
}
function MediaField({
  label,
  value,
  video = false,
  onChange,
  onUpload,
  loading,
}: {
  label: string;
  value: string;
  video?: boolean;
  onChange: (v: string) => void;
  onUpload: (f: File) => void;
  loading: boolean;
}) {
  return (
    <div className="media-field">
      <label>{label}</label>
      {value &&
        (video ? (
          <video src={value} controls playsInline preload="metadata" />
        ) : (
          <img src={value} alt={label} />
        ))}
      <label className="upload-button">
        {loading ? (
          <LoaderCircle className="spin" size={16} />
        ) : (
          <Upload size={16} />
        )}{" "}
        {loading ? "Subiendo…" : "Subir archivo"}
        <input
          type="file"
          disabled={loading}
          accept={
            video ? "video/mp4,video/webm" : "image/jpeg,image/png,image/webp"
          }
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) onUpload(f);
            e.target.value = "";
          }}
        />
      </label>
      <input
        aria-label={label + " URL"}
        placeholder={video ? "https://…/video.mp4" : "https://…/foto.jpg"}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
      <small>O pega una dirección HTTPS.</small>
    </div>
  );
}
function MetricList({ items }: { items: { label: string; count: number }[] }) {
  return items.length ? (
    <ol className="metric-list">
      {items.slice(0, 8).map((v, i) => (
        <li key={v.label + i}>
          <span>{String(i + 1).padStart(2, "0")}</span>
          <strong>{v.label}</strong>
          <b>{v.count}</b>
        </li>
      ))}
    </ol>
  ) : (
    <div className="metric-empty">
      <BarChart3 size={25} />
      <p>Aún no hay actividad registrada.</p>
      <small>Los datos aparecerán al usar el menú.</small>
    </div>
  );
}
async function compressImage(file: File) {
  const bitmap = await createImageBitmap(file);
  const max = 1600,
    scale = Math.min(1, max / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext("2d")!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  const blob = await new Promise<Blob>((resolve, reject) =>
    canvas.toBlob(
      (b) =>
        b ? resolve(b) : reject(new Error("No se pudo procesar la imagen")),
      "image/webp",
      0.83,
    ),
  );
  return new File([blob], "imagen.webp", { type: "image/webp" });
}
async function extractColor(file: File) {
  const bitmap = await createImageBitmap(file),
    canvas = document.createElement("canvas");
  canvas.width = 64;
  canvas.height = 64;
  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(bitmap, 0, 0, 64, 64);
  bitmap.close();
  const { data } = ctx.getImageData(0, 0, 64, 64),
    buckets = new Map<string, number>();
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i],
      g = data[i + 1],
      b = data[i + 2];
    if (data[i + 3] < 180 || Math.max(r, g, b) - Math.min(r, g, b) < 30)
      continue;
    const key = [r, g, b]
      .map((v) =>
        Math.min(255, Math.round(v / 24) * 24)
          .toString(16)
          .padStart(2, "0"),
      )
      .join("");
    buckets.set(key, (buckets.get(key) || 0) + 1);
  }
  return safeAccent(
    "#" + ([...buckets].sort((a, b) => b[1] - a[1])[0]?.[0] || "e9b56b"),
  );
}
