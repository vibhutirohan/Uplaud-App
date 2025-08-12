import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Star, ClipboardList, Zap, Calendar, MapPin, ArrowLeft, Share2, BarChart2, User, Trophy, Lock
} from "lucide-react";
import axios from "axios";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

// Airtable Config
const API_KEY = 'patZS8GyNhkwoP4wY.2beddc214f4dd2a5e4c220ae654f62652a5e02a47bae2287c54fced7bb97c07e';
const BASE_ID = 'appFUJWWTaoJ3YiWt';
const USERS_TABLE = 'tblWIFgwTz3Gn3idV';
const REVIEWS_TABLE = 'tblef0n1hQXiKPHxI';
const CIRCLES_TABLE = 'tbldL8H5T4qYKUzLV';

// BADGES Definition
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
      const days = [...new Set(user.reviews.map(r =>
        r.date && !isNaN(r.date.getTime()) ? r.date.toDateString() : null
      ).filter(Boolean))].map(d => new Date(d)).sort((a, b) => a - b);

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
      if (!user.myReferrals || user.myReferrals.length < 10) return { current: 0, total: 10, isEarned: false };
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

function slugify(name = "") {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
}
function formatDate(date) {
  if (!date) return "";
  return date.toLocaleDateString(undefined, { month: "long", day: "2-digit", year: "numeric" });
}
function emojiForScore(score) {
  if (!score) return "🤍";
  if (score >= 5) return "🔥";
  if (score === 4) return "😍";
  if (score === 3) return "🙂";
  if (score === 2) return "😐";
  return "😶";
}
function getWhatsAppShareLink(user) {
  let phone = user?.autogenInvite || "";
  const urlMatch = phone.match(/(?:wa\.me\/|\/)(\d{10,15})/);
  if (urlMatch && urlMatch[1]) phone = urlMatch[1];
  phone = phone.replace(/[^0-9]/g, "");
  const msg = `Add me to ${user?.name || "your"}'s circle`;
  return `https://wa.me/${phone}?text=${encodeURIComponent(msg)}`;
}

// helpers for last-3
const digitsOnly = (s="") => (s || "").toString().replace(/\D/g, "");
const last3 = (s="") => {
  const d = digitsOnly(s);
  if (!d) return "000";
  return d.slice(-3).padStart(3, "0");
};

async function fetchLast3FromReviews(foundUser) {
  const headers = { Authorization: `Bearer ${API_KEY}` };
  const byIdParams = { pageSize: 1, filterByFormula: `{ID (from Creator)}="${foundUser.id}"` };
  const byNameParams = { pageSize: 1, filterByFormula: `{Name_Creator}="${foundUser.name}"` };
  try {
    const r1 = await axios.get(`https://api.airtable.com/v0/${BASE_ID}/${REVIEWS_TABLE}`, { headers, params: byIdParams });
    let rec = r1.data.records?.[0];
    if (!rec) {
      const r2 = await axios.get(`https://api.airtable.com/v0/${BASE_ID}/${REVIEWS_TABLE}`, { headers, params: byNameParams });
      rec = r2.data.records?.[0];
    }
    const phone = rec?.fields?.ReviewerPhoneNumber || rec?.fields?.Phone || "";
    return last3(phone);
  } catch {
    return "000";
  }
}

