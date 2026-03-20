import React, { useEffect, useState } from "react";
import { Avatar, AvatarFallback } from "./ui/avatar";
import { Button } from "./ui/button";
import { Clock, Download, MoreHorizontal, Share, ThumbsDown, ThumbsUp } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { useUser } from "@/lib/AuthContext";
import axiosInstance from "@/lib/axiosinstance";

const VideoInfo = ({ video }: any) => {
  const [likes, setLikes] = useState(video.Like || 0);
  const [dislikes, setDislikes] = useState(video.Dislike || 0);
  const [isLiked, setIsLiked] = useState(false);
  const [isDisliked, setIsDisliked] = useState(false);
  const [showFullDescription, setShowFullDescription] = useState(false);
  const [isWatchLater, setIsWatchLater] = useState(false);
  const { user } = useUser();

  useEffect(() => {
    setLikes(video.Like || 0);
    setDislikes(video.Dislike || 0);
    setIsLiked(false);
    setIsDisliked(false);
  }, [video]);

  useEffect(() => {
    const trackView = async () => {
      try {
        if (user) {
          await axiosInstance.post(`/history/${video._id}`, { userId: user._id });
        } else {
          await axiosInstance.post(`/history/views/${video._id}`);
        }
      } catch (err) {
        // silently fail — view tracking is non-critical
      }
    };
    if (video._id) trackView();
  }, [video._id, user]);

  const handleLike = async () => {
    if (!user) return;
    try {
      const res = await axiosInstance.post(`/like/${video._id}`, { userId: user._id });
      if (res.data.liked) {
        setLikes((p: number) => p + 1);
        setIsLiked(true);
        if (isDisliked) {
          setDislikes((p: number) => p - 1);
          setIsDisliked(false);
        }
      } else {
        setLikes((p: number) => p - 1);
        setIsLiked(false);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDislike = async () => {
    if (!user) return;
    try {
      setDislikes((p: number) => isDisliked ? p - 1 : p + 1);
      setIsDisliked((prev) => !prev);
      if (!isDisliked && isLiked) {
        setLikes((p: number) => p - 1);
        setIsLiked(false);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleWatchLater = async () => {
    if (!user) return;
    try {
      const res = await axiosInstance.post(`/watch/${video._id}`, { userId: user._id });
      setIsWatchLater(res.data.watchlater);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">{video.videotitle}</h1>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-4">
          <Avatar className="w-10 h-10">
            <AvatarFallback>{video.videochanel?.[0]?.toUpperCase()}</AvatarFallback>
          </Avatar>
          <div>
            <h3 className="font-medium">{video.videochanel}</h3>
            <p className="text-sm text-gray-600">Upload channel</p>
          </div>
          <Button className="ml-4 bg-black text-white hover:bg-gray-800">Subscribe</Button>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center bg-gray-100 rounded-full">
            <Button
              variant="ghost"
              size="sm"
              className={`rounded-l-full gap-2 ${isLiked ? "bg-gray-200" : ""}`}
              onClick={handleLike}
              title={user ? "Like" : "Sign in to like"}
            >
              <ThumbsUp className={`w-5 h-5 ${isLiked ? "fill-black" : ""}`} />
              {likes.toLocaleString()}
            </Button>
            <div className="w-px h-6 bg-gray-300" />
            <Button
              variant="ghost"
              size="sm"
              className={`rounded-r-full gap-2 ${isDisliked ? "bg-gray-200" : ""}`}
              onClick={handleDislike}
              title={user ? "Dislike" : "Sign in to dislike"}
            >
              <ThumbsDown className={`w-5 h-5 ${isDisliked ? "fill-black" : ""}`} />
              {dislikes.toLocaleString()}
            </Button>
          </div>

          <Button
            variant="ghost"
            size="sm"
            className={`bg-gray-100 rounded-full gap-2 ${isWatchLater ? "bg-gray-200" : ""}`}
            onClick={handleWatchLater}
          >
            <Clock className="w-5 h-5" />
            {isWatchLater ? "Saved" : "Watch Later"}
          </Button>

          <Button variant="ghost" size="sm" className="bg-gray-100 rounded-full gap-2">
            <Share className="w-5 h-5" />
            Share
          </Button>

          <Button variant="ghost" size="icon" className="bg-gray-100 rounded-full">
            <MoreHorizontal className="w-5 h-5" />
          </Button>
        </div>
      </div>

      <div className="bg-gray-100 rounded-lg p-4">
        <div className="flex gap-4 text-sm font-medium mb-2">
          <span>{video.views?.toLocaleString()} views</span>
          {video.createdAt && (
            <span>{formatDistanceToNow(new Date(video.createdAt))} ago</span>
          )}
        </div>
        <div className={`text-sm ${showFullDescription ? "" : "line-clamp-3"}`}>
          <p>{video.videotitle} — uploaded to {video.videochanel}.</p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="mt-2 p-0 h-auto font-medium"
          onClick={() => setShowFullDescription(!showFullDescription)}
        >
          {showFullDescription ? "Show less" : "Show more"}
        </Button>
      </div>
    </div>
  );
};

export default VideoInfo;
