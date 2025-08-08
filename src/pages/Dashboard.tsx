import React, { useEffect, useState } from "react";
import {
  Star, ClipboardList, Zap, Calendar, MapPin, ArrowLeft, Share2, BarChart2
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

// Airtable Config
const API_KEY = 'patZS8GyNhkwoP4wY.2beddc214f4dd2a5e4c220ae654f62652a5e02a47bae2287c54fced7bb97c07e';
const BASE_ID = 'appFUJWWTaoJ3YiWt';
const REVIEWS_TABLE = 'tblef0n1hQXiKPHxI';

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
// ---- NEW! Avatar only shows first letter of first word ----
function getBusinessInitials(name = "") {
  if (!name) return "";
  let words = name.replace(/[^A-Za-z0-9 ]/g, "").split(" ").filter(Boolean);
  return words[0][0].toUpperCase();
}
function getWhatsAppShareLinkForReview(review, userName) {
  const text = `Show me ${userName}'s review for ${review.businessName || review.business_name}`;
  return `https://wa.me/?text=${encodeURIComponent(text)}`;
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

// ----------- Review Card -----------
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
        {/* Avatar: always ONE letter */}
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
          {/* Top Row: Business Name, Date */}
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
          {/* Review Text + Star Rating */}
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
          {/* Share Button */}
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

// ----------- Dashboard -----------
const Dashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('Reviews');
  const [user, setUser] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [showAllReviews, setShowAllReviews] = useState(false);

  // Stats
  const [referralCount] = useState(0); // Placeholder

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
        const records = data.records.map(rec => ({
          ...rec.fields,
          date: rec.fields.Date_Added
        }));
        setReviews(records);

        // Build user object
        let name = records[0]?.Name_Creator || records[0]?.Reviewer || "User";
        if (Array.isArray(name)) name = name[0];
        const handle = slugify(name);
        setUser({
          name: name,
          handle: handle,
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
    ? (reviews.reduce((sum, r) => sum + (Number(r['Uplaud Score'] || r.score || 0)), 0) / reviews.length).toFixed(2)
    : "-";

  // Category breakdown for analytics
  const categories = {};
  reviews.forEach(r => {
    const cat = r.Category || "Other";
    categories[cat] = (categories[cat] || 0) + 1;
  });

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
                    if (!user) return;
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
          {/* --- REVIEWS TAB --- */}
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
                  {/* Load More/Less Button */}
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
          {/* --- ANALYTICS TAB --- */}
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
                <div className="font-semibold text-gray-700 mb-1">Reviews by Category:</div>
                <div className="flex flex-wrap gap-2">
                  {Object.keys(categories).length === 0 ? (
                    <span className="text-xs ml-2 px-2 py-1 bg-gray-100 rounded-full text-gray-500">No reviews</span>
                  ) : (
                    Object.entries(categories).map(([cat, count]) => (
                      <span key={cat} className="text-xs px-2 py-1 bg-purple-100 text-purple-700 rounded-full">
                        {cat}: {count}
                      </span>
                    ))
                  )}
                </div>
              </div>
              <div className="mb-6">
                <div className="font-semibold text-gray-700 mb-1">Your Referrals</div>
                <div className="text-gray-400">No referral data tracked in dashboard.</div>
              </div>
            </div>
          )}
        </div>
      </div>
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
