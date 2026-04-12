import { useState, useEffect, useCallback } from "react";
import { useNavigate, Link, useSearchParams } from "react-router-dom";
import useAuthStore from "../../store/authStore";
import { logoutUser } from "../../services/authService";
import {
  getTransactions,
  deleteTransaction,
  createTransaction,
  scanReceipt,
} from "../../services/transactionService";
import { getCategories } from "../../services/categoryService";
import CategoryBadge from "../../components/CategoryBadge";
import ConfirmModal from "../../components/ConfirmModal";
import DateRangePicker from "../../components/ui/DateRangePicker";
import { getLocationName } from "../../utils/locationLookup";


const PlusIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="5" x2="12" y2="19" />
    <line x1="5" y1="12" x2="19" y2="12" />
  </svg>
);
const EditIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
  </svg>
);
const TrashIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6" />
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    <line x1="10" y1="11" x2="10" y2="17" />
    <line x1="14" y1="11" x2="14" y2="17" />
  </svg>
);
const EyeIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);
const BackIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="19" y1="12" x2="5" y2="12" />
    <polyline points="12 19 5 12 12 5" />
  </svg>
);
const SearchIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8" />
    <line x1="21" y1="21" x2="16.65" y2="16.65" />
  </svg>
);
const MapPinIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="14" height="14">
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
    <circle cx="12" cy="10" r="3" />
  </svg>
);
const FilterIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
  </svg>
);
const ChevronDownIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="6 9 12 15 18 9" />
  </svg>
);
const CloseIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);
const ReceiptScanIcon = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M6 3h12a1 1 0 0 1 1 1v16l-2-1.2L15 20l-3-1.2L9 20l-2-1.2L5 20V4a1 1 0 0 1 1-1z" />
    <line x1="8" y1="8" x2="16" y2="8" />
    <line x1="8" y1="12" x2="16" y2="12" />
    <line x1="8" y1="16" x2="12" y2="16" />
  </svg>
);
const UploadCloudIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 17.5A4.5 4.5 0 0 0 18 9h-1.2A6 6 0 0 0 5.2 10.1 4 4 0 0 0 6 18h14" />
    <polyline points="12 11 12 21" />
    <polyline points="8.5 14.5 12 11 15.5 14.5" />
  </svg>
);
const FileAttachmentIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H7a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7z" />
    <polyline points="14 2 14 8 20 8" />
  </svg>
);

/* ── Helpers ────────────────────────────────────────────── */
const formatCurrency = (amount) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);

const formatDate = (dateStr) =>
  new Date(dateStr).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

const getTodayDate = () => new Date().toISOString().slice(0, 10);
const MAX_RECEIPT_FILE_SIZE_BYTES = 10 * 1024 * 1024;

function loadImageFromFile(file) {
  return new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file);
    const image = new Image();

    image.onload = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(image);
    };

    image.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("Unable to load image"));
    };

    image.src = objectUrl;
  });
}

function canvasToBlob(canvas, quality) {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error("Canvas export failed"));
          return;
        }
        resolve(blob);
      },
      "image/jpeg",
      quality,
    );
  });
}

async function compressReceiptImageFile(file) {
  if (!file?.type?.startsWith("image/")) {
    return file;
  }

  // Keep small images untouched.
  if (file.size <= 900 * 1024) {
    return file;
  }

  const image = await loadImageFromFile(file);
  const maxDimension = 1920;
  const scale = Math.min(1, maxDimension / Math.max(image.width, image.height));
  const targetWidth = Math.max(1, Math.round(image.width * scale));
  const targetHeight = Math.max(1, Math.round(image.height * scale));

  const canvas = document.createElement("canvas");
  canvas.width = targetWidth;
  canvas.height = targetHeight;
  const context = canvas.getContext("2d", { alpha: false });

  if (!context) {
    return file;
  }

  context.drawImage(image, 0, 0, targetWidth, targetHeight);

  const qualitySteps = [0.86, 0.78, 0.7, 0.62, 0.55, 0.48];
  let bestBlob = null;

  for (const quality of qualitySteps) {
    const blob = await canvasToBlob(canvas, quality);

    if (!bestBlob || blob.size < bestBlob.size) {
      bestBlob = blob;
    }

    if (blob.size <= 900 * 1024) {
      bestBlob = blob;
      break;
    }
  }

  if (!bestBlob) {
    return file;
  }

  const normalizedName = (file.name || "receipt")
    .replace(/\.[a-z0-9]+$/i, "")
    .concat(".jpg");

  return new File([bestBlob], normalizedName, {
    type: "image/jpeg",
    lastModified: Date.now(),
  });
}

const formatFileSize = (bytes = 0) => {
  if (!bytes || bytes <= 0) return "0 B";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
};

