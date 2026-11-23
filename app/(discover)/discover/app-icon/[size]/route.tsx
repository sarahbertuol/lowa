import { notFound } from "next/navigation";
import { appIcon } from "@/lib/engine/app-icon";

/** Discover app icons at stable URLs: /discover/app-icon/180 (iPhone), 192 and 512 (manifest). */
const SIZES = ["180", "192", "512"];

export const dynamic = "force-static";
export const dynamicParams = false;

export function generateStaticParams() {
  return SIZES.map((size) => ({ size }));
}

export async function GET(_req: Request, { params }: { params: Promise<{ size: string }> }) {
  const { size } = await params;
  if (!SIZES.includes(size)) notFound();
  return appIcon(Number(size));
}
