import { NavLink } from 'react-router-dom';
import { parentMenuItems } from './parentMenu';

export default function ParentSidebar() {
  return (
    <aside className="hidden xl:flex xl:w-72 xl:flex-col xl:overflow-hidden xl:rounded-3xl xl:border xl:border-slate-800 xl:bg-slate-950 xl:p-6 xl:shadow-xl xl:shadow-slate-950/20">
      <div className="mb-8">
        <p className="text-sm uppercase tracking-[0.25em] text-slate-500">Parent Portal</p>
        <h2 className="mt-4 text-2xl font-semibold text-white">Family Safety</h2>
        <p className="mt-2 text-sm leading-6 text-slate-400">Quickly switch between your children, analytics, and secure settings.</p>
      </div>

      <nav className="flex-1 space-y-2">
        {parentMenuItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `flex items-start gap-3 rounded-3xl px-4 py-4 transition-all duration-200 ${
                isActive ? 'bg-slate-900 text-white shadow-lg shadow-slate-900/30 border border-slate-800' : 'text-slate-300 hover:bg-slate-900/70 hover:text-white'
              }`
            }
          >
            <item.icon className="h-5 w-5 text-slate-400" />
            <div>
              <p className="text-sm font-semibold">{item.label}</p>
              <p className="mt-1 text-xs text-slate-500">{item.description}</p>
            </div>
          </NavLink>
        ))}
      </nav>

      <div className="mt-8 rounded-3xl border border-slate-800 bg-slate-900/80 p-5">
        <p className="text-sm text-slate-400">Need to update contact settings or alerts?</p>
        <p className="mt-4 text-sm font-semibold text-white">Head over to Settings for safety preferences.</p>
      </div>
    </aside>
  );
}
