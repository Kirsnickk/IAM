import './globals.css';

export const metadata = {
  title: 'AssetMaster — Hệ thống Quản lý Tài sản Doanh nghiệp',
  description: 'Quản lý toàn bộ vòng đời tài sản doanh nghiệp, QR code, điều chuyển, bảo trì',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
      </head>
      <body className="bg-zinc-50 text-zinc-900 min-h-screen antialiased" style={{ fontFamily: 'Inter, ui-sans-serif, system-ui, sans-serif' }}>
        {children}
      </body>
    </html>
  );
}
