export default function Settings() {
  return (
    <section className="max-w-2xl bg-white rounded-lg border shadow-sm p-8 space-y-8">
      <div>
        <h4 className="font-bold border-b pb-2 mb-4">Organizational Settings</h4>
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm font-bold">State HQ Reporting</p>
              <p className="text-xs text-slate-500">Automatically sync case hashes to state repository.</p>
            </div>
            <div className="w-12 h-6 bg-accent-blue rounded-full relative">
              <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full" />
            </div>
          </div>
        </div>
      </div>

      <div>
        <h4 className="font-bold border-b pb-2 mb-4">Security &amp; Audit</h4>
        <div className="space-y-4">
          <div className="space-y-2">
            <p className="text-sm font-bold">Session Timeout</p>
            <select className="w-full text-sm">
              <option>30 Minutes</option>
              <option>1 Hour</option>
              <option>4 Hours</option>
            </select>
          </div>
          <button type="button" className="w-full py-2 bg-slate-800 text-white rounded-md font-bold text-sm">
            Download Master Audit Log
          </button>
        </div>
      </div>
    </section>
  )
}
