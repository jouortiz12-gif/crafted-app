"use client";
import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { tableMenuUrl } from "../lib/tables";
export default function TableManager({
  menuUrl,
  count,
  onCount,
  dirty,
  sample,
}: {
  menuUrl: string;
  count: number;
  onCount: (n: number) => void;
  dirty: boolean;
  sample: boolean;
}) {
  const [selected, setSelected] = useState(1),
    [svg, setSvg] = useState(""),
    [copied, setCopied] = useState(false),
    [error, setError] = useState("");
  const table = Math.min(selected, count);
  const url = tableMenuUrl(menuUrl, table);
  useEffect(() => {
    let active = true;
    setSvg("");
    setError("");
    setCopied(false);
    QRCode.toString(url, {
      type: "svg",
      errorCorrectionLevel: "M",
      margin: 4,
      width: 512,
    })
      .then((v) => {
        if (active) setSvg(v);
      })
      .catch(() => {
        if (active) setError("No pudimos crear el QR. Inténtalo de nuevo.");
      });
    return () => {
      active = false;
    };
  }, [url]);
  return (
    <div className="settings-grid table-settings">
      <section className="settings-card">
        <h2>Mesas · QR y NFC</h2>
        <p>
          Cada mesa tiene su enlace. Todos abren el mismo menú y sus cambios se
          actualizan juntos.
        </p>
        {sample && (
          <p className="notice-box">
            Modo de prueba: estos enlaces son de ejemplo. Inicia sesión y crea
            tu menú antes de imprimir.
          </p>
        )}
        {dirty && (
          <p className="notice-box">
            Guarda los cambios antes de usar o imprimir los enlaces.
          </p>
        )}
        <label>
          Número de mesas
          <input
            type="number"
            min={1}
            max={100}
            value={count}
            onChange={(e) => {
              const n = Number(e.target.value);
              if (Number.isInteger(n) && n >= 1 && n <= 100) onCount(n);
            }}
          />
        </label>
        <label>
          Mesa
          <select
            value={table}
            onChange={(e) => setSelected(Number(e.target.value))}
          >
            {Array.from({ length: count }, (_, i) => (
              <option key={i + 1} value={i + 1}>
                Mesa {i + 1}
              </option>
            ))}
          </select>
        </label>
        <label>
          Enlace para el QR o chip NFC
          <input readOnly value={url} onFocus={(e) => e.target.select()} />
        </label>
        <button
          className="secondary"
          onClick={async () => {
            try {
              await navigator.clipboard.writeText(url);
              setCopied(true);
            } catch {
              setError("Selecciona y copia el enlace del campo anterior.");
            }
          }}
        >
          {copied ? "Enlace copiado" : "Copiar enlace de la mesa"}
        </button>
        <p>
          Para NFC, escribe este enlace como registro de tipo URL en el chip y
          colócalo en esa mesa. Para QR, descarga el código y pon el número de
          mesa en la placa.
        </p>
        <p>
          Antes de colocar las placas, prueba cada código: el menú debe mostrar
          la mesa correcta y el pedido debe incluirla. El número indica el
          enlace usado; no verifica la ubicación física del cliente.
        </p>
      </section>
      <section className="settings-card table-qr-card">
        <h2>Mesa {table}</h2>
        {svg && (
          <img
            className="table-qr"
            src={"data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg)}
            alt={"Código QR para la mesa " + table}
          />
        )}
        {error && <p role="alert">{error}</p>}
        {svg && (
          <a
            className="primary"
            download={"crafted-mesa-" + table + ".svg"}
            href={"data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg)}
          >
            Descargar QR de mesa {table}
          </a>
        )}
        <a className="text-button" href={url} target="_blank" rel="noreferrer">
          Probar enlace de mesa {table} ↗
        </a>
        <p>
          QR con margen blanco listo para impresión. Usa el mismo enlace en el
          chip NFC.
        </p>
      </section>
    </div>
  );
}
