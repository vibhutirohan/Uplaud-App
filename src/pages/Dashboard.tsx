import React, { useEffect, useState } from "react";
import {
  Star, ClipboardList, Zap, Calendar, MapPin, MessageCircle, Share2, ArrowLeft
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const AIRTABLE_API_KEY = "patZS8GyNhkwoP4wY.2beddc214f4dd2a5e4c220ae654f62652a5e02a47bae2287c54fced7bb97c07e";
const BASE_ID = "appFUJWWTaoJ3YiWt";
const TABLE = "tblef0n1hQXiKPHxI";

function slugify(name = "") {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
}
function emojiForScore(score) {
  if (!score) return "🤍";
  if (score >= 5) return "🔥";
  if (score === 4) return "😍";
  if (score === 3) return "🙂";
  if (score === 2) return "😐";
  return "😶";
}
function formatDate(dateStr) {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  return date.toLocaleDateString(undefined, {
    month: "long", day: "2-digit", year: "numeric"
  });
}
function getReviewWhatsAppShareLinkUplaud(review, userName) {
  const text = `Show me ${userName}'s review for ${review.businessName || review.business_name}`;
  return `https://wa.me/?text=${encodeURIComponent(text)}`;
}

function StatBox({ icon, label, value, color }) {
  const bg = {
    yellow: 'bg-yellow-100 text-yellow-600',
    purple: 'bg-purple-100 text-purple-600',
    pink: 'bg-pink-100 text-pink-600',
  }[color];
  return (
    <div className="rounded-2xl shadow p-4 text-center border min-w-[120px]" style={{ background: "#FFF7E6" }}>
      <div className={`w-10 h-10 mx-auto flex items-center justify-center rounded-full ${bg}`}>
        {icon}
      </div>
      <div className="text-xl font-bold mt-2 text-gray-800">{value || '0'}</div>
      <p className="text-sm text-gray-500">{label}</p>
    </div>
  );
}

// -- The responsive review card
function ReviewCard({ review, userName, navigate }) {
  const score = Number(review['Uplaud Score'] || review.score);
  return (
    <div
      className="rounded-2xl shadow group transition hover:shadow-xl px-4 sm:px-7 py-4 sm:py-6 mb-4"
      style={{ background: "#FFF7E6" }}
    >
      <div className="flex items-start gap-3 sm:gap-5">
        {/* Icon */}
        <div className="flex-shrink-0 flex flex-col items-center">
          <div className="bg-green-100 rounded-full p-3 sm:p-4">
            <MessageCircle className="text-green-600 w-5 h-5 sm:w-6 sm:h-6" />
          </div>
        </div>
        {/* Main Content */}
        <div className="flex-1 w-full min-w-0">
          {/* Top row: Business, stars, emoji, right-aligned date+share */}
          <div className="flex flex-col sm:flex-row sm:items-center w-full mb-2">
            <div className="flex flex-row flex-wrap items-center gap-2 sm:gap-3 min-w-0 flex-1">
              {/* Business Name */}
              <span
                className="font-bold text-1xl sm:text-2xl text-black cursor-pointer business-hover-underline"
                onClick={() => navigate(`/business/${slugify(review.business_name || review.businessName)}`)}
                tabIndex={0}
                style={{ lineHeight: 1.15, marginRight: "0.4rem" }}
              >
                {review.business_name || review.businessName || "Business"}
              </span>
              {/* Stars and emoji */}
              <span className="flex items-center ml-2">
                {Array.from({ length: score }).map((_, i) => (
                  <span key={i} className="text-yellow-400 text-base sm:text-lg leading-none">★</span>
                ))}
                {score ? (
                  <span className="ml-1 text-xl sm:text-2xl">{emojiForScore(score)}</span>
                ) : null}
              </span>
            </div>
            {/* Date + Share button, always right on desktop */}
            <div className="flex flex-row items-center gap-2 sm:ml-auto mt-2 sm:mt-0">
              <span className="text-gray-500 text-sm sm:text-base font-medium">
                {formatDate(review.Date_Added || review.date)}
              </span>
              <button
                onClick={() => window.open(getReviewWhatsAppShareLinkUplaud(review, userName), "_blank")}
                className="bg-green-100 hover:bg-green-200 p-2 rounded-full shadow-md transition ml-1"
                title="Share this review on WhatsApp"
              >
                <Share2 className="text-green-600 w-5 h-5" />
              </button>
            </div>
          </div>
          {/* Review Text */}
          <div className="mt-2 rounded-xl border px-3 sm:px-6 py-3 sm:py-4 text-gray-900 shadow-sm text-sm sm:text-base font-medium break-words" style={{ background: "#DCF8C6" }}>
            {review.Uplaud || review.uplaud}
          </div>
        </div>
      </div>
    </div>
  );
}

const Dashboard = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('Reviews');
  const [loading, setLoading] = useState(true);
  const [userDetails, setUserDetails] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [showAllReviews, setShowAllReviews] = useState(false);
  const [stats, setStats] = useState({ reviews: 0, xp: 0, referrals: 0 });
  const [categories, setCategories] = useState({});
  const [averageScore, setAverageScore] = useState(0);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const phone = sessionStorage.getItem("userPhone");
      if (!phone) {
        navigate("/login");
        return;
      }
      const filterFormula = `({ReviewerPhoneNumber} = '${phone}')`;
      const url = `https://api.airtable.com/v0/${BASE_ID}/${TABLE}?filterByFormula=${encodeURIComponent(filterFormula)}`;
      try {
        const { data } = await axios.get(url, {
          headers: { Authorization: `Bearer ${AIRTABLE_API_KEY}` }
        });
        const records = data.records.map(rec => rec.fields);

        setReviews(records);

        // Karma Points: 10 points per review
        const reviewCount = records.length;
        const karmaPoints = reviewCount * 10;

        // Average Score
        const validScores = records.map(r => Number(r['Uplaud Score']) || 0).filter(n => n > 0);
        const avg = validScores.length
          ? (validScores.reduce((a, b) => a + b, 0) / validScores.length)
          : 0;
        setAverageScore(avg);

        // Categories count
        const categoryMap = {};
        records.forEach(r => {
          const cat = r.Category || "Other";
          categoryMap[cat] = (categoryMap[cat] || 0) + 1;
        });
        setCategories(categoryMap);

        // Referrals (if any logic in your Airtable, you can update this)
        const totalReferrals = records.reduce((sum, r) => sum + (parseInt(r.Referrals) || 0), 0);

        // Name_Creator/Reviewer handling
        let nameCreatorRaw = records[0]?.Name_Creator;
        let nameCreator = "user";
        if (typeof nameCreatorRaw === 'string') {
          nameCreator = nameCreatorRaw;
        } else if (Array.isArray(nameCreatorRaw) && nameCreatorRaw.length > 0) {
          nameCreator = nameCreatorRaw[0];
        }
        if (!nameCreator || nameCreator === "user") {
          nameCreator = records[0]?.Reviewer || "Unknown User";
        }

        setStats({
          reviews: reviewCount,
          xp: karmaPoints,
          referrals: totalReferrals,
        });

        setUserDetails({
          name: nameCreator,
          handle: (nameCreator || "user").toString().toLowerCase().replace(/\s+/g, '-'),
          location: [records[0]?.City, records[0]?.State].filter(Boolean).join(', '),
          joinDate: records[0]?.Date_Added?.slice(0, 10) || "2025",
          bio: records[0]?.Internal || "",
          image: records[0]?.['Creator Image'] || null,
        });
      } catch (e) {
        console.error(e);
        setUserDetails(null);
      }
      setLoading(false);
    };
    fetchData();
  }, [navigate]);

  if (loading) return <div className="flex justify-center items-center h-80 text-lg">Loading...</div>;
  if (!userDetails) return <div className="text-center mt-12 text-xl text-gray-600">User not found. Please log in again.</div>;

  return (
    <div className="min-h-screen w-full font-sans text-gray-800 relative" style={{ background: "#6D46C6" }}>
      {/* Back Button */}
      <button
        onClick={() => window.location.href = "/"}
        className="
          fixed sm:absolute top-4 left-4 z-50
          font-semibold rounded-md 
          border border-purple-100 flex items-center gap-2
          shadow hover:bg-purple-50
          px-3 py-2 text-base sm:px-3 sm:py-2 sm:text-sm
          transition
        "
        style={{
          minWidth: 44, minHeight: 44, lineHeight: "24px", paddingTop: 7, paddingBottom: 7,
          background: "#FFF7E6", color: "#6D46C6"
        }}
      >
        <ArrowLeft className="w-5 h-5" />
        <span className="hidden sm:inline">Back</span>
      </button>
      <div className="max-w-5xl mx-auto space-y-8 relative z-10 pt-16 sm:pt-0 px-3 sm:px-0">
        {/* Profile Card */}
        <div className="shadow-lg rounded-2xl p-6 flex flex-col sm:flex-row items-center gap-6 border mt-6" style={{ background: "#FFF7E6" }}>
          <div className="relative w-20 h-20 bg-purple-100 rounded-full flex items-center justify-center text-2xl font-bold text-purple-700 select-none">
            {userDetails.image ? (
              <img src={userDetails.image} alt={userDetails.name} className="w-full h-full object-cover rounded-full" />
            ) : (
              userDetails.name.split(' ').map(n => n[0]).join('')
            )}
          </div>
          <div className="flex-1 min-w-0 text-center sm:text-left">
            <h2 className="text-lg sm:text-2xl font-bold flex flex-wrap items-center justify-center sm:justify-start gap-2">
              {userDetails.name}
              <span className="text-xs bg-purple-100 text-purple-600 rounded-full px-2 py-1 whitespace-nowrap">@{userDetails.handle}</span>
            </h2>
            <p className="text-sm flex flex-wrap items-center justify-center sm:justify-start gap-2 text-gray-600 mt-1">
              <Calendar size={16} /> Joined {userDetails.joinDate}
              {userDetails.location && (<><MapPin size={16} /> {userDetails.location}</>)}
            </p>
            {userDetails.bio && (
              <p className="text-sm mt-2 text-gray-600">{userDetails.bio}</p>
            )}
          </div>
          <div className="flex flex-row sm:flex-col gap-2 mt-3 sm:mt-0 justify-center sm:justify-start">
            <button
              onClick={() => {
                const url = `${window.location.origin}/profile/${slugify(userDetails.name)}`;
                const message = `Check out ${userDetails.name}'s Uplaud profile!\n${url}`;
                window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, "_blank");
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
          <StatBox icon={<Star />} label="Reviews" value={stats.reviews} color="yellow" />
          <StatBox icon={<Zap />} label="Karma Points" value={stats.xp} color="purple" />
          <StatBox icon={<ClipboardList />} label="Referrals" value={stats.referrals} color="pink" />
        </div>

        {/* Tabs */}
        <div className="rounded-2xl shadow p-4 border" style={{ background: "#FFF7E6" }}>
          <div className="flex gap-6 border-b mb-6 text-base font-semibold">
            <button
              className={`pb-2 ${activeTab === 'Reviews' ? 'border-b-2 border-purple-600 text-purple-600' : 'text-gray-500 hover:text-purple-600'}`}
              onClick={() => setActiveTab('Reviews')}
            >
              Reviews
            </button>
            <button
              className={`pb-2 ${activeTab === 'Activities' ? 'border-b-2 border-purple-600 text-purple-600' : 'text-gray-500 hover:text-purple-600'}`}
              onClick={() => setActiveTab('Activities')}
            >
              Activity
            </button>
          </div>

          {/* Reviews Tab */}
          {activeTab === 'Reviews' && (
            <div>
              {reviews.length === 0 ? (
                <div className="text-center text-gray-400 py-8">You haven’t posted any reviews yet.</div>
              ) : (
                <div>
                  <div className="space-y-3">
                    {(showAllReviews ? reviews : reviews.slice(0, 5)).map((r, i) => (
                      <ReviewCard key={i} review={r} userName={userDetails.name} navigate={navigate} />
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

          {/* Activities Tab */}
          {activeTab === 'Activities' && (
            <div className="text-gray-700 text-base px-2 py-2">
              <h4 className="text-lg font-semibold mb-2">Activities</h4>
              <div className="mb-2 flex flex-wrap items-center gap-8">
                <div>
                  <span className="text-gray-500">Total Reviews:</span>{' '}
                  <span className="font-bold text-purple-700">{stats.reviews}</span>
                </div>
                <div>
                  <span className="text-gray-500">Average Score:</span>{' '}
                  <span className="font-bold text-cyan-700">{averageScore.toFixed(2)} / 5</span>
                </div>
              </div>
              <div className="mb-2">
                <span className="text-gray-500">Reviews by Category:</span>{' '}
                {Object.keys(categories).length === 0 ? (
                  <span className="text-sm ml-2 px-2 py-1 bg-gray-100 rounded-full text-gray-500">No reviews</span>
                ) : (
                  Object.entries(categories).map(([cat, count]) => (
                    <span key={cat} className="text-xs ml-2 px-2 py-1 bg-purple-100 text-purple-700 rounded-full">
                      {cat}: {count}
                    </span>
                  ))
                )}
              </div>
              <div className="mt-4">
                <span className="text-gray-500">Who Referred This User:</span>
                <div className="text-gray-400 text-sm mt-1">No referrals found for this user.</div>
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

export default Dashboard;
