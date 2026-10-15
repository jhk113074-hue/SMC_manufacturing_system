import { useEffect, useState } from 'react'
import { update, useDB } from './store'
import Dashboard from './pages/Dashboard'
import Materials from './pages/Materials'
import Recipes from './pages/Recipes'
import Setting from './pages/Setting'
import Mixing from './pages/Mixing'
import Production from './pages/Production'
import Lots from './pages/Lots'
import Rules from './pages/Rules'

const PAGES = [
  { id: 'dash', name: '대시보드', C: Dashboard },
  { id: 'recipe', name: '제품·처방', C: Recipes },
  { id: 'setting', name: '설정값 계산', C: Setting },
  { id: 'mix', name: '배합지시서', C: Mixing },
  { id: 'prod', name: '생산일지', C: Production },
  { id: 'lot', name: '로트·재고·라벨', C: Lots },
  { id: 'mat', name: '원재료 마스터', C: Materials },
  { id: 'rule', name: '기준값·이력', C: Rules },
] as const

export default function App() {
  const db = useDB()
  const [page, setPage] = useState<string>(() => location.hash.slice(1) || 'dash')
  useEffect(() => { location.hash = page }, [page])
  const cur = PAGES.find((p) => p.id === page) ?? PAGES[0]
  const C = cur.C
  return (
    <div className="app">
      <nav className="side">
        <h1>SMC 기술·생산관리 시스템</h1>
        {PAGES.map((p, i) => (
          <div key={p.id}>
            {(i === 1 || i === 6) && <div className="sep" />}
            <button className={p.id === cur.id ? 'on' : ''} onClick={() => setPage(p.id)}>{p.name}</button>
          </div>
        ))}
      </nav>
      <main>
        <div className="top">
          <h2>{cur.name}</h2>
          <div className="user">
            작업자
            <input style={{ width: 120 }} placeholder="이름 입력" value={db.user} onChange={(e) => update((d) => ({ ...d, user: e.target.value }))} />
          </div>
        </div>
        <C />
      </main>
    </div>
  )
}
