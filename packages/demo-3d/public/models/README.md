# Gerçek 3D Modeller (STL / GLB)

Placeholder primitiflerin yerine gerçek model koymak için:

1. `.glb` (tercih) veya `.stl` dosyasını bu klasöre kopyala.
2. `manifest.json`'a bir satır ekle:

```json
{
  "straightener-frame": "dogrultucu.glb",
  "pallet": "palet.stl"
}
```

Kod değişikliği gerekmez — sahne bir sonraki açılışta gerçek modeli kullanır,
dosya yoksa placeholder'a geri döner.

## Kullanılabilir yuva adları
| Ad | Sahnedeki karşılığı |
|---|---|
| `decoiler-stand` | Rulo taşıyıcı ayaklar |
| `straightener-frame` | Doğrultucu gövdesi (merdaneler prosedürel kalır) |
| `cutting-gantry` | Kesim portal gövdesi (kafa/lazer prosedürel kalır) |
| `pallet` | Ahşap palet tabanı |

> Hareketli parçalar (rulo gövdesi, merdaneler, kesim kafası, sac) prosedürel
> kalmalıdır — animasyonları (yarıçap küçülmesi, dönüş, springback) koddan sürülür.

## Ölçek/eksen
Sahne birimi metredir, +X sac akış yönüdür. STL'ler genelde mm ölçeğindedir;
gerekiyorsa Blender'da 0.001 ölçekleyip +X'e hizalayarak dışa aktarın.
