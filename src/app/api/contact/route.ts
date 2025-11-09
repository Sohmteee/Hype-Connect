import { NextResponse } from "next/server";
import * as z from "zod";

const contactSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  message: z.string().min(1),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const data = contactSchema.parse(body);

    const RESEND_API_KEY = process.env.RESEND_API_KEY;
    // const SUPPORT_EMAIL = "hype.sonovea@gmail.com";
    const SUPPORT_EMAIL = "contact@sonovea.com";

    if (!RESEND_API_KEY) {
      console.error(
        "Resend API key is not configured. Set RESEND_API_KEY in env."
      );
      return NextResponse.json(
        { success: false, error: "Email service not configured" },
        { status: 500 }
      );
    }

    // Use the Resend API to send the email. For deliverability, send from SUPPORT_EMAIL and set Reply-To to the user's email.
    const payload = {
      from: SUPPORT_EMAIL,
      to: [SUPPORT_EMAIL],
      subject: `Website Contact: ${data.name}`,
      text: `From: ${data.name} <${data.email}>\n\n${data.message}`,
      headers: {
        "Reply-To": data.email,
      },
    };

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const text = await res.text();
      console.error("Resend API error:", res.status, text);
      return NextResponse.json(
        { success: false, error: "Failed to send email" },
        { status: 502 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("Contact API error:", err?.message || err);
    return NextResponse.json(
      { success: false, error: err?.message || "Unknown error" },
      { status: 500 }
    );
  }
}
