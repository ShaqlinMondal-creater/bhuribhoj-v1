import { NextResponse } from "next/server";
import { DataStoreError, resetAllCollections } from "@/lib/server/jsonRepository";

export const dynamic = "force-dynamic";

// Restores the live JSON files from the immutable seed in src/data/initial.
export async function POST() {
  try {
    const restored = await resetAllCollections();
    return NextResponse.json({ data: { restored } });
  } catch (error) {
    if (error instanceof DataStoreError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unexpected server error." },
      { status: 500 },
    );
  }
}
