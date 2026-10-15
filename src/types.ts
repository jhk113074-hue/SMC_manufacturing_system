export type MatCat =
  | 'resin' | 'lpa' | 'sm' | 'additive' | 'inhibitor' | 'initiator'
  | 'release' | 'pe' | 'filler' | 'thickener' | 'color' | 'glass'

export interface Material {
  id: string
  cat: MatCat
  name: string
  grade: string
  density: number // g/cm3
  price: number // 원/kg
  note?: string
}

export interface Product {
  id: string
  code: string // 라벨 품명 코드 예: SMCSHEETWTR33
  name: string
  arealKgM2: number // 목표 단중
  widthMm: number
  note: string
}

export interface RecipeLine { materialId: string; phr: number }

export type RecipeStatus = 'draft' | 'approved' | 'retired'
export interface Recipe {
  id: string
  productId: string
  family: string // 같은 처방의 버전 묶음 이름
  version: number
  status: RecipeStatus
  reason: string // 변경 사유
  approvedBy?: string
  approvedAt?: string
  createdAt: string
  lines: RecipeLine[]
}

export interface CutterCfg { on: boolean; rovings: number; blades: number }
export interface MachineProfile {
  bladeMm: number
  viscosityCps: number
  pasteHeightMm: number
  tex: number
  cutInch: number
  cutters: [CutterCfg, CutterCfg]
}

export interface SettingInput {
  speed: number // m/min
  widthMm: number
  arealKgM2: number
  gf: number // 0~1
  bladeMm: number
  viscosityCps: number
  pasteHeightMm: number
  pasteSG: number // g/cm3
  tex: number
  cutInch: number
  cutters: CutterCfg[]
  mgoShare: number // MgO / 유리 제외 합계
  colorShare: number
}

export interface SettingOutput {
  mSheet: number; mPaste: number; mGlass: number
  Qm: number // kg/min
  QLmin: number
  q: number
  A: number; B: number
  gapMm: number
  boxGapMm: number
  backCalcKgM2: number
  dragShare: number
  cutterRpm: (number | null)[]
  glassPerCutter: number
  gCut: number
  pumpA: number // kg/min
  pumpMgO: number // g/min
  pumpColor: number // g/min
}

export interface SettingRun {
  id: string
  at: string
  by: string
  recipeId: string
  input: SettingInput
  output: SettingOutput
  engine: string
}

export interface MixLine {
  materialId: string
  planKg: number
  actualKg?: number
  signedBy?: string
  signedAt?: string
}
export interface MixOrder {
  id: string
  no: string
  date: string
  recipeId: string
  resinKg: number
  batches: number
  lines: MixLine[]
  tempC: number[] // 단계별 기록은 간단히 최고 온도만
  maxTempC?: number
  maxRpm?: number
  initViscPs?: number
  initViscTempC?: number
  worker: string
  status: 'issued' | 'mixing' | 'done'
  note: string
}

export interface Roll {
  widthMm: number; speed: number; db1: number; db2: number
  cut1: number; cut2: number; arealKgM2: number; thicknessMm: number
  impregPct: number; grossKg: number; netKg: number; finalVisc: number; note: string
}

export interface ProductionRun {
  id: string
  date: string
  productCode: string
  lotNo: string
  mixOrderId: string
  settingRunId: string
  tempC: number
  humidity: number
  weather: string
  workers: number
  downtime: string
  rolls: Roll[]
  matLots: Record<string, string> // materialId -> lot
  actualUse: Record<string, number> // materialId -> 실사용량
  viscosity: { label: string; ps: number; tempC: number }[]
  dischargeMeasured: { compound: number; mgo: number; color: number }
  glassLots: string
  glassRollKg: number
  preShip: Record<string, 'ok' | 'ng' | ''>
  sampleGfPct?: number
  targetArealKgM2: number
  targetWidthMm: number
  targetThicknessMm: number
  notes: string
  status: 'open' | 'closed'
}

export interface SheetLot {
  id: string
  lotNo: string
  runId: string
  productCode: string
  producedAt: string // ISO
  gfPct: number
  grossKg: number
  netKg: number
  released: boolean
  note: string
}

export interface Settings {
  companyName: string
  companyLogo: string // Data URL (base64/svg) for offline & single-file compatibility
  ocrProvider: 'gemini' | 'openai'
  ocrApiKey: string // Vision API key for scanning handwritten production logs
  siteCode: string
  storageTempMaxC: number
  fillerTempMaxC: number
  mixRpmMax: number
  arealTolKg: number
  widthTolMm: number
  thicknessTolMm: number
  matureMinH: number
  matureMaxH: number
  shelfMonths: number
  cutterBladeChangeTon: number
  initViscMaxPs: number
  bladeBaseKg: number // 마지막 커터 날 교체 시점의 누적 생산량(kg)
}

export interface AuditEntry { at: string; user: string; action: string; detail: string }

export interface DB {
  user: string
  materials: Material[]
  products: Product[]
  recipes: Recipe[]
  machine: MachineProfile
  settingRuns: SettingRun[]
  mixOrders: MixOrder[]
  runs: ProductionRun[]
  lots: SheetLot[]
  settings: Settings
  audit: AuditEntry[]
}
