"use client";

import { useState, useEffect, useRef } from "react";

interface QueueState {
  currentNumber: number;
  lastTicket: number;
}

type TicketStatus = "pending" | "processing" | "completed" | "cancelled";

interface TicketInfo {
  ticketNumber: number;
  status: TicketStatus;
  note: string;
}

interface TicketListResponse {
  tickets: TicketInfo[];
}

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
  const [state, setState] = useState<QueueState>({ currentNumber: 0, lastTicket: 0 });
  const [tickets, setTickets] = useState<TicketInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingTicket, setEditingTicket] = useState<number | null>(null);
  const [editStatus, setEditStatus] = useState<TicketStatus>("pending");
  const [editNote, setEditNote] = useState<string>("");
  const editingTicketRef = useRef<number | null>(null);

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
  }, []);

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
        throw new Error("更新失敗");
      }

      await fetchTickets();
      cancelEdit();
    } catch (error) {
      console.error("Failed to update ticket:", error);
      alert("更新失敗，請重試");
    } finally {
      setLoading(false);
    }
  };

  const waitingCount = state.lastTicket - state.currentNumber;
  const isCurrentNumber = (ticketNumber: number) => ticketNumber === state.currentNumber;
  const isCalled = (ticketNumber: number) => ticketNumber <= state.currentNumber;

  // Sort tickets in descending order (newest first)
  const sortedTickets = [...tickets].sort((a, b) => b.ticketNumber - a.ticketNumber);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-3 md:p-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6 md:mb-8 text-center">
          <h1 className="text-2xl md:text-4xl font-bold text-gray-900 mb-2">管理員控制台</h1>
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
                          onClick={() => saveEdit(ticket.ticketNumber)}
                          disabled={loading}
                          className="flex-1 rounded-lg bg-blue-600 px-3 md:px-4 py-2 text-sm md:text-base text-white font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                          儲存
                        </button>
                        <button
                          onClick={cancelEdit}
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
                        <div className="flex-1">
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
                        <button
                          onClick={() => startEdit(ticket)}
                          className="rounded-lg bg-blue-600 px-3 md:px-4 py-1.5 md:py-2 text-xs md:text-sm text-white font-medium hover:bg-blue-700 transition-colors whitespace-nowrap"
                        >
                          編輯
                        </button>
                      </div>

                      {ticket.note && (
                        <div className="mt-3 p-2 md:p-3 bg-gray-50 rounded-lg border-l-4 border-blue-500">
                          <p className="text-xs md:text-sm font-medium text-gray-700 mb-1">備註</p>
                          <p className="text-sm md:text-base text-gray-900 break-words whitespace-pre-wrap">
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
    </div>
  );
}
