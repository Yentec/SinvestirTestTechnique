export default function Home() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <span className="pill mb-6">Les simulateurs S&apos;investir</span>
      <h1 className="text-4xl font-semibold leading-tight">
        Simulateur <span className="text-gold">Crypto</span>
      </h1>
      <p className="mt-4 text-white/60">
        Test de fidélité visuelle. Si ce texte est en Lexend, sur fond bleu
        nuit, avec « Crypto » en doré et le badge ci-dessus arrondi, les tokens
        sont correctement chargés.
      </p>
      <div className="mt-8 flex gap-3">
        <button className="rounded-input bg-brand px-5 py-2.5 font-medium transition-colors hover:bg-brand-hover">
          Bouton primaire
        </button>
        <div className="rounded-card border border-white/10 bg-bg-card px-5 py-2.5 text-white/70">
          Carte
        </div>
      </div>
    </main>
  );
}
