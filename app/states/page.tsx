import type { Metadata } from "next";
import { StatesGallery } from "./gallery";

export const metadata: Metadata = { title: "States and edge cases" };

export default function Page() {
  return <StatesGallery />;
}
