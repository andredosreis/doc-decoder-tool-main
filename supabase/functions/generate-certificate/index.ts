import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";
import {
  checkCertificateEligibility,
  generateCertNumber,
} from "../_shared/certificate-eligibility.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface CertificateRequest {
  productId: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader) {
      throw new Error("No authorization header");
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      {
        global: {
          headers: { Authorization: authHeader },
        },
      }
    );

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) throw new Error("User not authenticated");

    const { productId }: CertificateRequest = await req.json();

    console.log("Generating certificate for user:", user.id, "product:", productId);

    // Verificar se o usuário completou o produto
    const { data: modules } = await supabase
      .from("modules")
      .select("id")
      .eq("product_id", productId);

    const moduleIds = (modules ?? []).map((m) => m.id);

    // Buscar progresso só se houver módulos (evita query desnecessária)
    let completedCount = 0;
    if (moduleIds.length > 0) {
      const { data: progress } = await supabase
        .from("user_progress")
        .select("completed")
        .eq("user_id", user.id)
        .in("module_id", moduleIds);
      completedCount = progress?.filter((p) => p.completed).length ?? 0;
    }

    const eligibility = checkCertificateEligibility(
      moduleIds.length,
      completedCount,
    );

    if (!eligibility.eligible) {
      if (eligibility.reason === "PRODUCT_HAS_NO_MODULES") {
        throw new Error("Product has no modules");
      }
      throw new Error(
        `Product not completed. Progress: ${eligibility.completionPercentage.toFixed(0)}%`,
      );
    }

    // Buscar dados do produto e usuário
    const { data: product } = await supabase
      .from("products")
      .select("title, description")
      .eq("id", productId)
      .single();

    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name, email")
      .eq("id", user.id)
      .single();

    if (!product || !profile) {
      throw new Error("Product or profile not found");
    }

    // Verificar se já existe certificado
    const { data: existingCert } = await supabase
      .from("certificates")
      .select("*")
      .eq("user_id", user.id)
      .eq("product_id", productId)
      .maybeSingle();

    if (existingCert) {
      return new Response(JSON.stringify({ 
        success: true, 
        certificate: existingCert,
        message: "Certificate already exists"
      }), {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders,
        },
      });
    }

    // Criar novo certificado
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const { data: certificate, error: certError } = await supabaseAdmin
      .from("certificates")
      .insert({
        user_id: user.id,
        product_id: productId,
        certificate_number: generateCertNumber(),
        completed_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (certError) throw certError;

    console.log("Certificate created:", certificate.id);

    // Enviar notificação para o usuário
    try {
      const supabaseNotif = createClient(
        Deno.env.get("SUPABASE_URL") ?? "",
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
      );

      await supabaseNotif.functions.invoke('send-notification', {
        body: {
          userId: user.id,
          title: '🎓 Certificado Disponível!',
          message: `Parabéns! Seu certificado do curso "${product.title}" está disponível.`,
          type: 'success',
          actionUrl: `/student/certificate/${productId}`
        }
      });
      console.log('Notification sent');
    } catch (notifError) {
      console.error('Error sending notification:', notifError);
    }

    return new Response(JSON.stringify({
      success: true, 
      certificate,
      message: "Certificate generated successfully"
    }), {
      status: 201,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error generating certificate:", error);
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
