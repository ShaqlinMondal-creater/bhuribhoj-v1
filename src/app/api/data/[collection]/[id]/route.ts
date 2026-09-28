import { NextResponse } from "next/server";
import {
  DataStoreError,
  deleteRecord,
  findRecord,
  updateRecord,
} from "@/lib/server/jsonRepository";

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
  { params }: { params: Promise<{ collection: string; id: string }> },
) {
  const { collection, id } = await params;
  try {
    const record = await findRecord(collection, id);
    if (!record) {
      return NextResponse.json({ error: `No ${collection} record with id "${id}".` }, { status: 404 });
    }
    return NextResponse.json({ data: record });
  } catch (error) {
    return toErrorResponse(error);
  }
}

// Updates arrive as POST /api/data/{collection}/{id}. PATCH is deliberately not
// supported: this API uses POST for both creating a record (on the collection
// route) and updating one (on the record route).
export async function POST(
  request: Request,
  { params }: { params: Promise<{ collection: string; id: string }> },
) {
  const { collection, id } = await params;
  try {
    const body = await readJsonBody(request);
    // The url id identifies the record, so the body only carries editable
    // fields. `updateRecord` drops an echoed `id` before validating the rest.
    const patch =
      body && typeof body === "object" && "patch" in body
        ? (body as { patch: unknown }).patch
        : body;
    return NextResponse.json({ data: await updateRecord(collection, id, patch) });
  } catch (error) {
    return toErrorResponse(error);
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ collection: string; id: string }> },
) {
  const { collection, id } = await params;
  try {
    return NextResponse.json({ data: await deleteRecord(collection, id) });
  } catch (error) {
    return toErrorResponse(error);
  }
}
