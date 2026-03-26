import "./globals.css";

export const metadata = {
  title: "ConvertEase",
  description: "Modern media resizing for images and PDFs."
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
