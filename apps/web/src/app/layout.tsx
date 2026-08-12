import './globals.css';

export const metadata = {
  title: 'AssetMaster — Hệ thống Quản lý Tài sản Doanh nghiệp',
  description: 'Quản lý toàn bộ vòng đời tài sản doanh nghiệp, QR code, điều chuyển, bảo trì',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi">
      <body className="bg-slate-50 text-slate-900 min-h-screen">
        {children}
      </body>
    </html>
  );
}
