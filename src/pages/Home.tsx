import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getAllBrands, type Brand } from "../api/brand";
import { getCategories } from "../api/category";
import { getProducts } from "../api/product";

interface Stats {
  totalProducts: number;
  totalBrands: number;
  totalCategories: number;
  totalStock: number;
}

const Home = () => {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user") || "{}");

  const [stats, setStats] = useState<Stats>({
    totalProducts: 0,
    totalBrands: 0,
    totalCategories: 0,
    totalStock: 0,
  });
  const [recentBrands, setRecentBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true);
  const [greeting, setGreeting] = useState("");

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting("Good morning");
    else if (hour < 18) setGreeting("Good afternoon");
    else setGreeting("Good evening");

    const fetchData = async () => {
      try {
        const [brandsRes, categoriesRes, productsRes] = await Promise.allSettled([
          getAllBrands(),
          getCategories(),
          getProducts({ limit: 1000 }),
        ]);

        const brands = brandsRes.status === "fulfilled" ? brandsRes.value : [];
        const categories = categoriesRes.status === "fulfilled" ? categoriesRes.value : [];
        const productsData = productsRes.status === "fulfilled" ? productsRes.value : { products: [], total: 0 };
        const products = Array.isArray(productsData) ? productsData : (productsData.products || []);

        const totalStock = products.reduce(
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (sum: number, p: any) => sum + (p.quantity.value ?? p.openingStock ?? 0),
          0
        );
        console.log(totalStock);
        

        setStats({
          totalProducts: Array.isArray(productsData) ? productsData.length : (productsData.total || products.length),
          totalBrands: brands.length,
          totalCategories: categories.length,
          totalStock,
        });

        setRecentBrands(brands.slice(0, 5));
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const logout = () => {
    localStorage.clear();
    navigate("/login");
  };

  const navItems = [
    { label: "Dashboard", active: true },
    { label: "Products", path: "/products" },
    { label: "Brands", path: "/brands" },
    { label: "Categories", path: "/categories" },
  ];

  const statCards = [
    {
      label: "Total Products",
      value: stats.totalProducts,
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
          <polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/>
        </svg>
      ),
      color: "#3b82f6",
      bg: "rgba(59,130,246,0.1)",
      trend: "+12%",
    },
    {
      label: "Total Brands",
      value: stats.totalBrands,
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10"/>
          <path d="M8.56 2.75c4.37 6.03 6.02 9.42 8.03 17.72m2.54-15.38c-3.72 4.35-8.94 5.66-16.88 5.85m19.5 1.9c-3.5-.93-6.63-.82-8.94 0-2.58.92-5.01 2.86-7.44 6.32"/>
        </svg>
      ),
      color: "#10b981",
      bg: "rgba(16,185,129,0.1)",
      trend: "+3%",
    },
    {
      label: "Categories",
      value: stats.totalCategories,
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
          <rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
        </svg>
      ),
      color: "#f59e0b",
      bg: "rgba(245,158,11,0.1)",
      trend: "+1",
    },
    {
      label: "Total Stock",
      value: stats.totalStock.toLocaleString(),
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <line x1="12" y1="20" x2="12" y2="10"/><line x1="18" y1="20" x2="18" y2="4"/>
          <line x1="6" y1="20" x2="6" y2="16"/>
        </svg>
      ),
      color: "#a78bfa",
      bg: "rgba(167,139,250,0.1)",
      trend: "units",
    },
  ];

  const quickActions = [
    {
      label: "Products",
      desc: "Manage your product catalog",
      path: "/products",
      color: "#3b82f6",
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
          <polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/>
        </svg>
      ),
    },
    {
      label: "Brands",
      desc: "Track and manage brands",
      path: "/brands",
      color: "#10b981",
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10"/>
          <path d="M8.56 2.75c4.37 6.03 6.02 9.42 8.03 17.72m2.54-15.38c-3.72 4.35-8.94 5.66-16.88 5.85m19.5 1.9c-3.5-.93-6.63-.82-8.94 0-2.58.92-5.01 2.86-7.44 6.32"/>
        </svg>
      ),
    },
    {
      label: "Categories",
      desc: "Organize by category",
      path: "/categories",
      color: "#f59e0b",
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
          <rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
        </svg>
      ),
    },
  ];

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        :root {
          --bg: #080c14;
          --surface: #0d1422;
          --surface2: #111827;
          --border: rgba(255,255,255,0.06);
          --border-hover: rgba(255,255,255,0.12);
          --text: #f1f5f9;
          --text-muted: #475569;
          --text-dim: #64748b;
        }

        .home-root {
          min-height: 100vh;
          width: 100vw;
          background: var(--bg);
          font-family: 'Outfit', sans-serif;
          color: var(--text);
          display: flex;
        }

        /* ── Sidebar ── */
        .sidebar {
          width: 240px;
          flex-shrink: 0;
          background: var(--surface);
          border-right: 1px solid var(--border);
          display: flex;
          flex-direction: column;
          padding: 28px 0;
          position: sticky;
          top: 0;
          height: 100vh;
        }

        .sidebar-logo {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 0 24px 28px;
          border-bottom: 1px solid var(--border);
          margin-bottom: 16px;
        }

        .logo-icon {
          width: 34px;
          height: 34px;
          background: linear-gradient(135deg, #3b82f6, #6366f1);
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .logo-icon svg {
          width: 18px;
          height: 18px;
          color: white;
        }

        .logo-name {
          font-size: 17px;
          font-weight: 700;
          color: var(--text);
          letter-spacing: -0.3px;
        }

        .nav-section-label {
          font-size: 10px;
          font-weight: 600;
          letter-spacing: 1.5px;
          text-transform: uppercase;
          color: var(--text-muted);
          padding: 0 24px;
          margin: 8px 0 6px;
        }

        .nav-item {
          display: flex;
          align-items: center;
          gap: 11px;
          padding: 10px 24px;
          font-size: 14px;
          font-weight: 500;
          color: var(--text-dim);
          cursor: pointer;
          transition: all 0.18s;
          border-left: 2px solid transparent;
          text-decoration: none;
          background: none;
          border-right: none;
          border-top: none;
          border-bottom: none;
          width: 100%;
          text-align: left;
        }

        .nav-item svg {
          width: 17px;
          height: 17px;
          flex-shrink: 0;
        }

        .nav-item:hover {
          color: var(--text);
          background: rgba(255,255,255,0.04);
        }

        .nav-item.active {
          color: #3b82f6;
          border-left-color: #3b82f6;
          background: rgba(59,130,246,0.08);
        }

        .sidebar-bottom {
          margin-top: auto;
          padding: 16px 24px 0;
          border-top: 1px solid var(--border);
        }

        .user-info {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 12px 0;
        }

        .user-avatar {
          width: 34px;
          height: 34px;
          background: linear-gradient(135deg, #3b82f6, #6366f1);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 13px;
          font-weight: 700;
          color: white;
          flex-shrink: 0;
        }

        .user-details {
          flex: 1;
          overflow: hidden;
        }

        .user-name {
          font-size: 13px;
          font-weight: 600;
          color: var(--text);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .user-role {
          font-size: 11px;
          color: var(--text-muted);
          margin-top: 1px;
        }

        .logout-btn {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 9px 12px;
          background: rgba(239,68,68,0.08);
          border: 1px solid rgba(239,68,68,0.15);
          border-radius: 8px;
          color: #f87171;
          font-family: 'Outfit', sans-serif;
          font-size: 13px;
          font-weight: 500;
          cursor: pointer;
          width: 100%;
          margin-top: 10px;
          transition: all 0.18s;
        }

        .logout-btn:hover {
          background: rgba(239,68,68,0.14);
          border-color: rgba(239,68,68,0.3);
        }

        .logout-btn svg {
          width: 15px;
          height: 15px;
        }

        /* ── Main content ── */
        .main {
          flex: 1;
          overflow-y: auto;
          padding: 36px 40px;
          animation: fadeIn 0.5s ease;
        }

        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .page-header {
          margin-bottom: 32px;
        }

        .greeting {
          font-size: 13px;
          color: var(--text-muted);
          font-weight: 400;
          margin-bottom: 4px;
        }

        .page-title {
          font-size: 28px;
          font-weight: 700;
          color: var(--text);
          letter-spacing: -0.6px;
        }

        .page-title span {
          background: linear-gradient(90deg, #3b82f6, #818cf8);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        /* ── Stat cards ── */
        .stats-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 16px;
          margin-bottom: 32px;
        }

        .stat-card {
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: 14px;
          padding: 22px;
          transition: border-color 0.2s, transform 0.2s;
          animation: fadeUp 0.5s ease both;
        }

        .stat-card:nth-child(1) { animation-delay: 0.05s; }
        .stat-card:nth-child(2) { animation-delay: 0.1s; }
        .stat-card:nth-child(3) { animation-delay: 0.15s; }
        .stat-card:nth-child(4) { animation-delay: 0.2s; }

        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(14px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .stat-card:hover {
          border-color: var(--border-hover);
          transform: translateY(-2px);
        }

        .stat-top {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 16px;
        }

        .stat-icon-wrap {
          width: 40px;
          height: 40px;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .stat-icon-wrap svg {
          width: 20px;
          height: 20px;
        }

        .stat-trend {
          font-family: 'JetBrains Mono', monospace;
          font-size: 11px;
          font-weight: 500;
          padding: 3px 8px;
          border-radius: 6px;
          background: rgba(16,185,129,0.1);
          color: #10b981;
        }

        .stat-value {
          font-size: 30px;
          font-weight: 700;
          color: var(--text);
          letter-spacing: -1px;
          line-height: 1;
          margin-bottom: 5px;
          font-variant-numeric: tabular-nums;
        }

        .stat-label {
          font-size: 13px;
          color: var(--text-muted);
          font-weight: 400;
        }

        /* ── Skeleton loader ── */
        .skeleton {
          background: linear-gradient(90deg, #1a2035 25%, #1f2c42 50%, #1a2035 75%);
          background-size: 200% 100%;
          animation: shimmer 1.5s infinite;
          border-radius: 8px;
        }

        @keyframes shimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }

        /* ── Content row ── */
        .content-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
          margin-bottom: 24px;
          animation: fadeUp 0.5s 0.25s ease both;
        }

        .section-card {
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: 14px;
          overflow: hidden;
        }

        .section-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 20px 22px 16px;
          border-bottom: 1px solid var(--border);
        }

        .section-title {
          font-size: 15px;
          font-weight: 600;
          color: var(--text);
        }

        .section-link {
          font-size: 12px;
          color: #3b82f6;
          cursor: pointer;
          background: none;
          border: none;
          font-family: 'Outfit', sans-serif;
          font-weight: 500;
          transition: opacity 0.15s;
          padding: 0;
        }

        .section-link:hover { opacity: 0.7; }

        /* ── Brand list ── */
        .brand-list {
          padding: 8px 0;
        }

        .brand-row {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 11px 22px;
          transition: background 0.15s;
          cursor: pointer;
        }

        .brand-row:hover { background: rgba(255,255,255,0.025); }

        .brand-avatar {
          width: 34px;
          height: 34px;
          border-radius: 9px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 13px;
          font-weight: 700;
          flex-shrink: 0;
        }

        .brand-info { flex: 1; }

        .brand-name {
          font-size: 13px;
          font-weight: 500;
          color: var(--text);
        }

        .brand-type {
          font-size: 11px;
          color: var(--text-muted);
          margin-top: 2px;
          text-transform: capitalize;
        }

        .brand-badge {
          font-size: 10px;
          font-weight: 600;
          padding: 3px 8px;
          border-radius: 5px;
          letter-spacing: 0.5px;
          text-transform: uppercase;
        }

        /* ── Quick actions ── */
        .actions-grid {
          padding: 16px;
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .action-btn {
          display: flex;
          align-items: center;
          gap: 14px;
          padding: 14px 16px;
          border-radius: 10px;
          background: rgba(255,255,255,0.025);
          border: 1px solid var(--border);
          cursor: pointer;
          transition: all 0.18s;
          text-align: left;
          font-family: 'Outfit', sans-serif;
          width: 100%;
        }

        .action-btn:hover {
          background: rgba(255,255,255,0.05);
          border-color: var(--border-hover);
          transform: translateX(3px);
        }

        .action-icon {
          width: 38px;
          height: 38px;
          border-radius: 9px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .action-icon svg {
          width: 18px;
          height: 18px;
        }

        .action-text { flex: 1; }

        .action-label {
          font-size: 14px;
          font-weight: 600;
          color: var(--text);
        }

        .action-desc {
          font-size: 12px;
          color: var(--text-muted);
          margin-top: 2px;
        }

        .action-arrow {
          color: var(--text-muted);
          transition: transform 0.18s, color 0.18s;
        }

        .action-btn:hover .action-arrow {
          transform: translateX(3px);
          color: var(--text);
        }

        .action-arrow svg {
          width: 15px;
          height: 15px;
        }

        /* ── Empty state ── */
        .empty-state {
          padding: 32px;
          text-align: center;
          color: var(--text-muted);
          font-size: 13px;
        }

        /* ── Dot status ── */
        .status-dot {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background: #10b981;
          box-shadow: 0 0 0 3px rgba(16,185,129,0.2);
          display: inline-block;
          margin-right: 6px;
          animation: blink 2.5s ease-in-out infinite;
        }

        @keyframes blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }

        .sys-status {
          display: flex;
          align-items: center;
          font-size: 12px;
          color: var(--text-muted);
          animation: fadeUp 0.5s 0.35s ease both;
        }

        @media (max-width: 1100px) {
          .stats-grid { grid-template-columns: repeat(2, 1fr); }
        }

        @media (max-width: 900px) {
          .content-row { grid-template-columns: 1fr; }
        }

        @media (max-width: 700px) {
          .sidebar { display: none; }
          .main { padding: 24px 20px; }
          .stats-grid { grid-template-columns: repeat(2, 1fr); }
        }
      `}</style>

      <div className="home-root">
        {/* Sidebar */}
        <aside className="sidebar">
          <div className="sidebar-logo">
            <div className="logo-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 7H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2Z"/>
                <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>
              </svg>
            </div>
            <span className="logo-name">Inventra</span>
          </div>

          <span className="nav-section-label">Menu</span>

          {navItems.map((item) => (
            <button
              key={item.label}
              className={`nav-item ${item.active ? "active" : ""}`}
              onClick={() => item.path && navigate(item.path)}
            >
              {item.label === "Dashboard" && (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="3" width="7" height="9"/><rect x="14" y="3" width="7" height="5"/>
                  <rect x="14" y="12" width="7" height="9"/><rect x="3" y="16" width="7" height="5"/>
                </svg>
              )}
              {item.label === "Products" && (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
                </svg>
              )}
              {item.label === "Brands" && (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"/>
                  <path d="M8.56 2.75c4.37 6.03 6.02 9.42 8.03 17.72m2.54-15.38c-3.72 4.35-8.94 5.66-16.88 5.85"/>
                </svg>
              )}
              {item.label === "Categories" && (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
                  <rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
                </svg>
              )}
              {item.label}
            </button>
          ))}

          <div className="sidebar-bottom">
            <div className="user-info">
              <div className="user-avatar">
                {(user.email || "U")[0].toUpperCase()}
              </div>
              <div className="user-details">
                <div className="user-name">{user.email || "User"}</div>
                <div className="user-role">{user.isAdmin ? "Administrator" : "Shop Keeper"}</div>
              </div>
            </div>
            <button className="logout-btn" onClick={logout}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                <polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
              </svg>
              Sign Out
            </button>
          </div>
        </aside>

        {/* Main */}
        <main className="main">
          <div className="page-header">
            <p className="greeting">{greeting}, {user.email?.split("@")[0] || "there"} 👋</p>
            <h1 className="page-title">Inventory <span>Dashboard</span></h1>
          </div>

          {/* Stats */}
          <div className="stats-grid">
            {statCards.map((card) => (
              <div className="stat-card" key={card.label}>
                <div className="stat-top">
                  <div className="stat-icon-wrap" style={{ background: card.bg, color: card.color }}>
                    {card.icon}
                  </div>
                  <span className="stat-trend">{card.trend}</span>
                </div>
                {loading ? (
                  <div className="skeleton" style={{ height: 36, width: "60%", marginBottom: 8 }} />
                ) : (
                  <div className="stat-value">{card.value}</div>
                )}
                <div className="stat-label">{card.label}</div>
              </div>
            ))}
          </div>

          {/* Content row */}
          <div className="content-row">
            {/* Recent brands */}
            <div className="section-card">
              <div className="section-header">
                <span className="section-title">Recent Brands</span>
                <button className="section-link" onClick={() => navigate("/brands")}>View all →</button>
              </div>
              <div className="brand-list">
                {loading ? (
                  [1, 2, 3, 4].map((i) => (
                    <div key={i} className="brand-row">
                      <div className="skeleton" style={{ width: 34, height: 34, borderRadius: 9, flexShrink: 0 }} />
                      <div style={{ flex: 1 }}>
                        <div className="skeleton" style={{ height: 13, width: "60%", marginBottom: 6 }} />
                        <div className="skeleton" style={{ height: 11, width: "35%" }} />
                      </div>
                    </div>
                  ))
                ) : recentBrands.length > 0 ? (
                  recentBrands.map((brand, i) => {
                    const colors = ["#3b82f6","#10b981","#f59e0b","#a78bfa","#f43f5e"];
                    const bgs = ["rgba(59,130,246,0.15)","rgba(16,185,129,0.15)","rgba(245,158,11,0.15)","rgba(167,139,250,0.15)","rgba(244,63,94,0.15)"];
                    return (
                      <div className="brand-row" key={brand._id} onClick={() => navigate("/brands")}>
                        <div className="brand-avatar" style={{ background: bgs[i % 5], color: colors[i % 5] }}>
                          {brand.name[0].toUpperCase()}
                        </div>
                        <div className="brand-info">
                          <div className="brand-name">{brand.name}</div>
                          <div className="brand-type">{brand.type}</div>
                        </div>
                        <span className="brand-badge" style={{ background: bgs[i % 5], color: colors[i % 5] }}>
                          {brand.type?.slice(0, 4) || "–"}
                        </span>
                      </div>
                    );
                  })
                ) : (
                  <div className="empty-state">No brands yet</div>
                )}
              </div>
            </div>

            {/* Quick actions */}
            <div className="section-card">
              <div className="section-header">
                <span className="section-title">Quick Access</span>
              </div>
              <div className="actions-grid">
                {quickActions.map((action) => (
                  <button
                    className="action-btn"
                    key={action.label}
                    onClick={() => navigate(action.path)}
                  >
                    <div className="action-icon" style={{ background: `${action.color}18`, color: action.color }}>
                      {action.icon}
                    </div>
                    <div className="action-text">
                      <div className="action-label">{action.label}</div>
                      <div className="action-desc">{action.desc}</div>
                    </div>
                    <span className="action-arrow">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
                      </svg>
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="sys-status">
            <span className="status-dot" />
            All systems operational
          </div>
        </main>
      </div>
    </>
  );
};

export default Home;