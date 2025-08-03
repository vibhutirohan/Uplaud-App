import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { Crown, Medal, Award, MessageCircle, ArrowLeft } from "lucide-react";

const PRIMARY = "#6D46C6";
const MINT = "#5EEAD4";
const API_KEY = 'patZS8GyNhkwoP4wY.2beddc214f4dd2a5e4c220ae654f62652a5e02a47bae2287c54fced7bb97c07e';
const BASE_ID = 'appFUJWWTaoJ3YiWt';
const REVIEWS_TABLE = 'tblef0n1hQXiKPHxI';
const CIRCLES_TABLE = 'tbldL8H5T4qYKUzLV';

const COMPANY_USERS = [
  "Deepthi Rao", "Rohan", "Rohan Vibhuti ", "Shreya Shinde", "Gargi", "Pranali", "Vansh Desai", "Hitanshi"
];

function isValidName(name = "") {
  return /^[a-zA-Z][a-zA-Z\s\-'.]{1,49}$/.test(name.trim());
}
function slugify(name = "") {
  return name
    .normalize("NFKD")
    .replace(/[\u0300-\u036F]/g, "")
    .replace(/[\s]+/g, "-")
    .replace(/[\/\\#\?\%\$\&\*\:\;\"\'\<\>\{\}\[\]\|]/g, "")
    .replace(/^-+|-+$/g, "")
    .toLowerCase();
}
function getPeriodFilter(period) {
  const now = new Date();
  if (period === "weekly") {
    const start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 6);
    return `IS_AFTER({Date_Added}, '${start.toISOString().slice(0, 10)}')`;
  } else if (period === "monthly") {
    const start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 29);
    return `IS_AFTER({Date_Added}, '${start.toISOString().slice(0, 10)}')`;
  } else {
    return '';
  }
}

const fetchFilteredAirtableReviews = async (period) => {
  let allRecords = [];
  let offset = undefined;
  const filterByFormula = getPeriodFilter(period);
  try {
    do {
      const params = { pageSize: 100 };
      if (offset) params.offset = offset;
      if (filterByFormula) params.filterByFormula = filterByFormula;
      params.fields = [
        "ID (from Creator)", "Name_Creator", "Date_Added"
      ];
      const resp = await axios.get(
        `https://api.airtable.com/v0/${BASE_ID}/${REVIEWS_TABLE}`,
        { headers: { Authorization: `Bearer ${API_KEY}` }, params }
      );
      allRecords = allRecords.concat(resp.data.records);
      offset = resp.data.offset;
    } while (offset);
    return allRecords;
  } catch (e) {
    return [];
  }
};

const fetchAllAirtableCircles = async () => {
  let allRecords = [];
  let offset = undefined;
  try {
    do {
      const params = { pageSize: 100 };
      if (offset) params.offset = offset;
      const resp = await axios.get(
        `https://api.airtable.com/v0/${BASE_ID}/${CIRCLES_TABLE}`,
        { headers: { Authorization: `Bearer ${API_KEY}` }, params }
      );
      allRecords = allRecords.concat(resp.data.records);
      offset = resp.data.offset;
    } while (offset);
    return allRecords;
  } catch (e) {
    return [];
  }
};

const periodTabs = [
  { key: "weekly", label: "This Week" },
  { key: "monthly", label: "Monthly" },
  { key: "all-time", label: "All Time" },
];

const getRankIcon = (rank) => {
  switch (rank) {
    case 1: return <Crown className="w-7 h-7 text-yellow-500 drop-shadow" />;
    case 2: return <Medal className="w-7 h-7 text-gray-400 drop-shadow" />;
    case 3: return <Award className="w-7 h-7 text-orange-500 drop-shadow" />;
    default:
      return (
        <span className="w-7 h-7 flex items-center justify-center text-muted-foreground font-bold">{rank}</span>
      );
  }
};

const Leaderboard = () => {
  const [topUsers, setTopUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const defaultPeriod = () => localStorage.getItem("leaderboardPeriod") || "weekly";
  const [period, setPeriod] = useState(defaultPeriod());
  const navigate = useNavigate();
  const intervalRef = useRef(null);

  useEffect(() => {
    fetchData();
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = setInterval(() => {
      fetchData();
    }, 60000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
    // eslint-disable-next-line
  }, [period]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [reviews, circles] = await Promise.all([
        fetchFilteredAirtableReviews(period),
        fetchAllAirtableCircles()
      ]);

      const userMap = {};
      const reviewedUserIds = new Set();

      reviews.forEach((r) => {
        const idArr = r.fields["ID (from Creator)"];
        const nameArr = r.fields["Name_Creator"];
        const dateStr = r.fields["Date_Added"];
        const id = Array.isArray(idArr) ? idArr[0] : idArr;
        const name = Array.isArray(nameArr) ? nameArr[0] : nameArr;
        const reviewDate = dateStr ? new Date(dateStr) : null;

        if (
          typeof id === "number" &&
          typeof name === "string" &&
          reviewDate &&
          !COMPANY_USERS.map(u => u.toLowerCase()).includes(name.toLowerCase()) &&
          isValidName(name)
        ) {
          reviewedUserIds.add(id);
          if (!userMap[id]) {
            userMap[id] = {
              creatorId: id,
              creatorName: name,
              reviewCount: 1,
              referralCount: 0,
              points: 0,
              latestDate: reviewDate,
            };
          } else {
            userMap[id].reviewCount += 1;
            if (reviewDate > userMap[id].latestDate) {
              userMap[id].latestDate = reviewDate;
            }
          }
        }
      });

      circles.forEach((rec) => {
        const initiator = rec.fields["Initiator"];
        const receiver = rec.fields["Receiver"];
        if (
          typeof initiator === "number" &&
          typeof receiver === "number" &&
          reviewedUserIds.has(receiver)
        ) {
          if (!userMap[initiator]) {
            userMap[initiator] = {
              creatorId: initiator,
              creatorName: `User ${initiator}`,
              reviewCount: 0,
              referralCount: 1,
              points: 0,
              latestDate: new Date("2024-01-01T00:00:00"),
            };
          } else {
            userMap[initiator].referralCount += 1;
          }
        }
      });

      Object.values(userMap).forEach(user => {
        user.points = (user.reviewCount * 10) + (user.referralCount * 20);
      });

      const sorted = Object.values(userMap).sort((a, b) => {
        if (b.points !== a.points) return b.points - a.points;
        if (b.reviewCount !== a.reviewCount) return b.reviewCount - a.reviewCount;
        return b.latestDate.getTime() - a.latestDate.getTime();
      });

      setTopUsers(sorted.slice(0, 5)); // show only top 5
    } catch (err) {
      setTopUsers([]);
    } finally {
      setLoading(false);
    }
  };

  const handlePeriodChange = (key) => {
    setPeriod(key);
    localStorage.setItem("leaderboardPeriod", key);
  };

  // --- UI RENDER ---
  return (
    <div className="min-h-screen w-full bg-[#6D46C6] relative">
      {/* Back Button */}
      <button
        onClick={() => navigate('/')}
        className="absolute top-4 left-2 sm:top-7 sm:left-7 z-20 flex items-center gap-1 px-2 py-2 bg-white/80 hover:bg-[#eee] rounded-full shadow-sm border border-[#ececec] backdrop-blur-md transition-all duration-200"
        style={{
          fontWeight: 600,
          fontSize: 18,
          color: PRIMARY,
          cursor: "pointer"
        }}
        aria-label="Back"
      >
        <ArrowLeft className="w-6 h-6" />
        <span className="hidden sm:inline">Back</span>
      </button>

      {/* Hero header */}
      <div className="relative overflow-hidden pb-4">
        <div className="absolute inset-0 bg-[#6D46C6] opacity-100" />
        <div className="relative px-4 sm:px-6 py-10 sm:py-16 text-center">
          <div className="max-w-2xl sm:max-w-4xl mx-auto">
            <h1 className="text-3xl sm:text-5xl md:text-6xl font-bold text-white mb-4 sm:mb-6 drop-shadow-xl">
              🏆 Top Reviewers
            </h1>
            <p className="text-base sm:text-xl text-[#ece5f4] mb-6 sm:mb-8 max-w-2xl mx-auto font-medium">
              Celebrating our amazing community members who help businesses grow through authentic reviews.
            </p>
            <div className="flex justify-center gap-2 mb-7 sm:mb-8 flex-wrap">
              {periodTabs.map((tab) => (
                <button
                  key={tab.key}
                  className={`px-5 sm:px-7 py-2 rounded-full text-base sm:text-lg font-bold shadow-md border-2 transition-all duration-200
                    ${period === tab.key
                      ? "bg-[#5EEAD4] text-[#6D46C6] border-[#6D46C6] scale-105"
                      : "text-white/80 border-[#5EEAD4] bg-[#6D46C6]"
                    }`}
                  onClick={() => handlePeriodChange(tab.key)}
                  style={{ minWidth: 90 }}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Leaderboard Cards */}
      <div className="px-1 sm:px-4 pb-10 sm:pb-16" style={{ marginTop: "-50px" }}>
        <div className="max-w-lg sm:max-w-3xl mx-auto space-y-2 sm:space-y-5">
          {loading ? (
            <div className="flex justify-center items-center py-10 sm:py-16">
              <div className="animate-spin rounded-full border-t-4 border-[#fff] border-opacity-50 h-12 w-12 sm:h-14 sm:w-14"></div>
            </div>
          ) : topUsers.length === 0 ? (
            <div className="text-center text-white/60 py-8 sm:py-10">No reviewers found.</div>
          ) : (
            topUsers.map((entry, idx) => (
              <div
                key={entry.creatorId}
                onClick={() => navigate(`/profile/${slugify(entry.creatorName)}`)}
                className={`
                  flex items-center px-3 sm:px-7 py-3 sm:py-6 rounded-2xl border transition-all duration-300 cursor-pointer group
                  bg-white border border-gray-100 leaderboard-card
                `}
                style={{
                  minHeight: 48,
                  position: "relative",
                  zIndex: 2,
                  boxShadow: "0 2px 8px #49208810"
                }}
              >
                {/* Rank Icon */}
                <div className="flex-shrink-0 w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center mr-2 sm:mr-4">
                  {getRankIcon(idx + 1)}
                </div>
                {/* Name and reviews */}
                <div className="flex-1 min-w-0">
                  <div className="flex flex-row items-center justify-between">
                    <h3 className="text-base sm:text-lg md:text-xl font-semibold text-[#261c4d] group-hover:text-[#6D46C6] transition truncate max-w-[120px] sm:max-w-full">
                      {entry.creatorName}
                    </h3>
                    {/* Points (mobile only, right aligned) */}
                    <span className="block sm:hidden text-xl font-bold text-[#6D46C6]">{entry.points} <span className="text-xs text-[#9377d1] font-semibold">pts</span></span>
                  </div>
                  <div className="flex flex-row flex-wrap gap-x-2 gap-y-1 text-[14px] sm:text-[15px] text-[#737373] mt-1 font-medium">
                    <div className="flex items-center gap-1">
                      <MessageCircle className="w-4 h-4" />
                      <span>
                        {entry.reviewCount} {entry.reviewCount === 1 ? "review" : "reviews"}
                      </span>
                    </div>
                  </div>
                </div>
                {/* Points (desktop/tablet) */}
                <div className="hidden sm:flex flex-col items-end pr-2">
                  <span className="text-2xl md:text-3xl font-bold text-[#6D46C6] leading-5">{entry.points}</span>
                  <span className="text-sm text-[#9377d1] font-semibold" style={{marginTop: "-1px"}}>points</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* CTA Section */}
      <div
        className="w-full flex flex-col items-center justify-center"
        style={{
          minHeight: "30vh",
          width: "100vw",
          background: MINT,
          color: "#24292F",
          marginTop: 24,
          padding: "22px 0 30px 0"
        }}
      >
        <h3 className="text-lg sm:text-2xl font-extrabold flex items-center justify-center gap-2 mb-2 sm:mb-3 text-[#24292F]" style={{ letterSpacing: ".5px" }}>
          🚀 Want to start reviewing too?
        </h3>
        <p className="text-sm sm:text-base mb-4 sm:mb-5 text-[#274046] text-center max-w-xs sm:max-w-2xl font-medium">
          Join our community of reviewers and share your experiences with others.<br />
          It's as easy as sending a WhatsApp message!
        </p>
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-6 flex-wrap justify-center mb-3 w-full px-4">
          <a
            href="https://api.whatsapp.com/message/XVZR77KDFQMHI1"
            target="_blank"
            rel="noopener noreferrer"
            className="bg-[#6D46C6] hover:bg-[#5931a8] text-[#fff] px-7 py-3 rounded-full text-base sm:text-lg font-bold transition shadow text-center"
            style={{ minWidth: 140 }}
          >
            🚀 Try Uplaud
          </a>
          <button
            onClick={() => navigate('/login')}
            className="px-7 py-3 border-2 border-[#6D46C6] text-[#6D46C6] rounded-full text-base sm:text-lg font-bold hover:bg-[#fff]/20 transition text-center"
            style={{ minWidth: 140 }}
          >
            Login
          </button>
        </div>
        <p className="text-[#222f3e] text-xs sm:text-sm mt-2 text-center w-full px-3 opacity-70">
          No app download required — start reviewing in seconds.
        </p>
      </div>

      {/* Card pop/glow animation on hover */}
      <style>{`
        .leaderboard-card {
          transition: box-shadow 0.24s cubic-bezier(.4,0,.2,1), transform 0.22s cubic-bezier(.4,0,.2,1);
        }
        .leaderboard-card:hover {
          box-shadow: 0 4px 32px 6px #6D46C6, 0 0 2px #fff;
          transform: scale(1.045);
          z-index: 10;
        }
      `}</style>
    </div>
  );
};

export default Leaderboard;
