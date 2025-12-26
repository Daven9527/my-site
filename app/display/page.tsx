"use client";

import { useState, useEffect } from "react";

interface QueueState {
  currentNumber: number;
  lastTicket: number;
}

export default function DisplayPage() {
  const [state, setState] = useState<QueueState>({ currentNumber: 0, lastTicket: 0 });

  useEffect(() => {
    const fetchState = async () => {
      try {
        const res = await fetch("/api/state");
        const data = await res.json();
        setState(data);
      } catch (error) {
        console.error("Failed to fetch state:", error);
      }
    };

    // Initial fetch
    fetchState();

    // Polling every 1 second
    const interval = setInterval(fetchState, 1000);

    return () => clearInterval(interval);
  }, []);

  const nextNumber = state.currentNumber < state.lastTicket ? state.currentNumber + 1 : null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 flex items-center justify-center p-4">
      <div className="w-full max-w-6xl text-center">
        <h1 className="text-2xl md:text-4xl lg:text-5xl font-bold text-white mb-6 md:mb-12">目前叫號</h1>
        
        <div className="bg-white rounded-2xl shadow-2xl p-8 md:p-12 lg:p-16 mb-6 md:mb-8">
          <p className="text-xl md:text-2xl lg:text-3xl text-gray-600 mb-4 md:mb-6">現在服務</p>
          <div className="text-6xl md:text-8xl lg:text-9xl font-bold text-blue-600 mb-2 md:mb-4">
            {state.currentNumber === 0 ? "—" : state.currentNumber}
          </div>
        </div>

        {nextNumber && (
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl shadow-xl p-6 md:p-8 lg:p-12">
            <p className="text-lg md:text-xl lg:text-2xl text-gray-300 mb-3 md:mb-4">下一位</p>
            <div className="text-4xl md:text-5xl lg:text-7xl font-bold text-yellow-400">
              {nextNumber}
            </div>
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

