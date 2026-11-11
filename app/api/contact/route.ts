import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { rateLimit } from "@/lib/rate-limit";
import { firstIssueMessage } from "@/lib/validation";

/** P0 hardening (2026-11-05): strict validation + per-IP rate limiting.
 *  P1 (2026-11-05): phone is now persisted (ContactMessage.phone column). */
const contactSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters").max(120),
  email: z.string().trim().email("Enter a valid email address").max(200),
  phone: z.string().trim().max(30).optional().or(z.literal("")),
  subject: z.string().trim().max(120).optional().or(z.literal("")),
  message: z.string().trim().min(5, "Message must be at least 5 characters").max(4000),
});

function firstZodMessage(err: unknown): string {
  return firstIssueMessage(err);
}

export async function POST(req: Request) {
  if (!rateLimit(req, { scope: "contact", max: 5, windowMs: 60_000 })) {
    return NextResponse.json(
      { success: false, error: "Too many requests. Please try again shortly." },
      { status: 429 }
    );
  }

  try {
    const json = await req.json().catch(() => null);
    const parsed = contactSchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: firstZodMessage(parsed.error) },
        { status: 400 }
      );
    }

    const message = await prisma.contactMessage.create({
      data: {
        name: parsed.data.name,
        email: parsed.data.email,
        phone: parsed.data.phone || null,
        subject: parsed.data.subject || null,
        message: parsed.data.message,
      },
    });

    return NextResponse.json({ success: true, message: { id: message.id } });
  } catch (error) {
    console.error("Contact API Error:", error);
    return NextResponse.json({ success: false, error: "Failed to send message" }, { status: 500 });
  }
}
