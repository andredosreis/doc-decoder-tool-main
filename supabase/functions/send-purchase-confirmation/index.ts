import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface EmailRequest {
  purchaseId: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const authHeader = req.headers.get('Authorization');
  if (authHeader !== `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`) {
    return new Response('Unauthorized', { status: 401 });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const { purchaseId }: EmailRequest = await req.json();

    console.log("Fetching purchase data for:", purchaseId);

    // Buscar dados da compra
    const { data: purchase, error: purchaseError } = await supabase
      .from("purchases")
      .select(`
        id,
        amount_paid,
        approved_at,
        user:profiles!purchases_user_id_fkey (
          email,
          full_name
        ),
        product:products (
          title,
          description
        )
      `)
      .eq("id", purchaseId)
      .single();

    if (purchaseError) {
      console.error("Error fetching purchase:", purchaseError);
      throw purchaseError;
    }

    if (!purchase) {
      throw new Error("Purchase not found");
    }

    console.log("Purchase data:", purchase);

    const userName = purchase.user?.full_name || "Cliente";
    const userEmail = purchase.user?.email || "";
    const productTitle = purchase.product.title;
    const amount = purchase.amount_paid || 0;

    // Enviar email usando Resend API diretamente
    const emailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "Plataforma <onboarding@resend.dev>",
        to: [userEmail],
        subject: `🎉 Compra Aprovada - ${productTitle}`,
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
              .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
              .button { display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
              .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
              .highlight { background: white; padding: 15px; border-radius: 5px; margin: 15px 0; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>🎉 Compra Aprovada!</h1>
              </div>
              <div class="content">
                <p>Olá <strong>${userName}</strong>,</p>
                
                <p>Sua compra foi aprovada com sucesso! Agora você tem acesso completo ao curso.</p>
                
                <div class="highlight">
                  <p><strong>📚 Produto:</strong> ${productTitle}</p>
                  <p><strong>💰 Valor:</strong> R$ ${amount.toFixed(2)}</p>
                </div>
                
                <p>Você já pode começar a estudar acessando a plataforma:</p>
                
                <a href="${Deno.env.get("SUPABASE_URL")}" class="button">Acessar Plataforma</a>
                
                <p>Aproveite seu curso e bons estudos! 🚀</p>
              </div>
              <div class="footer">
                <p>Este é um email automático, não é necessário responder.</p>
              </div>
            </div>
          </body>
          </html>
        `,
      }),
    });

    const emailData = await emailResponse.json();
    
    if (!emailResponse.ok) {
      console.error("Resend API error:", emailData);
      throw new Error(`Failed to send email: ${JSON.stringify(emailData)}`);
    }

      console.log("Email sent successfully:", emailData);

      // Enviar notificação para o usuário
      try {
        await supabase.functions.invoke('send-notification', {
          body: {
            userId: purchase.user.id,
            title: '🎉 Compra Aprovada!',
            message: `Sua compra do curso "${productTitle}" foi aprovada. Você já pode começar a estudar!`,
            type: 'success',
            actionUrl: `/student/product/${purchase.product_id}`
          }
        });
        console.log('Notification sent');
      } catch (notifError) {
        console.error('Error sending notification:', notifError);
      }

      return new Response(JSON.stringify({ success: true, emailData }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in send-purchase-confirmation function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
