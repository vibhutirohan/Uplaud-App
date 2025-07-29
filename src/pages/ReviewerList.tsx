import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const PRIMARY = "#6D46C6";
const MINT = "#5EEAD4";
const CARD_BG_TOP1 = "#FEFBEA";
const CARD_BG_TOP2 = "#F3F8FE";
const CARD_BG_TOP3 = "#FFF6F2";
const CARD_BG_NORMAL = "#FFFFFF";

const API_KEY = 'patZS8GyNhkwoP4wY.2beddc214f4dd2a5e4c220ae654f62652a5e02a47bae2287c54fced7bb97c07e';
const BASE_ID = 'appFUJWWTaoJ3YiWt';
const REVIEWS_TABLE = 'tblef0n1hQXiKPHxI';
const CIRCLES_TABLE = 'tbldL8H5T4qYKUzLV';

const COMPANY_USERS = [
  "Deepthi Rao", "Rohan Vibhuti ", "Shreya Shinde", "Gargi", "Pranali", "Vansh Desai", "Hitanshi"
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
const rankBadges = [
  <span key="1" className="inline-flex items-center mr-2 text-2xl">🥇</span>,
  <span key="2" className="inline-flex items-center mr-2 text-2xl">🥈</span>,
  <span key="3" className="inline-flex items-center mr-2 text-2xl">🥉</span>
];

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

      setTopUsers(sorted.slice(0, 5));
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

  const periodTabs = [
    { key: "weekly", label: "This Week" },
    { key: "monthly", label: "Monthly" },
    { key: "all-time", label: "All Time" },
  ];

  // ----- Improved alignment for desktop view -----
  const renderUserRows = (users) => {
    if (loading) {
      return <div className="text-center text-gray-400">Loading...</div>;
    }
    if (!users || users.length === 0) {
      return <div className="text-center text-gray-400">No reviewers found.</div>;
    }
    return users.map((user, idx) => (
      <div
        key={user.creatorId}
        onClick={() => navigate(`/profile/${slugify(user.creatorName)}`)}
        className={`
          flex items-center justify-between px-4 sm:px-10 py-4 sm:py-6 mb-4
          rounded-2xl shadow-lg border border-gray-100 transition-transform hover:-translate-y-1 group glass-bg
        `}
        style={{
          minHeight: 68,
          background:
            idx === 0 ? CARD_BG_TOP1
              : idx === 1 ? CARD_BG_TOP2
              : idx === 2 ? CARD_BG_TOP3
              : CARD_BG_NORMAL,
          border: idx === 0 ? `2.5px solid ${MINT}` : "1.5px solid #F1ECFF",
          cursor: "pointer",
          maxWidth: "100%",
        }}
      >
        {/* User area */}
        <div className="flex items-center gap-3 min-w-[150px]">
          <span className="text-2xl" style={{ filter: idx <= 2 ? "drop-shadow(0 2px 3px #eee)" : undefined }}>
            {rankBadges[idx] || <span className="text-xl font-bold text-purple-200">{`#${idx + 1}`}</span>}
          </span>
          <span className="font-bold text-base sm:text-lg text-gray-900 group-hover:text-purple-700 transition">
            {user.creatorName}
          </span>
        </div>
        {/* Points area */}
        <div className="flex items-center min-w-[90px] justify-end">
          <span className="font-bold text-[18px] sm:text-[22px] text-[#6D46C6]">{user.points} pts</span>
        </div>
      </div>
    ));
  };

  return (
    <div className="min-h-screen w-full relative flex flex-col items-center justify-center bg-white">
      <div className="relative z-10 py-8 sm:py-10 w-full max-w-6xl mx-auto px-2 sm:px-0">
        <button
          onClick={() => navigate("/")}
          className="mb-6 sm:mb-8 px-3 sm:px-5 py-2 bg-white/90 text-[#6D46C6] font-bold rounded-lg hover:bg-[#5EEAD4]/30 shadow border border-[#5EEAD4] flex items-center gap-2 transition backdrop-blur text-sm sm:text-base"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke={PRIMARY} strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          Back
        </button>

        {/* --- Top Reviewers Section --- */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between px-1 sm:px-2 mb-6 sm:mb-8">
          <h2 className="text-2xl sm:text-4xl font-extrabold text-[#6D46C6] tracking-tight mb-4 md:mb-0"
            style={{ textShadow: "0 1px 12px #e8e0ff50" }}>
            <span role="img" aria-label="trophy">🏆</span> Top Reviewers{" "}
            <span className="font-light text-[#5EEAD4]">
              {period === "weekly" ? "This Week" : period === "monthly" ? "Monthly" : "All Time"}
            </span>
          </h2>
          <div className="flex gap-2">
            {periodTabs.map((tab) => (
              <button
                key={tab.key}
                className={`px-3 sm:px-4 py-1 rounded-full font-semibold transition ${
                  period === tab.key
                    ? "bg-[#5EEAD4] text-[#6D46C6] border-2 border-[#6D46C6] scale-105"
                    : "text-gray-600 border-2 border-[#5EEAD4]"
                }`}
                onClick={() => handlePeriodChange(tab.key)}
                style={{
                  fontWeight: period === tab.key ? 700 : 500,
                  fontFamily: "Poppins, sans-serif"
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Glassmorphic Card Container */}
        <div className="w-full glass-bg p-5 sm:p-10 rounded-3xl shadow-2xl mb-8 sm:mb-12"
          style={{ maxWidth: 1100, margin: "0 auto", background: "rgba(255,255,255,0.85)", backdropFilter: "blur(10px)" }}>
          {renderUserRows(topUsers)}
        </div>
      </div>

      {/* CTA: Full screen, purple background */}
      <div
        className="w-full flex flex-col items-center justify-center"
        style={{
          minHeight: "44vh",
          width: "100vw",
          background: PRIMARY,
          color: "#CBC3E3",
          marginTop: 36,
          padding: "42px 0 42px 0"
        }}
      >
        <h3 className="text-xl sm:text-3xl font-extrabold flex items-center justify-center gap-2 mb-4 text-white" style={{ letterSpacing: ".5px" }}>
          🚀 Want to start reviewing too?
        </h3>
        <p className="text-base sm:text-lg mb-5 sm:mb-6 text-white/90 text-center max-w-xs sm:max-w-2xl font-medium">
          Join our community of reviewers and share your experiences with others.<br />
          It's as easy as sending a WhatsApp message!
        </p>
        <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 flex-wrap justify-center mb-3 w-full px-4">
          <a
            href="https://api.whatsapp.com/message/XVZR77KDFQMHI1"
            target="_blank"
            rel="noopener noreferrer"
            className="bg-[#5EEAD4] hover:bg-[#b2ffe0] text-[#6D46C6] px-8 py-3 rounded-full text-lg font-bold transition shadow text-center"
            style={{ minWidth: 170 }}
          >
            🚀 Try Uplaud
          </a>
          <button
            onClick={() => navigate('/login')}
            className="px-8 py-3 border-2 border-white text-white rounded-full text-lg font-bold hover:bg-[#5EEAD4]/20 transition text-center"
            style={{ minWidth: 170 }}
          >
            Login
          </button>
        </div>
        <p className="text-white/60 text-sm mt-2 text-center w-full px-3">
          No app download required — start reviewing in seconds.
        </p>
      </div>

      <style>{`
        .glass-bg {
          background: rgba(255,255,255,0.7);
          backdrop-filter: blur(13px) saturate(1.13);
        }
      `}</style>
    </div>
  );
};

export default Leaderboard;
