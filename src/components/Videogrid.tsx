import React, { useEffect, useState } from "react";
import Videocard from "./videocard";
import axiosInstance from "@/lib/axiosinstance";

const Videogrid = () => {
  const [videos, setVideos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchVideos = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await axiosInstance.get("/video/getall");
      setVideos(res.data);
    } catch (err) {
      setError("Failed to load videos. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchVideos(); }, []);

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mt-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="space-y-3">
            <div className="aspect-video skeleton rounded-xl" />
            <div className="flex gap-3 px-1">
              <div className="w-9 h-9 rounded-full skeleton flex-shrink-0" />
              <div className="flex-1 space-y-2 pt-1">
                <div className="h-3.5 skeleton rounded w-full" />
                <div className="h-3.5 skeleton rounded w-3/4" />
                <div className="h-3 skeleton rounded w-1/2" />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center animate-fade-in">
        <div className="text-5xl mb-4">😕</div>
        <p className="text-lg font-medium mb-2" style={{ color: "hsl(var(--foreground))" }}>
          {error}
        </p>
        <button
          onClick={fetchVideos}
          className="mt-3 px-6 py-2 rounded-full text-sm font-semibold text-white bg-red-600 hover:bg-red-500 active:scale-95 transition-all"
        >
          Retry
        </button>
      </div>
    );
  }

  if (videos.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center animate-fade-in">
        <div className="text-5xl mb-4">🎬</div>
        <p className="text-lg font-medium" style={{ color: "hsl(var(--foreground))" }}>
          No videos yet
        </p>
        <p className="text-sm mt-1" style={{ color: "var(--muted-text)" }}>
          Be the first to upload something!
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-4 gap-y-6 mt-4">
      {videos.map((video: any) => (
        <Videocard key={video._id} video={video} />
      ))}
    </div>
  );
};

export default Videogrid;
