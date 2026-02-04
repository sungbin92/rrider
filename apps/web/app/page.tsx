import Image from "next/image";
import Link from "next/link";

export default function Home() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 font-sans dark:bg-black">
      <main className="flex min-h-screen w-full max-w-4xl flex-col items-center justify-between py-24 px-8 bg-white dark:bg-black">
        {/* Header Section */}
        <div className="text-center space-y-4">
          <div className="flex justify-center">
            <Image
              className="dark:invert"
              src="/next.svg"
              alt="Next.js logo"
              width={120}
              height={24}
              priority
            />
          </div>
          <h1 className="text-4xl font-bold tracking-tight text-black dark:text-zinc-50">
            라이딩 플랜 매니저
          </h1>
          <p className="text-lg text-zinc-600 dark:text-zinc-400 max-w-2xl mx-auto">
            자전거 라이딩 계획을 손쉽게 만들고, AI 기반 맛집 추천을 받아보세요.
            생성한 플랜을 GPX 파일로 다운로드하여 GPS 기기에서 바로 사용할 수
            있습니다.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-16 w-full max-w-4xl">
          <div className="bg-zinc-50 dark:bg-zinc-900 p-6 rounded-xl">
            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center mb-4">
              <svg
                className="w-6 h-6 text-blue-600 dark:text-blue-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"
                />
              </svg>
            </div>
            <h3 className="text-lg font-semibold mb-2">플랜 생성</h3>
            <p className="text-zinc-600 dark:text-zinc-400 text-sm">
              출발지와 도착지를 선택하면 자동으로 최적 라우트를 계산하고
              저장합니다.
            </p>
          </div>

          <div className="bg-zinc-50 dark:bg-zinc-900 p-6 rounded-xl">
            <div className="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center mb-4">
              <svg
                className="w-6 h-6 text-green-600 dark:text-green-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                />
              </svg>
            </div>
            <h3 className="text-lg font-semibold mb-2">AI 맛집 추천</h3>
            <p className="text-zinc-600 dark:text-zinc-400 text-sm">
              라이딩 강도와 날씨를 고려한 영양학적 관점에서 최적의 맛집을
              추천합니다.
            </p>
          </div>

          <div className="bg-zinc-50 dark:bg-zinc-900 p-6 rounded-xl">
            <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center mb-4">
              <svg
                className="w-6 h-6 text-purple-600 dark:text-purple-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
            </div>
            <h3 className="text-lg font-semibold mb-2">GPX 다운로드</h3>
            <p className="text-zinc-600 dark:text-zinc-400 text-sm">
              생성한 라이딩 플랜을 표준 GPX 형식으로 다운로드하여 GPS 기기에서
              사용합니다.
            </p>
          </div>
        </div>

        {/* CTA Section */}
        <div className="mt-16 text-center space-y-6">
          <h2 className="text-2xl font-bold text-black dark:text-zinc-50">
            이제 바로 시작해보세요
          </h2>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/auth/login"
              className="flex h-12 items-center justify-center gap-2 rounded-full bg-black text-white px-8 text-base font-medium transition-colors hover:bg-zinc-800 dark:bg-white dark:text-black dark:hover:bg-zinc-200"
            >
              로그인
            </Link>
            <Link
              href="/auth/register"
              className="flex h-12 items-center justify-center rounded-full border border-solid border-black/[.08] px-8 text-base font-medium transition-colors hover:border-transparent hover:bg-black/[.04] dark:border-white/[.145] dark:hover:bg-[#1a1a1a]"
            >
              회원가입
            </Link>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-16 text-center text-sm text-zinc-500 dark:text-zinc-500">
          <p>Powered by Next.js & NestJS</p>
        </div>
      </main>
    </div>
  );
}
