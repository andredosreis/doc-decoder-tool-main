import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_ANON_KEY") ?? ""
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

    // Get user data from metadata
    const email = session.metadata?.email || session.customer_email;
    const fullName = session.metadata?.full_name;
    const plan = session.metadata?.plan;
    const password = session.metadata?.password;

    if (!email || !password) {
      throw new Error("Email or password not found in session metadata");
    }

    console.log("Creating user account for:", email);

    // Create user account
    const { data: authData, error: authError } = await supabaseClient.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${req.headers.get("origin")}/`,
        data: {
          full_name: fullName,
        },
      },
    });

    if (authError) {
      // If user already exists, try to sign in
      if (authError.message.includes("already registered")) {
        throw new Error("Usuário já existe. Por favor, faça login.");
      }
      throw authError;
    }

    if (!authData.user) throw new Error("Failed to create user");

    console.log("User created:", authData.user.id);

    // Update role to admin
    const { error: roleError } = await supabaseClient
      .from("user_roles")
      .update({ role: "admin" })
      .eq("user_id", authData.user.id);

    if (roleError) {
      console.error("Error updating role:", roleError);
    }

    console.log("Account setup complete for plan:", plan);

    return new Response(
      JSON.stringify({
        success: true,
        userId: authData.user.id,
        plan: plan,
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
