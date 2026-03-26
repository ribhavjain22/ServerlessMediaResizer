export default function manifest() {
  return {
    name: "ConvertEase",
    short_name: "ConvertEase",
    description: "Mobile-friendly media resizing for images and PDFs.",
    start_url: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#eff5ff",
    theme_color: "#eff5ff",
    categories: ["productivity", "utilities"],
    icons: [
      {
        src: "/icons/icon-192.png",
        sizes: "192x192",
        type: "image/png"
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png"
      },
      {
        src: "/icons/maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable"
      }
    ],
    shortcuts: [
      {
        name: "Open Image Studio",
        short_name: "Images",
        url: "/?tool=image",
        description: "Resize and reduce images in the browser."
      },
      {
        name: "Open PDF Lab",
        short_name: "PDF",
        url: "/?tool=pdf",
        description: "Compress PDFs with background jobs."
      }
    ]
  };
}
