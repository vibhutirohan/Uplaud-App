import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Star, ClipboardList, Zap, Calendar, MapPin, ArrowLeft, Share2, BarChart2, User, MessageCircle
} from "lucide-react";
import axios from "axios";

// Airtable Config
const API_KEY = 'patZS8GyNhkwoP4wY.2beddc214f4dd2a5e4c220ae654f62652a5e02a47bae2287c54fced7bb97c07e';
const BASE_ID = 'appFUJWWTaoJ3YiWt';
const USERS_TABLE = 'tblWIFgwTz3Gn3idV';
const REVIEWS_TABLE = 'tblef0n1hQXiKPHxI';
const CIRCLES_TABLE = 'tbldL8H5T4qYKUzLV';

// Helper functions
function slugify(name = "") {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
}
function formatDate(date) {
  if (!date) return "";
  return date.toLocaleDateString(undefined, {
    month: "long", day: "2-digit", year: "numeric"
  });
}
function emojiForScore(score) {
  if (!score) return "🤍";
  if (score >= 5) return "🔥";
  if (score === 4) return "😍";
  if (score === 3) return "🙂";
  if (score === 2) return "😐";
  return "😶";
}
function getReviewWhatsAppShareLinkUplaud(review, userName) {
  const text = `Show me ${userName}'s review for ${review.businessName}`;
  return `https://wa.me/?text=${encodeURIComponent(text)}`;
}
function getWhatsAppShareLink(user) {
  let phone = user?.autogenInvite || "";
  const urlMatch = phone.match(/(?:wa\.me\/|\/)(\d{10,15})/);
  if (urlMatch && urlMatch[1]) phone = urlMatch[1];
  phone = phone.replace(/[^0-9]/g, "");
  const msg = `Add me to ${user?.name || "your"}'s circle`;
  return `https://wa.me/${phone}?text=${encodeURIComponent(msg)}`;
}