const getFileTypeLabel = (mimeType = "") => {
  if (mimeType === "application/pdf") return "PDF";
  if (mimeType.startsWith("image/")) return "GAMBAR";
  return "FILE";
};

const normalizeKeyword = (value) =>
  String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

function findSuggestedCategoryId({
  suggestedCategory,
  note,
  merchantName,
  type,
  categories,
}) {
  const normalizedHint = normalizeKeyword(
    `${suggestedCategory || ""} ${note || ""} ${merchantName || ""}`,
  );

  const scopedCategories = categories.filter(
    (category) => category.type === type || category.type === "both",
  );

  if (!normalizedHint || scopedCategories.length === 0) {
    return "";
  }

  const exactMatch = scopedCategories.find(
    (category) => normalizeKeyword(category.name) === normalizedHint,
  );

  if (exactMatch) {
    return String(exactMatch.id);
  }

  const partialMatch = scopedCategories.find((category) => {
    const normalizedName = normalizeKeyword(category.name);
    return (
      normalizedHint.includes(normalizedName) ||
      normalizedName.includes(normalizedHint)
    );
  });

  return partialMatch ? String(partialMatch.id) : "";
}

/* ══════════════════════════════════════════════════════════
   TRANSACTION LIST PAGE
   ══════════════════════════════════════════════════════════ */
