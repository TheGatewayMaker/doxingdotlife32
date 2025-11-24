import { useState } from "react";
import { LogOut, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { UploadIcon, ImageIcon } from "@/components/Icons";
import { useAuthContext } from "@/contexts/AuthContext";
import { toast } from "sonner";

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
  const [thumbnail, setThumbnail] = useState<File | null>(null);
  const [thumbnailPreview, setThumbnailPreview] = useState<string>("");
  const [mediaFiles, setMediaFiles] = useState<File[]>([]);
  const [mediaPreviews, setMediaPreviews] = useState<
    Array<{ file: File; preview: string; type: string }>
  >([]);
  const [uploading, setUploading] = useState(false);
  const [uploadMessage, setUploadMessage] = useState("");
  const [uploadError, setUploadError] = useState("");

  const handleLogin = async () => {
    setLoginError("");
    setIsLoggingIn(true);

    try {
      await loginWithGoogle();
      toast.success("Successfully signed in with Google!");
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Login failed. Please try again.";
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
    setThumbnail(null);
    setThumbnailPreview("");
    setMediaFiles([]);
    setMediaPreviews([]);
    setUploadMessage("");
    setUploadError("");
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

    const formData = new FormData();
    formData.append("title", title);
    formData.append("description", description);
    formData.append("country", country);
    formData.append("city", city);
    formData.append("server", server);
    formData.append("thumbnail", thumbnail);

    mediaFiles.forEach((file) => {
      formData.append("media", file);
    });

    setUploading(true);

    try {
      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Upload failed");
      }

      const data = await response.json();
      setUploadMessage("Post uploaded successfully!");
      resetForm();
    } catch (error) {
      setUploadError("Error uploading post. Please try again.");
      console.error("Upload error:", error);
    } finally {
      setUploading(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background text-foreground flex flex-col animate-fadeIn">
        <Header />
        <div className="flex-1 flex items-center justify-center px-4 py-12 bg-gradient-to-br from-background via-muted/20 to-background">
          <div
            className="w-full max-w-md animate-fadeIn"
            style={{ animationDelay: "0.1s" }}
          >
            <div className="bg-card border border-border rounded-xl p-10 shadow-xl hover:shadow-2xl transition-shadow duration-300">
              <div className="mb-4 w-12 h-12 bg-gradient-to-br from-accent to-accent/80 rounded-lg flex items-center justify-center shadow-lg">
                <UploadIcon className="w-6 h-6 text-accent-foreground" />
              </div>
              <h1 className="text-4xl font-black mb-2 text-foreground">
                Upload Portal
              </h1>
              <p className="text-muted-foreground mb-8 text-sm">
                Secure admin authentication required to create and manage posts
              </p>

              <form onSubmit={handleLogin} className="space-y-5">
                <div>
                  <label className="block text-sm font-bold mb-2 text-foreground">
                    Username
                  </label>
                  <input
                    type="text"
                    value={loginUsername}
                    onChange={(e) => setLoginUsername(e.target.value)}
                    className="w-full px-4 py-3 bg-background border border-border hover:border-accent/50 rounded-lg text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent transition-all"
                    placeholder="Enter username"
                    autoComplete="username"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold mb-2 text-foreground">
                    Password
                  </label>
                  <input
                    type="password"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    className="w-full px-4 py-3 bg-background border border-border hover:border-accent/50 rounded-lg text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent transition-all"
                    placeholder="Enter password"
                    autoComplete="current-password"
                  />
                </div>

                {loginError && (
                  <div className="p-4 bg-destructive/10 border border-destructive rounded-lg text-destructive text-sm font-medium animate-fadeIn">
                    ⚠️ {loginError}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isLoggingIn}
                  className="w-full px-4 py-3 bg-accent text-accent-foreground font-bold rounded-lg hover:bg-accent/90 disabled:opacity-50 disabled:cursor-not-allowed active:scale-95 transition-all shadow-md hover:shadow-lg"
                >
                  {isLoggingIn ? "Logging in..." : "Login to Dashboard"}
                </button>
              </form>
            </div>
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
        <div className="bg-gradient-to-br from-background via-card/50 to-background pt-8 pb-8 md:pt-16 md:pb-12 border-b border-border/50">
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
                  <span className="text-accent font-bold">{username}</span>
                </p>
                <div className="flex flex-wrap gap-3 items-center">
                  <span className="inline-block px-3 py-1.5 bg-accent/20 text-accent font-semibold text-sm rounded-full">
                    ✓ Authenticated
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
            className="bg-card border border-border rounded-xl p-6 sm:p-8 md:p-10 space-y-8 shadow-xl hover:shadow-2xl transition-shadow duration-300 animate-fadeIn"
            style={{ animationDelay: "0.2s" }}
          >
            {/* Title */}
            <div>
              <label className="block text-sm font-bold mb-3 text-foreground">
                Post Title <span className="text-destructive">*</span>
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-4 py-3 bg-background border border-border hover:border-accent/50 rounded-lg text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent transition-colors"
                placeholder="Enter post title"
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-bold mb-3 text-foreground">
                Description <span className="text-destructive">*</span>
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-4 py-3 bg-background border border-border hover:border-accent/50 rounded-lg text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent resize-none transition-all"
                rows={5}
                placeholder="Enter post description"
              />
            </div>

            {/* Thumbnail Upload */}
            <div>
              <label className="block text-sm font-bold mb-3 text-foreground">
                Thumbnail Image <span className="text-destructive">*</span>
              </label>
              <div className="border-2 border-dashed border-border rounded-xl p-8 text-center cursor-pointer hover:border-accent hover:bg-accent/5 transition-all">
                <input
                  type="file"
                  onChange={handleThumbnailChange}
                  accept="image/*"
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
                        Images only (Max 50MB)
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
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Country */}
              <div>
                <label className="block text-sm font-bold mb-3 text-foreground">
                  🌍 Country
                </label>
                <input
                  type="text"
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  className="w-full px-4 py-3 bg-background border border-border hover:border-accent/50 rounded-lg text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent transition-all"
                  placeholder="(optional)"
                />
              </div>

              {/* City */}
              <div>
                <label className="block text-sm font-bold mb-3 text-foreground">
                  🏙️ City
                </label>
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="w-full px-4 py-3 bg-background border border-border hover:border-accent/50 rounded-lg text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent transition-all"
                  placeholder="(optional)"
                />
              </div>

              {/* Server */}
              <div>
                <label className="block text-sm font-bold mb-3 text-foreground">
                  🖥️ Server Name
                </label>
                <input
                  type="text"
                  value={server}
                  onChange={(e) => setServer(e.target.value)}
                  className="w-full px-4 py-3 bg-background border border-border hover:border-accent/50 rounded-lg text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent transition-all"
                  placeholder="(optional)"
                />
              </div>
            </div>

            {/* Media Upload */}
            <div>
              <label className="block text-sm font-bold mb-3 text-foreground">
                Media Files <span className="text-destructive">*</span>
              </label>
              <div className="border-2 border-dashed border-border rounded-xl p-10 text-center cursor-pointer hover:border-accent hover:bg-accent/5 transition-all">
                <input
                  type="file"
                  onChange={handleMediaChange}
                  accept="image/*,video/*"
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
                        Images and videos supported (Max 100MB each)
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
                <span>✓</span> {uploadMessage}
              </div>
            )}

            {uploadError && (
              <div className="p-4 bg-destructive/10 border border-destructive/50 rounded-lg text-destructive text-sm font-medium flex items-center gap-2 animate-fadeIn">
                <span>⚠️</span> {uploadError}
              </div>
            )}

            <button
              type="submit"
              disabled={uploading}
              className="w-full px-4 py-4 bg-accent text-accent-foreground font-bold rounded-lg hover:bg-accent/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-95 shadow-md hover:shadow-lg flex items-center justify-center gap-2"
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
