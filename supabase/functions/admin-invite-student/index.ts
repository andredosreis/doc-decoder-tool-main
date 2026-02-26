import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface InviteRequest {
  email: string;
  full_name: string;
  product_id?: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Verificar autenticação do admin via JWT
  const authHeader = req.headers.get("Authorization");
  if (!authHeader) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }

  const supabaseAdmin = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
  );

  // Verificar JWT usando o admin client
  const token = authHeader.replace("Bearer ", "");
  const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token);
  if (userError || !user) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }

  const { data: roleData } = await supabaseAdmin
    .from("user_roles")
    .select("role")
    .eq("user_id", user.id)
    .maybeSingle();

  if (roleData?.role !== "admin") {
    return new Response(JSON.stringify({ error: "Forbidden" }), {
      status: 403,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }

  try {
    const { email, full_name, product_id }: InviteRequest = await req.json();

    if (!email) {
      return new Response(JSON.stringify({ error: "Email é obrigatório" }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const appUrl = Deno.env.get("APP_URL") ?? "https://appxpro-mu.vercel.app";
    const resendApiKey = Deno.env.get("RESEND_API_KEY");

    let userId: string;

    // Verificar se usuário já existe
    const { data: existingProfile } = await supabaseAdmin
      .from("profiles")
      .select("id")
      .eq("email", email.toLowerCase())
      .maybeSingle();

    if (existingProfile) {
      userId = existingProfile.id;
    } else {
      // Criar usuário com email auto-confirmado (sem depender do SMTP do Supabase)
      const { data: createdUser, error: createError } =
        await supabaseAdmin.auth.admin.createUser({
          email,
          email_confirm: true,
          user_metadata: { full_name: full_name ?? "" },
        });

      if (createError) {
        throw new Error(`Erro ao criar usuário: ${createError.message}`);
      }

      userId = createdUser.user.id;
    }

    // Gerar link de redefinição de senha (serve como "primeiro acesso")
    const { data: linkData, error: linkError } =
      await supabaseAdmin.auth.admin.generateLink({
        type: "recovery",
        email,
        options: { redirectTo: `${appUrl}/auth/student-login` },
      });

    if (linkError) {
      throw new Error(`Erro ao gerar link de acesso: ${linkError.message}`);
    }

    const inviteLink = (linkData as any)?.properties?.action_link ?? `${appUrl}/auth/student-login`;
    const userName = full_name || email;

    const emailRes = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "APP XPRO <noreply@appxpro.online>",
        to: [email],
        subject: "Você foi convidado para a APP XPRO!",
        html: `
          <!DOCTYPE html>
          <html>
          <head><meta charset="utf-8">
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
              .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
              .button { display: inline-block; background: #667eea; color: white !important; padding: 14px 32px; text-decoration: none; border-radius: 6px; margin: 20px 0; font-weight: bold; }
              .footer { text-align: center; margin-top: 20px; color: #999; font-size: 12px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header"><h1>Bem-vindo à APP XPRO!</h1></div>
              <div class="content">
                <p>Olá <strong>${userName}</strong>,</p>
                <p>Você foi convidado para acessar a plataforma <strong>APP XPRO</strong>.</p>
                <p>Clique no botão abaixo para criar sua senha e acessar seus cursos:</p>
                <a href="${inviteLink}" class="button">Criar minha senha e acessar</a>
                <p style="color:#999;font-size:12px;">Este link expira em 24 horas. Se não esperava este email, ignore-o.</p>
              </div>
              <div class="footer">APP XPRO — Plataforma de Cursos Online</div>
            </div>
          </body>
          </html>
        `,
      }),
    });

    if (!emailRes.ok) {
      const emailError = await emailRes.json();
      throw new Error(`Erro ao enviar email: ${JSON.stringify(emailError)}`);
    }

    // Atualizar nome no profile se informado
    if (full_name) {
      await supabaseAdmin
        .from("profiles")
        .update({ full_name })
        .eq("id", userId);
    }

    // Criar purchase aprovada se um produto foi informado
    if (product_id) {
      const { error: purchaseError } = await supabaseAdmin
        .from("purchases")
        .upsert(
          {
            user_id: userId,
            product_id,
            status: "approved",
            amount_paid: 0,
            approved_at: new Date().toISOString(),
          },
          { onConflict: "user_id,product_id", ignoreDuplicates: true }
        );

      if (purchaseError) {
        console.error("Erro ao criar purchase:", purchaseError);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        user_id: userId,
        message: "Convite enviado com sucesso.",
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Erro em admin-invite-student:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
};

serve(handler);
