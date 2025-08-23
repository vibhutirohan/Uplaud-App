import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { MessageCircle, Smartphone } from "lucide-react";

/* ===================== Sticky Logo Navbar (same as leaderboard) ===================== */
function StickyLogoNavbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const onScroll = () => setIsScrolled(window.scrollY > 10);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled ? "bg-[#6214a8]/95 backdrop-blur-sm shadow-md py-2" : "bg-transparent py-4"
      }`}
    >
      <div className="container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center">
          <button
            onClick={() => navigate("/")}
            className="flex items-center"
            aria-label="Go home"
          >
            <img
              alt="Uplaud Logo"
              className="h-10 w-auto object-fill"
              src="/lovable-uploads/ba7f1f54-2df2-4f44-8af1-522b7ccc0810.png"
            />
          </button>
          <div className="w-10 h-10" />
        </div>
      </div>
    </nav>
  );
}

/* ===================== Login ===================== */
const COUNTRY_CODES = [{ code: "1" }, { code: "91" }];

function cleanPhoneNumber(input: string) {
  return input.replace(/[^\d]/g, "");
}

const Login = () => {
  const [countryCode, setCountryCode] = useState(COUNTRY_CODES[0].code);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleSendOtp = () => {
    const cleaned = cleanPhoneNumber(phoneNumber);
    if (!cleaned || cleaned.length < 10) {
      toast({
        title: "Invalid number",
        description: "Enter a valid WhatsApp number",
        variant: "destructive",
      });
      return;
    }
    const fullPhone = `${countryCode}${cleaned}`;
    const mockOtp = Math.floor(100000 + Math.random() * 900000).toString();

    sessionStorage.setItem("mock_otp", mockOtp);
    sessionStorage.setItem("otp_phone", fullPhone);
    sessionStorage.setItem("userPhone", fullPhone);

    toast({
      title: "OTP Sent!",
      description: `Mock OTP: ${mockOtp}`,
    });

    setOtpSent(true);
    setTimeout(() => navigate("/verify-otp"), 1000);
  };

  return (
    <div
      className="min-h-screen flex flex-col px-4 pb-8 pt-24 relative font-sans overflow-hidden"
      style={{ background: "#6214a8" }} // Solid purple background
    >
      {/* Sticky logo navbar (shared with leaderboard) */}
      <StickyLogoNavbar />

      {/* Centered login card */}
      <div className="flex flex-1 items-center justify-center z-20">
        <div className="w-full max-w-md relative z-10">
          <div className="bg-white/90 backdrop-blur-lg rounded-3xl shadow-2xl p-8 space-y-6">
            <div className="flex flex-col items-center space-y-2">
              <div className="bg-green-100 rounded-full p-4">
                <MessageCircle className="text-green-600 w-6 h-6" />
              </div>
              <h1 className="text-xl font-semibold text-gray-800">
                Login to get into your account
              </h1>
              <p className="text-sm text-gray-500 text-center">
                Enter your WhatsApp number to receive OTP.
              </p>
            </div>

            <div>
              <label
                htmlFor="phone"
                className="text-sm font-medium text-gray-700 mb-1 block"
              >
                WhatsApp Number
              </label>
              <div className="relative flex">
                <select
                  value={countryCode}
                  onChange={(e) => setCountryCode(e.target.value)}
                  className="border border-gray-300 bg-white text-gray-700 rounded-l-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  style={{ minWidth: 70 }}
                >
                  {COUNTRY_CODES.map((c) => (
                    <option key={c.code} value={c.code}>
                      {"+" + c.code}
                    </option>
                  ))}
                </select>
                <div className="flex-1 relative">
                  <Smartphone className="absolute left-3 top-3 text-gray-400 w-5 h-5" />
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="Enter WhatsApp number"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    className="pl-10 pr-4 py-2 text-gray-800 bg-white border border-gray-300 border-l-0 rounded-r-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    style={{ borderLeft: "none" }}
                  />
                </div>
              </div>
            </div>

            <Button
              onClick={handleSendOtp}
              className="w-full bg-purple-600 hover:bg-purple-700 text-white font-medium py-2.5 rounded-lg transition duration-200"
            >
              {otpSent ? "Sending OTP..." : "Send OTP"}
            </Button>

            <p className="text-xs text-gray-500 text-center">
              By continuing, you agree to our{" "}
              <a
                href="https://www.uplaud.ai/terms-of-service"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline"
              >
                Terms
              </a>{" "}
              and{" "}
              <a
                href="https://www.uplaud.ai/privacy-policy"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline"
              >
                Privacy Policy
              </a>
              .
            </p>
          </div>
        </div>
      </div>

      {/* Subtle glow effects */}
      <div className="absolute top-10 left-10 w-32 h-32 bg-white/10 rounded-full blur-2xl animate-pulse" />
      <div className="absolute bottom-10 right-10 w-40 h-40 bg-white/10 rounded-full blur-2xl animate-pulse delay-1000" />
    </div>
  );
};

export default Login;
