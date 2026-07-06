import { useEffect } from "react";
import { useFrame } from "@react-three/fiber";
import {
  DEFAULT_SCORER_WEIGHTS,
  HeuristicScrapEstimator,
  ProductionPlanBuilder,
  createSalesProvider,
  createStockProvider,
  getPartDefinitions,
  machineStateStore,
  nextMachineState,
  type DataSource,
} from "@metalnest/core";
import {
  COIL,
  PHASE_DURATION,
  PIECES_PER_RECOMMENDATION,
  coilRadiusFor,
  coilSetAmplitude,
  simFrame,
  LAYOUT,
} from "./constants";
import { currentPart, currentPartMeters, currentRecommendation, simStore } from "./simStore";
import { computeNest } from "../nesting/nestingMath";
import { scrapStore } from "../nesting/scrapStore";

/**
 * Simülasyonun kalbi: üretim planını karar motorundan yükler ve makine
 * döngüsünü (IDLE→FEEDING→CUTTING→LIFTING) plana göre sürer. Sahne hiçbir
 * zaman resetlenmez; tüm geçişler machineStateStore.transition üzerindendir.
 */
export function SimulationController() {
  useEffect(() => {
    const source = (import.meta.env.VITE_DATA_SOURCE ?? "mock") as DataSource;
    const stockProvider = createStockProvider(source);
    const salesProvider = createSalesProvider(source);

    Promise.all([stockProvider.getStockItems(), salesProvider.getSalesRecords()])
      .then(([stock, sales]) => {
        const parts = getPartDefinitions();
        const plan = new ProductionPlanBuilder(new HeuristicScrapEstimator()).build({
          parts,
          stock,
          sales,
          weights: DEFAULT_SCORER_WEIGHTS,
        });
        simStore
          .getState()
          .setPlan(plan, Object.fromEntries(parts.map((p) => [p.sku, p])));
        console.log(
          "[PLAN] Karar motoru çıktısı:",
          plan.recommendations
            .map((r, i) => `${i + 1}. ${r.sku} (skor ${r.priorityScore}, fire %${r.estimatedScrapPercent})`)
            .join(" | "),
        );
      })
      .catch((err) => console.error("[PLAN] Üretim planı yüklenemedi:", err));
  }, []);

  useFrame((_, rawDelta) => {
    const sim = simStore.getState();
    if (!sim.plan || sim.plan.recommendations.length === 0 || sim.isPlanCompleted) {
      if (machineStateStore.getState().state !== "IDLE") {
        machineStateStore.getState().transition("IDLE", { sku: "", source: "Sistem" });
      }
      return;
    }

    const delta = Math.min(rawDelta, 0.1); // sekme arka planda kalınca sıçramayı önle
    const machine = machineStateStore.getState();
    const rec = currentRecommendation(sim)!;
    const part = currentPartMeters(sim);
    const duration = PHASE_DURATION[machine.state];

    if (machine.state === "FEEDING") {
      const fed = (part.length / duration) * delta;
      simFrame.totalFedLength += fed;
      const radius = coilRadiusFor(simFrame.totalFedLength);
      simFrame.coilAngle += fed / radius;
      if (radius <= COIL.RMIN + 1e-4) {
        simFrame.totalFedLength = 0;
        console.log("[SIM] Rulo tükendi — yeni rulo yüklendi.");
      }
    }

    simFrame.progress += delta / duration;
    if (simFrame.progress < 1) return;
    simFrame.progress = 0;

    // Faz tamamlandı — yan etkiler + tek geçerli yoldan geçiş
    if (machine.state === "CUTTING") {
      // Parça serbest kalınca geri yaylanacak rulo-seti eğriliğini yakala
      simFrame.bowAmpAtCut = coilSetAmplitude(coilRadiusFor(simFrame.totalFedLength));
      simFrame.pieceBow = 0; // masada bastırılmış: düz
      simFrame.pieceBowVel = 0;

      const p = currentPart(sim);
      if (p) {
        const sheetW = LAYOUT.sheetWidth * 1000;
        const partW = part.width * 1000;
        const partL = part.length * 1000;
        const kerfMm = 5;
        const nest = computeNest(partW, partL, sheetW, partL, kerfMm);
        scrapStore.getState().addCut(nest, sheetW, partL, LAYOUT.sheetThickness * 1000);
      }
    }
    if (machine.state === "LIFTING") {
      simStore.setState((s) => {
        const stack = [
          ...s.palletStack,
          { sku: rec.sku, width: part.width, length: part.length },
        ];
        const palletFull = stack.length > 4;
        let recIndex = s.recIndex;
        let pieces = s.piecesCutForRec + 1;
        let isPlanCompleted = s.isPlanCompleted;
        const target = Math.min(rec.recommendedQuantity, PIECES_PER_RECOMMENDATION);
        if (pieces >= target) {
          if (s.recIndex + 1 >= s.plan!.recommendations.length) {
            isPlanCompleted = true;
          } else {
            recIndex = s.recIndex + 1;
          }
          pieces = 0;
        }
        let completed = s.completedPallets;
        if (palletFull) {
          console.log("[SIM] Palet doldu — AGV çağrıldı, yeni palet.");
          // Sona ekle: grid indeksleri stabil kalır (paletler yer değiştirmez)
          completed = [...s.completedPallets, { id: Date.now(), stack }].slice(-6);
        }
        return {
          palletStack: palletFull ? [] : stack,
          completedPallets: completed,
          piecesCutForRec: pieces,
          recIndex,
          totalPiecesCut: s.totalPiecesCut + 1,
          isPlanCompleted,
        };
      });
    }

    const next = nextMachineState(machine.state);
    const nextRec = currentRecommendation(simStore.getState())!;
    machine.transition(next, {
      sku: next === "FEEDING" ? nextRec.sku : rec.sku,
      source: "Karar Motoru",
    });
  });

  return null;
}
