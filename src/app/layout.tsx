import type { Metadata } from "next";
import { Inter, Playfair_Display, Caveat } from 'next/font/google';
import "./globals.css";

const inter = Inter({ subsets: ['latin'], variable: '--font-sans' });
const playfair = Playfair_Display({ subsets: ['latin'], variable: '--font-serif' });
const caveat = Caveat({ subsets: ['latin'], variable: '--font-handwriting' });

export const metadata: Metadata = {
  title: "Elite Interactive Calendar Component",
  description: "A highly interactive, beautifully designed calendar frontend challenge with 40-year veteran UX/UI touches.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} ${playfair.variable} ${caveat.variable}`}>
        <main className="container">
          {children}
        </main>
      </body>
    </html>
  );
}
