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
// Avatar: first letter only (Dashboard behavior)
function getBusinessInitials(name = "") {
  if (!name) return "";
  let words = name.replace(/[^A-Za-z0-9 ]/g, "").split(" ").filter(Boolean);
  return words[0][0].toUpperCase();
}
function getWhatsAppShareLinkForReview(review, userName) {
  const text = `Show me ${userName}'s review for ${review.businessName || review.business_name}`;
  return `https://wa.me/?text=${encodeURIComponent(text)}`;
}

// -------------------- Achievements (copied from ProfilePage) --------------------
const BADGES = [
  {
    key: "fresh_voice",
    label: "Fresh Voice",
    description: "Submit your first review",
    image: "Fresh_Voice.png",
    progress: user => ({
      current: user.reviews.length,
      total: 1,
      isEarned: user.reviews.length >= 1
    })
  },
  {
    key: "glow_getter",
    label: "Glow Getter",
    description: "Submit 10+ reviews",
    image: "Glow_Getter.png",
    progress: user => ({
      current: Math.min(user.reviews.length, 10),
      total: 10,
      isEarned: user.reviews.length >= 10
    })
  },
  {
    key: "vibe_curator",
    label: "Vibe Curator",
    description: "Submit reviews in 5+ different categories",
    image: "Vibe_Curator.png",
    progress: user => {
      const catCount = new Set(user.reviews.map(r => (r.category || "").toLowerCase())).size;
      return {
        current: Math.min(catCount, 5),
        total: 5,
        isEarned: catCount >= 5
      };
    }
  },
  {
    key: "cultural_explorer",
    label: "Cultural Explorer",
    description: "10+ reviews in Museums/Nature categories",
    image: "Cultural_Explorer.png",
    progress: user => {
      const count = user.reviews.filter(r =>
        ["museum", "nature"].includes((r.category || "").toLowerCase())
      ).length;
      return {
        current: Math.min(count, 10),
        total: 10,
        isEarned: count >= 10
      };
    }
  },
  {
    key: "squad_initiator",
    label: "Squad Initiator",
    description: "Refer 1 friend who joins & reviews",
    image: "Squad_Initiator.png",
    progress: user => ({
      current: Math.min(user.referralCount, 1),
      total: 1,
      isEarned: user.referralCount >= 1
    })
  },
  {
    key: "squad_leader",
    label: "Squad Leader",
    description: "5+ successful referrals",
    image: "Squad_Leader.png",
    progress: user => ({
      current: Math.min(user.referralCount, 5),
      total: 5,
      isEarned: user.referralCount >= 5
    })
  },
  {
    key: "streak_star",
    label: "Streak Star",
    description: "Review for 7 consecutive days",
    image: "Streak_Star.png",
    progress: user => {
      const days = [...new Set(user.reviews.map(r => {
        const d = r.date instanceof Date ? r.date : (r.date ? new Date(r.date) : null);
        return d && !isNaN(d.getTime()) ? d.toDateString() : null;
      }).filter(Boolean))]
        .map(d => new Date(d))
        .sort((a, b) => a - b);

      let streak = 1, maxStreak = 1;
      for (let i = 1; i < days.length; i++) {
        if ((days[i] - days[i - 1]) === 24 * 3600 * 1000) {
          streak++;
          maxStreak = Math.max(maxStreak, streak);
        } else {
          streak = 1;
        }
      }
      return {
        current: Math.min(maxStreak, 7),
        total: 7,
        isEarned: maxStreak >= 7
      };
    }
  },
  {
    key: "viral_star",
    label: "Viral Star",
    description: "10+ referrals in 1 week",
    image: "Viral_Star.png",
    progress: user => {
      if (!user.myReferrals || user.myReferrals.length < 10)
        return { current: 0, total: 10, isEarned: false };

      const refDates = user.myReferrals
        .map(ref => ref.date ? new Date(ref.date) : null)
        .filter(Boolean)
        .sort((a, b) => a - b);

      let earned = false;
      for (let i = 0; i <= refDates.length - 10; i++) {
        const start = refDates[i];
        const end = refDates[i + 9];
        if ((end - start) <= 7 * 24 * 3600 * 1000) {
          earned = true; break;
        }
      }
      return {
        current: Math.min(user.myReferrals.length, 10),
        total: 10,
        isEarned: earned
      };
    }
  }
];

