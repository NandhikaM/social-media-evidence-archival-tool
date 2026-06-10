import { IconBell } from '@tabler/icons-react'

export default function Header({ title }) {
  return (
    <header className="h-16 bg-white border-b flex items-center justify-between px-8 shrink-0">
      <h2 className="text-xl font-semibold text-slate-800">{title}</h2>
      <div className="flex items-center gap-4">
        <span className="flex items-center gap-2 text-xs font-medium text-green-600 bg-green-50 px-3 py-1 rounded-full border border-green-100">
          <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
          Active Session
        </span>
        <IconBell className="text-xl text-slate-400 cursor-pointer" size={22} />
      </div>
    </header>
  )
}
