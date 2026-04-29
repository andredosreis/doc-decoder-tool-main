import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";
import { isServiceRoleAuthorized } from "../_shared/service-role-auth.ts";
import { validateNotificationRequest, NotificationValidationError } from "../_shared/validate-notification-request.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (
    !isServiceRoleAuthorized(
      req.headers.get("Authorization"),
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY"),
    )
  ) {
    return new Response("Unauthorized", { status: 401 });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const raw = await req.json();
    let validated: ReturnType<typeof validateNotificationRequest>;
    try {
      validated = validateNotificationRequest(raw);
    } catch (e) {
      if (e instanceof NotificationValidationError) {
        return new Response(
          JSON.stringify({ error: e.message }),
          { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }
      throw e;
    }
    const { userId, title, message, type, actionUrl } = validated;

    console.log("Creating notification for user:", userId);

    const { data, error } = await supabaseAdmin
      .from("notifications")
      .insert({
        user_id: userId,
        title,
        message,
        type,
        action_url: actionUrl,
      })
      .select()
      .single();

    if (error) throw error;

    console.log("Notification created:", data.id);

    return new Response(JSON.stringify({ success: true, notification: data }), {
      status: 201,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error creating notification:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
