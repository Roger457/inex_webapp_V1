import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const reference = searchParams.get("reference");
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;

  if (!reference) {
    return NextResponse.redirect(`${siteUrl}/pricing?error=missing_reference`);
  }

  try {
    // Verify the payment with Notchpay
    const response = await fetch(`https://api.notchpay.co/payments/${reference}`, {
      headers: {
        "Authorization": process.env.NOTCHPAY_PRIVATE_KEY!,
        "Accept": "application/json",
      },
    });

    const data = await response.json();

    if (data.transaction?.status !== "complete") {
      return NextResponse.redirect(`${siteUrl}/pricing?error=payment_failed`);
    }

    // Extract metadata
    const { userId, tier } = data.transaction.metadata;

    if (!userId || !tier) {
      return NextResponse.redirect(`${siteUrl}/pricing?error=invalid_metadata`);
    }

    // Update subscription in database
    const { error } = await supabase
      .from("subscriptions")
      .upsert({ student_id: userId, tier }, { onConflict: "student_id" });

    if (error) {
      return NextResponse.redirect(`${siteUrl}/pricing?error=db_error`);
    }

    return NextResponse.redirect(`${siteUrl}/pricing?success=true`);

  } catch (err) {
    return NextResponse.redirect(`${siteUrl}/pricing?error=server_error`);
  }
}