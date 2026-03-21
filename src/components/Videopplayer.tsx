import { useRef, useEffect, useState, useCallback } from "react";
import { useUser } from "@/lib/AuthContext";
import axiosInstance from "@/lib/axiosinstance";
import { Download, Crown } from "lucide-react";

interface VideoPlayerProps {
  video: {
    _id: string;
    videotitle: string;
    filepath: string;
    cloudinary_public_id?: string;
  };
  onNextVideo?: () => void;
  onOpenComments?: () => void;
  relatedVideos?: any[];
}

// Plan time limits in seconds (0 = unlimited)
const PLAN_LIMITS: Record<string, number> = {
  free: 5 * 60,
  bronze: 7 * 60,
  silver: 10 * 60,
  gold: 0,
  premium: 0,
};

export default function VideoPlayer({
  video,
  onNextVideo,
  onOpenComments,
  relatedVideos = [],
}: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const { user } = useUser() as any;

  const [showGestureHint, setShowGestureHint] = useState("");
  const [timeLimitReached, setTimeLimitReached] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [downloadMsg, setDownloadMsg] = useState("");

  // Gesture tracking
  const tapCountRef = useRef(0);
  const tapTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lastTapTimeRef = useRef(0);
  const lastTapRegionRef = useRef("");

  const showHint = (msg: string) => {
    setShowGestureHint(msg);
    setTimeout(() => setShowGestureHint(""), 1200);
  };

  // Plan-based time limit
  useEffect(() => {
    const vid = videoRef.current;
    if (!vid) return;
    const plan = user?.plan || "free";
    const limit = PLAN_LIMITS[plan] ?? PLAN_LIMITS.free;
    if (limit === 0) return; // unlimited

    const handler = () => {
      if (vid.currentTime >= limit) {
        vid.pause();
        setTimeLimitReached(true);
      }
    };
    vid.addEventListener("timeupdate", handler);
    return () => vid.removeEventListener("timeupdate", handler);
  }, [user, video._id]);

  // Reset time limit when video changes
  useEffect(() => {
    setTimeLimitReached(false);
    setDownloadMsg("");
  }, [video._id]);

  // ── Gesture detection ──────────────────────────────────────────────────────
  const getRegion = useCallback((x: number, width: number) => {
    const third = width / 3;
    if (x < third) return "left";
    if (x > 2 * third) return "right";
    return "center";
  }, []);

  const handleTouchEnd = useCallback(
    (e: React.TouchEvent<HTMLDivElement>) => {
      const touch = e.changedTouches[0];
      const container = containerRef.current;
      if (!container) return;
      const rect = container.getBoundingClientRect();
      const x = touch.clientX - rect.left;
      const region = getRegion(x, rect.width);

      const now = Date.now();
      const timeSinceLast = now - lastTapTimeRef.current;
      const isDoubleTap = timeSinceLast < 300 && lastTapRegionRef.current === region;

      lastTapTimeRef.current = now;
      lastTapRegionRef.current = region;

      // Double tap handling
      if (isDoubleTap) {
        if (tapTimerRef.current) clearTimeout(tapTimerRef.current);
        tapCountRef.current = 0;
        const vid = videoRef.current;
        if (!vid) return;
        if (region === "right") {
          vid.currentTime = Math.min(vid.duration, vid.currentTime + 10);
          showHint("⏩ +10s");
        } else if (region === "left") {
          vid.currentTime = Math.max(0, vid.currentTime - 10);
          showHint("⏪ -10s");
        }
        return;
      }

      // Multi-tap counting
      tapCountRef.current += 1;
      if (tapTimerRef.current) clearTimeout(tapTimerRef.current);
      tapTimerRef.current = setTimeout(() => {
        const count = tapCountRef.current;
        tapCountRef.current = 0;
        const vid = videoRef.current;

        if (count === 1) {
          if (region === "center") {
            if (vid) {
              if (vid.paused) { vid.play(); showHint("▶️ Play"); }
              else { vid.pause(); showHint("⏸ Pause"); }
            }
          }
        } else if (count === 3) {
          if (region === "center") {
            showHint("⏭ Next Video");
            onNextVideo?.();
          } else if (region === "right") {
            showHint("✖ Closing...");
            setTimeout(() => window.close(), 500);
          } else if (region === "left") {
            showHint("💬 Comments");
            onOpenComments?.();
          }
        }
      }, 350);
    },
    [getRegion, onNextVideo, onOpenComments]
  );

  // ── Download ──────────────────────────────────────────────────────────────
  const handleDownload = async () => {
    if (!user) {
      setDownloadMsg("Please sign in to download videos.");
      return;
    }
    setDownloading(true);
    setDownloadMsg("");
    try {
      // Check/track with backend
      const res = await axiosInstance.post("/download/track", {
        userid: user._id,
        videoid: video._id,
        videoTitle: video.videotitle,
        videoUrl: video.filepath,
      });

      if (res.data.canDownload) {
        // Build Cloudinary download URL using fl_attachment
        let downloadUrl = video.filepath;
        if (downloadUrl.includes("/upload/")) {
          downloadUrl = downloadUrl.replace("/upload/", "/upload/fl_attachment/");
        }
        const a = document.createElement("a");
        a.href = downloadUrl;
        a.download = `${video.videotitle}.mp4`;
        a.target = "_blank";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setDownloadMsg("✅ Download started!");
      }
    } catch (err: any) {
      setDownloadMsg(err.response?.data?.message || "Download failed.");
    } finally {
      setDownloading(false);
    }
  };

  const plan = user?.plan || "free";
  const limit = PLAN_LIMITS[plan] ?? PLAN_LIMITS.free;
  const limitLabel =
    limit > 0 ? `${limit / 60} min (${plan} plan)` : `Unlimited (${plan} plan)`;

  return (
    <div className="space-y-2">
      {/* Video container with gesture overlay */}
      <div
        ref={containerRef}
        className="relative aspect-video bg-black rounded-lg overflow-hidden select-none"
        onTouchEnd={handleTouchEnd}
      >
        <video
          ref={videoRef}
          className="w-full h-full"
          controls
          autoPlay={false}
          key={video._id}
        >
          <source src={video?.filepath} type="video/mp4" />
          Your browser does not support the video tag.
        </video>

        {/* Gesture hint overlay */}
        {showGestureHint && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="bg-black/70 text-white text-2xl font-bold px-6 py-3 rounded-xl">
              {showGestureHint}
            </div>
          </div>
        )}

        {/* Time limit reached overlay */}
        {timeLimitReached && (
          <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center text-white text-center px-6">
            <Crown className="w-10 h-10 text-yellow-400 mb-3" />
            <h3 className="text-xl font-bold mb-2">Watch limit reached</h3>
            <p className="text-sm text-gray-300 mb-4">
              Your <span className="capitalize font-semibold">{plan}</span> plan allows{" "}
              {limitLabel} of viewing per video.
            </p>
            <a
              href="/plans"
              className="bg-yellow-400 text-black font-semibold px-6 py-2 rounded-lg hover:bg-yellow-300"
            >
              Upgrade Plan
            </a>
          </div>
        )}

        {/* Gesture hints (desktop tip) */}
        <div className="absolute top-2 right-2 text-xs text-white/50 hidden md:block pointer-events-none">
          Touch: ◀◀ left | ▶▶ right | ■ center
        </div>
      </div>

      {/* Download button */}
      <div className="flex items-center gap-3">
        <button
          onClick={handleDownload}
          disabled={downloading}
          className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium transition disabled:opacity-50"
        >
          <Download className="w-4 h-4" />
          {downloading ? "Downloading..." : "Download"}
        </button>
        {downloadMsg && (
          <span className={`text-sm ${downloadMsg.startsWith("✅") ? "text-green-600" : "text-red-500"}`}>
            {downloadMsg}
          </span>
        )}
        {plan === "free" && (
          <a href="/plans" className="text-xs text-yellow-600 hover:underline flex items-center gap-1">
            <Crown className="w-3 h-3" /> Upgrade for unlimited
          </a>
        )}
      </div>
    </div>
  );
}
