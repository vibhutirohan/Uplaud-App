import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const MINT = "#5EEAD4";
const API_KEY = 'patZS8GyNhkwoP4wY.2beddc214f4dd2a5e4c220ae654f62652a5e02a47bae2287c54fced7bb97c07e';
const BASE_ID = 'appFUJWWTaoJ3YiWt';
const REVIEWS_TABLE = 'tblef0n1hQXiKPHxI';

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

const MARQUEE_DURATION = 275;

function MarqueeRow({ children, reverse = false }) {
  const [paused, setPaused] = useState(false);
  return (
    <div
      className="relative w-full flex justify-center overflow-hidden"
      style={{
        minHeight: 190,
        marginBottom: 12,
        maxWidth: "100vw"
      }}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div
        className="flex items-center gap-7"
        style={{
          width: "max-content",
          animation: `marquee-${reverse ? "rev" : "fwd"} ${MARQUEE_DURATION}s linear infinite`,
          animationPlayState: paused ? "paused" : "running"
        }}
      >
        {children}
        {children}
      </div>
    </div>
  );
}

function ReviewCard({ review, navigate }) {
  if (!review) return null;
  const nameArr = review.fields["Name_Creator"];
  const userName = Array.isArray(nameArr) ? nameArr[0] : nameArr;
  const business = review.fields["business_name"] || review.fields["Business"] || "";
  const text = review.fields["Uplaud"] || review.fields["Review"] || "";
  const avatar =
    review.fields["Creator Image"] && Array.isArray(review.fields["Creator Image"])
      ? review.fields["Creator Image"][0]?.url
      : review.fields["Creator Image"]?.url || "";

  const bizImageArr = review.fields["Biz Image"] || review.fields["business_image"];
  const bizImage =
    Array.isArray(bizImageArr) && bizImageArr.length > 0
      ? bizImageArr[0]?.url
      : typeof bizImageArr === "object" && bizImageArr?.url
      ? bizImageArr.url
      : "";

  const showAvatar = !!avatar && avatar.trim() !== "";
  const showBizImage = !!bizImage && bizImage.trim() !== "";

  return (
    <figure
      className="relative h-full w-72 sm:w-80 overflow-hidden rounded-2xl border-2 p-6 shadow-lg bg-white hover:shadow-2xl hover:scale-[1.03] transition-all flex flex-col"
      style={{
        minWidth: 240,
        maxWidth: 340,
        margin: "0 10px",
        border: `2px solid ${MINT}`,
        background: "#fff"
      }}
    >
      {showBizImage && (
        <div
          className="w-full mb-3 flex justify-center"
          style={{
            minHeight: 80,
            maxHeight: 100,
            overflow: "hidden",
            borderRadius: "12px"
          }}
          onClick={() => navigate(`/business/${slugify(business)}`)}
        >
          <img
            src={bizImage}
            alt={business}
            className="object-cover rounded-xl border"
            style={{ width: "100%", maxHeight: 95, cursor: "pointer" }}
            loading="lazy"
          />
        </div>
      )}
      <figcaption
        className="font-extrabold text-base text-[#6D46C6] flex items-center cursor-pointer"
        style={{
          marginBottom: "4px"
        }}
        onClick={() => navigate(`/business/${slugify(business)}`)}
      >
        {business}
      </figcaption>
      <blockquote className="mt-1 text-[15px] text-gray-800 font-medium leading-tight min-h-[36px]">
        {text.length > 130 ? (
          <>
            {text.slice(0, 130)}...
            <span className="font-semibold text-xs text-[#6D46C6]"> more</span>
          </>
        ) : (
          text
        )}
      </blockquote>
      <div className="absolute left-6 bottom-5 flex items-center gap-2">
        {showAvatar && (
          <img
            className="rounded-full shadow"
            src={avatar}
            alt={userName}
            width={32}
            height={32}
            style={{ objectFit: "cover", minWidth: 32, minHeight: 32, cursor: "pointer" }}
            onClick={() => navigate(`/profile/${slugify(userName)}`)}
          />
        )}
        <span
          className="text-xs font-bold text-[#1b9061] cursor-pointer hover:underline"
          onClick={() => navigate(`/profile/${slugify(userName)}`)}
        >
          {userName}
        </span>
      </div>
      {/* Like (Heart) button bottom right */}
      <button
        className="absolute bottom-4 right-4 bg-white rounded-full p-2 border border-gray-200 shadow flex items-center justify-center transition hover:scale-110 active:scale-95"
        style={{
          zIndex: 10
        }}
        onClick={e => {
          e.stopPropagation();
          navigate('/login');
        }}
        tabIndex={0}
        aria-label="Like this review (requires login)"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-pink-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M5.68 12.17l6.37 6.36a1 1 0 001.42 0l6.37-6.36A4.51 4.51 0 0012 7.5a4.51 4.51 0 00-6.32 4.67z"
          />
        </svg>
      </button>
    </figure>
  );
}

