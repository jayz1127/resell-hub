import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Soft delete: the record leaves every report and list immediately (the
// actual ask — Flyp refuses to let you remove a sale at all), but stays
// recoverable for 30 days in case of a misclick. A daily cron can hard-
// delete anything with deletedAt older than 30 days if you want it gone
// for good; see workers/purge-deleted-sales.ts.
export async function POST(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  await prisma.sale.update({
    where: { id: params.id },
    data: { deletedAt: new Date() },
  });
  return NextResponse.redirect(new URL("/sales", _req.url));
}
