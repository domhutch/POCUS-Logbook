export default function App() {
  return (
    <main className="page">
      <section className="welcome" aria-labelledby="page-title">
        <p className="eyebrow">Personal ultrasound logbook</p>
        <h1 id="page-title">POCUS Logbook</h1>
        <p className="intro">
          A private, offline-first place to record and review your practice.
        </p>
        <p className="status">Your logbook workspace is ready to set up.</p>
      </section>
      <footer>
        Training records are for learning and reflection, not clinical decision-making.
      </footer>
    </main>
  );
}
