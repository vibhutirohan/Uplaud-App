import React, { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  Star, ClipboardList, Zap, Calendar, MapPin, ArrowLeft, Share2, BarChart2, Trophy, Lock, User
} from "lucide-react";
import axios from "axios";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

/* ===================== Airtable Config ===================== */
const API_KEY = 'patZS8GyNhkwoP4wY.2beddc214f4dd2a5e4c220ae654f62652a5e02a47bae2287c54fced7bb97c07e';
const BASE_ID = 'appFUJWWTaoJ3YiWt';
const USERS_TABLE = 'tblWIFgwTz3Gn3idV';
const REVIEWS_TABLE = 'tblef0n1hQXiKPHxI';
const CIRCLES_TABLE = 'tbldL8H5T4qYKUzLV';

/* ===================== Badges ===================== */
const BADGES = [
  {
    key: "fresh_voice",
    label: "Fresh Voice",
    description: "Submit your first review",
    image: "Fresh_Voice.png",
    progress: (user: any) => ({
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
    progress: (user: any) => ({
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
    progress: (user: any) => {
      const catCount = new Set(user.reviews.map((r: any) => (r.category || "").toLowerCase())).size;
      return { current: Math.min(catCount, 5), total: 5, isEarned: catCount >= 5 };
    }
  },
  {
    key: "cultural_explorer",
    label: "Cultural Explorer",
    description: "10+ reviews in Museums/Nature categories",
    image: "Cultural_Explorer.png",
    progress: (user: any) => {
      const count = user.reviews.filter((r: any) => ["museum", "nature"].includes((r.category || "").toLowerCase())).length;
      return { current: Math.min(count, 10), total: 10, isEarned: count >= 10 };
    }
  },
  {
    key: "squad_initiator",
    label: "Squad Initiator",
    description: "Refer 1 friend who joins & reviews",
    image: "Squad_Initiator.png",
    progress: (user: any) => ({
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
    progress: (user: any) => ({
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
    progress: (user: any) => {
      const days = [...new Set(user.reviews.map((r: any) =>
        r.date && !isNaN(r.date.getTime()) ? r.date.toDateString() : null
      ).filter(Boolean))].map((d: any) => new Date(d)).sort((a: any, b: any) => a as any - (b as any));

      let streak = 1, maxStreak = 1;
      for (let i = 1; i < days.length; i++) {
        if (((days[i] as any) - (days[i - 1] as any)) === 24 * 3600 * 1000) {
          streak++; maxStreak = Math.max(maxStreak, streak);
        } else { streak = 1; }
      }
      return { current: Math.min(maxStreak, 7), total: 7, isEarned: maxStreak >= 7 };
    }
  },
  {
    key: "viral_star",
    label: "Viral Star",
    description: "10+ referrals in 1 week",
    image: "Viral_Star.png",
    progress: (user: any) => {
      if (!user.myReferrals || user.myReferrals.length < 10) return { current: 0, total: 10, isEarned: false };
      const refDates = user.myReferrals
        .map((ref: any) => ref.date ? new Date(ref.date) : null)
        .filter(Boolean)
        .sort((a: any, b: any) => a as any - (b as any));
      let earned = false;
      for (let i = 0; i <= refDates.length - 10; i++) {
        const start = refDates[i] as any;
        const end = refDates[i + 9] as any;
        if ((end - start) <= 7 * 24 * 3600 * 1000) { earned = true; break; }
      }
      return { current: Math.min(user.myReferrals.length, 10), total: 10, isEarned: earned };
    }
  }
];

const getGenderFolder = (gender?: string) => {
  if (!gender) return "Male";
  if (gender.toLowerCase().startsWith("f")) return "Female";
  return "Male";
};

function getAchievements(user: any, reviews: any[], referralCount: number, myReferrals: any[]) {
  const gender = getGenderFolder(user?.gender || user?.Gender);
  const userObj = { ...user, reviews: reviews || [], referralCount: referralCount || 0, myReferrals: myReferrals || [] };
  return BADGES.map(badge => {
    const p = badge.progress(userObj);
    return { id: badge.key, name: badge.label, description: badge.description, image: `/badges/${gender}/${badge.image}`, isEarned: p.isEarned, progress: p };
  });
}

/* ===================== Utilities ===================== */
function slugify(name = "") {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
}
function formatDate(date?: Date | null) {
  if (!date) return "";
  return date.toLocaleDateString(undefined, { month: "long", day: "2-digit", year: "numeric" });
}
function emojiForScore(score?: number) {
  if (!score) return "🤍";
  if (score >= 5) return "🔥";
  if (score === 4) return "😍";
  if (score === 3) return "🙂";
  if (score === 2) return "😐";
  return "😶";
}
function getWhatsAppShareLink(user?: any) {
  let phone = user?.autogenInvite || "";
  const urlMatch = phone.match(/(?:wa\.me\/|\/)(\d{10,15})/);
  if (urlMatch && urlMatch[1]) phone = urlMatch[1];
  phone = phone.replace(/[^0-9]/g, "");
  const msg = `Add me to ${user?.name || "your"}'s circle`;
  return `https://wa.me/${phone}?text=${encodeURIComponent(msg)}`;
}
const digitsOnly = (s="") => (s || "").toString().replace(/\D/g, "");
const last3 = (s="") => {
  const d = digitsOnly(s);
  if (!d) return "000";
  return d.slice(-3).padStart(3, "0");
};
async function fetchLast3FromReviews(foundUser: any) {
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

/* Time ago + referral helpers (time text not shown in UI now, but kept for future) */
function timeAgo(from?: Date | null) {
  if (!from) return "just now";
  const ms = Date.now() - from.getTime();
  const s = Math.max(1, Math.floor(ms / 1000));
  const m = Math.floor(s / 60);
  const h = Math.floor(m / 60);
  const d = Math.floor(h / 24);
  if (d > 0) return d === 1 ? "1 day ago" : `${d} days ago`;
  if (h > 0) return h === 1 ? "1 hour ago" : `${h} hours ago`;
  if (m > 0) return m === 1 ? "1 min ago" : `${m} mins ago`;
  return "just now";
}
function toReferralStatus(raw?: string): "clicked" | "reviewed" {
  const s = (raw || "").toLowerCase();
  if (["reviewed", "completed", "done", "posted"].some(k => s.includes(k))) return "reviewed";
  return "clicked";
}
function makeAvatarUrl(name: string) {
  const n = encodeURIComponent(name || "User");
  return `https://ui-avatars.com/api/?name=${n}&size=150&background=random`;
}

/* ===================== UI Bits ===================== */
const ColoredStatsTabs = ({
  totalReviews, points, referralCount
}: { totalReviews: number; points: number; referralCount: number; }) => {
  const Pill = ({
    bg, ring, icon, label, value
  }: { bg: string; ring: string; icon: React.ReactNode; label: string; value: number | string; }) => (
    <div
      className={`rounded-xl ${bg} ${ring} px-2.5 py-1.5 sm:px-4 sm:py-3 shadow-sm flex items-center justify-center gap-2 sm:gap-3`}
      style={{ backdropFilter: "blur(4px)" }}
    >
      {icon}
      <span className="text-base sm:text-lg font-extrabold tabular-nums">{value}</span>
      <span className="text-[12px] sm:text-[13px] font-semibold whitespace-nowrap">{label}</span>
    </div>
  );

  return (
    <div className="grid grid-cols-3 gap-2 sm:gap-3">
      <Pill bg="bg-amber-50 text-amber-800" ring="ring-1 ring-amber-200" icon={<Star className="w-3 h-3" />} label="Reviews" value={totalReviews} />
      <Pill bg="bg-violet-50 text-violet-800" ring="ring-1 ring-violet-200" icon={<Zap className="w-3 h-3" />} label="Points" value={points} />
      <Pill bg="bg-rose-50 text-rose-800" ring="ring-1 ring-rose-200" icon={<ClipboardList className="w-3 h-3" />} label="Referrals" value={referralCount} />
    </div>
  );
};

/* ===== ReferralCard (status/time removed per request) ===== */
export interface ReferralData {
  id: string;
  referredPersonName: string;
  businessName: string;
  timeAgo: string; // kept in data, not displayed
  status: "clicked" | "reviewed"; // kept in data, not displayed
  avatarUrl?: string;
}

const ReferralCard = ({ referral }: { referral: ReferralData }) => {
  return (
    <div className="bg-gradient-card rounded-xl p-4 shadow-card hover:shadow-soft transition-all duration-300 border border-accent/20">
      <div className="flex items-start gap-3">
        <Avatar className="h-10 w-10 border-2 border-accent/30">
          <AvatarImage src={referral.avatarUrl} alt={referral.referredPersonName} />
          <AvatarFallback className="bg-accent text-accent-foreground">
            <User className="h-4 w-4" />
          </AvatarFallback>
        </Avatar>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-foreground truncate">{referral.referredPersonName}</h3>
              <div className="flex items-center gap-1 text-muted-foreground text-sm mt-1">
                <MapPin className="h-3 w-3 flex-shrink-0" />
                <span className="truncate">{referral.businessName}</span>
              </div>
            </div>
            {/* Status badge removed */}
          </div>

          {/* Time row removed */}
        </div>
      </div>
    </div>
  );
};

/* ===================== Page ===================== */
const ProfilePage = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [user, setUser] = useState<any>(null);
  const [reviews, setReviews] = useState<any[]>([]);
  const [referralCount, setReferralCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'Reviews' | 'Analytics'>('Reviews');
  const [showAllReviews, setShowAllReviews] = useState(false);

  // For achievements + UI
  const [myReferrals, setMyReferrals] = useState<any[]>([]);
  const [referralsUI, setReferralsUI] = useState<ReferralData[]>([]);

  useEffect(() => {
    const fetchUserAndReviews = async () => {
      setLoading(true);
      try {
        const idParam = (id || "").trim();
        const m = idParam.match(/^(.+?)(?:-(\d{3}))?$/);
        const targetBase = m ? m[1] : idParam;
        const targetSuffix = m && m[2] ? m[2] : null;

        // Find user (paged)
        let foundUser: any = null;
        let userOffset: string | undefined = undefined;

        while (!foundUser) {
          const userResp = await axios.get(
            `https://api.airtable.com/v0/${BASE_ID}/${USERS_TABLE}`,
            { headers: { Authorization: `Bearer ${API_KEY}` }, params: { pageSize: 100, offset: userOffset } }
          );

          const candidates = userResp.data.records.filter((rec: any) => {
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
        let allReviews: any[] = [];
        if (foundUser) {
          let offset: string | undefined = undefined;
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
            let nameOffset: string | undefined = undefined;
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
            .filter((r: any) =>
              !!r.fields.business_name &&
              !!r.fields.Uplaud &&
              typeof r.fields["Uplaud Score"] === "number"
            )
            .map((r: any) => ({
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
              return (b.date?.getTime?.() ?? 0) - (a.date?.getTime?.() ?? 0);
            });
          setReviews(validReviews);
        } else {
          setReviews([]);
        }

        // ==== Referrals (dedupe receiver||business; keep latest status/date) ====
        let unique = new Map<string, { receiver: string; business: string; status: "clicked" | "reviewed"; date: Date | null }>();
        let rawForBadges: any[] = [];

        if (foundUser && foundUser.name) {
          let circles: any[] = [];
          let offset: string | undefined = undefined;
          do {
            const params = { pageSize: 100, offset, filterByFormula: `{Initiator}="${foundUser.name}"` };
            const circleResp = await axios.get(
              `https://api.airtable.com/v0/${BASE_ID}/${CIRCLES_TABLE}`,
              { headers: { Authorization: `Bearer ${API_KEY}` }, params }
            );
            circles = circles.concat(circleResp.data.records);
            offset = circleResp.data.offset;
          } while (offset);

          for (const c of circles) {
            const receivers = Array.isArray(c.fields["Receiver"]) ? c.fields["Receiver"] : [c.fields["Receiver"]];
            const business = c.fields["Business_Name"] || "";
            const rawStatus = c.fields["ReviewStatus"] || c.fields["ReferralStatus"] || "Delivered";
            const status = toReferralStatus(rawStatus);
            const date: Date | null = c.fields["Date_Added"] ? new Date(c.fields["Date_Added"]) : null;

            for (const r of receivers) {
              if (!r || !business) continue;
              const key = `${r}||${business}`;
              const prev = unique.get(key);
              if (!prev || (date && prev.date && date.getTime() > prev.date.getTime()) || (!prev.date && date)) {
                unique.set(key, { receiver: r, business, status, date });
              }
              rawForBadges.push({ receiver: r, business, status, date });
            }
          }
        }

        setReferralCount(unique.size);
        setMyReferrals(rawForBadges);

        const ui: ReferralData[] = Array.from(unique.values())
          .sort((a, b) => (b.date?.getTime() ?? 0) - (a.date?.getTime() ?? 0))
          .map((item, i) => ({
            id: `${i + 1}`,
            referredPersonName: item.receiver,
            businessName: item.business,
            timeAgo: timeAgo(item.date),
            status: item.status,
            avatarUrl: makeAvatarUrl(item.receiver)
          }));
        setReferralsUI(ui);

      } catch (err) {
        setUser(null);
        setReviews([]);
        setReferralCount(0);
        setMyReferrals([]);
        setReferralsUI([]);
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

  /** ========= REVIEW CARD ========= */
  function ReviewCardLocal({ review }: { review: any }) {
    if (!review.businessName || !review.uplaud) return null;

    return (
      <div className="flex flex-col rounded-2xl px-5 sm:px-7 py-5 sm:py-6 shadow group transition hover:shadow-xl" style={{ alignItems: "flex-start", background: "#FFF7E6" }}>
        <div className="flex items-center w-full mb-2 gap-2">
          <Link to={`/business/${slugify(review.businessName)}`} className="font-bold text-base sm:text-lg text-black hover:underline hover:text-purple-700 flex-1 min-w-0 truncate" title={review.businessName}>
            {review.businessName}
          </Link>

          <div className="ml-auto flex items-center gap-2 shrink-0 whitespace-nowrap">
            {review.score ? (
              <span className="flex items-center shrink-0 whitespace-nowrap leading-none">
                {Array.from({ length: review.score }).map((_, i) => (
                  <span key={i} className="text-yellow-400 text-sm sm:text-lg leading-none">★</span>
                ))}
                <span className="ml-1 text-lg sm:text-2xl leading-none">
                  {emojiForScore(review.score)}
                </span>
              </span>
            ) : null}
            <span className="text-gray-500 text-xs sm:text-sm font-medium leading-none">{formatDate(review.date)}</span>
          </div>
        </div>

        <div className="mt-2 rounded-xl border px-4 sm:px-6 py-4 text-gray-900 shadow-sm text-base font-medium break-words" style={{ background: "#DCF8C6" }}>
          <span style={{ display: "block", wordBreak: "break-word" }}>{review.uplaud}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full font-sans text-gray-800 relative" style={{ background: "#6D46C6", fontFamily: `'Inter', 'Poppins', 'Segoe UI', Arial, sans-serif` }}>
      {/* Back Button */}
      <button
        onClick={() => navigate("/leaderboard")}
        className="fixed sm:absolute top-4 left-4 z-50 font-semibold rounded-md border border-purple-100 flex items-center gap-2 shadow hover:bg-purple-50 px-3 py-2 text-base transition"
        style={{ minWidth: 44, minHeight: 44, background: "rgba(255,255,255,0.88)", color: "#6D46C6", backdropFilter: "blur(6px)" }}
      >
        <ArrowLeft className="w-5 h-5" />
        <span className="hidden sm:inline">Back</span>
      </button>

      <div className="max-w-4xl mx-auto space-y-6 relative z-10 pt-16 sm:pt-0 px-2 sm:px-0">
        {/* Profile Card */}
        <div className="shadow-lg rounded-2xl p-5 sm:p-6 flex flex-col gap-5 border mt-6" style={{ background: "rgba(255,255,255,0.75)", backdropFilter: "blur(8px)", borderColor: "rgba(255,255,255,0.6)" }}>
          <div className="flex items-center gap-4">
            <div className="relative w-16 h-16 sm:w-20 sm:h-20 bg-purple-100 rounded-full flex items-center justify-center text-2xl sm:text-3xl font-extrabold text-purple-700 select-none">
              {user?.image ? (
                <img src={user.image} alt={user?.name || 'User'} className="w-full h-full object-cover rounded-full" />
              ) : (
                user?.name?.split(' ').map((n: string) => n[0]).join('')
              )}
            </div>

            {/* Name/handle + mobile share on the right (inline) */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <div className="flex min-w-0 items-center gap-2 flex-wrap">
                  <h2 className="font-extrabold text-xl sm:text-2xl truncate">
                    {user?.name}
                  </h2>
                  {user?.handle && (
                    <span className="text-xs bg-purple-100 text-purple-600 rounded-full px-2 py-1 whitespace-nowrap">@{user.handle}</span>
                  )}
                </div>

                {/* Mobile share (inline, right side of username) */}
                <button
                  onClick={() => { if (!user) return; window.open(getWhatsAppShareLink(user), "_blank"); }}
                  className="sm:hidden shrink-0 inline-flex items-center justify-center rounded-lg border border-gray-200 bg-white/80 p-2 shadow"
                  aria-label="Share profile"
                  title="Share Profile"
                >
                  <Share2 className="w-5 h-5 text-gray-700" />
                </button>
              </div>

              <p className="text-sm flex flex-wrap items-center gap-2 text-gray-700 mt-1">
                <Calendar size={16} /> Joined {joinDate}
                {user?.location && (<><MapPin size={16} /> {user.location}</>)}
              </p>
              {user?.bio && <p className="text-sm mt-1 text-gray-700">{user.bio}</p>}
            </div>

            {/* Desktop share (far right) */}
            <button
              onClick={() => { if (!user) return; window.open(getWhatsAppShareLink(user), "_blank"); }}
              className="hidden sm:flex items-center justify-center border border-gray-200 text-gray-700 px-3 py-2 rounded-lg shadow"
              title="Share Profile"
              style={{ background: "rgba(255,255,255,0.8)", backdropFilter: "blur(6px)" }}
            >
              <Share2 className="w-5 h-5" />
            </button>
          </div>

          {/* colored stat pills */}
          <ColoredStatsTabs totalReviews={totalReviews} points={points} referralCount={referralCount} />
        </div>

        {/* Achievements */}
        <Card className="w-full backdrop-blur-md" style={{ background: "rgba(255,255,255,0.16)", border: "1px solid rgba(255,255,255,0.35)", boxShadow: "0 12px 30px rgba(0,0,0,0.08)" }}>
          <div className="flex items-center gap-3 px-3 pt-3">
            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-purple-600">
              <Trophy className="w-4 h-4 text-white" />
            </div>
            <h3 className="text-lg font-semibold text-white">Achievements</h3>
          </div>

          <div className="px-3 pb-3">
            {earnedAchievements.length === 0 ? (
              <div className="text-center text-white/90 py-6 text-sm">No badges yet — start reviewing to earn your first badge!</div>
            ) : (
              <TooltipProvider>
                <div className="gap-3 grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(84px, 1fr))" }}>
                  {earnedAchievements.map((a) => (
                    <Tooltip key={a.id}>
                      <TooltipTrigger asChild>
                        <div className="cursor-pointer text-center">
                          <img src={a.image} alt={a.name} className="w-full h-auto object-contain" style={{ aspectRatio: "1 / 1" }} />
                          <p className="mt-1 text-[11px] font-semibold text-white leading-tight">{a.name}</p>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent side="bottom" className="max-w-xs border" style={{ background: "#fff", color: "#23223b", borderColor: "#b39ddb", fontSize: 13 }}>
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
        </Card>

        {/* Tabs */}
        <div className="rounded-2xl shadow p-4 border" style={{ background: "rgba(255,255,255,0.80)", borderColor: "rgba(255,255,255,0.7)", backdropFilter: "blur(8px)" }}>
          <div className="flex gap-6 border-b mb-6 text-base font-semibold">
            <button className={`pb-2 ${activeTab === 'Reviews' ? 'border-b-2 border-purple-600 text-purple-700' : 'text-gray-600 hover:text-purple-700'}`} onClick={() => setActiveTab('Reviews')}>Reviews</button>
            <button className={`pb-2 ${activeTab === 'Analytics' ? 'border-b-2 border-purple-600 text-purple-700' : 'text-gray-600 hover:text-purple-700'}`} onClick={() => setActiveTab('Analytics')}>Activity</button>
          </div>

          {activeTab === "Reviews" && (
            <div>
              {loading ? (
                <div className="text-center text-gray-400 py-8">Loading reviews…</div>
              ) : reviews.length === 0 ? (
                <div className="text-center text-gray-500 py-8">No reviews found for this user.</div>
              ) : (
                <div>
                  <div className="space-y-7">
                    {(showAllReviews ? reviews : reviews.slice(0, 5)).map((review, idx) => (
                      <ReviewCardLocal key={idx} review={review} />
                    ))}
                  </div>
                  {reviews.length > 5 && (
                    <div className="flex justify-center mt-6">
                      <button className="px-5 py-2 rounded-lg bg-purple-100 text-purple-700 font-bold hover:bg-purple-200 shadow transition" onClick={() => setShowAllReviews(prev => !prev)}>
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

              {/* ===== Summary stats BEFORE referrals ===== */}
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="rounded-xl p-3 bg-white/70 border shadow-sm flex items-center gap-3">
                  <Star className="w-5 h-5 text-amber-500" />
                  <div>
                    <div className="text-xs text-gray-500">Reviews Given</div>
                    <div className="text-lg font-bold text-gray-900">{totalReviews}</div>
                  </div>
                </div>
                <div className="rounded-xl p-3 bg-white/70 border shadow-sm flex items-center gap-3">
                  <BarChart2 className="w-5 h-5 text-cyan-600" />
                  <div>
                    <div className="text-xs text-gray-500">Average Score</div>
                    <div className="text-lg font-bold text-gray-900">{averageScore} / 5</div>
                  </div>
                </div>
              </div>

              {/* ===== Recent Referrals (status/time hidden) ===== */}
              <h3 className="text-base font-semibold text-gray-800 mb-3">Recent Referrals</h3>
              <div className="space-y-3 mb-8">
                {referralsUI.length === 0 ? (
                  <div className="text-gray-400">You haven’t referred anyone yet.</div>
                ) : (
                  referralsUI.map((r) => <ReferralCard key={r.id} referral={r} />)
                )}
              </div>

              {/* ===== Badge Goals after referrals ===== */}
              <div className="mb-2">
                <div className="font-semibold text-gray-700 mb-2">Badge Goals</div>
                {lockedAchievements.length === 0 ? (
                  <div className="text-gray-500 text-sm">You’ve unlocked all available badges. 🙌</div>
                ) : (
                  <TooltipProvider>
                    <div className="grid grid-cols-2 xs:grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
                      {lockedAchievements.map((a) => (
                        <Tooltip key={a.id} >
                          <TooltipTrigger asChild>
                            <div className="group cursor-pointer">
                              <div className="relative rounded-xl overflow-hidden" style={{ width: 84, height: 84, margin: "0 auto" }}>
                                <img src={a.image} alt={a.name} className="w-full h-full object-contain opacity-70 group-hover:opacity-100 transition" />
                                <div className="absolute inset-0 flex items-center justify-center">
                                  <Lock className="w-5 h-5 text-white/90 drop-shadow" />
                                </div>
                              </div>
                              <div className="mt-1 text-center">
                                <p className="text-[11px] font-semibold text-gray-800 leading-tight truncate">{a.name}</p>
                                {a.progress && (
                                  <div className="mt-1">
                                    <div className="w-full bg-muted rounded-full h-1">
                                      <div className="bg-purple-600 h-1 rounded-full transition-all duration-300" style={{ width: `${(a.progress.current / a.progress.total) * 100}%` }} />
                                    </div>
                                    <p className="text-[10px] text-muted-foreground mt-1">
                                      {a.progress.current}/{a.progress.total}
                                    </p>
                                  </div>
                                )}
                              </div>
                            </div>
                          </TooltipTrigger>
                          <TooltipContent side="bottom" className="max-w-xs border" style={{ background: "#fff", color: "#23223b", borderColor: "#b39ddb", fontSize: 13 }}>
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

        @media (max-width: 400px) {
          .xs\\:grid-cols-3 { grid-template-columns: repeat(3, minmax(0, 1fr)); }
        }

        /* Referral card look */
        .bg-gradient-card { background: linear-gradient(180deg, #ffffff, #faf7ff); }
        .shadow-card { box-shadow: 0 6px 20px rgba(0,0,0,0.06); }
        .shadow-soft { box-shadow: 0 10px 28px rgba(0,0,0,0.10); }
      `}</style>
    </div>
  );
};

export default ProfilePage;
