import { useRef } from "react";

interface VideoPlayerProps {
  video: {
    _id: string;
    videotitle: string;
    filepath: string; // full Cloudinary URL
  };
}

export default function VideoPlayer({ video }: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);

  return (
    <div className="aspect-video bg-black rounded-lg overflow-hidden">
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
    </div>
  );
}
