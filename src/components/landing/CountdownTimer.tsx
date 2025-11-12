import { useState, useEffect } from "react";

interface CountdownTimerProps {
  hours?: number;
}

export function CountdownTimer({ hours = 48 }: CountdownTimerProps) {
  const [timeLeft, setTimeLeft] = useState({
    hours: hours,
    minutes: 0,
    seconds: 0,
  });

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev.seconds > 0) {
          return { ...prev, seconds: prev.seconds - 1 };
        } else if (prev.minutes > 0) {
          return { ...prev, minutes: prev.minutes - 1, seconds: 59 };
        } else if (prev.hours > 0) {
          return { hours: prev.hours - 1, minutes: 59, seconds: 59 };
        }
        return prev;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  return (
    <div className="flex gap-4 justify-center items-center">
      <div className="text-center">
        <div className="bg-white/20 backdrop-blur-sm rounded-lg p-3 min-w-[70px]">
          <div className="text-3xl font-bold">{String(timeLeft.hours).padStart(2, "0")}</div>
        </div>
        <div className="text-xs mt-1 opacity-80">Horas</div>
      </div>
      <div className="text-3xl font-bold">:</div>
      <div className="text-center">
        <div className="bg-white/20 backdrop-blur-sm rounded-lg p-3 min-w-[70px]">
          <div className="text-3xl font-bold">{String(timeLeft.minutes).padStart(2, "0")}</div>
        </div>
        <div className="text-xs mt-1 opacity-80">Minutos</div>
      </div>
      <div className="text-3xl font-bold">:</div>
      <div className="text-center">
        <div className="bg-white/20 backdrop-blur-sm rounded-lg p-3 min-w-[70px]">
          <div className="text-3xl font-bold">{String(timeLeft.seconds).padStart(2, "0")}</div>
        </div>
        <div className="text-xs mt-1 opacity-80">Segundos</div>
      </div>
    </div>
  );
}
