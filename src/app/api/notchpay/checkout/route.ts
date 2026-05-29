import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const { tier, amount, email, userId } = await request.json();

  try {
    const response = await fetch("https://api.notchpay.co/payments/initialize", {
      method: "POST",
      headers: {
        "Authorization": process.env.NOTCHPAY_PRIVATE_KEY!,
        "Content-Type": "application/json",
        "Accept": "application/json",
      },
      body: JSON.stringify({
        email,
        amount,
        currency: "XAF",
        description: `INEX ${tier} subscription`,
        reference: `inex_${userId}_${tier}_${Date.now()}`,
        callback: `${process.env.NEXT_PUBLIC_SITE_URL}/api/notchpay/callback`,
        metadata: {
          userId,
          tier,
        },
      }),
    });

    const data = await response.json();

    if (data.transaction?.authorization_url) {
      return NextResponse.json({
        authorization_url: data.transaction.authorization_url,
      });
    }

    return NextResponse.json({ error: "Failed to initialize payment" }, { status: 400 });

  } catch (err) {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}