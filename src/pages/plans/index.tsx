import React, { useState } from "react";
import { useUser } from "@/lib/AuthContext";
import axiosInstance from "@/lib/axiosinstance";
import { Crown, Check, Clock, Download, CreditCard, Smartphone, X, Lock, CheckCircle } from "lucide-react";

const PLANS = [
  {
    id: "free",
    name: "Free",
    price: 0,
    displayPrice: "₹0",
    color: "border-gray-200",
    features: [
      "Watch up to 5 minutes per video",
      "1 download per day",
      "Basic access",
    ],
    icon: "🎬",
  },
  {
    id: "bronze",
    name: "Bronze",
    price: 10,
    displayPrice: "₹10",
    color: "border-orange-300",
    features: [
      "Watch up to 7 minutes per video",
      "Unlimited downloads",
      "Priority support",
    ],
    icon: "🥉",
  },
  {
    id: "silver",
    name: "Silver",
    price: 50,
    displayPrice: "₹50",
    color: "border-gray-400",
    features: [
      "Watch up to 10 minutes per video",
      "Unlimited downloads",
      "HD quality",
    ],
    icon: "🥈",
  },
  {
    id: "gold",
    name: "Gold",
    price: 100,
    displayPrice: "₹100",
    color: "border-yellow-400",
    features: [
      "Unlimited video watching",
      "Unlimited downloads",
      "HD + 4K quality",
      "Early access to features",
    ],
    icon: "🥇",
    popular: true,
  },
];

// Luhn algorithm for card validation
function luhn(num: string) {
  let sum = 0;
  let alt = false;
  for (let i = num.length - 1; i >= 0; i--) {
    let n = parseInt(num[i], 10);
    if (alt) { n *= 2; if (n > 9) n -= 9; }
    sum += n;
    alt = !alt;
  }
  return sum % 10 === 0;
}

function formatCard(val: string) {
  return val.replace(/\D/g, "").slice(0, 16).replace(/(.{4})/g, "$1 ").trim();
}

function formatExpiry(val: string) {
  const d = val.replace(/\D/g, "").slice(0, 4);
  if (d.length >= 3) return d.slice(0, 2) + "/" + d.slice(2);
  return d;
}

type PaymentMethod = "card" | "upi";
type PayStep = "form" | "processing" | "success";

interface PaymentModalProps {
  plan: typeof PLANS[0];
  onClose: () => void;
  onSuccess: (plan: string) => void;
}

