import { NextResponse } from "next/server";
import { verifyPackagingUnit } from "@/services/productService";

export const dynamic = "force-dynamic";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(
  _request: Request,
  { params }: RouteParams
): Promise<NextResponse> {
  const { id } = await params;

  if (!id) {
    return NextResponse.json(
      { error: "Identifier parameter is required" },
      { status: 400 }
    );
  }

  const result = await verifyPackagingUnit(id);
  return NextResponse.json(result);
}