const getGenderFolder = (gender) => {
  if (!gender) return "Male";
  if (gender.toLowerCase().startsWith("f")) return "Female";
  return "Male";
};

function getAchievements(user, reviews, referralCount, myReferrals) {
  const gender = getGenderFolder(user?.gender || user?.Gender);
  const userObj = {
    ...user,
    reviews: reviews || [],
    referralCount: referralCount || 0,
    myReferrals: myReferrals || [],
  };
  return BADGES.map(badge => {
    const p = badge.progress(userObj);
    return {
      id: badge.key,
      name: badge.label,
      description: badge.description,
      image: `/badges/${gender}/${badge.image}`,
      isEarned: p.isEarned,
      progress: p,
    };
  });
}

// -------------------- Small UI atoms --------------------
const BigStat = ({ icon, label, value, color }) => {
  const bg = {
    yellow: 'bg-yellow-50 text-yellow-700',
    purple: 'bg-purple-50 text-purple-700',
    pink: 'bg-pink-50 text-pink-700',
  }[color];
  return (
    <div
      className={`flex flex-col items-center justify-center px-6 py-4 rounded-2xl font-bold shadow-sm border ${bg} stat-card stat-hover`}
      style={{ minWidth: 120, minHeight: 86, margin: '0 0.5rem' }}
      tabIndex={0}
    >
      <div className="flex items-center gap-2">
        <span>{icon}</span>
        <span className="text-2xl font-extrabold">{value}</span>
      </div>
      <div className="mt-1 text-base font-semibold text-gray-600" style={{ letterSpacing: 0.3 }}>{label}</div>
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
      className="review-card-mobile flex rounded-2xl px-3 py-4 shadow group transition hover:shadow-xl mb-3"
      style={{
        alignItems: "flex-start",
        background: "#FFF7E6",
        fontFamily: "inherit",
        position: "relative"
      }}
    >
      <div className="flex items-start w-full">
        {/* Avatar: one letter */}
        <div
          className="rounded-full flex items-center justify-center font-bold uppercase review-biz-avatar"
          style={{
            width: 44, height: 44, border: "2px solid #6D46C6",
            color: "#6D46C6", background: "#F4EFFF", letterSpacing: 1,
            marginRight: 13, fontSize: "1.25rem", fontFamily: "inherit",
            boxShadow: "0 2px 10px 0 #6d46c61a"
          }}
          tabIndex={0}
          onClick={() => navigate(`/business/${slugify(business)}`)}
          title={business}
        >
          <span style={{
            width: "100%", textAlign: "center", fontWeight: 700,
            fontSize: "1.3rem", letterSpacing: "1.5px", lineHeight: "44px"
          }}>
            {getBusinessInitials(business)}
          </span>
        </div>
        {/* Review content */}
        <div className="flex-1 w-full min-w-0">
          <div className="flex w-full items-center gap-2 flex-wrap justify-between">
            <div className="flex items-center gap-2 min-w-0 flex-1">
              <span
                className="font-semibold text-base text-black cursor-pointer business-hover-underline"
                onClick={() => navigate(`/business/${slugify(business)}`)}
                tabIndex={0}
                style={{
                  lineHeight: 1.18,
                  fontFamily: "inherit",
                  minWidth: 0,
                  flex: "1 1 auto",
                  wordBreak: "break-word"
                }}
              >
                {business}
              </span>
            </div>
            <span className="text-gray-500 text-xs font-medium whitespace-nowrap" style={{ flexShrink: 0 }}>
              {formatDate(date)}
            </span>
          </div>
          <div
            className="rounded-xl border px-4 py-3 text-gray-900 shadow-sm text-base font-medium break-words flex items-center"
            style={{ background: "#DCF8C6", fontFamily: "inherit", marginTop: 4 }}
          >
            <span style={{ flex: "1 1 auto", minWidth: 0, wordBreak: "break-word" }}>
              {reviewText}
            </span>
            <span
              className="ml-2 flex-shrink-0 flex items-center review-stars-inside-box"
              style={{ minWidth: 60, justifyContent: "flex-end" }}
            >
              {Array.from({ length: score }).map((_, i) => (
                <span key={i} className="text-yellow-400 text-base leading-none">★</span>
              ))}
              {score ? (
                <span className="ml-1 text-xl">{emojiForScore(score)}</span>
              ) : null}
            </span>
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

  // Stats & referral placeholders (wire up later if you track referrals)
  const [referralCount] = useState(0);
  const [myReferrals] = useState([]); // keep shape for badge logic

  useEffect(() => {
    const fetchUserAndReviews = async () => {
      setLoading(true);
      try {
        const phone = sessionStorage.getItem("userPhone");
        if (!phone) {
          navigate("/login");
          return;
        }
        const filterFormula = `({ReviewerPhoneNumber} = '${phone}')`;
        const url = `https://api.airtable.com/v0/${BASE_ID}/${REVIEWS_TABLE}?filterByFormula=${encodeURIComponent(filterFormula)}`;
        const { data } = await axios.get(url, {
          headers: { Authorization: `Bearer ${API_KEY}` }
        });

        // Normalize reviews to include 'category' + Date object for achievements logic
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

        // Build user object
        let name = records[0]?.Name_Creator || records[0]?.Reviewer || "User";
        if (Array.isArray(name)) name = name[0];
        const handle = slugify(name);

        // You can attach gender here if present in reviews (default Male for badge path)
        const gender = records[0]?.Gender || "Male";

        setUser({
          name: name,
          handle: handle,
          gender: gender,
          image: records[0]?.['Creator Image'] || null,
          location: [records[0]?.City, records[0]?.State].filter(Boolean).join(', '),
          bio: records[0]?.Internal || "",
          joinDate: records[0]?.Date_Added ? formatDate(records[0]?.Date_Added) : "—",
        });
      } catch (e) {
        setUser(null);
        setReviews([]);
      }
      setLoading(false);
    };
    fetchUserAndReviews();
  }, [navigate]);

  // Calculated stats
  const points = reviews.length * 10 + referralCount * 20;
  const totalReviews = reviews.length;
  const averageScore = reviews.length
    ? (reviews.reduce((sum, r) => sum + (Number(r.score || 0)), 0) / reviews.length).toFixed(2)
    : "-";

  // Category breakdown for analytics
  const categories = {};
  reviews.forEach(r => {
    const cat = r.category || r.Category || "Other";
    categories[cat] = (categories[cat] || 0) + 1;
  });

  // Achievements
  const achievements = getAchievements(user, reviews, referralCount, myReferrals);
  const earnedCount = achievements.filter(a => a.isEarned).length;

  if (loading) return <div className="flex justify-center items-center h-80 text-lg">Loading…</div>;
  if (!user) return <div className="text-center mt-12 text-xl text-gray-600">User not found. Please log in again.</div>;

  return (
    <div
      className="min-h-screen w-full font-sans text-gray-800 relative"
      style={{
        background: "#6D46C6",
        fontFamily: `'Inter', 'Poppins', 'Segoe UI', Arial, sans-serif`
      }}
    >
      {/* Back Button */}
      <button
        onClick={() => window.location.href = "/"}
        className="fixed sm:absolute top-4 left-4 z-50 font-semibold rounded-md border border-purple-100 flex items-center gap-2 shadow hover:bg-purple-50 px-3 py-2 text-base transition"
        style={{
          minWidth: 44, minHeight: 44, lineHeight: "24px",
          paddingTop: 7, paddingBottom: 7,
          background: "#FFF7E6", color: "#6D46C6", fontFamily: "inherit"
        }}
      >
        <ArrowLeft className="w-5 h-5" />
        <span className="hidden sm:inline">Back</span>
      </button>

      <div className="max-w-5xl mx-auto space-y-8 relative z-10 pt-16 sm:pt-0 px-3 sm:px-0">
        {/* Profile Card */}
        <div className="shadow-lg rounded-2xl p-6 flex flex-col sm:flex-row items-center gap-6 border mt-6" style={{ background: "#FFF7E6", fontFamily: "inherit" }}>
          <div className="relative w-20 h-20 bg-purple-100 rounded-full flex items-center justify-center text-3xl font-extrabold text-purple-700 select-none" style={{ minWidth: 80, minHeight: 80 }}>
            {user.image ? (
              <img src={user.image} alt={user.name} className="w-full h-full object-cover rounded-full" />
            ) : (
              user.name.split(' ').map(n => n[0]).join('')
            )}
          </div>
          <div className="flex-1 min-w-0 w-full">
            {/* Header Row: name and stats */}
            <div className="flex flex-col items-center sm:flex-row sm:items-center justify-between w-full">
              <div className="flex flex-col items-center sm:items-start w-full">
                <h2
                  className="font-extrabold flex flex-wrap items-center gap-2"
                  style={{
                    fontSize: "2rem",
                    letterSpacing: "0.5px",
                    fontFamily: "inherit",
                  }}
                >
                  {user.name}
                  <span className="text-xs bg-purple-100 text-purple-600 rounded-full px-2 py-1 whitespace-nowrap">@{user.handle}</span>
                </h2>
                <p className="text-sm flex flex-wrap items-center gap-2 text-gray-600 mt-2 justify-center sm:justify-start" style={{ fontFamily: "inherit" }}>
                  <Calendar size={16} /> Joined {user.joinDate}
                  {user.location && (<><MapPin size={16} /> {user.location}</>)}
                </p>
                {user.bio && (
                  <p className="text-sm mt-2 text-gray-600" style={{ fontFamily: "inherit" }}>{user.bio}</p>
                )}
              </div>
              {/* Stats & Share */}
              <div className="profile-stat-row w-full sm:w-auto sm:ml-8 mt-4 sm:mt-0 flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-4">
                <div className="flex flex-col sm:flex-row w-full sm:w-auto gap-4 sm:gap-4">
                  <BigStat icon={<Star className="w-6 h-6" />} value={totalReviews} color="yellow" label="Reviews" />
                  <BigStat icon={<Zap className="w-6 h-6" />} value={points} color="purple" label="Points" />
                  <BigStat icon={<ClipboardList className="w-6 h-6" />} value={referralCount} color="pink" label="Referrals" />
                </div>
                <button
                  onClick={() => {
                    const url = `${window.location.origin}/profile/${user.handle}`;
                    const message = `Check out ${user.name}'s Uplaud profile!\n${url}`;
                    window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, "_blank");
                  }}
                  className="flex items-center justify-center border border-gray-200 text-gray-700 bg-[#FFF7E6] hover:bg-gray-50 px-3 py-2 rounded-lg shadow mt-2 sm:mt-0"
                  title="Share Profile"
                  style={{ minWidth: 44, fontFamily: "inherit" }}
                >
                  <Share2 className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* -------- Achievements Section (same as ProfilePage) -------- */}
        <Card
          className="shadow-[var(--shadow-elegant)] border-uplaud-purple-light/20 mb-5 mt-2 w-full"
          style={{
            background: "#FFF7E6",
            border: "1px solid #f5e7d6",
            boxShadow: "0 2px 16px 0 #dfc6a9a6, 0 2px 8px #dfc6a966",
            fontFamily: "inherit",
            transition: "background 0.22s",
            minHeight: 180,
          }}
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-br from-uplaud-purple to-uplaud-purple-light">
              <Trophy className="w-4 h-4 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-foreground">Achievements</h3>
              <p className="text-xs text-muted-foreground">
                {earnedCount} of {achievements.length} badges earned
              </p>
            </div>
          </div>

          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-7 gap-2">
            <TooltipProvider>
              {achievements.map((achievement) => (
                <Tooltip key={achievement.id}>
                  <TooltipTrigger asChild>
                    <div className="group cursor-pointer" style={{ minWidth: 80, maxWidth: 120 }}>
                      <div
                        className={`
                          relative aspect-square rounded-xl overflow-hidden transition-all duration-300
                          ${achievement.isEarned
                          ? 'shadow-[var(--shadow-badge)] hover:scale-105 animate-scale-in'
                          : 'opacity-50 grayscale hover:grayscale-0 hover:opacity-75'
                          }
                        `}
                        style={{ width: 80, height: 80, margin: "0 auto" }}
                      >
                        <img
                          src={achievement.image}
                          alt={achievement.name}
                          className="w-full h-full object-contain"
                        />
                        {!achievement.isEarned && (
                          <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                            <Lock className="w-6 h-6 text-white/80" />
                          </div>
                        )}
                        {achievement.isEarned && (
                          <div className="absolute -top-1 -right-1 w-5 h-5 bg-uplaud-green rounded-full border-2 border-white flex items-center justify-center">
                            <div className="w-2 h-2 bg-white rounded-full"></div>
                          </div>
                        )}
                      </div>
                      <div className="mt-1 text-center">
                        <p className="text-[11px] font-semibold text-foreground leading-tight truncate">
                          {achievement.name}
                        </p>
                        {achievement.progress && !achievement.isEarned && (
                          <div className="mt-1">
                            <div className="w-full bg-muted rounded-full h-1">
                              <div
                                className="bg-gradient-to-r from-uplaud-purple to-uplaud-purple-light h-1 rounded-full transition-all duration-300"
                                style={{
                                  width: `${(achievement.progress.current / achievement.progress.total) * 100}%`
                                }}
                              />
                            </div>
                            <p className="text-[10px] text-muted-foreground mt-1">
                              {achievement.progress.current}/{achievement.progress.total}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent
                    side="bottom"
                    className="max-w-xs border"
                    style={{
                      background: "#fff",
                      color: "#23223b",
                      borderColor: "#b39ddb",
                      fontSize: 13,
                      boxShadow: "0 4px 32px 0 #a89ff511, 0 2px 8px #bbb1f666",
                    }}
                  >
                    <div className="text-center">
                      <p className="font-semibold">{achievement.name}</p>
                      <p className="text-xs opacity-90 mt-1">{achievement.description}</p>
                      {achievement.progress && !achievement.isEarned && (
                        <Badge variant="secondary" className="mt-2 bg-purple-100 text-purple-700 border-purple-200">
                          {achievement.progress.current}/{achievement.progress.total} progress
                        </Badge>
                      )}
                    </div>
                  </TooltipContent>
                </Tooltip>
              ))}
            </TooltipProvider>
          </div>
        </Card>

        {/* Tabs: Reviews | Analytics */}
        <div className="rounded-2xl shadow p-4 border" style={{ background: "#FFF7E6", fontFamily: "inherit" }}>
          <div className="flex gap-6 border-b mb-6 text-base font-semibold" style={{ fontFamily: "inherit" }}>
            <button
              className={`pb-2 ${activeTab === 'Reviews' ? 'border-b-2 border-purple-600 text-purple-600' : 'text-gray-500 hover:text-purple-600'}`}
              onClick={() => setActiveTab('Reviews')}
              style={{ fontFamily: "inherit" }}
            >
              Reviews
            </button>
            <button
              className={`pb-2 ${activeTab === 'Analytics' ? 'border-b-2 border-purple-600 text-purple-600' : 'text-gray-500 hover:text-purple-600'}`}
              onClick={() => setActiveTab('Analytics')}
              style={{ fontFamily: "inherit" }}
            >
              Activity
            </button>
          </div>

          {activeTab === "Reviews" && (
            <div style={{ fontFamily: "inherit" }}>
              {loading ? (
                <div className="text-center text-gray-400 py-8">Loading reviews…</div>
              ) : reviews.length === 0 ? (
                <div className="text-center text-gray-400 py-8">You haven’t posted any reviews yet.</div>
              ) : (
                <div>
                  <div className="space-y-3">
                    {(showAllReviews ? reviews : reviews.slice(0, 5)).map((review, idx) => (
                      <ReviewCard key={idx} review={review} userName={user.name} navigate={navigate} />
                    ))}
                  </div>
                  {reviews.length > 5 && (
                    <div className="flex justify-center mt-6">
                      <button
                        className="px-5 py-2 rounded-lg bg-purple-100 text-purple-700 font-bold hover:bg-purple-200 shadow transition"
                        onClick={() => setShowAllReviews((prev) => !prev)}
                        style={{ fontFamily: "inherit" }}
                      >
                        {showAllReviews ? "Show Less" : "Load More Reviews"}
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {activeTab === "Analytics" && (
            <div style={{ fontFamily: "inherit" }}>
              <h2 className="font-bold text-xl mb-4 flex items-center gap-2 text-black">
                <BarChart2 className="w-5 h-5 text-cyan-600" /> Activities
              </h2>
              <div className="mb-6">
                <div className="font-semibold text-gray-700">Total Reviews:</div>
                <div className="text-lg font-bold text-purple-600">{totalReviews}</div>
              </div>
              <div className="mb-6">
                <div className="font-semibold text-gray-700">Average Score:</div>
                <div className="text-lg font-bold text-cyan-600">{averageScore} / 5</div>
              </div>
              
              <div className="mb-6">
                <div className="font-semibold text-gray-700 mb-1">Your Referrals</div>
                <div className="text-gray-400">No referral data tracked in dashboard.</div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Styles */}
      <style>{`
        body { background: #6D46C6 !important; font-family: 'Inter', 'Poppins', 'Segoe UI', Arial, sans-serif !important; }
        .business-hover-underline {
          transition: color 0.2s; position: relative;
        }
        .business-hover-underline:hover,
        .business-hover-underline:focus {
          color: #6D46C6 !important;
        }
        .business-hover-underline::after {
          content: "";
          position: absolute;
          left: 0; right: 0; bottom: -2px; height: 2px;
          background: #6D46C6; border-radius: 1px; opacity: 0;
          transform: scaleX(0.7);
          transition: opacity 0.18s, transform 0.2s;
        }
        .business-hover-underline:hover::after,
        .business-hover-underline:focus::after {
          opacity: 1; transform: scaleX(1);
        }
        @media (hover: hover) and (pointer: fine) {
          .stat-hover { transition: transform 0.18s, box-shadow 0.2s; }
          .stat-hover:hover, .stat-hover:focus {
            transform: scale(1.07) translateY(-4px);
            box-shadow: 0 8px 28px 0 #a89ff544, 0 2px 8px #bbb1f644; z-index: 10;
          }
        }
        .profile-stat-row { display: flex; flex-direction: column; align-items: center; width: 100%; }
        @media (min-width: 640px) {
          .profile-stat-row { flex-direction: row; align-items: flex-start; width: auto; }
        }
        .stat-card { width: 100%; max-width: 300px; }
        @media (min-width: 640px) {
          .stat-card { width: auto; min-width: 120px; max-width: none; }
        }
        .review-biz-avatar span {
          font-size: 1.3rem;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          width: 100%;
        }
        @media (max-width: 700px) {
          .review-card-mobile { padding-left: 8px; padding-right: 8px; }
          .review-biz-avatar { width: 36px !important; height: 36px !important; }
          .review-biz-avatar span { font-size: 1rem !important; line-height: 36px !important; }
          h2 { font-size: 1.15rem !important; }
        }
      `}</style>
    </div>
  );
};

export default Dashboard;
