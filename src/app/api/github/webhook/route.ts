import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyWebhookSignature } from "@/lib/github";

export async function POST(request: Request) {
  try {
    const rawBody = await request.text();
    const signature = request.headers.get("x-hub-signature-256") || "";
    const event = request.headers.get("x-github-event") || "";

    if (!verifyWebhookSignature(rawBody, signature)) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    const payload = JSON.parse(rawBody);

    if (event === "installation") {
      const { action, installation } = payload;
      
      // When uninstalled or suspended, mark as inactive
      if (action === "deleted" || action === "suspend") {
        await prisma.gitHubInstallation.updateMany({
          where: { installationId: installation.id.toString() },
          data: { isActive: false },
        });
        console.log(`GitHub App ${action}: installation ${installation.id}`);
      }
      
      // When unsuspended, mark as active
      if (action === "unsuspend") {
        await prisma.gitHubInstallation.updateMany({
          where: { installationId: installation.id.toString() },
          data: { isActive: true },
        });
      }
    }

    return NextResponse.json({ received: true });
  } catch (err) {
    console.error("Webhook error:", err);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
