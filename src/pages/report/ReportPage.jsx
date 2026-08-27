import { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { getMonthlyReport } from "../../services/reportService";

const formatCurrency = (amount) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount || 0);

const MONTHS = [
  "Januari",
  "Februari",
  "Maret",
  "April",
  "Mei",
  "Juni",
  "Juli",
  "Agustus",
  "September",
  "Oktober",
  "November",
  "Desember",
];

function ReportPage() {
  const [searchParams] = useSearchParams();
  const today = new Date();
  const initialYear = Number(searchParams.get("year")) || today.getFullYear();
  const initialMonth = Number(searchParams.get("month")) || today.getMonth() + 1;
  const [year, setYear] = useState(initialYear);
  const [month, setMonth] = useState(initialMonth);
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchReport = useCallback(async (y, m) => {
    setLoading(true);
    setError("");
    try {
      const data = await getMonthlyReport(y, m);
      setReport(data);
    } catch {
      setError("Gagal memuat laporan.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchReport(year, month);
  }, [year, month, fetchReport]);

  const changeMonth = (delta) => {
    const d = new Date(year, month - 1 + delta, 1);
    setYear(d.getFullYear());
    setMonth(d.getMonth() + 1);
  };

  const allDays = report ? new Date(year, month, 0).getDate() : 0;
  const dailyMap = {};
  if (report) {
    for (const row of report.per_hari) dailyMap[row.tanggal] = row;
  }

  const maxDaily = report && report.per_hari.length
    ? Math.max(...report.per_hari.map((r) => Math.max(r.income, r.expense)))
    : 0;

  const ringkasan = [
    { label: "PEMASUKAN", value: report?.total_income ?? 0, cls: "income" },
    { label: "PENGELUARAN", value: report?.total_expense ?? 0, cls: "expense" },
    { label: "SALDO", value: report?.saldo ?? 0, cls: "saldo" },
  ];

  return (
    <div className="page-container">
      <header className="page-header">
        <div>
          <h1 className="page-title">LAPORAN</h1>
          <p className="page-subtitle">Rekap pemasukan dan pengeluaran bulanan</p>
        </div>
        <button className="btn btn-secondary" onClick={() => window.print()}>
          CETAK PDF
        </button>
      </header>

      {/* Periode selector */}
      <div className="report-period">
        <button
          className="category-card__btn category-card__btn--edit"
          onClick={() => changeMonth(-1)}
          title="Bulan sebelumnya"
          aria-label="Bulan sebelumnya"
        >
          ‹
        </button>
        <div className="report-period__select">
          <select value={month} onChange={(e) => setMonth(Number(e.target.value))}>
            {MONTHS.map((name, i) => (
              <option key={name} value={i + 1}>
                {name}
              </option>
            ))}
          </select>
          <select value={year} onChange={(e) => setYear(Number(e.target.value))}>
            {[year, year - 1, year - 2].map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        </div>
        <button
          className="category-card__btn category-card__btn--edit"
          onClick={() => changeMonth(1)}
          title="Bulan berikutnya"
          aria-label="Bulan berikutnya"
        >
          ›
        </button>
      </div>

      {loading && <div className="dashboard-loading"><div className="dashboard-loading__spinner" /></div>}
      {error && <p className="dashboard-error">{error}</p>}

      {!loading && !error && report && (
        <>
          {/* Summary cards */}
          <div className="report-summary">
            {ringkasan.map((item) => (
              <div key={item.label} className="summary-card">
                <span className="summary-card__label">{item.label}</span>
                <span className={`summary-card__value ${item.cls}`}>
                  {formatCurrency(item.value)}
                </span>
              </div>
            ))}
          </div>

          {/* Category breakdown */}
          <div className="report-grid">
            <section className="report-section">
              <h2 className="report-section__title">PENGELUARAN PER KATEGORI</h2>
              {report.pengeluaran_per_kategori.length === 0 ? (
                <p className="report-empty">Tidak ada pengeluaran bulan ini.</p>
              ) : (
                report.pengeluaran_per_kategori.map((row) => (
                  <div key={row.kategori} className="report-bar-row">
                    <div className="report-bar-row__head">
                      <span className="report-bar-row__name">{row.kategori}</span>
                      <span className="report-bar-row__right">
                        {formatCurrency(row.jumlah)}{" "}
                        <span className="report-bar-row__pct">{row.persentase}%</span>
                      </span>
                    </div>
                    <div className="report-bar">
                      <div
                        className="report-bar__fill expense"
                        style={{ width: `${row.persentase}%` }}
                      />
                    </div>
                  </div>
                ))
              )}
            </section>

            <section className="report-section">
              <h2 className="report-section__title">PEMASUKAN PER KATEGORI</h2>
              {report.pemasukan_per_kategori.length === 0 ? (
                <p className="report-empty">Tidak ada pemasukan bulan ini.</p>
              ) : (
                report.pemasukan_per_kategori.map((row) => (
                  <div key={row.kategori} className="report-bar-row">
                    <div className="report-bar-row__head">
                      <span className="report-bar-row__name">{row.kategori}</span>
                      <span className="report-bar-row__right">
                        {formatCurrency(row.jumlah)}{" "}
                        <span className="report-bar-row__pct">{row.persentase}%</span>
                      </span>
                    </div>
                    <div className="report-bar">
                      <div
                        className="report-bar__fill income"
                        style={{ width: `${row.persentase}%` }}
                      />
                    </div>
                  </div>
                ))
              )}
            </section>
          </div>

          {/* Daily trend */}
          <section className="report-section">
            <h2 className="report-section__title">TREN HARIAN</h2>
            <div className="report-trend">
              {Array.from({ length: allDays }, (_, i) => {
                const day = String(i + 1).padStart(2, "0");
                const key = `${year}-${String(month).padStart(2, "0")}-${day}`;
                const d = dailyMap[key] || { income: 0, expense: 0 };
                return (
                  <div key={key} className="report-trend__col" title={`${day} ${MONTHS[month - 1]}`}>
                    <div className="report-trend__bars">
                      <div className="report-trend__bar income" style={{ height: d.income > 0 ? `${(d.income / (maxDaily || 1)) * 100}%` : "0%" }} />
                      <div className="report-trend__bar expense" style={{ height: d.expense > 0 ? `${(d.expense / (maxDaily || 1)) * 100}%` : "0%" }} />
                    </div>
                    <span className="report-trend__day">{day}</span>
                  </div>
                );
              })}
            </div>
          </section>
        </>
      )}
    </div>
  );
}

export default ReportPage;
