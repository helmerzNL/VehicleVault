import React from 'react';
import { Table, Download } from 'lucide-react';
import { TcoSummary } from '../../types/index.js';
import { useLanguage } from '../../context/LanguageContext.js';

interface VehicleMonthlyTableProps {
  tco: TcoSummary | null;
  exportCsv: () => void;
}

export const VehicleMonthlyTable: React.FC<VehicleMonthlyTableProps> = ({
  tco,
  exportCsv,
}) => {
  const { lang } = useLanguage();

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-3 transition-colors">
      <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center space-x-2">
          <Table className="w-4 h-4 text-sky-500" />
          <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
            {lang === 'nl' ? 'Maandelijkse Kostenspecificatie Matrix' : 'Monthly Cost Specification Matrix'}
          </h3>
        </div>
        <button
          type="button"
          onClick={exportCsv}
          className="text-xs font-bold text-sky-600 dark:text-sky-400 hover:underline flex items-center space-x-1"
        >
          <Download className="w-3.5 h-3.5" />
          <span>{lang === 'nl' ? 'Exporteer Tabel (CSV)' : 'Export Table (CSV)'}</span>
        </button>
      </div>

      <div className="overflow-x-auto rounded-xl border border-slate-200/80 dark:border-slate-800">
        <table className="w-full text-xs text-left">
          <thead className="bg-slate-50 dark:bg-slate-950 text-slate-500 font-semibold border-b border-slate-200 dark:border-slate-800">
            <tr>
              <th className="py-2.5 px-3">{lang === 'nl' ? 'Maand' : 'Month'}</th>
              <th className="py-2.5 px-3 text-right">{lang === 'nl' ? 'Brandstof' : 'Fuel'}</th>
              <th className="py-2.5 px-3 text-right">{lang === 'nl' ? 'Regulier Onderhoud' : 'Maintenance'}</th>
              <th className="py-2.5 px-3 text-right">{lang === 'nl' ? 'Reparaties' : 'Repairs'}</th>
              <th className="py-2.5 px-3 text-right">{lang === 'nl' ? 'Vaste Lasten' : 'Fixed'}</th>
              <th className="py-2.5 px-3 text-right font-bold">{lang === 'nl' ? 'Maandtotaal' : 'Total'}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {tco && tco.monthlyBreakdown.length > 0 ? (
              tco.monthlyBreakdown.map((row) => (
                <tr key={row.month} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                  <td className="py-2.5 px-3 font-semibold text-slate-800 dark:text-slate-200 font-mono">
                    {row.month}
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono text-slate-600 dark:text-slate-400">
                    € {row.fuel.toFixed(2)}
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono text-slate-600 dark:text-slate-400">
                    € {row.regularMaintenance.toFixed(2)}
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono text-slate-600 dark:text-slate-400">
                    € {row.unscheduledRepairs.toFixed(2)}
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono text-slate-600 dark:text-slate-400">
                    € {(row.fixedExpenses || 0).toFixed(2)}
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900 dark:text-white">
                    € {row.total.toFixed(2)}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={6} className="py-4 text-center text-slate-400">
                  {lang === 'nl' ? 'Geen maandelijkse gegevens beschikbaar' : 'No monthly data'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

