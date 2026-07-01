import React, { createContext, useContext, useState, useEffect } from "react";

const API = `${process.env.REACT_APP_API_URL}/api/budget`;
const AUTH_STORAGE_KEY = "budget-tracker-auth";
const CACHE_KEY = "budget-data-cache";
const CACHE_TTL = 5 * 60 * 1000;

const DEFAULT_DATA = {
  currentBalance: 0,
  transactions: [],
  budgets: [],
  savingsGoals: [],
};

function isTokenExpired(token) {
  if (!token) return true;
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    return payload.exp * 1000 < Date.now();
  } catch {
    return true;
  }
}

function getStoredAuth() {
  const saved = sessionStorage.getItem(AUTH_STORAGE_KEY);
  try {
    const parsed = saved ? JSON.parse(saved) : null;
    if (parsed?.isLoggedIn && isTokenExpired(parsed.token)) {
      sessionStorage.removeItem(AUTH_STORAGE_KEY);
      return { isLoggedIn: false, username: "" };
    }
    return parsed?.isLoggedIn ? parsed : { isLoggedIn: false, username: "" };
  } catch {
    return { isLoggedIn: false, username: "" };
  }
}

export function getCachedBudgetData() {
  try {
    const item = sessionStorage.getItem(CACHE_KEY);
    if (!item) return null;
    const { data, timestamp } = JSON.parse(item);
    if (Date.now() - timestamp > CACHE_TTL) {
      sessionStorage.removeItem(CACHE_KEY);
      return null;
    }
    return data;
  } catch {
    return null;
  }
}

export function setCachedBudget(data) {
  try {
    sessionStorage.setItem(
      CACHE_KEY,
      JSON.stringify({ data, timestamp: Date.now() }),
    );
  } catch {}
}

export function clearBudgetCache() {
  sessionStorage.removeItem(CACHE_KEY);
}

const GlobalContext = createContext();

export const GlobalProvider = ({ children }) => {
  const [auth, setAuth] = useState(getStoredAuth);
  const [darkMode, setDarkMode] = useState(true);
  const [budgetData, setBudgetData] = useState(DEFAULT_DATA);

  useEffect(() => {
    setAuth(getStoredAuth());
  }, []);

  useEffect(() => {
    if (!auth?.token) {
      setBudgetData(DEFAULT_DATA);
      return;
    }
    if (isTokenExpired(auth.token)) {
      handleLogout();
      return;
    }

    const cached = getCachedBudgetData();
    if (cached) {
      setBudgetData(cached);
      return;
    }

    fetch(API, { headers: { Authorization: `Bearer ${auth.token}` } })
      .then((r) => {
        if (r.status === 401) {
          handleLogout();
          return null;
        }
        return r.json();
      })
      .then((data) => {
        if (!data) return;
        const safe = {
          currentBalance: data.currentBalance ?? 0,
          transactions: Array.isArray(data.transactions)
            ? data.transactions
            : [],
          budgets: Array.isArray(data.budgets) ? data.budgets : [],
          savingsGoals: Array.isArray(data.savingsGoals)
            ? data.savingsGoals
            : [],
        };
        setBudgetData(safe);
        setCachedBudget(safe);
      })
      .catch(() => setBudgetData(DEFAULT_DATA));
  }, [auth?.token]);

  const handleLogin = (authData) => {
    clearBudgetCache();
    sessionStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(authData));
    setAuth(authData);
  };

  const handleLogout = () => {
    clearBudgetCache();
    sessionStorage.removeItem(AUTH_STORAGE_KEY);
    setAuth({ isLoggedIn: false, username: "", token: "" });
    setBudgetData(DEFAULT_DATA);
  };

  const toggleDarkMode = () => setDarkMode((prev) => !prev);

  const value = {
    auth,
    handleLogin,
    handleLogout,
    isTokenExpired,
    darkMode,
    toggleDarkMode,
    budgetData,
    setBudgetData,
    setCachedBudget,
    clearBudgetCache,
    API,
  };

  return (
    <GlobalContext.Provider value={value}>{children}</GlobalContext.Provider>
  );
};

export const useGlobalContext = () => {
  const context = useContext(GlobalContext);
  if (!context) {
    throw new Error("useGlobalContext must be used within a GlobalProvider");
  }
  return context;
};
