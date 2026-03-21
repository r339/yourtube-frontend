import Header from "@/components/Header";
import Sidebar from "@/components/Sidebar";
import { Toaster } from "@/components/ui/sonner";
import "@/styles/globals.css";
import type { AppProps } from "next/app";
import { UserProvider, useUser } from "../lib/AuthContext";
import { useEffect, useState } from "react";
import axiosInstance from "@/lib/axiosinstance";

const SOUTH_INDIA_STATES = [
  "Tamil Nadu", "Kerala", "Karnataka", "Andhra Pradesh", "Telangana",
  // Also handle abbreviations / alternate spellings
  "TN", "KL", "KA", "AP", "TS",
];

function ThemeOtpWrapper({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<"light" | "dark">("dark");
  const [location, setLocation] = useState<any>(null);
  const [isSouthIndia, setIsSouthIndia] = useState(false);
  // OTP modal state
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [otpIdentifier, setOtpIdentifier] = useState("");
  const [otpType, setOtpType] = useState<"email" | "sms">("email");
  const [otpInput, setOtpInput] = useState("");
  const [otpError, setOtpError] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);
  const [phone, setPhone] = useState("");
  const [sendingOtp, setSendingOtp] = useState(false);
  const [verifyingOtp, setVerifyingOtp] = useState(false);
  const { user, login } = useUser() as any;

  useEffect(() => {
    // Detect location via IP
    fetch("https://ipapi.co/json/")
      .then((r) => r.json())
      .then((data) => {
        setLocation(data);
        const regionName = data.region || "";
        const inSouth = SOUTH_INDIA_STATES.some((s) =>
          regionName.toLowerCase().includes(s.toLowerCase())
        );
        setIsSouthIndia(inSouth);

        // Apply theme: South India + 10:00–12:00 IST = light; else dark
        const nowIST = new Date(
          new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" })
        );
        const hour = nowIST.getHours();
        const inTimeWindow = hour >= 10 && hour < 12;
        const shouldBeLight = inSouth && inTimeWindow;
        setTheme(shouldBeLight ? "light" : "dark");
      })
      .catch(() => setTheme("dark"));
  }, []);

  // After login: if user just signed in, require OTP
  useEffect(() => {
    if (!user || otpVerified) return;
    // Check localStorage if OTP was already verified this session
    const verified = sessionStorage.getItem(`otp_verified_${user._id}`);
    if (verified === "true") { setOtpVerified(true); return; }

    // Show OTP modal
    if (isSouthIndia) {
      setOtpType("email");
      setOtpIdentifier(user.email);
    } else {
      setOtpType("sms");
      setOtpIdentifier(user.phone || "");
    }
    setShowOtpModal(true);
  }, [user, isSouthIndia]);

  const handleSendOtp = async (identifier?: string) => {
    const id = identifier || otpIdentifier;
    if (!id) { setOtpError("Please enter a valid identifier."); return; }
    setSendingOtp(true);
    setOtpError("");
    try {
      await axiosInstance.post("/otp/send", { identifier: id, type: otpType });
      setOtpSent(true);
      setOtpIdentifier(id);
    } catch (err: any) {
      setOtpError(err.response?.data?.message || "Failed to send OTP.");
    } finally {
      setSendingOtp(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!otpInput.trim()) { setOtpError("Enter the OTP."); return; }
    setVerifyingOtp(true);
    setOtpError("");
    try {
      await axiosInstance.post("/otp/verify", {
        identifier: otpIdentifier,
        code: otpInput.trim(),
      });
      setOtpVerified(true);
      setShowOtpModal(false);
      sessionStorage.setItem(`otp_verified_${user._id}`, "true");
      // Save phone if new
      if (otpType === "sms" && phone && !user.phone) {
        const updated = await axiosInstance.patch(`/user/update/${user._id}`, { phone });
        login(updated.data);
      }
    } catch (err: any) {
      setOtpError(err.response?.data?.message || "Invalid OTP.");
    } finally {
      setVerifyingOtp(false);
    }
  };

  const isDark = theme === "dark";

  return (
    <div
      className={`min-h-screen flex flex-col transition-colors duration-300 ${
        isDark
          ? "bg-gray-950 text-white"
          : "bg-white text-black"
      }`}
      data-theme={theme}
    >
      {children}

      {/* OTP Verification Modal */}
      {showOtpModal && user && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
          <div
            className={`rounded-2xl p-6 w-full max-w-md shadow-2xl ${
              isDark ? "bg-gray-900 text-white" : "bg-white text-black"
            }`}
          >
            <div className="text-center mb-4">
              <div className="text-3xl mb-2">🔐</div>
              <h2 className="text-xl font-bold">Verify Your Identity</h2>
              <p className="text-sm text-gray-500 mt-1">
                {isSouthIndia
                  ? "You're logging in from South India. We'll send an OTP to your email."
                  : "We'll send an OTP to your mobile number for verification."}
              </p>
            </div>

            {!otpSent ? (
              <>
                {otpType === "sms" && !user.phone ? (
                  <div className="mb-4">
                    <label className="block text-sm font-medium mb-1">Mobile Number</label>
                    <input
                      type="tel"
                      placeholder="10-digit mobile number"
                      value={phone}
                      onChange={(e) => { setPhone(e.target.value); setOtpIdentifier(e.target.value); }}
                      className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-transparent"
                    />
                  </div>
                ) : (
                  <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg text-sm text-center">
                    OTP will be sent to:{" "}
                    <span className="font-semibold">{otpIdentifier}</span>
                  </div>
                )}
                {otpError && <p className="text-red-500 text-sm mb-3">{otpError}</p>}
                <button
                  onClick={() => handleSendOtp()}
                  disabled={sendingOtp || (otpType === "sms" && !otpIdentifier)}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-lg font-semibold disabled:opacity-50"
                >
                  {sendingOtp ? "Sending..." : "Send OTP"}
                </button>
              </>
            ) : (
              <>
                <p className="text-sm text-center text-gray-500 mb-4">
                  Enter the 6-digit OTP sent to <b>{otpIdentifier}</b>
                </p>
                <input
                  type="text"
                  maxLength={6}
                  placeholder="Enter OTP"
                  value={otpInput}
                  onChange={(e) => setOtpInput(e.target.value.replace(/\D/g, ""))}
                  className="w-full border rounded-lg px-3 py-2 text-sm text-center text-2xl tracking-widest focus:outline-none focus:ring-2 focus:ring-blue-500 bg-transparent mb-3"
                />
                {otpError && <p className="text-red-500 text-sm mb-3 text-center">{otpError}</p>}
                <button
                  onClick={handleVerifyOtp}
                  disabled={verifyingOtp || otpInput.length < 6}
                  className="w-full bg-green-600 hover:bg-green-700 text-white py-2.5 rounded-lg font-semibold disabled:opacity-50"
                >
                  {verifyingOtp ? "Verifying..." : "Verify OTP"}
                </button>
                <button
                  onClick={() => { setOtpSent(false); setOtpInput(""); setOtpError(""); }}
                  className="w-full mt-2 text-sm text-gray-500 hover:text-gray-700 py-2"
                >
                  Resend OTP
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function App({ Component, pageProps }: AppProps) {
  return (
    <UserProvider>
      <ThemeOtpWrapper>
        <title>YourTube</title>
        <Header />
        <Toaster position="bottom-right" />
        <div className="flex flex-1 overflow-hidden">
          <Sidebar />
          <main className="flex-1 overflow-y-auto">
            <Component {...pageProps} />
          </main>
        </div>
      </ThemeOtpWrapper>
    </UserProvider>
  );
}
