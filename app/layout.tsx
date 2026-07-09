import './globals.css';

export const metadata = {
  title: 'SwiftWallet',
  description: 'Real money wallet and payout platform',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
