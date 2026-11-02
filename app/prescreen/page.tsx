import type { Metadata } from "next";
import { PrescreenPage } from "./prescreen";

export const metadata: Metadata = { title: "Pre-screen" };

export default async function Page({ searchParams }: { searchParams: Promise<{ lang?: string }> }) {
  const { lang } = await searchParams;
  return <PrescreenPage lang={lang === "es" ? "es" : lang === "en" ? "en" : undefined} />;
}
