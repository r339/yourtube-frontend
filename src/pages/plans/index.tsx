import React, { useState } from "react";
import { useUser } from "@/lib/AuthContext";
import axiosInstance from "@/lib/axiosinstance";
import { Crown, Check, Clock, Download } from "lucide-react";

declare global {
  interface Window {
    Razorpay: any;
  }
}

const PLANS = [
  {
    id: "free",
    name: "Free",
    price: 0,
    displayPrice: "₹0",
    color: "border-gray-200",
    badge: "bg-gray-100 text-gray-700",
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
    badge: "bg-orange-100 text-orange-700",
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
    badge: "bg-gray-200 text-gray-800",
    features: [
      "Watch up to 10 minutes per video",
      "Unlimited downloads",
      "HD quality",
      "Priority support",
    ],
    icon: "🥈",
  },
  {
    id: "gold",
    name: "Gold",
    price: 100,
    displayPrice: "₹100",
    color: "border-yellow-400",
    badge: "bg-yellow-100 text-yellow-800",
    features: [
      "Unlimited video watching",
      "Unlimited downloads",
      "HD + 4K quality",
      "Priority support",
      "Early access to features",
    ],
    icon: "🥇",
    popular: true,
  },
];

const PlansPage = () => {
  const { user, login } = useUser() as any;
  const [loading, setLoading] = useState<string | null>(null);
  const [message, setMessage] = useState("");

  const currentPlan = user?.plan || "free";

  const loadRazorpay = (): Promise<boolean> => {
    return new Promise((resolve) => {
      if (window.Razorpay) return resolve(true);
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handleUpgrade = async (planId: string) => {
    if (!user) {
      setMessage("Please sign in to upgrade your plan.");
      return;
    }
    if (planId === "free") return;
    if (planId === currentPlan) {
      setMessage("You are already on this plan.");
      return;
    }

    setLoading(planId);
    setMessage("");

    const loaded = await loadRazorpay();
    if (!loaded) {
      setMessage("Failed to load payment gateway. Please try again.");
      setLoading(null);
      return;
    }

    try {
      const orderRes = await axiosInstance.post("/user/plan/createorder", { plan: planId });
      const { order, key } = orderRes.data;

      const options = {
        key: key,
        amount: order.amount,
        currency: "INR",
        name: "YourTube",
        description: `Upgrade to ${planId.charAt(0).toUpperCase() + planId.slice(1)} Plan`,
        order_id: order.id,
        handler: async (response: any) => {
          try {
            const upgradeRes = await axiosInstance.post("/user/plan/upgrade", {
              userid: user._id,
              plan: planId,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            });
            if (upgradeRes.data.success) {
              login(upgradeRes.data.user);
              setMessage(`✅ Successfully upgraded to ${planId.toUpperCase()} plan! Invoice sent to your email.`);
            }
          } catch {
            setMessage("Payment verification failed. Please contact support.");
          }
        },
        prefill: {
          name: user.name,
          email: user.email,
        },
        theme: { color: "#ff0000" },
        modal: { ondismiss: () => setLoading(null) },
      };

      const rzp = new window.Razorpay(options);
      rzp.on("payment.failed", () => {
        setMessage("Payment failed. Please try again.");
        setLoading(null);
      });
      rzp.open();
    } catch (err: any) {
      setMessage(err.response?.data?.message || "Failed to initiate payment.");
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="max-w-5xl mx-auto p-6">
      <div className="text-center mb-10">
        <h1 className="text-3xl font-bold mb-2 flex items-center justify-center gap-2">
          <Crown className="w-8 h-8 text-yellow-500" />
          Upgrade Your Plan
        </h1>
        <p className="text-gray-600">
          Choose a plan that fits your viewing needs
        </p>
        {user && (
          <p className="text-sm text-gray-500 mt-2">
            Current plan:{" "}
            <span className="font-semibold capitalize text-blue-600">{currentPlan}</span>
          </p>
        )}
      </div>

      {message && (
        <div
          className={`mb-6 p-4 rounded-lg text-center text-sm font-medium ${
            message.startsWith("✅")
              ? "bg-green-50 text-green-700 border border-green-200"
              : "bg-red-50 text-red-700 border border-red-200"
          }`}
        >
          {message}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {PLANS.map((plan) => {
          const isCurrent = currentPlan === plan.id;
          const isPurchasing = loading === plan.id;

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
                {plan.features.map((feature, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm">
                    <Check className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                    {feature}
                  </li>
                ))}
              </ul>

              <button
                onClick={() => handleUpgrade(plan.id)}
                disabled={isCurrent || plan.id === "free" || isPurchasing}
                className={`w-full py-2.5 rounded-lg font-semibold text-sm transition ${
                  isCurrent || plan.id === "free"
                    ? "bg-gray-100 text-gray-400 cursor-default"
                    : "bg-red-600 hover:bg-red-700 text-white"
                }`}
              >
                {isPurchasing
                  ? "Processing..."
                  : isCurrent
                  ? "Current Plan"
                  : plan.id === "free"
                  ? "Default"
                  : `Upgrade to ${plan.name}`}
              </button>
            </div>
          );
        })}
      </div>

      <div className="mt-8 text-center text-xs text-gray-400">
        <p>Payments powered by Razorpay (Test Mode). No real charges will be made.</p>
        <p className="mt-1">
          <Clock className="w-3 h-3 inline mr-1" />
          Plans are valid for 30 days from purchase.
        </p>
        <p className="mt-1">
          <Download className="w-3 h-3 inline mr-1" />
          An invoice will be sent to your registered email upon successful payment.
        </p>
      </div>
    </div>
  );
};

export default PlansPage;
