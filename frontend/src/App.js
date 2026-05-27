import React, { useEffect, useState } from "react";
import { Routes, Route, useNavigate } from "react-router-dom";
import "./App.css";

const API = "http://127.0.0.1:8000";

const HOME_ITEMS = [
  { key: "add", label: "Add transaction", path: "/add" },
  { key: "monthly", label: "Monthly spend by category", path: "/monthly" },
  { key: "forecast", label: "Next month forecast", path: "/forecast" },
];

function BackControl() {
  const navigate = useNavigate();
  return (
    <div className="ipBackWrap">
      <button className="ipBackCircle" type="button" onClick={() => navigate("/")}>
        <span className="ipBackArrow" aria-hidden="true">
          ←
        </span>
      </button>
      <button className="ipBackText" type="button" onClick={() => navigate("/")}>
        Back to menu
      </button>
    </div>
  );
}

function IpScreen({ title, showBack = false, children }) {
  return (
    <div className="ipPage">
      <div className="ipShell">
        <div className="ipTitle">{title}</div>

        <div className="ipScreen">
          <div className="ipScreenBar">
            <div className="ipScreenBarTitle">{title}</div>
            {showBack ? <BackControl /> : null}
          </div>

          <div className="ipScreenBody">{children}</div>
        </div>
      </div>
    </div>
  );
}

