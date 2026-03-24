"use client";
import React, { useEffect, useRef, useState, useCallback } from "react";
import { useUser } from "@/lib/AuthContext";
import axiosInstance from "@/lib/axiosinstance";
import {
  Video,
  VideoOff,
  Mic,
  MicOff,
  Monitor,
  PhoneOff,
  Phone,
  Circle,
  Square,
  X,
  Search,
} from "lucide-react";
import { io, Socket } from "socket.io-client";

const BACKEND_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5000";

interface VideoCallModalProps {
  onClose: () => void;
}

export default function VideoCallModal({ onClose }: VideoCallModalProps) {
  const { user } = useUser() as any;

  // Socket
  const socketRef = useRef<Socket | null>(null);
  const peerRef = useRef<RTCPeerConnection | null>(null);

  // Streams
  const localStreamRef = useRef<MediaStream | null>(null);
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const screenStreamRef = useRef<MediaStream | null>(null);

  // Recording
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);

  // UI state
  const [callState, setCallState] = useState<
    "idle" | "calling" | "incoming" | "in-call"
  >("idle");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [callerInfo, setCallerInfo] = useState<any>(null);
  const [targetUser, setTargetUser] = useState<any>(null);
  const [isVideoOn, setIsVideoOn] = useState(true);
  const [isAudioOn, setIsAudioOn] = useState(true);
  const [isSharingScreen, setIsSharingScreen] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [statusMsg, setStatusMsg] = useState("");
  const [onlineUsers, setOnlineUsers] = useState<string[]>([]);
  const [remotePeerId, setRemotePeerId] = useState("");

  // ── Initialize socket and local media ─────────────────────────────────────
  useEffect(() => {
    if (!user) return;

    // Get local camera/mic
    navigator.mediaDevices
      .getUserMedia({ video: true, audio: true })
      .then((stream) => {
        localStreamRef.current = stream;
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }
      })
      .catch(() => setStatusMsg("Camera/mic access denied."));

    // Connect socket
    const socket = io(BACKEND_URL, { transports: ["websocket"] });
    socketRef.current = socket;

    socket.on("connect", () => {
      socket.emit("register", user._id);
    });

    socket.on("online-users", (users: string[]) => {
      setOnlineUsers(users.filter((id) => id !== user._id));
    });

    socket.on("incoming-call", ({ from, signal, callerName }: any) => {
      setCallerInfo({ from, signal, callerName });
      setCallState("incoming");
    });

    socket.on("call-accepted", async ({ signal }: any) => {
      if (peerRef.current) {
        await peerRef.current.setRemoteDescription(
          new RTCSessionDescription(signal)
        );
      }
      setCallState("in-call");
      setStatusMsg("");
    });

    socket.on("call-rejected", () => {
      setStatusMsg("Call was rejected.");
      setCallState("idle");
      cleanupPeer();
    });

    socket.on("call-ended", () => {
      setStatusMsg("Call ended.");
      setCallState("idle");
      cleanupPeer();
    });

    socket.on("call-failed", ({ message }: any) => {
      setStatusMsg(message);
      setCallState("idle");
    });

    socket.on("ice-candidate", async ({ candidate }: any) => {
      if (peerRef.current && candidate) {
        await peerRef.current.addIceCandidate(new RTCIceCandidate(candidate)).catch(() => {});
      }
    });

    return () => {
      socket.disconnect();
      cleanupAll();
    };
  }, [user]);

  const createPeerConnection = useCallback((): RTCPeerConnection => {
    const pc = new RTCPeerConnection({
      iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
    });

    // Add local tracks
    localStreamRef.current?.getTracks().forEach((track) => {
      pc.addTrack(track, localStreamRef.current!);
    });

    // Receive remote stream
    pc.ontrack = (event) => {
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = event.streams[0];
      }
    };

    pc.onicecandidate = (event) => {
      if (event.candidate && remotePeerId) {
        socketRef.current?.emit("ice-candidate", {
          to: remotePeerId,
          candidate: event.candidate,
        });
      }
    };

    peerRef.current = pc;
    return pc;
  }, [remotePeerId]);

  // ── Call user ──────────────────────────────────────────────────────────────
  const handleCall = async (targetId: string) => {
    if (!localStreamRef.current) {
      setStatusMsg("Camera/mic not available.");
      return;
    }
    setRemotePeerId(targetId);
    setCallState("calling");
    setStatusMsg(`Calling...`);

    const pc = createPeerConnection();
    pc.onicecandidate = (event) => {
      if (event.candidate) {
        socketRef.current?.emit("ice-candidate", {
          to: targetId,
          candidate: event.candidate,
        });
      }
    };

    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);

    socketRef.current?.emit("call-user", {
      to: targetId,
      from: user._id,
      signal: offer,
      callerName: user.name,
    });
  };

  // ── Accept call ────────────────────────────────────────────────────────────
  const handleAccept = async () => {
    if (!callerInfo || !localStreamRef.current) return;
    setRemotePeerId(callerInfo.from);

    const pc = createPeerConnection();
    pc.onicecandidate = (event) => {
      if (event.candidate) {
        socketRef.current?.emit("ice-candidate", {
          to: callerInfo.from,
          candidate: event.candidate,
        });
      }
    };

    await pc.setRemoteDescription(
      new RTCSessionDescription(callerInfo.signal)
    );
    const answer = await pc.createAnswer();
    await pc.setLocalDescription(answer);

    socketRef.current?.emit("accept-call", {
      to: callerInfo.from,
      signal: answer,
    });

    setCallState("in-call");
    setStatusMsg("");
  };

  const handleReject = () => {
    if (callerInfo) {
      socketRef.current?.emit("reject-call", { to: callerInfo.from });
    }
    setCallState("idle");
    setCallerInfo(null);
  };

  const handleEndCall = () => {
    socketRef.current?.emit("end-call", { to: remotePeerId });
    setCallState("idle");
    cleanupPeer();
    setStatusMsg("Call ended.");
  };

  // ── Screen sharing ─────────────────────────────────────────────────────────
  const toggleScreenShare = async () => {
    if (isSharingScreen) {
      // Stop screen share, revert to camera
      screenStreamRef.current?.getTracks().forEach((t) => t.stop());
      screenStreamRef.current = null;
      const videoTrack = localStreamRef.current?.getVideoTracks()[0];
      if (videoTrack && peerRef.current) {
        const sender = peerRef.current
          .getSenders()
          .find((s) => s.track?.kind === "video");
        if (sender) await sender.replaceTrack(videoTrack);
      }
      setIsSharingScreen(false);
    } else {
      try {
        const screenStream = await navigator.mediaDevices.getDisplayMedia({
          video: true,
          audio: false,
        });
        screenStreamRef.current = screenStream;
        const screenTrack = screenStream.getVideoTracks()[0];

        // Replace video track in peer connection
        if (peerRef.current) {
          const sender = peerRef.current
            .getSenders()
            .find((s) => s.track?.kind === "video");
          if (sender) await sender.replaceTrack(screenTrack);
        }
        // Show in local preview
        if (localVideoRef.current) {
          const mixedStream = new MediaStream([
            screenTrack,
            ...(localStreamRef.current?.getAudioTracks() || []),
          ]);
          localVideoRef.current.srcObject = mixedStream;
        }
        // Auto-stop when user stops sharing
        screenTrack.onended = () => toggleScreenShare();
        setIsSharingScreen(true);
      } catch {
        setStatusMsg("Screen sharing cancelled or denied.");
      }
    }
  };

  // ── Recording ──────────────────────────────────────────────────────────────
  const startRecording = () => {
    if (!remoteVideoRef.current?.srcObject) {
      setStatusMsg("No call in progress to record.");
      return;
    }
    const stream = remoteVideoRef.current.srcObject as MediaStream;
    const localAudio = localStreamRef.current?.getAudioTracks() || [];
    const combined = new MediaStream([...stream.getTracks(), ...localAudio]);

    recordedChunksRef.current = [];
    const mr = new MediaRecorder(combined, { mimeType: "video/webm" });
    mr.ondataavailable = (e) => {
      if (e.data.size > 0) recordedChunksRef.current.push(e.data);
    };
    mr.onstop = () => {
      const blob = new Blob(recordedChunksRef.current, { type: "video/webm" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `yourtube-call-${Date.now()}.webm`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    };
    mr.start();
    mediaRecorderRef.current = mr;
    setIsRecording(true);
  };

  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
    mediaRecorderRef.current = null;
    setIsRecording(false);
    setStatusMsg("Recording saved to your device.");
  };

  // ── Toggle camera/mic ──────────────────────────────────────────────────────
  const toggleVideo = () => {
    const track = localStreamRef.current?.getVideoTracks()[0];
    if (track) { track.enabled = !track.enabled; setIsVideoOn(track.enabled); }
  };

  const toggleAudio = () => {
    const track = localStreamRef.current?.getAudioTracks()[0];
    if (track) { track.enabled = !track.enabled; setIsAudioOn(track.enabled); }
  };

  // ── Cleanup ────────────────────────────────────────────────────────────────
  const cleanupPeer = () => {
    peerRef.current?.close();
    peerRef.current = null;
    if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null;
  };

  const cleanupAll = () => {
    cleanupPeer();
    localStreamRef.current?.getTracks().forEach((t) => t.stop());
    screenStreamRef.current?.getTracks().forEach((t) => t.stop());
    mediaRecorderRef.current?.stop();
  };

  // ── Search users ────────────────────────────────────────────────────────────
  const handleSearch = async (q: string) => {
    setSearchQuery(q);
    if (!q.trim()) { setSearchResults([]); return; }
    try {
      // Search via all users – we piggyback on channel search by fetching all and filtering
      const res = await axiosInstance.get(`/video/getall`);
      // Get unique uploader names containing query (simple approach)
      const uploaders = Array.from(new Map(res.data.map((v: any) => [v.uploader, v])).values());
      const filtered = uploaders.filter((v: any) =>
        v.videochanel?.toLowerCase().includes(q.toLowerCase())
      );
      setSearchResults(filtered.slice(0, 5));
    } catch {}
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
      <div className="bg-gray-900 text-white rounded-2xl w-full max-w-4xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-700">
          <h2 className="text-lg font-bold flex items-center gap-2">
            <Video className="w-5 h-5 text-blue-400" />
            Video Call
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* Video area */}
          <div className="flex-1 p-4 flex flex-col gap-3">
            <div className="grid grid-cols-2 gap-3 flex-1">
              {/* Local video */}
              <div className="relative bg-black rounded-xl overflow-hidden aspect-video">
                <video
                  ref={localVideoRef}
                  autoPlay
                  muted
                  playsInline
                  className="w-full h-full object-cover"
                />
                <div className="absolute bottom-2 left-2 bg-black/60 text-white text-xs px-2 py-1 rounded">
                  You {isSharingScreen && "• Sharing screen"}
                </div>
              </div>

              {/* Remote video */}
              <div className="relative bg-gray-800 rounded-xl overflow-hidden aspect-video flex items-center justify-center">
                <video
                  ref={remoteVideoRef}
                  autoPlay
                  playsInline
                  className="w-full h-full object-cover"
                />
                {callState !== "in-call" && (
                  <div className="absolute inset-0 flex items-center justify-center text-gray-500">
                    <Video className="w-8 h-8" />
                  </div>
                )}
                {callState === "in-call" && (
                  <div className="absolute bottom-2 left-2 bg-black/60 text-white text-xs px-2 py-1 rounded">
                    Remote
                  </div>
                )}
              </div>
            </div>

            {/* Status */}
            {statusMsg && (
              <p className="text-sm text-center text-yellow-400">{statusMsg}</p>
            )}

            {/* Controls */}
            {callState === "in-call" ? (
              <div className="flex items-center justify-center gap-3 flex-wrap">
                <button
                  onClick={toggleAudio}
                  className={`p-3 rounded-full ${isAudioOn ? "bg-gray-700" : "bg-red-600"}`}
                  title="Toggle mic"
                >
                  {isAudioOn ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
                </button>
                <button
                  onClick={toggleVideo}
                  className={`p-3 rounded-full ${isVideoOn ? "bg-gray-700" : "bg-red-600"}`}
                  title="Toggle camera"
                >
                  {isVideoOn ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
                </button>
                <button
                  onClick={toggleScreenShare}
                  className={`p-3 rounded-full ${isSharingScreen ? "bg-blue-600" : "bg-gray-700"}`}
                  title="Share screen"
                >
                  <Monitor className="w-5 h-5" />
                </button>
                <button
                  onClick={isRecording ? stopRecording : startRecording}
                  className={`p-3 rounded-full flex items-center gap-1 ${isRecording ? "bg-red-600" : "bg-gray-700"}`}
                  title="Record call"
                >
                  {isRecording ? <Square className="w-5 h-5" /> : <Circle className="w-5 h-5 text-red-400" />}
                </button>
                <button
                  onClick={handleEndCall}
                  className="p-3 rounded-full bg-red-600 hover:bg-red-700"
                  title="End call"
                >
                  <PhoneOff className="w-5 h-5" />
                </button>
              </div>
            ) : callState === "calling" ? (
              <div className="flex items-center justify-center gap-3">
                <div className="animate-pulse text-sm text-gray-400">Ringing...</div>
                <button
                  onClick={handleEndCall}
                  className="p-3 rounded-full bg-red-600"
                >
                  <PhoneOff className="w-5 h-5" />
                </button>
              </div>
            ) : callState === "incoming" ? (
              <div className="flex flex-col items-center gap-3">
                <p className="text-white font-semibold">
                  📞 {callerInfo?.callerName} is calling...
                </p>
                <div className="flex gap-4">
                  <button
                    onClick={handleAccept}
                    className="px-6 py-2.5 bg-green-600 hover:bg-green-700 rounded-full flex items-center gap-2 font-semibold"
                  >
                    <Phone className="w-4 h-4" /> Accept
                  </button>
                  <button
                    onClick={handleReject}
                    className="px-6 py-2.5 bg-red-600 hover:bg-red-700 rounded-full flex items-center gap-2 font-semibold"
                  >
                    <PhoneOff className="w-4 h-4" /> Reject
                  </button>
                </div>
              </div>
            ) : (
              <p className="text-center text-gray-500 text-sm">
                Search for a user to call, or wait for an incoming call.
              </p>
            )}
          </div>

          {/* Contacts panel */}
          <div className="w-64 border-l border-gray-700 p-4 flex flex-col gap-3 overflow-y-auto">
            <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wide">
              Find & Call
            </h3>
            <div className="relative">
              <Search className="absolute left-2 top-2.5 w-4 h-4 text-gray-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                placeholder="Search channels..."
                className="w-full bg-gray-800 border border-gray-700 rounded-lg pl-8 pr-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            {/* Search results */}
            <div className="space-y-2">
              {searchResults.map((result: any) => (
                <div
                  key={result.uploader}
                  className="flex items-center justify-between p-2 bg-gray-800 rounded-lg"
                >
                  <div>
                    <p className="text-sm font-medium">{result.videochanel}</p>
                    <p className="text-xs text-gray-500">
                      {onlineUsers.includes(result.uploader) ? (
                        <span className="text-green-400">● Online</span>
                      ) : (
                        <span className="text-gray-600">● Offline</span>
                      )}
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      if (!onlineUsers.includes(result.uploader)) {
                        setStatusMsg("User is offline.");
                        return;
                      }
                      handleCall(result.uploader);
                    }}
                    disabled={callState !== "idle" || result.uploader === user?._id}
                    className="p-2 bg-green-600 hover:bg-green-700 rounded-full disabled:opacity-40"
                  >
                    <Phone className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
              {searchQuery && searchResults.length === 0 && (
                <p className="text-xs text-gray-600 text-center">No channels found</p>
              )}
            </div>

            {/* Screen share tip */}
            <div className="mt-auto p-3 bg-gray-800 rounded-lg">
              <p className="text-xs text-gray-400 font-semibold mb-1">💡 Screen Share Tip</p>
              <p className="text-xs text-gray-500">
                Click the screen share button during a call to share a YouTube tab or any window.
              </p>
            </div>

            {/* Recording tip */}
            <div className="p-3 bg-gray-800 rounded-lg">
              <p className="text-xs text-gray-400 font-semibold mb-1">⏺ Recording</p>
              <p className="text-xs text-gray-500">
                Click the record button to save the call to your device as a .webm file.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
