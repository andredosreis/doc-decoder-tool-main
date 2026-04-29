import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import { buildCheckoutMetadata } from "../_shared/checkout-metadata.ts";
import { validateCheckoutRequest, CheckoutValidationError } from "../_shared/validate-checkout-request.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const PRICE_IDS = {
  iniciante: "price_1SK0RMQ4GBndD26l8e1hVX7B",
  pro: "price_1SK0SGQ4GBndD26l7DvTEBnP",
  enterprise: "price_1SK0dvQ4GBndD26l5mvkRD9L",
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
    const raw = await req.json();

    let validated: ReturnType<typeof validateCheckoutRequest>;
    try {
      validated = validateCheckoutRequest(raw);
    } catch (e) {
      if (e instanceof CheckoutValidationError) {
        return new Response(JSON.stringify({ error: e.message }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400,
        });
      }
      throw e;
    }
    const { plan, email } = validated;
    const fullName = (raw as Record<string, unknown>).fullName as string | undefined;
    console.log("Creating checkout for plan:", plan, "email:", email);

    if (!PRICE_IDS[plan as keyof typeof PRICE_IDS]) {
      throw new Error("Plan not configured");
    }

    // Initialize Stripe
    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2025-08-27.basil",
    });

    // Check if customer exists
    const customers = await stripe.customers.list({ email, limit: 1 });
    let customerId;
    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
      console.log("Existing customer found:", customerId);
    } else {
      console.log("Creating new Stripe customer");
    }

    // Create checkout session (user will be created AFTER payment via process-payment).
    // IMPORTANT: never store password in Stripe metadata (plaintext). The post-payment
    // flow in process-payment uses auth.admin.createUser without password and sends
    // a recovery link by email; the customer sets their own password.
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      customer_email: customerId ? undefined : email,
      line_items: [
        {
          price: PRICE_IDS[plan as keyof typeof PRICE_IDS],
          quantity: 1,
        },
      ],
      mode: "subscription",
      success_url: `${req.headers.get("origin")}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${req.headers.get("origin")}/checkout?plan=${plan}`,
      metadata: buildCheckoutMetadata({ email, fullName, plan }),
    });

    console.log("Checkout session created:", session.id);

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error: any) {
    console.error("Error in create-checkout:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
