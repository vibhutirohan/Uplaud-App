import React, { useEffect, useState, useRef } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { ArrowLeft, MapPin, Tag, Users } from "lucide-react";
import axios from "axios";
import nlp from "compromise";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { motion, AnimatePresence } from "framer-motion";

const API_KEY = 'patgat0IYY3MEpP0E.07c83079a93fcb0f6020e201ae6295542be839697d3eaa107f920a2395abdd6a';
const BASE_ID = 'appFUJWWTaoJ3YiWt';
const REVIEWS_TABLE = 'tblef0n1hQXiKPHxI';
const CIRCLES_TABLE = 'tbldL8H5T4qYKUzLV';

function slugify(name = "") {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
}
function formatDate(date) {
  if (!date) return "";
  return date.toLocaleDateString("en-US", {
    day: "2-digit",
    month: "long",
    year: "numeric"
  });
}
function emojiForScore(score) {
  if (score === 5) return "🔥";
  if (score === 4) return "😍";
  if (score === 3 || score === 2) return "😐";
  if (score === 1) return "😤";
  return "😐";
}
function getInitials(name) {
  if (!name) return "?";
  const parts = name.split(" ").filter(Boolean);
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

function MostMentionedWordsCard({ reviews }) {
  const wordCounts = {};
  reviews.forEach((review) => {
    if (!review.uplaud) return;
    const doc = nlp(review.uplaud);
    const adjectives = doc.adjectives().out('array');
    const verbs = doc.verbs().out('array');
    [...adjectives, ...verbs].forEach((word) => {
      const w = word.toLowerCase();
      if (!w || w.length < 3) return;
      wordCounts[w] = (wordCounts[w] || 0) + 1;
    });
  });
  const sortedWords = Object.entries(wordCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);

  return (
    <div style={{ background: "#FFF7E6" }} className="rounded-3xl p-8 border border-gray-100 shadow-lg h-full flex flex-col justify-between">
      <div>
        <h3 className="text-2xl font-black text-black mb-5">What people are saying</h3>
        <h4 className="text-lg font-bold text-black mb-4"></h4>
        <div className="flex flex-wrap gap-3 mb-7">
          {sortedWords.length === 0 ? (
            <div className="text-gray-400 text-lg">No expressive/action keywords found.</div>
          ) : sortedWords.map(([word, count], index) => (
            <div
              key={index}
              className="bg-purple-100 text-purple-700 px-6 py-3 rounded-full font-semibold hover:bg-purple-200 transition-all duration-200 cursor-pointer hover:scale-105"
            >
              {word} ({count})
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function UniqueReviewersTab({ numReviewers }) {
  return (
    <div className="flex flex-col items-center justify-center h-full py-8">
      <div className="inline-flex items-center justify-center w-16 h-16 rounded-full mb-3 bg-purple-100 text-purple-700 shadow-md">
        <Users className="w-8 h-8" />
      </div>
      <div className="text-3xl font-black text-black mb-1">{numReviewers}</div>
      <div className="text-lg font-black text-gray-600 mb-1">Unique Reviewer{numReviewers === 1 ? '' : 's'}</div>
      <div className="mt-1 text-base text-gray-600 text-center">
        This business has received {numReviewers} unique review{numReviewers === 1 ? '' : 's'} from real users.
      </div>
    </div>
  );
}

function OverallSentimentTab({ sentimentScore }) {
  const sentimentEmojis = [
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
          <div
            className="bg-gray-400 flex items-center justify-center text-white text-sm font-bold"
            style={{ width: `${100 - sentimentScore}%` }}
          >
            {sentimentScore <= 7 ? `${sentimentScore}%` : ""}
          </div>
        </div>
      </div>
      <div className="flex justify-center gap-8 mt-4 mb-1">
        {sentimentEmojis.map(({ emoji, label }) => (
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

// Animated Tabs with Framer Motion
function RightAnalyticsTabs({ numReviewers, sentimentScore }) {
  const [tab, setTab] = useState("reviewers");
  const [autoSwitch, setAutoSwitch] = useState(true);
  const tabPanelRef = useRef(null);

  // Animation: Auto-toggle between tabs unless user interacts
  useEffect(() => {
    if (!autoSwitch) return;
    const timer = setInterval(() => {
      setTab((prev) => (prev === "reviewers" ? "sentiment" : "reviewers"));
    }, 4000);
    return () => clearInterval(timer);
  }, [autoSwitch]);

  // Handlers for user interaction
  const handleTabClick = (nextTab) => {
    setTab(nextTab);
    setAutoSwitch(false); // Lock tab when clicked
  };
  const handlePanelMouseLeave = () => {
    setAutoSwitch(true); // Resume animation
  };

  return (
    <motion.div
      style={{ background: "#FFF7E6" }}
      className="rounded-3xl p-8 border border-gray-100 shadow-lg h-full flex flex-col"
      ref={tabPanelRef}
      onMouseLeave={handlePanelMouseLeave}
    >
      <div className="flex justify-center gap-2 mb-4">
        <motion.button
          className={`px-5 py-2 rounded-full font-semibold transition text-base focus:outline-none ${
            tab === "reviewers"
              ? "bg-purple-600 text-white shadow tab-active scale-105"
              : "bg-purple-50 text-purple-700 hover:bg-purple-100"
          }`}
          whileTap={{ scale: 0.98 }}
          animate={tab === "reviewers" ? { scale: 1.07 } : { scale: 1 }}
          transition={{ type: "spring", stiffness: 250, damping: 17 }}
          onClick={() => handleTabClick("reviewers")}
        >
          Unique Reviewers
        </motion.button>
        <motion.button
          className={`px-5 py-2 rounded-full font-semibold transition text-base focus:outline-none ${
            tab === "sentiment"
              ? "bg-purple-600 text-white shadow tab-active scale-105"
              : "bg-purple-50 text-purple-700 hover:bg-purple-100"
          }`}
          whileTap={{ scale: 0.98 }}
          animate={tab === "sentiment" ? { scale: 1.07 } : { scale: 1 }}
          transition={{ type: "spring", stiffness: 250, damping: 17 }}
          onClick={() => handleTabClick("sentiment")}
        >
          Overall Sentiment
        </motion.button>
      </div>
      <div className="flex-1 flex flex-col">
        <AnimatePresence mode="wait">
          {tab === "reviewers" ? (
            <motion.div
              key="reviewers"
              initial={{ opacity: 0, y: 35, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -30, scale: 0.98 }}
              transition={{ type: "spring", duration: 0.6 }}
              className="h-full"
            >
              <UniqueReviewersTab numReviewers={numReviewers} />
            </motion.div>
          ) : (
            <motion.div
              key="sentiment"
              initial={{ opacity: 0, y: 35, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -30, scale: 0.98 }}
              transition={{ type: "spring", duration: 0.6 }}
              className="h-full"
            >
              <OverallSentimentTab sentimentScore={sentimentScore} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

function BusinessHeader({ name, city, category }) {
  const handleClaimClick = () => {
    window.open(
      "https://docs.google.com/forms/d/e/1FAIpQLScOFSp2wEGN50-d58e43laMRW2RuPbEr4407R34pZVw4eDYhA/viewform",
      "_blank"
    );
  };
  return (
    <div style={{ background: "#FFF7E6" }} className="rounded-3xl p-8 border border-gray-100 shadow-sm mb-10 flex flex-col sm:flex-row justify-between items-center gap-6">
      <div className="flex-1 min-w-0">
        <h1 className="text-2xl md:text-4xl lg:text-2xl font-black text-black mb-4 tracking-tight truncate">
          {name}
        </h1>
        <div className="flex flex-wrap gap-4">
          {city && (
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
};

const BusinessPage = () => {
  const { slug } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [business, setBusiness] = useState({
    name: "",
    city: "",
    category: "",
    reviews: [],
    avgScore: null,
    totalReviews: 0,
  });
  const [sentimentScore, setSentimentScore] = useState(0);
  const [referralScore, setReferralScore] = useState({
    score: 0,
    numReferrals: 0,
    numReviewers: 0,
  });

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        let allReviews = [];
        let offset = undefined;
        do {
          const params = { pageSize: 100, offset };
          const revResp = await axios.get(
            `https://api.airtable.com/v0/${BASE_ID}/${REVIEWS_TABLE}`,
            {
              headers: { Authorization: `Bearer ${API_KEY}` },
              params,
            }
          );
          allReviews = allReviews.concat(revResp.data.records);
          offset = revResp.data.offset;
        } while (offset);

        const filtered = allReviews
          .filter((r) => slugify(r.fields.business_name || "") === slug)
          .map((r) => {
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
              location: r.fields["City"] || "",
              category: r.fields["Category"] || "",
              business_name: r.fields.business_name || "",
            };
          });

        let avgScore = null;
        let sentimentScore = 0;
        if (filtered.length) {
          const totalStars = filtered.reduce((sum, r) => sum + (r.score || 0), 0);
          avgScore = (totalStars / filtered.length).toFixed(2);
          sentimentScore = Math.round((totalStars / (filtered.length * 5)) * 100);
        }

        // Circles/referrals logic
        let allReferrals = [];
        let refOffset = undefined;
        do {
          const params = { pageSize: 100, offset: refOffset };
          const circlesResp = await axios.get(
            `https://api.airtable.com/v0/${BASE_ID}/${CIRCLES_TABLE}`,
            {
              headers: { Authorization: `Bearer ${API_KEY}` },
              params,
            }
          );
          allReferrals = allReferrals.concat(circlesResp.data.records);
          refOffset = circlesResp.data.offset;
        } while (refOffset);

        const referralsForBusiness = allReferrals.filter(
          (r) => slugify(r.fields.business_name || "") === slug
        );

        const initiatorSet = new Set();
        referralsForBusiness.forEach((r) => {
          if (r.fields["Initiator"]) initiatorSet.add(r.fields["Initiator"]);
        });

        const reviewersSet = new Set();
        filtered.forEach((r) => {
          if (r.user && r.user !== "Anonymous") reviewersSet.add(r.user);
        });

        const numReferrals = initiatorSet.size;
        const numReviewers = reviewersSet.size;
        const score = numReviewers > 0 ? Math.round((numReferrals / numReviewers) * 100) : 0;

        setReferralScore({
          score,
          numReferrals,
          numReviewers,
        });

        setBusiness({
          name: filtered[0]?.business_name || (slug ? slug.replace(/-/g, ' ') : ''),
          city: filtered[0]?.location || "",
          category: filtered[0]?.category || "",
          reviews: filtered,
          avgScore,
          totalReviews: filtered.length,
        });

        setSentimentScore(sentimentScore);

      } catch (e) {
        setBusiness({
          name: slug ? slug.replace(/-/g, ' ') : '',
          city: "",
          category: "",
          reviews: [],
          avgScore: null,
          totalReviews: 0,
        });
        setSentimentScore(0);
        setReferralScore({ score: 0, numReferrals: 0, numReviewers: 0 });
      } finally {
        setLoading(false);
      }
    }
    if (slug) fetchData();
  }, [slug]);

  function ReviewCard({ review }) {
    return (
      <div
        className="flex flex-col sm:flex-row rounded-2xl px-5 sm:px-7 py-5 sm:py-6 shadow group transition hover:shadow-xl"
        style={{ alignItems: "flex-start", background: "#FFF7E6" }}
      >
        <Link
          to={`/profile/${slugify(review.user)}`}
          className="flex-shrink-0 flex flex-col items-center mr-0 sm:mr-5 mb-2 sm:mb-0 group cursor-pointer"
          style={{ textDecoration: "none" }}
        >
          <div
            className="rounded-full border border-purple-400 font-bold flex items-center justify-center select-none"
            style={{
              background: "#fff",
              width: 48,
              height: 48,
              color: "#6D46C6",
              fontSize: "1.15rem",
              letterSpacing: 1,
            }}
            title={review.user}
          >
            {getInitials(review.user)}
          </div>
        </Link>
        <div className="flex-1 w-full">
          <div className="flex items-center w-full mb-2 flex-wrap gap-1">
            <Link
              to={`/profile/${slugify(review.user)}`}
              className="font-bold text-base sm:text-lg text-black hover:underline hover:text-purple-700"
            >
              {review.user}
            </Link>
            <span className="flex-1" />
            <span className="text-gray-500 text-sm font-medium">
              {formatDate(review.date)}
            </span>
          </div>
          {/* Green review box with stars and emoji inside (right side) */}
          <div
            className="mt-2 rounded-xl border px-4 sm:px-6 py-4 text-gray-900 shadow-sm text-base font-medium break-words flex justify-between items-center flex-wrap"
            style={{ background: "#DCF8C6" }}
          >
            <span style={{ flex: "1 1 auto", minWidth: 0, wordBreak: "break-word" }}>
              {review.uplaud}
            </span>
            {review.score ? (
              <span
                className="ml-2 flex-shrink-0 flex items-center review-stars-inside-box"
                style={{ minWidth: 60 }}
              >
                {Array.from({ length: review.score }).map((_, i) => (
                  <span key={i} className="text-yellow-400 text-lg leading-none">★</span>
                ))}
                <span className="ml-1 text-2xl">{emojiForScore(review.score)}</span>
              </span>
            ) : null}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen w-full"
      style={{
        background: "#6D46C6",
        minHeight: "100vh",
        fontFamily: `'Inter', 'Poppins', 'Segoe UI', Arial, sans-serif`
      }}
    >
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

        {/* --- Analytics Section --- */}
        <div className="w-full mt-2 mb-8 flex flex-col lg:flex-row gap-8">
          <div className="w-full lg:w-1/2 flex-1">
            <MostMentionedWordsCard reviews={business.reviews} />
          </div>
          <div className="w-full lg:w-1/2 flex-1">
            <RightAnalyticsTabs
              numReviewers={referralScore.numReviewers}
              sentimentScore={sentimentScore}
            />
          </div>
        </div>

        {/* --- RECENT REVIEWS --- */}
        <div className="w-full mx-auto mt-8 mb-8 rounded-3xl shadow-lg border border-purple-100 p-5 md:p-10" style={{ background: "#FFF7E6" }}>
          <h2 className="text-black font-black text-3xl mb-8"> Reviews</h2>
          {loading ? (
            <div className="text-center text-gray-400 py-8">Loading reviews…</div>
          ) : business.reviews.length === 0 ? (
            <div className="text-center text-gray-400 py-8">No reviews found for this business.</div>
          ) : (
            <div className="space-y-7">
              {business.reviews.map((review, idx) => (
                <ReviewCard key={idx} review={review} />
              ))}
            </div>
          )}
        </div>
      </div>
      <style>{`
        body { background: #6D46C6 !important; }
      `}</style>
    </div>
  );
};

export default BusinessPage;