// Compact stats strip (one card, 3 segments)
const StatsStrip = ({ totalReviews, points, referralCount }) => {
  const Item = ({ icon, label, value }) => (
    <div className="stats-seg flex-1 min-w-0 py-3 sm:py-4 px-2 sm:px-4 text-center border rounded-xl bg-white/85 backdrop-blur-sm">
      <div className="flex items-center justify-center gap-2">
        {icon}
        <span className="stat-value font-extrabold">{value}</span>
      </div>
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

const ProfilePage = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [referralCount, setReferralCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('Reviews');
  const [showAllReviews, setShowAllReviews] = useState(false);
  const [myReferrals, setMyReferrals] = useState([]);

  useEffect(() => {
    const fetchUserAndReviews = async () => {
      setLoading(true);
      try {
        const idParam = (id || "").trim();
        const m = idParam.match(/^(.+?)(?:-(\d{3}))?$/);
        const targetBase = m ? m[1] : idParam;
        const targetSuffix = m && m[2] ? m[2] : null;

        // Fetch User (paged)
        let foundUser = null;
        let userOffset = undefined;

        while (!foundUser) {
          const userResp = await axios.get(
            `https://api.airtable.com/v0/${BASE_ID}/${USERS_TABLE}`,
            { headers: { Authorization: `Bearer ${API_KEY}` }, params: { pageSize: 100, offset: userOffset } }
          );

          const candidates = userResp.data.records.filter(rec => {
            const name = rec.fields.Name || "";
            return slugify(name) === targetBase || slugify(name) === idParam;
          });

          for (const rec of candidates) {
            const name = rec.fields.Name || "";
            const candidate = {
              id: rec.fields.ID?.toString(),
              airtableId: rec.id,
              name,
              phone: rec.fields["Phone"] || "",
              image: Array.isArray(rec.fields.image) ? rec.fields.image[0]?.url : rec.fields.image,
              autogenInvite: rec.fields["Autogen Invite"] ?? "",
              bio: rec.fields["Bio"] ?? "",
              location: rec.fields["Location"] ?? "",
              gender: rec.fields["Gender"] || "Male",
            };

            const baseSlug = slugify(name);
            let l3 = last3(candidate.phone);
            if (!l3 || l3 === "000") {
              l3 = await fetchLast3FromReviews({ id: candidate.id, name: candidate.name });
            }
            const canonical = `${baseSlug}-${l3 || "000"}`;

            const isExact = targetSuffix ? (canonical === idParam) : (baseSlug === targetBase);
            if (isExact) {
              foundUser = { ...candidate, handle: baseSlug, canonicalSlug: canonical };
              break;
            }
          }

          userOffset = userResp.data.offset;
          if (!userOffset) break;
        }

        if (foundUser) {
          const currentIsCanonical = idParam === foundUser.canonicalSlug;
          if (!currentIsCanonical) {
            navigate(`/profile/${foundUser.canonicalSlug}`, { replace: true });
          }
        }

        setUser(foundUser);

        // Reviews
        let allReviews = [];
        if (foundUser) {
          let offset = undefined;
          do {
            const params = { pageSize: 100, offset, filterByFormula: `{ID (from Creator)}="${foundUser.id}"` };
            const revResp = await axios.get(
              `https://api.airtable.com/v0/${BASE_ID}/${REVIEWS_TABLE}`,
              { headers: { Authorization: `Bearer ${API_KEY}` }, params }
            );
            allReviews = allReviews.concat(revResp.data.records);
            offset = revResp.data.offset;
          } while (offset);

          if (allReviews.length === 0) {
            let nameOffset = undefined;
            do {
              const nameParams = { pageSize: 100, offset: nameOffset, filterByFormula: `{Name_Creator}="${foundUser.name}"` };
              const nameRevResp = await axios.get(
                `https://api.airtable.com/v0/${BASE_ID}/${REVIEWS_TABLE}`,
                { headers: { Authorization: `Bearer ${API_KEY}` }, params: nameParams }
              );
              allReviews = allReviews.concat(nameRevResp.data.records);
              nameOffset = nameRevResp.data.offset;
            } while (nameOffset);
          }

          const validReviews = allReviews
            .filter(r =>
              !!r.fields.business_name &&
              !!r.fields.Uplaud &&
              typeof r.fields["Uplaud Score"] === "number"
            )
            .map(r => ({
              businessName: r.fields.business_name,
              uplaud: r.fields.Uplaud,
              date: r.fields.Date_Added ? new Date(r.fields.Date_Added) : null,
              score: r.fields["Uplaud Score"],
              shareLink: r.fields["Share Link"] || "",
              referralLink: r.fields["ReferralLink"] || "",
              location: r.fields.City || "",
              category: r.fields.Category || "Other"
            }))
            .sort((a, b) => {
              if (!a.date) return 1;
              if (!b.date) return -1;
              return b.date.getTime() - a.date.getTime();
            });
          setReviews(validReviews);
        } else {
          setReviews([]);
        }

        // Referrals Count
        let uniqueReferralPairs = new Set();
        if (foundUser && foundUser.name) {
          let circles = [];
          let offset = undefined;
          do {
            const params = { pageSize: 100, offset, filterByFormula: `{Initiator}="${foundUser.name}"` };
            const circleResp = await axios.get(
              `https://api.airtable.com/v0/${BASE_ID}/${CIRCLES_TABLE}`,
              { headers: { Authorization: `Bearer ${API_KEY}` }, params }
            );
            circles = circles.concat(circleResp.data.records);
            offset = circleResp.data.offset;
          } while (offset);

          circles.forEach(circle => {
            let receiver = circle.fields["Receiver"];
            let biz = circle.fields["Business_Name"];
            if (Array.isArray(receiver)) {
              receiver.forEach(r => { if (r && biz) uniqueReferralPairs.add(`${r}||${biz}`); });
            } else if (receiver && biz) {
              uniqueReferralPairs.add(`${receiver}||${biz}`);
            }
          });
          setReferralCount(uniqueReferralPairs.size);
        } else {
          setReferralCount(0);
        }

        // My Referrals list (kept but without status chips in UI)
        if (foundUser && foundUser.name) {
          let circles = [];
          let offset = undefined;
          let myRefArr = [];
          do {
            const params = { pageSize: 100, offset, filterByFormula: `{Initiator}="${foundUser.name}"` };
            const circleResp = await axios.get(
              `https://api.airtable.com/v0/${BASE_ID}/${CIRCLES_TABLE}`,
              { headers: { Authorization: `Bearer ${API_KEY}` }, params }
            );
            circles = circles.concat(circleResp.data.records);
            offset = circleResp.data.offset;
          } while (offset);

          for (const circle of circles) {
            const receiver = circle.fields["Receiver"];
            const business = circle.fields["Business_Name"] || "";
            const reviewStatus = circle.fields["ReviewStatus"] || circle.fields["ReferralStatus"] || "Delivered";
            const refDate = circle.fields["Date_Added"] ? new Date(circle.fields["Date_Added"]) : null;
            if (Array.isArray(receiver)) {
              receiver.forEach(r => {
                if (r && business) {
                  myRefArr.push({
                    receiver: r,
                    business,
                    status: reviewStatus,
                    date: refDate
                  });
                }
              });
            } else if (receiver && business) {
              myRefArr.push({
                receiver,
                business,
                status: reviewStatus,
                date: refDate
              });
            }
          }
          setMyReferrals(myRefArr);
        } else {
          setMyReferrals([]);
        }

      } catch (err) {
        setUser(null);
        setReviews([]);
        setReferralCount(0);
        setMyReferrals([]);
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchUserAndReviews();
  }, [id, navigate]);

  // Stats
  const points = reviews.length * 10 + referralCount * 20;
  const totalReviews = reviews.length;
  const averageScore = reviews.length
    ? (reviews.reduce((sum, r) => sum + (r.score || 0), 0) / reviews.length).toFixed(2)
    : "-";
  const joinDate = (reviews.length > 0 && reviews[reviews.length - 1].date)
    ? formatDate(reviews[reviews.length - 1].date)
    : "—";

  // Achievements
  const achievements = getAchievements(user, reviews, referralCount, myReferrals);
  const earnedAchievements = achievements.filter(a => a.isEarned);
  const lockedAchievements = achievements.filter(a => !a.isEarned);

  // For “Next up”
  const nextUp = [...lockedAchievements]
    .map(b => ({ ...b, pct: b.progress?.total ? (b.progress.current / b.progress.total) : 0 }))
    .sort((a, b) => b.pct - a.pct)
    .slice(0, 3);

  function ReviewCard({ review }) {
    if (!review.businessName || !review.uplaud) return null;
    const whatsappText = review.referralLink
      ? `Hey, check out this Real Review for ${review.businessName} on Uplaud. It’s a platform where real people give honest reviews on WhatsApp: ${review.referralLink}`
      : `Show me ${user?.name || "User"}'s review for ${review.businessName}`;
    const shareUrl = `https://wa.me/?text=${encodeURIComponent(whatsappText)}`;

    return (
      <div
        className="flex rounded-2xl px-3 py-4 shadow group transition hover:shadow-xl mb-3 border"
        style={{
          alignItems: "flex-start",
          background: "rgba(255,255,255,0.70)",
          backdropFilter: "blur(6px)",
          fontFamily: "inherit",
          position: "relative"
        }}
      >
        <div className="flex items-start w-full">
          <div className="flex-1 w-full min-w-0">
            {/* Top row: Business name + stars/emoji + date */}
            <div className="flex w-full items-center gap-2 flex-wrap justify-between">
              <div className="flex items-center gap-2 min-w-0 flex-1">
                <span
                  className="font-semibold text-base text-black cursor-pointer truncate business-hover-underline"
                  onClick={() => navigate(`/business/${slugify(review.businessName)}`)}
                  tabIndex={0}
                  title={review.businessName}
                  style={{ lineHeight: 1.18, fontFamily: "inherit", minWidth: 0, maxWidth: "100%", display: "inline-block" }}
                >
                  {review.businessName}
                </span>
              </div>

              {/* Stars + Emoji BEFORE date */}
              <span className="text-yellow-500 text-sm flex items-center gap-1 flex-shrink-0">
                {Array.from({ length: review.score }).map((_, i) => (
                  <span key={i}>★</span>
                ))}
                {review.score ? <span className="text-lg leading-none">{emojiForScore(review.score)}</span> : null}
              </span>

              <span className="text-gray-500 text-xs font-medium whitespace-nowrap" style={{ flexShrink: 0 }}>
                {formatDate(review.date)}
              </span>
            </div>

            <div
              className="rounded-xl border px-4 py-3 text-gray-900 shadow-sm text-base font-medium break-words"
              style={{ background: "#DCF8C6", fontFamily: "inherit", marginTop: 6 }}
            >
              {review.uplaud}
            </div>

            <div className="flex w-full">
              <button
                onClick={() => window.open(shareUrl, "_blank")}
                className="bg-green-100 hover:bg-green-200 p-2 rounded-full shadow-md transition flex items-center mt-3"
                title="Share this review on WhatsApp"
              >
                <Share2 className="text-green-600 w-5 h-5" />
                <span className="ml-2 text-green-700 font-medium text-sm"></span>
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

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
        onClick={() => navigate("/leaderboard")}
        className="fixed sm:absolute top-4 left-4 z-50 font-semibold rounded-md border border-purple-100 flex items-center gap-2 shadow hover:bg-purple-50 px-3 py-2 text-base transition"
        style={{
          minWidth: 44, minHeight: 44,
          background: "rgba(255,255,255,0.88)", color: "#6D46C6", fontFamily: "inherit", backdropFilter: "blur(6px)"
        }}
      >
        <ArrowLeft className="w-5 h-5" />
        <span className="hidden sm:inline">Back</span>
      </button>

      <div className="max-w-4xl mx-auto space-y-6 relative z-10 pt-16 sm:pt-0 px-2 sm:px-0">
        {/* Profile Card (transparent) */}
        <div
          className="shadow-lg rounded-2xl p-5 sm:p-6 flex flex-col gap-5 border mt-6"
          style={{
            background: "rgba(255,255,255,0.75)",
            backdropFilter: "blur(8px)",
            borderColor: "rgba(255,255,255,0.6)",
            fontFamily: "inherit"
          }}
        >
          <div className="flex items-center gap-4">
            <div className="relative w-16 h-16 sm:w-20 sm:h-20 bg-purple-100 rounded-full flex items-center justify-center text-2xl sm:text-3xl font-extrabold text-purple-700 select-none">
              {user?.image ? (
                <img src={user.image} alt={user?.name || 'User'} className="w-full h-full object-cover rounded-full" />
              ) : (
                user?.name?.split(' ').map(n => n[0]).join('')
              )}
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="font-extrabold text-xl sm:text-2xl flex flex-wrap items-center gap-2">
                {user?.name}
                {user?.handle && (
                  <span className="text-xs bg-purple-100 text-purple-600 rounded-full px-2 py-1 whitespace-nowrap">@{user.handle}</span>
                )}
              </h2>
              <p className="text-sm flex flex-wrap items-center gap-2 text-gray-700 mt-1">
                <Calendar size={16} /> Joined {joinDate}
                {user?.location && (<><MapPin size={16} /> {user.location}</>)}
              </p>
              {user?.bio && <p className="text-sm mt-1 text-gray-700">{user.bio}</p>}
            </div>

            {/* Desktop share */}
            <button
              onClick={() => { if (!user) return; window.open(getWhatsAppShareLink(user), "_blank"); }}
              className="hidden sm:flex items-center justify-center border border-gray-200 text-gray-700 px-3 py-2 rounded-lg shadow"
              title="Share Profile"
              style={{ background: "rgba(255,255,255,0.8)", backdropFilter: "blur(6px)" }}
            >
              <Share2 className="w-5 h-5" />
            </button>
          </div>

          {/* ONE compact stats card */}
          <div className="rounded-xl border p-2 sm:p-3 bg-white/70 backdrop-blur-md">
            <StatsStrip totalReviews={totalReviews} points={points} referralCount={referralCount} />
          </div>

          {/* Mobile share — transparent & centered */}
          <div className="sm:hidden flex justify-center">
            <button
              onClick={() => { if (!user) return; window.open(getWhatsAppShareLink(user), "_blank"); }}
              title="Share Profile"
              className="p-2"
              style={{ background: "transparent", border: "none", boxShadow: "none" }}
            >
              <Share2 className="w-6 h-6 text-white" />
            </button>
          </div>
        </div>

        {/* Achievements: earned + next up */}
        <Card
          className="w-full backdrop-blur-md"
          style={{
            background: "rgba(255,255,255,0.16)",
            border: "1px solid rgba(255,255,255,0.35)",
            boxShadow: "0 12px 30px rgba(0,0,0,0.08)",
            fontFamily: "inherit",
          }}
        >
          <div className="flex items-center gap-3 px-3 pt-3">
            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-purple-600">
              <Trophy className="w-4 h-4 text-white" />
            </div>
            <h3 className="text-lg font-semibold text-white">Achievements</h3>
          </div>

          <div className="px-3 pb-3 md:grid md:grid-cols-12 md:gap-3">
            {/* Earned badges — slightly smaller so label is visible */}
            <div className="md:col-span-8">
              {earnedAchievements.length === 0 ? (
                <div className="text-center text-white/90 py-6 text-sm">
                  No badges yet — start reviewing to earn your first badge!
                </div>
              ) : (
                <TooltipProvider>
                  <div
                    className="gap-2 grid"
                    style={{ gridTemplateColumns: "repeat(auto-fit, minmax(72px, 1fr))" }}  // ↓ smaller tiles
                  >
                    {earnedAchievements.map((a) => (
                      <Tooltip key={a.id}>
                        <TooltipTrigger asChild>
                          <div className="group cursor-pointer">
                            <div
                              className="relative rounded-xl overflow-hidden transition-all duration-300 shadow-[0_8px_24px_rgba(0,0,0,0.15)] hover:scale-105 bg-white/40"
                              style={{ width: "100%", aspectRatio: "1 / 1", padding: 6 }}   // smaller & padded
                            >
                              <img src={a.image} alt={a.name} className="w-full h-full object-contain" />
                              <div className="absolute -top-1 -right-1 w-5 h-5 bg-uplaud-green rounded-full border-2 border-white flex items-center justify-center">
                                <div className="w-2 h-2 bg-white rounded-full"></div>
                              </div>
                            </div>
                            <div className="mt-1 text-center">
                              <p className="text-[11px] font-semibold text-white leading-tight">{a.name}</p>
                            </div>
                          </div>
                        </TooltipTrigger>
                        <TooltipContent
                          side="bottom"
                          className="max-w-xs border"
                          style={{ background: "#fff", color: "#23223b", borderColor: "#b39ddb", fontSize: 13 }}
                        >
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

            {/* Next up (right on desktop, below on mobile) */}
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
                          <div
                            className="flex items-center gap-2 rounded-lg border px-2 py-2 bg-white/25 border-white/35 cursor-pointer"
                            tabIndex={0}
                            aria-label={`${n.name} — ${n.description}`}
                          >
                            <img src={n.image} alt={n.name} className="w-8 h-8 object-contain" />
                            <div className="flex-1 min-w-0">
                              <div className="text-[12px] text-white truncate">{n.name}</div>
                              <div className="w-full bg-white/30 rounded-full h-1 mt-1">
                                <div className="bg-white h-1 rounded-full" style={{ width: `${Math.min(100, Math.round((n.progress.current / n.progress.total) * 100))}%` }} />
                              </div>
                            </div>
                            <span className="text-[11px] text-white/80 whitespace-nowrap">{n.progress.current}/{n.progress.total}</span>
                          </div>
                        </TooltipTrigger>
                        <TooltipContent
                          side="left"
                          className="max-w-xs border"
                          style={{ background: "#fff", color: "#23223b", borderColor: "#b39ddb", fontSize: 13 }}
                        >
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
        <div
          className="rounded-2xl shadow p-4 border"
          style={{
            background: "rgba(255,255,255,0.80)",
            borderColor: "rgba(255,255,255,0.7)",
            backdropFilter: "blur(8px)"
          }}
        >
          <div className="flex gap-6 border-b mb-6 text-base font-semibold">
            <button
              className={`pb-2 ${activeTab === 'Reviews' ? 'border-b-2 border-purple-600 text-purple-700' : 'text-gray-600 hover:text-purple-700'}`}
              onClick={() => setActiveTab('Reviews')}
            >
              Reviews
            </button>
            <button
              className={`pb-2 ${activeTab === 'Analytics' ? 'border-b-2 border-purple-600 text-purple-700' : 'text-gray-600 hover:text-purple-700'}`}
              onClick={() => setActiveTab('Analytics')}
            >
              Activity
            </button>
          </div>

          {activeTab === "Reviews" && (
            <div>
              {loading ? (
                <div className="text-center text-gray-400 py-8">Loading reviews…</div>
              ) : reviews.length === 0 ? (
                <div className="text-center text-gray-500 py-8">No reviews found for this user.</div>
              ) : (
                <div>
                  <div className="space-y-3">
                    {(showAllReviews ? reviews : reviews.slice(0, 5)).map((review, idx) => (
                      <ReviewCard key={idx} review={review} />
                    ))}
                  </div>
                  {reviews.length > 5 && (
                    <div className="flex justify-center mt-6">
                      <button
                        className="px-5 py-2 rounded-lg bg-purple-100 text-purple-700 font-bold hover:bg-purple-200 shadow transition"
                        onClick={() => setShowAllReviews((prev) => !prev)}
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
            <div>
              <h2 className="font-bold text-xl mb-4 flex items-center gap-2 text-black">
                <BarChart2 className="w-5 h-5 text-cyan-600" /> Activities
              </h2>

              {/* Locked badges */}
              <div className="mb-8">
                <div className="font-semibold text-gray-700 mb-2">Badge Goals</div>
                {lockedAchievements.length === 0 ? (
                  <div className="text-gray-500 text-sm">You’ve unlocked all available badges. 🙌</div>
                ) : (
                  <TooltipProvider>
                    <div className="grid grid-cols-2 xs:grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
                      {lockedAchievements.map((a) => (
                        <Tooltip key={a.id}>
                          <TooltipTrigger asChild>
                            <div className="group cursor-pointer">
                              <div
                                className="relative rounded-xl overflow-hidden border bg-white shadow-sm grayscale opacity-80 hover:grayscale-0 hover:opacity-100 transition"
                                style={{ width: 84, height: 84, margin: "0 auto" }}
                              >
                                <img src={a.image} alt={a.name} className="w-full h-full object-contain" />
                                <div className="absolute inset-0 bg-black/15 flex items-center justify-center">
                                  <Lock className="w-5 h-5 text-white/90" />
                                </div>
                              </div>
                              <div className="mt-1 text-center">
                                <p className="text-[11px] font-semibold text-gray-800 leading-tight truncate">{a.name}</p>
                                {a.progress && (
                                  <div className="mt-1">
                                    <div className="w-full bg-muted rounded-full h-1">
                                      <div
                                        className="bg-purple-600 h-1 rounded-full transition-all duration-300"
                                        style={{ width: `${(a.progress.current / a.progress.total) * 100}%` }}
                                      />
                                    </div>
                                    <p className="text-[10px] text-muted-foreground mt-1">
                                      {a.progress.current}/{a.progress.total}
                                    </p>
                                  </div>
                                )}
                              </div>
                            </div>
                          </TooltipTrigger>
                          <TooltipContent
                            side="bottom"
                            className="max-w-xs border"
                            style={{ background: "#fff", color: "#23223b", borderColor: "#b39ddb", fontSize: 13 }}
                          >
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

              {/* Stats */}
              <div className="mb-6">
                <div className="font-semibold text-gray-700">Total Reviews:</div>
                <div className="text-lg font-bold text-purple-600">{totalReviews}</div>
              </div>
              <div className="mb-6">
                <div className="font-semibold text-gray-700">Average Score:</div>
                <div className="text-lg font-bold text-cyan-600">{averageScore} / 5</div>
              </div>

              {/* Referrals: no status chip now */}
              <div className="mb-6">
                <div className="font-semibold text-gray-700 mb-1">Your Referrals</div>
                {myReferrals.length === 0 ? (
                  <div className="text-gray-400">You have not referred any reviews yet.</div>
                ) : (
                  <div className="space-y-2">
                    {myReferrals.map((ref, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <User className="w-4 h-4 text-green-600" />
                        <span className="font-semibold text-base text-green-800">{ref.receiver}</span>
                        <span className="text-xs text-gray-500">(for {ref.business})</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      <style>{`
        body { background: #6D46C6 !important; font-family: 'Inter', 'Poppins', 'Segoe UI', Arial, sans-serif !important; }

        .business-hover-underline { transition: color 0.2s; position: relative; }
        .business-hover-underline:hover, .business-hover-underline:focus { color: #6D46C6 !important; }
        .business-hover-underline::after {
          content: ""; position: absolute; left: 0; right: 0; bottom: -2px; height: 2px;
          background: #6D46C6; border-radius: 1px; opacity: 0; transform: scaleX(0.7);
          transition: opacity 0.18s, transform 0.2s;
        }
        .business-hover-underline:hover::after, .business-hover-underline:focus::after { opacity: 1; transform: scaleX(1); }

        /* Compact stats sizing on mobile */
        .stat-value { font-size: 1.15rem; }
        .stat-label { font-size: 0.85rem; }
        @media (min-width: 640px) {
          .stat-value { font-size: 1.35rem; }
          .stat-label { font-size: 0.95rem; }
        }

        @media (hover: hover) and (pointer: fine) {
          .stats-seg { transition: transform 0.15s, box-shadow 0.15s; }
          .stats-seg:hover { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(0,0,0,0.08); }
        }

        /* tiny helper for 360-400px devices */
        @media (max-width: 400px) {
          .xs\\:grid-cols-3 { grid-template-columns: repeat(3, minmax(0, 1fr)); }
        }
      `}</style>
    </div>
  );
};

export default ProfilePage;
