"use client";

import { getAccessToken } from "@/lib/auth/storage";

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL!;

type GpxDownloadButtonProps = {
  planId: string;
  className?: string;
  children?: React.ReactNode;
};

export function GpxDownloadButton({
  planId,
  className,
  children = "GPX 다운로드",
}: GpxDownloadButtonProps) {
  const handleDownloadGpx = async () => {
    try {
      const accessToken = getAccessToken();
      const response = await fetch(`${BASE_URL}/plans/${planId}/gpx`, {
        headers: {
          ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        },
      });

      if (!response.ok) {
        throw new Error(`다운로드 실패: ${response.status}`);
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `라이딩_플랜_${planId}.gpx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("GPX 다운로드 실패:", error);
      alert("GPX 다운로드에 실패했습니다.");
    }
  };

  return (
    <button type="button" onClick={handleDownloadGpx} className={className}>
      {children}
    </button>
  );
}
