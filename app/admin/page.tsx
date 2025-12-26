"use client";

import { useState, useEffect, useRef } from "react";

interface QueueState {
  currentNumber: number;
  lastTicket: number;
}

type TicketStatus = "pending" | "processing" | "completed" | "cancelled";

interface TicketInfo {
  ticketNumber: number;
  customerName?: string;
  customerRequirement?: string;
  machineType?: string;
  startDate?: string;
  status: TicketStatus;
  note: string;
}

interface TicketListResponse {
  tickets: TicketInfo[];
}

const ADMIN_PASSWORD = "Bailey";

const statusLabels: Record<TicketStatus, string> = {
  pending: "等待中",
  processing: "處理中",
  completed: "已完成",
  cancelled: "已取消",
};

const statusColors: Record<TicketStatus, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  processing: "bg-blue-100 text-blue-800",
  completed: "bg-green-100 text-green-800",
  cancelled: "bg-red-100 text-red-800",
};

export default function AdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [state, setState] = useState<QueueState>({ currentNumber: 0, lastTicket: 0 });
  const [tickets, setTickets] = useState<TicketInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingTicket, setEditingTicket] = useState<number | null>(null);
  const [editStatus, setEditStatus] = useState<TicketStatus>("pending");
  const [editNote, setEditNote] = useState<string>("");
  const [viewingTicket, setViewingTicket] = useState<TicketInfo | null>(null);
  const editingTicketRef = useRef<number | null>(null);

  // Check if already authenticated (from sessionStorage)
  useEffect(() => {
    const authStatus = sessionStorage.getItem("adminAuthenticated");
    if (authStatus === "true") {
      setIsAuthenticated(true);
    }
  }, []);

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError("");

    if (password === ADMIN_PASSWORD) {
      setIsAuthenticated(true);
      sessionStorage.setItem("adminAuthenticated", "true");
      setPassword("");
    } else {
      setPasswordError("密碼錯誤，請重試");
      setPassword("");
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    sessionStorage.removeItem("adminAuthenticated");
  };

  const fetchState = async () => {
    try {
      const res = await fetch("/api/state", { cache: "no-store" });
      const data = await res.json();
      setState(data);
    } catch (error) {
      console.error("Failed to fetch state:", error);
    }
  };

  const fetchTickets = async () => {
    try {
      const res = await fetch("/api/tickets", { cache: "no-store" });
      const data: TicketListResponse = await res.json();
      setTickets(data.tickets || []);
    } catch (error) {
      console.error("Failed to fetch tickets:", error);
      setTickets([]);
    }
  };

  useEffect(() => {
    editingTicketRef.current = editingTicket;
  }, [editingTicket]);

  useEffect(() => {
    if (!isAuthenticated) return;

    fetchState();
    fetchTickets();
    const interval = setInterval(() => {
      fetchState();
      // Only update tickets if not currently editing
      if (editingTicketRef.current === null) {
        fetchTickets();
      }
    }, 2000); // 每 2 秒更新一次
    return () => clearInterval(interval);
  }, [isAuthenticated]);

  const handleNext = async () => {
    setLoading(true);
    try {
      await fetch("/api/next", { method: "POST" });
      await fetchState();
      await fetchTickets();
    } catch (error) {
      console.error("Failed to call next:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async () => {
    if (!confirm("確定要重置系統嗎？")) return;
    setLoading(true);
    try {
      await fetch("/api/reset", { method: "POST" });
      await fetchState();
      await fetchTickets();
    } catch (error) {
      console.error("Failed to reset:", error);
    } finally {
      setLoading(false);
    }
  };

  const startEdit = (ticket: TicketInfo) => {
    setEditingTicket(ticket.ticketNumber);
    setEditStatus(ticket.status);
    setEditNote(ticket.note);
  };

  const cancelEdit = () => {
    setEditingTicket(null);
    setEditStatus("pending");
    setEditNote("");
    editingTicketRef.current = null;
  };

  const saveEdit = async (ticketNumber: number) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/ticket/${ticketNumber}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          status: editStatus,
          note: editNote,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "更新失敗");
      }

      // Clear editing state first to allow refresh
      cancelEdit();
      
      // Force refresh tickets to show updated data
      await fetchTickets();
    } catch (error) {
      console.error("Failed to update ticket:", error);
      alert(error instanceof Error ? error.message : "更新失敗，請重試");
    } finally {
      setLoading(false);
    }
  };

  // Password authentication screen
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-xl shadow-lg p-8">
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-6 text-center">管理員登入</h1>
            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                  密碼
                </label>
                <input
                  type="password"
                  id="password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setPasswordError("");
                  }}
                  className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none transition-colors"
                  placeholder="請輸入密碼"
                  autoFocus
                />
              </div>
              {passwordError && (
                <div className="rounded-lg bg-red-50 border border-red-200 p-3">
                  <p className="text-sm text-red-600">{passwordError}</p>
                </div>
              )}
              <button
                type="submit"
                className="w-full rounded-lg bg-blue-600 px-6 py-3 text-white font-medium shadow-md hover:bg-blue-700 transition-colors"
              >
                登入
              </button>
            </form>
            <div className="mt-6 text-center">
              <a
                href="/"
                className="text-sm text-blue-600 hover:text-blue-800 underline"
              >
                返回首頁
              </a>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const waitingCount = state.lastTicket - state.currentNumber;
  const isCurrentNumber = (ticketNumber: number) => ticketNumber === state.currentNumber;
  const isCalled = (ticketNumber: number) => ticketNumber <= state.currentNumber;

  // Sort tickets in descending order (newest first)
  const sortedTickets = [...tickets].sort((a, b) => b.ticketNumber - a.ticketNumber);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-3 md:p-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6 md:mb-8 text-center">
          <div className="flex items-center justify-between mb-2">
            <div className="flex-1"></div>
            <h1 className="text-2xl md:text-4xl font-bold text-gray-900 flex-1">管理員控制台</h1>
            <div className="flex-1 flex justify-end">
              <button
                onClick={handleLogout}
                className="rounded-lg bg-gray-600 px-4 py-2 text-sm md:text-base text-white font-medium hover:bg-gray-700 transition-colors"
              >
                登出
              </button>
            </div>
          </div>
          <p className="text-sm md:text-base text-gray-600">叫號系統管理</p>
        </div>

        {/* 狀態和操作卡片 */}
        <div className="grid gap-4 md:gap-6 md:grid-cols-2 mb-6 md:mb-8">
          <div className="rounded-xl bg-white p-4 md:p-6 shadow-lg">
            <h2 className="mb-3 md:mb-4 text-lg md:text-xl font-semibold text-gray-800">目前狀態</h2>
            <div className="space-y-3 md:space-y-4">
              <div>
                <p className="text-xs md:text-sm text-gray-600">目前叫到的號碼</p>
                <p className="text-2xl md:text-3xl font-bold text-blue-600">{state.currentNumber}</p>
              </div>
              <div>
                <p className="text-xs md:text-sm text-gray-600">最後發出的票號</p>
                <p className="text-2xl md:text-3xl font-bold text-green-600">{state.lastTicket}</p>
              </div>
              <div>
                <p className="text-xs md:text-sm text-gray-600">候位數量</p>
                <p className="text-2xl md:text-3xl font-bold text-orange-600">{waitingCount}</p>
              </div>
            </div>
          </div>

          <div className="rounded-xl bg-white p-4 md:p-6 shadow-lg">
            <h2 className="mb-3 md:mb-4 text-lg md:text-xl font-semibold text-gray-800">操作</h2>
            <div className="space-y-3 md:space-y-4">
              <a
                href="/ticket"
                className="block w-full text-center rounded-lg bg-blue-600 px-4 md:px-6 py-2.5 md:py-3 text-sm md:text-base text-white font-medium shadow-md hover:bg-blue-700 transition-colors"
              >
                前往抽號頁面
              </a>
              <button
                onClick={handleNext}
                disabled={loading || state.currentNumber >= state.lastTicket}
                className="w-full rounded-lg bg-purple-600 px-4 md:px-6 py-2.5 md:py-3 text-sm md:text-base text-white font-medium shadow-md hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                下一號
              </button>
              <button
                onClick={handleReset}
                disabled={loading}
                className="w-full rounded-lg bg-red-600 px-4 md:px-6 py-2.5 md:py-3 text-sm md:text-base text-white font-medium shadow-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                重置
              </button>
            </div>
          </div>
        </div>

        {/* 票券列表 */}
        <div className="rounded-xl bg-white p-4 md:p-6 shadow-lg">
          <h2 className="mb-4 md:mb-6 text-xl md:text-2xl font-semibold text-gray-800">號碼列表</h2>
          {sortedTickets.length === 0 ? (
            <div className="text-center py-8 md:py-12 text-sm md:text-base text-gray-500">
              目前沒有任何票券
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
              {sortedTickets.map((ticket) => (
                <div
                  key={ticket.ticketNumber}
                  className={`rounded-lg border-2 p-4 md:p-5 transition-all ${
                    isCurrentNumber(ticket.ticketNumber)
                      ? "border-blue-500 bg-blue-50"
                      : isCalled(ticket.ticketNumber)
                      ? "border-gray-300 bg-gray-50"
                      : "border-gray-200 bg-white"
                  }`}
                >
                  {editingTicket === ticket.ticketNumber ? (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between mb-3">
                        <div
                          className={`text-xl md:text-2xl font-bold ${
                            isCurrentNumber(ticket.ticketNumber)
                              ? "text-blue-600"
                              : isCalled(ticket.ticketNumber)
                              ? "text-gray-500"
                              : "text-gray-900"
                          }`}
                        >
                          #{ticket.ticketNumber}
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs md:text-sm font-medium text-gray-700 mb-2">
                          處理進度
                        </label>
                        <select
                          value={editStatus}
                          onChange={(e) => setEditStatus(e.target.value as TicketStatus)}
                          className="w-full rounded-lg border border-gray-300 px-3 md:px-4 py-2 text-sm md:text-base focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                        >
                          <option value="pending">等待中</option>
                          <option value="processing">處理中</option>
                          <option value="completed">已完成</option>
                          <option value="cancelled">已取消</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs md:text-sm font-medium text-gray-700 mb-2">
                          備註
                        </label>
                        <textarea
                          value={editNote}
                          onChange={(e) => setEditNote(e.target.value)}
                          rows={3}
                          className="w-full rounded-lg border border-gray-300 px-3 md:px-4 py-2 text-sm md:text-base focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none resize-none"
                          placeholder="輸入備註內容..."
                        />
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            saveEdit(ticket.ticketNumber);
                          }}
                          disabled={loading}
                          className="flex-1 rounded-lg bg-blue-600 px-3 md:px-4 py-2 text-sm md:text-base text-white font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                          儲存
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            cancelEdit();
                          }}
                          disabled={loading}
                          className="flex-1 rounded-lg bg-gray-200 px-3 md:px-4 py-2 text-sm md:text-base text-gray-800 font-medium hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                          取消
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <div className="flex items-start justify-between mb-3">
                        <div 
                          className="flex-1 cursor-pointer"
                          onClick={() => setViewingTicket(ticket)}
                        >
                          <div
                            className={`text-xl md:text-2xl font-bold mb-2 ${
                              isCurrentNumber(ticket.ticketNumber)
                                ? "text-blue-600"
                                : isCalled(ticket.ticketNumber)
                                ? "text-gray-500"
                                : "text-gray-900"
                            }`}
                          >
                            #{ticket.ticketNumber}
                          </div>
                          <div className="flex flex-wrap items-center gap-2">
                            {isCurrentNumber(ticket.ticketNumber) && (
                              <span className="px-2 py-1 rounded-full bg-blue-600 text-white text-xs font-medium whitespace-nowrap">
                                目前號碼
                              </span>
                            )}
                            <span
                              className={`px-2 py-1 rounded-full text-xs font-medium whitespace-nowrap ${statusColors[ticket.status]}`}
                            >
                              {statusLabels[ticket.status]}
                            </span>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setViewingTicket(ticket);
                            }}
                            className="rounded-lg bg-green-600 px-3 md:px-4 py-1.5 md:py-2 text-xs md:text-sm text-white font-medium hover:bg-green-700 transition-colors whitespace-nowrap"
                          >
                            查看
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              startEdit(ticket);
                            }}
                            className="rounded-lg bg-blue-600 px-3 md:px-4 py-1.5 md:py-2 text-xs md:text-sm text-white font-medium hover:bg-blue-700 transition-colors whitespace-nowrap"
                          >
                            編輯
                          </button>
                        </div>
                      </div>

                      {ticket.note && (
                        <div className="mt-3 p-2 md:p-3 bg-gray-50 rounded-lg border-l-4 border-blue-500">
                          <p className="text-xs md:text-sm font-medium text-gray-700 mb-1">備註</p>
                          <p className="text-sm md:text-base text-gray-900 break-words whitespace-pre-wrap line-clamp-2">
                            {ticket.note}
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="mt-4 md:mt-6 text-center">
          <a
            href="/"
            className="text-sm md:text-base text-blue-600 hover:text-blue-800 underline"
          >
            返回首頁
          </a>
        </div>
      </div>

      {/* 彈窗：顯示完整票券資訊 */}
      {viewingTicket && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
          onClick={() => setViewingTicket(null)}
        >
          <div
            className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 md:p-8">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl md:text-3xl font-bold text-gray-900">
                  號碼 #{viewingTicket.ticketNumber} 詳細資訊
                </h2>
                <button
                  onClick={() => setViewingTicket(null)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="space-y-4 md:space-y-5">
                {/* 狀態 */}
                <div>
                  <p className="text-sm md:text-base font-medium text-gray-600 mb-2">處理進度</p>
                  <div className={`inline-block px-4 md:px-5 py-2 md:py-2.5 rounded-full text-sm md:text-base font-semibold ${statusColors[viewingTicket.status]}`}>
                    {statusLabels[viewingTicket.status]}
                  </div>
                </div>

                {/* 客戶名稱 */}
                {viewingTicket.customerName && (
                  <div>
                    <p className="text-sm md:text-base font-medium text-gray-600 mb-2">客戶名稱</p>
                    <p className="text-base md:text-lg text-gray-900 break-words">{viewingTicket.customerName}</p>
                  </div>
                )}

                {/* 客戶需求 */}
                {viewingTicket.customerRequirement && (
                  <div>
                    <p className="text-sm md:text-base font-medium text-gray-600 mb-2">客戶需求</p>
                    <p className="text-base md:text-lg text-gray-900 break-words whitespace-pre-wrap bg-gray-50 p-3 md:p-4 rounded-lg">
                      {viewingTicket.customerRequirement}
                    </p>
                  </div>
                )}

                {/* 預計使用機種 */}
                {viewingTicket.machineType && (
                  <div>
                    <p className="text-sm md:text-base font-medium text-gray-600 mb-2">預計使用機種</p>
                    <p className="text-base md:text-lg text-gray-900 break-words">{viewingTicket.machineType}</p>
                  </div>
                )}

                {/* 起始日期 */}
                {viewingTicket.startDate && (
                  <div>
                    <p className="text-sm md:text-base font-medium text-gray-600 mb-2">起始日期</p>
                    <p className="text-base md:text-lg text-gray-900">{viewingTicket.startDate}</p>
                  </div>
                )}

                {/* 管理員備註 */}
                {viewingTicket.note && (
                  <div>
                    <p className="text-sm md:text-base font-medium text-gray-600 mb-2">管理員備註</p>
                    <p className="text-base md:text-lg text-gray-900 break-words whitespace-pre-wrap bg-blue-50 p-3 md:p-4 rounded-lg border-l-4 border-blue-500">
                      {viewingTicket.note}
                    </p>
                  </div>
                )}

                {/* 如果沒有客戶資訊，顯示提示 */}
                {!viewingTicket.customerName && !viewingTicket.customerRequirement && !viewingTicket.machineType && !viewingTicket.startDate && (
                  <div className="text-center py-8 text-gray-500">
                    <p className="text-sm md:text-base">此票券沒有客戶資訊</p>
                  </div>
                )}
              </div>

              <div className="mt-6 md:mt-8 flex gap-3">
                <button
                  onClick={() => {
                    setViewingTicket(null);
                    startEdit(viewingTicket);
                  }}
                  className="flex-1 rounded-lg bg-blue-600 px-4 md:px-6 py-2.5 md:py-3 text-sm md:text-base text-white font-medium hover:bg-blue-700 transition-colors"
                >
                  編輯狀態與備註
                </button>
                <button
                  onClick={() => setViewingTicket(null)}
                  className="flex-1 rounded-lg bg-gray-200 px-4 md:px-6 py-2.5 md:py-3 text-sm md:text-base text-gray-800 font-medium hover:bg-gray-300 transition-colors"
                >
                  關閉
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
