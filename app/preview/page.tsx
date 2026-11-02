export default function MobilePreview() {
  return (
    <main
      style={{
        display: "flex",
        flexWrap: "wrap",
        gap: 60,
        justifyContent: "center",
        alignItems: "center",
        minHeight: "100dvh",
        padding: 24,
      }}
    >
      <div style={{ maxWidth: 320 }}>
        <a className="back-link" href="/admin">
          ← Volver al panel
        </a>
        <span
          className="info-brand"
          style={{ display: "block", margin: "25px 0" }}
        >
          L’
        </span>
        <h1 style={{ fontSize: 36, lineHeight: 1.15, letterSpacing: -1 }}>
          Tu menú,
          <br />
          en un teléfono.
        </h1>
        <p style={{ color: "#9a9b99", marginTop: 20, lineHeight: 1.8 }}>
          Explora el menú, gira las tarjetas y prueba el asistente en esta vista
          de 390 píxeles.
        </p>
        <a href="/" className="secondary" style={{ marginTop: 25 }}>
          Abrir a pantalla completa ↗
        </a>
      </div>
      <iframe
        title="Vista móvil del menú"
        src="/"
        style={{
          width: 390,
          height: 844,
          maxWidth: "100%",
          border: "8px solid #343432",
          borderRadius: 36,
          background: "#101112",
          boxShadow: "0 20px 80px #0009",
        }}
      />
    </main>
  );
}
