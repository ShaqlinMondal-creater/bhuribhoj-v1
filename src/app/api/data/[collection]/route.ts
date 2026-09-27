import { NextResponse } from "next/server";
import {
  DataStoreError,
  createRecord,
  listCollection,
} from "@/lib/server/jsonRepository";

// Server-side file boundary for the prototype's JSON files. This is the only
// place a browser request turns into a filesystem write.
export const dynamic = "force-dynamic";

const toErrorResponse = (error: unknown) => {
  if (error instanceof DataStoreError) {
    return NextResponse.json({ error: error.message }, { status: error.status });
  }
  return NextResponse.json(
    { error: error instanceof Error ? error.message : "Unexpected server error." },
    { status: 500 },
  );
};

/** A malformed request body is a client mistake, not a server failure. */
const readJsonBody = async (request: Request): Promise<unknown> => {
  try {
    return await request.json();
  } catch {
    throw new DataStoreError("The request body must be valid JSON.", 400);
  }
};

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ collection: string }> },
) {
  const { collection } = await params;
  try {
    return NextResponse.json({ data: await listCollection(collection) });
  } catch (error) {
    return toErrorResponse(error);
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ collection: string }> },
) {
  const { collection } = await params;
  try {
    const body = await readJsonBody(request);
    const record =
      body && typeof body === "object" && "record" in body
        ? (body as { record: unknown }).record
        : body;
    return NextResponse.json({ data: await createRecord(collection, record) }, { status: 201 });
  } catch (error) {
    return toErrorResponse(error);
  }
}
