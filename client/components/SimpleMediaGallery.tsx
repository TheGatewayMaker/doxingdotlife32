import { useState, useRef, useEffect } from "react";
import { ChevronLeft, ChevronRight, X, Maximize2 } from "lucide-react";

interface MediaFile {
  name: string;
  url: string;
  type: string;
}

interface SimpleMediaGalleryProps {
  mediaFiles: MediaFile[];
  postTitle: string;
  thumbnails?: { [key: string]: string };
  thumbnailUrl?: string;
}

const getMediaIcon = (type: string): string => {
  if (type.startsWith("image/")) return "🖼️";
  if (type.startsWith("video/")) return "🎬";
  if (type.startsWith("audio/")) return "🎵";
  return "📄";
};

export default function SimpleMediaGallery({
  mediaFiles,
  postTitle,
  thumbnails = {},
  thumbnailUrl,
}: SimpleMediaGalleryProps) {
  // Filter out the thumbnail from the media files
  const filteredMediaFiles = mediaFiles.filter(
    (file) => !thumbnailUrl || file.url !== thumbnailUrl,
  );

  const [selectedMediaIndex, setSelectedMediaIndex] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const mediaContainerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  if (filteredMediaFiles.length === 0) return null;

  const currentMedia = filteredMediaFiles[selectedMediaIndex];
  const isImage = currentMedia.type.startsWith("image/");
  const isVideo = currentMedia.type.startsWith("video/");
  const isAudio = currentMedia.type.startsWith("audio/");

  const handleFullscreen = async () => {
    try {
      if (mediaContainerRef.current) {
        if (!isFullscreen && mediaContainerRef.current.requestFullscreen) {
          await mediaContainerRef.current.requestFullscreen();
          setIsFullscreen(true);
        } else if (isFullscreen && document.fullscreenElement) {
          await document.exitFullscreen();
          setIsFullscreen(false);
        }
      }
    } catch (error) {
      console.error("Fullscreen error:", error);
    }
  };

  const handleKeyPress = (e: KeyboardEvent) => {
    if (filteredMediaFiles.length <= 1) return;

    if (e.key === "ArrowLeft") {
      setSelectedMediaIndex((prev) =>
        prev === 0 ? filteredMediaFiles.length - 1 : prev - 1,
      );
    } else if (e.key === "ArrowRight") {
      setSelectedMediaIndex((prev) =>
        prev === filteredMediaFiles.length - 1 ? 0 : prev + 1,
      );
    } else if (
      e.key === "Escape" &&
      isFullscreen &&
      document.fullscreenElement
    ) {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  useEffect(() => {
    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [filteredMediaFiles.length, isFullscreen]);

  const handleDownload = () => {
    const link = document.createElement("a");
    link.href = currentMedia.url;
    link.download = currentMedia.name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleOpenNewTab = () => {
    window.open(currentMedia.url, "_blank");
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3 pb-4 border-b border-border">
        <svg
          className="w-6 h-6 text-accent"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
          <circle cx="8.5" cy="8.5" r="1.5"></circle>
          <polyline points="21 15 16 10 5 21"></polyline>
        </svg>
        <h2 className="text-2xl font-bold">Attached Media</h2>
        <span className="ml-auto text-sm font-medium text-muted-foreground bg-muted px-3 py-1 rounded-full">
          {filteredMediaFiles.length} file
          {filteredMediaFiles.length !== 1 ? "s" : ""}
        </span>
      </div>

      {/* Thumbnail Grid */}
      {filteredMediaFiles.length > 1 && (
        <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 gap-2">
          {filteredMediaFiles.map((file, idx) => {
            const isImg = file.type.startsWith("image/");
            const isVid = file.type.startsWith("video/");
            const isSelected = selectedMediaIndex === idx;

            return (
              <div key={`${file.name}-${idx}`}>
                {isImg ? (
                  <a
                    href={file.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => {
                      e.preventDefault();
                      setSelectedMediaIndex(idx);
                    }}
                    className={`relative group rounded-lg overflow-hidden border-2 transition-all hover:border-accent cursor-pointer block ${
                      isSelected
                        ? "border-accent ring-2 ring-accent ring-offset-2 ring-offset-background"
                        : "border-border hover:border-accent/70"
                    }`}
                  >
                    <img
                      src={file.url}
                      alt={file.name}
                      className="w-full aspect-square object-cover group-hover:scale-110 transition-transform duration-300"
                      loading="lazy"
                      crossOrigin="anonymous"
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                        <div className="bg-black/70 px-3 py-1.5 rounded text-white text-xs font-medium">
                          Click to preview
                        </div>
                      </div>
                    </div>
                    <div className="absolute top-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
                      {idx + 1}
                    </div>
                  </a>
                ) : isVid ? (
                  <button
                    onClick={() => setSelectedMediaIndex(idx)}
                    className={`relative group rounded-lg overflow-hidden border-2 transition-all hover:border-accent cursor-pointer w-full ${
                      isSelected
                        ? "border-accent ring-2 ring-accent ring-offset-2 ring-offset-background"
                        : "border-border hover:border-accent/70"
                    }`}
                  >
                    <div className="w-full aspect-square bg-muted flex items-center justify-center relative overflow-hidden">
                      <video
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                        crossOrigin="anonymous"
                        preload="metadata"
                        playsInline
                      >
                        <source src={file.url} type={file.type} />
                      </video>
                      <div className="absolute inset-0 bg-black/30 group-hover:bg-black/40 transition-colors flex items-center justify-center pointer-events-none">
                        <div className="text-3xl drop-shadow-lg">▶️</div>
                      </div>
                    </div>
                    <div className="absolute top-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
                      {idx + 1}
                    </div>
                  </button>
                ) : (
                  <button
                    onClick={() => setSelectedMediaIndex(idx)}
                    className={`relative group rounded-lg border-2 transition-all hover:border-accent cursor-pointer w-full ${
                      isSelected
                        ? "border-accent ring-2 ring-accent ring-offset-2 ring-offset-background"
                        : "border-border hover:border-accent/70"
                    }`}
                  >
                    <div className="w-full aspect-square bg-muted flex flex-col items-center justify-center gap-2 group-hover:bg-muted/80 transition-colors">
                      <div className="text-3xl">{getMediaIcon(file.type)}</div>
                      <p className="text-xs text-muted-foreground px-2 text-center truncate font-medium">
                        {file.name}
                      </p>
                    </div>
                    <div className="absolute top-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
                      {idx + 1}
                    </div>
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Current Media Preview */}
      {filteredMediaFiles.length > 0 && (
        <div className="bg-muted rounded-lg overflow-hidden border border-border">
          <div
            ref={mediaContainerRef}
            className="relative bg-black flex flex-col"
          >
            {isImage && (
              <div className="relative w-full">
                <img
                  src={currentMedia.url}
                  alt={currentMedia.name}
                  className="w-full max-h-[500px] object-contain cursor-pointer hover:opacity-95 transition-opacity"
                  onClick={handleOpenNewTab}
                  crossOrigin="anonymous"
                />
                <div className="absolute inset-0 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center bg-black/40 cursor-pointer">
                  <div className="bg-black/70 px-4 py-2 rounded text-white text-sm font-medium flex items-center gap-2">
                    <Maximize2 className="w-4 h-4" />
                    Click to open
                  </div>
                </div>
              </div>
            )}

            {isVideo && (
              <div className="relative w-full">
                <video
                  ref={videoRef}
                  controls
                  controlsList="nodownload"
                  preload="metadata"
                  className="w-full max-h-[600px] object-contain bg-black"
                  crossOrigin="anonymous"
                  playsInline
                >
                  <source src={currentMedia.url} type={currentMedia.type} />
                  Your browser does not support the video tag.
                </video>
              </div>
            )}

            {isAudio && (
              <div className="w-full px-6 py-12 flex flex-col items-center justify-center gap-4">
                <div className="text-6xl">🎵</div>
                <div className="w-full">
                  <audio
                    controls
                    preload="metadata"
                    className="w-full"
                    crossOrigin="anonymous"
                  >
                    <source src={currentMedia.url} type={currentMedia.type} />
                    Your browser does not support the audio element.
                  </audio>
                </div>
              </div>
            )}

            {/* Media Counter */}
            {filteredMediaFiles.length > 1 && (
              <div className="absolute bottom-4 right-4 bg-black/70 text-white px-4 py-2 rounded-full text-sm font-medium">
                {selectedMediaIndex + 1} / {filteredMediaFiles.length}
              </div>
            )}
          </div>

          {/* Media Info and Actions */}
          <div className="p-5 space-y-4 border-t border-border">
            {/* File Info */}
            <div className="space-y-2">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-foreground truncate break-words">
                    {currentMedia.name}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {currentMedia.type}
                  </p>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 flex-wrap">
              <button
                onClick={handleOpenNewTab}
                className="flex-1 min-w-[120px] px-4 py-2 bg-accent text-accent-foreground text-sm font-medium rounded-lg hover:bg-accent/90 transition-all"
              >
                Open
              </button>
              <button
                onClick={handleDownload}
                className="flex-1 min-w-[120px] px-4 py-2 bg-muted text-foreground text-sm font-medium rounded-lg hover:bg-muted/80 transition-all"
              >
                Download
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Navigation for multiple media files */}
      {filteredMediaFiles.length > 1 && (
        <div className="flex flex-col sm:flex-row justify-center items-center gap-4 pt-4">
          <button
            onClick={() =>
              setSelectedMediaIndex((prev) =>
                prev === 0 ? filteredMediaFiles.length - 1 : prev - 1,
              )
            }
            className="p-2.5 bg-muted hover:bg-accent hover:text-accent-foreground text-muted-foreground rounded-lg transition-all hover:scale-110 active:scale-95"
            title="Previous (← Arrow Key)"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>

          <div className="flex items-center gap-3 flex-wrap justify-center">
            {filteredMediaFiles.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setSelectedMediaIndex(idx)}
                className={`transition-all rounded-full ${
                  selectedMediaIndex === idx
                    ? "bg-accent w-8 h-8"
                    : "bg-muted hover:bg-accent/40 w-2.5 h-2.5 hover:w-3 hover:h-3"
                }`}
                aria-label={`Go to media ${idx + 1}`}
                title={`File ${idx + 1}: ${filteredMediaFiles[idx].name}`}
              />
            ))}
          </div>

          <button
            onClick={() =>
              setSelectedMediaIndex((prev) =>
                prev === filteredMediaFiles.length - 1 ? 0 : prev + 1,
              )
            }
            className="p-2.5 bg-muted hover:bg-accent hover:text-accent-foreground text-muted-foreground rounded-lg transition-all hover:scale-110 active:scale-95"
            title="Next (→ Arrow Key)"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        </div>
      )}
    </div>
  );
}
