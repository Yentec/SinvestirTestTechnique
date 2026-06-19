import { Simulator } from '@/components/Simulator';

export default function Home() {
  return (
    <main className="mx-auto max-w-6xl px-6 py-12 sm:py-16">
      <div className="mb-8 text-center">
        <span className="pill mb-5">Les simulateurs S&apos;investir</span>
        <h1 className="text-3xl font-semibold leading-tight sm:text-4xl">
          Simulateur <span className="text-gold">Crypto</span>
        </h1>
        <p className="mx-auto mt-3 max-w-xl text-white/60">
          Visualisez ce qu&apos;aurait donné un investissement passé en
          crypto-monnaie, en une fois ou de façon programmée (DCA).
        </p>
      </div>

      <Simulator />
    </main>
  );
}
