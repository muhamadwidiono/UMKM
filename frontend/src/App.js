import React, { useState, useEffect, useRef, useCallback } from "react";
import { BrowserRouter, Routes, Route, useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import { Toaster, toast } from "sonner";
import { 
  ResponsiveContainer, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend 
} from "recharts";
import { 
  Store, 
  Receipt, 
  Package, 
  Users, 
  MessageSquare, 
  CreditCard, 
  ShieldCheck, 
  LogOut, 
  Plus, 
  Minus, 
  Trash2, 
  Search, 
  Sliders, 
  Clock, 
  TrendingUp, 
  CheckCircle2, 
  AlertTriangle, 
  Coins, 
  Home, 
  ArrowRight, 
  Printer,
  ChevronRight,
  RefreshCw,
  UserCheck
} from "lucide-react";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || "";
const API = `${BACKEND_URL}/api`;

// Axios Defaults
axios.defaults.withCredentials = true;

// Helper to set session_token cookie manually for cross-domain OAuth
const setSessionCookie = (token) => {
  document.cookie = `session_token=${token}; path=/; max-age=${7*24*60*60}; SameSite=None; Secure`;
};

// Clear session cookie
const clearSessionCookie = () => {
  document.cookie = "session_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=None; Secure";
};

// --- AUTH CALLBACK COMPONENT ---
function AuthCallback() {
  const location = useLocation();
  const navigate = useNavigate();
  const hasProcessed = useRef(false);

  useEffect(() => {
    if (hasProcessed.current) return;
    hasProcessed.current = true;

    // Synchronously extract session_id
    const hash = location.hash;
    const match = hash.match(/session_id=([^&]*)/);
    const sessionId = match ? match[1] : null;

    if (sessionId) {
      toast.loading("Menyelaraskan akun Google...", { id: "google-auth" });
      axios.post(`${API}/auth/google`, { session_id: sessionId })
        .then((res) => {
          const { session_token, user } = res.data;
          setSessionCookie(session_token);
          // Set authorization header for current session as fallback
          axios.defaults.headers.common["Authorization"] = `Bearer ${session_token}`;
          toast.success(`Selamat datang kembali, ${user.name}!`, { id: "google-auth" });
          navigate("/dashboard", { state: { user }, replace: true });
        })
        .catch((err) => {
          toast.error("Gagal menautkan Google Auth: " + (err.response?.data?.detail || err.message), { id: "google-auth" });
          navigate("/login", { replace: true });
        });
    } else {
      navigate("/login", { replace: true });
    }
  }, [location, navigate]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[#0B0F19] text-white">
      <div className="flex flex-col items-center p-8 bg-[#131722] border border-white/5 rounded-2xl shadow-2xl space-y-4">
        <div className="w-12 h-12 border-4 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-slate-300 font-medium">Memproses autentikasi Google...</p>
      </div>
    </div>
  );
}

// --- LANDING PAGE ---
function LandingPage() {
  const navigate = useNavigate();
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const hasCookie = document.cookie.includes("session_token=");
    if (hasCookie) {
      setIsLoggedIn(true);
    }
  }, []);

  const FAQItems = [
    { q: "Apakah data bisnis saya aman dari tenant lain?", a: "Sangat aman. Sistem kami menggunakan isolasi database multi-tenant yang ketat menggunakan tenant_id pada setiap query database. Tenant lain tidak akan pernah bisa mengintip atau mengakses data bisnis Anda." },
    { q: "Bagaimana cara pengiriman WhatsApp otomatis bekerja?", a: "Pada paket Pro, sistem kami mendeteksi nomor telepon pelanggan Anda dan secara otomatis mengirimkan rincian invoice, bukti bayar, atau pengingat jatuh tempo melalui WhatsApp API resmi ketika transaksi dicatat." },
    { q: "Apakah saya bisa berganti paket kapan saja?", a: "Tentu saja! Anda bisa melakukan upgrade dari paket Gratis ke Basic atau Pro kapan saja melalui halaman Billing, dengan pembayaran mudah menggunakan gateway lokal." }
  ];

  return (
    <div className="min-h-screen bg-[#0B0F19] text-white flex flex-col font-sans">
      {/* Header / Navbar */}
      <header className="glass sticky top-0 z-50 px-6 py-4 flex justify-between items-center">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-amber-500/20 text-amber-500 rounded-lg">
            <Store size={24} />
          </div>
          <span className="text-xl font-black tracking-tight">BisnisHub <span className="text-amber-500">SaaS</span></span>
        </div>
        <div className="flex items-center space-x-4">
          <a href="#features" className="text-sm text-slate-400 hover:text-white transition-colors hidden md:block">Fitur</a>
          <a href="#pricing" className="text-sm text-slate-400 hover:text-white transition-colors hidden md:block">Harga</a>
          <a href="#faq" className="text-sm text-slate-400 hover:text-white transition-colors hidden md:block">FAQ</a>
          {isLoggedIn ? (
            <button
              onClick={() => navigate("/dashboard")}
              className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-[#0B0F19] text-xs font-bold rounded-xl transition-transform active:translate-y-0.5"
            >
              Ke Dashboard
            </button>
          ) : (
            <>
              <button
                onClick={() => navigate("/login")}
                className="text-xs text-white font-bold hover:underline"
              >
                Masuk
              </button>
              <button
                onClick={() => navigate("/login")}
                className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-[#0B0F19] text-xs font-bold rounded-xl transition-transform active:translate-y-0.5"
              >
                Coba Gratis
              </button>
            </>
          )}
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative px-6 py-20 md:py-32 flex flex-col items-center text-center max-w-4xl mx-auto space-y-6 overflow-hidden">
        <div className="absolute top-0 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl -translate-y-1/2"></div>
        <div className="absolute bottom-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl translate-y-1/2"></div>

        <span className="text-[10px] bg-amber-500/10 text-amber-500 font-black tracking-widest px-3 py-1 rounded-full uppercase border border-amber-500/20">
          Solusi Operasional UMKM Terbaik #1 di Indonesia
        </span>
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white tracking-tighter leading-none">
          Kelola Bisnis UMKM <br /><span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-500 to-amber-300">Lebih Mudah & Modern</span>
        </h1>
        <p className="text-slate-400 text-sm sm:text-base md:text-lg max-w-2xl leading-relaxed">
          Kelola pelanggan, transaksi kasir, invoice, pembayaran cicilan, pencatatan hutang, stok gudang otomatis, hingga laporan keuangan dan notifikasi WhatsApp otomatis dalam satu aplikasi multi-tenant yang aman.
        </p>
        <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4 pt-4 justify-center">
          <button
            onClick={() => navigate("/login")}
            className="px-8 py-3.5 bg-amber-500 hover:bg-amber-600 text-[#0B0F19] font-black rounded-xl text-sm transition-transform active:translate-y-0.5 shadow-lg shadow-amber-500/20"
          >
            Mulai Gratis Sekarang
          </button>
          <a
            href="#pricing"
            className="px-8 py-3.5 bg-[#1A1F2E] hover:bg-slate-800 text-white font-bold rounded-xl text-sm border border-white/5 transition-colors text-center"
          >
            Lihat Paket Harga
          </a>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="px-6 py-20 bg-[#131722]/50 border-t border-b border-white/5">
        <div className="max-w-6xl mx-auto space-y-12">
          <div className="text-center space-y-3">
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">Semua Kebutuhan Bisnis Anda, Terpenuhi</h2>
            <p className="text-slate-400 text-xs max-w-lg mx-auto">Dirancang khusus untuk laundry, bengkel, toko retail, salon, catering, dan jasa profesional lainnya.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-[#131722] border border-white/5 p-6 rounded-2xl space-y-3">
              <div className="p-3 bg-amber-500/10 text-amber-500 rounded-xl w-fit">
                <Store size={24} />
              </div>
              <h3 className="font-bold text-white text-base">Mesin POS Kasir Cepat</h3>
              <p className="text-xs text-slate-400 leading-relaxed">Mencatat pesanan pelanggan dalam beberapa ketukan, mendukung diskon, pajak, cetak struk, dan berbagai metode bayar.</p>
            </div>

            <div className="bg-[#131722] border border-white/5 p-6 rounded-2xl space-y-3">
              <div className="p-3 bg-blue-500/10 text-blue-500 rounded-xl w-fit">
                <MessageSquare size={24} />
              </div>
              <h3 className="font-bold text-white text-base">Notifikasi WhatsApp (Pro)</h3>
              <p className="text-xs text-slate-400 leading-relaxed">Kirim struk digital, kuitansi bayar, serta pengingat jatuh tempo kasbon pelanggan secara otomatis via WhatsApp.</p>
            </div>

            <div className="bg-[#131722] border border-white/5 p-6 rounded-2xl space-y-3">
              <div className="p-3 bg-emerald-500/10 text-emerald-500 rounded-xl w-fit">
                <Package size={24} />
              </div>
              <h3 className="font-bold text-white text-base">Kontrol Persediaan Stok (Pro)</h3>
              <p className="text-xs text-slate-400 leading-relaxed">Pengurangan stok otomatis ketika transaksi dicatat, peringatan ketika stok menipis, serta mutasi stok komprehensif.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="px-6 py-20 max-w-6xl mx-auto space-y-12">
        <div className="text-center space-y-3">
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">Pilihan Paket Langganan Sederhana</h2>
          <p className="text-slate-400 text-xs max-w-lg mx-auto">Tanpa kontrak tersembunyi, pilih paket yang paling cocok untuk operasional bisnis Anda saat ini.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* GRATIS */}
          <div className="bg-[#131722] border border-white/5 rounded-2xl p-6 flex flex-col justify-between space-y-6 hover:border-white/10 transition-colors">
            <div className="space-y-4">
              <div>
                <h3 className="font-black text-white text-lg tracking-tight">GRATIS</h3>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">Sempurna untuk uji coba operasional awal UMKM</p>
              </div>
              <div>
                <span className="text-2xl font-black text-white">Rp 0</span>
                <span className="text-[10px] text-slate-400 block mt-1">Maksimal 50 transaksi / bulan</span>
              </div>
              <ul className="space-y-2 pt-2 text-xs text-slate-300">
                <li className="flex items-center space-x-2">
                  <CheckCircle2 className="text-amber-500 shrink-0" size={14} />
                  <span>Batas 50 Transaksi</span>
                </li>
                <li className="flex items-center space-x-2">
                  <CheckCircle2 className="text-amber-500 shrink-0" size={14} />
                  <span>POS dasar</span>
                </li>
                <li className="flex items-center space-x-2">
                  <CheckCircle2 className="text-amber-500 shrink-0" size={14} />
                  <span>Metode bayar Cash</span>
                </li>
              </ul>
            </div>
            <button
              onClick={() => navigate("/login")}
              className="w-full py-2.5 bg-[#1A1F2E] hover:bg-amber-500 hover:text-[#0B0F19] text-white font-bold rounded-xl text-xs transition-colors"
            >
              Mulai Gratis
            </button>
          </div>

          {/* BASIC */}
          <div className="bg-[#131722] border border-white/5 rounded-2xl p-6 flex flex-col justify-between space-y-6 hover:border-white/10 transition-colors">
            <div className="space-y-4">
              <div>
                <h3 className="font-black text-white text-lg tracking-tight">BASIC</h3>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">Ideal untuk toko operasional bertumbuh</p>
              </div>
              <div>
                <span className="text-2xl font-black text-white">Rp 49.000</span>
                <span className="text-[10px] text-slate-400 block mt-1">Tanpa batasan transaksi harian</span>
              </div>
              <ul className="space-y-2 pt-2 text-xs text-slate-300">
                <li className="flex items-center space-x-2">
                  <CheckCircle2 className="text-amber-500 shrink-0" size={14} />
                  <span>Transaksi Unlimited</span>
                </li>
                <li className="flex items-center space-x-2">
                  <CheckCircle2 className="text-amber-500 shrink-0" size={14} />
                  <span>Manajemen Stok dasar</span>
                </li>
                <li className="flex items-center space-x-2">
                  <CheckCircle2 className="text-amber-500 shrink-0" size={14} />
                  <span>Metode QRIS & Kasbon</span>
                </li>
                <li className="flex items-center space-x-2">
                  <CheckCircle2 className="text-amber-500 shrink-0" size={14} />
                  <span>Histori Pelanggan lengkap</span>
                </li>
              </ul>
            </div>
            <button
              onClick={() => navigate("/login")}
              className="w-full py-2.5 bg-[#1A1F2E] hover:bg-amber-500 hover:text-[#0B0F19] text-white font-bold rounded-xl text-xs transition-colors"
            >
              Pilih Basic
            </button>
          </div>

          {/* PRO */}
          <div className="bg-[#131722] border border-amber-500 rounded-2xl p-6 flex flex-col justify-between space-y-6 relative hover:shadow-[0_8px_32px_rgba(245,158,11,0.15)] transition-all">
            <span className="absolute top-0 right-6 -translate-y-1/2 text-[9px] bg-amber-500 text-[#0B0F19] font-black tracking-widest px-2.5 py-1 rounded-full uppercase shadow">
              PALING POPULER
            </span>
            <div className="space-y-4">
              <div>
                <h3 className="font-black text-white text-lg tracking-tight">PRO</h3>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">Fitur lengkap untuk bisnis profesional berskala besar</p>
              </div>
              <div>
                <span className="text-2xl font-black text-white">Rp 99.000</span>
                <span className="text-[10px] text-slate-400 block mt-1">Tanpa batasan transaksi harian</span>
              </div>
              <ul className="space-y-2 pt-2 text-xs text-slate-300">
                <li className="flex items-center space-x-2">
                  <CheckCircle2 className="text-amber-500 shrink-0" size={14} />
                  <span>Semua Fitur Basic</span>
                </li>
                <li className="flex items-center space-x-2">
                  <CheckCircle2 className="text-amber-500 shrink-0" size={14} />
                  <span>Deduction Stok otomatis</span>
                </li>
                <li className="flex items-center space-x-2">
                  <CheckCircle2 className="text-amber-500 shrink-0" size={14} />
                  <span>Notifikasi WhatsApp otomatis</span>
                </li>
                <li className="flex items-center space-x-2">
                  <CheckCircle2 className="text-amber-500 shrink-0" size={14} />
                  <span>Laporan Keuangan Ekspor</span>
                </li>
              </ul>
            </div>
            <button
              onClick={() => navigate("/login")}
              className="w-full py-2.5 bg-amber-500 hover:bg-amber-600 text-[#0B0F19] font-black rounded-xl text-xs transition-colors"
            >
              Pilih Pro
            </button>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="px-6 py-20 bg-[#131722]/30 border-t border-white/5">
        <div className="max-w-4xl mx-auto space-y-12">
          <div className="text-center space-y-3">
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">Pertanyaan Sering Diajukan (FAQ)</h2>
            <p className="text-slate-400 text-xs max-w-lg mx-auto">Jawaban singkat untuk meluruskan rasa penasaran Anda.</p>
          </div>

          <div className="space-y-4">
            {FAQItems.map((item, idx) => (
              <div key={idx} className="p-5 bg-[#131722] border border-white/5 rounded-2xl space-y-2">
                <h4 className="font-bold text-white text-sm">Q: {item.q}</h4>
                <p className="text-xs text-slate-400 leading-relaxed">A: {item.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="px-6 py-12 border-t border-white/5 bg-[#0B0F19] text-center text-xs text-slate-500 space-y-3 mt-auto">
        <p>© 2026 BisnisHub SaaS. Seluruh Hak Cipta Dilindungi.</p>
        <p className="text-[10px]">Diproteksi dengan enkripsi multi-tenant modern & Standard Keamanan Industri.</p>
      </footer>
    </div>
  );
}

// --- APPROUTER WRAPPER TO PREVENT AUTH RACE CONDITIONS ---
function AppRouter() {
  const location = useLocation();
  
  // Synchronous route-level capture of OAuth callback
  if (location.hash && location.hash.includes("session_id=")) {
    return <AuthCallback />;
  }

  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/*" element={<MainAppLayout />} />
    </Routes>
  );
}

// --- LOGIN PAGE ---
function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isRegister, setIsRegister] = useState(false);
  const [regName, setRegName] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regBizName, setRegBusinessName] = useState("");
  const [regBizType, setRegBusinessType] = useState("laundry");
  const [loading, setLoading] = useState(false);

  // Direct login utility for testing/demo
  const handleDirectLogin = (testEmail, testPass) => {
    setLoading(true);
    axios.post(`${API}/auth/login`, { email: testEmail, password: testPass })
      .then((res) => {
        const { token, user } = res.data;
        setSessionCookie(token);
        axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
        toast.success(`Masuk sebagai ${user.name} (${user.role})`);
        navigate("/dashboard");
      })
      .catch((err) => {
        toast.error("Gagal masuk: " + (err.response?.data?.detail || err.message));
      })
      .finally(() => setLoading(false));
  };

  const handleCustomSubmit = (e) => {
    e.preventDefault();
    setLoading(true);
    if (isRegister) {
      axios.post(`${API}/auth/register`, {
        name: regName,
        email: regEmail,
        password: regPassword,
        business_name: regBizName,
        business_type: regBizType
      })
        .then((res) => {
          const { token, user } = res.data;
          setSessionCookie(token);
          axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
          toast.success("Registrasi Berhasil! Selamat datang.");
          navigate("/dashboard");
        })
        .catch((err) => {
          toast.error("Gagal Registrasi: " + (err.response?.data?.detail || err.message));
        })
        .finally(() => setLoading(false));
    } else {
      axios.post(`${API}/auth/login`, { email, password })
        .then((res) => {
          const { token, user } = res.data;
          setSessionCookie(token);
          axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
          toast.success(`Selamat datang kembali, ${user.name}!`);
          navigate("/dashboard");
        })
        .catch((err) => {
          toast.error("Email atau password salah.");
        })
        .finally(() => setLoading(false));
    }
  };

  const triggerGoogleAuth = () => {
    // REMINDER: DO NOT HARDCODE THE URL, OR ADD ANY FALLBACKS OR REDIRECT URLS, THIS BREAKS THE AUTH
    const redirectUrl = window.location.origin + "/dashboard";
    window.location.href = `https://auth.emergentagent.com/?redirect=${encodeURIComponent(redirectUrl)}`;
  };

  return (
    <div className="flex flex-col lg:flex-row min-h-screen bg-[#0B0F19]">
      {/* Brand & Marketing Column */}
      <div className="flex flex-col justify-center p-8 lg:p-16 lg:w-1/2 bg-[#0B0F19] border-r border-white/5 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2"></div>
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl translate-x-1/2 translate-y-1/2"></div>
        
        <div className="relative space-y-6 max-w-lg">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-amber-500/20 text-amber-500 rounded-xl border border-amber-500/30">
              <Store size={32} />
            </div>
            <span className="text-2xl font-black tracking-tight text-white">BisnisHub <span className="text-amber-500">SaaS</span></span>
          </div>
          
          <h1 className="text-4xl sm:text-5xl font-black text-white tracking-tight leading-none">
            Sistem Operasional <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-500 to-amber-300">UMKM Tangguh</span>
          </h1>
          <p className="text-slate-400 text-lg">
            Satu platform multi-tenant lengkap untuk mengelola laundry, bengkel, toko kelontong, atau jasa Anda. Catat transaksi, pantau stok otomatis, notifikasi WhatsApp real-time, dan pantau keuangan bisnis secara presisi.
          </p>
          
          <div className="grid grid-cols-2 gap-4 pt-6">
            <div className="p-4 bg-[#131722] border border-white/5 rounded-xl">
              <h3 className="font-bold text-amber-500 text-sm">Isolasi Multi-Tenant</h3>
              <p className="text-xs text-slate-400 mt-1">Keamanan data bisnis Anda terjamin secara mutlak.</p>
            </div>
            <div className="p-4 bg-[#131722] border border-white/5 rounded-xl">
              <h3 className="font-bold text-blue-500 text-sm">Notifikasi WA (Pro)</h3>
              <p className="text-xs text-slate-400 mt-1">Struk & tagihan dikirim otomatis langsung ke pelanggan.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Form Column */}
      <div className="flex flex-col justify-center items-center p-6 sm:p-12 lg:w-1/2 bg-[#0B0F19]">
        <div className="w-full max-w-md bg-[#131722] border border-white/5 rounded-2xl shadow-2xl p-8 space-y-6">
          <div className="space-y-2 text-center">
            <h2 className="text-2xl font-bold text-white tracking-tight" data-testid="login-title">
              {isRegister ? "Daftarkan UMKM Baru" : "Masuk ke Akun Anda"}
            </h2>
            <p className="text-slate-400 text-sm">
              {isRegister ? "Mulai kembangkan operasional bisnis Anda sekarang" : "Kelola transaksi harian dalam satu dasbor"}
            </p>
          </div>

          <form onSubmit={handleCustomSubmit} className="space-y-4">
            {isRegister && (
              <>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">Nama Lengkap</label>
                  <input 
                    data-testid="register-name-input"
                    type="text" required value={regName} onChange={(e) => setRegName(e.target.value)}
                    placeholder="Contoh: Muhamad Widiono"
                    className="w-full px-4 py-2.5 bg-[#0B0F19] border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-amber-500 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">Nama Bisnis / UMKM</label>
                  <input 
                    data-testid="register-business-name-input"
                    type="text" required value={regBizName} onChange={(e) => setRegBusinessName(e.target.value)}
                    placeholder="Contoh: Widiono Laundry & Toko"
                    className="w-full px-4 py-2.5 bg-[#0B0F19] border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-amber-500 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">Tipe Bisnis</label>
                  <select 
                    data-testid="register-business-type-select"
                    value={regBizType} onChange={(e) => setRegBusinessType(e.target.value)}
                    className="w-full px-4 py-2.5 bg-[#0B0F19] border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-amber-500 transition-colors"
                  >
                    <option value="laundry">Laundry</option>
                    <option value="bengkel">Bengkel</option>
                    <option value="toko">Toko Kelontong / Retail</option>
                    <option value="jasa">Jasa / Konsultan</option>
                  </select>
                </div>
              </>
            )}

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">Email</label>
              <input 
                data-testid={isRegister ? "register-email-input" : "login-email-input"}
                type="email" required value={isRegister ? regEmail : email} onChange={(e) => isRegister ? setRegEmail(e.target.value) : setEmail(e.target.value)}
                placeholder="email@bisnis.com"
                className="w-full px-4 py-2.5 bg-[#0B0F19] border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-amber-500 transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">Kata Sandi</label>
              <input 
                data-testid={isRegister ? "register-password-input" : "login-password-input"}
                type="password" required value={isRegister ? regPassword : password} onChange={(e) => isRegister ? setRegPassword(e.target.value) : setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-2.5 bg-[#0B0F19] border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-amber-500 transition-colors"
              />
            </div>

            <button 
              data-testid={isRegister ? "register-submit-button" : "login-submit-button"}
              type="submit" disabled={loading}
              className="w-full py-3 bg-amber-500 hover:bg-amber-600 active:translate-y-0.5 transform transition-transform text-[#0B0F19] font-bold rounded-xl text-center shadow-lg shadow-amber-500/20 text-sm"
            >
              {loading ? "Memproses..." : (isRegister ? "Daftar Bisnis" : "Masuk Akun")}
            </button>
          </form>

          <div className="relative flex py-2 items-center">
            <div className="flex-grow border-t border-white/5"></div>
            <span className="flex-shrink mx-4 text-slate-500 text-xs uppercase tracking-wider">Atau Masuk Dengan</span>
            <div className="flex-grow border-t border-white/5"></div>
          </div>

          <button 
            data-testid="login-google-btn"
            onClick={triggerGoogleAuth}
            className="w-full py-3 bg-[#1A1F2E] hover:bg-slate-800 text-white font-semibold rounded-xl border border-white/5 flex items-center justify-center space-x-2 transition-colors active:translate-y-0.5 text-sm"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l3.66-2.85z"/>
              <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            <span>Google Social Login</span>
          </button>

          {/* Quick Demo Logins for Fast Verification & QA Test cases */}
          <div className="p-4 bg-[#1A1F2E]/60 border border-white/5 rounded-xl space-y-3">
            <span className="block text-[10px] font-black tracking-widest text-slate-400 uppercase text-center">Bypass Akun Demo (QA / Pengujian)</span>
            <div className="flex flex-col space-y-2">
              <button 
                data-testid="login-demo-owner-pro"
                onClick={() => handleDirectLogin("muhamad.widiono98@gmail.com", "Password123!")}
                className="w-full py-2 bg-amber-500/10 hover:bg-amber-500/20 text-amber-500 font-bold text-xs rounded-lg border border-amber-500/20 text-left px-3 flex justify-between"
              >
                <span>Widiono (Owner Pro)</span>
                <span className="text-slate-500 font-normal">muhamad.widiono98@gmail.com</span>
              </button>
              <button 
                data-testid="login-demo-staff"
                onClick={() => handleDirectLogin("staff@widiono.com", "Password123!")}
                className="w-full py-2 bg-blue-500/10 hover:bg-blue-500/20 text-blue-500 font-bold text-xs rounded-lg border border-blue-500/20 text-left px-3 flex justify-between"
              >
                <span>Staff Widiono</span>
                <span className="text-slate-500 font-normal">staff@widiono.com</span>
              </button>
              <button 
                data-testid="login-demo-owner-gratis"
                onClick={() => handleDirectLogin("owner-gratis@test.com", "Password123!")}
                className="w-full py-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-500 font-bold text-xs rounded-lg border border-emerald-500/20 text-left px-3 flex justify-between"
              >
                <span>Owner Gratis (Limit 10)</span>
                <span className="text-slate-500 font-normal">owner-gratis@test.com</span>
              </button>
            </div>
          </div>

          <div className="text-center pt-2">
            <button 
              data-testid="toggle-auth-mode"
              onClick={() => setIsRegister(!isRegister)}
              className="text-amber-500 hover:text-amber-400 text-sm font-semibold hover:underline"
            >
              {isRegister ? "Sudah punya akun? Masuk" : "Daftarkan bisnis baru Anda di sini"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// --- MAIN LAYOUT COMPONENT ---
function MainAppLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const [currentUser, setCurrentUser] = useState(null);
  const [tenant, setTenant] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentTab, setCurrentTab] = useState("dashboard");

  // Onboarding Wizard States
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [onboardingStep, setOnboardingStep] = useState(1);
  const [onboardBizName, setOnboardBizName] = useState("");
  const [onboardBizType, setOnboardBizType] = useState("laundry");
  const [onboardCustName, setOnboardCustName] = useState("");
  const [onboardCustPhone, setOnboardCustPhone] = useState("");
  const [onboardProdName, setOnboardProdName] = useState("");
  const [onboardProdPrice, setOnboardProdPrice] = useState(0);

  // Check auth
  useEffect(() => {
    // If returning from OAuth callback, skip the /me check
    if (window.location.hash?.includes("session_id=")) {
      setLoading(false);
      return;
    }

    const hasCookie = document.cookie.includes("session_token=");
    const hasAuthHeader = axios.defaults.headers.common["Authorization"];

    // If no session exists at all, silently redirect to login
    if (!hasCookie && !hasAuthHeader) {
      setLoading(false);
      navigate("/login", { replace: true });
      return;
    }

    axios.get(`${API}/auth/me`)
      .then((res) => {
        setCurrentUser(res.data.user);
        setTenant(res.data.tenant);
        setLoading(false);

        // Show onboarding if tenant has 0 transaction history and hasn't dismissed it
        if (res.data.tenant && res.data.tenant.transaction_count === 0 && !localStorage.getItem(`onboard_done_${res.data.tenant.tenant_id}`)) {
          setOnboardBizName(res.data.tenant.name || "");
          setOnboardBizType(res.data.tenant.type || "laundry");
          setShowOnboarding(true);
        }
      })
      .catch((err) => {
        if (hasCookie) {
          toast.error("Sesi telah habis. Harap masuk kembali.");
        }
        clearSessionCookie();
        navigate("/login", { replace: true });
      });
  }, [navigate]);

  const handleLogout = () => {
    axios.post(`${API}/auth/logout`)
      .then(() => {
        clearSessionCookie();
        delete axios.defaults.headers.common["Authorization"];
        toast.success("Berhasil keluar.");
        navigate("/login");
      })
      .catch(() => {
        clearSessionCookie();
        navigate("/login");
      });
  };

  if (loading || !currentUser) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#0B0F19] text-white">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-10 h-10 border-4 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-slate-400 font-medium">Memuat data operasional...</p>
        </div>
      </div>
    );
  }

  const tabItems = [
    { id: "dashboard", name: "Dashboard Laporan", icon: Home },
    { id: "pos", name: "POS & Kasir", icon: Store },
    { id: "transactions", name: "Daftar Transaksi", icon: Receipt },
    { id: "products", name: "Stok & Produk", icon: Package },
    { id: "customers", name: "Manajemen Pelanggan", icon: Users },
    { id: "whatsapp", name: "Notifikasi WhatsApp", icon: MessageSquare, badge: tenant?.package === "Pro" ? "Pro" : "Disabled" },
    { id: "billing", name: "Billing & Paket", icon: CreditCard }
  ];

  // Include Super Admin Tab only for muhamad.widiono98@gmail.com
  if (currentUser?.email === "muhamad.widiono98@gmail.com") {
    tabItems.push({ id: "superadmin", name: "Super Admin Hub", icon: ShieldCheck });
  }

  return (
    <div className="flex flex-col lg:flex-row min-h-screen bg-[#0B0F19]">
      {/* Sidebar Navigation */}
      <aside className="w-full lg:w-64 bg-[#131722] border-b lg:border-b-0 lg:border-r border-white/5 flex flex-col shrink-0">
        {/* Sidebar Header */}
        <div className="p-6 border-b border-white/5 flex items-center space-x-3">
          <div className="p-2 bg-amber-500/20 text-amber-500 rounded-lg">
            <Store size={24} />
          </div>
          <div className="truncate">
            <h2 className="font-bold text-white text-sm truncate">{tenant?.name || "Widiono UMKM"}</h2>
            <span className="text-[10px] bg-amber-500/10 text-amber-500 font-black tracking-widest px-2 py-0.5 rounded uppercase">
              Paket {tenant?.package || "Gratis"}
            </span>
          </div>
        </div>

        {/* Tab Items */}
        <nav className="flex-grow p-4 space-y-1 overflow-y-auto">
          {tabItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                data-testid={`nav-tab-${item.id}`}
                onClick={() => setCurrentTab(item.id)}
                className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-colors font-medium text-sm text-left active:translate-y-0.5 transform ${
                  isActive 
                    ? "bg-amber-500 text-[#0B0F19]" 
                    : "text-slate-400 hover:bg-[#1A1F2E] hover:text-white"
                }`}
              >
                <div className="flex items-center space-x-3">
                  <Icon size={18} />
                  <span>{item.name}</span>
                </div>
                {item.badge && (
                  <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase ${
                    item.badge === "Pro" ? "bg-amber-500/20 text-amber-500" : "bg-slate-800 text-slate-500"
                  }`}>
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Sidebar Footer User Info */}
        <div className="p-4 border-t border-white/5 bg-[#10141d] space-y-4">
          <div className="flex items-center space-x-3">
            <img 
              src={currentUser?.picture || "https://images.unsplash.com/photo-1735948055457-8d816fb80a87"} 
              alt={currentUser?.name}
              className="w-10 h-10 rounded-full border border-white/10"
            />
            <div className="truncate">
              <h4 className="text-white text-xs font-bold truncate">{currentUser?.name}</h4>
              <p className="text-slate-500 text-[10px] truncate">{currentUser?.email}</p>
              <span className="text-[9px] text-amber-500 font-semibold">{currentUser?.role}</span>
            </div>
          </div>

          <button
            data-testid="logout-button"
            onClick={handleLogout}
            className="w-full py-2.5 bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/20 hover:text-red-400 transition-colors font-bold text-xs rounded-xl flex items-center justify-center space-x-2"
          >
            <LogOut size={16} />
            <span>Keluar Sistem</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-grow p-6 lg:p-8 overflow-y-auto max-w-full">
        <div className="animate-fade-in space-y-6">
          {currentTab === "dashboard" && <DashboardTab currentUser={currentUser} tenant={tenant} />}
          {currentTab === "pos" && <POSTab currentUser={currentUser} tenant={tenant} />}
          {currentTab === "transactions" && <TransactionsTab currentUser={currentUser} tenant={tenant} />}
          {currentTab === "products" && <ProductsTab currentUser={currentUser} tenant={tenant} />}
          {currentTab === "customers" && <CustomersTab currentUser={currentUser} tenant={tenant} />}
          {currentTab === "whatsapp" && <WhatsAppTab currentUser={currentUser} tenant={tenant} />}
          {currentTab === "billing" && <BillingTab currentUser={currentUser} tenant={tenant} />}
          {currentTab === "superadmin" && <SuperAdminTab currentUser={currentUser} tenant={tenant} />}
        </div>
      </main>

      {/* ONBOARDING WIZARD OVERLAY MODAL */}
      {showOnboarding && (
        <div className="fixed inset-0 bg-[#0B0F19]/90 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-[#131722] border border-amber-500/30 rounded-2xl w-full max-w-lg p-8 space-y-6 shadow-2xl relative">
            
            {/* Onboarding Header */}
            <div className="space-y-2 text-center border-b border-white/5 pb-4">
              <div className="flex justify-between items-center text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                <span className="text-amber-500">Panduan Onboarding UMKM</span>
                <span>Langkah {onboardingStep} dari 5</span>
              </div>
              
              {/* Step Progress Bar */}
              <div className="w-full bg-[#1A1F2E] h-1.5 rounded-full overflow-hidden mt-2">
                <div 
                  className="bg-amber-500 h-full transition-all duration-300"
                  style={{ width: `${(onboardingStep / 5) * 100}%` }}
                ></div>
              </div>
            </div>

            {/* Step 1: Informasi Bisnis */}
            {onboardingStep === 1 && (
              <div className="space-y-4">
                <div className="space-y-1 text-center">
                  <h3 className="text-base font-bold text-white">Langkah 1: Profil & Informasi Bisnis</h3>
                  <p className="text-xs text-slate-400">Pastikan rincian dasar usaha Anda sudah benar.</p>
                </div>
                <div className="space-y-3 text-xs text-slate-300">
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">Nama Bisnis / UMKM</label>
                    <input 
                      type="text" value={onboardBizName} onChange={(e) => setOnboardBizName(e.target.value)}
                      className="w-full px-3 py-2 bg-[#0B0F19] border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">Jenis Operasional</label>
                    <select 
                      value={onboardBizType} onChange={(e) => setOnboardBizType(e.target.value)}
                      className="w-full px-3 py-2 bg-[#0B0F19] border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                    >
                      <option value="laundry">Laundry</option>
                      <option value="bengkel">Bengkel</option>
                      <option value="toko">Toko Kelontong</option>
                      <option value="jasa">Jasa Servis / Lainnya</option>
                    </select>
                  </div>
                </div>
                <button
                  onClick={() => setOnboardingStep(2)}
                  className="w-full py-2.5 bg-amber-500 hover:bg-amber-600 text-[#0B0F19] font-bold rounded-xl text-xs active:translate-y-0.5 transition-transform"
                >
                  Lanjut ke Pelanggan
                </button>
              </div>
            )}

            {/* Step 2: Tambahkan Pelanggan Pertama */}
            {onboardingStep === 2 && (
              <div className="space-y-4">
                <div className="space-y-1 text-center">
                  <h3 className="text-base font-bold text-white">Langkah 2: Tambahkan Pelanggan Pertama</h3>
                  <p className="text-xs text-slate-400">Siapa pelanggan pertama yang ingin Anda layani?</p>
                </div>
                <div className="space-y-3 text-xs text-slate-300">
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">Nama Pelanggan</label>
                    <input 
                      type="text" placeholder="Contoh: Budi Santoso" value={onboardCustName} onChange={(e) => setOnboardCustName(e.target.value)}
                      className="w-full px-3 py-2 bg-[#0B0F19] border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">Nomor WhatsApp</label>
                    <input 
                      type="text" placeholder="Contoh: 081234567890" value={onboardCustPhone} onChange={(e) => setOnboardCustPhone(e.target.value)}
                      className="w-full px-3 py-2 bg-[#0B0F19] border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                </div>
                <div className="flex space-x-3">
                  <button
                    onClick={() => setOnboardingStep(1)}
                    className="flex-1 py-2 bg-[#1A1F2E] hover:bg-slate-800 text-white font-bold rounded-xl text-xs border border-white/5"
                  >
                    Kembali
                  </button>
                  <button
                    onClick={() => {
                      if (onboardCustName.trim() && onboardCustPhone.trim()) {
                        axios.post(`${API}/customers`, {
                          customer_id: "", tenant_id: "", name: onboardCustName, phone: onboardCustPhone, address: ""
                        }).catch(() => {});
                      }
                      setOnboardingStep(3);
                    }}
                    className="flex-1 py-2 bg-amber-500 hover:bg-amber-600 text-[#0B0F19] font-bold rounded-xl text-xs active:translate-y-0.5 transition-transform"
                  >
                    Simpan & Lanjut
                  </button>
                </div>
              </div>
            )}

            {/* Step 3: Tambahkan Produk Pertama */}
            {onboardingStep === 3 && (
              <div className="space-y-4">
                <div className="space-y-1 text-center">
                  <h3 className="text-base font-bold text-white">Langkah 3: Tambahkan Produk / Jasa Pertama</h3>
                  <p className="text-xs text-slate-400">Daftarkan item atau jasa kasir utama usaha Anda.</p>
                </div>
                <div className="space-y-3 text-xs text-slate-300">
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">Nama Produk / Jasa</label>
                    <input 
                      type="text" placeholder="Contoh: Cuci Kiloan Standard" value={onboardProdName} onChange={(e) => setOnboardProdName(e.target.value)}
                      className="w-full px-3 py-2 bg-[#0B0F19] border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">Harga Jual (Rp)</label>
                    <input 
                      type="number" value={onboardProdPrice} onChange={(e) => setOnboardProdPrice(parseFloat(e.target.value) || 0)}
                      className="w-full px-3 py-2 bg-[#0B0F19] border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                </div>
                <div className="flex space-x-3">
                  <button
                    onClick={() => setOnboardingStep(2)}
                    className="flex-1 py-2 bg-[#1A1F2E] hover:bg-slate-800 text-white font-bold rounded-xl text-xs border border-white/5"
                  >
                    Kembali
                  </button>
                  <button
                    onClick={() => {
                      if (onboardProdName.trim() && onboardProdPrice > 0) {
                        axios.post(`${API}/products`, {
                          product_id: "", tenant_id: "", name: onboardProdName, price: onboardProdPrice, stock: 100, min_stock: 5, unit: "pcs"
                        }).catch(() => {});
                      }
                      setOnboardingStep(4);
                    }}
                    className="flex-1 py-2 bg-amber-500 hover:bg-amber-600 text-[#0B0F19] font-bold rounded-xl text-xs active:translate-y-0.5 transition-transform"
                  >
                    Simpan & Lanjut
                  </button>
                </div>
              </div>
            )}

            {/* Step 4: Pilih Paket Berlangganan */}
            {onboardingStep === 4 && (
              <div className="space-y-4">
                <div className="space-y-1 text-center">
                  <h3 className="text-base font-bold text-white">Langkah 4: Pilih Paket Langganan UMKM</h3>
                  <p className="text-xs text-slate-400">Pilih paket terbaik untuk memaksimalkan omset operasional.</p>
                </div>
                
                {/* Simplified pricing grid for modal */}
                <div className="grid grid-cols-3 gap-3 text-[11px] text-slate-300">
                  <div className="p-3 bg-[#0B0F19] border border-white/5 rounded-xl text-center space-y-1">
                    <span className="font-bold text-white block">GRATIS</span>
                    <span className="text-[10px] text-amber-500 block">Rp 0</span>
                    <p className="text-[9px] text-slate-500 mt-1">Limit 50 trx/bln</p>
                  </div>
                  <div className="p-3 bg-[#0B0F19] border border-white/5 rounded-xl text-center space-y-1">
                    <span className="font-bold text-white block">BASIC</span>
                    <span className="text-[10px] text-amber-500 block">Rp 49K</span>
                    <p className="text-[9px] text-slate-500 mt-1">Stok & Piutang</p>
                  </div>
                  <div className="p-3 bg-[#0B0F19] border border-amber-500/50 rounded-xl text-center space-y-1 relative">
                    <span className="absolute top-0 right-1 -translate-y-1/2 text-[7px] bg-amber-500 text-[#0B0F19] font-bold px-1 rounded">PRO</span>
                    <span className="font-bold text-white block">PRO</span>
                    <span className="text-[10px] text-amber-500 block">Rp 99K</span>
                    <p className="text-[9px] text-slate-500 mt-1">WA & Stok Otomatis</p>
                  </div>
                </div>

                <div className="flex space-x-3">
                  <button
                    onClick={() => setOnboardingStep(3)}
                    className="flex-1 py-2 bg-[#1A1F2E] hover:bg-slate-800 text-white font-bold rounded-xl text-xs border border-white/5"
                  >
                    Kembali
                  </button>
                  <button
                    onClick={() => setOnboardingStep(5)}
                    className="flex-1 py-2 bg-amber-500 hover:bg-amber-600 text-[#0B0F19] font-bold rounded-xl text-xs active:translate-y-0.5 transition-transform"
                  >
                    Pilih Paket Default
                  </button>
                </div>
              </div>
            )}

            {/* Step 5: Selesai */}
            {onboardingStep === 5 && (
              <div className="space-y-4 text-center">
                <div className="inline-flex p-3 bg-amber-500/10 text-amber-500 rounded-full">
                  <CheckCircle2 size={32} />
                </div>
                <div className="space-y-1">
                  <h3 className="text-base font-bold text-white">Setup Selesai!</h3>
                  <p className="text-xs text-slate-400">Bisnis Anda "{onboardBizName}" siap melesat tinggi.</p>
                </div>
                
                <div className="p-4 bg-[#0B0F19] border border-white/5 rounded-xl text-left text-xs space-y-2 text-slate-300">
                  <div className="flex items-center space-x-2 text-emerald-500">
                    <CheckCircle2 size={14} />
                    <span>Profil UMKM terdaftar</span>
                  </div>
                  <div className="flex items-center space-x-2 text-emerald-500">
                    <CheckCircle2 size={14} />
                    <span>Pelanggan pertama terdaftar</span>
                  </div>
                  <div className="flex items-center space-x-2 text-emerald-500">
                    <CheckCircle2 size={14} />
                    <span>Katalog produk/jasa awal terbuat</span>
                  </div>
                </div>

                <button
                  onClick={() => {
                    localStorage.setItem(`onboard_done_${tenant?.tenant_id}`, "true");
                    setShowOnboarding(false);
                    toast.success("Selamat mencoba platform!");
                    window.location.reload();
                  }}
                  className="w-full py-3 bg-amber-500 hover:bg-amber-600 text-[#0B0F19] font-black rounded-xl text-xs active:translate-y-0.5 transition-transform"
                >
                  Mulai Gunakan Dashboard Aplikasi
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ==========================================
// 1. DASHBOARD TAB
// ==========================================
function DashboardTab({ currentUser, tenant }) {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchStats = useCallback(() => {
    axios.get(`${API}/dashboard/stats`)
      .then((res) => {
        setStats(res.data);
        setLoading(false);
      })
      .catch((err) => {
        toast.error("Gagal memuat statistik dashboard.");
      });
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  if (loading) {
    return <div className="text-slate-400 text-sm">Memuat data dasbor laporan...</div>;
  }

  // Format currency
  const formatIDR = (num) => {
    return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(num);
  };

  // Recharts Chart Setup
  const trendData = stats.trend_chart.map(item => ({
    name: item.date,
    revenue: item.revenue
  }));

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight">Ringkasan Operasional</h1>
          <p className="text-slate-400 text-sm">Selamat datang kembali, {currentUser?.name}. Berikut performa bisnis Anda.</p>
        </div>
        <button 
          data-testid="refresh-stats-btn"
          onClick={fetchStats}
          className="mt-4 md:mt-0 px-4 py-2 bg-[#131722] hover:bg-slate-800 border border-white/5 text-white text-xs font-bold rounded-xl flex items-center space-x-2 transition-colors active:translate-y-0.5"
        >
          <RefreshCw size={14} className="animate-spin-hover" />
          <span>Sinkronisasi Data</span>
        </button>
      </div>

      {/* Bento Grid Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-[#131722] border border-white/5 rounded-2xl p-6 relative overflow-hidden shadow-xl">
          <div className="absolute top-0 right-0 p-4 text-amber-500/10">
            <Coins size={48} />
          </div>
          <span className="text-xs text-slate-500 font-bold uppercase tracking-widest">Total Omset Penjualan</span>
          <h2 className="text-2xl font-black text-white mt-2" data-testid="stat-revenue">{formatIDR(stats.total_revenue)}</h2>
          <span className="text-[10px] text-slate-500 block mt-2">Akumulasi seluruh transaksi terbayar</span>
        </div>

        <div className="bg-[#131722] border border-white/5 rounded-2xl p-6 relative overflow-hidden shadow-xl">
          <div className="absolute top-0 right-0 p-4 text-blue-500/10">
            <Receipt size={48} />
          </div>
          <span className="text-xs text-slate-500 font-bold uppercase tracking-widest">Total Transaksi</span>
          <h2 className="text-2xl font-black text-white mt-2" data-testid="stat-sales">{stats.total_sales} <span className="text-xs font-normal text-slate-400">Order</span></h2>
          <span className="text-[10px] text-slate-500 block mt-2">Batas bulan ini: {tenant?.max_transactions_limit === -1 ? "Tanpa Batas" : tenant?.max_transactions_limit}</span>
        </div>

        <div className="bg-[#131722] border border-white/5 rounded-2xl p-6 relative overflow-hidden shadow-xl">
          <div className="absolute top-0 right-0 p-4 text-emerald-500/10">
            <Users size={48} />
          </div>
          <span className="text-xs text-slate-500 font-bold uppercase tracking-widest">Kasbon / Piutang</span>
          <h2 className="text-2xl font-black text-white mt-2" data-testid="stat-receivable">{formatIDR(stats.total_receivable)}</h2>
          <span className="text-[10px] text-slate-500 block mt-2">Dana yang belum dilunasi pelanggan</span>
        </div>

        <div className="bg-[#131722] border border-white/5 rounded-2xl p-6 relative overflow-hidden shadow-xl">
          <div className="absolute top-0 right-0 p-4 text-rose-500/10">
            <AlertTriangle size={48} />
          </div>
          <span className="text-xs text-slate-500 font-bold uppercase tracking-widest">Stok Menipis</span>
          <h2 className="text-2xl font-black text-rose-500 mt-2" data-testid="stat-low-stock">{stats.low_stock_count} <span className="text-xs font-normal text-slate-400">Produk</span></h2>
          <span className="text-[10px] text-slate-500 block mt-2">Stok di bawah batas minimum</span>
        </div>
      </div>

      {/* Charts & Top Products (Bento Style Layout) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue Trend Chart */}
        <div className="bg-[#131722] border border-white/5 rounded-2xl p-6 lg:col-span-2 shadow-xl space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-300">Tren Penjualan Mingguan</h3>
            <span className="text-xs bg-[#1A1F2E] text-amber-500 font-semibold px-2 py-1 rounded">Grafik Omset</span>
          </div>
          <div className="h-64 relative">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="name" stroke="#64748B" fontSize={11} />
                <YAxis stroke="#64748B" fontSize={11} />
                <Tooltip 
                  contentStyle={{ backgroundColor: "#131722", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px" }}
                  labelStyle={{ color: "#FFF" }}
                  itemStyle={{ color: "#F59E0B" }}
                />
                <Line type="monotone" dataKey="revenue" stroke="#F59E0B" strokeWidth={3} dot={{ fill: "#F59E0B", r: 4 }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top Selling Products */}
        <div className="bg-[#131722] border border-white/5 rounded-2xl p-6 shadow-xl space-y-4">
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-300">Produk / Jasa Terlaris</h3>
          <div className="space-y-3">
            {stats.top_products.length === 0 ? (
              <p className="text-xs text-slate-500">Belum ada transaksi terekam.</p>
            ) : (
              stats.top_products.map((p, idx) => (
                <div key={p.name} className="flex justify-between items-center p-3 bg-[#1A1F2E]/60 border border-white/5 rounded-xl">
                  <div>
                    <span className="text-xs font-bold text-slate-200 block">{p.name}</span>
                    <span className="text-[10px] text-slate-500">{idx + 1}. Produk Favorit</span>
                  </div>
                  <span className="text-xs bg-amber-500/10 text-amber-500 font-bold px-2 py-1 rounded text-right shrink-0">
                    {p.sales} Sold
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ==========================================
// 2. POS & KASIR TAB
// ==========================================
function POSTab({ currentUser, tenant }) {
  const [products, setProducts] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [cart, setCart] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [discount, setDiscount] = useState(0);
  const [tax, setTax] = useState(0);
  const [selectedCustomerId, setSelectedCustomerId] = useState("");
  const [amountPaid, setAmountPaid] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState("Cash");
  
  // Checkout Receipt Modal
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [createdTx, setCreatedTx] = useState(null);

  const fetchPOSData = useCallback(() => {
    axios.get(`${API}/products`)
      .then((res) => setProducts(res.data))
      .catch(() => toast.error("Gagal memuat produk."));
    axios.get(`${API}/customers`)
      .then((res) => setCustomers(res.data))
      .catch(() => {});
  }, []);

  useEffect(() => {
    fetchPOSData();
  }, [fetchPOSData]);

  const addToCart = (product) => {
    const existing = cart.find(item => item.product_id === product.product_id);
    if (existing) {
      if (tenant?.package !== "Gratis" && product.stock <= existing.quantity) {
        toast.warning("Stok produk tidak mencukupi!");
        return;
      }
      setCart(cart.map(item => 
        item.product_id === product.product_id 
          ? { ...item, quantity: item.quantity + 1, subtotal: (item.quantity + 1) * item.price }
          : item
      ));
    } else {
      if (tenant?.package !== "Gratis" && product.stock <= 0) {
        toast.warning("Stok produk habis!");
        return;
      }
      setCart([...cart, {
        product_id: product.product_id,
        name: product.name,
        price: product.price,
        quantity: 1,
        subtotal: product.price
      }]);
    }
  };

  const adjustQty = (productId, change) => {
    const existing = cart.find(item => item.product_id === productId);
    if (!existing) return;
    const newQty = existing.quantity + change;
    
    if (newQty <= 0) {
      setCart(cart.filter(item => item.product_id !== productId));
    } else {
      const prod = products.find(p => p.product_id === productId);
      if (tenant?.package !== "Gratis" && change > 0 && prod && prod.stock <= existing.quantity) {
        toast.warning("Stok produk tidak mencukupi!");
        return;
      }
      setCart(cart.map(item => 
        item.product_id === productId 
          ? { ...item, quantity: newQty, subtotal: newQty * item.price }
          : item
      ));
    }
  };

  const removeFromCart = (productId) => {
    setCart(cart.filter(item => item.product_id !== productId));
  };

  // Calculations
  const subtotal = cart.reduce((acc, item) => acc + item.subtotal, 0);
  const total = Math.max(0, subtotal - discount + tax);

  const handleCheckout = (e) => {
    e.preventDefault();
    if (cart.length === 0) {
      toast.warning("Keranjang belanja kosong!");
      return;
    }

    const payload = {
      customer_id: selectedCustomerId || null,
      items: cart,
      discount: parseFloat(discount) || 0,
      tax: parseFloat(tax) || 0,
      amount_paid: parseFloat(amountPaid) || 0,
      payment_method: paymentMethod
    };

    toast.loading("Memproses pesanan...", { id: "checkout" });
    axios.post(`${API}/transactions`, payload)
      .then((res) => {
        setCreatedTx(res.data);
        toast.success("Checkout transaksi sukses!", { id: "checkout" });
        setShowReceiptModal(true);
        // Clear forms
        setCart([]);
        setDiscount(0);
        setTax(0);
        setAmountPaid(0);
        setSelectedCustomerId("");
        fetchPOSData(); // Refetch products stock
      })
      .catch((err) => {
        toast.error("Checkout gagal: " + (err.response?.data?.detail || err.message), { id: "checkout" });
      });
  };

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-white tracking-tight">Kasir & Point of Sale</h1>
        <p className="text-slate-400 text-sm">Pilih produk, sesuaikan kuantitas, dan rekam pembayaran secara langsung.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Product Catalog Column */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex bg-[#131722] border border-white/5 rounded-2xl px-4 py-3 items-center space-x-3">
            <Search className="text-slate-500" size={20} />
            <input 
              data-testid="pos-product-search-input"
              type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari produk atau jasa operasional..."
              className="bg-transparent border-0 text-white placeholder-slate-500 text-sm focus:outline-none w-full"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {filteredProducts.length === 0 ? (
              <p className="text-slate-500 text-xs text-center p-8 col-span-2">Tidak ada produk ditemukan.</p>
            ) : (
              filteredProducts.map((p) => {
                const isLowStock = p.stock <= p.min_stock;
                return (
                  <button
                    key={p.product_id}
                    data-testid={`pos-add-product-btn-${p.product_id}`}
                    onClick={() => addToCart(p)}
                    className="p-5 bg-[#131722] border border-white/5 rounded-2xl hover:border-amber-500/50 hover:bg-[#1A1F2E] hover:-translate-y-0.5 transition-transform duration-200 text-left space-y-3 relative group"
                  >
                    <div className="flex justify-between items-start">
                      <span className="text-xs bg-amber-500/10 text-amber-500 font-bold px-2 py-0.5 rounded uppercase">
                        {p.unit}
                      </span>
                      {tenant?.package !== "Gratis" && (
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded ${
                          isLowStock ? "bg-rose-500/15 text-rose-500" : "bg-slate-800 text-slate-400"
                        }`}>
                          Stok: {p.stock}
                        </span>
                      )}
                    </div>
                    <div>
                      <h3 className="font-bold text-white text-sm group-hover:text-amber-500 transition-colors">{p.name}</h3>
                      <p className="text-sm font-black text-slate-300 mt-1">Rp {p.price.toLocaleString("id-ID")}</p>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* POS Cart Sidebar Column */}
        <div className="bg-[#131722] border border-white/5 rounded-2xl p-6 shadow-xl space-y-4 sticky top-6">
          <div className="flex justify-between items-center pb-3 border-b border-white/5">
            <h3 className="font-bold text-white text-sm uppercase tracking-wider">Keranjang</h3>
            <span className="text-xs text-amber-500 font-bold">{cart.length} Item</span>
          </div>

          {/* Cart Items List */}
          <div className="max-h-60 overflow-y-auto space-y-3">
            {cart.length === 0 ? (
              <p className="text-xs text-slate-500 text-center py-8">Keranjang belanja kosong.</p>
            ) : (
              cart.map((item) => (
                <div key={item.product_id} className="flex justify-between items-center p-3 bg-[#1A1F2E]/60 border border-white/5 rounded-xl">
                  <div className="truncate pr-2">
                    <span className="text-xs font-bold text-slate-200 block truncate">{item.name}</span>
                    <span className="text-[10px] text-slate-500">Rp {item.price.toLocaleString("id-ID")}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button 
                      data-testid={`pos-qty-minus-${item.product_id}`}
                      onClick={() => adjustQty(item.product_id, -1)}
                      className="p-1 bg-[#131722] hover:bg-slate-700 text-slate-300 rounded"
                    >
                      <Minus size={12} />
                    </button>
                    <span className="text-xs font-bold text-white w-4 text-center" data-testid={`pos-qty-val-${item.product_id}`}>
                      {item.quantity}
                    </span>
                    <button 
                      data-testid={`pos-qty-plus-${item.product_id}`}
                      onClick={() => adjustQty(item.product_id, 1)}
                      className="p-1 bg-[#131722] hover:bg-slate-700 text-slate-300 rounded"
                    >
                      <Plus size={12} />
                    </button>
                    <button 
                      onClick={() => removeFromCart(item.product_id)}
                      className="p-1 text-red-500 hover:bg-red-500/10 rounded"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          <form onSubmit={handleCheckout} className="space-y-4 pt-3 border-t border-white/5">
            {/* Customer Selector */}
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Pelanggan</label>
              <select 
                data-testid="pos-customer-select"
                value={selectedCustomerId} onChange={(e) => setSelectedCustomerId(e.target.value)}
                className="w-full px-3 py-2 bg-[#0B0F19] border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-amber-500 text-xs text-slate-300"
              >
                <option value="">Walk-in Customer (Umum)</option>
                {customers.map(c => (
                  <option key={c.customer_id} value={c.customer_id}>{c.name} ({c.phone})</option>
                ))}
              </select>
            </div>

            {/* Discount & Tax Row */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Diskon (Rp)</label>
                <input 
                  data-testid="pos-discount-input"
                  type="number" value={discount} onChange={(e) => setDiscount(Math.max(0, parseFloat(e.target.value) || 0))}
                  className="w-full px-3 py-2 bg-[#0B0F19] border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-amber-500 text-xs"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Pajak (Rp)</label>
                <input 
                  data-testid="pos-tax-input"
                  type="number" value={tax} onChange={(e) => setTax(Math.max(0, parseFloat(e.target.value) || 0))}
                  className="w-full px-3 py-2 bg-[#0B0F19] border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-amber-500 text-xs"
                />
              </div>
            </div>

            {/* Payment Method Selector */}
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Metode Bayar</label>
              <select 
                data-testid="pos-payment-method-select"
                value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}
                className="w-full px-3 py-2 bg-[#0B0F19] border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-amber-500 text-xs text-slate-300"
              >
                <option value="Cash">Cash (Tunai)</option>
                <option value="QRIS">QRIS</option>
                <option value="Transfer">Bank Transfer</option>
                <option value="Kasbon">Kasbon / Hutang</option>
              </select>
            </div>

            {/* Cash Paid Amount */}
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Jumlah Bayar (Rp)</label>
              <input 
                data-testid="pos-amount-paid-input"
                type="number" value={amountPaid} onChange={(e) => setAmountPaid(Math.max(0, parseFloat(e.target.value) || 0))}
                className="w-full px-3 py-2 bg-[#0B0F19] border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-amber-500 text-xs"
              />
            </div>

            {/* Financial Summary */}
            <div className="space-y-1.5 pt-3 border-t border-white/5 text-xs text-slate-400">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span>Rp {subtotal.toLocaleString("id-ID")}</span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between text-rose-400">
                  <span>Diskon</span>
                  <span>- Rp {discount.toLocaleString("id-ID")}</span>
                </div>
              )}
              {tax > 0 && (
                <div className="flex justify-between text-slate-300">
                  <span>Pajak</span>
                  <span>+ Rp {tax.toLocaleString("id-ID")}</span>
                </div>
              )}
              <div className="flex justify-between text-white font-bold text-sm pt-1">
                <span>Total Belanja</span>
                <span data-testid="pos-total-val">Rp {total.toLocaleString("id-ID")}</span>
              </div>
              <div className="flex justify-between text-amber-500 font-semibold">
                <span>Kembalian</span>
                <span>Rp {Math.max(0, amountPaid - total).toLocaleString("id-ID")}</span>
              </div>
            </div>

            <button
              data-testid="pos-submit-btn"
              type="submit"
              className="w-full py-3 bg-amber-500 hover:bg-amber-600 active:translate-y-0.5 transform transition-transform text-[#0B0F19] font-bold rounded-xl text-center shadow-lg text-xs"
            >
              Proses Pembayaran (Checkout)
            </button>
          </form>
        </div>
      </div>

      {/* GORGEOUS RECEIPT MODAL */}
      {showReceiptModal && createdTx && (
        <div className="fixed inset-0 bg-[#0B0F19]/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-[#131722] border border-white/10 rounded-2xl w-full max-w-sm p-6 space-y-6 shadow-2xl relative">
            <button 
              onClick={() => setShowReceiptModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white"
            >
              ✕
            </button>

            {/* Receipt Content Layout */}
            <div className="text-center space-y-2">
              <div className="inline-flex p-3 bg-amber-500/10 text-amber-500 rounded-full">
                <CheckCircle2 size={32} />
              </div>
              <h2 className="text-lg font-black text-white">Transaksi Berhasil!</h2>
              <p className="text-xs text-slate-400">Notifikasi WA & Struk telah dikirimkan / disimulasikan</p>
            </div>

            {/* Printable Receipt Frame */}
            <div className="p-4 bg-[#0B0F19] border border-dashed border-white/10 rounded-xl space-y-4 text-xs font-mono text-slate-300" id="receipt-print">
              <div className="text-center border-b border-dashed border-white/10 pb-3">
                <span className="font-bold text-sm text-white block">{tenant?.name}</span>
                <span className="text-[10px] text-slate-500 block">Operasional {tenant?.type}</span>
                <span className="text-[10px] text-slate-500 block">No: {createdTx.invoice_no}</span>
              </div>

              <div className="space-y-2 border-b border-dashed border-white/10 pb-3">
                {createdTx.items.map((item) => (
                  <div key={item.product_id} className="flex justify-between text-[11px]">
                    <span>{item.name} (x{item.quantity})</span>
                    <span>Rp {(item.price * item.quantity).toLocaleString("id-ID")}</span>
                  </div>
                ))}
              </div>

              <div className="space-y-1 text-[11px]">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span>Rp {createdTx.subtotal.toLocaleString("id-ID")}</span>
                </div>
                {createdTx.discount > 0 && (
                  <div className="flex justify-between text-rose-400">
                    <span>Diskon</span>
                    <span>- Rp {createdTx.discount.toLocaleString("id-ID")}</span>
                  </div>
                )}
                <div className="flex justify-between text-white font-bold">
                  <span>TOTAL</span>
                  <span>Rp {createdTx.total.toLocaleString("id-ID")}</span>
                </div>
                <div className="flex justify-between">
                  <span>Jumlah Bayar</span>
                  <span>Rp {createdTx.amount_paid.toLocaleString("id-ID")}</span>
                </div>
                <div className="flex justify-between text-amber-500">
                  <span>Status</span>
                  <span>{createdTx.payment_status}</span>
                </div>
              </div>

              <div className="text-center pt-2 text-[9px] text-slate-500 border-t border-dashed border-white/10">
                Terima kasih atas kunjungan Anda!
              </div>
            </div>

            {/* Simulation Status Feed */}
            {tenant?.package === "Pro" && (
              <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-xl text-xs space-y-1">
                <div className="flex items-center space-x-1 text-blue-400 font-bold">
                  <MessageSquare size={14} />
                  <span>Notifikasi WhatsApp Sukses</span>
                </div>
                <p className="text-[10px] text-slate-400">Template struk otomatis dikirimkan ke nomor WhatsApp Pelanggan.</p>
              </div>
            )}

            <div className="flex space-x-3">
              <button
                onClick={() => {
                  window.print();
                }}
                className="flex-1 py-2 bg-[#1A1F2E] hover:bg-slate-800 text-white font-bold rounded-xl border border-white/5 text-xs flex items-center justify-center space-x-2"
              >
                <Printer size={16} />
                <span>Cetak Struk</span>
              </button>
              <button
                onClick={() => setShowReceiptModal(false)}
                className="flex-1 py-2 bg-amber-500 hover:bg-amber-600 text-[#0B0F19] font-bold rounded-xl text-xs text-center"
              >
                Selesai
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ==========================================
// 3. DAFTAR TRANSAKSI & HUTANG TAB
// ==========================================
function TransactionsTab({ currentUser, tenant }) {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [paymentAmount, setPaymentAmount] = useState(0);
  const [selectedTx, setSelectedTx] = useState(null);
  const [showPayModal, setShowPayModal] = useState(false);

  const fetchTransactions = useCallback(() => {
    axios.get(`${API}/transactions`)
      .then((res) => {
        setTransactions(res.data);
        setLoading(false);
      })
      .catch(() => toast.error("Gagal memuat transaksi."));
  }, []);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  const handleRepayment = (e) => {
    e.preventDefault();
    if (paymentAmount <= 0) {
      toast.warning("Masukkan jumlah cicilan pembayaran!");
      return;
    }

    axios.post(`${API}/transactions/${selectedTx.transaction_id}/payment`, { amount: parseFloat(paymentAmount) })
      .then((res) => {
        toast.success("Berhasil merekam cicilan pembayaran!");
        setShowPayModal(false);
        setPaymentAmount(0);
        fetchTransactions();
      })
      .catch((err) => {
        toast.error("Gagal bayar: " + (err.response?.data?.detail || err.message));
      });
  };

  if (loading) {
    return <div className="text-slate-400 text-sm">Memuat daftar transaksi...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-white tracking-tight">Daftar Transaksi & Kasbon</h1>
        <p className="text-slate-400 text-sm">Kelola seluruh invoice operasional, saring status lunas/kasbon, dan rekam cicilan hutang.</p>
      </div>

      <div className="bg-[#131722] border border-white/5 rounded-2xl overflow-hidden shadow-xl">
        <div className="p-6 border-b border-white/5">
          <h3 className="font-bold text-white text-sm uppercase tracking-wider">Histori Invoice</h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-white/5 bg-[#1A1F2E]/30 text-slate-400 uppercase tracking-widest">
                <th className="p-4 font-bold">No Invoice</th>
                <th className="p-4 font-bold">Pelanggan</th>
                <th className="p-4 font-bold">Total Penjualan</th>
                <th className="p-4 font-bold">Telah Dibayar</th>
                <th className="p-4 font-bold">Status</th>
                <th className="p-4 font-bold">Metode</th>
                <th className="p-4 font-bold text-right">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {transactions.length === 0 ? (
                <tr>
                  <td colSpan="7" className="p-6 text-slate-500 text-center">Belum ada transaksi terekam.</td>
                </tr>
              ) : (
                transactions.map((tx) => {
                  const remainingDebt = tx.total - tx.amount_paid;
                  return (
                    <tr key={tx.transaction_id} className="border-b border-white/5 hover:bg-[#1A1F2E]/30 transition-colors">
                      <td className="p-4 font-mono font-bold text-white" data-testid={`tx-invoice-no-${tx.transaction_id}`}>{tx.invoice_no}</td>
                      <td className="p-4 text-slate-300">{tx.customer_name}</td>
                      <td className="p-4 text-slate-200">Rp {tx.total.toLocaleString("id-ID")}</td>
                      <td className="p-4 text-slate-300">Rp {tx.amount_paid.toLocaleString("id-ID")}</td>
                      <td className="p-4">
                        <span className={`px-2 py-0.5 rounded font-black uppercase text-[9px] ${
                          tx.payment_status === "Lunas" 
                            ? "bg-emerald-500/15 text-emerald-500"
                            : tx.payment_status === "Partial"
                            ? "bg-amber-500/15 text-amber-500"
                            : "bg-red-500/15 text-red-500"
                        }`} data-testid={`tx-payment-status-${tx.transaction_id}`}>
                          {tx.payment_status}
                        </span>
                      </td>
                      <td className="p-4 text-slate-400">{tx.payment_method}</td>
                      <td className="p-4 text-right">
                        {remainingDebt > 0 && (
                          <button
                            data-testid={`tx-pay-debt-btn-${tx.transaction_id}`}
                            onClick={() => {
                              setSelectedTx(tx);
                              setShowPayModal(true);
                            }}
                            className="px-3 py-1 bg-amber-500 hover:bg-amber-600 text-[#0B0F19] text-[10px] font-bold rounded-lg"
                          >
                            Repayment (Bayar)
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* REPAYMENT MODAL */}
      {showPayModal && selectedTx && (
        <div className="fixed inset-0 bg-[#0B0F19]/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-[#131722] border border-white/10 rounded-2xl w-full max-w-sm p-6 space-y-4 shadow-2xl relative">
            <button 
              onClick={() => setShowPayModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white"
            >
              ✕
            </button>

            <h2 className="text-base font-bold text-white tracking-tight">Rekam Pembayaran Cicilan / Pelunasan</h2>
            <p className="text-xs text-slate-400 font-mono">Invoice: {selectedTx.invoice_no}</p>

            <div className="space-y-1.5 text-xs text-slate-300 p-3 bg-[#0B0F19] rounded-xl border border-white/5">
              <div className="flex justify-between">
                <span>Total Tagihan:</span>
                <span>Rp {selectedTx.total.toLocaleString("id-ID")}</span>
              </div>
              <div className="flex justify-between">
                <span>Sudah Dibayar:</span>
                <span>Rp {selectedTx.amount_paid.toLocaleString("id-ID")}</span>
              </div>
              <div className="flex justify-between text-red-400 font-bold">
                <span>Sisa Hutang / Piutang:</span>
                <span>Rp {(selectedTx.total - selectedTx.amount_paid).toLocaleString("id-ID")}</span>
              </div>
            </div>

            <form onSubmit={handleRepayment} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Jumlah Bayar Tambahan (Rp)</label>
                <input 
                  data-testid="repayment-amount-input"
                  type="number" required value={paymentAmount} onChange={(e) => setPaymentAmount(Math.max(0, parseFloat(e.target.value) || 0))}
                  placeholder="Masukkan nominal bayar"
                  className="w-full px-3 py-2 bg-[#0B0F19] border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-amber-500 text-xs"
                />
              </div>

              <button
                data-testid="repayment-submit-btn"
                type="submit"
                className="w-full py-2.5 bg-amber-500 hover:bg-amber-600 text-[#0B0F19] font-bold rounded-xl text-xs text-center"
              >
                Konfirmasi Pelunasan
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// ==========================================
// 4. STOK & PRODUK TAB
// ==========================================
function ProductsTab({ currentUser, tenant }) {
  const [products, setProducts] = useState([]);
  const [mutations, setMutations] = useState([]);
  const [loading, setLoading] = useState(true);

  // Form Fields
  const [name, setName] = useState("");
  const [price, setPrice] = useState(0);
  const [stock, setStock] = useState(0);
  const [minStock, setMinStock] = useState(5);
  const [unit, setUnit] = useState("pcs");
  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState("");
  const [showForm, setShowForm] = useState(false);

  const fetchProducts = useCallback(() => {
    axios.get(`${API}/products`)
      .then((res) => setProducts(res.data))
      .catch(() => toast.error("Gagal memuat produk."));
    axios.get(`${API}/products/mutations`)
      .then((res) => {
        setMutations(res.data);
        setLoading(false);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const handleProductSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.warning("Masukkan nama produk!");
      return;
    }

    const payload = {
      product_id: isEditing ? editId : "",
      tenant_id: "",
      name,
      price: parseFloat(price) || 0,
      stock: parseInt(stock) || 0,
      min_stock: parseInt(minStock) || 0,
      unit
    };

    const action = isEditing 
      ? axios.put(`${API}/products/${editId}`, payload)
      : axios.post(`${API}/products`, payload);

    toast.loading(isEditing ? "Memperbarui produk..." : "Menambah produk...", { id: "product-save" });
    action.then(() => {
      toast.success(isEditing ? "Produk diperbarui!" : "Produk ditambahkan!", { id: "product-save" });
      setShowForm(false);
      setIsEditing(false);
      setEditId("");
      setName("");
      setPrice(0);
      setStock(0);
      setMinStock(5);
      setUnit("pcs");
      fetchProducts();
    })
    .catch((err) => {
      toast.error("Gagal memproses produk: " + (err.response?.data?.detail || err.message), { id: "product-save" });
    });
  };

  const startEdit = (p) => {
    setIsEditing(true);
    setEditId(p.product_id);
    setName(p.name);
    setPrice(p.price);
    setStock(p.stock);
    setMinStock(p.min_stock);
    setUnit(p.unit);
    setShowForm(true);
  };

  const handleDelete = (productId) => {
    if (!window.confirm("Apakah Anda yakin ingin menghapus produk ini?")) return;
    axios.delete(`${API}/products/${productId}`)
      .then(() => {
        toast.success("Produk berhasil dihapus");
        fetchProducts();
      })
      .catch((err) => toast.error("Gagal menghapus produk"));
  };

  if (loading) {
    return <div className="text-slate-400 text-sm">Memuat data produk & pergerakan stok...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight">Katalog Produk & Manajemen Stok</h1>
          <p className="text-slate-400 text-sm">Tambahkan produk/jasa, pantau mutasi otomatis, serta amankan stok dari kehabisan.</p>
        </div>
        <button
          data-testid="add-product-btn"
          onClick={() => {
            setIsEditing(false);
            setName("");
            setPrice(0);
            setStock(0);
            setMinStock(5);
            setUnit("pcs");
            setShowForm(true);
          }}
          className="mt-4 sm:mt-0 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-[#0B0F19] text-xs font-bold rounded-xl flex items-center space-x-2 transition-colors active:translate-y-0.5"
        >
          <Plus size={16} />
          <span>Tambah Produk / Jasa</span>
        </button>
      </div>

      {/* PRODUCTS FORM MODAL */}
      {showForm && (
        <div className="fixed inset-0 bg-[#0B0F19]/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-[#131722] border border-white/10 rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl relative">
            <button 
              onClick={() => setShowForm(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white"
            >
              ✕
            </button>

            <h2 className="text-base font-bold text-white tracking-tight" data-testid="product-form-title">
              {isEditing ? "Edit Detail Produk" : "Registrasikan Produk / Jasa Baru"}
            </h2>

            <form onSubmit={handleProductSubmit} className="space-y-4 text-xs text-slate-300">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Nama Produk / Jasa</label>
                <input 
                  data-testid="product-name-input"
                  type="text" required value={name} onChange={(e) => setName(e.target.value)}
                  placeholder="Contoh: Jasa Cuci Karpet Bulu"
                  className="w-full px-3 py-2 bg-[#0B0F19] border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Harga Jual (Rp)</label>
                  <input 
                    data-testid="product-price-input"
                    type="number" required value={price} onChange={(e) => setPrice(parseFloat(e.target.value) || 0)}
                    placeholder="Contoh: 15000"
                    className="w-full px-3 py-2 bg-[#0B0F19] border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Satuan</label>
                  <select 
                    data-testid="product-unit-select"
                    value={unit} onChange={(e) => setUnit(e.target.value)}
                    className="w-full px-3 py-2 bg-[#0B0F19] border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                  >
                    <option value="pcs">pcs (Butir/Unit)</option>
                    <option value="kg">kg (Kilogram)</option>
                    <option value="ltr">ltr (Liter)</option>
                    <option value="jasa">jasa (Layanan)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Stok Awal</label>
                  <input 
                    data-testid="product-stock-input"
                    type="number" required value={stock} onChange={(e) => setStock(parseInt(e.target.value) || 0)}
                    placeholder="Contoh: 100"
                    className="w-full px-3 py-2 bg-[#0B0F19] border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Minimum Stok Pengingat</label>
                  <input 
                    data-testid="product-min-stock-input"
                    type="number" required value={minStock} onChange={(e) => setMinStock(parseInt(e.target.value) || 0)}
                    placeholder="Contoh: 5"
                    className="w-full px-3 py-2 bg-[#0B0F19] border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>

              <button
                data-testid="product-submit-btn"
                type="submit"
                className="w-full py-2.5 bg-amber-500 hover:bg-amber-600 text-[#0B0F19] font-bold rounded-xl text-center"
              >
                {isEditing ? "Perbarui Produk" : "Simpan Produk"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Catalog Table */}
      <div className="bg-[#131722] border border-white/5 rounded-2xl overflow-hidden shadow-xl">
        <div className="p-6 border-b border-white/5">
          <h3 className="font-bold text-white text-sm uppercase tracking-wider">Katalog Produk</h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-white/5 bg-[#1A1F2E]/30 text-slate-400 uppercase tracking-widest">
                <th className="p-4 font-bold">Nama Produk</th>
                <th className="p-4 font-bold">Harga Jual</th>
                <th className="p-4 font-bold">Stok Saat Ini</th>
                <th className="p-4 font-bold">Minimum Stok</th>
                <th className="p-4 font-bold">Satuan</th>
                <th className="p-4 font-bold text-right">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {products.length === 0 ? (
                <tr>
                  <td colSpan="6" className="p-6 text-slate-500 text-center">Belum ada produk terekam.</td>
                </tr>
              ) : (
                products.map((p) => {
                  const isLow = p.stock <= p.min_stock;
                  return (
                    <tr key={p.product_id} className="border-b border-white/5 hover:bg-[#1A1F2E]/30 transition-colors">
                      <td className="p-4 font-bold text-slate-200" data-testid={`product-name-${p.product_id}`}>{p.name}</td>
                      <td className="p-4 text-slate-300">Rp {p.price.toLocaleString("id-ID")}</td>
                      <td className="p-4">
                        <span className={`px-2 py-0.5 rounded font-bold ${
                          isLow ? "bg-rose-500/15 text-rose-500" : "bg-emerald-500/15 text-emerald-500"
                        }`} data-testid={`product-stock-badge-${p.product_id}`}>
                          {p.stock}
                        </span>
                      </td>
                      <td className="p-4 text-slate-400">{p.min_stock}</td>
                      <td className="p-4 text-slate-400">{p.unit}</td>
                      <td className="p-4 text-right space-x-2">
                        <button
                          data-testid={`product-edit-btn-${p.product_id}`}
                          onClick={() => startEdit(p)}
                          className="px-2.5 py-1 bg-[#1A1F2E] hover:bg-slate-700 text-slate-300 rounded font-bold"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(p.product_id)}
                          className="px-2.5 py-1 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded font-bold"
                        >
                          Hapus
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Stock Mutation Log (Pro Option) */}
      <div className="bg-[#131722] border border-white/5 rounded-2xl p-6 shadow-xl space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-300">Pergerakan & Mutasi Stok</h3>
          <span className="text-[10px] bg-amber-500/10 text-amber-500 font-bold px-2 py-1 rounded">Audit Logs Persediaan</span>
        </div>

        <div className="space-y-2 max-h-60 overflow-y-auto">
          {mutations.length === 0 ? (
            <p className="text-xs text-slate-500 text-center py-4">Belum ada aktivitas mutasi terekam.</p>
          ) : (
            mutations.map((m) => (
              <div key={m.mutation_id} className="flex justify-between items-center p-3 bg-[#1A1F2E]/60 border border-white/5 rounded-xl text-xs">
                <div className="truncate pr-2">
                  <span className="font-bold text-slate-300 block">{m.product_name}</span>
                  <p className="text-[10px] text-slate-500">{m.notes}</p>
                </div>
                <div className="flex items-center space-x-3 shrink-0">
                  <span className={`px-2 py-0.5 rounded font-black text-[10px] uppercase ${
                    m.type === "sale" 
                      ? "bg-rose-500/10 text-rose-400"
                      : m.type === "initial"
                      ? "bg-emerald-500/10 text-emerald-400"
                      : "bg-blue-500/10 text-blue-400"
                  }`}>
                    {m.type}
                  </span>
                  <span className={`font-black ${m.qty_change > 0 ? "text-emerald-500" : "text-rose-500"}`}>
                    {m.qty_change > 0 ? `+${m.qty_change}` : m.qty_change}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

// ==========================================
// 5. MANAJEMEN PELANGGAN TAB
// ==========================================
function CustomersTab({ currentUser, tenant }) {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Form
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState("");
  const [showForm, setShowForm] = useState(false);

  const fetchCustomers = useCallback(() => {
    axios.get(`${API}/customers`)
      .then((res) => {
        setCustomers(res.data);
        setLoading(false);
      })
      .catch(() => toast.error("Gagal memuat pelanggan."));
  }, []);

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  const handleCustomerSubmit = (e) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim()) {
      toast.warning("Mohon isi nama dan nomor telepon!");
      return;
    }

    const payload = {
      customer_id: isEditing ? editId : "",
      tenant_id: "",
      name,
      phone,
      address
    };

    const action = isEditing
      ? axios.put(`${API}/customers/${editId}`, payload)
      : axios.post(`${API}/customers`, payload);

    toast.loading(isEditing ? "Memperbarui pelanggan..." : "Mendaftarkan pelanggan...", { id: "cust-save" });
    action.then(() => {
      toast.success(isEditing ? "Pelanggan diperbarui!" : "Pelanggan berhasil disimpan!", { id: "cust-save" });
      setShowForm(false);
      setIsEditing(false);
      setEditId("");
      setName("");
      setPhone("");
      setAddress("");
      fetchCustomers();
    })
    .catch((err) => {
      toast.error("Gagal mendaftarkan pelanggan: " + (err.response?.data?.detail || err.message), { id: "cust-save" });
    });
  };

  const startEdit = (c) => {
    setIsEditing(true);
    setEditId(c.customer_id);
    setName(c.name);
    setPhone(c.phone);
    setAddress(c.address);
    setShowForm(true);
  };

  const handleDelete = (customerId) => {
    if (!window.confirm("Apakah Anda yakin ingin menghapus pelanggan ini?")) return;
    axios.delete(`${API}/customers/${customerId}`)
      .then(() => {
        toast.success("Pelanggan berhasil dihapus");
        fetchCustomers();
      })
      .catch(() => toast.error("Gagal menghapus pelanggan"));
  };

  if (loading) {
    return <div className="text-slate-400 text-sm">Memuat data pelanggan...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight">Manajemen Pelanggan</h1>
          <p className="text-slate-400 text-sm">Daftarkan basis data pelanggan untuk mengirim notifikasi tagihan atau struk otomatis.</p>
        </div>
        <button
          data-testid="add-customer-btn"
          onClick={() => {
            setIsEditing(false);
            setName("");
            setPhone("");
            setAddress("");
            setShowForm(true);
          }}
          className="mt-4 sm:mt-0 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-[#0B0F19] text-xs font-bold rounded-xl flex items-center space-x-2 transition-colors active:translate-y-0.5"
        >
          <Plus size={16} />
          <span>Daftarkan Pelanggan Baru</span>
        </button>
      </div>

      {/* CUSTOMERS FORM MODAL */}
      {showForm && (
        <div className="fixed inset-0 bg-[#0B0F19]/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-[#131722] border border-white/10 rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl relative">
            <button 
              onClick={() => setShowForm(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white"
            >
              ✕
            </button>

            <h2 className="text-base font-bold text-white tracking-tight" data-testid="customer-form-title">
              {isEditing ? "Edit Data Pelanggan" : "Registrasikan Pelanggan Baru"}
            </h2>

            <form onSubmit={handleCustomerSubmit} className="space-y-4 text-xs text-slate-300">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Nama Lengkap</label>
                <input 
                  data-testid="customer-name-input"
                  type="text" required value={name} onChange={(e) => setName(e.target.value)}
                  placeholder="Contoh: Budi Santoso"
                  className="w-full px-3 py-2 bg-[#0B0F19] border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">No WhatsApp / Telepon</label>
                <input 
                  data-testid="customer-phone-input"
                  type="text" required value={phone} onChange={(e) => setPhone(e.target.value)}
                  placeholder="Contoh: 08123456789"
                  className="w-full px-3 py-2 bg-[#0B0F19] border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Alamat Domisili</label>
                <textarea 
                  data-testid="customer-address-input"
                  value={address} onChange={(e) => setAddress(e.target.value)}
                  placeholder="Alamat lengkap pelanggan"
                  className="w-full px-3 py-2 bg-[#0B0F19] border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-amber-500 h-20"
                />
              </div>

              <button
                data-testid="customer-submit-btn"
                type="submit"
                className="w-full py-2.5 bg-amber-500 hover:bg-amber-600 text-[#0B0F19] font-bold rounded-xl text-center"
              >
                {isEditing ? "Perbarui Pelanggan" : "Simpan Pelanggan"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Customers Table */}
      <div className="bg-[#131722] border border-white/5 rounded-2xl overflow-hidden shadow-xl">
        <div className="p-6 border-b border-white/5">
          <h3 className="font-bold text-white text-sm uppercase tracking-wider">Basis Data Pelanggan</h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-white/5 bg-[#1A1F2E]/30 text-slate-400 uppercase tracking-widest">
                <th className="p-4 font-bold">Nama Lengkap</th>
                <th className="p-4 font-bold">No Telepon</th>
                <th className="p-4 font-bold">Alamat</th>
                <th className="p-4 font-bold text-right">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {customers.length === 0 ? (
                <tr>
                  <td colSpan="4" className="p-6 text-slate-500 text-center">Belum ada pelanggan terdaftar.</td>
                </tr>
              ) : (
                customers.map((c) => (
                  <tr key={c.customer_id} className="border-b border-white/5 hover:bg-[#1A1F2E]/30 transition-colors">
                    <td className="p-4 font-bold text-slate-200" data-testid={`customer-name-${c.customer_id}`}>{c.name}</td>
                    <td className="p-4 text-slate-300">{c.phone}</td>
                    <td className="p-4 text-slate-400 max-w-xs truncate">{c.address || "-"}</td>
                    <td className="p-4 text-right space-x-2">
                      <button
                        data-testid={`customer-edit-btn-${c.customer_id}`}
                        onClick={() => startEdit(c)}
                        className="px-2.5 py-1 bg-[#1A1F2E] hover:bg-slate-700 text-slate-300 rounded font-bold"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(c.customer_id)}
                        className="px-2.5 py-1 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded font-bold"
                      >
                        Hapus
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ==========================================
// 6. WHATSAPP LOGS TAB (Pro Feature)
// ==========================================
function WhatsAppTab({ currentUser, tenant }) {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get(`${API}/whatsapp/logs`)
      .then((res) => {
        setLogs(res.data);
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      });
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight">Konsol Notifikasi WhatsApp</h1>
          <p className="text-slate-400 text-sm">Pantau histori dispatch notifikasi, invoice tagihan, struk, dan status simulasinya.</p>
        </div>
        <span className={`px-3 py-1.5 rounded-full text-xs font-black uppercase tracking-wider ${
          tenant?.package === "Pro" 
            ? "bg-amber-500/10 text-amber-500 border border-amber-500/20" 
            : "bg-slate-800 text-slate-500"
        }`}>
          Status Gating: {tenant?.package === "Pro" ? "Aktif" : "Non-aktif (Gratis/Basic)"}
        </span>
      </div>

      {tenant?.package !== "Pro" ? (
        <div className="bg-[#131722] border border-white/5 rounded-2xl p-8 text-center space-y-4 max-w-xl mx-auto shadow-2xl">
          <div className="inline-flex p-4 bg-amber-500/10 text-amber-500 rounded-full">
            <MessageSquare size={48} />
          </div>
          <h2 className="text-lg font-bold text-white">Upgrade ke Paket Pro untuk WhatsApp Otomatis</h2>
          <p className="text-slate-400 text-xs leading-relaxed">
            Kirim invoice tagihan, struk kasir, hingga pengingat kasbon jatuh tempo secara real-time langsung ke nomor pelanggan Anda. Sangat efisien meningkatkan retensi pelanggan.
          </p>
          <div className="pt-2">
            <span className="text-xs text-slate-500 block">Biaya terjangkau Rp 150.000/bulan</span>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="bg-[#131722] border border-white/5 rounded-2xl p-6 shadow-xl space-y-4">
            <div className="flex justify-between items-center pb-3 border-b border-white/5">
              <h3 className="font-bold text-white text-sm uppercase tracking-wider">Simulasi WhatsApp Console</h3>
              <span className="text-[10px] bg-emerald-500/10 text-emerald-500 font-bold px-2 py-0.5 rounded animate-pulse">
                Live Status Tracker
              </span>
            </div>

            <div className="space-y-4">
              {logs.length === 0 ? (
                <p className="text-xs text-slate-500 text-center py-8">Belum ada log WhatsApp terekam.</p>
              ) : (
                logs.map((log) => (
                  <div key={log.log_id} className="p-4 bg-[#1A1F2E]/60 border border-white/5 rounded-2xl space-y-2 relative group" data-testid={`wa-log-${log.log_id}`}>
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-mono font-bold text-slate-300">{log.phone}</span>
                      <span className={`px-2 py-0.5 rounded font-black text-[9px] uppercase ${
                        log.status === "Sent" 
                          ? "bg-emerald-500/15 text-emerald-500"
                          : "bg-blue-500/15 text-blue-500"
                      }`} data-testid={`wa-status-${log.log_id}`}>
                        {log.status}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 leading-relaxed font-sans">{log.message}</p>
                    <span className="block text-[9px] text-slate-500 text-right">
                      {new Date(log.created_at).toLocaleString("id-ID")}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ==========================================
// 7. BILLING & SUBSCRIPTION TAB
// ==========================================
function BillingTab({ currentUser, tenant }) {
  const [currentSub, setCurrentSub] = useState(null);
  const [loading, setLoading] = useState(true);

  // Simulated Midtrans Checkout Overlay
  const [showSnapSimulation, setShowSnapSimulation] = useState(false);
  const [snapData, setSnapData] = useState(null);

  const fetchSubscription = useCallback(() => {
    axios.get(`${API}/dashboard/subscription`)
      .then((res) => {
        setCurrentSub(res.data);
        setLoading(false);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    fetchSubscription();
  }, [fetchSubscription]);

  const handleUpgradeTrigger = (pkg) => {
    toast.loading("Menghubungi Midtrans Payment...", { id: "billing-upgrade" });
    axios.post(`${API}/dashboard/upgrade`, { package: pkg })
      .then((res) => {
        setSnapData(res.data);
        toast.success("Token Midtrans Snap Terbit!", { id: "billing-upgrade" });
        setShowSnapSimulation(true);
      })
      .catch((err) => {
        toast.error("Gagal menghubungi gateway: " + (err.response?.data?.detail || err.message), { id: "billing-upgrade" });
      });
  };

  const handleCompletePaymentSimulation = () => {
    toast.loading("Menyelesaikan pembayaran di Midtrans...", { id: "simulate-pay" });
    axios.post(`${API}/dashboard/midtrans-callback`, {
      order_id: snapData.billing_id,
      transaction_status: "settlement"
    })
      .then((res) => {
        toast.success("Pembayaran Terverifikasi! Paket terupgrade.", { id: "simulate-pay" });
        setShowSnapSimulation(false);
        setSnapData(null);
        fetchSubscription();
        setTimeout(() => {
          window.location.reload();
        }, 1000);
      })
      .catch(() => {
        toast.error("Gagal verifikasi simulasi.", { id: "simulate-pay" });
      });
  };

  if (loading) {
    return <div className="text-slate-400 text-sm">Memuat data penagihan...</div>;
  }

  const packages = [
    { name: "Gratis", price: "Rp 0", desc: "Sempurna untuk uji coba operasional awal UMKM", limit: "Maksimal 50 transaksi / bulan", features: ["Batas 50 Transaksi", "POS dasar", "Metode bayar Cash"], current: currentSub?.package === "Gratis" },
    { name: "Basic", price: "Rp 49.000", desc: "Ideal untuk toko operasional bertumbuh", limit: "Tanpa batasan transaksi harian", features: ["Transaksi Unlimited", "Manajemen Stok dasar", "Metode QRIS & Kasbon", "Histori Pelanggan lengkap"], current: currentSub?.package === "Basic", upgradeTo: "Basic" },
    { name: "Pro", price: "Rp 99.000", desc: "Fitur lengkap untuk bisnis profesional berskala besar", limit: "Tanpa batasan transaksi harian", features: ["Transaksi Unlimited", "Deduction Stok otomatis", "Notifikasi WhatsApp otomatis", "Laporan Keuangan Ekspor", "Dasbor Laporan Interaktif"], current: currentSub?.package === "Pro", upgradeTo: "Pro" }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-white tracking-tight">Manajemen Paket & Billing</h1>
        <p className="text-slate-400 text-sm">Konfigurasi paket berlangganan UMKM Anda, terintegrasi langsung dengan Midtrans Payment Gateway.</p>
      </div>

      <div className="p-5 bg-amber-500/10 border border-amber-500/20 rounded-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
        <div>
          <span className="text-xs text-amber-500 font-bold uppercase tracking-wider block">Paket Berlangganan Saat Ini</span>
          <h2 className="text-xl font-black text-white mt-1" data-testid="current-package-title">
            UMKM Paket {currentSub?.package}
          </h2>
          <p className="text-slate-400 text-xs mt-1">
            Transaksi terpakai bulan ini: <span className="font-bold text-white">{currentSub?.transaction_count}</span> dari {currentSub?.max_transactions_limit === -1 ? "Tanpa Batas" : currentSub?.max_transactions_limit}
          </p>
        </div>
        <span className="text-[10px] bg-amber-500 text-[#0B0F19] font-black tracking-widest px-3 py-1 rounded-full uppercase">
          Status: Aktif / Valid
        </span>
      </div>

      {/* Pricing Comparison cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {packages.map((pkg) => (
          <div key={pkg.name} className={`bg-[#131722] border rounded-2xl p-6 shadow-xl relative flex flex-col justify-between space-y-6 ${
            pkg.current ? "border-amber-500" : "border-white/5"
          }`}>
            {pkg.current && (
              <span className="absolute top-0 right-6 -translate-y-1/2 text-[9px] bg-amber-500 text-[#0B0F19] font-black tracking-widest px-2.5 py-0.5 rounded-full uppercase shadow">
                Aktif
              </span>
            )}

            <div className="space-y-4">
              <div>
                <h3 className="font-black text-white text-lg tracking-tight">{pkg.name}</h3>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">{pkg.desc}</p>
              </div>

              <div>
                <span className="text-2xl font-black text-white">{pkg.price}</span>
                <span className="text-[10px] text-slate-400 block mt-1">{pkg.limit}</span>
              </div>

              <ul className="space-y-2 pt-2 text-xs text-slate-300">
                {pkg.features.map((f) => (
                  <li key={f} className="flex items-center space-x-2">
                    <CheckCircle2 className="text-amber-500 shrink-0" size={14} />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
            </div>

            {pkg.upgradeTo && !pkg.current && (() => {
              const getPkgRank = (pkgName) => {
                if (pkgName === "Pro") return 3;
                if (pkgName === "Basic") return 2;
                return 1;
              };
              const canUpgrade = getPkgRank(pkg.upgradeTo) > getPkgRank(currentSub?.package);
              return canUpgrade ? (
                <button
                  data-testid={`upgrade-pkg-btn-${pkg.upgradeTo}`}
                  onClick={() => handleUpgradeTrigger(pkg.upgradeTo)}
                  className="w-full py-2.5 bg-[#1A1F2E] hover:bg-amber-500 hover:text-[#0B0F19] border border-white/5 text-white font-bold rounded-xl text-xs text-center transition-colors"
                >
                  Pilih Paket {pkg.name}
                </button>
              ) : null;
            })()}
          </div>
        ))}
      </div>

      {/* MIDTRANS SNAP OVERLAY SIMULATION */}
      {showSnapSimulation && snapData && (
        <div className="fixed inset-0 bg-[#0B0F19]/90 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-[#131722] border border-[#F59E0B]/50 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
            {/* Simulation Header */}
            <div className="p-4 bg-[#F59E0B] text-[#0B0F19] flex justify-between items-center">
              <div className="flex items-center space-x-2">
                <CreditCard size={20} />
                <span className="font-bold text-sm">Simulasi Midtrans Sandbox Snap</span>
              </div>
              <span className="text-[10px] bg-slate-900 text-white font-bold px-2 py-0.5 rounded">TEST MODE</span>
            </div>

            <div className="p-6 space-y-6">
              <div className="space-y-2 text-center">
                <span className="text-xs text-slate-400 block">Total Tagihan Berlangganan</span>
                <h2 className="text-2xl font-black text-white">Rp {snapData.amount.toLocaleString("id-ID")}</h2>
                <p className="text-xs text-slate-500">Order ID: {snapData.billing_id}</p>
              </div>

              {/* Payment details frame */}
              <div className="p-4 bg-[#0B0F19] border border-white/5 rounded-xl space-y-3 text-xs">
                <span className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest text-center">Pilihan Metode Pembayaran</span>
                <button 
                  data-testid="simulate-pay-qris-btn"
                  onClick={handleCompletePaymentSimulation}
                  className="w-full p-3 bg-[#1A1F2E]/60 border border-white/5 hover:border-amber-500/50 rounded-xl flex items-center justify-between transition-colors group"
                >
                  <div className="flex items-center space-x-3">
                    <span className="text-xs font-bold text-slate-200">GOPAY / QRIS Otomatis</span>
                  </div>
                  <ChevronRight className="text-slate-500 group-hover:text-amber-500" size={14} />
                </button>
                <button 
                  onClick={handleCompletePaymentSimulation}
                  className="w-full p-3 bg-[#1A1F2E]/60 border border-white/5 hover:border-amber-500/50 rounded-xl flex items-center justify-between transition-colors group"
                >
                  <div className="flex items-center space-x-3">
                    <span className="text-xs font-bold text-slate-200">Virtual Account Mandiri / BCA</span>
                  </div>
                  <ChevronRight className="text-slate-500 group-hover:text-amber-500" size={14} />
                </button>
              </div>

              <div className="flex space-x-3">
                <button
                  onClick={() => {
                    setShowSnapSimulation(false);
                    setSnapData(null);
                  }}
                  className="flex-1 py-2 bg-[#1A1F2E] hover:bg-slate-800 text-white font-bold rounded-xl border border-white/5 text-xs text-center"
                >
                  Batalkan
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ==========================================
// 8. SUPER ADMIN TAB (muhamad.widiono98@gmail.com Only)
// ==========================================
function SuperAdminTab({ currentUser, tenant }) {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get(`${API}/superadmin/stats`)
      .then((res) => {
        setStats(res.data);
        setLoading(false);
      })
      .catch(() => {});
  }, []);

  if (loading) {
    return <div className="text-slate-400 text-sm">Memuat modul Super Admin...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-white tracking-tight">Super Admin Hub</h1>
        <p className="text-slate-400 text-sm">Ringkasan performa dan pertumbuhan ekosistem multi-tenant SaaS Anda.</p>
      </div>

      {/* Global Bento Statistics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-[#131722] border border-white/5 rounded-2xl p-6 relative overflow-hidden shadow-xl">
          <span className="text-xs text-slate-500 font-bold uppercase tracking-widest">Total Tenant UMKM</span>
          <h2 className="text-2xl font-black text-white mt-2" data-testid="sa-stat-tenants">{stats.total_tenants}</h2>
          <span className="text-[10px] text-slate-500 block mt-2">Seluruh UMKM yang terafiliasi</span>
        </div>

        <div className="bg-[#131722] border border-white/5 rounded-2xl p-6 relative overflow-hidden shadow-xl">
          <span className="text-xs text-slate-500 font-bold uppercase tracking-widest">Total Pengguna</span>
          <h2 className="text-2xl font-black text-white mt-2">{stats.total_users}</h2>
          <span className="text-[10px] text-slate-500 block mt-2">Staff & Owner yang aktif</span>
        </div>

        <div className="bg-[#131722] border border-white/5 rounded-2xl p-6 relative overflow-hidden shadow-xl">
          <span className="text-xs text-slate-500 font-bold uppercase tracking-widest">Global Transaksi</span>
          <h2 className="text-2xl font-black text-white mt-2">{stats.total_global_transactions}</h2>
          <span className="text-[10px] text-slate-500 block mt-2">Total order di semua tenant</span>
        </div>

        <div className="bg-[#131722] border border-white/5 rounded-2xl p-6 relative overflow-hidden shadow-xl">
          <span className="text-xs text-slate-500 font-bold uppercase tracking-widest">Dispatch WhatsApp</span>
          <h2 className="text-2xl font-black text-white mt-2">{stats.total_whatsapp_messages}</h2>
          <span className="text-[10px] text-slate-500 block mt-2">Akumulasi pengiriman notifikasi</span>
        </div>
      </div>

      {/* List of active Tenants */}
      <div className="bg-[#131722] border border-white/5 rounded-2xl overflow-hidden shadow-xl">
        <div className="p-6 border-b border-white/5 flex justify-between items-center">
          <h3 className="font-bold text-white text-sm uppercase tracking-wider">Ekosistem UMKM / Tenant</h3>
          <span className="text-xs text-slate-500">Isolasi multi-tenant aktif</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-white/5 bg-[#1A1F2E]/30 text-slate-400 uppercase tracking-widest">
                <th className="p-4 font-bold">ID Tenant</th>
                <th className="p-4 font-bold">Nama UMKM</th>
                <th className="p-4 font-bold">Tipe Operasional</th>
                <th className="p-4 font-bold">Paket</th>
                <th className="p-4 font-bold">Transaksi Bulan Ini</th>
                <th className="p-4 font-bold">Email Owner</th>
              </tr>
            </thead>
            <tbody>
              {stats.tenants_list.map((t) => (
                <tr key={t.tenant_id} className="border-b border-white/5 hover:bg-[#1A1F2E]/30 transition-colors">
                  <td className="p-4 font-mono font-bold text-amber-500">{t.tenant_id}</td>
                  <td className="p-4 text-white font-bold">{t.name}</td>
                  <td className="p-4 text-slate-300 capitalize">{t.type}</td>
                  <td className="p-4">
                    <span className={`px-2 py-0.5 rounded font-black text-[9px] uppercase ${
                      t.package === "Pro" 
                        ? "bg-amber-500/15 text-amber-500"
                        : t.package === "Basic"
                        ? "bg-blue-500/15 text-blue-500"
                        : "bg-slate-800 text-slate-400"
                    }`}>
                      {t.package}
                    </span>
                  </td>
                  <td className="p-4 text-slate-300 font-bold">{t.transaction_count} Order</td>
                  <td className="p-4 text-slate-400">{t.owner_email}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// --- APP ROOT ENTRY WITH REACT ROUTER ROUTING CONVENTION ---
export default function App() {
  return (
    <div className="App">
      <BrowserRouter>
        <AppRouter />
      </BrowserRouter>
      <Toaster position="top-right" richColors />
    </div>
  );
}
