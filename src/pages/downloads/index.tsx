import React, { useEffect, useState } from "react";
import { useUser } from "@/lib/AuthContext";
import axiosInstance from "@/lib/axiosinstance";
import { Download, Crown, PlayCircle } from "lucide-react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";

interface DownloadRecord {
  _id: string;
  videoid: string;
  videoTitle: string;
  videoUrl: string;
  downloadedAt: string;
}

const DownloadsPage = () => {
  const { user } = useUser() as any;
  const [downloads, setDownloads] = useState<DownloadRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    axiosInstance
      .get(`/download/user/${user._id}`)
      .then((res) => setDownloads(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [user]);

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <Download className="w-12 h-12 text-gray-400 mb-4" />
        <h2 className="text-xl font-semibold text-gray-700 mb-2">Sign in to view downloads</h2>
        <p className="text-gray-500">Your downloaded videos will appear here.</p>
      </div>
    );
  }

  const plan = user?.plan || "free";
  const isPremium = ["gold", "premium"].includes(plan);

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Download className="w-6 h-6" />
          Downloads
        </h1>
        <div className="flex items-center gap-3">
          <span
            className={`px-3 py-1 rounded-full text-sm font-semibold capitalize ${
              isPremium
                ? "bg-yellow-100 text-yellow-800"
                : "bg-gray-100 text-gray-700"
            }`}
          >
            {isPremium && <Crown className="w-3 h-3 inline mr-1" />}
            {plan} plan
          </span>
          {!isPremium && (
            <Link
              href="/plans"
              className="text-sm text-blue-600 hover:underline flex items-center gap-1"
            >
              <Crown className="w-3.5 h-3.5" />
              Upgrade for unlimited
            </Link>
          )}
        </div>
      </div>

      {!isPremium && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6 flex items-start gap-3">
          <Crown className="w-5 h-5 text-yellow-600 mt-0.5" />
          <div>
            <p className="font-semibold text-yellow-800 text-sm">Free Plan Limit</p>
            <p className="text-yellow-700 text-sm">
              You can download <b>1 video per day</b>.{" "}
              <Link href="/plans" className="underline">
                Upgrade to Gold or Premium
              </Link>{" "}
              for unlimited downloads.
            </p>
          </div>
        </div>
      )}

      {loading ? (
        <div className="space-y-3 animate-pulse">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 bg-gray-100 rounded-lg" />
          ))}
        </div>
      ) : downloads.length === 0 ? (
        <div className="text-center py-16 text-gray-500">
          <Download className="w-12 h-12 mx-auto mb-3 text-gray-300" />
          <p>No downloads yet. Start downloading videos from the watch page!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {downloads.map((dl) => (
            <div
              key={dl._id}
              className="flex items-center gap-4 p-4 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition"
            >
              <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <PlayCircle className="w-5 h-5 text-gray-500" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm truncate">{dl.videoTitle || "Video"}</p>
                <p className="text-xs text-gray-500">
                  Downloaded {formatDistanceToNow(new Date(dl.downloadedAt))} ago
                </p>
              </div>
              <div className="flex gap-2">
                <Link
                  href={`/watch/${dl.videoid}`}
                  className="text-xs px-3 py-1.5 bg-gray-100 hover:bg-gray-200 rounded text-gray-700"
                >
                  Watch
                </Link>
                <a
                  href={dl.videoUrl?.replace("/upload/", "/upload/fl_attachment/") || "#"}
                  download={`${dl.videoTitle}.mp4`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded flex items-center gap-1"
                >
                  <Download className="w-3 h-3" />
                  Re-download
                </a>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default DownloadsPage;
