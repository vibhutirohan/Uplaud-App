import React, { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { ArrowLeft, MapPin, Tag, Users } from "lucide-react";
import axios from "axios";
import nlp from "compromise";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

// Airtable config
const API_KEY = 'patgat0IYY3MEpP0E.07c83079a93fcb0f6020e201ae6295542be839697d3eaa107f920a2395abdd6a';
const BASE_ID = 'appFUJWWTaoJ3YiWt';
const REVIEWS_TABLE = 'tblef0n1hQXiKPHxI';
const CIRCLES_TABLE = 'tbldL8H5T4qYKUzLV';

// Common stopwords
const STOPWORDS = new Set([
  "the", "is", "in", "at", "and", "to", "a", "of", "was", "for", "it", "on", "with", "as", "an", "by", "were", "so", "be", "but", "if", "or",
  "had", "from", "that", "this", "are", "my", "me", "we", "our", "us", "very", "you", "they", "he", "she", "his", "her", "their", "them",
  "all", "can", "just", "will", "has", "have", "not", "too", "about", "out", "your", "more", "one", "also", "there", "would", "what"
]);

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
function getInitials(name) {
  if (!name || typeof name !== "string") return "A";
  const words = name.split(" ");
  if (words.length === 1) return words[0][0].toUpperCase();
  return (words[0][0] + words[1][0]).toUpperCase();
}
function emojiForScore(score) {
  if (score === 5) return "🔥";
  if (score === 4) return "😍";
  if (score === 3 || score === 2) return "😐";
  if (score === 1) return "😤";
  return "😐";
}

// --- Most Mentioned Words Card ---
function MostMentionedWordsCard({ reviews }) {
  const wordCounts = {};
  reviews.forEach((review) => {
    if (!review.uplaud) return;
    const doc = nlp(review.uplaud);
    const adjectives = doc.adjectives().out('array');
    const verbs = doc.verbs().out('array');
    [...adjectives, ...verbs].forEach((word) => {
      const w = word.toLowerCase();
      if (!w || STOPWORDS.has(w)) return;
      wordCounts[w] = (wordCounts[w] || 0) + 1;
    });
  });
  const sortedWords = Object.entries(wordCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);

  return (
    <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-lg h-full flex flex-col justify-between">
      <div>
        <h3 className="text-2xl font-black text-black mb-5">What people are saying</h3>
        <h4 className="text-lg font-bold text-black mb-4">Expressive & Action Words</h4>
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

// --- Unique Reviewers Card (for tab) ---
function UniqueReviewersTab({ numReviewers }) {
  return (
    <div className="flex flex-col items-center justify-center h-full py-8">
      <div className="inline-flex items-center justify-center w-16 h-16 rounded-full mb-3 bg-purple-100 text-purple-700 shadow-md">
        <Users className="w-8 h-8" />
      </div>
      <div className="text-3xl font-black text-black mb-1">{numReviewers}</div>
      <div className="text-lg font-semibold text-gray-600 mb-1">Unique Reviewer{numReviewers === 1 ? '' : 's'}</div>
      <div className="mt-1 text-base text-gray-500 text-center">
        This business has received {numReviewers} unique review{numReviewers === 1 ? '' : 's'} from real users.
      </div>
    </div>
  );
}

// --- Overall Sentiment Card (for tab) ---
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

// --- Right Card with Tabs (with auto-switching) ---
function RightAnalyticsTabs({ numReviewers, sentimentScore }) {
  const [tab, setTab] = useState("reviewers");

  // Auto-switch tabs every 3 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      setTab((prev) => (prev === "reviewers" ? "sentiment" : "reviewers"));
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-lg h-full flex flex-col">
      <div className="flex justify-center gap-2 mb-4">
        <button
          className={`px-5 py-2 rounded-full font-semibold transition text-base ${
            tab === "reviewers"
              ? "bg-purple-600 text-white shadow tab-active"
              : "bg-purple-50 text-purple-700 hover:bg-purple-100"
          }`}
          onClick={() => setTab("reviewers")}
        >
          Unique Reviewers
        </button>
        <button
          className={`px-5 py-2 rounded-full font-semibold transition text-base ${
            tab === "sentiment"
              ? "bg-purple-600 text-white shadow tab-active"
              : "bg-purple-50 text-purple-700 hover:bg-purple-100"
          }`}
          onClick={() => setTab("sentiment")}
        >
          Overall Sentiment
        </button>
      </div>
      <div className="flex-1 flex flex-col">
        {tab === "reviewers" ? (
          <UniqueReviewersTab numReviewers={numReviewers} />
        ) : (
          <OverallSentimentTab sentimentScore={sentimentScore} />
        )}
      </div>
    </div>
  );
}

// --- Business Header (no changes) ---
function BusinessHeader({ name, city = "Austin, TX", category = "Coffee Shop" }) {
  const handleClaimClick = () => {
    window.open(
      "https://docs.google.com/forms/d/e/1FAIpQLScOFSp2wEGN50-d58e43laMRW2RuPbEr4407R34pZVw4eDYhA/viewform",
      "_blank"
    );
  };
  return (
    <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm mb-10">
      <div className="flex flex-col lg:flex-row justify-between items-start gap-8">
        <div className="flex-1">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-black text-black mb-4 tracking-tight">
            {name}
          </h1>
          <div className="flex flex-wrap gap-4">
            <Badge className="bg-purple-100 text-purple-700 hover:bg-purple-200 px-6 py-3 rounded-full text-base font-semibold border-0">
              <MapPin className="w-4 h-4 mr-2" />
              {city}
            </Badge>
            <Badge className="bg-gray-100 text-gray-700 hover:bg-gray-200 px-6 py-3 rounded-full text-base font-semibold border-0">
              <Tag className="w-4 h-4 mr-2" />
              {category}
            </Badge>
          </div>
        </div>
        <Button
          variant="outline"
          className="border-2 border-purple-200 text-purple-600 hover:bg-purple-50 hover:border-purple-300 rounded-full px-8 py-3 font-semibold text-base mt-8 lg:mt-0"
          onClick={handleClaimClick}
        >
          Claim this business
        </Button>
      </div>
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

  return (
    <div
      className="min-h-screen w-full"
      style={{
        background: "linear-gradient(135deg, #ede9fe 0%, #f7fefb 45%, #e0f7e9 100%)",
        minHeight: "100vh",
      }}
    >
      <div className="max-w-6xl mx-auto px-2 sm:px-6 py-12">
        <div className="mb-6">
          <Button
            variant="outline"
            className="text-purple-700 font-bold flex items-center gap-2 border border-purple-200 shadow bg-white hover:bg-purple-100"
            onClick={() => navigate(-1)}
          >
            <ArrowLeft className="w-5 h-5" /> Back
          </Button>
        </div>

        <BusinessHeader name={business.name} city={business.city} category={business.category} />

        {/* --- Analytics Section with Responsive Same Height --- */}
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
        <div className="w-full mx-auto mt-8 mb-8">
          <div className="rounded-3xl shadow-lg bg-white/95 border border-purple-100 p-5 md:p-10">
            <div className="font-black text-2xl md:text-3xl mb-7 text-black">Recent Reviews</div>
            {loading ? (
              <div className="text-center text-gray-400 py-8">Loading reviews…</div>
            ) : business.reviews.length === 0 ? (
              <div className="text-center text-gray-400 py-8">No reviews found for this business.</div>
            ) : (
              <div className="space-y-7">
                {business.reviews.map((review, idx) => (
                  <div
                    key={idx}
                    className="flex flex-col md:flex-row bg-purple-50 rounded-2xl px-7 py-6 shadow group transition hover:shadow-xl"
                    style={{ alignItems: "flex-start" }}
                  >
                    <Link
                      to={`/profile/${slugify(review.user)}`}
                      className="flex-shrink-0 flex flex-col items-center mr-5 mb-2 md:mb-0 group cursor-pointer"
                      style={{ textDecoration: "none" }}
                    >
                      <div className="w-12 h-12 rounded-full bg-purple-400 text-white font-bold text-xl flex items-center justify-center shadow-lg">
                        {getInitials(review.user)}
                      </div>
                      <span className="mt-2 text-2xl">{emojiForScore(review.score)}</span>
                    </Link>
                    <div className="flex-1">
                      <div className="flex flex-wrap items-center gap-3 mb-2">
                        <Link
                          to={`/profile/${slugify(review.user)}`}
                          className="font-bold text-lg text-black hover:underline hover:text-purple-700"
                        >
                          {review.user}
                        </Link>
                        {review.score ? (
                          <span className="flex items-center ml-2">
                            {Array.from({ length: review.score }).map((_, i) => (
                              <span key={i} className="text-yellow-400 text-xl">★</span>
                            ))}
                          </span>
                        ) : null}
                        <span className="ml-auto text-gray-500 text-base font-medium" style={{ marginLeft: "auto" }}>
                          {formatDate(review.date)}
                        </span>
                      </div>
                      <div className="mt-2 bg-white rounded-xl border px-6 py-4 text-gray-900 shadow-sm text-base font-medium">
                        {review.uplaud}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BusinessPage;
