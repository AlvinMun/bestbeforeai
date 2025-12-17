import { useEffect, useMemo, useRef, useState } from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";

function statusFor(expiryDateStr) {
  const today = new Date();
  const exp = new Date(expiryDateStr + "T00:00:00");
  const diffDays = Math.ceil((exp - today) / (1000 * 60 * 60 * 24));

  if (diffDays < 0) return { key: "expired", label: "EXPIRED" };
  if (diffDays <= 3) return { key: "soon", label: "EXPIRING SOON" };
  return { key: "safe", label: "SAFE" };
}

// optional: tiny helper to guess a product name from OCR text
function guessNameFromText(text) {
  if (!text) return "";
  const lines = text
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);

  // pick first "reasonable" line
  const candidate = lines.find(
    (l) =>
      l.length >= 3 &&
      l.length <= 28 &&
      !/\d{2,}/.test(l) && // avoid long numeric lines
      !/(total|subtotal|tax|change|visa|mastercard|cash|qty|price)/i.test(l)
  );

  return candidate || "";
}

export default function Dashboard() {
  const nav = useNavigate();
  const token = localStorage.getItem("token");

  const [tab, setTab] = useState("all");
  const [items, setItems] = useState([]);
  const [search, setSearch] = useState("");

  // OCR
  const fileInputRef = useRef(null);
  const [ocrLoading, setOcrLoading] = useState(false);
  const [ocrResult, setOcrResult] = useState(null);

  // Add/Edit form state
  const [name, setName] = useState("");
  const [storage, setStorage] = useState("fridge");
  const [expiryDate, setExpiryDate] = useState("");

  async function loadItems() {
    const res = await axios.get("http://localhost:8000/items", {
      headers: { Authorization: `Bearer ${token}` },
    });
    setItems(res.data);
  }

  async function addItem(e) {
    e.preventDefault();
    if (!name || !expiryDate) return;

    await axios.post(
      "http://localhost:8000/items",
      { name, storage, expiry_date: expiryDate },
      { headers: { Authorization: `Bearer ${token}` } }
    );

    setName("");
    setExpiryDate("");
    setStorage("fridge");
    setOcrResult(null);

    await loadItems();
    setTab("all");
  }

  async function deleteItem(id) {
    await axios.delete(`http://localhost:8000/items/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    await loadItems();
  }

  async function toggleFavorite(it) {
    await axios.patch(
      `http://localhost:8000/items/${it.id}/favorite`,
      { favorite: !it.favorite },
      { headers: { Authorization: `Bearer ${token}` } }
    );

    // optimistic update so UI instantly highlights
    setItems((prev) =>
      prev.map((x) => (x.id === it.id ? { ...x, favorite: !x.favorite } : x))
    );
  }

  async function uploadOCRFile(file) {
    if (!file) return;
    setOcrLoading(true);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await axios.post("http://localhost:8000/ocr", formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });

      setOcrResult(res.data);

      const detectedExpiry = res.data?.expiry?.expiry_date || "";
      const guessedName = guessNameFromText(res.data?.text || "");

      if (detectedExpiry) setExpiryDate(detectedExpiry);
      if (guessedName && !name) setName(guessedName);

      setTab("add");
    } finally {
      setOcrLoading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  useEffect(() => {
    if (!token) nav("/login");
  }, [token, nav]);

  useEffect(() => {
    if (token) loadItems();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const stats = useMemo(() => {
    let safe = 0,
      soon = 0,
      exp = 0;
    for (const it of items) {
      const s = statusFor(it.expiry_date);
      if (s.key === "safe") safe++;
      else if (s.key === "soon") soon++;
      else exp++;
    }
    return { total: items.length, safe, soon, exp };
  }, [items]);

  const favorites = useMemo(() => items.filter((it) => it.favorite), [items]);

  const shownItems = useMemo(() => {
    const base = tab === "fav" ? favorites : items;
    const filtered = base.filter((it) =>
      it.name.toLowerCase().includes(search.toLowerCase())
    );
    return filtered;
  }, [items, favorites, tab, search]);

  return (
    <div className="bb-dashboard">
      <aside className="bb-side">
        <div className="logo">Best Before</div>

        <div className="bb-menu">
          <button
            className={`bb-nav ${tab === "all" ? "active" : ""}`}
            onClick={() => setTab("all")}
            type="button"
          >
            Dashboard
          </button>

          <button
            className={`bb-nav ${tab === "add" ? "active" : ""}`}
            onClick={() => setTab("add")}
            type="button"
          >
            Add Item
          </button>

          <button
            className={`bb-nav ${tab === "fav" ? "active" : ""}`}
            onClick={() => setTab("fav")}
            type="button"
          >
            Favorites
          </button>

          <Link className="bb-link" to="/profile">
            Profile
          </Link>

          <button
            className="bb-nav danger"
            type="button"
            onClick={() => {
              localStorage.removeItem("token");
              nav("/login");
            }}
          >
            Logout
          </button>
        </div>
      </aside>

      <main className="bb-main">
        <div className="bb-topbar">
          <div className="bb-title">
            {tab === "all" ? "Dashboard" : tab === "add" ? "Add Item" : "Favorites"}
          </div>

          {tab !== "add" && (
            <input
              className="bb-search"
              placeholder="Search items..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          )}

          {tab === "add" && (
            <>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                style={{ display: "none" }}
                onChange={(e) => uploadOCRFile(e.target.files?.[0])}
              />

              <button
                className="bb-btn"
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={ocrLoading}
                title="Upload receipt/label to detect expiry"
              >
                {ocrLoading ? "Uploading..." : "Upload"}
              </button>
            </>
          )}
        </div>

        {/* Stat cards (only show on Dashboard tab) */}
        {tab === "all" && (
          <div className="bb-stats">
            <div className="bb-stat">
              <div>
                <div className="k">TOTAL ITEMS</div>
                <div className="v">{stats.total}</div>
              </div>
              <div className="bb-dot info" />
            </div>

            <div className="bb-stat">
              <div>
                <div className="k">EXPIRED</div>
                <div className="v">{stats.exp}</div>
              </div>
              <div className="bb-dot bad" />
            </div>

            <div className="bb-stat">
              <div>
                <div className="k">EXPIRING SOON</div>
                <div className="v">{stats.soon}</div>
              </div>
              <div className="bb-dot warn" />
            </div>

            <div className="bb-stat">
              <div>
                <div className="k">SAFE</div>
                <div className="v">{stats.safe}</div>
              </div>
              <div className="bb-dot good" />
            </div>
          </div>
        )}

        {/* Add Item */}
        {tab === "add" && (
          <div className="bb-card bb-panel">
            <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
              {/* small detected hint (not a whole section) */}
              {ocrResult?.expiry?.expiry_date && (
                <div style={{ opacity: 0.85, fontSize: 13, alignSelf: "center" }}>
                  Detected expiry: <b>{ocrResult.expiry.expiry_date}</b>{" "}
                  <span style={{ opacity: 0.7 }}>
                    ({Math.round(ocrResult.expiry.confidence * 100)}%)
                  </span>
                </div>
              )}
            </div>

            <form className="bb-form" onSubmit={addItem}>
              <div>
                <div className="bb-label">Item name</div>
                <input
                  className="bb-input"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Milk"
                />
              </div>

              <div>
                <div className="bb-label">Storage</div>
                <select
                  className="bb-input"
                  value={storage}
                  onChange={(e) => setStorage(e.target.value)}
                >
                  <option value="fridge">fridge</option>
                  <option value="freezer">freezer</option>
                  <option value="pantry">pantry</option>
                </select>
              </div>

              <div>
                <div className="bb-label">Expiry date</div>
                <input
                  className="bb-input"
                  type="date"
                  value={expiryDate}
                  onChange={(e) => setExpiryDate(e.target.value)}
                />
              </div>

              <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
                <button className="bb-btn" type="submit">
                  Save
                </button>
                <button
                  className="bb-btn secondary"
                  type="button"
                  onClick={() => {
                    setName("");
                    setExpiryDate("");
                    setStorage("fridge");
                    setOcrResult(null);
                  }}
                >
                  Clear
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Items table (All/Favorites) */}
        {tab !== "add" && (
          <div className="bb-card bb-panel">
            <h3>{tab === "fav" ? "Favorite Items" : "My Items"}</h3>

            <table className="bb-table">
              <thead>
                <tr>
                  <th>ITEM NAME</th>
                  <th>STORAGE</th>
                  <th>EXPIRY DATE</th>
                  <th>STATUS</th>
                  <th style={{ width: 180 }}>ACTIONS</th>
                </tr>
              </thead>

              <tbody>
                {shownItems.map((it) => {
                  const s = statusFor(it.expiry_date);
                  return (
                    <tr key={it.id}>
                      <td>{it.name}</td>
                      <td style={{ color: "rgba(255,255,255,0.75)" }}>{it.storage}</td>
                      <td>{it.expiry_date}</td>
                      <td>
                        <span
                          className={
                            "bb-badge " +
                            (s.key === "safe" ? "safe" : s.key === "soon" ? "soon" : "exp")
                          }
                        >
                          {s.label}
                        </span>
                      </td>

                      <td>
                        <div style={{ display: "flex", gap: 8 }}>
                          <button
                            className="bb-star"
                            type="button"
                            onClick={() => toggleFavorite(it)}
                            title="Toggle favorite"
                          >
                            {it.favorite ? "★" : "☆"}
                          </button>

                          <button
                            className="bb-btn danger"
                            type="button"
                            onClick={() => deleteItem(it.id)}
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}

                {shownItems.length === 0 && (
                  <tr>
                    <td colSpan={5} style={{ color: "rgba(255,255,255,0.6)", padding: 16 }}>
                      {tab === "fav"
                        ? "No favorites yet. Star an item to add it here."
                        : "No items yet. Use Upload or Add Item."}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
}
