import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server"
import { Webhook } from "svix";
import { WebhookEvent } from "@clerk/nextjs/server";
import { api, internal } from "./_generated/api";

const http = httpRouter();

http.route({
    path: "/clerk-webhook",
    method: "POST",

    handler: httpAction(async (ctx, req) => {
        const webhookSecret = process.env.CLERK_WEBHOOK_SECRET;
        if (!webhookSecret) {
            throw new Error("Missing CLERK_WEBHOOK_SECRET");
        }

        const svix_id = req.headers.get("svix-id");
        const svix_signature = req.headers.get("svix-signature");
        const svix_timestamp = req.headers.get("svix-timestamp");

        if (!svix_id || !svix_signature || !svix_timestamp) {
            return new Response("Missing headers", {
                status: 400,
            });
        }

        const payload = await req.json();
        const body = JSON.stringify(payload);

        const wh = new Webhook(webhookSecret);
        let evt: WebhookEvent;

        try {
            evt = wh.verify(body, {
            "svix-id": svix_id,
            "svix-timestamp": svix_timestamp,
            "svix-signature": svix_signature,
        }) as WebhookEvent;
        } catch (err) {
            console.error("Error verifying webhook:", err);
            return new Response("Error occurred", { status: 400 });
        }

        const eventType = evt.type;
        if (eventType === "user.created") {
            const { id, email_addresses, first_name, last_name } = evt.data;

            const email = email_addresses[0].email_address;
            const name = `${first_name || ""} ${last_name || ""}`.trim();

            try {
                await ctx.runMutation(api.users.syncUser, {
                    userId: id,
                    email,
                    name,
                });
            } catch (error) {
                console.error("Error syncing user:", error);
                return new Response("Error syncing user", {
                    status: 500,
                });
            }
        }
       
        return new Response("User synced successfully", {
            status: 200,
        });

    })
});

export default http;