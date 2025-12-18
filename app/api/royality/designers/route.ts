import { NextResponse } from "next/server";
import prisma from "@/lib/db/prisma-connect";

export async function GET() {
  try {
    const royalIds = await prisma.user.findMany({
      select: { royalId: true },
      orderBy: { createdAt: "desc" }, // optional sorting
    });

    return NextResponse.json(
      {
        success: true,
        data: royalIds.map(u => u.royalId), // returns only an array of strings
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error fetching royalIds:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch royalIds",
      },
      { status: 500 }
    );
  }
}
