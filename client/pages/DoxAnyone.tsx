import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { ArrowRight } from "lucide-react";

export default function DoxAnyone() {
  const handleDoxNow = () => {
    window.open("https://discord.com", "_blank");
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col animate-fadeIn">
      <Header />
      <main className="flex-1 w-full">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 md:py-16">
          {/* Header Section */}
          <div className="text-center mb-10 sm:mb-12">
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-black mb-3 sm:mb-4 bg-gradient-to-r from-accent to-accent/60 bg-clip-text text-transparent">
              Dox Anyone
            </h1>
            <p className="text-base sm:text-lg text-muted-foreground mb-6 max-w-2xl mx-auto">
              Expose individuals publicly on our platform
            </p>
          </div>

          {/* Pricing Section */}
          <div className="bg-card border-2 border-border rounded-xl p-8 mb-12">
            <h2 className="text-2xl font-bold mb-6 text-foreground">
              Service Pricing
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="bg-muted/50 rounded-lg p-6 border border-border">
                <p className="text-sm font-semibold text-accent mb-2">PAKISTAN</p>
                <p className="text-3xl font-black text-foreground">299</p>
                <p className="text-sm text-muted-foreground">PKR</p>
              </div>
              <div className="bg-muted/50 rounded-lg p-6 border border-border">
                <p className="text-sm font-semibold text-accent mb-2">UNITED STATES</p>
                <p className="text-3xl font-black text-foreground">1.10</p>
                <p className="text-sm text-muted-foreground">USD</p>
              </div>
              <div className="bg-muted/50 rounded-lg p-6 border border-border">
                <p className="text-sm font-semibold text-accent mb-2">INDIA</p>
                <p className="text-3xl font-black text-foreground">99</p>
                <p className="text-sm text-muted-foreground">INR</p>
              </div>
            </div>
          </div>

          {/* Instructions Section */}
          <div className="bg-card border-2 border-border rounded-xl p-8 mb-12">
            <h2 className="text-2xl font-bold mb-6 text-foreground">
              How It Works
            </h2>
            <div className="space-y-6">
              <div className="flex gap-4">
                <div className="flex-shrink-0">
                  <div className="flex items-center justify-center h-10 w-10 rounded-lg bg-accent text-accent-foreground font-bold">
                    1
                  </div>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-foreground mb-2">
                    Click the Dox Button Below
                  </h3>
                  <p className="text-muted-foreground">
                    Click on the "Dox Now" button to proceed with creating your doxing submission.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-shrink-0">
                  <div className="flex items-center justify-center h-10 w-10 rounded-lg bg-accent text-accent-foreground font-bold">
                    2
                  </div>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-foreground mb-2">
                    Create a Support Ticket on Discord
                  </h3>
                  <p className="text-muted-foreground">
                    Create a support ticket on our Discord Server with your doxing request details.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-shrink-0">
                  <div className="flex items-center justify-center h-10 w-10 rounded-lg bg-accent text-accent-foreground font-bold">
                    3
                  </div>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-foreground mb-2">
                    Prepare Your Content
                  </h3>
                  <p className="text-muted-foreground">
                    Make sure to have a photo and some details for the specific person you want to dox. The more information you provide, the better.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-shrink-0">
                  <div className="flex items-center justify-center h-10 w-10 rounded-lg bg-accent text-accent-foreground font-bold">
                    4
                  </div>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-foreground mb-2">
                    Payment & Verification
                  </h3>
                  <p className="text-muted-foreground">
                    Complete the payment as per the pricing in your region. One of our moderators will verify your submission.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-shrink-0">
                  <div className="flex items-center justify-center h-10 w-10 rounded-lg bg-accent text-accent-foreground font-bold">
                    5
                  </div>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-foreground mb-2">
                    Publication
                  </h3>
                  <p className="text-muted-foreground">
                    After payment confirmation and verification, one of our moderators will post your dox on our website.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Call to Action */}
          <div className="text-center">
            <button
              onClick={handleDoxNow}
              className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-accent to-accent/80 text-accent-foreground font-bold text-lg rounded-lg hover:shadow-lg hover:shadow-accent/50 transition-all duration-300 transform hover:scale-105"
            >
              Dox Now
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
