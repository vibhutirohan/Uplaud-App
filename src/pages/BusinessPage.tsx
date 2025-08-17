import React, { useEffect, useState, useRef } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { ArrowLeft, MapPin, Tag, Users } from "lucide-react";
import axios from "axios";
import nlp from "compromise";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { motion, AnimatePresence } from "framer-motion";

const API_KEY = "patgat0IYY3MEpP0E.07c83079a93fcb0f6020e201ae6295542be839697d3eaa107f920a2395abdd6a";
const BASE_ID = "appFUJWWTaoJ3YiWt";
const REVIEWS_TABLE = "tblef0n1hQXiKPHxI";
const CIRCLES_TABLE = "tbldL8H5T4qYKUzLV";

/* ===================== Utils ===================== */
function slugify(name = "") {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)+/g, "");
}
function formatDate(date: Date | null) {
  if (!date) return "";
  return date.toLocaleDateString("en-US", { day: "2-digit", month: "long", year: "numeric" });
}
function emojiForScore(score?: number | null) {
  if (score === 5) return "🔥";
  if (score === 4) return "😍";
  if (score === 3 || score === 2) return "😐";
  if (score === 1) return "😤";
  return "😐";
}
function isValidCity(value?: string) {
  if (!value) return false;
  const s = value.trim();
  if (!s) return false;
  const placeholders = new Set(["unknown", "n/a", "na", "none", "-", "--", "null", "undefined", "not available"]);
  return !placeholders.has(s.toLowerCase());
}

/* ===================== “What people are saying” ===================== */
function MostMentionedWordsCard({ reviews }: { reviews: any[] }) {
  const counts: Record<string, number> = {};
  const texts = reviews.map((r) => (r?.uplaud || "").trim()).filter(Boolean);

  texts.forEach((t) => {
    const doc = nlp(t);
    const adj = (doc.adjectives().out("array") as string[]) || [];
    const vb = (doc.verbs().out("array") as string[]) || [];
    [...adj, ...vb].forEach((w) => {
      const word = String(w || "").toLowerCase().replace(/[^a-z\s-]/g, "").trim();
      if (!word || word.length < 3) return;
      counts[word] = (counts[word] || 0) + 1;
    });
  });

  const keywords = Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 12)
    .map(([word, count]) => ({ word, count }));

  return (
    <div style={{ background: "#FFF7E6" }} className="rounded-3xl p-8 border border-gray-100 shadow-lg h-full">
      <h3 className="text-2xl font-black text-black mb-5">What people are saying</h3>
      {keywords.length ? (
        <div className="flex flex-wrap gap-3">
          {keywords.map(({ word, count }) => (
            <div
              key={word}
              className="bg-purple-100 text-purple-700 px-6 py-3 rounded-full font-semibold hover:bg-purple-200 transition"
              title={`${count} mention${count === 1 ? "" : "s"}`}
            >
              {word} ({count})
            </div>
          ))}
        </div>
      ) : (
        <div className="text-gray-400 text-base">No expressive/action keywords found.</div>
      )}
    </div>
  );
}

/* ===================== Right analytics tabs ===================== */
function UniqueReviewersTab({ numReviewers }: { numReviewers: number }) {
  return (
    <div className="flex flex-col items-center justify-center h-full py-8">
      <div className="inline-flex items-center justify-center w-16 h-16 rounded-full mb-3 bg-purple-100 text-purple-700 shadow-md">
        <Users className="w-8 h-8" />
      </div>
      <div className="text-3xl font-black text-black mb-1">{numReviewers}</div>
      <div className="text-lg font-black text-gray-600 mb-1">Unique Reviewer{numReviewers === 1 ? "" : "s"}</div>
      <div className="mt-1 text-base text-gray-600 text-center">
        This business has received {numReviewers} unique review{numReviewers === 1 ? "" : "s"} from real users.
      </div>
    </div>
  );
}

