import type { Metadata } from 'next';
import { Lexend } from 'next/font/google';
import './globals.css';

const lexend = Lexend({
  subsets: ['latin'],
  variable: '--font-lexend',
  display: 'swap',
});

export const metadata: Metadata = {
  title: "Simulateur Crypto — S'investir",
  description:
    "Simulez la performance rétrospective d'un investissement crypto (one-shot ou DCA) à partir de données de marché historiques.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr" className={lexend.variable}>
      <body>{children}</body>
    </html>
  );
}
