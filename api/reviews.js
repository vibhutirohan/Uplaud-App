export default async function handler(req, res) {
  try {
    const { businessSlug, reviewerPhone, userId, userName } = req.query;
    const API_KEY = process.env.AIRTABLE_API_KEY;
    const BASE_ID = process.env.AIRTABLE_BASE_ID;
    const REVIEWS = process.env.AIRTABLE_REVIEWS_TABLE;
    const headers = { Authorization: `Bearer ${API_KEY}` };

    const slugify = s => (s||"").toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/(^-|-$)+/g,"");
    const collect = async (filterByFormula) => {
      let out=[], offset;
      do {
        const url = new URL(`https://api.airtable.com/v0/${BASE_ID}/${REVIEWS}`);
        url.searchParams.set("pageSize","100");
        if (offset) url.searchParams.set("offset", offset);
        if (filterByFormula) url.searchParams.set("filterByFormula", filterByFormula);
        const r = await fetch(url, { headers });
        const j = await r.json();
        out = out.concat(j.records || []);
        offset = j.offset;
      } while (offset);
      return out;
    };

    let recs=[];
    if (reviewerPhone) recs = await collect(`({ReviewerPhoneNumber}='${reviewerPhone}')`);
    else if (userId) recs = await collect(`{ID (from Creator)}="${userId}"`);
    else if (userName) recs = await collect(`{Name_Creator}="${userName}"`);
    else if (businessSlug) recs = (await collect()).filter(r => slugify(r.fields.business_name||"")===businessSlug);
    else return res.status(200).json({ reviews: [] });

    const reviews = recs.map(r => {
      const f = r.fields||{};
      const city = Array.isArray(f.City) ? (f.City[0]||"").trim() :
                   typeof f.City==="string" ? f.City.trim() : "";
      const user =
        (typeof f["Name_Creator"]==="string" && f["Name_Creator"].trim()) ? f["Name_Creator"] :
        (Array.isArray(f["Name_Creator"]) && f["Name_Creator"][0]) ? f["Name_Creator"][0] :
        (typeof f["Reviewer"]==="string" && f["Reviewer"].trim()) ? f["Reviewer"] :
        (Array.isArray(f["Reviewer"]) && f["Reviewer"][0]) ? f["Reviewer"][0] : "Anonymous";
      return {
        businessName: f.business_name || "",
        uplaud: f.Uplaud || "",
        date: f.Date_Added || null,
        score: typeof f["Uplaud Score"]==="number" ? f["Uplaud Score"] : null,
        shareLink: f["Share Link"] || "",
        referralLink: f["ReferralLink"] || f["Referral Link"] || "",
        location: city,
        category: f.Category || "Other",
        user
      };
    }).filter(x => x.businessName && x.uplaud)
      .sort((a,b)=> new Date(b.date||0) - new Date(a.date||0));

    res.status(200).json({ reviews });
  } catch (e) { res.status(500).json({ error: "server error" }); }
}
