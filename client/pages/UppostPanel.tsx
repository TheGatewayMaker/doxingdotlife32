import { useState } from "react";
import { LogOut, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { UploadIcon, ImageIcon } from "@/components/Icons";
import { useAuthContext } from "@/contexts/AuthContext";
import { toast } from "sonner";
import {
  generatePresignedUrls,
  uploadFilesToR2Parallel,
  validateUploadInputs,
} from "@/lib/r2-upload";

export default function UppostPanel() {
  const navigate = useNavigate();
  const { isAuthenticated, email, user, loginWithGoogle, logout } =
    useAuthContext();
  const [loginError, setLoginError] = useState("");
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [country, setCountry] = useState("");
  const [city, setCity] = useState("");
  const [server, setServer] = useState("");
  const [nsfw, setNsfw] = useState(false);
  const [isTrend, setIsTrend] = useState(false);
  const [trendRank, setTrendRank] = useState("");
  const [thumbnail, setThumbnail] = useState<File | null>(null);
  const [thumbnailPreview, setThumbnailPreview] = useState<string>("");
  const [mediaFiles, setMediaFiles] = useState<File[]>([]);
  const [mediaPreviews, setMediaPreviews] = useState<
    Array<{ file: File; preview: string; type: string }>
  >([]);
  const [uploading, setUploading] = useState(false);
  const [uploadMessage, setUploadMessage] = useState("");
  const [uploadError, setUploadError] = useState("");

  // Personal Info Fields (Optional)
  const [discordUsername, setDiscordUsername] = useState("");
  const [discordName, setDiscordName] = useState("");
  const [realName, setRealName] = useState("");
  const [age, setAge] = useState("");
  const [personalEmail, setPersonalEmail] = useState("");
  const [ipAddress, setIpAddress] = useState("");
  const [address, setAddress] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");

  const handleLogin = async () => {
    setLoginError("");
    setIsLoggingIn(true);

    try {
      await loginWithGoogle();
      toast.success("Successfully signed in with Google!");
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Login failed. Please try again.";
      setLoginError(errorMessage);
      toast.error(errorMessage);
      setIsLoggingIn(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      toast.success("Successfully signed out");
      resetForm();
    } catch (error) {
      toast.error("Error signing out. Please try again.");
      console.error("Logout error:", error);
    }
  };

  const handleThumbnailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setThumbnail(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setThumbnailPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleMediaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      const newFiles = Array.from(files);
      newFiles.forEach((file) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          setMediaPreviews((prev) => [
            ...prev,
            {
              file,
              preview: reader.result as string,
              type: file.type,
            },
          ]);
        };
        reader.readAsDataURL(file);
      });
      setMediaFiles((prev) => [...prev, ...newFiles]);
    }
  };

  const removeMediaFile = (index: number) => {
    setMediaFiles((prev) => prev.filter((_, i) => i !== index));
    setMediaPreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setCountry("");
    setCity("");
    setServer("");
    setNsfw(false);
    setIsTrend(false);
    setTrendRank("");
    setThumbnail(null);
    setThumbnailPreview("");
    setMediaFiles([]);
    setMediaPreviews([]);
    setUploadMessage("");
    setUploadError("");
    setDiscordUsername("");
    setDiscordName("");
    setRealName("");
    setAge("");
    setPersonalEmail("");
    setIpAddress("");
    setAddress("");
    setPhoneNumber("");
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    setUploadError("");
    setUploadMessage("");

    if (!title || !description || mediaFiles.length === 0 || !thumbnail) {
      setUploadError(
        "Please fill in all required fields including thumbnail and at least one media file",
      );
      return;
    }

    // Validate file sizes
    const filesWithThumbnail = [thumbnail, ...mediaFiles];
    const validation = validateUploadInputs(filesWithThumbnail);
    if (!validation.valid) {
      setUploadError(validation.error || "File validation failed");
      return;
    }

    // Build complete description with optional personal info fields
    let completeDescription = description;

    // Add personal info section if any fields are filled
    const personalInfoParts: string[] = [];

    if (discordUsername) {
      personalInfoParts.push(`**Discord Username:** ${discordUsername}`);
    }
    if (discordName) {
      personalInfoParts.push(`**Discord Name:** ${discordName}`);
    }
    if (realName) {
      personalInfoParts.push(`**Real Name:** ${realName}`);
    }
    if (age) {
      personalInfoParts.push(`**Age:** ${age}`);
    }
    if (personalEmail) {
      personalInfoParts.push(`**Email:** ${personalEmail}`);
    }
    if (ipAddress) {
      personalInfoParts.push(`**IP Address:** ${ipAddress}`);
    }
    if (address) {
      personalInfoParts.push(`**Address:** ${address}`);
    }
    if (phoneNumber) {
      personalInfoParts.push(`**Phone Number:** ${phoneNumber}`);
    }

    // Append personal info to description if any fields are filled
    if (personalInfoParts.length > 0) {
      completeDescription = `${completeDescription}\n\n**Personal Information:**\n${personalInfoParts.join("\n")}`;
    }

    setUploading(true);

    try {
      const idToken = await user?.getIdToken();
      if (!idToken) {
        throw new Error("Authentication token not available");
      }

      // Step 1: Generate presigned URLs for all files
      setUploadMessage("Preparing upload URLs...");

      if (!thumbnail) {
        throw new Error("Thumbnail is missing before URL generation");
      }

      if (mediaFiles.length === 0) {
        throw new Error("Media files array is empty before URL generation");
      }

      const filesForPresignedUrls = [
        {
          fileName: `thumbnail-${Date.now()}`,
          contentType: thumbnail.type || "image/jpeg",
          fileSize: thumbnail.size,
        },
        ...mediaFiles.map((file) => ({
          fileName: file.name,
          contentType: file.type || "application/octet-stream",
          fileSize: file.size,
        })),
      ];

      console.log("[UppostPanel] Files array before sending:", {
        totalFiles: filesForPresignedUrls.length,
        thumbnailFile: filesForPresignedUrls[0],
        mediaFilesCount: mediaFiles.length,
        allFiles: filesForPresignedUrls,
      });

      if (
        !Array.isArray(filesForPresignedUrls) ||
        filesForPresignedUrls.length === 0
      ) {
        throw new Error("Files array is empty or invalid");
      }

      const urlsResponse = await generatePresignedUrls(
        filesForPresignedUrls,
        idToken,
      );

      const postId = urlsResponse.postId;
      const presignedUrls = urlsResponse.presignedUrls;

      // Step 2: Upload all files directly to R2 using presigned URLs
      setUploadMessage("Uploading files to storage...");

      const thumbnailPresignedUrl = presignedUrls[0];
      const mediaPresignedUrls = presignedUrls.slice(1);

      // Upload thumbnail first
      await uploadFilesToR2Parallel(
        [thumbnail],
        [thumbnailPresignedUrl],
        (completed, total) => {
          setUploadMessage(
            `Uploading files (${completed}/${total + mediaFiles.length})...`,
          );
        },
      );

      // Upload media files in parallel
      const uploadResults = await uploadFilesToR2Parallel(
        mediaFiles,
        mediaPresignedUrls,
        (completed, total) => {
          setUploadMessage(
            `Uploading files (${completed + 1}/${total + mediaFiles.length})...`,
          );
        },
      );

      // Check for upload errors
      const failedUploads = uploadResults.filter((r) => !r.success);
      if (failedUploads.length > 0) {
        const errorDetails = failedUploads
          .map((r) => `${r.fileName}: ${r.error}`)
          .join("; ");
        throw new Error(
          `Failed to upload ${failedUploads.length} file(s): ${errorDetails}`,
        );
      }

      // Step 3: Store metadata on server
      setUploadMessage("Finalizing post...");

      const mediaFileNames = presignedUrls.slice(1).map((url) => url.fileName);

      const metadataResponse = await fetch("/api/upload-metadata", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({
          postId,
          title,
          description: completeDescription,
          country: country || "",
          city: city || "",
          server: server || "",
          nsfw: nsfw,
          thumbnailFileName: thumbnailPresignedUrl.fileName,
          mediaFiles: mediaFileNames,
          isTrend: isTrend,
          trendRank: isTrend ? trendRank : "",
        }),
      });

      if (!metadataResponse.ok) {
        let errorMsg = "Failed to store post metadata";
        try {
          const errorData = await metadataResponse.json();
          if (errorData.error) {
            errorMsg = errorData.error;
          }
          if (errorData.details) {
            errorMsg += ` (${errorData.details})`;
          }
        } catch (parseError) {
          console.error("Failed to parse error response", parseError);
          errorMsg = `Failed with status ${metadataResponse.status}`;
        }
        throw new Error(errorMsg);
      }

      const metadataData = await metadataResponse.json();
      setUploadMessage(
        `Post uploaded successfully! ${metadataData.mediaCount ? `(${metadataData.mediaCount} media file(s))` : ""}`,
      );
      toast.success("Post uploaded successfully!");
      resetForm();
    } catch (error) {
      const errorMsg =
        error instanceof Error
          ? error.message
          : "Error uploading post. Please try again.";
      setUploadError(errorMsg);
      toast.error(errorMsg);
      console.error("Upload error:", error);
    } finally {
      setUploading(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#000000] text-foreground flex flex-col animate-fadeIn">
        <Header />
        <div className="flex-1 flex items-center justify-center px-4 py-12 bg-[#000000]">
          <div
            className="w-full max-w-sm animate-fadeIn"
            style={{ animationDelay: "0.1s" }}
          >
            {/* Main Card */}
            <div className="bg-[#1a1a1a] border border-[#333333] rounded-2xl p-8 sm:p-10 shadow-2xl hover:shadow-3xl transition-all duration-300">
              {/* Icon */}
              <div className="mb-6 w-16 h-16 bg-gradient-to-br from-[#0088CC] to-[#0066AA] rounded-2xl flex items-center justify-center shadow-lg">
                <UploadIcon className="w-8 h-8 text-white" />
              </div>

              {/* Heading */}
              <h1 className="text-3xl sm:text-4xl font-black mb-3 text-white tracking-tight">
                Upload Portal
              </h1>
              <p className="text-[#979797] mb-8 text-base font-medium leading-relaxed">
                Secure admin authentication required to create and manage posts
              </p>

              {/* Content Section */}
              <div className="space-y-5">
                {/* Security Notice */}
                <div className="relative overflow-hidden bg-[#0a3a5f] border border-[#0088CC]/30 rounded-xl p-5 backdrop-blur-sm">
                  <div className="absolute inset-0 bg-gradient-to-r from-[#0088CC]/10 to-transparent pointer-events-none" />
                  <div className="relative space-y-2.5">
                    <div className="flex items-start gap-3">
                      <svg
                        className="w-5 h-5 text-[#00B4FF] flex-shrink-0 mt-0.5"
                        fill="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path d="M12 1C6.48 1 2 5.48 2 11s4.48 10 10 10 10-4.48 10-10S17.52 1 12 1zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />
                      </svg>
                      <p className="text-sm text-[#FFFFFF] font-bold">
                        Only authorized Gmail accounts can access this admin
                        panel
                      </p>
                    </div>
                    <p className="text-xs text-[#B0D4F1] font-medium ml-8">
                      Contact the administrator if you believe your email should
                      be authorized.
                    </p>
                  </div>
                </div>

                {/* Error Message */}
                {loginError && (
                  <div className="p-4 bg-red-900/20 border border-red-600/50 rounded-xl text-red-400 text-sm font-semibold animate-fadeIn flex items-center gap-3">
                    <svg
                      className="w-5 h-5 flex-shrink-0"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />
                    </svg>
                    <span>{loginError}</span>
                  </div>
                )}

                {/* Google Sign-In Button - Official Design */}
                <button
                  type="button"
                  onClick={handleLogin}
                  disabled={isLoggingIn}
                  className="w-full px-5 py-3 bg-white text-[#202124] font-semibold text-base rounded-lg border border-[#dadce0] hover:border-[#d3d3d3] hover:bg-[#f8f8f8] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white active:scale-95 transition-all shadow-sm hover:shadow-md flex items-center justify-center gap-3"
                >
                  <svg
                    className="w-5 h-5"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      fill="#4285F4"
                    />
                    <path
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      fill="#34A853"
                    />
                    <path
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                      fill="#FBBC05"
                    />
                    <path
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                      fill="#EA4335"
                    />
                  </svg>
                  <span>
                    {isLoggingIn ? "Signing in..." : "Sign in with Google"}
                  </span>
                </button>

                {/* Footer Text */}
                <p className="text-xs text-[#666666] text-center font-medium">
                  Your credentials are securely processed by Google
                </p>
              </div>
            </div>

            {/* Additional Info */}
            <p className="text-xs text-[#666666] text-center mt-6 font-medium">
              By signing in, you agree to the platform's terms
            </p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col animate-fadeIn">
      <Header />
      <main className="flex-1 w-full">
        {/* Hero Section */}
        <div className="bg-background pt-8 pb-8 md:pt-16 md:pb-12 border-b border-border/50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col md:flex-row justify-between items-start gap-6 mb-0">
              <div
                className="animate-fadeIn"
                style={{ animationDelay: "0.1s" }}
              >
                <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black mb-3 text-foreground tracking-tighter leading-tight flex items-center gap-2">
                  <UploadIcon className="w-8 h-8 text-accent" />
                  Upload Panel
                </h1>
                <p className="text-base sm:text-lg md:text-xl font-semibold text-muted-foreground mb-4">
                  Logged in as:{" "}
                  <span className="text-accent font-bold">{email}</span>
                </p>
                <div className="flex flex-wrap gap-3 items-center">
                  <span className="inline-flex items-center gap-2 px-3 py-1.5 bg-green-600/20 text-green-400 font-semibold text-sm rounded-full border border-green-600/30">
                    <svg
                      className="w-4 h-4"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                    Authenticated
                  </span>
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-6 py-3 bg-destructive/90 hover:bg-destructive text-destructive-foreground font-bold rounded-lg transition-all shadow-md hover:shadow-lg active:scale-95 whitespace-nowrap"
              >
                <LogOut className="w-5 h-5" />
                Logout
              </button>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
          <form
            onSubmit={handleUpload}
            className="bg-card border border-border/50 rounded-2xl p-6 sm:p-8 md:p-12 space-y-8 shadow-2xl hover:shadow-3xl transition-all duration-300 animate-fadeIn backdrop-blur-sm"
            style={{ animationDelay: "0.2s" }}
          >
            {/* Title */}
            <div>
              <label className="block text-sm font-bold mb-3 text-foreground">
                Post Title <span className="text-destructive">*</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-4 py-3 bg-background/50 border-2 border-border/60 hover:border-accent/60 rounded-xl text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent transition-all duration-200"
                  placeholder="Enter post title"
                />
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-bold mb-3 text-foreground">
                Description <span className="text-destructive">*</span>
              </label>
              <div className="relative">
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-4 py-3 bg-background/50 border-2 border-border/60 hover:border-accent/60 rounded-xl text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent resize-none transition-all duration-200"
                  rows={5}
                  placeholder="Enter post description"
                />
              </div>
            </div>

            {/* Thumbnail Upload */}
            <div>
              <label className="block text-sm font-bold mb-3 text-foreground">
                Thumbnail Image <span className="text-destructive">*</span>
              </label>
              <div className="border-2 border-dashed border-border/70 rounded-2xl p-8 text-center cursor-pointer hover:border-accent/70 hover:bg-accent/10 bg-background/30 transition-all duration-300 hover:shadow-lg hover:shadow-accent/10">
                <input
                  type="file"
                  onChange={handleThumbnailChange}
                  accept="image/png,image/jpeg,image/jpg,image/gif,image/webp,image/svg+xml,image/bmp,image/tiff,image/heic,image/heif,image/avif"
                  className="hidden"
                  id="thumbnail-upload"
                />
                <label
                  htmlFor="thumbnail-upload"
                  className="cursor-pointer block"
                >
                  {thumbnail ? (
                    <div className="space-y-3">
                      <svg
                        className="w-6 h-6 mx-auto text-accent"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <polyline points="20 6 9 17 4 12"></polyline>
                      </svg>
                      <p className="text-sm font-bold text-accent">
                        {thumbnail.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {(thumbnail.size / 1024 / 1024).toFixed(2)} MB • Ready
                        to upload
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <ImageIcon className="w-10 h-10 mx-auto text-muted-foreground" />
                      <p className="text-sm font-bold text-foreground">
                        Click to upload thumbnail
                      </p>
                      <p className="text-xs text-muted-foreground">
                        All image formats (PNG, JPG, JPEG, GIF, WebP, etc.) •
                        Max 500MB
                      </p>
                    </div>
                  )}
                </label>
              </div>

              {thumbnailPreview && (
                <div className="mt-6 relative group">
                  <img
                    src={thumbnailPreview}
                    alt="Thumbnail Preview"
                    className="max-h-48 rounded-xl mx-auto border border-border object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setThumbnail(null);
                      setThumbnailPreview("");
                    }}
                    className="absolute top-2 right-2 bg-destructive text-destructive-foreground p-2 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>

            {/* Location Info */}
            <div className="bg-background/40 border border-border/40 rounded-2xl p-6 md:p-8">
              <h3 className="text-sm font-bold text-foreground mb-6 uppercase tracking-wider opacity-75">
                Location Information (Optional)
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Country */}
                <div>
                  <label className="block text-sm font-bold mb-3 text-foreground flex items-center gap-2">
                    <svg
                      className="w-4 h-4 text-accent"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <circle cx="12" cy="12" r="10" />
                      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
                      <path d="M2 12h20" />
                    </svg>
                    Country
                  </label>
                  <input
                    type="text"
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    className="w-full px-4 py-3 bg-background/50 border-2 border-border/60 hover:border-accent/60 rounded-xl text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent transition-all duration-200"
                    placeholder="(optional)"
                  />
                </div>

                {/* City */}
                <div>
                  <label className="block text-sm font-bold mb-3 text-foreground flex items-center gap-2">
                    <svg
                      className="w-4 h-4 text-accent"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                      <circle cx="12" cy="10" r="3" />
                    </svg>
                    City
                  </label>
                  <input
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full px-4 py-3 bg-background/50 border-2 border-border/60 hover:border-accent/60 rounded-xl text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent transition-all duration-200"
                    placeholder="(optional)"
                  />
                </div>

                {/* Server */}
                <div>
                  <label className="block text-sm font-bold mb-3 text-foreground flex items-center gap-2">
                    <svg
                      className="w-4 h-4 text-accent"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <rect x="2" y="2" width="20" height="8" />
                      <rect x="2" y="14" width="20" height="8" />
                      <line x1="6" y1="6" x2="6" y2="6.01" />
                      <line x1="6" y1="18" x2="6" y2="18.01" />
                    </svg>
                    Server Name
                  </label>
                  <input
                    type="text"
                    value={server}
                    onChange={(e) => setServer(e.target.value)}
                    className="w-full px-4 py-3 bg-background/50 border-2 border-border/60 hover:border-accent/60 rounded-xl text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent transition-all duration-200"
                    placeholder="(optional)"
                  />
                </div>
              </div>
            </div>

            {/* Personal Information Section */}
            <div className="bg-background/40 border border-border/40 rounded-2xl p-6 md:p-8">
              <h3 className="text-sm font-bold text-foreground mb-6 uppercase tracking-wider opacity-75">
                Personal Information (Optional)
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Discord Username */}
                <div>
                  <label className="block text-sm font-bold mb-3 text-foreground">
                    Discord Username
                  </label>
                  <input
                    type="text"
                    value={discordUsername}
                    onChange={(e) => setDiscordUsername(e.target.value)}
                    className="w-full px-4 py-3 bg-background/50 border-2 border-border/60 hover:border-accent/60 rounded-xl text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent transition-all duration-200"
                    placeholder="e.g., user#1234"
                  />
                </div>

                {/* Discord Name */}
                <div>
                  <label className="block text-sm font-bold mb-3 text-foreground">
                    Discord Name
                  </label>
                  <input
                    type="text"
                    value={discordName}
                    onChange={(e) => setDiscordName(e.target.value)}
                    className="w-full px-4 py-3 bg-background/50 border-2 border-border/60 hover:border-accent/60 rounded-xl text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent transition-all duration-200"
                    placeholder="e.g., Display Name"
                  />
                </div>

                {/* Real Name */}
                <div>
                  <label className="block text-sm font-bold mb-3 text-foreground">
                    Real Name
                  </label>
                  <input
                    type="text"
                    value={realName}
                    onChange={(e) => setRealName(e.target.value)}
                    className="w-full px-4 py-3 bg-background/50 border-2 border-border/60 hover:border-accent/60 rounded-xl text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent transition-all duration-200"
                    placeholder="e.g., John Doe"
                  />
                </div>

                {/* Age */}
                <div>
                  <label className="block text-sm font-bold mb-3 text-foreground">
                    Age
                  </label>
                  <input
                    type="text"
                    value={age}
                    onChange={(e) => setAge(e.target.value)}
                    className="w-full px-4 py-3 bg-background/50 border-2 border-border/60 hover:border-accent/60 rounded-xl text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent transition-all duration-200"
                    placeholder="e.g., 25"
                  />
                </div>

                {/* Email */}
                <div>
                  <label className="block text-sm font-bold mb-3 text-foreground">
                    Email
                  </label>
                  <input
                    type="email"
                    value={personalEmail}
                    onChange={(e) => setPersonalEmail(e.target.value)}
                    className="w-full px-4 py-3 bg-background/50 border-2 border-border/60 hover:border-accent/60 rounded-xl text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent transition-all duration-200"
                    placeholder="e.g., user@example.com"
                  />
                </div>

                {/* IP Address */}
                <div>
                  <label className="block text-sm font-bold mb-3 text-foreground">
                    IP Address
                  </label>
                  <input
                    type="text"
                    value={ipAddress}
                    onChange={(e) => setIpAddress(e.target.value)}
                    className="w-full px-4 py-3 bg-background/50 border-2 border-border/60 hover:border-accent/60 rounded-xl text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent transition-all duration-200"
                    placeholder="e.g., 192.168.1.1"
                  />
                </div>

                {/* Address */}
                <div>
                  <label className="block text-sm font-bold mb-3 text-foreground">
                    Address
                  </label>
                  <input
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="w-full px-4 py-3 bg-background/50 border-2 border-border/60 hover:border-accent/60 rounded-xl text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent transition-all duration-200"
                    placeholder="e.g., 123 Main St, City, State"
                  />
                </div>

                {/* Phone Number */}
                <div>
                  <label className="block text-sm font-bold mb-3 text-foreground">
                    Phone Number
                  </label>
                  <input
                    type="text"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    className="w-full px-4 py-3 bg-background/50 border-2 border-border/60 hover:border-accent/60 rounded-xl text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent transition-all duration-200"
                    placeholder="e.g., +1-555-0123"
                  />
                </div>
              </div>
            </div>

            {/* NSFW Checkbox */}
            <div className="relative overflow-hidden">
              <div className="relative flex items-center gap-3 bg-red-900/15 border-2 border-red-600/40 hover:border-red-600/60 rounded-2xl p-6 transition-all duration-300 hover:shadow-lg hover:shadow-red-600/10">
                <input
                  type="checkbox"
                  id="nsfw-checkbox"
                  checked={nsfw}
                  onChange={(e) => setNsfw(e.target.checked)}
                  className="w-5 h-5 accent-red-600 rounded cursor-pointer flex-shrink-0"
                />
                <label
                  htmlFor="nsfw-checkbox"
                  className="flex-1 cursor-pointer"
                >
                  <div className="flex items-center gap-2 mb-1">
                    <svg
                      className="w-4 h-4 text-red-400 flex-shrink-0"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />
                    </svg>
                    <p className="text-sm font-bold text-red-400">
                      Mark as NSFW Content
                    </p>
                  </div>
                  <p className="text-xs text-red-300/80 ml-6">
                    This content is Not Safe For Work and requires age
                    verification
                  </p>
                </label>
              </div>
            </div>

            {/* Trend Checkbox */}
            <div className="relative overflow-hidden">
              <div className="relative flex items-center gap-3 bg-amber-900/15 border-2 border-amber-600/40 hover:border-amber-600/60 rounded-2xl p-6 transition-all duration-300 hover:shadow-lg hover:shadow-amber-600/10">
                <input
                  type="checkbox"
                  id="trend-checkbox"
                  checked={isTrend}
                  onChange={(e) => setIsTrend(e.target.checked)}
                  className="w-5 h-5 accent-amber-600 rounded cursor-pointer flex-shrink-0"
                />
                <label
                  htmlFor="trend-checkbox"
                  className="flex-1 cursor-pointer"
                >
                  <div className="flex items-center gap-2 mb-1">
                    <svg
                      className="w-4 h-4 text-amber-400 flex-shrink-0"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                    </svg>
                    <p className="text-sm font-bold text-amber-400">
                      Mark as Trending Post
                    </p>
                  </div>
                  <p className="text-xs text-amber-300/80 ml-6">
                    Posts marked as trending will appear first with a special
                    golden gradient
                  </p>
                </label>
              </div>

              {isTrend && (
                <div className="mt-4 animate-fadeIn">
                  <label className="block text-sm font-bold mb-3 text-foreground">
                    Trend Rank Number
                  </label>
                  <input
                    type="number"
                    value={trendRank}
                    onChange={(e) => setTrendRank(e.target.value)}
                    className="w-full px-4 py-3 bg-background/50 border-2 border-border/60 hover:border-accent/60 rounded-xl text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent transition-all duration-200"
                    placeholder="Enter rank number (1 appears first, 2 second, etc.)"
                    min="1"
                  />
                  <p className="text-xs text-muted-foreground mt-2">
                    Lower numbers appear first. E.g., rank 1 appears before rank
                    2
                  </p>
                </div>
              )}
            </div>

            {/* Media Upload */}
            <div>
              <label className="block text-sm font-bold mb-3 text-foreground">
                Media Files <span className="text-destructive">*</span>
              </label>
              <div className="border-2 border-dashed border-border/70 rounded-2xl p-10 text-center cursor-pointer hover:border-accent/70 hover:bg-accent/10 bg-background/30 transition-all duration-300 hover:shadow-lg hover:shadow-accent/10">
                <input
                  type="file"
                  onChange={handleMediaChange}
                  accept="image/png,image/jpeg,image/jpg,image/gif,image/webp,image/svg+xml,image/bmp,image/tiff,image/heic,image/heif,image/avif,video/mp4,video/webm,video/quicktime,video/x-msvideo,video/x-matroska,video/x-flv,video/x-m4v,video/mpeg,video/mp2t,video/x-ms-wmv,video/mxf,video/ogg"
                  multiple
                  className="hidden"
                  id="media-upload"
                />
                <label htmlFor="media-upload" className="cursor-pointer block">
                  {mediaFiles.length > 0 ? (
                    <div className="space-y-3">
                      <svg
                        className="w-6 h-6 mx-auto text-accent"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <polyline points="20 6 9 17 4 12"></polyline>
                      </svg>
                      <p className="text-sm font-bold text-accent">
                        {mediaFiles.length} file
                        {mediaFiles.length !== 1 ? "s" : ""} selected
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Click to add more files
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <UploadIcon className="w-10 h-10 mx-auto text-muted-foreground" />
                      <p className="text-sm font-bold text-foreground">
                        Click to upload media files
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Images and videos supported (Max 500MB each, unlimited
                        quantity)
                      </p>
                    </div>
                  )}
                </label>
              </div>

              {mediaPreviews.length > 0 && (
                <div className="mt-6">
                  <div className="mb-4">
                    <p className="text-sm font-semibold text-foreground mb-3">
                      Uploaded Media ({mediaPreviews.length})
                    </p>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                      {mediaPreviews.map((media, idx) => (
                        <div key={idx} className="relative group">
                          {media.type.startsWith("image/") ? (
                            <img
                              src={media.preview}
                              alt={`Preview ${idx}`}
                              className="w-full aspect-square rounded-lg border border-border object-cover"
                            />
                          ) : (
                            <video
                              src={media.preview}
                              className="w-full aspect-square rounded-lg border border-border object-cover bg-muted"
                            />
                          )}
                          <button
                            type="button"
                            onClick={() => removeMediaFile(idx)}
                            className="absolute top-1 right-1 bg-destructive text-destructive-foreground p-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <X className="w-4 h-4" />
                          </button>
                          <div className="absolute bottom-1 left-1 bg-black/50 text-white text-xs px-2 py-1 rounded">
                            {idx + 1}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {uploadMessage && (
              <div className="p-4 bg-green-900/20 border border-green-600/50 rounded-lg text-green-400 text-sm font-medium flex items-center gap-2 animate-fadeIn">
                <svg
                  className="w-4 h-4 flex-shrink-0"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                {uploadMessage}
              </div>
            )}

            {uploadError && (
              <div className="p-4 bg-destructive/10 border border-destructive/50 rounded-lg text-destructive text-sm font-medium flex items-center gap-2 animate-fadeIn">
                <svg
                  className="w-4 h-4 flex-shrink-0"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />
                </svg>
                {uploadError}
              </div>
            )}

            <button
              type="submit"
              disabled={uploading}
              className="w-full px-4 py-4 bg-accent text-accent-foreground font-bold rounded-xl hover:bg-accent/90 hover:shadow-2xl hover:shadow-accent/50 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-95 shadow-lg flex items-center justify-center gap-2"
            >
              <UploadIcon className="w-5 h-5" />
              {uploading ? "Uploading..." : "Upload Post"}
            </button>
          </form>
        </div>
      </main>
      <Footer />
    </div>
  );
}
