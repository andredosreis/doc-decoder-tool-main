import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import { setAdminRole } from "../_shared/admin-role.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseAdmin = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
  );

  try {
    const { sessionId } = await req.json();
    console.log("Processing payment for session:", sessionId);

    if (!sessionId) {
      throw new Error("Session ID is required");
    }

    // Initialize Stripe
    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2025-08-27.basil",
    });

    // Retrieve the checkout session
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    console.log("Session retrieved:", session.id, "status:", session.payment_status);

    if (session.payment_status !== "paid") {
      throw new Error("Payment not completed");
    }

    // Get user data from metadata. Password is NEVER in metadata (PCI/LGPD).
    // The customer sets their own password via the recovery email below.
    const email = session.metadata?.email || session.customer_email;
    const fullName = session.metadata?.full_name;
    const plan = session.metadata?.plan;

    if (!email) {
      throw new Error("Email not found in session metadata");
    }

    const appUrl =
      Deno.env.get("APP_URL") ?? req.headers.get("origin") ?? "https://www.appxpro.online";
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    if (!resendApiKey) {
      throw new Error("RESEND_API_KEY not configured");
    }

    console.log("Setting up account for:", email);

    // Find existing user by email or create new one (no password — recovery link below).
    let userId: string;
    const { data: existingProfile } = await supabaseAdmin
      .from("profiles")
      .select("id")
      .eq("email", email.toLowerCase())
      .maybeSingle();

    if (existingProfile) {
      userId = existingProfile.id;
      console.log("Existing user upgraded:", userId);
    } else {
      const { data: createdUser, error: createError } =
        await supabaseAdmin.auth.admin.createUser({
          email,
          email_confirm: true,
          user_metadata: { full_name: fullName ?? "" },
        });
      if (createError) throw createError;
      if (!createdUser.user) throw new Error("Failed to create user");
      userId = createdUser.user.id;
      console.log("New user created:", userId);
    }

    // Promove a admin via service-role com retry. Falha alto em vez de
    // devolver success com role 'user' ao cliente que pagou.
    await setAdminRole(supabaseAdmin, userId);

    // Gerar recovery link e enviar e-mail. Cliente define a sua própria
    // password ao primeiro acesso; password nunca atravessa a Stripe.
    const { data: linkData, error: linkError } =
      await supabaseAdmin.auth.admin.generateLink({
        type: "recovery",
        email,
        options: { redirectTo: `${appUrl}/auth/reset-password` },
      });
    if (linkError) throw linkError;

    const inviteLink =
      (linkData as any)?.properties?.action_link ?? `${appUrl}/auth/admin-login`;
    const userName = fullName || email;

    const emailRes = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "APP XPRO <noreply@appxpro.online>",
        to: [email],
        subject: "Pagamento confirmado — defina a sua senha",
        html: `
          <!DOCTYPE html>
          <html>
          <head><meta charset="utf-8"></head>
          <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
            <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
              <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
                <h1>Bem-vindo à APP XPRO!</h1>
              </div>
              <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
                <p>Olá <strong>${userName}</strong>,</p>
                <p>O seu pagamento do plano <strong>${plan ?? ""}</strong> foi confirmado.</p>
                <p>Clique no botão abaixo para definir a sua senha e aceder ao painel de admin:</p>
                <p style="text-align: center;">
                  <a href="${inviteLink}" style="display: inline-block; background: #667eea; color: white; padding: 14px 32px; text-decoration: none; border-radius: 6px; font-weight: bold;">
                    Definir senha e entrar
                  </a>
                </p>
                <p style="color:#999;font-size:12px;">Este link expira em 24 horas.</p>
              </div>
            </div>
          </body>
          </html>
        `,
      }),
    });

    if (!emailRes.ok) {
      const emailError = await emailRes.json().catch(() => ({}));
      throw new Error(`Failed to send setup email: ${JSON.stringify(emailError)}`);
    }

    console.log("Account setup complete for plan:", plan);

    return new Response(
      JSON.stringify({
        success: true,
        userId,
        plan,
        message: "Confira o seu e-mail para definir a senha.",
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error: any) {
    console.error("Error in process-payment:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