function OverallSentimentTab({ sentimentScore }: { sentimentScore: number }) {
  const steps = [
    { emoji: "🔥", label: "Amazing" },
    { emoji: "😍", label: "Love it" },
    { emoji: "😐", label: "Okay" },
    { emoji: "😤", label: "Issues" },
  ];
  return (
    <div className="flex flex-col justify-center h-full py-6">
      <h4 className="text-xl font-bold text-black mb-6 text-center">Overall sentiment</h4>
      <div className="bg-gray-100 rounded-full h-8 overflow-hidden mb-3">
        <div className="h-full flex">
          <div
            className="flex items-center justify-center text-white text-sm font-bold transition-all duration-1000 ease-out bg-gradient-to-r from-purple-600 to-purple-500"
            style={{ width: `${sentimentScore}%` }}
          >
            {sentimentScore > 7 ? `${sentimentScore}%` : ""}
          </div>
          <div className="bg-gray-400 flex items-center justify-center text-white text-sm font-bold" style={{ width: `${100 - sentimentScore}%` }}>
            {sentimentScore <= 7 ? `${sentimentScore}%` : ""}
          </div>
        </div>
      </div>
      <div className="flex justify-center gap-8 mt-4 mb-1">
        {steps.map(({ emoji, label }) => (
          <div key={label} className="flex flex-col items-center min-w-[48px]">
            <span className="text-2xl">{emoji}</span>
            <span className="text-gray-700 font-medium text-xs mt-1">{label}</span>
          </div>
        ))}
      </div>
      <div className="text-center font-semibold text-base mt-5">
        <span className="text-purple-600">{sentimentScore}% satisfaction based on all reviews</span>
      </div>
    </div>
  );
}

