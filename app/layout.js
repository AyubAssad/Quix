import "./globals.css";

export const metadata = {
  title: "Quix",
  description: "Quix app with Supabase auth, admin questions, and leaderboard.",
  icons: {
    icon: "/hmu.logo.png"
  }
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
