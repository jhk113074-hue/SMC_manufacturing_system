import type { DB, Material, Product, Recipe, Settings, MachineProfile } from '../types'

// 원본: 물탱크 배합(비중·단가), 설정값 계산 3번 표(비중), SMC_Calculation(밀도)
export const SEED_MATERIALS: Material[] = [
  { id: 'm-resin', cat: 'resin', name: '불포화수지', grade: 'SC-637S', density: 1.1, price: 2700 },
  { id: 'm-ps', cat: 'lpa', name: '저수축제', grade: 'PS40', density: 1.0, price: 2500 },
  { id: 'm-sm', cat: 'sm', name: '희석제', grade: 'SM', density: 0.91, price: 3600 },
  { id: 'm-k972', cat: 'additive', name: '분리방지제', grade: 'K972', density: 1.02, price: 22500 },
  { id: 'm-k996', cat: 'additive', name: '분산제', grade: 'K996', density: 1.04, price: 15300 },
  { id: 'm-109n', cat: 'inhibitor', name: '중합금지제', grade: 'CBA109N', density: 0.91, price: 4100 },
  { id: 'm-tbpb', cat: 'initiator', name: '경화제', grade: 'TBPB', density: 1.04, price: 6000 },
  { id: 'm-308', cat: 'initiator', name: '초기 증점조절제', grade: 'CBA308S', density: 0.98, price: 8400, note: '단가는 물탱크 배합 시트의 이름 없는 행(8,400)을 가정. 확인 필요' },
  { id: 'm-fhp', cat: 'pe', name: '저수축제(PE 파우더)', grade: 'FHP05040', density: 0.96, price: 4000 },
  { id: 'm-zn', cat: 'release', name: '이형제', grade: 'HI-FLOW', density: 1.1, price: 3500 },
  { id: 'm-caco3', cat: 'filler', name: '충진제', grade: 'CaCO3', density: 2.7, price: 100 },
  { id: 'm-mgo', cat: 'thickener', name: '증점제', grade: 'MGO-813', density: 1.5, price: 5360 },
  { id: 'm-color', cat: 'color', name: '조색제', grade: 'GRAY(9098)', density: 2.05, price: 5149 },
  { id: 'm-glass', cat: 'glass', name: '유리섬유', grade: '4800TEX', density: 2.54, price: 1050 },
]

const L = (
  resin: number, ps: number, sm: number, k972: number, k996: number, c109: number, tbpb: number,
  c308: number, fhp: number, zn: number, caco3: number, mgo: number, color: number, glass: number,
) => [
  { materialId: 'm-resin', phr: resin }, { materialId: 'm-ps', phr: ps }, { materialId: 'm-sm', phr: sm },
  { materialId: 'm-k972', phr: k972 }, { materialId: 'm-k996', phr: k996 }, { materialId: 'm-109n', phr: c109 },
  { materialId: 'm-tbpb', phr: tbpb }, { materialId: 'm-308', phr: c308 }, { materialId: 'm-fhp', phr: fhp },
  { materialId: 'm-zn', phr: zn }, { materialId: 'm-caco3', phr: caco3 }, { materialId: 'm-mgo', phr: mgo },
  { materialId: 'm-color', phr: color }, { materialId: 'm-glass', phr: glass },
]

export const SEED_PRODUCTS: Product[] = [
  { id: 'p-tank', code: 'SMCSHEETWTR33', name: 'SMC 물탱크용', arealKgM2: 4.6, widthMm: 1100, note: '생산일지·라벨 기준(GF 33%)' },
]

const now = new Date().toISOString()
const base = { version: 1, status: 'draft' as const, createdAt: now, reason: '엑셀(물탱크 배합)에서 이관. 현행 승인 처방 확정 전' }

// 원본: 물탱크 배합 시트 4개 처방(물탱크 / 물탱크2 / YSACC1 / YSACC2)
export const SEED_RECIPES: Recipe[] = [
  { ...base, id: 'r-tank-1', productId: 'p-tank', family: '물탱크', lines: L(70, 30, 7.5, 1, 1, 1.5, 1.2, 1.5, 5, 5, 170, 1.5, 4, 148) },
  { ...base, id: 'r-tank-2', productId: 'p-tank', family: '물탱크2', lines: L(70, 30, 7.5, 1, 1, 1.7, 1.2, 1, 5, 5, 170, 2.2, 3.5, 126) },
  { ...base, id: 'r-ysacc-1', productId: 'p-tank', family: 'YSACC1', lines: L(65, 35, 7, 1.2, 0, 0.4, 1.2, 0, 4, 4, 185, 1.2, 1.1, 132) },
  { ...base, id: 'r-ysacc-2', productId: 'p-tank', family: 'YSACC2', lines: L(66, 20, 15.12, 0.4, 0, 1.3, 1, 0, 5.75, 6.5, 185, 3.8, 1.1, 132) },
]

export const SEED_MACHINE: MachineProfile = {
  bladeMm: 6,
  viscosityCps: 10000,
  pasteHeightMm: 50,
  tex: 4800,
  cutInch: 1,
  cutters: [
    { on: true, rovings: 48, blades: 24 },
    { on: true, rovings: 48, blades: 24 },
  ],
}

// 원본: 공정 표준서, 시트 관리 수칙, 기계 관리 가이드
// 보관 온도(30 vs 40℃)는 원본이 상충하므로 엄격한 쪽(30)을 임시값으로 둠 — 결정 필요
export const SEED_SETTINGS: Settings = {
  siteCode: 'HYVN',
  storageTempMaxC: 30,
  fillerTempMaxC: 45,
  mixRpmMax: 950,
  arealTolKg: 0.1,
  widthTolMm: 2,
  thicknessTolMm: 0.1,
  matureMinH: 18,
  matureMaxH: 36,
  shelfMonths: 2,
  cutterBladeChangeTon: 300,
  initViscMaxPs: 0,
  bladeBaseKg: 0,
}

export function seedDB(): DB {
  return {
    user: '',
    materials: SEED_MATERIALS,
    products: SEED_PRODUCTS,
    recipes: SEED_RECIPES,
    machine: SEED_MACHINE,
    settingRuns: [],
    mixOrders: [],
    runs: [],
    lots: [],
    settings: SEED_SETTINGS,
    audit: [],
  }
}