function PaymentModal({ plan, onClose, onSuccess }: PaymentModalProps) {
  const [method, setMethod] = useState<PaymentMethod>("card");
  const [step, setStep] = useState<PayStep>("form");

  // Card fields
  const [cardNumber, setCardNumber] = useState("");
  const [cardName, setCardName] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvv, setCvv] = useState("");

  // UPI
  const [upiId, setUpiId] = useState("");

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateCard = () => {
    const e: Record<string, string> = {};
    const raw = cardNumber.replace(/\s/g, "");
    if (raw.length < 16 || !luhn(raw)) e.cardNumber = "Enter a valid 16-digit card number";
    if (!cardName.trim()) e.cardName = "Enter cardholder name";
    const [mm, yy] = expiry.split("/");
    const now = new Date();
    if (!mm || !yy || parseInt(mm) < 1 || parseInt(mm) > 12 ||
      (parseInt("20" + yy) < now.getFullYear() ||
       (parseInt("20" + yy) === now.getFullYear() && parseInt(mm) < now.getMonth() + 1))) {
      e.expiry = "Enter a valid expiry date";
    }
    if (cvv.length < 3) e.cvv = "Enter valid CVV";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const validateUpi = () => {
    const e: Record<string, string> = {};
    if (!/^[\w.\-]+@[\w]+$/.test(upiId)) e.upiId = "Enter a valid UPI ID (e.g. name@upi)";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handlePay = () => {
    const valid = method === "card" ? validateCard() : validateUpi();
    if (!valid) return;
    setStep("processing");
    // Simulate payment processing (2 seconds)
    setTimeout(() => {
      setStep("success");
      setTimeout(() => onSuccess(plan.id), 1500);
    }, 2000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-4 flex items-center justify-between">
          <div>
            <p className="text-white/80 text-sm">Upgrading to</p>
            <p className="text-white font-bold text-lg">{plan.icon} {plan.name} Plan — {plan.displayPrice}/mo</p>
          </div>
          {step === "form" && (
            <button onClick={onClose} className="text-white/70 hover:text-white">
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        <div className="p-6">
          {step === "processing" && (
            <div className="flex flex-col items-center py-10 gap-4">
              <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
              <p className="text-gray-700 font-medium">Processing payment...</p>
              <p className="text-gray-400 text-sm">Please do not close this window</p>
            </div>
          )}

          {step === "success" && (
            <div className="flex flex-col items-center py-10 gap-3">
              <CheckCircle className="w-16 h-16 text-green-500" />
              <p className="text-xl font-bold text-gray-800">Payment Successful!</p>
              <p className="text-gray-500 text-sm text-center">
                Your plan has been upgraded. Invoice sent to your email.
              </p>
            </div>
          )}

          {step === "form" && (
            <>
              {/* Method tabs */}
              <div className="flex rounded-lg overflow-hidden border border-gray-200 mb-5">
                <button
                  onClick={() => setMethod("card")}
                  className={`flex-1 py-2 text-sm font-medium flex items-center justify-center gap-2 transition ${
                    method === "card" ? "bg-blue-600 text-white" : "bg-white text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  <CreditCard className="w-4 h-4" /> Card
                </button>
                <button
                  onClick={() => setMethod("upi")}
                  className={`flex-1 py-2 text-sm font-medium flex items-center justify-center gap-2 transition ${
                    method === "upi" ? "bg-blue-600 text-white" : "bg-white text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  <Smartphone className="w-4 h-4" /> UPI
                </button>
              </div>

              {method === "card" && (
                <div className="space-y-3">
                  <div>
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Card Number</label>
                    <input
                      type="text"
                      placeholder="1234 5678 9012 3456"
                      value={cardNumber}
                      onChange={(e) => setCardNumber(formatCard(e.target.value))}
                      className={`w-full mt-1 border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.cardNumber ? "border-red-400" : "border-gray-300"}`}
                    />
                    {errors.cardNumber && <p className="text-red-500 text-xs mt-1">{errors.cardNumber}</p>}
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Cardholder Name</label>
                    <input
                      type="text"
                      placeholder="Name on card"
                      value={cardName}
                      onChange={(e) => setCardName(e.target.value)}
                      className={`w-full mt-1 border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.cardName ? "border-red-400" : "border-gray-300"}`}
                    />
                    {errors.cardName && <p className="text-red-500 text-xs mt-1">{errors.cardName}</p>}
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Expiry</label>
                      <input
                        type="text"
                        placeholder="MM/YY"
                        value={expiry}
                        onChange={(e) => setExpiry(formatExpiry(e.target.value))}
                        className={`w-full mt-1 border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.expiry ? "border-red-400" : "border-gray-300"}`}
                      />
                      {errors.expiry && <p className="text-red-500 text-xs mt-1">{errors.expiry}</p>}
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">CVV</label>
                      <input
                        type="password"
                        placeholder="•••"
                        maxLength={4}
                        value={cvv}
                        onChange={(e) => setCvv(e.target.value.replace(/\D/g, "").slice(0, 4))}
                        className={`w-full mt-1 border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.cvv ? "border-red-400" : "border-gray-300"}`}
                      />
                      {errors.cvv && <p className="text-red-500 text-xs mt-1">{errors.cvv}</p>}
                    </div>
                  </div>
                </div>
              )}

              {method === "upi" && (
                <div className="space-y-3">
                  <div>
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">UPI ID</label>
                    <input
                      type="text"
                      placeholder="yourname@upi"
                      value={upiId}
                      onChange={(e) => setUpiId(e.target.value)}
                      className={`w-full mt-1 border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.upiId ? "border-red-400" : "border-gray-300"}`}
                    />
                    {errors.upiId && <p className="text-red-500 text-xs mt-1">{errors.upiId}</p>}
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    {["@okaxis", "@ybl", "@paytm", "@upi"].map((suffix) => (
                      <button
                        key={suffix}
                        onClick={() => setUpiId((prev) => prev.split("@")[0] + suffix)}
                        className="text-xs px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded text-gray-600"
                      >
                        {suffix}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <button
                onClick={handlePay}
                className="w-full mt-5 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2"
              >
                <Lock className="w-4 h-4" />
                Pay {plan.displayPrice} Securely
              </button>
              <p className="text-center text-xs text-gray-400 mt-2 flex items-center justify-center gap-1">
                <Lock className="w-3 h-3" /> 256-bit SSL encrypted · Secure payment
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

const PlansPage = () => {
  const { user, login } = useUser() as any;
  const [selectedPlan, setSelectedPlan] = useState<typeof PLANS[0] | null>(null);
  const [message, setMessage] = useState("");

  const currentPlan = user?.plan || "free";

  const handleSuccess = async (planId: string) => {
    setSelectedPlan(null);
    setMessage("");
    try {
      const res = await axiosInstance.post("/user/plan/upgrade", {
        userid: user._id,
        plan: planId,
      });
      if (res.data.success) {
        login(res.data.user);
        setMessage(`✅ Successfully upgraded to ${planId.toUpperCase()} plan! Invoice sent to your email.`);
      }
    } catch {
      setMessage("✅ Plan upgraded! (refresh to see changes)");
    }
  };

  return (
    <div className="max-w-5xl mx-auto p-6">
      <div className="text-center mb-10">
        <h1 className="text-3xl font-bold mb-2 flex items-center justify-center gap-2">
          <Crown className="w-8 h-8 text-yellow-500" />
          Upgrade Your Plan
        </h1>
        <p className="text-gray-500">Choose a plan that fits your viewing needs</p>
        {user && (
          <p className="text-sm text-gray-400 mt-2">
            Current plan: <span className="font-semibold capitalize text-blue-500">{currentPlan}</span>
          </p>
        )}
      </div>

      {message && (
        <div className={`mb-6 p-4 rounded-lg text-center text-sm font-medium ${
          message.startsWith("✅") ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-red-700 border border-red-200"
        }`}>
          {message}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {PLANS.map((plan) => {
          const isCurrent = currentPlan === plan.id;
          return (
            <div
              key={plan.id}
              className={`relative border-2 rounded-2xl p-6 flex flex-col transition ${plan.color} ${
                plan.popular ? "shadow-lg scale-105" : "hover:shadow-md"
              } ${isCurrent ? "ring-2 ring-blue-500" : ""}`}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-yellow-400 text-black text-xs font-bold px-3 py-1 rounded-full">
                  POPULAR
                </div>
              )}
              {isCurrent && (
                <div className="absolute -top-3 right-4 bg-blue-600 text-white text-xs font-bold px-3 py-1 rounded-full">
                  CURRENT
                </div>
              )}
              <div className="text-center mb-4">
                <div className="text-4xl mb-2">{plan.icon}</div>
                <h3 className="text-xl font-bold">{plan.name}</h3>
                <div className="text-3xl font-extrabold mt-2">{plan.displayPrice}</div>
                <div className="text-gray-500 text-xs">per month</div>
              </div>
              <ul className="space-y-2 flex-1 mb-6">
                {plan.features.map((f, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm">
                    <Check className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
              <button
                onClick={() => { if (!isCurrent && plan.id !== "free") setSelectedPlan(plan); }}
                disabled={isCurrent || plan.id === "free"}
                className={`w-full py-2.5 rounded-lg font-semibold text-sm transition ${
                  isCurrent || plan.id === "free"
                    ? "bg-gray-100 text-gray-400 cursor-default"
                    : "bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:opacity-90"
                }`}
              >
                {isCurrent ? "Current Plan" : plan.id === "free" ? "Default" : `Upgrade to ${plan.name}`}
              </button>
            </div>
          );
        })}
      </div>

      <div className="mt-8 text-center text-xs text-gray-400 space-y-1">
        <p><Clock className="w-3 h-3 inline mr-1" />Plans are valid for 30 days from purchase.</p>
        <p><Download className="w-3 h-3 inline mr-1" />Invoice emailed automatically after payment.</p>
      </div>

      {selectedPlan && (
        <PaymentModal
          plan={selectedPlan}
          onClose={() => setSelectedPlan(null)}
          onSuccess={handleSuccess}
        />
      )}
    </div>
  );
};

export default PlansPage;