function Home() {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    function onKeyDown(e) {
      if (e.key === "ArrowDown") {
        setSelectedIndex((i) => Math.min(i + 1, HOME_ITEMS.length - 1));
      } else if (e.key === "ArrowUp") {
        setSelectedIndex((i) => Math.max(i - 1, 0));
      } else if (e.key === "Enter") {
        navigate(HOME_ITEMS[selectedIndex].path);
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [navigate, selectedIndex]);

  return (
    <IpScreen title="Personal AI Tracker" showBack={false}>
      <div className="ipMenu">
        {HOME_ITEMS.map((item, idx) => (
          <div
            key={item.key}
            className={`ipRow ${idx === selectedIndex ? "active" : ""}`}
            onMouseEnter={() => setSelectedIndex(idx)}
          >
            <button className="ipDotBtn" type="button" aria-label={`Open ${item.label}`} onClick={() => navigate(item.path)}>
              <span className="ipDot" aria-hidden="true" />
            </button>

            <div className="ipRowText">{item.label}</div>
          </div>
        ))}
      </div>

      <div className="ipHint">Tip: Use ↑/↓ and Enter, or click the circle to open.</div>
    </IpScreen>
  );
}

function AddTransactionPage({ onDataChanged }) {
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("Other");
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));

  const [suggestMethod, setSuggestMethod] = useState(null);
  const [suggestLoading, setSuggestLoading] = useState(false);

  async function suggestCategoryLive(text) {
    const desc = text.trim();
    if (!desc) {
      setSuggestMethod(null);
      return;
    }

    setSuggestLoading(true);
    try {
      const res = await fetch(`${API}/ai/suggest-category`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ description: desc }),
      });

      const data = await res.json();
      if (data?.category) setCategory(data.category);
      if (data?.method) setSuggestMethod(data.method);
    } catch (err) {
      console.error("Suggest category error:", err);
    } finally {
      setSuggestLoading(false);
    }
  }

  async function addTransaction(e) {
    e.preventDefault();

    const payload = {
      description: description.trim(),
      amount: parseFloat(amount),
      category,
      date,
    };

    const res = await fetch(`${API}/transactions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      alert("Failed to add transaction. Check backend logs.");
      return;
    }

    setDescription("");
    setAmount("");
    setCategory("Other");
    setDate(new Date().toISOString().slice(0, 10));
    setSuggestMethod(null);

    if (onDataChanged) await onDataChanged();
  }

  return (
    <IpScreen title="Add transaction" showBack={true}>
      <form className="ipForm" onSubmit={addTransaction}>
        <div className="ipField">
          <div className="ipLabel">Description</div>
          <input
            className="ipInput"
            placeholder="e.g. McDonald's meal, INA fuel, Netflix..."
            value={description}
            onChange={(e) => {
              const value = e.target.value;
              setDescription(value);

              if (window._suggestTimer) clearTimeout(window._suggestTimer);
              window._suggestTimer = setTimeout(() => suggestCategoryLive(value), 350);
            }}
            required
          />
          <div className="ipSmall">
            {suggestLoading
              ? "Predicting category…"
              : suggestMethod
              ? `Suggested by: ${suggestMethod.toUpperCase()}`
              : "Start typing to auto-suggest category."}
          </div>
        </div>

        <div className="ipGrid3">
          <div className="ipField">
            <div className="ipLabel">Amount</div>
            <input
              className="ipInput"
              type="number"
              step="0.01"
              placeholder="e.g. 25.50"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
            />
          </div>

          <div className="ipField">
            <div className="ipLabel">Category</div>
            <select className="ipInput" value={category} onChange={(e) => setCategory(e.target.value)}>
              <option>Food</option>
              <option>Transport</option>
              <option>Housing</option>
              <option>Entertainment</option>
              <option>Other</option>
            </select>
          </div>

          <div className="ipField">
            <div className="ipLabel">Date</div>
            <input className="ipInput" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>
        </div>

        <div className="ipActions">
          <button className="ipPrimary" type="submit">
            Add
          </button>
        </div>
      </form>
    </IpScreen>
  );
}

function MonthlyPage({ transactions, monthlySummary, selectedMonth, setSelectedMonth, refreshMonthly }) {
  return (
    <IpScreen title="Monthly spend" showBack={true}>
      <div className="ipSection">
        <div className="ipRowInline">
          <div className="ipLabelInline">Month:</div>
          <input
            className="ipInput ipMonth"
            type="month"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
          />
          <button className="ipSecondary" type="button" onClick={refreshMonthly}>
            Refresh
          </button>
        </div>

        {!monthlySummary ? (
          <div className="ipSmall">Loading…</div>
        ) : monthlySummary.totals.length === 0 ? (
          <div className="ipSmall">No transactions in {monthlySummary.month}.</div>
        ) : (
          <table className="ipTable">
            <thead>
              <tr>
                <th>Category</th>
                <th style={{ textAlign: "right" }}>Total</th>
              </tr>
            </thead>
            <tbody>
              {monthlySummary.totals.map((row) => (
                <tr key={row.category}>
                  <td>{row.category}</td>
                  <td style={{ textAlign: "right" }}>{row.total.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="ipDivider" />

      <div className="ipSection">
        <div className="ipSectionTitle">All transactions</div>

        {transactions.length === 0 ? (
          <div className="ipSmall">No transactions yet.</div>
        ) : (
          <div className="ipTxList">
            {transactions.map((t) => (
              <div key={t.id} className="ipTxItem">
                <div>
                  <div className="ipTxTitle">{t.description}</div>
                  <div className="ipSmall">
                    {t.date} • {t.category}
                  </div>
                </div>
                <div className="ipTxAmount">{(t.amount ?? 0).toFixed(2)}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </IpScreen>
  );
}

function trendEmoji(direction) {
  if (direction === "up") return "📈";
  if (direction === "down") return "📉";
  return "➡️";
}

function ForecastPage({ forecast, refreshForecast }) {
  return (
    <IpScreen title="Next month forecast" showBack={true}>
      <div className="ipRowInline" style={{ marginBottom: 14 }}>
        <button className="ipSecondary" type="button" onClick={refreshForecast}>
          Refresh
        </button>
        <div className="ipSmall">Based on last 3 months (weighted average).</div>
      </div>

      {!forecast ? (
        <div className="ipSmall">Loading…</div>
      ) : forecast.categories.length === 0 ? (
        <div className="ipSmall">Not enough data yet. Add transactions across different months.</div>
      ) : (
        <div className="ipForecastList">
          {forecast.categories.map((c) => (
            <div key={c.category} className="ipForecastRow">
              <div>
                <div className="ipTxTitle">{c.category}</div>
                <div className="ipSmall">
                  Trend:{" "}
                  {c.trend_pct_vs_last_month === null
                    ? "—"
                    : `${trendEmoji(c.trend_direction)} ${c.trend_pct_vs_last_month}%`}
                </div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div className="ipTxAmount">{c.forecast_next_month.toFixed(2)}</div>
                <div className="ipSmall">last: {c.last_month_total.toFixed(2)}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </IpScreen>
  );
}

function App() {
  const [transactions, setTransactions] = useState([]);
  const [selectedMonth, setSelectedMonth] = useState(() => new Date().toISOString().slice(0, 7));
  const [monthlySummary, setMonthlySummary] = useState(null);
  const [forecast, setForecast] = useState(null);

  async function loadTransactions() {
    const res = await fetch(`${API}/transactions`);
    const data = await res.json();
    setTransactions(data);
  }

  async function loadMonthlySummary(month) {
    const res = await fetch(`${API}/summary/monthly-by-category?month=${month}`);
    const data = await res.json();
    setMonthlySummary(data);
  }

  async function loadForecast() {
    const res = await fetch(`${API}/forecast/categories?months=3`);
    const data = await res.json();
    setForecast(data);
  }

  async function refreshAll() {
    await loadTransactions();
    await loadMonthlySummary(selectedMonth);
    await loadForecast();
  }

  useEffect(() => {
    refreshAll().catch(console.error);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    loadMonthlySummary(selectedMonth).catch(console.error);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedMonth]);

  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/add" element={<AddTransactionPage onDataChanged={refreshAll} />} />
      <Route
        path="/monthly"
        element={
          <MonthlyPage
            transactions={transactions}
            monthlySummary={monthlySummary}
            selectedMonth={selectedMonth}
            setSelectedMonth={setSelectedMonth}
            refreshMonthly={() => loadMonthlySummary(selectedMonth).catch(console.error)}
          />
        }
      />
      <Route
        path="/forecast"
        element={<ForecastPage forecast={forecast} refreshForecast={() => loadForecast().catch(console.error)} />}
      />
    </Routes>
  );
}

export default App;
