import type { Metadata } from "next";
import { Poppins } from "next/font/google";
import Header from "@/components/Header";
import { KnowledgeProvider } from "@/context/KnowledgeContext";
import "./globals.css";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-poppins",
});

export const metadata: Metadata = {
  title: "Knowledge Builder",
  description: "",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${poppins.variable} font-sans antialiased`}>
        <KnowledgeProvider>
          <Header />
          {children}
        </KnowledgeProvider>
      </body>
    </html>
  );
}

