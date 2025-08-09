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
function getBusinessInitials(name = "") {
  if (!name) return "";
  let words = name.replace(/[^A-Za-z0-9 ]/g, "").split(" ").filter(Boolean);
  if (words.length >= 2) return words.slice(0, 3).map(w => w[0].toUpperCase()).join("");
  return name.replace(/[^A-Za-z0-9]/g, "").substring(0, 3).toUpperCase();
}
function getFirstLetter(name = "") {
  const n = (name || "").trim();
  return n ? n[0].toUpperCase() : "";
}
function getWhatsAppShareLink(user) {
  let phone = user?.autogenInvite || "";
  const urlMatch = phone.match(/(?:wa\.me\/|\/)(\d{10,15})/);
  if (urlMatch && urlMatch[1]) phone = urlMatch[1];
  phone = phone.replace(/[^0-9]/g, "");
  const msg = `Add me to ${user?.name || "your"}'s circle`;
  return `https://wa.me/${phone}?text=${encodeURIComponent(msg)}`;
}

// --- helpers for last-3 logic ---
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
        // parse /profile/<slugified-name>-<last3> (last3 optional for legacy)
        const idParam = (id || "").trim();
        const m = idParam.match(/^(.+?)(?:-(\d{3}))?$/);
        const targetBase = m ? m[1] : idParam;
        const targetSuffix = m && m[2] ? m[2] : null;

        // --- Fetch User (paged) ---
        let foundUser = null;
        let userOffset = undefined;

        while (!foundUser) {
          const userResp = await axios.get(
            `https://api.airtable.com/v0/${BASE_ID}/${USERS_TABLE}`,
            { headers: { Authorization: `Bearer ${API_KEY}` }, params: { pageSize: 100, offset: userOffset } }
          );

          // candidates with matching base slug or legacy id
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
              // try reviews fallback
              l3 = await fetchLast3FromReviews({ id: candidate.id, name: candidate.name });
            }
            const canonical = `${baseSlug}-${l3 || "000"}`;

            // If URL has suffix, require exact; otherwise accept and redirect later
            const isExact = targetSuffix ? (canonical === idParam) : (baseSlug === targetBase);
            if (isExact) {
              foundUser = { ...candidate, handle: baseSlug, canonicalSlug: canonical };
              break;
            }
          }

          userOffset = userResp.data.offset;
          if (!userOffset) break;
        }

        // If we found a user but URL is not canonical, redirect to /profile/<slug>-<last3>
        if (foundUser) {
          const currentIsCanonical = idParam === foundUser.canonicalSlug;
          if (!currentIsCanonical) {
            navigate(`/profile/${foundUser.canonicalSlug}`, { replace: true });
          }
        }

        setUser(foundUser);

        // --- Fetch Reviews ---
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

        // --- Referrals Count ---
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

        // --- My Referrals (Delivered/Read) ---
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
  let joinDate = "";
  if (reviews.length > 0 && reviews[reviews.length - 1].date) {
    joinDate = formatDate(reviews[reviews.length - 1].date);
  } else {
    joinDate = "—";
  }

  // ACHIEVEMENTS for this user
  const achievements = getAchievements(user, reviews, referralCount, myReferrals);
  const earnedCount = achievements.filter(a => a.isEarned).length;

  function ReviewCard({ review }) {
    if (!review.businessName || !review.uplaud) return null;
    const whatsappText = review.referralLink
      ? `Hey, check out this Real Review for ${review.businessName} on Uplaud. It’s a platform where real people give honest reviews on WhatsApp: ${review.referralLink}`
      : `Show me ${user?.name || "User"}'s review for ${review.businessName}`;
    const shareUrl = `https://wa.me/?text=${encodeURIComponent(whatsappText)}`;

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
          {/* Left avatar */}
          <div
            className="rounded-full flex items-center justify-center font-bold uppercase review-biz-avatar"
            style={{
              width: 44, height: 44, border: "2px solid #6D46C6",
              color: "#6D46C6", background: "#F4EFFF", letterSpacing: 1,
              marginRight: 13, fontSize: "1.10rem", fontFamily: "inherit",
              boxShadow: "0 2px 10px 0 #6d46c61a"
            }}
            tabIndex={0}
            onClick={() => navigate(`/business/${slugify(review.businessName)}`)}
            title={review.businessName}
          >
            <span
              style={{
                width: "100%", textAlign: "center", fontWeight: 700,
                fontSize: review.businessName.length > 12 ? "0.92rem" : "1.08rem",
                letterSpacing: "1.5px", wordBreak: "break-all",
                lineHeight: "44px", fontFamily: "inherit"
              }}
            >
              {getBusinessInitials(review.businessName)}
            </span>
          </div>

          {/* Right content */}
          <div className="flex-1 w-full min-w-0">
            {/* Top row: Business name + date */}
            <div className="flex w-full items-center gap-2 flex-wrap justify-between">
              <div className="flex items-center gap-2 min-w-0 flex-1">
                {/* Mobile: show ONLY the first letter, always visible */}
                <span
                  className="font-semibold text-base text-black cursor-pointer sm:hidden"
                  onClick={() => navigate(`/business/${slugify(review.businessName)}`)}
                  title={review.businessName}
                  aria-label={review.businessName}
                  style={{
                    lineHeight: 1.18,
                    fontFamily: "inherit",
                    minWidth: 14,
                    display: "inline-block"
                  }}
                >
                  {getFirstLetter(review.businessName)}
                </span>

                {/* sm+ : show full business name with underline hover */}
                <span
                  className="hidden sm:inline font-semibold text-base text-black cursor-pointer business-hover-underline"
                  onClick={() => navigate(`/business/${slugify(review.businessName)}`)}
                  tabIndex={0}
                  title={review.businessName}
                  style={{
                    lineHeight: 1.18,
                    fontFamily: "inherit",
                    minWidth: 0,
                    wordBreak: "break-word"
                  }}
                >
                  {review.businessName}
                </span>
              </div>

              <span className="text-gray-500 text-xs font-medium whitespace-nowrap" style={{ flexShrink: 0 }}>
                {formatDate(review.date)}
              </span>
            </div>

            {/* Review text + stars */}
            <div
              className="rounded-xl border px-4 py-3 text-gray-900 shadow-sm text-base font-medium break-words flex items-center"
              style={{ background: "#DCF8C6", fontFamily: "inherit", marginTop: 4 }}
            >
              <span style={{ flex: "1 1 auto", minWidth: 0, wordBreak: "break-word" }}>
                {review.uplaud}
              </span>
              <span
                className="ml-2 flex-shrink-0 flex items-center review-stars-inside-box"
                style={{ minWidth: 60, justifyContent: "flex-end" }}
              >
                {Array.from({ length: review.score }).map((_, i) => (
                  <span key={i} className="text-yellow-400 text-base leading-none">★</span>
                ))}
                {review.score ? (
                  <span className="ml-1 text-xl">{emojiForScore(review.score)}</span>
                ) : null}
              </span>
            </div>

            {/* Share */}
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

  // ----------- Render -----------
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
          minWidth: 44, minHeight: 44, lineHeight: "24px",
          paddingTop: 7, paddingBottom: 7,
          background: "#FFF7E6", color: "#6D46C6", fontFamily: "inherit"
        }}
      >
        <ArrowLeft className="w-5 h-5" />
        <span className="hidden sm:inline">Back</span>
      </button>

      <div className="max-w-4xl mx-auto space-y-8 relative z-10 pt-16 sm:pt-0 px-2 sm:px-0">
        {/* Profile Card */}
        <div className="shadow-lg rounded-2xl p-6 flex flex-col sm:flex-row items-center gap-6 border mt-6" style={{ background: "#FFF7E6", fontFamily: "inherit" }}>
          <div className="relative w-20 h-20 bg-purple-100 rounded-full flex items-center justify-center text-3xl font-extrabold text-purple-700 select-none" style={{ minWidth: 80, minHeight: 80 }}>
            {user?.image ? (
              <img src={user.image} alt={user?.name || 'User'} className="w-full h-full object-cover rounded-full" />
            ) : (
              user?.name?.split(' ').map(n => n[0]).join('')
            )}
          </div>
          <div className="flex-1 min-w-0 w-full">
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
                  {user?.name}
                  {/* chip shows base handle only (no -last3) */}
                  {user?.handle && (
                    <span className="text-xs bg-purple-100 text-purple-600 rounded-full px-2 py-1 whitespace-nowrap">@{user.handle}</span>
                  )}
                </h2>
                <p className="text-sm flex flex-wrap items-center gap-2 text-gray-600 mt-2 justify-center sm:justify-start" style={{ fontFamily: "inherit" }}>
                  <Calendar size={16} /> Joined {joinDate}
                  {user?.location && (<><MapPin size={16} /> {user.location}</>)}
                </p>
                {user?.bio && (
                  <p className="text-sm mt-2 text-gray-600" style={{ fontFamily: "inherit" }}>{user.bio}</p>
                )}
              </div>
              <div className="profile-stat-row w-full sm:w-auto sm:ml-8 mt-4 sm:mt-0 flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-4">
                <div className="flex flex-col sm:flex-row w-full sm:w-auto gap-4 sm:gap-4">
                  <BigStat icon={<Star className="w-6 h-6" />} value={totalReviews} color="yellow" label="Reviews" />
                  <BigStat icon={<Zap className="w-6 h-6" />} value={points} color="purple" label="Points" />
                  <BigStat icon={<ClipboardList className="w-6 h-6" />} value={referralCount} color="pink" label="Referrals" />
                </div>
                <button
                  onClick={() => {
                    if (!user) return;
                    window.open(getWhatsAppShareLink(user), "_blank");
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

        {/* Achievements/Badges Section */}
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
                <div className="text-center text-gray-400 py-8">No reviews found for this user.</div>
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
                {myReferrals.length === 0 ? (
                  <div className="text-gray-400">You have not referred any reviews yet.</div>
                ) : (
                  <div className="space-y-2">
                    {myReferrals.map((ref, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <User className="w-4 h-4 text-green-500" />
                        <span className="font-semibold text-base text-green-800">{ref.receiver}</span>
                        <span className="text-xs text-gray-500">(for {ref.business})</span>
                        <span
                          className={`ml-2 px-2 py-1 rounded-full text-xs font-bold ${
                            ref.status === "Read"
                              ? "bg-green-100 text-green-700"
                              : "bg-yellow-100 text-yellow-800"
                          }`}
                        >
                          {ref.status === "Read" ? "Read" : "Delivered"}
                        </span>
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
        @media (hover: hover) and (pointer: fine) {
          .stat-hover { transition: transform 0.18s, box-shadow 0.2s; }
          .stat-hover:hover, .stat-hover:focus {
            transform: scale(1.07) translateY(-4px);
            box-shadow: 0 8px 28px 0 #a89ff544, 0 2px 8px #bbb1f644; z-index: 10;
          }
        }
        .profile-stat-row { display: flex; flex-direction: column; align-items: center; width: 100%; }
        @media (min-width: 640px) { .profile-stat-row { flex-direction: row; align-items: flex-start; width: auto; } }
        .stat-card { width: 100%; max-width: 300px; }
        @media (min-width: 640px) { .stat-card { width: auto; min-width: 120px; max-width: none; } }
        .review-biz-avatar span { font-size: 1.08rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; width: 100%; }
        @media (max-width: 700px) {
          .review-card-mobile { padding-left: 8px; padding-right: 8px; }
          .review-biz-avatar { width: 36px !important; height: 36px !important; }
          .review-biz-avatar span { font-size: 0.93rem !important; line-height: 36px !important; }
          h2 { font-size: 1.15rem !important; }
        }
      `}</style>
    </div>
  );
};

export default ProfilePage;
