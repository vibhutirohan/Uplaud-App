export default async function handler(req, res) {
  try {
    const { initiatorName, businessSlug } = req.query;
    const API_KEY = process.env.AIRTABLE_API_KEY;
    const BASE_ID = process.env.AIRTABLE_BASE_ID;
    const CIRCLES = process.env.AIRTABLE_CIRCLES_TABLE;
    const headers = { Authorization: `Bearer ${API_KEY}` };
    const slugify = s => (s||"").toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/(^-|-$)+/g,"");

    let recs=[], offset;
    do {
      const url = new URL(`https://api.airtable.com/v0/${BASE_ID}/${CIRCLES}`);
      url.searchParams.set("pageSize","100");
      if (offset) url.searchParams.set("offset", offset);
      if (initiatorName) url.searchParams.set("filterByFormula", `{Initiator}="${initiatorName}"`);
      const r = await fetch(url, { headers }); const j = await r.json();
      recs = recs.concat(j.records||[]); offset = j.offset;
    } while (offset);

    if (businessSlug) recs = recs.filter(r => slugify(r.fields?.business_name||"") === businessSlug);

    res.status(200).json({ circles: recs.map(r => r.fields) });
  } catch (e) { res.status(500).json({ error: "server error" }); }
}
