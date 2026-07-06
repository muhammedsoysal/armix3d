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

## 9. Sınırsız, Lineer ve Kaydırılabilir İş Kuyruğu (Scrollable Queue)
- **Dosya:** `ProductionPlanHUD.tsx`, `SimulationController.tsx`
- Sonsuz döngü (modulo) kaldırılarak planın bir **sonu olması** sağlandı. Plan bittiğinde makine `IDLE` moduna geçip tamamen duruyor.
- Kuyruk artık slice (kesme) işlemiyle kısıtlanmıyor, tüm görevler listeleniyor ve `overflow-y-auto max-h-[350px]` özelliği sayesinde zarif bir scrollbar ile kaydırılabiliyor.
- İşler tamamlandığında ortada beliren dev bir **"Üretim Tamamlandı"** paneli eklendi (toplam kesim ve palet adetlerini raporlar).

## 10. Sektörel Uyum: Paslanmaz Çelik Mock Verisi
- **Dosya:** `packages/core/src/data/mockCatalog.ts`
- Mock verilerdeki DKP sac, Alüminyum gibi jenerik değerler paslanmaz çelik endüstrisine uygun olarak revize edildi: `304 Paslanmaz (BA)`, `316L Paslanmaz`, `430 Paslanmaz (2B)`.
- Ürün isimleri sektöre uyarlandı: "Asansör Kapı Sacı", "Endüstriyel Gıda Tank Paneli" vb. (Hiçbir şirket ismi geçmez, sadece sektörel gerçekçilik sağlar).

## 11. Endüstriyel Depo Raf Sistemi ve Gezer Vinç
- **Dosya:** `IndustrialCoilStorage.tsx` (Yeni), `MachineLine.tsx`
- Basit ahşap takozlar yerine, Three.js primitive objeleriyle devasa **Çelik Karkas Raf Sistemi** yapıldı.
- Sahanın tepesine çelik bir **Gezer Vinç (Overhead Crane)** sistemi yerleştirilerek fabrika lojistik havası verildi.

## 12. Etkileşimli Akıllı Bobinler (3D Hover Kartları)
- **Dosya:** `IndustrialCoilStorage.tsx`
- Raflarda bekleyen rulolara (bobinlere) hover (üzerine gelme) efekti eklendi. Mouse ile üzerine gelindiğinde rulo mavi parlıyor ve bir **Glassmorphism 3D Bilgi Kartı (Html Drei)** beliriyor.
- Kartta o anki ruloya ait detaylı stok verileri yazıyor (Malzeme Türü, Kalınlık, Stok Adeti, Hangi Üründe Kullanıldığı).

## 13. Otonom Lojistik (The Living Floor - AGV)
- **Dosyalar:** `agvLogic.ts`, `AGV.tsx`, `GuideLanes.tsx` vb.
- Sahada otonom olarak dolaşan AGV'ler (Otonom Taşıyıcı Robotlar) eklendi.
- Kesim bitip palet dolduğunda AGV gelip paleti fiziksel olarak alıp stok alanına taşıyor.
- Yere veri akışını gösteren ışıklı taşıma yolları (Guide Lanes) ve arka planda dolaşan devriye AGV'si eklendi.
- Gelecek .glb/.stl modelleri için `OptionalModel` altyapısı hazırlandı.

## 14. Sinematik Efektler (Cinematic Post Stack)
- Sahneye Bloom (Lazer parlaması), Volumetric Shafts (Tavandan süzülen tozlu ışık hüzmeleri) eklendi.
- Kesim anında sıçrayan kıvılcım (sparks) efektleri iyileştirildi.

## 15. Fuar Otopilot Kamerası (Director Mode)
- **Dosyalar:** `DirectorCamera.tsx`, `DirectorHUD.tsx`
- Fuarda kimse cihaza dokunmadığında devreye giren akıllı kamera sistemi.
- Makine kesim yaparken, palet taşınırken kameranın doğru açılara uçması ve sinematik geçişler (Depth of Field) eklendi.

## 16. X-Ray & Hologram Veri Katmanı (Data Layer Toggle)
- Tüm sahneyi "TRON" tarzı neon çizgili bir dijital ikiz hologramına dönüştüren "X-Ray" modu eklendi.
- Makineler arasında veri akışını (pipelines) gösteren parlak çizgiler ve makinelerin üzerine canlı simülasyon durumlarını basan "Data Billboards" (Veri Tabelaları) asıldı.
