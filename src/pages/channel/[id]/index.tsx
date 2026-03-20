import ChannelHeader from "@/components/ChannelHeader";
import ChannelVideos from "@/components/ChannelVideos";
import VideoUploader from "@/components/VideoUploader";
import Channeldialogue from "@/components/channeldialogue";
import { useUser } from "@/lib/AuthContext";
import { useRouter } from "next/router";
import React, { useEffect, useState } from "react";
import axiosInstance from "@/lib/axiosinstance";

const ChannelPage = () => {
  const router = useRouter();
  const { id } = router.query;
  const { user } = useUser();
  const [channelVideos, setChannelVideos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEditOpen, setIsEditOpen] = useState(false);

  const isOwner = user && user._id === id;
  const channel = isOwner ? user : null;

  useEffect(() => {
    if (!id || typeof id !== "string") return;
    const fetchVideos = async () => {
      try {
        const res = await axiosInstance.get(`/video/uploader/${id}`);
        setChannelVideos(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchVideos();
  }, [id]);

  if (!channel && !loading) {
    return (
      <div className="text-center py-20">
        <h2 className="text-xl font-semibold text-gray-600">Channel not found</h2>
      </div>
    );
  }

  return (
    <div className="flex-1 min-h-screen bg-white">
      <div className="max-w-full mx-auto">
        {channel && (
          <ChannelHeader
            channel={channel}
            user={user}
            onEditClick={() => setIsEditOpen(true)}
          />
        )}

        {isOwner && (
          <div className="px-6 py-4">
            <VideoUploader channelId={id} channelName={user?.channelname} />
          </div>
        )}

        <div className="px-6 py-4">
          {loading ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[1,2,3,4].map(i => <div key={i} className="animate-pulse aspect-video bg-gray-200 rounded-lg" />)}
            </div>
          ) : (
            <ChannelVideos videos={channelVideos} />
          )}
        </div>
      </div>

      <Channeldialogue
        isopen={isEditOpen}
        onclose={() => setIsEditOpen(false)}
        channeldata={user}
        mode="edit"
      />
    </div>
  );
};

export default ChannelPage;
