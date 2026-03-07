/** アプリケーションルートコンポーネント */
import { useEffect, useState } from 'react';
import { useAuth } from './hooks/useAuth';
import { useLocation } from './hooks/useLocation';
import { useSearch } from './hooks/useSearch';
import { useStorage } from './hooks/useStorage';
import { AuthGuard } from './components/AuthGuard';
import { Survey } from './components/Survey';
import { RestaurantCard } from './components/RestaurantCard';
import { ReviewPrompt } from './components/ReviewPrompt';
import { VisitedList } from './components/VisitedList';
import type { AppPhase, SurveyAnswers, Shop, PendingVisit, Review } from './types';

/**
 * アプリ全体のフェーズ制御とデータ管理
 */
function App() {
  const { user, loading: authLoading, signIn, signOut } = useAuth();
  const { getLocation } = useLocation();
  const { shops, loading: searchLoading, error: searchError, search } = useSearch();
  const storage = useStorage();

  const [phase, setPhase] = useState<AppPhase>('intro');
  const [pendingVisits, setPendingVisits] = useState<PendingVisit[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [favoriteShops, setFavoriteShops] = useState<Shop[]>([]);

  // ログイン後に来店予定・レビューを取得
  useEffect(() => {
    if (!user) return;
    void loadData();
  }, [user]);

  const loadData = async () => {
    try {
      const [visits, revs] = await Promise.all([
        storage.getPendingVisits(),
        storage.getReviews(),
      ]);
      setPendingVisits(visits);
      setReviews(revs);

      // ★5レビュー済み店舗を「お気に入り」として管理（表示用）
      const fiveStars = revs.filter((r) => r.rating === 5);
      setFavoriteShops(fiveStars.map((r) => ({
        name: r.shop_name,
        cuisine: r.cuisine ?? '',
        address: '',
        rating: 5,
        reason: '以前★5をつけたお気に入りのお店',
        mapsUrl: `https://maps.google.com/maps?q=${encodeURIComponent(r.shop_name)}`,
      })));
    } catch (err) {
      console.error('データ取得エラー:', err);
    }
  };

  // アンケート完了 → 現在地取得 → 検索
  const handleSurveyComplete = async (answers: SurveyAnswers) => {
    setPhase('locating');
    const loc = await getLocation();

    setPhase('loading');
    try {
      const excluded = await storage.getExcludedShops();
      const excludedNames = excluded.map((e) => e.shop_name);
      await search(answers, loc, excludedNames);
      setPhase('results');
    } catch (err) {
      console.error('検索エラー:', err);
      setPhase('error');
    }
  };

  // 店舗カードタップ → 除外・来店予定保存 → Google Maps
  const handleShopSelect = async (shop: Shop) => {
    try {
      await Promise.all([
        storage.addExcludedShop(shop.name),
        storage.addPendingVisit(shop),
      ]);
      window.open(shop.mapsUrl, '_blank', 'noopener,noreferrer');
      setPhase('departure');
      await loadData();
    } catch (err) {
      console.error('店舗選択エラー:', err);
    }
  };

  // レビュー保存
  const handleRate = async (visit: PendingVisit, rating: number) => {
    await storage.addReview(visit.shop_name, visit.cuisine, rating);
    await storage.deletePendingVisit(visit.id);
    await loadData();
  };

  // スキップ
  const handleSkip = async (visit: PendingVisit) => {
    await storage.deletePendingVisit(visit.id);
    await loadData();
  };


  const renderContent = () => {
    switch (phase) {
      case 'intro':
        return (
          <div className="w-full max-w-md mx-auto px-4 py-6 flex flex-col gap-6">
            {/* 未レビューの来店予定 */}
            {pendingVisits.map((visit) => (
              <ReviewPrompt
                key={visit.id}
                visit={visit}
                onRate={(rating) => handleRate(visit, rating)}
                onSkip={() => handleSkip(visit)}
              />
            ))}

            {/* お気に入り店舗 */}
            {favoriteShops.length > 0 && (
              <div className="flex flex-col gap-2">
                <h3 className="text-sm font-semibold text-gray-600">⭐ お気に入りのお店</h3>
                {favoriteShops.map((shop) => (
                  <RestaurantCard
                    key={shop.name}
                    shop={shop}
                    onSelect={handleShopSelect}
                    isFavorite
                  />
                ))}
              </div>
            )}

            {/* 検索開始ボタン */}
            <button
              onClick={() => setPhase('survey')}
              className="w-full min-h-[56px] bg-blue-500 hover:bg-blue-600 text-white font-bold rounded-2xl text-base transition-colors shadow"
            >
              お店を探す
            </button>

            <VisitedList reviews={reviews} />
          </div>
        );

      case 'survey':
        return (
          <Survey
            onComplete={handleSurveyComplete}
            onCancel={() => setPhase('intro')}
          />
        );

      case 'locating':
        return (
          <div className="flex flex-col items-center justify-center min-h-[40vh] gap-3">
            <div className="text-3xl animate-pulse">📍</div>
            <p className="text-sm text-gray-500">現在地を取得中...</p>
          </div>
        );

      case 'loading':
        return (
          <div className="flex flex-col items-center justify-center min-h-[40vh] gap-3">
            <div className="text-3xl animate-spin">🔍</div>
            <p className="text-sm text-gray-500">AIがお店を探しています...</p>
          </div>
        );

      case 'results':
        return (
          <div className="w-full max-w-md mx-auto px-4 py-6 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-gray-800">
                おすすめのお店 ({shops.length}件)
              </h2>
              <button
                onClick={() => setPhase('intro')}
                className="text-sm text-gray-400 hover:text-gray-600 min-h-[44px]"
              >
                戻る
              </button>
            </div>
            {searchError && (
              <p className="text-sm text-red-500 bg-red-50 rounded-lg px-3 py-2">{searchError}</p>
            )}
            {shops.map((shop) => (
              <RestaurantCard key={shop.name} shop={shop} onSelect={handleShopSelect} />
            ))}
          </div>
        );

      case 'departure':
        return (
          <div className="flex flex-col items-center justify-center min-h-[40vh] gap-4 px-4">
            <div className="text-4xl">🗺️</div>
            <p className="text-base font-medium text-gray-700 text-center">
              Google Mapsを開きました！<br />楽しんできてください。
            </p>
            <button
              onClick={() => setPhase('intro')}
              className="w-full max-w-md min-h-[48px] bg-blue-500 hover:bg-blue-600 text-white font-bold rounded-2xl transition-colors"
            >
              トップに戻る
            </button>
          </div>
        );

      case 'error':
        return (
          <div className="flex flex-col items-center justify-center min-h-[40vh] gap-4 px-4">
            <div className="text-4xl">⚠️</div>
            <p className="text-sm text-gray-600 text-center">
              エラーが発生しました。もう一度お試しください。
            </p>
            <button
              onClick={() => setPhase('intro')}
              className="w-full max-w-md min-h-[48px] bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-2xl transition-colors"
            >
              トップに戻る
            </button>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <AuthGuard user={user} loading={authLoading} onSignIn={signIn}>
      <div className="min-h-screen bg-gray-50">
        {/* ヘッダー */}
        <header className="sticky top-0 z-50 bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
          <button
            onClick={() => setPhase('intro')}
            className="text-base font-bold text-gray-800 hover:text-blue-600 transition-colors"
          >
            今日のお店
          </button>
          {user && (
            <div className="flex items-center gap-3">
              {user.user_metadata?.avatar_url && (
                <img
                  src={user.user_metadata.avatar_url as string}
                  alt={user.user_metadata?.full_name as string ?? 'ユーザー'}
                  className="w-8 h-8 rounded-full"
                />
              )}
              <span className="text-sm text-gray-600 hidden sm:block">
                {user.user_metadata?.full_name as string ?? user.email}
              </span>
              <button
                onClick={() => void signOut()}
                className="text-xs text-gray-400 hover:text-gray-600 min-h-[44px] px-2"
              >
                ログアウト
              </button>
            </div>
          )}
        </header>

        {/* メインコンテンツ */}
        <main className="pb-8">
          {searchLoading ? null : renderContent()}
        </main>
      </div>
    </AuthGuard>
  );
}

export default App;
