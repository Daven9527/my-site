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

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 flex items-center justify-center p-4">
      <div className="w-full max-w-6xl text-center">
        <h1 className="text-2xl md:text-4xl lg:text-5xl font-bold text-white mb-6 md:mb-12">目前叫號</h1>
        
        <div className="bg-white rounded-2xl shadow-2xl p-8 md:p-12 lg:p-16 mb-6 md:mb-8">
          <p className="text-xl md:text-2xl lg:text-3xl text-gray-600 mb-4 md:mb-6">現在服務</p>
          <div className="text-6xl md:text-8xl lg:text-9xl font-bold text-blue-600 mb-4 md:mb-6">
            {state.currentNumber === 0 ? "—" : state.currentNumber}
          </div>
          
          {/* 顯示目前號碼的狀態 */}
          {state.currentNumber > 0 && currentTicket && (
            <div className="mt-4 md:mt-6">
              <div className="inline-block px-4 md:px-6 py-2 md:py-3 rounded-full text-sm md:text-base font-medium mb-3 md:mb-4 bg-blue-100 text-blue-800">
                狀態：{statusLabels[currentTicket.status]}
              </div>
              {currentTicket.note && (
                <div className="mt-4 p-4 md:p-5 bg-gray-50 rounded-lg border-l-4 border-blue-500 text-left max-w-2xl mx-auto">
                  <p className="text-sm md:text-base font-semibold text-gray-700 mb-2">備註</p>
                  <p className="text-sm md:text-base text-gray-900 whitespace-pre-wrap break-words">
                    {currentTicket.note}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {nextNumber && (
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl shadow-xl p-6 md:p-8 lg:p-12 mb-4 md:mb-6">
            <p className="text-lg md:text-xl lg:text-2xl text-gray-300 mb-3 md:mb-4">下一位</p>
            <div className="text-4xl md:text-5xl lg:text-7xl font-bold text-yellow-400">
              {nextNumber}
            </div>
            {/* 顯示下一位號碼的狀態 */}
            {(() => {
              const nextTicket = tickets.find((t) => t.ticketNumber === nextNumber);
              return nextTicket && nextTicket.status !== "pending" && (
                <div className="mt-4">
                  <div className="inline-block px-3 md:px-4 py-1.5 md:py-2 rounded-full text-xs md:text-sm font-medium bg-yellow-100 text-yellow-800">
                    狀態：{statusLabels[nextTicket.status]}
                  </div>
                </div>
              );
            })()}
          </div>
        )}

        {state.currentNumber === 0 && state.lastTicket === 0 && (
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl shadow-xl p-6 md:p-8 lg:p-12">
            <p className="text-lg md:text-xl lg:text-2xl text-gray-300">等待中...</p>
          </div>
        )}
      </div>
    </div>
  );
}
