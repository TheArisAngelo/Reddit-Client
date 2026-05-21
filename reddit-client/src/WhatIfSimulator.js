import React, { useMemo, useState } from "react";
import { useLocation, Link } from "react-router-dom";

const FREQ_OPTIONS = [
  { label: "Every day", value: 30 },
  { label: "Twice a week", value: 8.6 },
  { label: "3× a week", value: 13 },
  { label: "Once a week", value: 4.3 },
  { label: "Once a month", value: 1 },
];

const CATEGORY_ICONS = {
  Food: "🍔",
  Transport: "🚗",
  Shopping: "🛍️",
  Entertainment: "🎬",
  Health: "💊",
  Education: "📚",
  Utilities: "💡",
  Vacation: "✈️",
  Other: "📦",
};

function fmt(n) {
  return "₱" + Math.round(n).toLocaleString();
}

function deriveHabits(transactions) {
  const expensesByCategory = {};

  transactions
    .filter((t) => t.type === "expense")
    .forEach((t) => {
      const cat = t.category || "Other";
      if (!expensesByCategory[cat]) expensesByCategory[cat] = [];
      expensesByCategory[cat].push(t.amount);
    });

  return Object.entries(expensesByCategory)
    .filter(([, amounts]) => amounts.length >= 1)
    .map(([category, amounts]) => {
      const avg = Math.round(
        amounts.reduce((a, b) => a + b, 0) / amounts.length,
      );
      const count = amounts.length;
      let freqIndex = 4;
      if (count >= 20) freqIndex = 0;
      else if (count >= 12) freqIndex = 2;
      else if (count >= 6) freqIndex = 3;
      else if (count >= 3) freqIndex = 1;

      return { category, avg, count, freqIndex };
    })
    .sort((a, b) => b.avg * b.count - a.avg * a.count)
    .slice(0, 5);
}

