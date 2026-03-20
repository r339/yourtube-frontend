import React, { useState } from "react";
import { Avatar, AvatarFallback } from "./ui/avatar";
import { Button } from "./ui/button";

const ChannelHeader = ({ channel, user, onEditClick }: any) => {
  const [isSubscribed, setIsSubscribed] = useState(false);
  const isOwner = user && user._id === channel?._id;

  return (
    <div className="w-full">
      <div className="relative h-32 md:h-48 bg-gradient-to-r from-red-400 via-red-500 to-red-700" />

      <div className="px-4 py-6 border-b">
        <div className="flex flex-col md:flex-row gap-6 items-start">
          <Avatar className="w-24 h-24 md:w-32 md:h-32 border-4 border-white -mt-12 shadow-lg">
            <AvatarFallback className="text-3xl bg-red-100 text-red-600">
              {channel?.channelname?.[0]?.toUpperCase() || "C"}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1 space-y-1">
            <h1 className="text-2xl md:text-3xl font-bold">{channel?.channelname}</h1>
            <p className="text-sm text-gray-500">
              @{channel?.channelname?.toLowerCase().replace(/\s+/g, "")}
            </p>
            {channel?.description && (
              <p className="text-sm text-gray-700 max-w-2xl mt-2">{channel.description}</p>
            )}
          </div>

          <div className="flex gap-2">
            {isOwner ? (
              <Button variant="outline" onClick={onEditClick}>
                Edit channel
              </Button>
            ) : (
              <Button
                onClick={() => setIsSubscribed(!isSubscribed)}
                className={isSubscribed ? "bg-gray-200 text-black hover:bg-gray-300" : "bg-red-600 hover:bg-red-700 text-white"}
              >
                {isSubscribed ? "Subscribed" : "Subscribe"}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChannelHeader;
