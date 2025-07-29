import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Star, ClipboardList, Zap, Calendar, MapPin, ArrowLeft, Share2, BarChart2, MessageSquare, User
} from "lucide-react";
import axios from "axios";

// Airtable Config
const API_KEY = 'patZS8GyNhkwoP4wY.2beddc214f4dd2a5e4c220ae654f62652a5e02a47bae2287c54fced7bb97c07e';
const BASE_ID = 'appFUJWWTaoJ3YiWt';
const USERS_TABLE = 'tblWIFgwTz3Gn3idV';
const REVIEWS_TABLE = 'tblef0n1hQXiKPHxI';
const CIRCLES_TABLE = 'tbldL8H5T4qYKUzLV';

function slugify(name = "") {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
}

function timeAgo(date) {
  if (!date) return { label: "", exact: "" };
  const now = new Date();
  const diff = (now - date) / 1000;
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

// StatBox UI as in dashboard
const StatBox = ({ icon, label, value, color }) => {
  const bg = {
    yellow: 'bg-yellow-100 text-yellow-600',
    purple: 'bg-purple-100 text-purple-600',
    pink: 'bg-pink-100 text-pink-600',
  }[color];
  return (
    <div className="bg-white rounded-2xl shadow p-4 text-center">
      <div className={`w-10 h-10 mx-auto flex items-center justify-center rounded-full ${bg}`}>{icon}</div>
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

        // 2. Fetch reviews for this user by ID *and* fallback by name if no reviews
        let allReviews = [];
        if (foundUser) {
          let offset = undefined;
          // Try by user ID
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

          // If no reviews by ID, try by Name (for legacy or data mismatch)
          if (allReviews.length === 0) {
            let nameOffset = undefined;
            do {
              const nameParams = { pageSize: 100, offset: nameOffset, filterByFormula: `{Name_Creator}="${foundUser.name}"` };
              const nameRevResp = await axios.get(
                `https://api.airtable.com/v0/${BASE_ID}/${REVIEWS_TABLE}`,
                {
                  headers: { Authorization: `Bearer ${API_KEY}` },
                  params: nameParams,
                }
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

        // 3. Referrals - (as before, for count)
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

        // 4. Referrers - who referred this user?
        if (foundUser && foundUser.name) {
          let circles = [];
          let offset = undefined;
          let referArr = [];
          do {
            const params = { pageSize: 100, offset, filterByFormula: `FIND("${foundUser.name}", {Receiver})` };
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

  // Scores and stats
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

  // UI Colors
  const bgColor = 'bg-[#f9f6ff]';
  const textColor = 'text-gray-800';
  const cardColor = 'bg-white';

  // Review card component (slightly larger font)
  function ReviewCard({ review }) {
    return (
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border rounded-xl px-5 py-4 bg-white shadow-sm hover:shadow-md transition-shadow duration-150">
        <div>
          <div
            className="font-semibold text-purple-700 mb-1 cursor-pointer hover:underline text-lg sm:text-base"
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
          <div className="text-gray-700 text-base sm:text-sm">{review.uplaud}</div>
        </div>
        <div className="flex items-center gap-2 mt-3 sm:mt-0">
          {renderStars(review.score)}
          <button
            onClick={() => {
              if (!review?.shareLink) return;
              window.open(review.shareLink, "_blank");
            }}
            className="flex items-center justify-center border border-gray-200 text-gray-700 bg-white hover:bg-gray-50 px-2 py-1 rounded-lg shadow"
            title="Share this review"
          >
            <Share2 className="w-5 h-4" />
          </button>
        </div>
      </div>
    );
  }

  // -- ProfilePage Render --
  return (
    <div className={`min-h-screen ${bgColor} px-6 py-10 font-sans ${textColor} relative`}>
      {/* Responsive Back Button */}
      <button
        onClick={() => navigate("/leaderboard")}
        className="
          absolute top-6 left-6 bg-white text-purple-700 font-semibold rounded-md 
          border border-purple-100 flex items-center gap-2
          shadow hover:bg-purple-50
          px-2 py-1 text-xs
          sm:px-3 sm:py-1.5 sm:text-sm
          transition
        "
        style={{ zIndex: 2 }}
      >
        <ArrowLeft className="w-4 h-4" /> Back to Leaderboard
      </button>
      <div className="max-w-5xl mx-auto space-y-8">
        {/* Profile Card */}
        <div className={`${cardColor} shadow-lg rounded-2xl p-6 flex items-center gap-6`}>
          <div className="relative w-20 h-20 bg-purple-100 rounded-full flex items-center justify-center text-2xl font-bold text-purple-700 select-none">
            {user?.image ? (
              <img src={user.image} alt={user.name} className="w-full h-full object-cover rounded-full" />
            ) : (
              user?.name?.split(' ').map(n => n[0]).join('')
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-xl font-bold flex items-center gap-2">
              {user?.name}
              <span className="text-xs bg-purple-100 text-purple-600 rounded-full px-2 py-1">@{user?.handle}</span>
            </h2>
            <p className="text-sm flex items-center gap-2 text-gray-600">
              <Calendar size={16} /> Joined {joinDate}
              {user?.location && (<><MapPin size={16} /> {user.location}</>)}
            </p>
            {user?.bio && (
              <p className="text-sm mt-2 text-gray-600">{user.bio}</p>
            )}
          </div>
          <div className="flex flex-col gap-2">
            <button
              onClick={() => {
                if (!user) return;
                window.open(getWhatsAppShareLink(user), "_blank");
              }}
              className="flex items-center justify-center border border-gray-200 text-gray-700 bg-white hover:bg-gray-50 px-3 py-2 rounded-lg shadow"
              title="Share Profile"
            >
              <Share2 className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <StatBox icon={<Star />} label="Reviews" value={totalReviews} color="yellow" />
          <StatBox icon={<Zap />} label="XP Score" value={points} color="purple" />
          <StatBox icon={<ClipboardList />} label="Referrals" value={referralCount} color="pink" />
        </div>

        {/* Tabs: Reviews | Analytics */}
        <div className={`${cardColor} rounded-2xl shadow p-4`}>
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
              Activities
            </button>
          </div>

          {/* --- REVIEWS TAB --- */}
          {activeTab === "Reviews" && (
            <div>
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2"><MessageSquare className="w-5 h-5 text-cyan-600"/> Recent Reviews</h3>
              {loading ? (
                <div className="text-center text-gray-400 py-8">Loading reviews…</div>
              ) : reviews.length === 0 ? (
                <div className="text-center text-gray-400 py-8">No reviews found for this user.</div>
              ) : (
                <div>
                  <div className="space-y-4">
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
                <div className="font-semibold text-gray-700 mb-1">Who Referred This User:</div>
                {referrers.length === 0 ? (
                  <div className="text-gray-400">No referrals found for this user.</div>
                ) : (
                  <div className="space-y-2">
                    {referrers.map((r, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <User className="w-4 h-4 text-purple-500" />
                        <span
                          className="font-semibold text-purple-700 cursor-pointer hover:underline"
                          onClick={() => navigate(`/profile/${slugify(r.initiator)}`)}
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
    </div>
  );
};

export default ProfilePage;
