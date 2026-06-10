import { IconCertificate, IconChartDonut, IconFileText } from '@tabler/icons-react'

const REPORT_TYPES = [
  {
    icon: IconFileText,
    title: 'Case Summary Report',
    description: 'Comprehensive data for a single case ID including all URLs and hashes.',
  },
  {
    icon: IconChartDonut,
    title: 'Platform Distribution',
    description: 'Analytics on crime trends across various social media platforms.',
  },
  {
    icon: IconCertificate,
    title: 'Data Integrity Audit',
    description: 'Logs of all hash verifications and chain-of-custody tracking.',
  },
]

export default function Reports() {
  return (
    <section>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {REPORT_TYPES.map(({ icon: Icon, title, description }) => (
          <div
            key={title}
            className="bg-white p-6 rounded-lg border shadow-sm hover:border-accent-blue cursor-pointer transition-colors group"
          >
            <Icon className="text-slate-300 group-hover:text-accent-blue transition-colors" size={32} />
            <h5 className="font-bold mt-4">{title}</h5>
            <p className="text-xs text-slate-500 mt-2">{description}</p>
          </div>
        ))}
      </div>

      <div className="bg-white p-6 rounded-lg border shadow-sm">
        <h4 className="font-bold mb-6">Generate Custom Report</h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <select className="text-sm">
            <option>Report Type</option>
          </select>
          <select className="text-sm">
            <option>All Districts</option>
          </select>
          <input type="date" className="text-sm" />
          <button type="button" className="bg-accent-blue text-white rounded-md font-bold text-sm py-2">
            Generate &amp; Download
          </button>
        </div>
      </div>
    </section>
  )
}