function RightAnalyticsTabs({ numReviewers, sentimentScore }: { numReviewers: number; sentimentScore: number }) {
  const [tab, setTab] = useState<"reviewers" | "sentiment">("reviewers");
  const [auto, setAuto] = useState(true);

  useEffect(() => {
    if (!auto) return;
    const t = setInterval(() => setTab((p) => (p === "reviewers" ? "sentiment" : "reviewers")), 4000);
    return () => clearInterval(t);
  }, [auto]);

  return (
    <motion.div style={{ background: "#FFF7E6" }} className="rounded-3xl p-8 border border-gray-100 shadow-lg h-full" onMouseLeave={() => setAuto(true)}>
      <div className="flex justify-center gap-2 mb-4">
        <motion.button
          className={`px-5 py-2 rounded-full font-semibold ${tab === "reviewers" ? "bg-purple-600 text-white shadow" : "bg-purple-50 text-purple-700 hover:bg-purple-100"}`}
          whileTap={{ scale: 0.98 }}
          onClick={() => {
            setTab("reviewers");
            setAuto(false);
          }}
        >
          Unique Reviewers
        </motion.button>
        <motion.button
          className={`px-5 py-2 rounded-full font-semibold ${tab === "sentiment" ? "bg-purple-600 text-white shadow" : "bg-purple-50 text-purple-700 hover:bg-purple-100"}`}
          whileTap={{ scale: 0.98 }}
          onClick={() => {
            setTab("sentiment");
            setAuto(false);
          }}
        >
          Overall Sentiment
        </motion.button>
      </div>

      <AnimatePresence mode="wait">
        {tab === "reviewers" ? (
          <motion.div key="reviewers" initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
            <UniqueReviewersTab numReviewers={numReviewers} />
          </motion.div>
        ) : (
          <motion.div key="sentiment" initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
            <OverallSentimentTab sentimentScore={sentimentScore} />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

/* ===================== Header ===================== */
function BusinessHeader({ name, city, category }: { name: string; city: string; category: string }) {
  const handleClaimClick = () => {
    window.open(
      "https://docs.google.com/forms/d/e/1FAIpQLScOFSp2wEGN50-d58e43laMRW2RuPbEr4407R34pZVw4eDYhA/viewform",
      "_blank"
    );
  };
  const showCity = isValidCity(city);

  return (
    <div style={{ background: "#FFF7E6" }} className="rounded-3xl p-8 border border-gray-100 shadow-sm mb-10 flex flex-col sm:flex-row justify-between items-center gap-6">
      <div className="flex-1 min-w-0">
        <h1 className="text-2xl md:text-4xl lg:text-2xl font-black text-black mb-4 tracking-tight truncate">{name}</h1>
        <div className="flex flex-wrap gap-4">
          {showCity && (
            <Badge className="bg-purple-100 text-purple-700 hover:bg-purple-200 px-6 py-3 rounded-full text-base font-semibold border-0 flex items-center gap-2">
              <MapPin className="w-5 h-5" />
              {city}
            </Badge>
          )}
          {category && (
            <Badge className="bg-gray-100 text-gray-700 hover:bg-gray-200 px-6 py-3 rounded-full text-base font-semibold border-0 flex items-center gap-2">
              <Tag className="w-5 h-5" />
              {category}
            </Badge>
          )}
        </div>
      </div>
      <Button
        variant="outline"
        className="border-2 border-purple-200 text-purple-600 hover:bg-purple-50 hover:border-purple-300 rounded-full px-8 py-3 font-semibold text-base whitespace-nowrap"
        onClick={handleClaimClick}
      >
        Claim this business
      </Button>
    </div>
  );
}

/* ===================== Page ===================== */
const BusinessPage = () => {
  const { slug } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [business, setBusiness] = useState({
    name: "",
    city: "",
    category: "",
    reviews: [] as any[],
    avgScore: null as number | null,
    totalReviews: 0,
  });
  const [sentimentScore, setSentimentScore] = useState(0);
  const [referralScore, setReferralScore] = useState({ score: 0, numReferrals: 0, numReviewers: 0 });

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        // Reviews
        let allReviews: any[] = [];
        let offset: string | undefined = undefined;
        do {
          const params: any = { pageSize: 100, offset };
          const revResp = await axios.get(`https://api.airtable.com/v0/${BASE_ID}/${REVIEWS_TABLE}`, {
            headers: { Authorization: `Bearer ${API_KEY}` },
            params,
          });
          allReviews = allReviews.concat(revResp.data.records);
          offset = revResp.data.offset;
        } while (offset);

        const filtered = allReviews
          .filter((r: any) => slugify(r.fields.business_name || "") === slug)
          .map((r: any) => {
            const rawCity = r.fields["City"];
            const safeCity =
              typeof rawCity === "string"
                ? rawCity.trim()
                : Array.isArray(rawCity)
                ? String(rawCity[0] || "").trim()
                : "";

            let userName = "";
            if (typeof r.fields["Name_Creator"] === "string" && r.fields["Name_Creator"].trim() !== "") {
              userName = r.fields["Name_Creator"];
            } else if (typeof r.fields["Reviewer"] === "string" && r.fields["Reviewer"].trim() !== "") {
              userName = r.fields["Reviewer"];
            } else if (Array.isArray(r.fields["Name_Creator"]) && r.fields["Name_Creator"][0]) {
              userName = r.fields["Name_Creator"][0];
            } else if (Array.isArray(r.fields["Reviewer"]) && r.fields["Reviewer"][0]) {
              userName = r.fields["Reviewer"][0];
            } else {
              userName = "Anonymous";
            }
            return {
              user: userName,
              uplaud: r.fields["Uplaud"] || "",
              date: r.fields["Date_Added"] ? new Date(r.fields["Date_Added"]) : null,
              score: typeof r.fields["Uplaud Score"] === "number" ? r.fields["Uplaud Score"] : null,
              location: safeCity,
              category: r.fields["Category"] || "",
              business_name: r.fields.business_name || "",
            };
          });

        // Averages & sentiment
        let avgScore: number | null = null;
        let computedSentiment = 0;
        if (filtered.length) {
          const totalStars = filtered.reduce((sum, r) => sum + (r.score || 0), 0);
          avgScore = parseFloat((totalStars / filtered.length).toFixed(2));
          computedSentiment = Math.round((totalStars / (filtered.length * 5)) * 100);
        }

        // Circles/referrals
        let allReferrals: any[] = [];
        let refOffset: string | undefined = undefined;
        do {
          const params: any = { pageSize: 100, offset: refOffset };
          const circlesResp = await axios.get(`https://api.airtable.com/v0/${BASE_ID}/${CIRCLES_TABLE}`, {
            headers: { Authorization: `Bearer ${API_KEY}` },
            params,
          });
          allReferrals = allReferrals.concat(circlesResp.data.records);
          refOffset = circlesResp.data.offset;
        } while (refOffset);

        const referralsForBusiness = allReferrals.filter((r: any) => slugify(r.fields.business_name || "") === slug);

        const initiatorSet = new Set<string>();
        referralsForBusiness.forEach((r: any) => {
          if (r.fields["Initiator"]) initiatorSet.add(r.fields["Initiator"]);
        });

        const reviewersSet = new Set<string>();
        filtered.forEach((r: any) => {
          if (r.user && r.user !== "Anonymous") reviewersSet.add(r.user);
        });

        const numReferrals = initiatorSet.size;
        const numReviewers = reviewersSet.size;
        const score = numReviewers > 0 ? Math.round((numReferrals / numReviewers) * 100) : 0;

        const firstCity = filtered.find((r: any) => isValidCity(r.location))?.location?.trim() || "";

        setReferralScore({ score, numReferrals, numReviewers });

        setBusiness({
          name: filtered[0]?.business_name || (slug ? slug.replace(/-/g, " ") : ""),
          city: firstCity,
          category: filtered[0]?.category || "",
          reviews: filtered,
          avgScore,
          totalReviews: filtered.length,
        });

        setSentimentScore(computedSentiment);
      } catch {
        setBusiness({ name: slug ? slug.replace(/-/g, " ") : "", city: "", category: "", reviews: [], avgScore: null, totalReviews: 0 });
        setSentimentScore(0);
        setReferralScore({ score: 0, numReferrals: 0, numReviewers: 0 });
      } finally {
        setLoading(false);
      }
    }
    if (slug) fetchData();
  }, [slug]);

  /* ========= REVIEW CARD (Profile-style: beige outer, WhatsApp green inner) ========= */
  function ReviewCard({ review }: { review: any }) {
    return (
      <div
        className="flex flex-col rounded-2xl px-4 sm:px-6 py-4 sm:py-5 shadow group transition hover:shadow-xl border"
        style={{ alignItems: "flex-start", background: "#FFF7E6", borderColor: "rgba(0,0,0,0.06)", backdropFilter: "blur(6px)" }}
      >
        {/* Header */}
        <div className="flex items-center w-full mb-2 gap-2">
          <Link
            to={`/profile/${slugify(review.user)}`}
            className="font-bold text-base sm:text-lg text-black hover:underline hover:text-purple-700 flex-1 min-w-0 truncate"
            title={review.user}
          >
            {review.user}
          </Link>

          <div className="ml-auto flex items-center gap-2 shrink-0 whitespace-nowrap">
            {review.score ? (
              <span className="flex items-center shrink-0 whitespace-nowrap leading-none">
                {Array.from({ length: review.score }).map((_, i) => (
                  <span key={i} className="text-yellow-400 text-sm sm:text-lg leading-none">★</span>
                ))}
                <span className="ml-1 text-lg sm:text-2xl leading-none">{emojiForScore(review.score)}</span>
              </span>
            ) : null}
            <span className="text-gray-500 text-xs sm:text-sm font-medium leading-none">{formatDate(review.date)}</span>
          </div>
        </div>

        {/* WhatsApp-style inner bubble */}
        <div
          className="mt-2 rounded-xl border px-4 sm:px-6 py-4 text-gray-900 shadow-sm text-base font-medium break-words"
          style={{ background: "#DCF8C6" }}   // same as Profile page
        >
          <span style={{ display: "block", wordBreak: "break-word" }}>{review.uplaud}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full" style={{ background: "#6D46C6", fontFamily: `'Inter', 'Poppins', 'Segoe UI', Arial, sans-serif` }}>
      <div className="max-w-6xl mx-auto px-2 sm:px-6 py-12">
        <div className="mb-6">
          <Button
            variant="outline"
            className="text-purple-700 font-bold flex items-center gap-2 border border-purple-200 shadow"
            style={{ background: "#FFF7E6" }}
            onClick={() => navigate(-1)}
          >
            <ArrowLeft className="w-5 h-5" /> Back
          </Button>
        </div>

        <BusinessHeader name={business.name} city={business.city} category={business.category} />

        {/* Analytics */}
        <div className="w-full mt-2 mb-8 flex flex-col lg:flex-row gap-8">
          <div className="w-full lg:w-1/2 flex-1">
            <MostMentionedWordsCard reviews={business.reviews} />
          </div>
          <div className="w-full lg:w-1/2 flex-1">
            <RightAnalyticsTabs numReviewers={referralScore.numReviewers} sentimentScore={sentimentScore} />
          </div>
        </div>

        {/* Reviews list container */}
        <div
          className="w-full mx-auto mt-8 mb-8 rounded-3xl shadow-lg border p-5 md:p-10"
          style={{ background: "rgba(255,255,255,0.75)", backdropFilter: "blur(8px)", borderColor: "rgba(255,255,255,0.6)" }}
        >
          <h2 className="text-black font-black text-3xl mb-8">Reviews</h2>
          {loading ? (
            <div className="text-center text-gray-400 py-8">Loading reviews…</div>
          ) : business.reviews.length === 0 ? (
            <div className="text-center text-gray-400 py-8">No reviews found for this business.</div>
          ) : (
            <div className="space-y-5 sm:space-y-7">
              {business.reviews.map((review, idx) => (
                <ReviewCard key={idx} review={review} />
              ))}
            </div>
          )}
        </div>
      </div>
      <style>{`body { background: #6D46C6 !important; }`}</style>
    </div>
  );
};

export default BusinessPage;
