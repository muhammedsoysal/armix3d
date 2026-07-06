# Antigravity (AI) Tarafından Yapılan Değişiklikler Özeti

Bu dosya, Antigravity AI asistanı tarafından yapılan son güncellemeleri diğer AI asistanlarına (Claude vb.) veya geliştiricilere aktarmak amacıyla oluşturulmuştur.

## 1. Vercel Deploy Hatasının Çözümü (Monorepo)
- **Dosya:** `vercel.json` (yeni oluşturuldu)
- **Değişiklik:** Vercel'ın "Output klasörü bulunamadı" hatasını çözmek için projenin kök dizinine bir `vercel.json` eklendi.
- **Detay:** Build komutu `npm run build --workspace=@metalnest/demo-3d` olarak ayarlandı ve `outputDirectory` olarak `packages/demo-3d/dist` gösterildi.

## 2. Git Reposu Temizliği
- **Değişiklik:** Ana `Metal` klasöründe yer alan ve karışıklık yaratan eski "MetalCut Pro" dosyaları silindi.
- **Detay:** Sadece `metalnest-digital-twin` içerisindeki dosyalar baz alınarak GitHub'a (armix3d reposuna) temiz bir `Initial commit` atıldı.

## 3. Rulo Boyutları ve Gözle Görülür Tükenme Efekti
- **Dosya:** `packages/demo-3d/src/sim/constants.ts`
- **Değişiklik:** `COIL` sabitleri güncellendi.
- **Detay:** 
  - Başlangıç yarıçapı (`R0`) 1.15'ten 0.85'e düşürüldü (daha gerçekçi boyut).
  - Sac kalınlığı (`THICKNESS`) 0.005'ten `0.035`'e çıkarıldı. Bu sayede simülasyon çalışırken rulonun fiziksel olarak küçüldüğü çok daha hızlı ve gözle görülür hale getirildi.

## 4. Kesim Sonrası Parçanın Küçülme (Genişlik) Hatası
- **Dosya:** `packages/demo-3d/src/scenes/VacuumLifter.tsx` ve `packages/demo-3d/src/scenes/Pallet.tsx`
- **Değişiklik:** Kesilen parça vakumla kaldırıldığında genişliğinin aniden daralması sorunu çözüldü.
- **Detay:** `pieceRef.current.scale` değerindeki genişlik `part.width` yerine sabit olan `LAYOUT.sheetWidth` (1.2m) yapıldı. Aynı şekilde palet üzerindeki istifte de `LAYOUT.sheetWidth` kullanılarak görsel bütünlük sağlandı.

## 5. Parça Kaldırılırken Oluşan Garip Şekil (Bükülme/Springback)
- **Dosya:** `packages/demo-3d/src/scenes/VacuumLifter.tsx` ve `packages/demo-3d/src/sim/constants.ts`
- **Değişiklik:** Parçanın patates cipsi (kase) gibi iki eksende esnemesi sorunu çözüldü.
- **Detay:** 
  - `constants.ts` içindeki `coilSetAmplitude` fonksiyonunun ürettiği maksimum bükülme değeri azaltıldı (0.077'den daha makul seviyelere çekildi).
  - `VacuumLifter.tsx` içindeki deformasyon formülünden enine bükülme (Z ekseni / `v*v`) faktörü tamamen çıkarıldı. Artık sac sadece uzunlamasına esniyor (gerçekçi sac davranışı).

## 6. Birden Fazla Paletin Ekranda Görünmesi ve Hızlandırılması
- **Dosyalar:** `simStore.ts`, `SimulationController.tsx`, `Pallet.tsx`
- **Değişiklik:** Dolup kaldırılan paletlerin ekrandan tamamen silinmesi yerine sıraya dizilmesi sağlandı ve palet dolma hızı artırıldı.
- **Detay:** 
  - Simülasyonda 11 parça beklemek uzun sürdüğü için, bir paletin dolma limiti `11`'den `5` parçaya düşürüldü. Artık çok daha hızlı palet dolacak.
  - `simStore.ts` içine `completedPallets` (Tamamlanan Paletler) dizisi eklendi.
  - Dolup kenara alınan paletler artık sağa doğru diziliyor, böylece çok sayıda paletin sıraya girdiği görsel olarak test edilebiliyor.

## 7. Arayüzün Modernizasyonu ve Aktif İş Paneli
- **Dosya:** `packages/demo-3d/src/hud/ProductionPlanHUD.tsx`
- **Değişiklik:** Ekranın sol altındaki "Aktif İş" paneli tamamen modern "Glassmorphism" tasarımıyla yenilendi.
- **Detay:** 
  - Panel arka planına yarı şeffaf buzlu cam (backdrop-blur) ve renk geçişleri eklendi.
  - Kesilen ürünün ismine şık bir degrade (gradient) yazı tipi uygulandı.
  - Fire Oranı, Öncelik Skoru ve Kesim Adeti istatistikleri için modern tasarımlı ikonlar ve hover animasyonları eklendi.
  - Aşama ilerleme çubuğu ışıklı ve daha şık bir animasyona çevrildi.

## 8. İş Kuyruğu Listesinin Yenilenmesi (Gerçek Veri)
- **Dosya:** `packages/demo-3d/src/hud/ProductionPlanHUD.tsx`
- **Değişiklik:** Kullanıcının talebi üzerine statik mock iş listesi kaldırıldı, yerine gerçek Karar Motorundan gelen kuyruk listesi detaylıca eklendi.
- **Detay:** 
  - Listede "TOPLAM X (DÖNGÜ)" şeklinde bir ibare eklenerek üretim planının kaç parçalık sürekli bir döngüde çalıştığı netleştirildi.
  - Gelecek olan sıradaki 5 iş, sol üstte modern bir tasarımla (isim, sku ve kesilecek adet ile) kuyruk formatında gösterilmeye başlandı.
