import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Users, UserPlus, MessageSquare, Share2, Calendar, MapPin, ArrowLeft, BarChart2, Star, Award
} from "lucide-react";
import axios from "axios";

// Airtable Config
const API_KEY = 'patZS8GyNhkwoP4wY.2beddc214f4dd2a5e4c220ae654f62652a5e02a47bae2287c54fced7bb97c07e';
const BASE_ID = 'appFUJWWTaoJ3YiWt';
const USERS_TABLE = 'tblWIFgwTz3Gn3idV';
const REVIEWS_TABLE = 'tblef0n1hQXiKPHxI';
const CIRCLES_TABLE = 'tbldL8H5T4qYKUzLV';

const TABS = [
  { label: "Reviews", key: "reviews" },
  { label: "Activites", key: "analytics" }
];

function slugify(name) {
  return (name || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '');
}

// --- UPDATED timeAgo returns both label and exact date
function timeAgo(date) {
  if (!date) return { label: "", exact: "" };
  const now = new Date();
  const diff = (now - date) / 1000; // seconds
  let label = "";
  let exact = date.toLocaleDateString(undefined, {
    day: "2-digit",
    month: "long",
    year: "numeric"
  });

  if (diff < 60 * 60) {
    const minutes = Math.floor(diff / 60);
    label = minutes === 1 ? "1 minute ago" : `${minutes} minutes ago`;
  } else if (diff < 60 * 60 * 24) {
    const hours = Math.floor(diff / (60 * 60));
    label = hours === 1 ? "1 hour ago" : `${hours} hours ago`;
  } else if (diff < 60 * 60 * 24 * 7) {
    const days = Math.floor(diff / (60 * 60 * 24));
    label = days === 1 ? "1 day ago" : `${days} days ago`;
  } else if (diff < 60 * 60 * 24 * 30) {
    const weeks = Math.floor(diff / (60 * 60 * 24 * 7));
    label = weeks === 1 ? "1 week ago" : `${weeks} weeks ago`;
  } else {
    label = exact;
  }
  return { label, exact };
}

function renderStars(score) {
  return (
    <span>
      {score &&
        Array.from({ length: score }, (_, i) => (
          <span key={i} className="text-yellow-500 text-lg">★</span>
        ))}
    </span>
  );
}
function getWhatsAppShareLink(user) {
  let phone = user?.autogenInvite || "";
  const urlMatch = phone.match(/(?:wa\.me\/|\/)(\d{10,15})/);
  if (urlMatch && urlMatch[1]) phone = urlMatch[1];
  phone = phone.replace(/[^0-9]/g, "");
  const msg = `Add me to ${user?.name || "your"}'s circle`;
  return `https://wa.me/${phone}?text=${encodeURIComponent(msg)}`;
}