const UpcomingFeatures = () => {
  const navigate = useNavigate();
  const [spotlightReviews, setSpotlightReviews] = useState([]);

  useEffect(() => {
    const fetchSpotlightReviews = async () => {
      let allRecords = [];
      let offset = undefined;
      try {
        do {
          const params = { pageSize: 100 };
          if (offset) params.offset = offset;
          const resp = await axios.get(
            `https://api.airtable.com/v0/${BASE_ID}/${REVIEWS_TABLE}`,
            { headers: { Authorization: `Bearer ${API_KEY}` }, params }
          );
          allRecords = allRecords.concat(resp.data.records);
          offset = resp.data.offset;
        } while (offset);
      } catch (e) { /* fail gracefully */ }

      const now = new Date();
      let filtered = allRecords.filter(r => {
        const nameArr = r.fields["Name_Creator"];
        const name = Array.isArray(nameArr) ? nameArr[0] : nameArr;
        const business = r.fields["business_name"] || r.fields["Business"] || "";
        const text = r.fields["Uplaud"] || r.fields["Review"] || "";
        const dateStr = r.fields["Date_Added"];
        const date = dateStr ? new Date(dateStr) : null;
        return (
          name &&
          business &&
          date &&
          date >= new Date("2025-01-01T00:00:00") &&
          date <= now &&
          !COMPANY_USERS.map(u => u.toLowerCase()).includes((name || "").toLowerCase()) &&
          isValidName(name) &&
          text.length > 4
        );
      });

      const businessLatest = {};
      filtered.forEach(r => {
        const business = r.fields["business_name"] || r.fields["Business"] || "";
        const bizSlug = slugify(business);
        if (!bizSlug) return;
        const prev = businessLatest[bizSlug];
        const date = r.fields["Date_Added"] ? new Date(r.fields["Date_Added"]) : null;
        if (!prev || (date && new Date(prev.fields["Date_Added"]) < date)) {
          businessLatest[bizSlug] = r;
        }
      });

      let spotlightArr = Object.values(businessLatest);
      for (let i = spotlightArr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [spotlightArr[i], spotlightArr[j]] = [spotlightArr[j], spotlightArr[i]];
      }

      setSpotlightReviews(spotlightArr);
    };
    fetchSpotlightReviews();
  }, []);

  const row1 = spotlightReviews.filter((_, i) => i % 2 === 0);
  const row2 = spotlightReviews.filter((_, i) => i % 2 === 1);

  return (
    <section
      className="relative flex flex-col items-center justify-center w-full"
      style={{
        background: "#fff",
        width: "100vw",
        minHeight: "48vh",
        margin: 0,
        padding: "0px 0px 22px 0px"
      }}
    >
      <div
        className="w-full max-w-[1600px] flex flex-col items-center"
        style={{ padding: "0", marginTop: 0 }}
      >
        <h2 className="font-extrabold text-3xl sm:text-4xl mb-6 text-center tracking-tight"
            style={{
              color: "#6D46C6",
              letterSpacing: "1px",
              textShadow: "0 2px 12px #eee"
            }}>
          Uplaud Spotlight 
        </h2>
        <div className="w-full flex flex-col gap-6 items-center">
          <MarqueeRow>
            {row1.map((r) => (
              <ReviewCard review={r} key={r.id + "-row1"} navigate={navigate} />
            ))}
          </MarqueeRow>
          <MarqueeRow reverse>
            {row2.map((r) => (
              <ReviewCard review={r} key={r.id + "-row2"} navigate={navigate} />
            ))}
          </MarqueeRow>
        </div>
      </div>
      <style>{`
        @keyframes marquee-fwd {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        @keyframes marquee-rev {
          0% { transform: translateX(-50%); }
          100% { transform: translateX(0); }
        }
      `}</style>
    </section>
  );
};

export default UpcomingFeatures;
