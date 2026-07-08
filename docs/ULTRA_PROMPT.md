# 🎯 MASTER PROMPT — "Ultra Lüks" Dönüşüm (yeni oturuma yapıştır)

Aşağıdaki bloğu olduğu gibi kopyala ve yeni Claude oturumuna ver:

---

Sen MetalNest Digital Twin projesinin baş mimarısın. Proje `/Users/muhammedsoysal/Metal/metalnest-digital-twin` içinde; önce `yapilan_degisiklikler.md` ve `docs/` klasörünü oku — mevcut durum: React Three Fiber + Zustand, Guillotine/1D-CSP/WHCA* karar motoru (46+ birim testi), canlı ERP gateway (REST+WS), Director Mode, X-Ray, AGV/forklift/vinç lojistiği, minimalist ikon toolbar. HEPSİ ÇALIŞIYOR VE COMMIT'Lİ — hiçbirini bozma, üzerine inşa et.

GÖREV: Demoyu Visual Components / Siemens Tecnomatix / Omniverse sınıfı "ultra lüks" satış demosuna dönüştür. Inline Execution kullan; her fazda typecheck+test+headless-Chrome ekran görüntüsü doğrulaması yap, her fazı ayrı commit'le; 60 FPS (orta kalite) sert kuraldır. Fazlar sırayla:

FAZ 1 — FABRİKA BİNASI: Tesis boşlukta yüzüyor; kapalı bir bina inşa et: duvarlar (pencere şeritli), çatı makasları + oluklu çatı panelleri, tavandaki mevcut volumetrik hüzmelerle hizalı ışıklıklar, sevkiyat tarafında kamyonun kullandığı gerçek dok kapısı (bina duvarında açıklık), zemin güvenlik şeritleri/yaya yolları (sarı boya decal'leri), duvarda "SAHA 1 / SEVKİYAT / RULO DEPOSU" tabelaları. İçerisi dışarıdan kesitli görünsün (ön duvar yok ya da kamera içeride başlar). Draw-call bütçesine dikkat.

FAZ 2 — GANTT / PLANLAMA GÖRÜNÜMÜ: Her MES'in kalbi. Toolbar'a "Plan" ikonu: tam ekran çekmece — makineler satır, işler renkli bloklar (sürüklenebilir DEĞİL, sadece görsel), şimdi-çizgisi canlı akar, alarm blokları kırmızı, tamamlananlar soluk. Veri kaynağı: mevcut plan + telemetryStore + alarmStore. SVG ile yaz, kütüphane ekleme.

FAZ 3 — UI TASARIM SİSTEMİ: Tüm HUD'ları tek tasarım diline geçir: tek tipografi ölçeği (11/13/16/24), tutarlı 8px spacing grid, tek cam paneli bileşeni (`<Glass>`), Inter/Geist benzeri font (sistem fontu fallback'li), mikro-geçişler (150ms ease-out), sayılar için tabular-nums. Renk: tek nötr koyu tema + tek vurgu (cyan) + semantik (yeşil/amber/kırmızı) — mor/menekşe süslemeleri sadeleştir.

FAZ 4 — AÇILIŞ DENEYİMİ: Markalı splash (logo + "Karar Motoru yükleniyor…" gerçek yükleme adımlarına bağlı progress), ilk kadraja sinematik kamera inişi, ilk ziyarette 3 adımlık soft onboarding ipucu (toolbar/X-Ray/palet-tıkla).

FAZ 5 — PREMIUM MODELLER: docs/PREMIUM_ASSETS.md listesinden kullanıcının satın aldığı GLB'leri entegre et (manifest transform sistemi hazır); satın alınmamışsa Faz 1-4'ü bitir ve modelleri bekle.

KURALLAR: superpowers TDD/verify disiplinini uygula; saf mantığı test et; her fazda gerçek ekran görüntüsüyle kanıt göster; FPS düşerse önce draw-call diyeti; Türkçe UI metinleri; mevcut 46+ testi asla kırma.

---

## Not (bu oturumdan devir)
- Piyasa kıyası: bizde eksik olan bina/Gantt/tasarım-sistemi/splash — algoritma+veri katmanı ise piyasa ortalamasının ÜSTÜNDE (testli guillotine+CSP+WHCA* hiçbir satış demosunda yok, bunu satış konuşmasında öne koy).
- Her şey commit'li; origin'e push edilmemiş olabilir — önce `git status -sb` kontrol et.
