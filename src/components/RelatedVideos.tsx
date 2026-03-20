import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { Avatar, AvatarFallback } from "./ui/avatar";

interface Video {
  _id: string;
  videotitle: string;
  videochanel: string;
  filepath: string; // full Cloudinary URL
  views: number;
  createdAt: string;
}

export default function RelatedVideos({ videos }: { videos: Video[] }) {
  if (!videos || videos.length === 0) {
    return <p className="text-sm text-gray-500">No related videos.</p>;
  }

  return (
    <div className="space-y-3">
      <h3 className="font-semibold text-sm text-gray-700 uppercase tracking-wide">Up next</h3>
      {videos.map((video) => (
        <Link key={video._id} href={`/watch/${video._id}`} className="flex gap-2 group">
          <div className="relative w-40 aspect-video bg-gray-100 rounded overflow-hidden flex-shrink-0">
            <video
              src={video.filepath}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
              preload="metadata"
            />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-medium text-sm line-clamp-2 group-hover:text-blue-600">
              {video.videotitle}
            </h3>
            <p className="text-xs text-gray-600 mt-1">{video.videochanel}</p>
            <p className="text-xs text-gray-600">
              {video.views?.toLocaleString()} views •{" "}
              {video.createdAt ? formatDistanceToNow(new Date(video.createdAt)) + " ago" : ""}
            </p>
          </div>
        </Link>
      ))}
    </div>
  );
}
