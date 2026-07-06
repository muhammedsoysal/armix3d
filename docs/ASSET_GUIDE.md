# 🎨 Gerçekçi 3D Model Entegrasyon Rehberi

Sahnedeki **her** placeholder tek satır JSON ile gerçek modele dönüşür — kod değişikliği gerekmez.
Pipeline zaten canlı: `truck` şu an gerçek bir GLB (Cesium Milk Truck) ile çalışıyor; aynı adımları izleyin.

## 1. Nasıl çalışır

`packages/demo-3d/public/models/manifest.json` ad → dosya eşler. `OptionalModel name="..."`
sarmalayıcısı manifest'te ad bulursa GLB/STL'i yükler, bulamazsa prosedürel placeholder'ı çizer.

```json
{
  "truck":    { "file": "cesium-milk-truck.glb", "scale": 1.15, "rotationY": -1.5708, "position": [0, 0, -0.6] },
  "forklift": "forklift.glb",
  "agv":      { "file": "agv.glb", "scale": 0.01 }
}
```

- **string biçim**: sadece dosya adı (ölçek 1, dönüş 0).
- **nesne biçim**: `scale` (tekdüze çarpan), `rotationY` (radyan; -1.5708 = -90°), `position` (m cinsinden yerel ofset).

## 2. Mevcut model yuvaları (manifest anahtarları)

| Anahtar | Sahnedeki nesne | Hedef gerçek boyut |
|---|---|---|
| `truck` | Sevkiyat kamyonu (✅ gerçek model takılı) | ~6 m uzun, +z yönüne bakar |
| `forklift` | Raf sahasında park halinde | ~2.5 m uzun |
| `agv` | AGV-01 + devriye AGV (her ikisi) | ~1.1 × 0.8 m, alçak |
| `pallet` | Tüm paletler | 1.2 × 1.2 m EUR palet |
| `coil` | Aktif rulo | Ø1.7 m × 1.3 m |
| `cutting-gantry` | Kesim portalı | ~2 m yüksek köprü |
| `slitting-line` | Yarma hattı (komple) | ~5.5 m hat |
| `banding-station` | Çemberleme kemeri | ~1.9 m kemer |

## 3. Güvenilir ücretsiz kaynaklar

| Kaynak | Lisans | Not |
|---|---|---|
| **Poly Pizza** (poly.pizza) | CC0 / CC-BY filtrelenebilir | "forklift", "crane", "industrial" aramaları zengin; doğrudan GLB indirir |
| **Quaternius** (quaternius.com) | CC0 | Stilize ama tutarlı paketler; ticari kullanım serbest |
| **Kenney** (kenney.nl/assets) | CC0 | Kit-bash endüstriyel parçalar |
| **Sketchfab** (sketchfab.com) | Filtre: "Downloadable" + CC0/CC-BY | En yüksek kalite PBR modeller burada; glTF olarak indirin |
| **Khronos glTF-Sample-Assets** (GitHub) | Çoğu CC0/CC-BY | Doğrulanmış, temiz GLB'ler |

**Lisans kuralı:** CC0 → dilediğiniz gibi. CC-BY → `public/models/ATTRIBUTIONS.md` tablosuna satır ekleyin (dosya repoda hazır). GPL/editorial modellerden fuar demosu için kaçının.

## 4. Adım adım entegrasyon

1. Modeli **GLB** (binary glTF) olarak indirin. FBX/OBJ geldiyse: [gltf.report](https://gltf.report) veya Blender → File > Export > glTF 2.0.
2. Dosyayı `packages/demo-3d/public/models/` içine kopyalayın.
3. `manifest.json`'a anahtar ekleyin (yukarıdaki tablodan).
4. `npm run dev` → konsolda `[ASSET] N gerçek model bulundu` görün.
5. **Ölçek ayarı:** model dev/minicik görünüyorsa `scale` ile oynayın (10x'lik adımlarla başlayın: 0.01, 0.1, 1, 10 — çoğu model cm veya inç ile export edilir).
6. **Yön ayarı:** model yanlış yöne bakıyorsa `rotationY`: ±1.5708 (90°) veya 3.1416 (180°).
7. **Performans:** fuar makinesi için model başına ≤ 5 MB / ≤ 100k üçgen hedefleyin. Büyük modelleri sıkıştırın: `npx gltf-transform optimize girdi.glb cikti.glb --compress draco` (draco'yu GLTFLoader otomatik çözer — three-stdlib dekode desteği içerir; sorun olursa sıkıştırmasız optimize edin: `--compress false`).

## 5. Kiosk/offline notu

Modeller `public/` altında olduğu için build çıktısına gömülür — fuar makinesi internetsiz çalışır.
Vercel deploy'unda da otomatik yayınlanır; ekstra adım yok.

## 6. Sorun giderme

- **Model görünmüyor:** konsolda 404 var mı? Dosya adı manifest ile birebir aynı mı (büyük/küçük harf)?
- **Model siyah:** modelde ışık yok — sahne ışıkları PBR materyalleri aydınlatır; metalness=1 + tamamen siyah baseColor'lı modellerde environment map devrede, yine siyahsa modelin texture'ları eksik demektir (glb yerine gltf+bin+png indirmişsinizdir — GLB alın).
- **X-Ray modunda garip:** normaldir — hologram swap'ı GLB mesh'lerine de uygulanır ve geri alınır.
- **Placeholder'a dönmek:** manifest'ten satırı silin, yenileyin.
