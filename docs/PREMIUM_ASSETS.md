# 💎 Premium 3D Model Alışveriş Listesi

Ücretsiz CC0 taraması yapıldı (bkz. `ASSET_GUIDE.md`): doğrulanabilir CC0 kaynaklarında
endüstriyel **lazer kesim / abkant / yarma hattı** kalitesinde model YOK — bu sınıf modeller
ücretli pazaryerlerinde yaşıyor. Aşağıdaki linkler **arama sonucu sayfalarıdır** (ürün linkleri
zamanla ölür, aramalar ölmez). Satın alınca `ASSET_GUIDE.md` adımlarıyla tek satırda takılır.

## Aranacak makineler & bütçe aralıkları (2026 piyasası)

| Makine | Manifest anahtarı | Arama linki | Tipik fiyat | Ne aranmalı |
|---|---|---|---|---|
| Fiber Lazer Kesim | `laser-cell` | [TurboSquid "fiber laser cutting machine"](https://www.turbosquid.com/Search/3D-Models/fiber+laser+cutting+machine) · [CGTrader](https://www.cgtrader.com/3d-models?keywords=fiber+laser+cutting+machine) | $40–150 | Kapalı kabinli (Bystronic/Trumpf tarzı), PBR, ≤150k poly |
| Abkant Pres (Press Brake) | `press-brake` (yeni yuva) | [TurboSquid "press brake"](https://www.turbosquid.com/Search/3D-Models/press+brake) · [CGTrader](https://www.cgtrader.com/3d-models?keywords=press+brake) | $30–120 | Amada/LVD benzeri, animasyonlu koç (ram) varsa altın değerinde |
| Yarma Hattı | `slitting-line` | [CGTrader "slitting line"](https://www.cgtrader.com/3d-models?keywords=slitting+line) · [TurboSquid "coil slitting"](https://www.turbosquid.com/Search/3D-Models/coil+slitting) | $60–250 | Az bulunur; "decoiler + recoiler" ayrı ayrı alıp birleştirmek daha ucuz |
| Forklift | `forklift` | [Sketchfab Store "forklift"](https://sketchfab.com/store/3d-models?q=forklift) · [CGTrader](https://www.cgtrader.com/3d-models?keywords=forklift+pbr) | $10–50 | En bol kategori; rigged tekerlek + çatal tercih |
| AGV | `agv` | [CGTrader "AGV robot"](https://www.cgtrader.com/3d-models?keywords=agv+robot) · [TurboSquid "automated guided vehicle"](https://www.turbosquid.com/Search/3D-Models/automated+guided+vehicle) | $20–80 | Alçak profilli (MiR/KUKA tarzı); LED şeridimiz üstüne binecek |
| Ağır Raf + Rulo | `coil` / raflar | [CGTrader "steel coil warehouse"](https://www.cgtrader.com/3d-models?keywords=steel+coil+warehouse) | $15–60 | Rulo tekstürü (sarım izleri) gerçekçiliği taşır |
| Tavan Vinci | vinç (kod içi) | [TurboSquid "overhead crane"](https://www.turbosquid.com/Search/3D-Models/overhead+crane) | $25–90 | Köprü/araba/kanca AYRI mesh olsun ki animasyonumuz sürsün |

## Satın alma kontrol listesi

1. **Format:** glTF/GLB varsa direkt al; yoksa FBX + PBR texture seti (Blender'da 2 dk'da GLB'ye döner)
2. **Lisans:** "Editorial" ETİKETLİLERİ ALMA (ticari fuar kullanımına kapalı); standart/royalty-free lisans yeterli
3. **Poly bütçesi:** makine başına ≤150k üçgen (fuar makinesi 60fps hedefi); fazlaysa `gltf-transform optimize`
4. **Animasyonlu parçalar:** vinç/abkant gibi hareketli makinelerde parçaların ayrı node olduğunu önizlemeden doğrula — tek birleşik mesh animasyonumuzu öldürür (bkz. ASSET_GUIDE "hibrit" notu)
5. **Ölçek:** satın alma sayfasında gerçek boyut yazıyorsa not al; manifest `scale` ayarı için lazım

## Entegrasyon (hatırlatma)
GLB'yi `packages/demo-3d/public/models/` içine koy → `manifest.json`'a
`"laser-cell": { "file": "laser.glb", "scale": 1, "rotationY": 0 }` ekle → yenile. Kod değişmez.
Animasyonlu makinelerde (yarma, vinç) yalnızca GÖVDE modelini tak, hareketli parçaları prosedürel bırak.
