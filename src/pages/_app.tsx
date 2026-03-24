import Header from "@/components/Header";
import Sidebar from "@/components/Sidebar";
import { Toaster } from "@/components/ui/sonner";
import "@/styles/globals.css";
import type { AppProps } from "next/app";
import { UserProvider, useUser } from "../lib/AuthContext";
import { ThemeProvider, useTheme } from "../lib/ThemeContext";
import { useEffect, useState } from "react";
import axiosInstance from "@/lib/axiosinstance";

const SOUTH_INDIA_STATES = [
  "Tamil Nadu", "Kerala", "Karnataka", "Andhra Pradesh", "Telangana",
  "TN", "KL", "KA", "AP", "TS",
];

function OtpWrapper({ children }: { children: React.ReactNode }) {
  const [isSouthIndia, setIsSouthIndia] = useState(false);
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
  const { isDark, setTheme } = useTheme();

  // Detect location once on mount — sets geo-based initial theme only if user
  // hasn't manually chosen one (no localStorage key yet)
  useEffect(() => {
    fetch("https://ipapi.co/json/")
      .then((r) => r.json())
      .then((data) => {
        const regionName = data.region || "";
        const inSouth = SOUTH_INDIA_STATES.some((s) =>
          regionName.toLowerCase().includes(s.toLowerCase())
        );
        setIsSouthIndia(inSouth);

        // Only apply geo theme if user hasn't manually set one
        if (!localStorage.getItem("yt-theme")) {
          const nowIST = new Date(
            new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" })
          );
          const hour = nowIST.getHours();
          const shouldBeLight = inSouth && hour >= 10 && hour < 12;
          setTheme(shouldBeLight ? "light" : "dark");
        }
      })
      .catch(() => {
        if (!localStorage.getItem("yt-theme")) setTheme("dark");
      });
  }, []);

  useEffect(() => {
    if (!user || otpVerified) return;
    const verified = sessionStorage.getItem(`otp_verified_${user._id}`);
    if (verified === "true") { setOtpVerified(true); return; }

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

  return (
    <>
      {children}

      {/* OTP Verification Modal */}
      {showOtpModal && user && (
        <div className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className={`rounded-2xl p-7 w-full max-w-md shadow-2xl border animate-scale-in ${
            isDark
              ? "bg-[#212121] border-[#3d3d3d] text-white"
              : "bg-white border-gray-200 text-gray-900"
          }`}>
            <div className="text-center mb-6">
              <div className="text-4xl mb-3">🔐</div>
              <h2 className="text-xl font-bold">Verify Your Identity</h2>
              <p className="text-sm mt-2" style={{ color: "var(--muted-text)" }}>
                {isSouthIndia
                  ? "Logging in from South India — OTP sent to your email."
                  : "We'll verify your mobile number via OTP."}
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
                      className={`w-full border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        isDark ? "bg-[#2d2d2d] border-[#3d3d3d] text-white" : "bg-gray-50 border-gray-300"
                      }`}
                    />
                  </div>
                ) : (
                  <div className={`mb-4 p-3 rounded-xl text-sm text-center ${isDark ? "bg-[#2d2d2d]" : "bg-gray-50"}`}>
                    OTP will be sent to: <span className="font-semibold">{otpIdentifier}</span>
                  </div>
                )}
                {otpError && <p className="text-red-500 text-sm mb-3">{otpError}</p>}
                <button
                  onClick={() => handleSendOtp()}
                  disabled={sendingOtp || (otpType === "sms" && !otpIdentifier)}
                  className="w-full bg-blue-600 hover:bg-blue-500 active:scale-95 text-white py-2.5 rounded-xl font-semibold disabled:opacity-50 transition-all"
                >
                  {sendingOtp ? "Sending..." : "Send OTP"}
                </button>
              </>
            ) : (
              <>
                <p className="text-sm text-center mb-4" style={{ color: "var(--muted-text)" }}>
                  Enter the 6-digit OTP sent to <b>{otpIdentifier}</b>
                </p>
                <input
                  type="text"
                  maxLength={6}
                  placeholder="· · · · · ·"
                  value={otpInput}
                  onChange={(e) => setOtpInput(e.target.value.replace(/\D/g, ""))}
                  className={`w-full border rounded-xl px-4 py-3 text-center text-3xl tracking-[0.6em] font-bold focus:outline-none focus:ring-2 focus:ring-green-500 mb-3 ${
                    isDark ? "bg-[#2d2d2d] border-[#3d3d3d] text-white" : "bg-gray-50 border-gray-300"
                  }`}
                />
                {otpError && <p className="text-red-500 text-sm mb-3 text-center">{otpError}</p>}
                <button
                  onClick={handleVerifyOtp}
                  disabled={verifyingOtp || otpInput.length < 6}
                  className="w-full bg-green-600 hover:bg-green-500 active:scale-95 text-white py-2.5 rounded-xl font-semibold disabled:opacity-50 transition-all"
                >
                  {verifyingOtp ? "Verifying..." : "Verify OTP"}
                </button>
                <button
                  onClick={() => { setOtpSent(false); setOtpInput(""); setOtpError(""); }}
                  className="w-full mt-2 text-sm py-2 rounded-xl transition-colors"
                  style={{ color: "var(--muted-text)" }}
                >
                  ↩ Resend OTP
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}

export default function App({ Component, pageProps }: AppProps) {
  return (
    <UserProvider>
      <ThemeProvider>
        <OtpWrapper>
          <div className="min-h-screen flex flex-col bg-background text-foreground">
            <title>YourTube</title>
            <Header />
            <Toaster position="bottom-right" />
            <div className="flex flex-1 overflow-hidden">
              <Sidebar />
              <main className="flex-1 overflow-y-auto">
                <Component {...pageProps} />
              </main>
            </div>
          </div>
        </OtpWrapper>
      </ThemeProvider>
    </UserProvider>
  );
}