// StatBox
const StatBox = ({ icon, label, value, color }) => {
  const bg = {
    yellow: 'bg-yellow-100 text-yellow-600',
    purple: 'bg-purple-100 text-purple-600',
    pink: 'bg-pink-100 text-pink-600',
  }[color];
  return (
    <div className="rounded-2xl shadow p-4 text-center border min-w-[120px]" style={{background: "#FFF7E6"}}>
      <div className={`w-10 h-10 mx-auto flex items-center justify-center rounded-full ${bg}`}>
        {icon}
      </div>
      <div className="text-xl font-bold mt-2 text-gray-800">{value}</div>
      <p className="text-sm text-gray-500">{label}</p>
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
  const [referrers, setReferrers] = useState([]);
  const [showAllReviews, setShowAllReviews] = useState(false);

  useEffect(() => {
    const fetchUserAndReviews = async () => {
      setLoading(true);
      try {
        // --- Fetch User ---
        let foundUser = null;
        let userOffset = undefined;
        do {
          const userResp = await axios.get(
            `https://api.airtable.com/v0/${BASE_ID}/${USERS_TABLE}`,
            {
              headers: { Authorization: `Bearer ${API_KEY}` },
              params: { pageSize: 100, offset: userOffset },
            }
          );
          for (const rec of userResp.data.records) {
            const name = rec.fields.Name || "";
            if (slugify(name) === id) {
              foundUser = {
                id: rec.fields.ID?.toString(),
                airtableId: rec.id,
                name: name,
                phone: rec.fields["Phone"] || "",
                image: Array.isArray(rec.fields.image) ? rec.fields.image[0]?.url : rec.fields.image,
                createdDate: rec.fields["Created Date"] ?? "",
                autogenInvite: rec.fields["Autogen Invite"] ?? "",
                bio: rec.fields["Bio"] ?? "",
                location: rec.fields["Location"] ?? "",
                handle: rec.fields["Handle"] ?? slugify(name),
                xpScore: rec.fields["XP Score"] ?? 0,
              };
              break;
            }
          }
          userOffset = userResp.data.offset;
        } while (!foundUser && userOffset);
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

          // Fallback by Name if no reviews
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

          const formattedReviews = allReviews
            .map((r) => ({
              businessName: r.fields.business_name || "",
              uplaud: r.fields.Uplaud || "",
              date: r.fields.Date_Added ? new Date(r.fields.Date_Added) : null,
              score: typeof r.fields["Uplaud Score"] === "number" ? r.fields["Uplaud Score"] : null,
              shareLink: r.fields["Share Link"] || "",
              location: r.fields.City || "",
              category: r.fields.Category || "Other"
            }))
            .sort((a, b) => {
              if (!a.date) return 1;
              if (!b.date) return -1;
              return b.date.getTime() - a.date.getTime();
            });
          setReviews(formattedReviews);
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

        // --- Referrers ---
        if (foundUser && foundUser.name) {
          let circles = [];
          let offset = undefined;
          let referArr = [];
          do {
            const params = { pageSize: 100, offset, filterByFormula: `FIND("${foundUser.name}", {Receiver})` };
            const circleResp = await axios.get(
              `https://api.airtable.com/v0/${BASE_ID}/${CIRCLES_TABLE}`,
              { headers: { Authorization: `Bearer ${API_KEY}` }, params }
            );
            circles = circles.concat(circleResp.data.records);
            offset = circleResp.data.offset;
          } while (offset);

          for (const circle of circles) {
            const initiator = circle.fields["Initiator"];
            const business = circle.fields["Business_Name"] || "";
            if (initiator && initiator !== foundUser.name) {
              referArr.push({ initiator, business });
            }
          }
          setReferrers(referArr);
        } else {
          setReferrers([]);
        }

      } catch (err) {
        setUser(null);
        setReviews([]);
        setReferralCount(0);
        setReferrers([]);
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchUserAndReviews();
  }, [id]);

  // Stats
  const points = reviews.length * 10 + referralCount * 20;
  const totalReviews = reviews.length;
  const averageScore = reviews.length
    ? (reviews.reduce((sum, r) => sum + (r.score || 0), 0) / reviews.length).toFixed(2)
    : "-";
  const categoryCounts = reviews.reduce((cat, r) => {
    cat[r.category] = (cat[r.category] || 0) + 1;
    return cat;
  }, {});
  const joinDate = user?.createdDate
    ? new Date(user.createdDate).toLocaleDateString(undefined, { year: "numeric", month: "long" })
    : "";

  // Review Card - ALL BEIGE, with green inside for review text
  function ReviewCard({ review }) {
    return (
      <div
        className="flex flex-col rounded-2xl px-4 sm:px-7 py-4 sm:py-6 shadow group transition hover:shadow-xl"
        style={{ alignItems: "flex-start", background: "#FFF7E6" }}
      >
        <div className="flex flex-row items-center w-full">
          <div className="flex-shrink-0 flex flex-col items-center mr-4 sm:mr-5 mb-2 sm:mb-0">
            <div className="bg-green-100 rounded-full p-3 sm:p-4">
              <MessageCircle className="text-green-600 w-5 h-5 sm:w-6 sm:h-6" />
            </div>
          </div>
          {/* Business Name, Stars, Emoji, (Mobile Share), Date, (Desktop Share) */}
          <div className="flex-1 w-full">
            <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-2">
              {/* Business Name */}
              <span
                className="font-bold text-1xl sm:text-2xl text-black cursor-pointer business-hover-underline"
                onClick={() => navigate(`/business/${slugify(review.businessName)}`)}
                tabIndex={0}
                style={{
                  lineHeight: 1.15,
                  marginRight: "0.4rem"
                }}
              >
                {review.businessName || "Business"}
              </span>
              {/* Stars and emoji */}
              <span className="flex items-center ml-2">
                {Array.from({ length: review.score }).map((_, i) => (
                  <span key={i} className="text-yellow-400 text-base sm:text-lg leading-none">★</span>
                ))}
                {review.score ? (
                  <span className="ml-1 text-xl sm:text-2xl">{emojiForScore(review.score)}</span>
                ) : null}
              </span>
              {/* Mobile Share Button */}
              <span className="sm:hidden ml-2">
                <button
                  onClick={() => window.open(getReviewWhatsAppShareLinkUplaud(review, user?.name || "User"), "_blank")}
                  className="bg-green-100 hover:bg-green-200 p-2 rounded-full shadow-md transition"
                  title="Share this review on WhatsApp"
                >
                  <Share2 className="text-green-600 w-5 h-5" />
                </button>
              </span>
              {/* Spacer */}
              <span className="flex-1" />
              {/* Date */}
              <span className="text-gray-500 text-sm sm:text-base font-medium">
                {formatDate(review.date)}
              </span>
              {/* Desktop Share Button */}
              <span className="hidden sm:inline-block ml-2">
                <button
                  onClick={() => window.open(getReviewWhatsAppShareLinkUplaud(review, user?.name || "User"), "_blank")}
                  className="bg-green-100 hover:bg-green-200 p-2 rounded-full shadow-md transition"
                  title="Share this review on WhatsApp"
                >
                  <Share2 className="text-green-600 w-5 h-5" />
                </button>
              </span>
            </div>
            {/* Review Text */}
            <div className="mt-2 rounded-xl border px-3 sm:px-6 py-3 sm:py-4 text-gray-900 shadow-sm text-sm sm:text-base font-medium break-words" style={{ background: "#DCF8C6" }}>
              {review.uplaud}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full font-sans text-gray-800 relative" style={{ background: "#6D46C6" }}>
      {/* Back Button */}
      <button
        onClick={() => navigate("/leaderboard")}
        className="
          fixed sm:absolute top-4 left-4 z-50
          font-semibold rounded-md 
          border border-purple-100 flex items-center gap-2
          shadow hover:bg-purple-50
          px-3 py-2 text-base sm:px-3 sm:py-2 sm:text-sm
          transition
        "
        style={{ minWidth: 44, minHeight: 44, lineHeight: "24px", paddingTop: 7, paddingBottom: 7, background: "#FFF7E6", color: "#6D46C6" }}
      >
        <ArrowLeft className="w-5 h-5" />
        <span className="hidden sm:inline">Back to Leaderboard</span>
      </button>
      <div className="max-w-5xl mx-auto space-y-8 relative z-10 pt-16 sm:pt-0 px-3 sm:px-0">
        {/* Profile Card */}
        <div className="shadow-lg rounded-2xl p-6 flex flex-col sm:flex-row items-center gap-6 border mt-6" style={{background: "#FFF7E6"}}>
          <div className="relative w-20 h-20 bg-purple-100 rounded-full flex items-center justify-center text-2xl font-bold text-purple-700 select-none">
            {user?.image ? (
              <img src={user.image} alt={user.name} className="w-full h-full object-cover rounded-full" />
            ) : (
              user?.name?.split(' ').map(n => n[0]).join('')
            )}
          </div>
          <div className="flex-1 min-w-0 text-center sm:text-left">
            {/* Responsive username size */}
            <h2 className="text-lg sm:text-2xl font-bold flex flex-wrap items-center justify-center sm:justify-start gap-2">
              {user?.name}
              <span className="text-xs bg-purple-100 text-purple-600 rounded-full px-2 py-1 whitespace-nowrap">@{user?.handle}</span>
            </h2>
            <p className="text-sm flex flex-wrap items-center justify-center sm:justify-start gap-2 text-gray-600 mt-1">
              <Calendar size={16} /> Joined {joinDate}
              {user?.location && (<><MapPin size={16} /> {user.location}</>)}
            </p>
            {user?.bio && (
              <p className="text-sm mt-2 text-gray-600">{user.bio}</p>
            )}
          </div>
          <div className="flex flex-row sm:flex-col gap-2 mt-3 sm:mt-0 justify-center sm:justify-start">
            <button
              onClick={() => {
                if (!user) return;
                window.open(getWhatsAppShareLink(user), "_blank");
              }}
              className="flex items-center justify-center border border-gray-200 text-gray-700 bg-[#FFF7E6] hover:bg-gray-50 px-3 py-2 rounded-lg shadow"
              title="Share Profile"
            >
              <Share2 className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatBox icon={<Star />} label="Reviews" value={totalReviews} color="yellow" />
          <StatBox icon={<Zap />} label="Karma Points" value={points} color="purple" />
          <StatBox icon={<ClipboardList />} label="Referrals" value={referralCount} color="pink" />
        </div>

        {/* Tabs: Reviews | Analytics */}
        <div className="rounded-2xl shadow p-4 border" style={{background: "#FFF7E6"}}>
          <div className="flex gap-6 border-b mb-6 text-base font-semibold">
            <button
              className={`pb-2 ${activeTab === 'Reviews' ? 'border-b-2 border-purple-600 text-purple-600' : 'text-gray-500 hover:text-purple-600'}`}
              onClick={() => setActiveTab('Reviews')}
            >
              Reviews
            </button>
            <button
              className={`pb-2 ${activeTab === 'Analytics' ? 'border-b-2 border-purple-600 text-purple-600' : 'text-gray-500 hover:text-purple-600'}`}
              onClick={() => setActiveTab('Analytics')}
            >
              Activity
            </button>
          </div>

          {/* --- REVIEWS TAB --- */}
          {activeTab === "Reviews" && (
            <div>
              {loading ? (
                <div className="text-center text-gray-400 py-8">Loading reviews…</div>
              ) : reviews.length === 0 ? (
                <div className="text-center text-gray-400 py-8">No reviews found for this user.</div>
              ) : (
                <div>
                  <div className="space-y-7">
                    {(showAllReviews ? reviews : reviews.slice(0, 5)).map((review, idx) => (
                      <ReviewCard key={idx} review={review} />
                    ))}
                  </div>
                  {/* Load More/Less Button */}
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

          {/* --- ANALYTICS TAB --- */}
          {activeTab === "Analytics" && (
            <div>
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
                <div className="font-semibold text-gray-700 mb-1">Reviews by Category:</div>
                {Object.keys(categoryCounts).length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(categoryCounts).map(([cat, count]) => (
                      <div key={cat} className="bg-purple-100 text-purple-700 px-3 py-1 rounded-full text-sm font-bold">
                        {cat}: {count}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-gray-400">No categories found.</div>
                )}
              </div>
              {/* --- Who referred this user --- */}
              <div className="mb-6">
                <div className="font-semibold text-gray-700 mb-1">Your Referrals</div>
                {referrers.length === 0 ? (
                  <div className="text-gray-400">No referrals found for this user.</div>
                ) : (
                  <div className="space-y-2">
                    {referrers.map((r, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <User className="w-4 h-4 text-purple-500" />
                        <span
                          className="font-semibold text-xl text-purple-700 cursor-pointer business-hover-underline"
                          onClick={() => navigate(`/profile/${slugify(r.initiator)}`)}
                          tabIndex={0}
                        >
                          {r.initiator}
                        </span>
                        {r.business && (
                          <span className="text-xs text-gray-500">(for {r.business})</span>
                        )}
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
        body { background: #6D46C6 !important; }
        .group:hover { transition: box-shadow 0.22s cubic-bezier(.4,0,.2,1); }
        .business-hover-underline {
          transition: color 0.2s;
          position: relative;
        }
        .business-hover-underline:hover,
        .business-hover-underline:focus {
          color: #6D46C6 !important;
        }
        .business-hover-underline::after {
          content: "";
          position: absolute;
          left: 0;
          right: 0;
          bottom: -2px;
          height: 2px;
          background: #6D46C6;
          border-radius: 1px;
          opacity: 0;
          transform: scaleX(0.7);
          transition: opacity 0.18s, transform 0.2s;
        }
        .business-hover-underline:hover::after,
        .business-hover-underline:focus::after {
          opacity: 1;
          transform: scaleX(1);
        }
        @media (max-width: 640px) {
          .review-text-wrapper {
            font-size: 1rem !important;
            padding: 0.8rem 1rem !important;
          }
        }
      `}</style>
    </div>
  );
};

export default ProfilePage;
