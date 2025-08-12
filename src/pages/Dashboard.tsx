import React, { useEffect, useState } from "react";
import {
  Star, ClipboardList, Zap, Calendar, MapPin, ArrowLeft, Share2, BarChart2, Trophy, Lock
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

// shadcn/ui
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

// Airtable Config
const API_KEY = 'patZS8GyNhkwoP4wY.2beddc214f4dd2a5e4c220ae654f62652a5e02a47bae2287c54fced7bb97c07e';
const BASE_ID = 'appFUJWWTaoJ3YiWt';
const REVIEWS_TABLE = 'tblef0n1hQXiKPHxI';

// -------------------- Utilities --------------------
function slugify(name = "") {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
}
function formatDate(date) {
  if (!date) return "";
  return new Date(date).toLocaleDateString(undefined, { month: "long", day: "2-digit", year: "numeric" });
}
function emojiForScore(score) {
  if (!score) return "🤍";
  if (score >= 5) return "🔥";
  if (score === 4) return "😍";
  if (score === 3) return "🙂";
  if (score === 2) return "😐";
  return "😶";
}
function getWhatsAppShareLinkForReview(review, userName) {
  const text = `Show me ${userName}'s review for ${review.businessName || review.business_name}`;
  return `https://wa.me/?text=${encodeURIComponent(text)}`;
}
function getInitials(name = "") {
  if (!name) return "";
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 1) {
    const s = parts[0];
    return (s[0] || "").toUpperCase() + (s[1] ? s[1].toUpperCase() : "");
  }
  return (parts[0][0] || "").toUpperCase() + (parts[1][0] || "").toUpperCase();
}

// -------------------- Achievements --------------------
const BADGES = [
  { key: "fresh_voice", label: "Fresh Voice", description: "Submit your first review", image: "Fresh_Voice.png",
    progress: user => ({ current: user.reviews.length, total: 1, isEarned: user.reviews.length >= 1 }) },
  { key: "glow_getter", label: "Glow Getter", description: "Submit 10+ reviews", image: "Glow_Getter.png",
    progress: user => ({ current: Math.min(user.reviews.length, 10), total: 10, isEarned: user.reviews.length >= 10 }) },
  { key: "vibe_curator", label: "Vibe Curator", description: "Submit reviews in 5+ different categories", image: "Vibe_Curator.png",
    progress: user => { const catCount = new Set(user.reviews.map(r => (r.category || "").toLowerCase())).size;
      return { current: Math.min(catCount, 5), total: 5, isEarned: catCount >= 5 }; } },
  { key: "cultural_explorer", label: "Cultural Explorer", description: "10+ reviews in Museums/Nature categories", image: "Cultural_Explorer.png",
    progress: user => { const count = user.reviews.filter(r => ["museum","nature"].includes((r.category || "").toLowerCase())).length;
      return { current: Math.min(count, 10), total: 10, isEarned: count >= 10 }; } },
  { key: "squad_initiator", label: "Squad Initiator", description: "Refer 1 friend who joins & reviews", image: "Squad_Initiator.png",
    progress: user => ({ current: Math.min(user.referralCount, 1), total: 1, isEarned: user.referralCount >= 1 }) },
  { key: "squad_leader", label: "Squad Leader", description: "5+ successful referrals", image: "Squad_Leader.png",
    progress: user => ({ current: Math.min(user.referralCount, 5), total: 5, isEarned: user.referralCount >= 5 }) },
  { key: "streak_star", label: "Streak Star", description: "Review for 7 consecutive days", image: "Streak_Star.png",
    progress: user => {
      const days = [...new Set(user.reviews.map(r => {
        const d = r.date instanceof Date ? r.date : (r.date ? new Date(r.date) : null);
        return d && !isNaN(d.getTime()) ? d.toDateString() : null;
      }).filter(Boolean))].map(d => new Date(d)).sort((a,b)=>a-b);
      let streak=1, maxStreak=1;
      for (let i=1;i<days.length;i++){ if((days[i]-days[i-1])===24*3600*1000){ streak++; maxStreak=Math.max(maxStreak,streak);} else { streak=1; } }
      return { current: Math.min(maxStreak,7), total: 7, isEarned: maxStreak>=7 };
    } },
  { key: "viral_star", label: "Viral Star", description: "10+ referrals in 1 week", image: "Viral_Star.png",
    progress: user => {
      if (!user.myReferrals || user.myReferrals.length < 10) return { current: 0, total: 10, isEarned: false };
      const refDates = user.myReferrals.map(ref => ref.date ? new Date(ref.date) : null).filter(Boolean).sort((a,b)=>a-b);
      let earned=false; for (let i=0;i<=refDates.length-10;i++){ const start=refDates[i], end=refDates[i+9]; if((end-start)<=7*24*3600*1000){ earned=true; break; } }
      return { current: Math.min(user.myReferrals.length,10), total: 10, isEarned: earned };
    } },
];

