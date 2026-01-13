import { useEffect, useState } from 'react';

interface CountdownTimerProps {
  endTime: number; // Unix timestamp in milliseconds
  onComplete?: () => void;
}

export default function CountdownTimer({ endTime, onComplete }: CountdownTimerProps) {
  const [timeLeft, setTimeLeft] = useState(calculateTimeLeft());

  function calculateTimeLeft() {
    const difference = endTime - Date.now();

    if (difference <= 0) {
      return { days: 0, hours: 0, minutes: 0, seconds: 0, expired: true };
    }

    return {
      days: Math.floor(difference / (1000 * 60 * 60 * 24)),
      hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
      minutes: Math.floor((difference / 1000 / 60) % 60),
      seconds: Math.floor((difference / 1000) % 60),
      expired: false,
    };
  }

  useEffect(() => {
    const timer = setInterval(() => {
      const newTimeLeft = calculateTimeLeft();
      setTimeLeft(newTimeLeft);

      if (newTimeLeft.expired) {
        clearInterval(timer);
        onComplete?.();
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [endTime, onComplete]);

  if (timeLeft.expired) {
    return (
      <div className="text-center py-4">
        <p className="text-arena-accent font-bold text-xl">Tournament Ended!</p>
      </div>
    );
  }

  return (
    <div className="flex justify-center gap-4">
      <TimeUnit value={timeLeft.days} label="Days" />
      <TimeUnit value={timeLeft.hours} label="Hours" />
      <TimeUnit value={timeLeft.minutes} label="Min" />
      <TimeUnit value={timeLeft.seconds} label="Sec" />
    </div>
  );
}

function TimeUnit({ value, label }: { value: number; label: string }) {
  return (
    <div className="text-center">
      <div className="w-16 h-16 bg-arena-dark border border-arena-light rounded-lg flex items-center justify-center">
        <span className="text-2xl font-bold text-arena-accent">
          {value.toString().padStart(2, '0')}
        </span>
      </div>
      <p className="text-xs text-gray-500 mt-1">{label}</p>
    </div>
  );
}
