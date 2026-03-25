// Supabase Edge Function: notify-admin
// Triggered after a new vault user is created via Create Account.
// Sends an email to the admin via Resend.
//
// Required Supabase secret (set via `supabase secrets set RESEND_API_KEY=...`):
//   RESEND_API_KEY — from https://resend.com/api-keys
//
// The `from` address must be a verified sender domain in your Resend account.
// Update ADMIN_EMAIL and FROM_ADDRESS below if needed.

const ADMIN_EMAIL = "shailja.dwivedi@fello.ai";
const FROM_ADDRESS = "BillFlow Vault <vault@fello.ai>"; // Must be a verified Resend sender

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405, headers: corsHeaders });
  }

  try {
    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    if (!RESEND_API_KEY) {
      return new Response(
        JSON.stringify({ error: "RESEND_API_KEY is not configured. Set it via: supabase secrets set RESEND_API_KEY=<your_key>" }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const { newUserEmail, role, createdAt } = await req.json();

    if (!newUserEmail) {
      return new Response(
        JSON.stringify({ error: "newUserEmail is required" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const formattedDate = new Date(createdAt || Date.now()).toUTCString();
    const roleDisplay = (role || "member").charAt(0).toUpperCase() + (role || "member").slice(1);

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: FROM_ADDRESS,
        to: [ADMIN_EMAIL],
        subject: `[BillFlow Vault] New account created — ${newUserEmail}`,
        html: `
          <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;max-width:520px;margin:0 auto;padding:24px;background:#f8fafc;border-radius:12px">
            <div style="background:#0e1219;border-radius:10px;padding:20px 24px;margin-bottom:20px">
              <h2 style="color:#00d4ff;margin:0 0 4px;font-size:18px">BillFlow Vault</h2>
              <p style="color:#64748b;margin:0;font-size:12px;text-transform:uppercase;letter-spacing:0.08em">New Account Notification</p>
            </div>
            <table style="width:100%;border-collapse:collapse;background:#fff;border-radius:10px;overflow:hidden;box-shadow:0 1px 4px rgba(0,0,0,0.08)">
              <tr>
                <td style="padding:12px 16px;color:#64748b;font-size:13px;border-bottom:1px solid #f1f5f9;width:110px">Email</td>
                <td style="padding:12px 16px;font-weight:600;font-size:13px;border-bottom:1px solid #f1f5f9">${newUserEmail}</td>
              </tr>
              <tr>
                <td style="padding:12px 16px;color:#64748b;font-size:13px;border-bottom:1px solid #f1f5f9">Role</td>
                <td style="padding:12px 16px;font-weight:600;font-size:13px;border-bottom:1px solid #f1f5f9">${roleDisplay}</td>
              </tr>
              <tr>
                <td style="padding:12px 16px;color:#64748b;font-size:13px">Created At</td>
                <td style="padding:12px 16px;font-size:13px">${formattedDate}</td>
              </tr>
            </table>
            <div style="margin-top:20px;padding:14px 16px;background:#fff8ed;border:1px solid #f5a623;border-radius:8px;font-size:13px;color:#92600a">
              To revoke access, set <code style="background:#fef3c7;padding:1px 5px;border-radius:3px">is_active = false</code>
              in the <code style="background:#fef3c7;padding:1px 5px;border-radius:3px">vault_members</code> table in Supabase.
            </div>
            <div style="margin-top:16px;text-align:center">
              <a href="https://spendsync-production.up.railway.app/"
                style="display:inline-block;padding:10px 20px;background:#00d4ff;color:#060910;text-decoration:none;border-radius:7px;font-weight:700;font-size:13px">
                Open BillFlow →
              </a>
            </div>
          </div>
        `,
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      return new Response(
        JSON.stringify({ error: `Resend API error (${res.status}): ${errText}` }),
        { status: res.status, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    return new Response(
      JSON.stringify({ ok: true }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (e) {
    return new Response(
      JSON.stringify({ error: String(e) }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
});