const ProfilePage = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [tab, setTab] = useState("reviews");
  const [user, setUser] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [referralCount, setReferralCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [visibleReviews, setVisibleReviews] = useState(3);

  const followersCount = 0;
  const followingCount = 0;

  const isOwnProfile = (() => {
    try {
      const userObj = JSON.parse(localStorage.getItem("uplaud_user"));
      return userObj && userObj.id && user?.id && userObj.id === user.id;
    } catch {
      return false;
    }
  })();

  useEffect(() => {
    const fetchUserAndReviews = async () => {
      setLoading(true);
      try {
        // 1. Find user by slug
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

        // 2. Fetch reviews for this user by ID
        let allReviews = [];
        if (foundUser && foundUser.id) {
          let offset = undefined;
          do {
            const params = { pageSize: 100, offset, filterByFormula: `{ID (from Creator)}="${foundUser.id}"` };
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

        // 3. Referrals
        let uniqueReferralPairs = new Set();
        if (foundUser && foundUser.name) {
          let circles = [];
          let offset = undefined;
          do {
            const params = { pageSize: 100, offset, filterByFormula: `{Initiator}="${foundUser.name}"` };
            const circleResp = await axios.get(
              `https://api.airtable.com/v0/${BASE_ID}/${CIRCLES_TABLE}`,
              {
                headers: { Authorization: `Bearer ${API_KEY}` },
                params,
              }
            );
            circles = circles.concat(circleResp.data.records);
            offset = circleResp.data.offset;
          } while (offset);

          circles.forEach(circle => {
            let receiver = circle.fields["Receiver"];
            let biz = circle.fields["Business_Name"];
            if (Array.isArray(receiver)) {
              receiver.forEach(r => {
                if (r && biz) uniqueReferralPairs.add(`${r}||${biz}`);
              });
            } else if (receiver && biz) {
              uniqueReferralPairs.add(`${receiver}||${biz}`);
            }
          });
          setReferralCount(uniqueReferralPairs.size);
        } else {
          setReferralCount(0);
        }

      } catch (err) {
        setUser(null);
        setReviews([]);
        setReferralCount(0);
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchUserAndReviews();
  }, [id]);

  const handleFollow = () => {
    navigate("/login", { state: { fromProfile: window.location.pathname, action: "follow" } });
  };

  const handleProfileShare = () => {
    if (!user) return;
    const link = getWhatsAppShareLink(user);
    window.open(link, "_blank");
  };
  const handleReviewShare = (review) => {
    if (!review?.shareLink) return;
    window.open(review.shareLink, "_blank");
  };

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

  const reviewLabel = reviews.length === 1 ? "Review" : "Reviews";
  const referralLabel = referralCount === 1 ? "Referral" : "Referrals";

  return (
    <div className="min-h-screen bg-[#f7f9fb] pb-12">
      <div className="max-w-4xl mx-auto px-2 sm:px-6">
        {/* Back Button */}
        <button
          onClick={() => navigate("/leaderboard")}
          className="mt-8 mb-4 px-5 py-2 bg-white text-purple-700 font-bold rounded-lg hover:bg-purple-50 shadow border border-purple-100 flex items-center gap-2"
        >
          <ArrowLeft className="w-5 h-5" /> Back
        </button>
        {/* Profile Header Card */}
        <div className="bg-white rounded-2xl shadow-lg flex flex-col sm:flex-row items-center px-10 py-8 gap-7 mb-7 w-full">
          {/* Avatar */}
          <div className="relative flex-shrink-0">
            <div className="w-28 h-28 rounded-full border-2 border-[#d9d6f5] flex items-center justify-center bg-gradient-to-br from-[#f8f6fe] to-white text-4xl font-bold text-purple-700 select-none">
              {user?.image ? (
                <img src={user.image} alt={user.name} className="w-full h-full object-cover rounded-full" />
              ) : (
                <span>
                  {user?.name?.split(' ').map(n => n[0]).join('')}
                </span>
              )}
            </div>
          </div>
          {/* Main Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-3xl font-extrabold text-gray-900">{user?.name}</h1>
              <span className="inline-block ml-1 px-3 py-1 rounded-full bg-purple-100 text-purple-700 text-xs font-semibold">
                @{user?.handle}
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-2 text-gray-500 mt-1 mb-2 text-sm">
              <span className="flex items-center gap-1">
                <Calendar className="w-4 h-4" /> Joined {joinDate}
              </span>
              {user?.location && (
                <>
                  <span className="mx-1">&bull;</span>
                  <span className="flex items-center gap-1"><MapPin className="w-4 h-4" /> {user.location}</span>
                </>
              )}
            </div>
            {user?.bio && (
              <div className="text-gray-700 mt-1 text-base flex items-center gap-2">
                {user.bio}
              </div>
            )}
          </div>
          {/* Actions */}
          <div className="flex flex-col gap-2 sm:gap-2 sm:flex-row sm:items-center sm:ml-auto">
            {!isOwnProfile && (
              <button
                onClick={handleFollow}
                className="flex items-center gap-2 px-5 py-2 rounded-lg font-bold shadow bg-gradient-to-r from-purple-600 to-cyan-600 text-white hover:from-purple-700 hover:to-cyan-700"
              >
                <UserPlus className="w-4 h-4" />
                Follow
              </button>
            )}
            <button
              onClick={handleProfileShare}
              className="flex items-center justify-center border border-gray-200 text-gray-700 bg-white hover:bg-gray-50 px-3 py-2 rounded-lg shadow"
              title="Share"
            >
              <Share2 className="w-5 h-5" />
            </button>
          </div>
        </div>
        {/* Stats Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 mb-6 w-full">
          <div className="flex flex-col items-center rounded-xl shadow bg-[#457cf6]/10 py-5">
            <Users className="w-7 h-7 text-[#457cf6] mb-1" />
            <div className="text-2xl font-bold text-gray-900">{followersCount}</div>
            <div className="text-sm text-gray-600 font-semibold">Followers</div>
          </div>
          <div className="flex flex-col items-center rounded-xl shadow bg-[#22c55e]/10 py-5">
            <UserPlus className="w-7 h-7 text-[#22c55e] mb-1" />
            <div className="text-2xl font-bold text-gray-900">{followingCount}</div>
            <div className="text-sm text-gray-600 font-semibold">Following</div>
          </div>
          <div className="flex flex-col items-center rounded-xl shadow bg-[#fbbf24]/10 py-5">
            <MessageSquare className="w-7 h-7 text-[#fbbf24] mb-1" />
            <div className="text-2xl font-bold text-gray-900">{reviews.length}</div>
            <div className="text-sm text-gray-600 font-semibold">{reviewLabel}</div>
          </div>
          <div className="flex flex-col items-center rounded-xl shadow bg-[#a855f7]/10 py-5">
            <Star className="w-7 h-7 text-[#a855f7] mb-1" />
            <div className="text-2xl font-bold text-gray-900">{points}</div>
            <div className="text-sm text-gray-600 font-semibold">Score</div>
          </div>
          <div className="flex flex-col items-center rounded-xl shadow bg-[#f43f5e]/10 py-5">
            <Award className="w-7 h-7 text-[#f43f5e] mb-1" />
            <div className="text-2xl font-bold text-gray-900">{referralCount}</div>
            <div className="text-sm text-gray-600 font-semibold">{referralLabel}</div>
          </div>
        </div>
        {/* Tab Bar */}
        <div className="flex gap-2 mb-3 border-b border-gray-200 w-full">
          {TABS.map((t) => (
            <button
              key={t.key}
              className={`py-3 flex-1 font-bold border-b-2 transition text-base
                ${tab === t.key
                  ? "border-purple-600 text-purple-700 bg-purple-50"
                  : "border-transparent text-gray-600 bg-transparent"}`}
              style={{ borderRadius: '10px 10px 0 0' }}
              onClick={() => setTab(t.key)}
            >
              {t.label}
            </button>
          ))}
        </div>
        {/* Main Content */}
        <div className="bg-white rounded-2xl shadow-lg border p-7 min-h-[280px] mb-8 w-full">
          {tab === "reviews" && (
            <>
              <h2 className="font-bold text-xl mb-4 flex items-center gap-2 text-black">
                <MessageSquare className="w-5 h-5 text-cyan-600 " /> Recent Reviews
              </h2>
              {loading ? (
                <div className="text-center text-gray-400 py-8">Loading reviews…</div>
              ) : reviews.length === 0 ? (
                <div className="text-center text-gray-400 py-8">No reviews found for this user.</div>
              ) : (
                <div className="space-y-4">
                  {reviews.slice(0, visibleReviews).map((review, idx) => (
                    <div key={idx} className="flex flex-col sm:flex-row sm:items-center justify-between border rounded-xl px-5 py-4 bg-white shadow-sm hover:shadow-md transition-shadow duration-150">
                      <div>
                        <div
                          className="font-semibold text-purple-700 mb-1 cursor-pointer hover:underline"
                          onClick={() => navigate(`/business/${slugify(review.businessName)}`)}
                        >
                          {review.businessName}
                        </div>
                        <div className="flex items-center gap-2 text-xs text-gray-500 mb-1">
                          {review.location && <><MapPin className="w-3 h-3" />{review.location}<span>•</span></>}
                          <span>
                            {(() => {
                              const { label, exact } = timeAgo(review.date);
                              return (
                                <>
                                  {label}
                                  {label !== exact && (
                                    <span className="text-gray-400 ml-2">({exact})</span>
                                  )}
                                </>
                              );
                            })()}
                          </span>
                        </div>
                        <div className="text-gray-700">{review.uplaud}</div>
                      </div>
                      <div className="flex items-center gap-2 mt-3 sm:mt-0">
                        {renderStars(review.score)}
                        <button
                          onClick={() => handleReviewShare(review)}
                          className="flex items-center justify-center border border-gray-200 text-gray-700 bg-white hover:bg-gray-50 px-2 py-1 rounded-lg shadow"
                          title="Share this review"
                        >
                          <Share2 className="w-5 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                  {visibleReviews < reviews.length && (
                    <div className="text-center mt-6">
                      <button
                        onClick={() => setVisibleReviews(v => v + 3)}
                        className="px-4 py-2 rounded-md bg-white border border-purple-200 text-purple-700 font-semibold shadow hover:bg-purple-50"
                      >
                        Load More Reviews
                      </button>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
          {tab === "analytics" && (
            <>
              <h2 className="font-bold text-xl mb-4 flex items-center gap-2 text-black">
                <BarChart2 className="w-5 h-5 text-cyan-600" /> Activites
              </h2>
              <div className="mb-6">
                <div className="font-semibold text-gray-700">Total Reviews:</div>
                <div className="text-lg font-bold text-purple-600">{totalReviews}</div>
              </div>
              <div className="mb-6">
                <div className="font-semibold text-gray-700">Average Score:</div>
                <div className="text-lg font-bold text-cyan-600">{averageScore} / 5</div>
              </div>
              <div>
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
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