const getGenderFolder = (gender) => !gender ? "Male" : (gender.toLowerCase().startsWith("f") ? "Female" : "Male");

function getAchievements(user, reviews, referralCount, myReferrals) {
  const gender = getGenderFolder(user?.gender || user?.Gender);
  const userObj = { ...user, reviews: reviews || [], referralCount: referralCount || 0, myReferrals: myReferrals || [] };
  return BADGES.map(badge => {
    const p = badge.progress(userObj);
    return { id: badge.key, name: badge.label, description: badge.description, image: `/badges/${gender}/${badge.image}`, isEarned: p.isEarned, progress: p };
  });
}

// -------------------- Compact stats (like ProfilePage) --------------------
const StatsStrip = ({ totalReviews, points, referralCount }) => {
  const Item = ({ icon, label, value }) => (
    <div className="stats-seg flex-1 min-w-0 py-3 sm:py-4 px-2 sm:px-4 text-center border rounded-xl bg-white/85 backdrop-blur-sm">
      <div className="flex items-center justify-center gap-2">{icon}<span className="stat-value font-extrabold">{value}</span></div>
      <div className="stat-label mt-1 font-semibold text-gray-600">{label}</div>
    </div>
  );
  return (
    <div className="grid grid-cols-3 gap-2 sm:gap-4">
      <Item icon={<Star className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-600" />} label="Reviews" value={totalReviews} />
      <Item icon={<Zap className="w-4 h-4 sm:w-5 sm:h-5 text-purple-700" />} label="Points" value={points} />
      <Item icon={<ClipboardList className="w-4 h-4 sm:w-5 sm:h-5 text-pink-700" />} label="Referrals" value={referralCount} />
    </div>
  );
};

// -------------------- Review Card --------------------
function ReviewCard({ review, userName, navigate }) {
  if (!review.businessName && !review.business_name) return null;
  const score = Number(review.score || review['Uplaud Score']);
  const business = review.businessName || review.business_name || "";
  const reviewText = review.uplaud || review.Uplaud || "";
  const date = review.date || review.Date_Added || "";
  const shareUrl = getWhatsAppShareLinkForReview(review, userName);

  return (
    <div
      className="review-card-mobile flex rounded-2xl px-3 py-4 shadow group transition hover:shadow-xl mb-3 border"
      style={{ alignItems: "flex-start", background: "rgba(255,255,255,0.70)", backdropFilter: "blur(6px)" }}
    >
      <div className="flex items-start w-full">
        <div className="flex-1 w-full min-w-0">
          {/* Top row: Business + stars/emoji + date (outside bubble) */}
          <div className="flex w-full items-center gap-2 flex-wrap justify-between">
            <div className="flex items-center gap-2 min-w-0 flex-1">
              <span
                className="font-semibold text-base text-black cursor-pointer business-hover-underline"
                onClick={() => navigate(`/business/${slugify(business)}`)}
                tabIndex={0}
                style={{ lineHeight: 1.18, minWidth: 0, flex: "1 1 auto", wordBreak: "break-word" }}
              >
                {business}
              </span>
            </div>

            {/* Stars + Emoji BEFORE date */}
            <span className="text-yellow-500 text-sm flex items-center gap-1 flex-shrink-0">
              {Array.from({ length: score }).map((_, i) => <span key={i}>★</span>)}
              {score ? <span className="text-lg leading-none">{emojiForScore(score)}</span> : null}
            </span>

            <span className="text-gray-500 text-xs font-medium whitespace-nowrap" style={{ flexShrink: 0 }}>
              {formatDate(date)}
            </span>
          </div>

          {/* Message bubble (text only) */}
          <div
            className="rounded-xl border px-4 py-3 text-gray-900 shadow-sm text-base font-medium break-words"
            style={{ background: "#DCF8C6", marginTop: 6 }}
          >
            {reviewText}
          </div>

          <div className="flex w-full">
            <button
              onClick={() => window.open(shareUrl, "_blank")}
              className="bg-green-100 hover:bg-green-200 p-2 rounded-full shadow-md transition flex items-center mt-3"
              title="Share this review on WhatsApp"
            >
              <Share2 className="text-green-600 w-5 h-5" />
              <span className="ml-2 text-green-700 font-medium text-sm">Share</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// -------------------- Dashboard --------------------
const Dashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('Reviews');
  const [user, setUser] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [showAllReviews, setShowAllReviews] = useState(false);

  // placeholders (referrals not tracked in dashboard)
  const [referralCount] = useState(0);
  const [myReferrals] = useState([]);

  useEffect(() => {
    const fetchUserAndReviews = async () => {
      setLoading(true);
      try {
        const phone = sessionStorage.getItem("userPhone");
        if (!phone) { navigate("/login"); return; }

        const filterFormula = `({ReviewerPhoneNumber} = '${phone}')`;
        const url = `https://api.airtable.com/v0/${BASE_ID}/${REVIEWS_TABLE}?filterByFormula=${encodeURIComponent(filterFormula)}`;
        const { data } = await axios.get(url, { headers: { Authorization: `Bearer ${API_KEY}` } });

        const records = data.records.map(rec => {
          const f = rec.fields || {};
          return {
            ...f,
            businessName: f.business_name || f.businessName,
            uplaud: f.Uplaud || f.uplaud,
            score: Number(f["Uplaud Score"] || f.score || 0),
            category: f.Category || "Other",
            date: f.Date_Added ? new Date(f.Date_Added) : null
          };
        }).filter(r => r.businessName && r.uplaud);

        setReviews(records);

        let name = records[0]?.Name_Creator || records[0]?.Reviewer || "User";
        if (Array.isArray(name)) name = name[0];
        const handle = slugify(name);
        const gender = records[0]?.Gender || "Male";

        setUser({
          name,
          handle,
          gender,
          image: records[0]?.['Creator Image'] || null,
          location: [records[0]?.City, records[0]?.State].filter(Boolean).join(', '),
          bio: records[0]?.Internal || "",
          joinDate: records[0]?.Date_Added ? formatDate(records[0]?.Date_Added) : "—",
        });
      } catch {
        setUser(null);
        setReviews([]);
      }
      setLoading(false);
    };
    fetchUserAndReviews();
  }, [navigate]);

  // Stats
  const points = reviews.length * 10 + referralCount * 20;
  const totalReviews = reviews.length;
  const averageScore = reviews.length
    ? (reviews.reduce((s, r) => s + (Number(r.score || 0)), 0) / reviews.length).toFixed(2)
    : "-";

  // Achievements
  const achievements = getAchievements(user, reviews, referralCount, myReferrals);
  const earnedAchievements = achievements.filter(a => a.isEarned);
  const lockedAchievements = achievements.filter(a => !a.isEarned);
  const earnedCount = earnedAchievements.length;

  // Next up (closest locked)
  const nextUp = [...lockedAchievements]
    .map(b => ({ ...b, pct: b.progress?.total ? (b.progress.current / b.progress.total) : 0 }))
    .sort((a, b) => b.pct - a.pct)
    .slice(0, 3);

  if (loading) return <div className="flex justify-center items-center h-80 text-lg text-white/90">Loading…</div>;
  if (!user) return <div className="text-center mt-12 text-xl text-white">User not found. Please log in again.</div>;

  return (
    <div className="min-h-screen w-full text-gray-800 relative"
         style={{ background: "#6D46C6", fontFamily: `'Inter','Poppins','Segoe UI',Arial,sans-serif` }}>
      {/* Back */}
      <button
        onClick={() => navigate("/")}
        className="fixed sm:absolute top-4 left-4 z-50 font-semibold rounded-md border border-purple-100 flex items-center gap-2 shadow hover:bg-purple-50 px-3 py-2 text-base transition"
        style={{ minWidth: 44, minHeight: 44, background: "rgba(255,255,255,0.88)", color: "#6D46C6", backdropFilter: "blur(6px)" }}>
        <ArrowLeft className="w-5 h-5" />
        <span className="hidden sm:inline">Back</span>
      </button>

      <div className="max-w-4xl mx-auto space-y-6 relative z-10 pt-16 sm:pt-0 px-2 sm:px-0">
        {/* Profile header card */}
        <div className="shadow-lg rounded-2xl p-5 sm:p-6 flex flex-col gap-5 border mt-6"
             style={{ background: "rgba(255,255,255,0.75)", borderColor: "rgba(255,255,255,0.6)", backdropFilter: "blur(8px)" }}>
          <div className="flex items-center gap-4">
            {/* Avatar with image OR initials fallback */}
            <div
              className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-full overflow-hidden flex items-center justify-center"
              style={{
                background: "#EDE7F6",
                color: "#6D46C6",
                fontWeight: 800,
                fontSize: "1.75rem",
                border: "2px solid #E9D5FF",
              }}
              aria-label="User avatar"
              title={user.name}
            >
              {user.image ? (
                <img src={user.image} alt={user.name} className="w-full h-full object-cover" />
              ) : (
                <span style={{ letterSpacing: 0.5 }}>{getInitials(user.name)}</span>
              )}
            </div>

            <div className="flex-1 min-w-0">
              <h2 className="font-extrabold text-xl sm:text-2xl flex flex-wrap items-center gap-2">
                {user.name}
                <span className="text-xs bg-purple-100 text-purple-600 rounded-full px-2 py-1 whitespace-nowrap">@{user.handle}</span>
              </h2>
              <p className="text-sm flex flex-wrap items-center gap-2 text-gray-700 mt-1">
                <Calendar size={16} /> Joined {user.joinDate}
                {user.location && (<><MapPin size={16} /> {user.location}</>)}
              </p>
              {user.bio && <p className="text-sm mt-1 text-gray-700">{user.bio}</p>}
            </div>

            {/* Desktop share */}
            <button
              onClick={() => {
                const url = `${window.location.origin}/profile/${user.handle}`;
                const message = `Check out ${user.name}'s Uplaud profile!\n${url}`;
                window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, "_blank");
              }}
              className="hidden sm:flex items-center justify-center border border-gray-200 text-gray-700 px-3 py-2 rounded-lg shadow"
              title="Share Profile" style={{ background: "rgba(255, 255, 255, 0.8)", backdropFilter: "blur(6px)" }}>
              <Share2 className="w-5 h-5" />
            </button>
          </div>

          {/* Compact stats strip */}
          <div className="rounded-xl border p-2 sm:p-3 bg-white/70 backdrop-blur-md">
            <StatsStrip totalReviews={totalReviews} points={points} referralCount={referralCount} />
          </div>

          {/* Mobile share — transparent & centered */}
          <div className="sm:hidden flex justify-center">
            <button
              onClick={() => {
                const url = `${window.location.origin}/profile/${user.handle}`;
                const message = `Check out ${user.name}'s Uplaud profile!\n${url}`;
                window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, "_blank");
              }}
              title="Share Profile" className="p-2" style={{ background: "transparent", border: "none", boxShadow: "none" }}>
              <Share2 className="w-6 h-6 text-white" />
            </button>
          </div>
        </div>

        {/* Achievements (earned + next up) */}
        <Card className="w-full backdrop-blur-md"
              style={{ background: "rgba(255,255,255,0.16)", border: "1px solid rgba(255,255,255,0.35)", boxShadow: "0 12px 30px rgba(0,0,0,0.08)" }}>
          <div className="flex items-center gap-3 px-3 pt-3">
            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-purple-600">
              <Trophy className="w-4 h-4 text-white" />
            </div>
            <h3 className="text-lg font-semibold text-white">Achievements</h3>
          </div>

          <div className="px-3 pb-3 md:grid md:grid-cols-12 md:gap-3">
            {/* Earned — smaller & denser tiles */}
            <div className="md:col-span-8">
              {earnedCount === 0 ? (
                <div className="text-center text-white/90 py-6 text-sm">No badges yet — start reviewing to earn your first badge!</div>
              ) : (
                <TooltipProvider>
                  <div className="earned-badge-grid gap-2">
                    {earnedAchievements.map(a => (
                      <Tooltip key={a.id}>
                        <TooltipTrigger asChild>
                          <div className="group cursor-pointer">
                            <div
                              className="earned-badge-tile relative overflow-hidden transition-all duration-300 shadow-[0_6px_18px_rgba(0,0,0,0.14)] hover:scale-[1.04] bg-white/40 rounded-xl"
                            >
                              <img src={a.image} alt={a.name} className="w-full h-full object-contain" />
                              <div className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-green-500 rounded-full border-2 border-white" />
                            </div>
                            <div className="mt-1 text-center">
                              <p className="earned-badge-name font-semibold text-white leading-tight">{a.name}</p>
                            </div>
                          </div>
                        </TooltipTrigger>
                        <TooltipContent side="bottom" className="max-w-xs border"
                                        style={{ background: "#fff", color: "#23223b", borderColor: "#b39ddb", fontSize: 12 }}>
                          <div className="text-center">
                            <p className="font-semibold">{a.name}</p>
                            <p className="text-xs opacity-90 mt-1">{a.description}</p>
                          </div>
                        </TooltipContent>
                      </Tooltip>
                    ))}
                  </div>
                </TooltipProvider>
              )}
            </div>

            {/* Next up */}
            <div className="md:col-span-4 mt-3 md:mt-0 md:border-l md:pl-3 md:border-white/30">
              <div className="text-[12px] text-white/90 font-semibold mb-2">What’s next</div>
              {nextUp.length === 0 ? (
                <div className="text-white/80 text-sm">All caught up. 🔥</div>
              ) : (
                <TooltipProvider>
                  <div className="space-y-2">
                    {nextUp.map(n => (
                      <Tooltip key={n.id}>
                        <TooltipTrigger asChild>
                          <div className="flex items-center gap-2 rounded-lg border px-2 py-2 bg-white/25 border-white/35 cursor-pointer"
                               tabIndex={0} aria-label={`${n.name} — ${n.description}`}>
                            <img src={n.image} alt={n.name} className="w-7 h-7 object-contain" />
                            <div className="flex-1 min-w-0">
                              <div className="text-[12px] text-white truncate">{n.name}</div>
                              <div className="w-full bg-white/30 rounded-full h-1 mt-1">
                                <div className="bg-white h-1 rounded-full"
                                     style={{ width: `${Math.min(100, Math.round((n.progress.current / n.progress.total) * 100))}%` }} />
                              </div>
                            </div>
                            <span className="text-[11px] text-white/80 whitespace-nowrap">{n.progress.current}/{n.progress.total}</span>
                          </div>
                        </TooltipTrigger>
                        <TooltipContent side="left" className="max-w-xs border"
                                        style={{ background: "#fff", color: "#23223b", borderColor: "#b39ddb", fontSize: 12 }}>
                          <div>
                            <p className="font-semibold">{n.name}</p>
                            <p className="text-xs mt-1">{n.description}</p>
                            <Badge variant="secondary" className="mt-2 bg-purple-100 text-purple-700 border-purple-200">
                              {n.progress.current}/{n.progress.total} progress
                            </Badge>
                          </div>
                        </TooltipContent>
                      </Tooltip>
                    ))}
                  </div>
                </TooltipProvider>
              )}
            </div>
          </div>
        </Card>

        {/* Tabs */}
        <div className="rounded-2xl shadow p-4 border"
             style={{ background: "rgba(255,255,255,0.80)", borderColor: "rgba(255,255,255,0.7)", backdropFilter: "blur(8px)" }}>
          <div className="flex gap-6 border-b mb-6 text-base font-semibold">
            <button className={`pb-2 ${activeTab === 'Reviews' ? 'border-b-2 border-purple-600 text-purple-700' : 'text-gray-600 hover:text-purple-700'}`}
                    onClick={() => setActiveTab('Reviews')}>Reviews</button>
            <button className={`pb-2 ${activeTab === 'Analytics' ? 'border-b-2 border-purple-600 text-purple-700' : 'text-gray-600 hover:text-purple-700'}`}
                    onClick={() => setActiveTab('Analytics')}>Activity</button>
          </div>

          {activeTab === "Reviews" && (
            <div>
              {reviews.length === 0 ? (
                <div className="text-center text-gray-500 py-8">You haven’t posted any reviews yet.</div>
              ) : (
                <div>
                  <div className="space-y-3">
                    {(showAllReviews ? reviews : reviews.slice(0, 5)).map((review, idx) => (
                      <ReviewCard key={idx} review={review} userName={user.name} navigate={navigate} />
                    ))}
                  </div>
                  {reviews.length > 5 && (
                    <div className="flex justify-center mt-6">
                      <button className="px-5 py-2 rounded-lg bg-purple-100 text-purple-700 font-bold hover:bg-purple-200 shadow transition"
                              onClick={() => setShowAllReviews(v => !v)}>
                        {showAllReviews ? "Show Less" : "Load More Reviews"}
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {activeTab === "Analytics" && (
            <div>
              <h2 className="font-bold text-xl mb-4 flex items-center gap-2 text-black">
                <BarChart2 className="w-5 h-5 text-cyan-600" /> Activities
              </h2>

              {/* Locked badges grid — reduced size */}
              <div className="mb-8">
                <div className="font-semibold text-gray-700 mb-2">Badge Goals</div>
                {lockedAchievements.length === 0 ? (
                  <div className="text-gray-500 text-sm">You’ve unlocked all available badges. 🙌</div>
                ) : (
                  <TooltipProvider>
                    <div className="grid grid-cols-2 xs:grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
                      {lockedAchievements.map(a => (
                        <Tooltip key={a.id}>
                          <TooltipTrigger asChild>
                            <div className="group cursor-pointer">
                              <div
                                className="relative rounded-xl overflow-hidden border bg-white shadow-sm grayscale opacity-80 hover:grayscale-0 hover:opacity-100 transition"
                                style={{ width: "64px", height: "64px", margin: "0 auto" }}
                              >
                                <img src={a.image} alt={a.name} className="w-full h-full object-contain" />
                                <div className="absolute inset-0 bg-black/12 flex items-center justify-center">
                                  <Lock className="w-4 h-4 text-white/90" />
                                </div>
                              </div>
                              <div className="mt-1 text-center">
                                <p className="text-[10px] font-semibold text-gray-800 leading-tight truncate">{a.name}</p>
                                {a.progress && (
                                  <div className="mt-1">
                                    <div className="w-full bg-muted rounded-full h-1">
                                      <div className="bg-purple-600 h-1 rounded-full transition-all duration-300"
                                           style={{ width: `${(a.progress.current / a.progress.total) * 100}%` }} />
                                    </div>
                                    <p className="text-[10px] text-muted-foreground mt-1">
                                      {a.progress.current}/{a.progress.total}
                                    </p>
                                  </div>
                                )}
                              </div>
                            </div>
                          </TooltipTrigger>
                          <TooltipContent side="bottom" className="max-w-xs border"
                                          style={{ background: "#fff", color: "#23223b", borderColor: "#b39ddb", fontSize: 12 }}>
                            <div className="text-center">
                              <p className="font-semibold">{a.name}</p>
                              <p className="text-xs opacity-90 mt-1">{a.description}</p>
                              {a.progress && (
                                <Badge variant="secondary" className="mt-2 bg-purple-100 text-purple-700 border-purple-200">
                                  {a.progress.current}/{a.progress.total} progress
                                </Badge>
                              )}
                            </div>
                          </TooltipContent>
                        </Tooltip>
                      ))}
                    </div>
                  </TooltipProvider>
                )}
              </div>

              {/* Simple stats */}
              <div className="mb-6">
                <div className="font-semibold text-gray-700">Total Reviews:</div>
                <div className="text-lg font-bold text-purple-600">{totalReviews}</div>
              </div>
              <div className="mb-2">
                <div className="font-semibold text-gray-700">Average Score:</div>
                <div className="text-lg font-bold text-cyan-600">{averageScore} / 5</div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Styles */}
      <style>{`
        body { background: #6D46C6 !important; font-family: 'Inter','Poppins','Segoe UI',Arial,sans-serif !important; }

        /* -------- Earned badge sizing (smaller & eye-catchy) -------- */
        :root { --earned-badge: 68px; }
        @media (max-width: 640px) { :root { --earned-badge: 58px; } }

        .earned-badge-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(var(--earned-badge), 1fr));
        }
        .earned-badge-tile {
          width: 100%;
          aspect-ratio: 1 / 1;
          padding: 4px;
        }
        .earned-badge-name { font-size: 10px; }

        .business-hover-underline { transition: color 0.2s; position: relative; }
        .business-hover-underline:hover, .business-hover-underline:focus { color: #6D46C6 !important; }
        .business-hover-underline::after { content:""; position:absolute; left:0; right:0; bottom:-2px; height:2px; background:#6D46C6; border-radius:1px; opacity:0; transform:scaleX(0.7); transition:opacity .18s, transform .2s; }
        .business-hover-underline:hover::after, .business-hover-underline:focus::after { opacity:1; transform:scaleX(1); }

        .stat-value { font-size: 1.15rem; }
        .stat-label { font-size: 0.85rem; }
        @media (min-width: 640px) { .stat-value { font-size: 1.35rem; } .stat-label { font-size: 0.95rem; } }

        @media (hover:hover) and (pointer:fine) { .stats-seg { transition: transform .15s, box-shadow .15s; } .stats-seg:hover { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(0,0,0,.08); } }

        @media (max-width:700px){
          .review-card-mobile{ padding-left:8px; padding-right:8px; }
          h2{ font-size:1.15rem !important; }
        }
        @media (max-width:400px){ .xs\\:grid-cols-3{ grid-template-columns:repeat(3,minmax(0,1fr)); } }
      `}</style>
    </div>
  );
};

export default Dashboard;
