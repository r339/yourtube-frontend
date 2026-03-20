import { Check, FileVideo, Upload, X } from "lucide-react";
import React, { ChangeEvent, useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Progress } from "./ui/progress";
import axiosInstance from "@/lib/axiosinstance";

const VideoUploader = ({ channelId, channelName }: { channelId: any; channelName: string }) => {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoTitle, setVideoTitle] = useState("");
  const [uploadComplete, setUploadComplete] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("video/")) {
      toast.error("Please upload a valid video file.");
      return;
    }
    if (file.size > 100 * 1024 * 1024) {
      toast.error("File size exceeds 100MB limit.");
      return;
    }
    setVideoFile(file);
    if (!videoTitle) setVideoTitle(file.name.replace(/\.[^.]+$/, ""));
  };

  const resetForm = () => {
    setVideoFile(null);
    setVideoTitle("");
    setIsUploading(false);
    setUploadProgress(0);
    setUploadComplete(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleUpload = async () => {
    if (!videoFile || !videoTitle.trim()) {
      toast.error("Please provide a video file and title.");
      return;
    }
    if (!channelName) {
      toast.error("Channel name is missing.");
      return;
    }

    const formData = new FormData();
    formData.append("file", videoFile);
    formData.append("videotitle", videoTitle.trim());
    formData.append("videochanel", channelName);
    formData.append("uploader", channelId);

    try {
      setIsUploading(true);
      setUploadProgress(0);
      await axiosInstance.post("/video/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
        onUploadProgress: (event: any) => {
          if (event.total) {
            setUploadProgress(Math.round((event.loaded * 100) / event.total));
          }
        },
      });
      setUploadComplete(true);
      toast.success("Video uploaded successfully!");
      setTimeout(resetForm, 2000);
    } catch (err: any) {
      const msg = err?.response?.data?.message || "Upload failed. Please try again.";
      toast.error(msg);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="bg-gray-50 rounded-lg p-6 border">
      <h2 className="text-xl font-semibold mb-4">Upload a Video</h2>

      {!videoFile ? (
        <div
          className="border-2 border-dashed border-gray-300 rounded-lg p-10 text-center cursor-pointer hover:bg-gray-100 transition-colors"
          onClick={() => fileInputRef.current?.click()}
        >
          <Upload className="w-12 h-12 mx-auto text-gray-400 mb-3" />
          <p className="text-lg font-medium">Drag and drop or click to upload</p>
          <p className="text-xs text-gray-400 mt-2">MP4, WebM, MOV, AVI • Max 100MB</p>
          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            accept="video/*"
            onChange={handleFileChange}
          />
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center gap-3 p-3 bg-white rounded-lg border">
            <div className="bg-blue-100 p-2 rounded-md">
              <FileVideo className="w-6 h-6 text-blue-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium truncate">{videoFile.name}</p>
              <p className="text-sm text-gray-500">
                {(videoFile.size / (1024 * 1024)).toFixed(2)} MB
              </p>
            </div>
            {uploadComplete ? (
              <div className="bg-green-100 p-1 rounded-full">
                <Check className="w-5 h-5 text-green-600" />
              </div>
            ) : (
              !isUploading && (
                <Button variant="ghost" size="icon" onClick={resetForm}>
                  <X className="w-5 h-5" />
                </Button>
              )
            )}
          </div>

          <div>
            <Label htmlFor="title">Video Title (required)</Label>
            <Input
              id="title"
              value={videoTitle}
              onChange={(e) => setVideoTitle(e.target.value)}
              placeholder="Add a title that describes your video"
              disabled={isUploading || uploadComplete}
              className="mt-1"
            />
          </div>

          {isUploading && (
            <div className="space-y-1">
              <div className="flex justify-between text-sm text-gray-600">
                <span>Uploading...</span>
                <span>{uploadProgress}%</span>
              </div>
              <Progress value={uploadProgress} className="h-2" />
            </div>
          )}

          {!uploadComplete && (
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={resetForm} disabled={isUploading}>
                Cancel
              </Button>
              <Button
                onClick={handleUpload}
                disabled={isUploading || !videoTitle.trim()}
              >
                {isUploading ? "Uploading..." : "Upload"}
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default VideoUploader;
