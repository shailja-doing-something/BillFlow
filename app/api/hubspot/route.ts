import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { HUBSPOT_TICKETS } from "@/lib/hubspot";
import { HubspotTicket } from "@/types";

// Convert static legacy tickets to the DB shape so the UI can render them uniformly
function staticToDb(t: typeof HUBSPOT_TICKETS[number], i: number): HubspotTicket {
  return {
    id: `static-${i}`,
    created_at: "2025-01-01T00:00:00Z",
    ticket_link: t.ticketLink,
    category: t.category,
    list_detail: t.listDetail,
    contacts_to_enrich: t.contactsToEnrich,
    fields_to_enrich: t.fieldsToEnrich,
    eta: t.eta,
    enrichment_status: t.enrichmentStatus,
    valid_enriched: t.validEnriched,
    hit_rate: t.hitRate,
    final_status: t.finalStatus,
    notes: t.notes,
    owner: null,
  };
}

export async function GET() {
  const { data, error } = await supabase
    .from("hubspot_tickets")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    // DB unavailable — fall back to static data
    return NextResponse.json(HUBSPOT_TICKETS.map(staticToDb));
  }

  const dbRows: HubspotTicket[] = data ?? [];

  // If DB has rows, use DB only. If empty, fall back to static data.
  if (dbRows.length > 0) {
    return NextResponse.json(dbRows);
  }

  return NextResponse.json(HUBSPOT_TICKETS.map(staticToDb));
}

export async function POST(req: NextRequest) {
  const body = await req.json();

  const { data, error } = await supabase
    .from("hubspot_tickets")
    .insert([{
      ticket_link: body.ticket_link || null,
      category: body.category || null,
      list_detail: body.list_detail || null,
      contacts_to_enrich: Number(body.contacts_to_enrich) || 0,
      fields_to_enrich: body.fields_to_enrich || null,
      eta: body.eta || null,
      enrichment_status: body.enrichment_status || null,
      valid_enriched: body.valid_enriched ? Number(body.valid_enriched) : null,
      hit_rate: body.hit_rate != null && body.hit_rate !== "" ? Number(body.hit_rate) : null,
      final_status: body.final_status || null,
      notes: body.notes || null,
      owner: body.owner || null,
    }])
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}