export default function WhatIfSimulator() {
  // Read transactions passed from the sidebar Link via route state
  const location = useLocation();
  const transactions = location.state?.transactions || [];

  const habits = useMemo(() => deriveHabits(transactions), [transactions]);
  const hasHabits = habits.length > 0;

  const firstHabit = habits[0];
  const [habitName, setHabitName] = useState(
    firstHabit ? firstHabit.category : "Daily Coffee",
  );
  const [cost, setCost] = useState(firstHabit ? firstHabit.avg : 150);
  const [freqIndex, setFreqIndex] = useState(
    firstHabit ? firstHabit.freqIndex : 0,
  );
  const [reducePercent, setReducePercent] = useState(100);
  const [activeChip, setActiveChip] = useState(
    firstHabit ? firstHabit.category : null,
  );

  function loadHabit(habit) {
    setHabitName(habit.category);
    setCost(habit.avg);
    setFreqIndex(habit.freqIndex);
    setReducePercent(100);
    setActiveChip(habit.category);
  }

  const perMonth = cost * FREQ_OPTIONS[freqIndex].value * (reducePercent / 100);
  const week = perMonth / 4;
  const sixMo = perMonth * 6;
  const year = perMonth * 12;

  const insightText = useMemo(() => {
    const verb = reducePercent === 100 ? "Cutting" : "Reducing";
    const suffix =
      year >= 50000
        ? "— enough for a trip abroad ✈️"
        : year >= 20000
          ? "— a solid emergency fund starter 🛡️"
          : year >= 10000
            ? "— great head start on any savings goal 💪"
            : "— small cuts compound over time 📈";
    return `${verb} ${habitName.toLowerCase()} by ${reducePercent}% saves you ${fmt(year)} a year ${suffix}`;
  }, [habitName, reducePercent, year]);

  return (
    <div className="simulator-page">
      <section className="simulator-wrap">
        <div className="simulator-header">
          <div>
            <h2 className="simulator-title">💡 What-if Simulator</h2>
            <p className="simulator-sub">
              {hasHabits
                ? "Based on your real spending — adjust a habit and see the impact."
                : "No transactions yet. Enter a habit manually below."}
            </p>
          </div>
        </div>

        {/* Auto-suggest chips from real transactions */}
        {hasHabits && (
          <div className="simulator-chips">
            <span className="chips-label">Your spending habits:</span>
            {habits.map((h) => (
              <button
                key={h.category}
                className={`sim-chip ${activeChip === h.category ? "active" : ""}`}
                onClick={() => loadHabit(h)}
              >
                <span>{CATEGORY_ICONS[h.category] || "📦"}</span>
                {h.category}
                <span className="chip-avg">{fmt(h.avg)} avg</span>
              </button>
            ))}
            <button
              className={`sim-chip ${activeChip === null ? "active" : ""}`}
              onClick={() => {
                setHabitName("");
                setCost(0);
                setFreqIndex(0);
                setReducePercent(100);
                setActiveChip(null);
              }}
            >
              ✏️ Custom
            </button>
          </div>
        )}

        <div className="simulator-body">
          {/* Input panel */}
          <div className="sim-panel">
            <h3 className="sim-panel-title">Habit details</h3>

            <div className="sim-field-row">
              <div className="sim-field">
                <label>Habit name</label>
                <input
                  type="text"
                  value={habitName}
                  onChange={(e) => setHabitName(e.target.value)}
                  placeholder="e.g. Daily coffee"
                />
              </div>
              <div className="sim-field">
                <label>Cost per instance (₱)</label>
                <input
                  type="number"
                  value={cost}
                  min={1}
                  onChange={(e) => setCost(Number(e.target.value))}
                />
              </div>
            </div>

            <div className="sim-field">
              <label>Frequency</label>
              <select
                value={freqIndex}
                onChange={(e) => setFreqIndex(Number(e.target.value))}
              >
                {FREQ_OPTIONS.map((f, i) => (
                  <option key={f.label} value={i}>
                    {f.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="sim-slider-wrap">
              <div className="sim-slider-label">
                <span>Cut by</span>
                <strong>
                  {reducePercent}%{reducePercent === 100 ? " (full skip)" : ""}
                </strong>
              </div>
              <input
                type="range"
                min={10}
                max={100}
                step={10}
                value={reducePercent}
                onChange={(e) => setReducePercent(Number(e.target.value))}
                className="sim-slider"
              />
              <p className="sim-slider-note">
                Drag left to simulate reducing instead of fully cutting.
              </p>
            </div>
          </div>

          {/* Results panel */}
          <div className="sim-panel sim-results">
            <h3 className="sim-panel-title">Projected savings</h3>

            <div className="sim-result-grid">
              {[
                { label: "1 week", value: week },
                { label: "1 month", value: perMonth },
                { label: "6 months", value: sixMo, highlight: true },
                { label: "1 year", value: year },
              ].map(({ label, value, highlight }) => (
                <div
                  key={label}
                  className={`sim-result-card ${highlight ? "highlighted" : ""}`}
                >
                  <span className="result-period">{label}</span>
                  <span className="result-amount">{fmt(value)}</span>
                </div>
              ))}
            </div>

            {/* Bar chart */}
            <div className="sim-bars">
              {[
                { label: "Week", value: week },
                { label: "Month", value: perMonth },
                { label: "6 mo", value: sixMo },
                { label: "Year", value: year },
              ].map(({ label, value }) => (
                <div key={label} className="sim-bar-row">
                  <span className="sim-bar-label">{label}</span>
                  <div className="sim-bar-track">
                    <div
                      className="sim-bar-fill"
                      style={{
                        width:
                          year > 0
                            ? `${Math.max(2, (value / year) * 100)}%`
                            : "2%",
                      }}
                    />
                  </div>
                  <span className="sim-bar-val">{fmt(value)}</span>
                </div>
              ))}
            </div>

            <div className="sim-insight">
              <span className="insight-icon">💡</span>
              <p>{insightText}</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
