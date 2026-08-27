import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { getMonthlyReport } from "../../services/reportService";

const formatCurrency = (amount) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount || 0);

/**
 * Dashboard preview — top expense categories this month with a link to the
 * full monthly report page. Pure additive; safe if the report endpoint fails.
 */
function TopCategoriesPreview() {
  const [report, setReport] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const now = new Date();
    getMonthlyReport(now.getFullYear(), now.getMonth() + 1)
      .then(setReport)
      .catch(() => setError("Gagal memuat laporan."));
  }, []);

  if (error) return null;
  if (!report) return null;

  const top = report.pengeluaran_per_kategori.slice(0, 3);

  return (
    <section className="dashboard-section">
      <div className="dashboard-section__header">
        <h3>Pengeluaran Teratas Bulan Ini</h3>
        <Link to="/report" className="btn btn-secondary btn-sm">
          Lihat Laporan
        </Link>
      </div>
      {top.length === 0 ? (
        <p className="dashboard-empty__sub">Belum ada pengeluaran bulan ini.</p>
      ) : (
        <div className="dashboard-tops">
          {report.per_hari &&
            top.map((row) => (
              <div key={row.kategori} className="dashboard-tops__row">
                <div className="dashboard-tops__head">
                  <span className="dashboard-tops__name">{row.kategori}</span>
                  <span className="dashboard-tops__value">
                    {formatCurrency(row.jumlah)} ({row.persentase}%)
                  </span>
                </div>
                <div className="dashboard-tops__bar">
                  <div
                    className="dashboard-tops__fill"
                    style={{ width: `${row.persentase}%` }}
                  />
                </div>
              </div>
            ))}
        </div>
      )}
    </section>
  );
}

export default TopCategoriesPreview;