function TransactionList() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const user = useAuthStore((s) => s.user);

  const [transactions, setTransactions] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [toast, setToast] = useState(null);

  // Delete modal
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deletingTx, setDeletingTx] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Applied filters (active on the list)
  const [filterType, setFilterType] = useState("all");
  const [filterCategory, setFilterCategory] = useState("all");
  const [filterDateFrom, setFilterDateFrom] = useState("");
  const [filterDateTo, setFilterDateTo] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [locationNames, setLocationNames] = useState({});

  // Temp filters inside modal (staged, not yet applied)
  const [tempType, setTempType] = useState("all");
  const [tempCategory, setTempCategory] = useState("all");
  const [tempDateFrom, setTempDateFrom] = useState("");
  const [tempDateTo, setTempDateTo] = useState("");

  // Filter modal
  const [filterModalOpen, setFilterModalOpen] = useState(false);

  // Receipt scan modals
  const [scanUploadOpen, setScanUploadOpen] = useState(false);
  const [scanReviewOpen, setScanReviewOpen] = useState(false);
  const [scanFile, setScanFile] = useState(null);
  const [scanError, setScanError] = useState("");
  const [scanLoading, setScanLoading] = useState(false);
  const [scanSaving, setScanSaving] = useState(false);
  const [scanPreview, setScanPreview] = useState(null);
  const [scanForm, setScanForm] = useState({
    type: "expense",
    amount: "",
    date: getTodayDate(),
    note: "",
    category_id: "",
  });

  // Accordion open states
  const [accordionDate, setAccordionDate] = useState(true);
  const [accordionType, setAccordionType] = useState(true);
  const [accordionCategory, setAccordionCategory] = useState(true);

  // Lazy Load / Load More
  const [visibleCount, setVisibleCount] = useState(20);
  const itemsPerPage = 20;

  const showToast = useCallback((message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  }, []);

  // Fetch
  const fetchData = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [txRes, catRes] = await Promise.all([
        getTransactions(),
        getCategories(user?.id),
      ]);
      const sorted = (txRes.data || []).sort(
        (a, b) => new Date(b.date) - new Date(a.date),
      );
      setTransactions(sorted);
      setCategories(catRes.data || []);
    } catch {
      setError("Gagal memuat data transaksi.");
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Delete
  const handleDelete = async () => {
    if (!deletingTx) return;
    setSubmitting(true);
    try {
      await deleteTransaction(deletingTx.id);
      showToast("Transaksi berhasil dihapus! 🗑️");
      setDeleteOpen(false);
      setDeletingTx(null);
      await fetchData();
    } catch (err) {
      const msg = err.response?.data?.message || "Gagal menghapus transaksi.";
      showToast(msg, "error");
    } finally {
      setSubmitting(false);
    }
  };

  // Receipt scan flow
  const openScanUploadModal = () => {
    setScanError("");
    setScanFile(null);
    setScanUploadOpen(true);
  };

  useEffect(() => {
    if (searchParams.get("openScan") !== "1") {
      return;
    }

    setScanError("");
    setScanFile(null);
    setScanUploadOpen(true);
    const nextParams = new URLSearchParams(searchParams);
    nextParams.delete("openScan");
    setSearchParams(nextParams, { replace: true });
  }, [searchParams, setSearchParams]);

  const closeScanUploadModal = () => {
    if (scanLoading) return;
    setScanUploadOpen(false);
    setScanError("");
    setScanFile(null);
  };

  const closeScanReviewModal = (force = false) => {
    if (scanSaving && !force) return;
    setScanReviewOpen(false);
    setScanPreview(null);
    setScanError("");
    setScanForm({
      type: "expense",
      amount: "",
      date: getTodayDate(),
      note: "",
      category_id: "",
    });
  };

  const handleScanFileChange = (event) => {
    const file = event.target.files?.[0] || null;

    if (file && file.size > MAX_RECEIPT_FILE_SIZE_BYTES) {
      setScanFile(null);
      setScanError("Ukuran file terlalu besar. Maksimum 10MB.");
      return;
    }

    setScanFile(file);
    setScanError("");
  };

  const handleRemoveScanFile = () => {
    setScanFile(null);
    setScanError("");
  };

  const handleSubmitReceiptScan = async () => {
    if (!scanFile) {
      setScanError("Pilih file struk terlebih dahulu.");
      return;
    }

    setScanLoading(true);
    setScanError("");

    try {
      const uploadFile = await compressReceiptImageFile(scanFile);
      const response = await scanReceipt(uploadFile);
      const draft = response?.data || {};
      const resolvedType = draft.type === "income" ? "income" : "expense";

      const resolvedCategoryId = findSuggestedCategoryId({
        suggestedCategory: draft.suggested_category,
        note: draft.note,
        merchantName: draft.merchant_name,
        type: resolvedType,
        categories,
      });

      setScanPreview(draft);
      setScanForm({
        type: resolvedType,
        amount: draft.amount ? String(Math.round(Number(draft.amount))) : "",
        date: draft.date || getTodayDate(),
        note: draft.note || draft.merchant_name || "",
        category_id: resolvedCategoryId,
      });

      setScanUploadOpen(false);
      setScanReviewOpen(true);
    } catch (err) {
      const statusCode = err?.response?.status;
      const message =
        statusCode === 413
          ? "Ukuran file masih melebihi batas server. Coba foto dengan resolusi lebih kecil atau crop area struk."
          : err.response?.data?.message ||
            "Gagal mendeteksi struk. Coba file lain yang lebih jelas.";
      setScanError(message);
    } finally {
      setScanLoading(false);
    }
  };

  const handleScanFormField = (field, value) => {
    setScanForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSaveScannedTransaction = async () => {
    if (!scanForm.category_id) {
      setScanError("Pilih kategori sebelum menyimpan transaksi.");
      return;
    }

    const parsedAmount = Number(scanForm.amount);
    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      setScanError("Jumlah transaksi harus lebih dari 0.");
      return;
    }

    if (!scanForm.date) {
      setScanError("Tanggal transaksi wajib diisi.");
      return;
    }

    setScanSaving(true);
    setScanError("");

    try {
      await createTransaction({
        type: scanForm.type,
        amount: parsedAmount,
        category_id: Number(scanForm.category_id),
        date: scanForm.date,
        note: scanForm.note ? scanForm.note.trim() : null,
      });

      showToast("Transaksi dari struk berhasil ditambahkan! 🎉");
      closeScanReviewModal(true);
      await fetchData();
    } catch (err) {
      const message =
        err.response?.data?.message || "Gagal menyimpan transaksi hasil scan.";
      setScanError(message);
    } finally {
      setScanSaving(false);
    }
  };

  // Filter Modal handlers
  const openFilterModal = () => {
    // Sync temp values with current applied filters
    setTempType(filterType);
    setTempCategory(filterCategory);
    setTempDateFrom(filterDateFrom);
    setTempDateTo(filterDateTo);
    setFilterModalOpen(true);
  };

  const applyFilters = () => {
    setFilterType(tempType);
    setFilterCategory(tempCategory);
    setFilterDateFrom(tempDateFrom);
    setFilterDateTo(tempDateTo);
    setFilterModalOpen(false);
  };

  const resetFilters = () => {
    setTempType("all");
    setTempCategory("all");
    setTempDateFrom("");
    setTempDateTo("");
  };

  // Filtering
  const filtered = transactions.filter((tx) => {
    if (filterType !== "all" && tx.type !== filterType) return false;
    if (filterCategory !== "all" && String(tx.category_id) !== filterCategory)
      return false;
    if (filterDateFrom && new Date(tx.date) < new Date(filterDateFrom))
      return false;
    if (
      filterDateTo &&
      new Date(tx.date) > new Date(filterDateTo + "T23:59:59")
    )
      return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchNote = (tx.note || "").toLowerCase().includes(q);
      const matchCat = (tx.category_name || "").toLowerCase().includes(q);
      if (!matchNote && !matchCat) return false;
    }
    return true;
  });

  // Pagination
  const paginated = filtered.slice(0, visibleCount);

  useEffect(() => {
    let active = true;

    const targets = paginated.filter(
      (tx) => tx.latitude && tx.longitude && !locationNames[tx.id],
    );

    if (targets.length === 0) return undefined;

    (async () => {
      const updates = {};
      for (const tx of targets) {
        const name = await getLocationName(tx.latitude, tx.longitude);
        if (name) {
          updates[tx.id] = name;
        }
      }

      if (active && Object.keys(updates).length > 0) {
        setLocationNames((prev) => ({ ...prev, ...updates }));
      }
    })();

    return () => {
      active = false;
    };
  }, [paginated, locationNames]);

  useEffect(() => {
    setVisibleCount(itemsPerPage);
  }, [filterType, filterCategory, filterDateFrom, filterDateTo, searchQuery]);

  // Summary
  const totalIncome = filtered
    .filter((t) => t.type === "income")
    .reduce((s, t) => s + Number(t.amount), 0);
  const totalExpense = filtered
    .filter((t) => t.type === "expense")
    .reduce((s, t) => s + Number(t.amount), 0);

  const hasActiveFilters =
    filterType !== "all" ||
    filterCategory !== "all" ||
    filterDateFrom ||
    filterDateTo;
  const activeFilterCount = [
    filterType !== "all",
    filterCategory !== "all",
    filterDateFrom || filterDateTo,
  ].filter(Boolean).length;

  return (
    <div className="page-container">
      {/* ── Toast ──────────────────────────────────────── */}
      {toast && (
        <div className={`toast toast--${toast.type}`} id="toast-notification">
          <span>{toast.message}</span>
        </div>
      )}

      {/* ── Main ───────────────────────────────────────── */}
      <main className="dashboard-main">
        {/* Page Header */}
        <div className="category-page__header">
          <button
            className="category-page__back"
            onClick={() => navigate("/")}
            id="back-to-dashboard"
          >
            <BackIcon />
          </button>
          <div>
            <h1>Transaksi</h1>
            <p>Kelola semua transaksi pemasukan dan pengeluaranmu</p>
          </div>
        </div>

        {loading ? (
          <div className="dashboard-loading">
            <div className="dashboard-loading__spinner" />
            <p>Memuat transaksi...</p>
          </div>
        ) : error ? (
          <div className="dashboard-error">
            <span className="dashboard-error__icon">⚠️</span>
            <p>{error}</p>
            <button
              className="btn btn-primary"
              style={{ width: "auto", marginTop: "12px" }}
              onClick={fetchData}
            >
              Coba lagi
            </button>
          </div>
        ) : (
          <>
            {/* ── Summary ──────────────────────────────── */}
            <div className="tx-mini-summary" id="tx-summary">
              <div className="tx-mini-card">
                <span className="tx-mini-card__label">💰 Pemasukan</span>
                <span className="tx-mini-card__value income">
                  {formatCurrency(totalIncome)}
                </span>
              </div>
              <div className="tx-mini-card">
                <span className="tx-mini-card__label">💸 Pengeluaran</span>
                <span className="tx-mini-card__value expense">
                  {formatCurrency(totalExpense)}
                </span>
              </div>
              <div className="tx-mini-card">
                <span className="tx-mini-card__label">💵 Selisih</span>
                <span
                  className={`tx-mini-card__value ${totalIncome - totalExpense >= 0 ? "income" : "expense"}`}
                >
                  {formatCurrency(totalIncome - totalExpense)}
                </span>
              </div>
            </div>

            {/* ── Toolbar (Search + Filter button + Add) ── */}
            <div className="tx-toolbar" id="tx-toolbar">
              <div className="tx-toolbar__search">
                <SearchIcon />
                <input
                  className="form-input tx-toolbar__input"
                  type="text"
                  placeholder="Cari catatan atau kategori..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  id="search-tx-input"
                />
              </div>
              <button
                className={`btn tx-toolbar__filter ${hasActiveFilters ? "tx-toolbar__filter--active" : ""}`}
                onClick={openFilterModal}
                id="open-filter-modal-btn"
              >
                <FilterIcon />
                <span>Filter</span>
                {activeFilterCount > 0 && (
                  <span className="tx-toolbar__filter-badge">
                    {activeFilterCount}
                  </span>
                )}
              </button>
              <button
                className="btn tx-toolbar__scan"
                onClick={openScanUploadModal}
                id="open-receipt-scan-btn"
              >
                <ReceiptScanIcon />
                <span>Scan Struk</span>
              </button>
              <Link
                to="/transactions/add"
                className="btn btn-primary tx-toolbar__add"
                id="add-tx-btn"
              >
                <PlusIcon />
                <span>Tambah</span>
              </Link>
            </div>

            {/* ── Active filter tags ─────────────────────── */}
            {hasActiveFilters && (
              <div className="tx-active-filters" id="active-filter-tags">
                {filterType !== "all" && (
                  <span className="tx-filter-tag">
                    {filterType === "income" ? "Pemasukan" : "Pengeluaran"}
                    <button
                      onClick={() => setFilterType("all")}
                      className="tx-filter-tag__remove"
                    >
                      ×
                    </button>
                  </span>
                )}
                {filterCategory !== "all" && (
                  <span className="tx-filter-tag">
                    {categories.find((c) => String(c.id) === filterCategory)
                      ?.name || "Kategori"}
                    <button
                      onClick={() => setFilterCategory("all")}
                      className="tx-filter-tag__remove"
                    >
                      ×
                    </button>
                  </span>
                )}
                {(filterDateFrom || filterDateTo) && (
                  <span className="tx-filter-tag">
                    {filterDateFrom || "..."} — {filterDateTo || "..."}
                    <button
                      onClick={() => {
                        setFilterDateFrom("");
                        setFilterDateTo("");
                      }}
                      className="tx-filter-tag__remove"
                    >
                      ×
                    </button>
                  </span>
                )}
                <button
                  className="tx-active-filters__clear"
                  onClick={() => {
                    setFilterType("all");
                    setFilterCategory("all");
                    setFilterDateFrom("");
                    setFilterDateTo("");
                  }}
                  id="clear-all-filters"
                >
                  Hapus Semua
                </button>
              </div>
            )}

            {/* ── Count ────────────────────────────────── */}
            <div className="category-count">
              <span>{filtered.length} transaksi ditemukan</span>
            </div>

            {/* ── List ─────────────────────────────────── */}
            {filtered.length === 0 ? (
              <div className="dashboard-empty">
                <span className="dashboard-empty__icon">📭</span>
                <p>
                  {hasActiveFilters || searchQuery
                    ? "Tidak ada transaksi yang cocok dengan filter."
                    : "Belum ada transaksi."}
                </p>
                <span className="dashboard-empty__sub">
                  {hasActiveFilters || searchQuery
                    ? "Coba ubah filter atau kata kunci pencarian."
                    : "Mulai catat pemasukan dan pengeluaranmu!"}
                </span>
              </div>
            ) : (
              <>
                {/* Desktop Table */}
                <div className="tx-table-wrapper" id="tx-list">
                  <table className="tx-table">
                    <thead>
                      <tr>
                        <th>Tanggal</th>
                        <th>Kategori</th>
                        <th>Catatan</th>
                        <th className="tx-table__right">Jumlah</th>
                        <th className="tx-table__center">Aksi</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginated.map((tx, i) => {
                        const isExp = tx.type === "expense";
                        const hasLoc = tx.latitude && tx.longitude;
                        return (
                          <tr
                            key={tx.id}
                            className="tx-table__row"
                            style={{ animationDelay: `${i * 40}ms` }}
                          >
                            <td className="tx-table__date">
                              {formatDate(tx.date)}
                            </td>
                            <td>
                              <CategoryBadge
                                name={tx.category_name}
                                type={tx.type}
                              />
                            </td>
                            <td className="tx-table__note">
                              <span>{tx.note || "—"}</span>
                              {hasLoc && (
                                <span
                                  className="tx-table__location-dot"
                                  title="Memiliki lokasi"
                                >
                                  <MapPinIcon />
                                </span>
                              )}
                              {hasLoc && locationNames[tx.id] && (
                                <span className="tx-location-preview">
                                  {locationNames[tx.id]}
                                </span>
                              )}
                            </td>
                            <td
                              className={`tx-table__amount ${isExp ? "expense" : "income"}`}
                            >
                              {isExp ? "-" : "+"}
                              {formatCurrency(tx.amount)}
                            </td>
                            <td className="tx-table__actions">
                              <Link
                                to={`/transactions/${tx.id}`}
                                className="category-card__btn category-card__btn--edit"
                                title="Detail"
                                id={`detail-tx-${tx.id}`}
                              >
                                <EyeIcon />
                              </Link>
                              <Link
                                to={`/transactions/${tx.id}/edit`}
                                className="category-card__btn category-card__btn--edit"
                                title="Edit"
                                id={`edit-tx-${tx.id}`}
                              >
                                <EditIcon />
                              </Link>
                              <button
                                className="category-card__btn category-card__btn--delete"
                                onClick={() => {
                                  setDeletingTx(tx);
                                  setDeleteOpen(true);
                                }}
                                title="Hapus"
                                id={`delete-tx-${tx.id}`}
                              >
                                <TrashIcon />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Mobile Cards */}
                <div className="tx-mobile-list" id="tx-mobile-list">
                  {paginated.map((tx, i) => {
                    const isExp = tx.type === "expense";
                    const hasLoc = tx.latitude && tx.longitude;
                    return (
                      <div
                        key={tx.id}
                        className="tx-mobile-card"
                        style={{ animationDelay: `${i * 40}ms` }}
                        onClick={() => navigate(`/transactions/${tx.id}`)}
                      >
                        <div className="tx-mobile-card__top">
                          <CategoryBadge
                            name={tx.category_name}
                            type={tx.type}
                          />
                          <span
                            className={`tx-mobile-card__amount ${isExp ? "expense" : "income"}`}
                          >
                            {isExp ? "-" : "+"}
                            {formatCurrency(tx.amount)}
                          </span>
                        </div>
                        <div className="tx-mobile-card__bottom">
                          <span className="tx-mobile-card__date">
                            {formatDate(tx.date)}
                          </span>
                          <span className="tx-mobile-card__note">
                            {tx.note || "—"}
                            {hasLoc && <MapPinIcon />}
                          </span>
                        </div>
                        {hasLoc && locationNames[tx.id] && (
                          <span className="tx-location-preview tx-location-preview--mobile">
                            {locationNames[tx.id]}
                          </span>
                        )}
                        <div
                          className="tx-mobile-card__actions"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Link
                            to={`/transactions/${tx.id}/edit`}
                            className="category-card__btn category-card__btn--edit"
                            title="Edit"
                          >
                            <EditIcon />
                          </Link>
                          <button
                            className="category-card__btn category-card__btn--delete"
                            onClick={() => {
                              setDeletingTx(tx);
                              setDeleteOpen(true);
                            }}
                            title="Hapus"
                          >
                            <TrashIcon />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Load More */}
                {visibleCount < filtered.length ? (
                  <div className="load-more-container">
                    <button
                      className="btn load-more-btn"
                      onClick={() =>
                        setVisibleCount((prev) => prev + itemsPerPage)
                      }
                    >
                      Tampilkan lebih banyak ({filtered.length - visibleCount}{" "}
                      tersisa)
                    </button>
                  </div>
                ) : filtered.length > itemsPerPage ? (
                  <div className="load-more-end">
                    <span>Semua transaksi ditampilkan</span>
                  </div>
                ) : null}
              </>
            )}
          </>
        )}
      </main>

      {/* ── Filter Modal ──────────────────────────────────── */}
      {filterModalOpen && (
        <div
          className="modal-overlay"
          onClick={() => setFilterModalOpen(false)}
          id="filter-modal-overlay"
        >
          <div
            className="modal-content filter-modal"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="modal-header">
              <h3>🔍 Filter Transaksi</h3>
              <button
                className="modal-close"
                onClick={() => setFilterModalOpen(false)}
                id="close-filter-modal"
              >
                <CloseIcon />
              </button>
            </div>

            {/* Accordion Body */}
            <div className="filter-modal__body">
              {/* ── Date Range Accordion ── */}
              <div
                className={`filter-accordion ${accordionDate ? "filter-accordion--open" : ""}`}
              >
                <button
                  className="filter-accordion__header"
                  onClick={() => setAccordionDate(!accordionDate)}
                  id="accordion-date-toggle"
                >
                  <div className="filter-accordion__header-left">
                    <span className="filter-accordion__icon">📅</span>
                    <span className="filter-accordion__title">
                      Filter Tanggal
                    </span>
                    {(tempDateFrom || tempDateTo) && (
                      <span className="filter-accordion__dot" />
                    )}
                  </div>
                  <span
                    className={`filter-accordion__chevron ${accordionDate ? "filter-accordion__chevron--open" : ""}`}
                  >
                    <ChevronDownIcon />
                  </span>
                </button>
                <div className="filter-accordion__content">
                  <div className="filter-accordion__inner">
                    <DateRangePicker
                      startDate={tempDateFrom}
                      endDate={tempDateTo}
                      onStartChange={setTempDateFrom}
                      onEndChange={setTempDateTo}
                    />
                  </div>
                </div>
              </div>

              {/* ── Type Accordion ── */}
              <div
                className={`filter-accordion ${accordionType ? "filter-accordion--open" : ""}`}
              >
                <button
                  className="filter-accordion__header"
                  onClick={() => setAccordionType(!accordionType)}
                  id="accordion-type-toggle"
                >
                  <div className="filter-accordion__header-left">
                    <span className="filter-accordion__icon">💱</span>
                    <span className="filter-accordion__title">Filter Tipe</span>
                    {tempType !== "all" && (
                      <span className="filter-accordion__dot" />
                    )}
                  </div>
                  <span
                    className={`filter-accordion__chevron ${accordionType ? "filter-accordion__chevron--open" : ""}`}
                  >
                    <ChevronDownIcon />
                  </span>
                </button>
                <div className="filter-accordion__content">
                  <div className="filter-accordion__inner">
                    <div className="filter-modal__chips">
                      {["all", "income", "expense"].map((t) => (
                        <button
                          key={t}
                          className={`filter-modal__chip ${tempType === t ? "filter-modal__chip--active" : ""}`}
                          onClick={() => setTempType(t)}
                          id={`filter-type-${t}`}
                        >
                          <span className="filter-modal__chip-icon">
                            {t === "all" ? "📊" : t === "income" ? "💰" : "💸"}
                          </span>
                          {t === "all"
                            ? "Semua"
                            : t === "income"
                              ? "Pemasukan"
                              : "Pengeluaran"}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* ── Category Accordion ── */}
              <div
                className={`filter-accordion ${accordionCategory ? "filter-accordion--open" : ""}`}
              >
                <button
                  className="filter-accordion__header"
                  onClick={() => setAccordionCategory(!accordionCategory)}
                  id="accordion-category-toggle"
                >
                  <div className="filter-accordion__header-left">
                    <span className="filter-accordion__icon">🏷️</span>
                    <span className="filter-accordion__title">
                      Filter Kategori
                    </span>
                    {tempCategory !== "all" && (
                      <span className="filter-accordion__dot" />
                    )}
                  </div>
                  <span
                    className={`filter-accordion__chevron ${accordionCategory ? "filter-accordion__chevron--open" : ""}`}
                  >
                    <ChevronDownIcon />
                  </span>
                </button>
                <div className="filter-accordion__content">
                  <div className="filter-accordion__inner">
                    <select
                      className="form-input form-select"
                      value={tempCategory}
                      onChange={(e) => setTempCategory(e.target.value)}
                      id="filter-category"
                    >
                      <option value="all">Semua Kategori</option>
                      {categories.map((c) => (
                        <option key={c.id} value={String(c.id)}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="filter-modal__footer">
              <button
                className="btn btn-ghost"
                onClick={resetFilters}
                id="reset-filter-btn"
              >
                Reset Filter
              </button>
              <button
                className="btn btn-primary"
                onClick={applyFilters}
                id="apply-filter-btn"
              >
                Apply Filter
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Receipt Upload Modal ───────────────────────── */}
      {scanUploadOpen && (
        <div
          className="modal-overlay"
          onClick={closeScanUploadModal}
          id="receipt-upload-modal-overlay"
        >
          <div
            className="modal-content receipt-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <h3>📄 Scan Struk dengan AI</h3>
              <button
                className="modal-close"
                onClick={closeScanUploadModal}
                disabled={scanLoading}
              >
                <CloseIcon />
              </button>
            </div>

            <div className="modal-body receipt-modal__body">
              <p className="receipt-modal__hint">
                Upload foto struk fisik atau file struk digital. AI akan isi
                draft transaksi otomatis, lalu kamu bisa edit sebelum simpan.
              </p>

              <label
                className={`receipt-upload ${scanFile ? "receipt-upload--selected" : ""}`}
                htmlFor="receipt-upload-input"
              >
                <div className="receipt-upload__icon">
                  <UploadCloudIcon />
                </div>
                <div className="receipt-upload__text">
                  <strong>
                    {scanFile ? "Ganti file struk" : "Pilih file struk"}
                  </strong>
                  <span>Semua format gambar atau PDF. Maksimum 10MB.</span>
                </div>
              </label>
              <input
                id="receipt-upload-input"
                type="file"
                className="receipt-upload__input"
                accept="image/*,application/pdf"
                onChange={handleScanFileChange}
                disabled={scanLoading}
              />

              {scanFile && (
                <div className="receipt-modal__file">
                  <div className="receipt-modal__file-main">
                    <div className="receipt-modal__file-icon">
                      <FileAttachmentIcon />
                    </div>
                    <div className="receipt-modal__file-meta">
                      <strong className="receipt-modal__file-name">
                        {scanFile.name}
                      </strong>
                      <span>
                        {getFileTypeLabel(scanFile.type)} •{" "}
                        {formatFileSize(scanFile.size)}
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    className="receipt-modal__file-remove"
                    onClick={handleRemoveScanFile}
                    disabled={scanLoading}
                  >
                    Hapus
                  </button>
                </div>
              )}
              {scanError && <p className="form-error">{scanError}</p>}
            </div>

            <div className="modal-footer receipt-modal__footer">
              <button
                className="btn btn-ghost"
                onClick={closeScanUploadModal}
                disabled={scanLoading}
              >
                Batal
              </button>
              <button
                className="btn btn-primary"
                onClick={handleSubmitReceiptScan}
                disabled={scanLoading || !scanFile}
                id="submit-receipt-scan-btn"
              >
                {scanLoading && <span className="spinner" />}
                Scan Sekarang
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Receipt Review Modal ───────────────────────── */}
      {scanReviewOpen && (
        <div
          className="modal-overlay"
          onClick={closeScanReviewModal}
          id="receipt-review-modal-overlay"
        >
          <div
            className="modal-content receipt-modal receipt-modal--review"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <h3>✍️ Review Hasil Scan</h3>
              <button
                className="modal-close"
                onClick={closeScanReviewModal}
                disabled={scanSaving}
              >
                <CloseIcon />
              </button>
            </div>

            <div className="modal-body receipt-modal__body">
              <div className="receipt-ai-meta">
                <span>
                  Confidence AI:{" "}
                  <strong>
                    {Math.round(Number(scanPreview?.confidence || 0) * 100)}%
                  </strong>
                </span>
                {scanPreview?.suggested_category && (
                  <span>
                    Saran kategori:{" "}
                    <strong>{scanPreview.suggested_category}</strong>
                  </span>
                )}
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="scan-tx-type">
                  Tipe Transaksi
                </label>
                <select
                  id="scan-tx-type"
                  className="form-input form-select"
                  value={scanForm.type}
                  onChange={(e) => {
                    const nextType = e.target.value;
                    const nextCategoryId = findSuggestedCategoryId({
                      suggestedCategory: scanPreview?.suggested_category,
                      note: scanForm.note,
                      merchantName: scanPreview?.merchant_name,
                      type: nextType,
                      categories,
                    });

                    setScanForm((prev) => ({
                      ...prev,
                      type: nextType,
                      category_id: nextCategoryId,
                    }));
                  }}
                >
                  <option value="expense">Pengeluaran</option>
                  <option value="income">Pemasukan</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="scan-tx-category">
                  Kategori <span className="form-required">*</span>
                </label>
                <select
                  id="scan-tx-category"
                  className="form-input form-select"
                  value={scanForm.category_id}
                  onChange={(e) =>
                    handleScanFormField("category_id", e.target.value)
                  }
                >
                  <option value="">-- Pilih Kategori --</option>
                  {categories
                    .filter(
                      (category) =>
                        category.type === scanForm.type ||
                        category.type === "both",
                    )
                    .map((category) => (
                      <option key={category.id} value={String(category.id)}>
                        {category.name}
                      </option>
                    ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="scan-tx-amount">
                  Jumlah <span className="form-required">*</span>
                </label>
                <input
                  id="scan-tx-amount"
                  type="number"
                  className="form-input"
                  min="1"
                  step="0.01"
                  value={scanForm.amount}
                  onChange={(e) =>
                    handleScanFormField("amount", e.target.value)
                  }
                  placeholder="0"
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="scan-tx-date">
                  Tanggal <span className="form-required">*</span>
                </label>
                <input
                  id="scan-tx-date"
                  type="date"
                  className="form-input"
                  value={scanForm.date}
                  onChange={(e) => handleScanFormField("date", e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="scan-tx-note">
                  Catatan
                </label>
                <textarea
                  id="scan-tx-note"
                  className="form-input form-textarea"
                  rows={3}
                  value={scanForm.note}
                  onChange={(e) => handleScanFormField("note", e.target.value)}
                  placeholder="Contoh: Makan siang di kantor"
                />
              </div>

              {scanError && <p className="form-error">{scanError}</p>}
            </div>

            <div className="modal-footer receipt-modal__footer">
              <button
                className="btn btn-ghost"
                onClick={closeScanReviewModal}
                disabled={scanSaving}
              >
                Batal
              </button>
              <button
                className="btn btn-primary"
                onClick={handleSaveScannedTransaction}
                disabled={scanSaving}
                id="save-scanned-transaction-btn"
              >
                {scanSaving && <span className="spinner" />}
                Simpan Transaksi
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Delete Modal ───────────────────────────────── */}
      <ConfirmModal
        isOpen={deleteOpen}
        onClose={() => {
          setDeleteOpen(false);
          setDeletingTx(null);
        }}
        onConfirm={handleDelete}
        title="Hapus Transaksi"
        message={
          <>
            Yakin ingin menghapus transaksi{" "}
            <strong>
              &quot;{deletingTx?.category_name} —{" "}
              {formatCurrency(deletingTx?.amount || 0)}&quot;
            </strong>
            ?
          </>
        }
        warning="Transaksi yang dihapus tidak bisa dikembalikan."
        confirmText="Hapus"
        icon="🗑️"
        isSubmitting={submitting}
      />
    </div>
  );
}

export default TransactionList;
