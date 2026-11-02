import type { Metadata } from "next";
import { CoordinatorPage } from "./coordinator";

export const metadata: Metadata = { title: "Coordinator" };

// The id is read on the server so the page renders whole, with no client-side swap (and no layout shift).
export default async function Page({ searchParams }: { searchParams: Promise<{ id?: string }> }) {
  const { id } = await searchParams;
  return <CoordinatorPage initialId={id} />;
}
