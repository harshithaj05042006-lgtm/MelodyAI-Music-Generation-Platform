// Pure decorative animated waveform bars.
export function Waveform({ bars = 48, className = "" }: { bars?: number; className?: string }) {
  return (
    <div className={`flex h-full items-center gap-[3px] ${className}`}>
      {Array.from({ length: bars }).map((_, i) => (
        <span
          key={i}
          className="block w-[3px] rounded-full bg-gradient-to-t from-teal to-amber"
          style={{
            height: "100%",
            transformOrigin: "center",
            animation: `wave-pulse ${0.7 + ((i * 53) % 12) / 10}s ease-in-out ${(i % 8) * 0.05}s infinite`,
          }}
        />
      ))}
    </div>
  );
}

// Live waveform driven by a Tone.js Analyser instance.
import { useEffect, useRef } from "react";
export function LiveWaveform({ analyser }: { analyser: any }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    let raf = 0;
    const draw = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      const w = canvas.width;
      const h = canvas.height;
      ctx.clearRect(0, 0, w, h);
      const values: Float32Array | number[] = analyser?.getValue?.() ?? new Array(128).fill(0);
      const n = (values as ArrayLike<number>).length;
      const grad = ctx.createLinearGradient(0, 0, w, 0);
      grad.addColorStop(0, "#5cd6c4");
      grad.addColorStop(1, "#f3b34a");
      ctx.strokeStyle = grad;
      ctx.lineWidth = 2;
      ctx.beginPath();
      for (let i = 0; i < n; i++) {
        const v = (values as ArrayLike<number>)[i];
        const x = (i / n) * w;
        const y = h / 2 + v * (h / 2) * 0.9;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf);
  }, [analyser]);
  return <canvas ref={canvasRef} width={800} height={160} className="w-full h-full" />;
}