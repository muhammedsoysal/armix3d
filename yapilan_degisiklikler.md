# Antigravity (AI) Tarafından Yapılan Değişiklikler Özeti

Bu dosya, Antigravity AI asistanı tarafından yapılan son güncellemeleri diğer AI asistanlarına (Claude vb.) veya geliştiricilere aktarmak amacıyla oluşturulmuştur.

## 1. Vercel Deploy Hatasının Çözümü (Monorepo)
- **Dosya:** `vercel.json`
- **Değişiklik:** Vercel'ın "Output klasörü bulunamadı" hatasını çözmek için eklendi. Build komutu `npm run build --workspace=@metalnest/demo-3d` ve output directory `packages/demo-3d/dist` olarak belirlendi.

## 2. Git Reposu Temizliği
- Eski "MetalCut Pro" dosyaları silinerek, sadece dijital ikiz dosyaları temiz bir şekilde Github'a yüklendi.

## 3. Rulo Boyutları ve Fiziksel Tükenme Efekti
- **Dosya:** `packages/demo-3d/src/sim/constants.ts`
- Rulo kalınlığı (THICKNESS) 0.005'ten `0.035`'e çıkarıldı, böylece rulo artık çalışırken görsel olarak çok hızlı tükeniyor.
- Bükülme efekti (springback) onarılarak sacın cips gibi kavislenmesi sorunu giderildi. Kesilen parça artık aslına uygun davranıyor.

## 4. Kesim Sonrası Genişlik Hatasının Çözümü
- **Dosya:** `packages/demo-3d/src/scenes/VacuumLifter.tsx`
- Parça kaldırıldığında `part.width` yerine doğrudan `LAYOUT.sheetWidth` baz alınarak genişlikteki anlık daralma hatası engellendi.

## 5. Birden Fazla Palet ve Stok Alanı Tasarımı
- **Dosyalar:** `simStore.ts`, `SimulationController.tsx`, `Pallet.tsx`
- **Palet Dolma Hızı:** Görsel testin hızlanması için palet dolma limiti 11 parçadan `5` parçaya indirildi.
- **Grid (Matris) Stoklama:** Kenara alınan paletler artık sadece düz bir çizgide değil, gerçek bir depolama alanı gibi 2 satırlı bir grid (arka arkaya dizilmiş) şeklinde farklı noktalara stoklanıyor. Kenarda biriken maksimum palet sayısı 6'ya çıkarıldı.

## 6. Arayüzün Modernizasyonu (Aktif İş Paneli)
- **Dosya:** `packages/demo-3d/src/hud/ProductionPlanHUD.tsx`
- Aktif İş paneli "Glassmorphism" tasarımıyla tamamen yenilendi. Yarı saydam arka plan, parlak gradyan yazılar ve modern SVGs eklendi.

## 7. İş Kuyruğu (Liste) Döngü Tasarımı
- **Dosya:** `ProductionPlanHUD.tsx`
- Mock liste tamamen silinip yerine Karar Motorunun **gerçek döngüsel listesi** eklendi.
- **Gelişmiş Durum Takibi:** Artık listede tamamlanan bir önceki iş hemen silinmiyor; **yeşil bir tik ile "Tamamlandı" statüsünde ve üzeri çizili olarak** bir süre ekranda kalıyor.
- Aktif olarak kesilen iş ise mavi renkle parlayarak (animasyonlu) ve anlık kesim adedini (örnek: 2/5) gösterecek şekilde güncelleniyor.

## 8. Domain Kuralları: Sac Genişliği Sınırları (Karar Motoru)
- **Dosya:** `packages/core/src/engine/ScrapEstimator.ts`
- Kullanıcının sorusu üzerine karar motoru incelendi: Sistem şu an heuristik formüllerle (grid hesabı) parçanın genişlik (`part.width`) ve uzunluk boyutlarının rulonun genişliğine sığıp sığmadığını zaten kontrol etmektedir. Parça rulodan daha genişse 90 derece döndürerek sığdırmayı dener, iki yönde de sığmıyorsa `count === 0` döner ve bu parçayı üretim planından otomatik çıkartır/reddeder. Yani rulodan daha geniş parçalar sistem tarafından güvenli bir şekilde reddedilmektedir.
