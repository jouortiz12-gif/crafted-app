"use client";
export default function Error({ reset }: { reset: () => void }) {
  return (
    <main className="empty full">
      <h1>No pudimos cargar el menú</h1>
      <p>Revisa tu conexión e inténtalo de nuevo.</p>
      <button className="primary" onClick={reset}>
        Volver a intentar
      </button>
    </main>
  );
}
