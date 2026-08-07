import "./globals.css";

export const metadata = {
  title: "Nexa — FundedNext Futures",
  description: "Nexa, the FundedNext Futures assistant.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
