import Comments from "@/components/Comments";
import RelatedVideos from "@/components/RelatedVideos";
import VideoInfo from "@/components/VideoInfo";
import VideoPlayer from "@/components/Videopplayer";
import axiosInstance from "@/lib/axiosinstance";
import { useRouter } from "next/router";
import React, { useEffect, useRef, useState } from "react";
import { Video } from "lucide-react";
import dynamic from "next/dynamic";

const VideoCallModal = dynamic(() => import("@/components/VideoCallModal"), { ssr: false });

const WatchPage = () => {
  const router = useRouter();
  const { id } = router.query;
  const [video, setVideo] = useState<any>(null);
  const [allVideos, setAllVideos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [showCallModal, setShowCallModal] = useState(false);
  const commentsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!id || typeof id !== "string") return;
    const fetchData = async () => {
      try {
        const res = await axiosInstance.get("/video/getall");
        const allVids = res.data;
        const current = allVids.find((v: any) => v._id === id);
        if (!current) {
          setNotFound(true);
        } else {
          setVideo(current);
          setAllVideos(allVids.filter((v: any) => v._id !== id));
        }
      } catch (err) {
        console.error(err);
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  const handleNextVideo = () => {
    if (allVideos.length > 0) {
      router.push(`/watch/${allVideos[0]._id}`);
    }
  };

  const handleOpenComments = () => {
    commentsRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto p-4 animate-pulse">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <div className="aspect-video bg-gray-200 rounded-lg" />
            <div className="h-6 bg-gray-200 rounded w-3/4" />
            <div className="h-4 bg-gray-200 rounded w-1/2" />
          </div>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex gap-2">
                <div className="w-40 aspect-video bg-gray-200 rounded" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 bg-gray-200 rounded" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (notFound || !video) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <h2 className="text-2xl font-semibold text-gray-700 mb-2">Video not found</h2>
        <p className="text-gray-500">This video may have been removed or doesn't exist.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <div className="max-w-7xl mx-auto p-4">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <VideoPlayer
              video={video}
              onNextVideo={handleNextVideo}
              onOpenComments={handleOpenComments}
              relatedVideos={allVideos}
            />
            <div className="flex items-center justify-between">
              <VideoInfo video={video} />
              <button
                onClick={() => setShowCallModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium"
              >
                <Video className="w-4 h-4" />
                Video Call
              </button>
            </div>
            <div ref={commentsRef}>
              <Comments videoId={id} />
            </div>
          </div>
          <div className="space-y-4">
            <RelatedVideos videos={allVideos} />
          </div>
        </div>
      </div>

      {showCallModal && (
        <VideoCallModal onClose={() => setShowCallModal(false)} />
      )}
    </div>
  );
};

export default WatchPage;
