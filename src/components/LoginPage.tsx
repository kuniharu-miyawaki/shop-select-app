/** Googleログイン画面 */

interface LoginPageProps {
  onSignIn: () => Promise<void>;
}

/**
 * Googleでログインするランディング画面
 */
export function LoginPage({ onSignIn }: LoginPageProps) {
  const handleSignIn = async () => {
    try {
      await onSignIn();
    } catch (err) {
      console.error('ログインエラー:', err);
      alert('ログインに失敗しました。もう一度お試しください。');
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-sm p-8 flex flex-col items-center gap-6">
        <h1 className="text-2xl font-bold text-gray-800">今日のお店</h1>
        <p className="text-sm text-gray-500 text-center">
          現在地から徒歩10分圏内のおすすめのお店をAIが提案します
        </p>
        <button
          onClick={handleSignIn}
          className="w-full min-h-[44px] flex items-center justify-center gap-3 bg-white border border-gray-300 rounded-lg px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors shadow-sm"
        >
          {/* Googleロゴ（SVG） */}
          <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
            <path
              fill="#4285F4"
              d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z"
            />
            <path
              fill="#34A853"
              d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z"
            />
            <path
              fill="#FBBC05"
              d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z"
            />
            <path
              fill="#EA4335"
              d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z"
            />
          </svg>
          Googleでログイン
        </button>
      </div>
    </div>
  );
}
