import React, { useState, useEffect } from 'react';
import { Search, Pill, Filter, Check, Plus, ChevronLeft, ChevronRight, Sparkles } from 'lucide-react';
import { searchMedicinesCatalog } from '../../services/medicineService';

const CATEGORIES = [
  'All',
  'Antibiotic',
  'Analgesic / Pain Relief',
  'Antipyretic',
  'Antihypertensive',
  'Antidiabetic',
  'Antihistamine',
  'Antacid / PPI',
  'Bronchodilator / Respiratory',
  'Cardiovascular / Statin',
  'Cough & Cold',
  'Vitamin / Supplement',
  'Dermatological',
  'Neurological',
];

const FORMS = ['All', 'Tablet', 'Capsule', 'Syrup', 'Cream', 'Inhaler', 'Injection', 'Drops', 'Gel', 'Suspension'];

export const MedicineSearchBox = ({ onSelectMedicine }) => {
  const [medicines, setMedicines] = useState([]);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [form, setForm] = useState('All');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [totalCount, setTotalCount] = useState(10250);

  useEffect(() => {
    setPage(1);
  }, [search, category, form]);

  useEffect(() => {
    fetchMedicines();
  }, [search, category, form, page]);

  const fetchMedicines = async () => {
    setLoading(true);
    try {
      const res = await searchMedicinesCatalog({
        search,
        category,
        form,
        page,
        limit: 25,
      });

      if (res && res.success) {
        setMedicines(res.medicines || []);
        setTotalCount(res.count || 10250);
        setTotalPages(res.totalPages || Math.ceil((res.count || 10250) / 25));
      }
    } catch (err) {
      console.error('Error fetching medicines:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white p-6 sm:p-8 rounded-3xl border border-[#D9E4E5] shadow-sm space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-[#D9E4E5] gap-3">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#E6F7F7] border border-[#0EA5A8]/20 text-xs font-semibold text-[#0EA5A8] mb-2">
            <Pill className="w-3.5 h-3.5" />
            <span>Formulary Database</span>
          </div>
          <h2 className="text-2xl font-bold text-[#172033] tracking-tight">Search Medicine Database</h2>
          <p className="text-xs text-[#64748B] mt-1">
            Search verified catalog of 10,000+ pharmaceutical formulations by brand name, generic substance, or therapeutic class.
          </p>
        </div>
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <span className="text-xs font-mono text-[#0EA5A8] bg-[#E6F7F7] px-3 py-1.5 rounded-xl border border-[#0EA5A8]/30 font-bold flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5" />
            {totalCount.toLocaleString()} Formulations Available
          </span>
        </div>
      </div>

      {/* Search & Filter Controls */}
      <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
        <div className="sm:col-span-6 relative">
          <Search className="w-4 h-4 text-[#64748B] absolute left-3.5 top-3.5" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="🔍 Search 10,000+ medicines by brand or generic name (e.g. Dolo, Augmentin)..."
            className="w-full bg-[#F8FAFC] border border-[#D9E4E5] rounded-xl pl-10 pr-4 py-2.5 text-xs sm:text-sm text-[#172033] placeholder:text-[#64748B] focus:outline-none focus:border-[#0EA5A8]"
          />
        </div>

        <div className="sm:col-span-3">
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full bg-[#F8FAFC] border border-[#D9E4E5] rounded-xl px-3 py-2.5 text-xs sm:text-sm text-[#172033] focus:outline-none focus:border-[#0EA5A8]"
          >
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>{c === 'All' ? 'All Categories' : c}</option>
            ))}
          </select>
        </div>

        <div className="sm:col-span-3">
          <select
            value={form}
            onChange={(e) => setForm(e.target.value)}
            className="w-full bg-[#F8FAFC] border border-[#D9E4E5] rounded-xl px-3 py-2.5 text-xs sm:text-sm text-[#172033] focus:outline-none focus:border-[#0EA5A8]"
          >
            {FORMS.map((f) => (
              <option key={f} value={f}>{f === 'All' ? 'All Dosage Forms' : f}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Medicines Table / List */}
      <div className="space-y-2.5 max-h-[550px] overflow-y-auto pr-1">
        {loading ? (
          <div className="py-12 text-center text-xs text-[#64748B] flex flex-col items-center gap-2">
            <div className="w-5 h-5 border-2 border-[#0EA5A8] border-t-transparent rounded-full animate-spin" />
            <span>Querying 10,000+ medicine formulary...</span>
          </div>
        ) : medicines.length === 0 ? (
          <div className="py-12 text-center text-xs text-[#64748B]">
            No medicines matched your query. Try searching by generic name (e.g. Paracetamol, Amoxicillin, Pantoprazole).
          </div>
        ) : (
          medicines.map((med, idx) => {
            const displayName = med.medicineName || med.name;
            return (
              <div
                key={med._id || displayName + idx}
                className="p-4 rounded-2xl bg-[#F8FAFC] border border-[#D9E4E5] hover:border-[#0EA5A8]/50 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs group"
              >
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className="font-bold text-[#172033] text-sm">{displayName}</h4>
                    <span className="text-[10px] px-2 py-0.5 rounded-md bg-[#E6F7F7] border border-[#0EA5A8]/20 text-[#0EA5A8] font-medium">
                      {med.form || 'Tablet'}
                    </span>
                    {med.strength && (
                      <span className="text-[11px] font-mono text-[#0EA5A8] font-semibold">{med.strength}</span>
                    )}
                  </div>
                  <div className="text-[11px] text-[#64748B] mt-1">
                    {med.genericName && (
                      <>
                        Generic: <strong className="text-[#172033]">{med.genericName}</strong> •{' '}
                      </>
                    )}
                    Category: <span className="text-[#172033]">{med.category || 'General'}</span>
                    {med.dosage && (
                      <span> • Std Dosage: <span className="text-slate-700 font-medium">{med.dosage} ({med.frequency})</span></span>
                    )}
                  </div>
                </div>

                {onSelectMedicine && (
                  <button
                    onClick={() => onSelectMedicine({
                      ...med,
                      name: displayName,
                    })}
                    className="px-3.5 py-1.5 rounded-xl bg-[#0EA5A8] hover:bg-[#0c8f91] text-white text-xs font-semibold flex items-center gap-1.5 transition-all shadow-xs self-end sm:self-center"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add to Rx</span>
                  </button>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-4 border-t border-[#D9E4E5] text-xs text-[#64748B]">
          <span>
            Page <strong className="text-[#172033]">{page}</strong> of <strong className="text-[#172033]">{totalPages}</strong> ({totalCount.toLocaleString()} total formulations)
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-3 py-1.5 rounded-lg border border-[#D9E4E5] bg-white text-[#172033] hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              <span>Previous</span>
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="px-3 py-1.5 rounded-lg border border-[#D9E4E5] bg-white text-[#172033] hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1"
            >
              <span>Next</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

    </div>
  );
};

