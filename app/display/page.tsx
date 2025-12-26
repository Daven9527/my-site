"use client";

import { useState, useEffect } from "react";

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
  pending: "bg-yellow-500 text-white",
  processing: "bg-blue-500 text-white",
  completed: "bg-green-500 text-white",
  cancelled: "bg-red-500 text-white",
};

export default function DisplayPage() {
  const [state, setState] = useState<QueueState>({ currentNumber: 0, lastTicket: 0 });
  const [tickets, setTickets] = useState<TicketInfo[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch state and tickets in parallel
        const [stateRes, ticketsRes] = await Promise.all([
          fetch("/api/state", { cache: "no-store" }),
          fetch("/api/tickets", { cache: "no-store" }),
        ]);

        const stateData = await stateRes.json();
        const ticketsData: TicketListResponse = await ticketsRes.json();

        setState(stateData);
        setTickets(ticketsData.tickets || []);
      } catch (error) {
        console.error("Failed to fetch data:", error);
      }
    };

    // Initial fetch
    fetchData();

    // Polling every 1 second
    const interval = setInterval(fetchData, 1000);

    return () => clearInterval(interval);
  }, []);

  const nextNumber = state.currentNumber < state.lastTicket ? state.currentNumber + 1 : null;
  
  // Find current ticket info
  const currentTicket = tickets.find((t) => t.ticketNumber === state.currentNumber);

  // Sort tickets in ascending order (oldest first)
  const sortedTickets = [...tickets].sort((a, b) => a.ticketNumber - b.ticketNumber);

  const isCurrentNumber = (ticketNumber: number) => ticketNumber === state.currentNumber;
  const isCalled = (ticketNumber: number) => ticketNumber <= state.currentNumber;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 p-4 md:p-8">
      <div className="w-full max-w-7xl mx-auto">
        {/* 返回主頁按鈕 */}
        <div className="mb-4 md:mb-6 text-center">
          <a
            href="/"
            className="inline-block px-4 md:px-6 py-2 md:py-3 bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-lg text-white font-medium transition-colors text-sm md:text-base"
          >
            返回主頁
          </a>
        </div>

        {/* 目前叫號區塊 */}
        <div className="mb-6 md:mb-8">
          <h1 className="text-2xl md:text-4xl lg:text-5xl font-bold text-white mb-6 md:mb-8 text-center">目前叫號</h1>
          
          <div className="bg-white rounded-2xl shadow-2xl p-6 md:p-12 lg:p-16 mb-6 md:mb-8">
            <p className="text-xl md:text-2xl lg:text-3xl text-gray-600 mb-4 md:mb-6 text-center">現在服務</p>
            <div className="text-6xl md:text-8xl lg:text-9xl font-bold text-blue-600 mb-4 md:mb-6 text-center">
              {state.currentNumber === 0 ? "—" : state.currentNumber}
            </div>
            
            {/* 顯示目前號碼的狀態和備註 */}
            {state.currentNumber > 0 && (
              <div className="mt-6 md:mt-8 space-y-4 md:space-y-5">
                {/* 處理進度 */}
                {currentTicket ? (
                  <div className="flex flex-col items-center gap-3 md:gap-4">
                    <p className="text-base md:text-lg text-gray-600 font-medium">處理進度</p>
                    <div className={`inline-block px-5 md:px-7 py-2.5 md:py-3.5 rounded-full text-base md:text-lg font-semibold ${
                      currentTicket.status === "processing" ? "bg-blue-500 text-white" :
                      currentTicket.status === "completed" ? "bg-green-500 text-white" :
                      currentTicket.status === "cancelled" ? "bg-red-500 text-white" :
                      "bg-yellow-500 text-white"
                    }`}>
                      {statusLabels[currentTicket.status]}
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-3 md:gap-4">
                    <p className="text-base md:text-lg text-gray-600 font-medium">處理進度</p>
                    <div className="inline-block px-5 md:px-7 py-2.5 md:py-3.5 rounded-full text-base md:text-lg font-semibold bg-gray-400 text-white">
                      處理中
                    </div>
                  </div>
                )}
                
                {/* 管理員備註 */}
                {currentTicket?.note && (
                  <div className="mt-4 md:mt-6 p-5 md:p-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border-2 border-blue-200 text-left max-w-3xl mx-auto shadow-md">
                    <div className="flex items-center gap-2 mb-3">
                      <svg className="w-5 h-5 md:w-6 md:h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                      <p className="text-base md:text-lg font-bold text-blue-900">管理員備註</p>
                    </div>
                    <p className="text-sm md:text-base text-gray-800 whitespace-pre-wrap break-words leading-relaxed">
                      {currentTicket.note}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          {nextNumber && (
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl shadow-xl p-4 md:p-6 lg:p-8 mb-4 md:mb-6 text-center">
              <p className="text-lg md:text-xl lg:text-2xl text-gray-300 mb-3 md:mb-4">下一位</p>
              <div className="text-4xl md:text-5xl lg:text-7xl font-bold text-yellow-400">
                {nextNumber}
              </div>
            </div>
          )}

          {state.currentNumber === 0 && state.lastTicket === 0 && (
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl shadow-xl p-6 md:p-8 lg:p-12 text-center">
              <p className="text-lg md:text-xl lg:text-2xl text-gray-300">等待中...</p>
            </div>
          )}
        </div>

        {/* 所有號碼列表 */}
        {sortedTickets.length > 0 && (
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl shadow-xl p-4 md:p-6">
            <h2 className="text-xl md:text-2xl lg:text-3xl font-bold text-white mb-4 md:mb-6 text-center">所有號碼狀態</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 md:gap-4">
              {sortedTickets.map((ticket) => (
                <div
                  key={ticket.ticketNumber}
                  className={`rounded-lg border-2 p-3 md:p-4 transition-all text-center ${
                    isCurrentNumber(ticket.ticketNumber)
                      ? "border-blue-500 bg-blue-500/20 backdrop-blur-sm"
                      : isCalled(ticket.ticketNumber)
                      ? "border-gray-400 bg-gray-500/20 backdrop-blur-sm"
                      : "border-gray-300 bg-white/10 backdrop-blur-sm"
                  }`}
                >
                  <div
                    className={`text-lg md:text-xl font-bold mb-2 ${
                      isCurrentNumber(ticket.ticketNumber)
                        ? "text-blue-300"
                        : isCalled(ticket.ticketNumber)
                        ? "text-gray-300"
                        : "text-white"
                    }`}
                  >
                    #{ticket.ticketNumber}
                  </div>
                  <div className={`inline-block px-2 md:px-3 py-1 rounded-full text-xs md:text-sm font-medium mb-2 ${statusColors[ticket.status]}`}>
                    {statusLabels[ticket.status]}
                  </div>
                  {isCurrentNumber(ticket.ticketNumber) && (
                    <div className="mt-2 px-2 py-1 rounded-full bg-blue-600 text-white text-xs font-medium">
                      目前號碼
                    </div>
                  )}
                  {ticket.note && (
                    <div className="mt-2 p-2 bg-black/20 rounded text-xs text-gray-200 break-words line-clamp-2">
                      {ticket.note}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
