import "./globals.css";
import { PwaBootstrap } from "@/components/pwa-bootstrap";

export const metadata = {
  title: "ConvertEase",
  description: "Modern media resizing for images and PDFs.",
  applicationName: "ConvertEase",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "ConvertEase"
  },
  formatDetection: {
    telephone: false
  },
  manifest: "/manifest.webmanifest",
  icons: {
    apple: "/icons/apple-touch-icon.png"
  }
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#eff5ff"
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <PwaBootstrap />
        {children}
      </body>
    </html>
  );
}
