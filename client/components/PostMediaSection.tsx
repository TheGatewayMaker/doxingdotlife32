import { useState, useRef } from "react";
import { ChevronLeft, ChevronRight, Download, Maximize2 } from "lucide-react";
import { Play } from "lucide-react";

interface MediaFile {
  name: string;
  url: string;
  type: string;
}

interface PostMediaSectionProps {
  mediaFiles: MediaFile[];
  postTitle: string;
  thumbnailUrl?: string;
}

export default function PostMediaSection({
  mediaFiles,
  postTitle,
  thumbnailUrl,
}: PostMediaSectionProps) {
  const filteredMediaFiles = mediaFiles.filter(
    (file) => !thumbnailUrl || file.url !== thumbnailUrl,
  );

  const photos = filteredMediaFiles.filter((f) => f.type.startsWith("image/"));
  const videos = filteredMediaFiles.filter((f) => f.type.startsWith("video/"));

  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState(0);
  const [selectedVideoIndex, setSelectedVideoIndex] = useState(0);
  const [isPhotoFullscreen, setIsPhotoFullscreen] = useState(false);
  const photoContainerRef = useRef<HTMLDivElement>(null);

  if (photos.length === 0 && videos.length === 0) {
    return null;
  }

  const handlePhotoFullscreen = async () => {
    try {
      if (photoContainerRef.current) {
        if (!isPhotoFullscreen && photoContainerRef.current.requestFullscreen) {
          await photoContainerRef.current.requestFullscreen();
          setIsPhotoFullscreen(true);
        } else if (isPhotoFullscreen && document.fullscreenElement) {
          await document.exitFullscreen();
          setIsPhotoFullscreen(false);
        }
      }
    } catch (error) {
      console.error("Fullscreen error:", error);
    }
  };

  const handleDownload = (mediaFile: MediaFile) => {
    const link = document.createElement("a");
    link.href = mediaFile.url;
    link.download = mediaFile.name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-12">
      <div className="border-t border-border pt-8">
        <h2 className="text-3xl font-bold mb-8 flex items-center gap-2">
          <svg
            className="w-7 h-7 text-accent"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
            <circle cx="8.5" cy="8.5" r="1.5"></circle>
            <polyline points="21 15 16 10 5 21"></polyline>
          </svg>
          Attached Media
        </h2>

        {/* Photos Section */}
        {photos.length > 0 && (
          <div className="mb-12">
            <h3 className="text-2xl font-semibold mb-6 flex items-center gap-2 text-foreground">
              <span className="text-2xl">🖼️</span>
              Photos ({photos.length})
            </h3>

            {/* Photo Thumbnails Grid */}
            {photos.length > 1 && (
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3 mb-6">
                {photos.map((photo, idx) => (
                  <button
                    key={`${photo.name}-${idx}`}
                    onClick={() => setSelectedPhotoIndex(idx)}
                    className={`relative group rounded-lg overflow-hidden border-2 transition-all hover:border-accent aspect-square ${
                      selectedPhotoIndex === idx
                        ? "border-accent ring-2 ring-accent ring-offset-2 ring-offset-background"
                        : "border-border hover:border-accent/70"
                    }`}
                  >
                    <img
                      src={photo.url}
                      alt={photo.name}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                      loading="lazy"
                      crossOrigin="anonymous"
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                        <div className="bg-black/70 px-2 py-1 rounded text-white text-xs font-medium">
                          {idx + 1}
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}

            {/* Photo Viewer */}
            <div
              ref={photoContainerRef}
              className="bg-muted rounded-lg overflow-hidden border border-border"
            >
              <div className="relative bg-black flex items-center justify-center min-h-[400px]">
                <img
                  src={photos[selectedPhotoIndex].url}
                  alt={photos[selectedPhotoIndex].name}
                  className="max-w-full max-h-[600px] object-contain"
                  crossOrigin="anonymous"
                />
              </div>

              {/* Photo Info and Actions */}
              <div className="p-4 space-y-3 border-t border-border">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-foreground truncate">
                      {photos[selectedPhotoIndex].name}
                    </p>
                    {photos.length > 1 && (
                      <p className="text-xs text-muted-foreground mt-1">
                        {selectedPhotoIndex + 1} / {photos.length}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex gap-2 flex-wrap">
                  {photos.length > 1 && (
                    <>
                      <button
                        onClick={() =>
                          setSelectedPhotoIndex((prev) =>
                            prev === 0 ? photos.length - 1 : prev - 1,
                          )
                        }
                        className="px-3 py-2 bg-muted hover:bg-accent hover:text-accent-foreground text-muted-foreground rounded-lg transition-all text-sm font-medium"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() =>
                          setSelectedPhotoIndex((prev) =>
                            prev === photos.length - 1 ? 0 : prev + 1,
                          )
                        }
                        className="px-3 py-2 bg-muted hover:bg-accent hover:text-accent-foreground text-muted-foreground rounded-lg transition-all text-sm font-medium"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </>
                  )}
                  <button
                    onClick={handlePhotoFullscreen}
                    className="flex-1 px-4 py-2 bg-accent text-accent-foreground text-sm font-medium rounded-lg hover:bg-accent/90 transition-all flex items-center justify-center gap-2"
                  >
                    <Maximize2 className="w-4 h-4" />
                    Fullscreen
                  </button>
                  <button
                    onClick={() => handleDownload(photos[selectedPhotoIndex])}
                    className="flex-1 px-4 py-2 bg-muted text-foreground text-sm font-medium rounded-lg hover:bg-muted/80 transition-all flex items-center justify-center gap-2"
                  >
                    <Download className="w-4 h-4" />
                    Download
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Videos Section */}
        {videos.length > 0 && (
          <div>
            <h3 className="text-2xl font-semibold mb-6 flex items-center gap-2 text-foreground">
              <span className="text-2xl">🎬</span>
              Videos ({videos.length})
            </h3>

            {/* Video Thumbnails Grid */}
            {videos.length > 1 && (
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3 mb-6">
                {videos.map((video, idx) => (
                  <button
                    key={`${video.name}-${idx}`}
                    onClick={() => setSelectedVideoIndex(idx)}
                    className={`relative group rounded-lg overflow-hidden border-2 transition-all hover:border-accent aspect-square ${
                      selectedVideoIndex === idx
                        ? "border-accent ring-2 ring-accent ring-offset-2 ring-offset-background"
                        : "border-border hover:border-accent/70"
                    }`}
                  >
                    <div className="w-full h-full bg-muted flex items-center justify-center relative overflow-hidden">
                      <video
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                        crossOrigin="anonymous"
                        preload="metadata"
                        playsInline
                      >
                        <source src={video.url} type={video.type} />
                      </video>
                      <div className="absolute inset-0 bg-black/30 group-hover:bg-black/40 transition-colors flex items-center justify-center pointer-events-none">
                        <Play className="w-6 h-6 text-white fill-white" />
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}

            {/* Video Player */}
            <div className="bg-muted rounded-lg overflow-hidden border border-border">
              <div className="relative bg-black flex items-center justify-center min-h-[400px]">
                <video
                  controls
                  controlsList="nodownload"
                  preload="metadata"
                  className="w-full max-h-[600px] object-contain"
                  crossOrigin="anonymous"
                  playsInline
                >
                  <source
                    src={videos[selectedVideoIndex].url}
                    type={videos[selectedVideoIndex].type}
                  />
                  Your browser does not support the video tag.
                </video>
              </div>

              {/* Video Info and Actions */}
              <div className="p-4 space-y-3 border-t border-border">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-foreground truncate">
                      {videos[selectedVideoIndex].name}
                    </p>
                    {videos.length > 1 && (
                      <p className="text-xs text-muted-foreground mt-1">
                        {selectedVideoIndex + 1} / {videos.length}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex gap-2 flex-wrap">
                  {videos.length > 1 && (
                    <>
                      <button
                        onClick={() =>
                          setSelectedVideoIndex((prev) =>
                            prev === 0 ? videos.length - 1 : prev - 1,
                          )
                        }
                        className="px-3 py-2 bg-muted hover:bg-accent hover:text-accent-foreground text-muted-foreground rounded-lg transition-all text-sm font-medium"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() =>
                          setSelectedVideoIndex((prev) =>
                            prev === videos.length - 1 ? 0 : prev + 1,
                          )
                        }
                        className="px-3 py-2 bg-muted hover:bg-accent hover:text-accent-foreground text-muted-foreground rounded-lg transition-all text-sm font-medium"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </>
                  )}
                  <button
                    onClick={() => handleDownload(videos[selectedVideoIndex])}
                    className="flex-1 px-4 py-2 bg-muted text-foreground text-sm font-medium rounded-lg hover:bg-muted/80 transition-all flex items-center justify-center gap-2"
                  >
                    <Download className="w-4 h-4" />
                    Download
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
