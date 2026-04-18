import type {Metadata} from 'next';
import './globals.css'; // Global styles

export const metadata: Metadata = {
  title: 'MapInfo Customizer',
  description: 'Công cụ bản đồ chuyên nghiệp dành cho biên tập viên: khoanh vùng, đánh dấu tuyến đường, chú thích hình ảnh và xuất ảnh vùng tùy chọn.',
};

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="en">
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
