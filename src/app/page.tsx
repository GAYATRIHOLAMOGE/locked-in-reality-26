"use client";
import { useEffect, useState } from "react";

const GLITCH_CHARS = "!<>-_\\/[]{}—=+*^?#░▒▓█▄▀";

function useGlitch(text, active) {
  const [display, setDisplay] = useState(text);

  useEffect(() => {
    if (!active) { setDisplay(text); return; }
    let frame = 0;
    const interval = setInterval(() => {
      setDisplay(
        text
          .split("")
          .map((char, i) =>
            frame / 3 > i
              ? char
              : GLITCH_CHARS[Math.floor(Math.random() * GLITCH_CHARS.length)]
          )
          .join("")
      );
      frame++;
      if (frame > text.length * 3) clearInterval(interval);
    }, 30);
    return () => clearInterval(interval);
  }, [active, text]);

  return display;
}

function ScanLines() {
  return (
    <div
      className="pointer-events-none fixed inset-0 z-10"
      style={{
        background:
          "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.08) 2px, rgba(0,0,0,0.08) 4px)",
      }}
    />
  );
}

function Vignette() {
  return (
    <div
      className="pointer-events-none fixed inset-0 z-10"
      style={{
        background:
          "radial-gradient(ellipse at center, transparent 50%, rgba(0,0,0,0.75) 100%)",
      }}
    />
  );
}

export default function Home() {
  const [glitching, setGlitching] = useState(false);
  const [blink, setBlink] = useState(true);
  const [visible, setVisible] = useState(false);

  const codeDisplay = useGlitch("403", glitching);
  const textDisplay = useGlitch("FORBIDDEN", glitching);

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 100);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    const trigger = () => {
      setGlitching(true);
      setTimeout(() => setGlitching(false), 1200);
    };
    trigger();
    const interval = setInterval(trigger, 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => setBlink((b) => !b), 530);
    return () => clearInterval(interval);
  }, []);

  return (
    <div
      className="relative flex h-screen w-screen flex-col items-center justify-center overflow-hidden bg-black"
      style={{ fontFamily: "'Press Start 2P', cursive" }}
    >
      {/* Import font */}
      <style>{`@import url('https://fonts.googleapis.com/css?family=Press+Start+2P');`}</style>

      <ScanLines />
      <Vignette />

      {/* Background grid */}
      <div
        className="pointer-events-none absolute inset-0 opacity-10"
        style={{
          backgroundImage:
            "linear-gradient(#54FE55 1px, transparent 1px), linear-gradient(90deg, #54FE55 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      />

      {/* Main content */}
      <div
        className="relative z-20 flex flex-col items-center gap-6 transition-all duration-700"
        style={{ opacity: visible ? 1 : 0, transform: visible ? "translateY(0)" : "translateY(20px)" }}
      >
        {/* 403 */}
        <div
          className="select-none text-9xl text-center leading-none"
          style={{
            color: "#54FE55",
            textShadow: "0 0 10px #54FE55, 0 0 30px #54FE5588, 0 0 60px #54FE5544",
            letterSpacing: "-0.02em",
          }}
        >
          {codeDisplay}
        </div>

        {/* Divider */}
        <div
          className="w-full"
          style={{
            height: "2px",
            background: "linear-gradient(90deg, transparent, #54FE55, transparent)",
            boxShadow: "0 0 8px #54FE55",
          }}
        />

        {/* FORBIDDEN */}
        <div
          className="flex items-center gap-3 text-2xl text-center"
          style={{
            color: "#54FE55",
            textShadow: "0 0 8px #54FE55",
            letterSpacing: "0.15em",
          }}
        >
          <span>{textDisplay}</span>
          <span style={{ opacity: blink ? 1 : 0 }}>_</span>
        </div>

        {/* Sub-message */}
        <p
          className="mt-4 text-center opacity-60 text-sm"
          style={{
            color: "#54FE55",
            letterSpacing: "0.2em",
            lineHeight: "2",
          }}
        >
          ACCESS DENIED &gt; YOU DO NOT HAVE PERMISSION
          <br />
          GO HOME
        </p>


      </div>
    </div>
  );
}
