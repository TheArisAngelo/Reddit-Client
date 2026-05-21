import React, { useMemo } from "react";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  BarChart,
  Bar,
  ResponsiveContainer,
} from "recharts";

const COLORS = [
  "#7c3aed",
  "#4f46e5",
  "#34d399",
  "#fb7185",
  "#fbbf24",
  "#60a5fa",
  "#c084fc",
  "#f472b6",
];

function currency(amount) {
  return `₱${Math.round(Number(amount || 0))}`;
}

export default function ChartsTab({ transactions, currentBalance, darkMode }) {
  const axisColor = darkMode ? "#94a3b8" : "#64748b";
  const gridColor = darkMode
    ? "rgba(148,163,184,0.1)"
    : "rgba(100,116,139,0.15)";

  // Pie Chart
  const pieData = useMemo(() => {
    const categoryTotals = transactions
      .filter((t) => t.type === "expense")
      .reduce((acc, t) => {
        acc[t.category] = (acc[t.category] || 0) + t.amount;
        return acc;
      }, {});

    return Object.entries(categoryTotals).map(([name, value]) => ({
      name,
      value,
    }));
  }, [transactions]);

  // Line Chart
  const lineData = useMemo(() => {
    const sorted = [...transactions].sort(
      (a, b) => new Date(a.date) - new Date(b.date),
    );

    let runningBalance = 0;
    return sorted.map((t) => {
      runningBalance += t.type === "income" ? t.amount : -t.amount;
      return {
        date: t.date,
        balance: runningBalance,
      };
    });
  }, [transactions]);

  // Bar Chart
  const barData = useMemo(() => {
    const monthMap = {};

    transactions.forEach((t) => {
      const date = new Date(t.date);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
      const label = date.toLocaleString("default", {
        month: "short",
        year: "numeric",
      });

      if (!monthMap[key]) {
        monthMap[key] = { month: label, income: 0, expenses: 0 };
      }

      if (t.type === "income") {
        monthMap[key].income += t.amount;
      } else {
        monthMap[key].expenses += t.amount;
      }
    });

    return Object.values(monthMap).sort((a, b) =>
      a.month.localeCompare(b.month),
    );
  }, [transactions]);

  const isEmpty = transactions.length === 0;

  return (
    <section className="panel-card">
      <h2>Visualizations</h2>

      {isEmpty ? (
        <p className="empty-text">
          No data yet. Add transactions to see your charts.
        </p>
      ) : (
        <div className="charts-grid">
          <div className="chart-card">
            <h3 className="chart-title">Spending by Category</h3>
            {pieData.length === 0 ? (
              <p className="empty-text">No expense data yet.</p>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    dataKey="value"
                    label={({ name, percent }) =>
                      `${name} ${(percent * 100).toFixed(0)}%`
                    }
                  >
                    {pieData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>

          <div className="chart-card">
            <h3 className="chart-title">Balance Over Time</h3>
            {lineData.length === 0 ? (
              <p className="empty-text">No transaction data yet.</p>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={lineData}>
                  <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                  <XAxis
                    dataKey="date"
                    tick={{ fill: "axisColor", fontSize: 12 }}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fill: "axisColor", fontSize: 12 }}
                    tickLine={false}
                    tickFormatter={(v) => `₱${v}`}
                  />
                  <Tooltip formatter={(value) => currency(value)} />
                  <Line
                    type="monotone"
                    dataKey="balance"
                    stroke="#7c3aed"
                    strokeWidth={2.5}
                    dot={{ fill: "#7c3aed", r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>

          <div className="chart-card chart-card-full">
            <h3 className="chart-title">Income vs Expenses per Month</h3>
            {barData.length === 0 ? (
              <p className="empty-text">No monthly data yet.</p>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={barData}>
                  <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                  <XAxis
                    dataKey="month"
                    tick={{ fill: "#94a3b8", fontSize: 12 }}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fill: "#94a3b8", fontSize: 12 }}
                    tickLine={false}
                    tickFormatter={(v) => `₱${v}`}
                  />
                  <Tooltip formatter={(value) => currency(value)} />
                  <Legend />
                  <Bar
                    dataKey="income"
                    fill="#34d399"
                    radius={[6, 6, 0, 0]}
                    name="Income"
                  />
                  <Bar
                    dataKey="expenses"
                    fill="#fb7185"
                    radius={[6, 6, 0, 0]}
                    name="Expenses"
                  />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
