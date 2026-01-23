import type { Metadata } from "next";
import "@stream-io/video-react-sdk/dist/css/styles.css";
import "./globals.css";
import { ClerkProvider, RedirectToSignUp, SignedIn, SignedOut, SignIn } from "@clerk/nextjs";
import ConvexClerkProvider from "@/components/provider/ConvexClerkProvider";import Navbar from "@/components/Navbar";
import StreamClientProvider from "@/components/provider/StreamClientProvider";
import { ThemeProvider } from "@/components/provider/ThemeProvider";
import { Toaster } from "react-hot-toast";

export const metadata: Metadata = {
  title: "NextHire",
  description: "Next app",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ConvexClerkProvider>
    <html lang="en" suppressHydrationWarning>
      <body className="antialiased">
         <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
            storageKey="nexthire-theme"
          >

            <SignedIn>
       <StreamClientProvider>
       <div className="min-h-screen">
        <Navbar />
        <main className="px-4 sm:px-6 lg:px-8">{children}</main>
       </div>
       </StreamClientProvider>
            </SignedIn>

       <SignedOut>
        <RedirectToSignUp />
       </SignedOut>
       </ThemeProvider>
       <Toaster />
      </body>
    </html>
    </ConvexClerkProvider>
  );
}
