"use client";

import { GripVertical, RotateCcw } from "lucide-react";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from "react";

import { cn } from "@/lib/utils";

import { SemanticSearchPanel } from "./semantic-search-panel";

type Position = { x: number; y: number };

const STORAGE_KEY = "deerflow.semantic-search.position.v2";
const DEFAULT_MARGIN = 16;
const DEFAULT_LEFT = 24;
const DEFAULT_TOP = 82;
const FALLBACK_WIDTH = 420;
const FALLBACK_HEIGHT = 120;

export function SemanticSearchFloating({
  threadId,
  className,
}: {
  threadId: string;
  className?: string;
}) {
  const panelRef = useRef<HTMLDivElement>(null);
  const dragOffsetRef = useRef<Position>({ x: 0, y: 0 });
  const [position, setPosition] = useState<Position | null>(null);
  const [dragging, setDragging] = useState(false);

  const clampPosition = useCallback((next: Position) => {
    if (typeof window === "undefined") return next;
    const panel = panelRef.current;
    const width = panel?.offsetWidth ?? FALLBACK_WIDTH;
    const height = panel?.offsetHeight ?? FALLBACK_HEIGHT;
    const maxX = Math.max(DEFAULT_MARGIN, window.innerWidth - width - DEFAULT_MARGIN);
    const maxY = Math.max(DEFAULT_MARGIN, window.innerHeight - height - DEFAULT_MARGIN);
    return {
      x: Math.min(Math.max(DEFAULT_MARGIN, next.x), maxX),
      y: Math.min(Math.max(DEFAULT_MARGIN, next.y), maxY),
    };
  }, []);

  const setClampedPosition = useCallback(
    (next: Position) => {
      const clamped = clampPosition(next);
      setPosition((current) => {
        if (current?.x !== clamped.x || current?.y !== clamped.y) {
          return clamped;
        }
        return current;
      });
    },
    [clampPosition],
  );

  useEffect(() => {
    if (typeof window === "undefined") return;
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as Position;
        setClampedPosition(parsed);
        return;
      } catch {
        localStorage.removeItem(STORAGE_KEY);
      }
    }
    const height = panelRef.current?.offsetHeight ?? FALLBACK_HEIGHT;
    const initial = {
      x: DEFAULT_LEFT,
      y: Math.min(
        Math.max(DEFAULT_TOP, window.innerHeight - height - 260),
        window.innerHeight - height - DEFAULT_MARGIN,
      ),
    };
    setClampedPosition(initial);
  }, [setClampedPosition]);

  useEffect(() => {
    if (!position) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(position));
  }, [position]);

  useEffect(() => {
    if (!position) return;
    const handleResize = () => {
      setClampedPosition(position);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [position, setClampedPosition]);

  useEffect(() => {
    const panel = panelRef.current;
    if (!panel || typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(() => {
      if (position) {
        setClampedPosition(position);
      }
    });
    observer.observe(panel);
    return () => observer.disconnect();
  }, [position, setClampedPosition]);

  const handlePointerDown = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      if (event.button !== 0) return;
      const rect = panelRef.current?.getBoundingClientRect();
      if (!rect) return;
      dragOffsetRef.current = {
        x: event.clientX - rect.left,
        y: event.clientY - rect.top,
      };
      setDragging(true);
      event.currentTarget.setPointerCapture(event.pointerId);
      event.preventDefault();
    },
    [],
  );

  const handleResetPosition = useCallback(() => {
    if (typeof window === "undefined") return;
    const height = panelRef.current?.offsetHeight ?? FALLBACK_HEIGHT;
    setClampedPosition({
      x: DEFAULT_LEFT,
      y: Math.min(
        Math.max(DEFAULT_TOP, window.innerHeight - height - 260),
        window.innerHeight - height - DEFAULT_MARGIN,
      ),
    });
  }, [setClampedPosition]);

  useEffect(() => {
    if (!dragging) return;
    const handleMove = (event: globalThis.PointerEvent) => {
      setClampedPosition({
        x: event.clientX - dragOffsetRef.current.x,
        y: event.clientY - dragOffsetRef.current.y,
      });
    };
    const handleUp = () => setDragging(false);
    window.addEventListener("pointermove", handleMove);
    window.addEventListener("pointerup", handleUp);
    return () => {
      window.removeEventListener("pointermove", handleMove);
      window.removeEventListener("pointerup", handleUp);
    };
  }, [dragging, setClampedPosition]);

  return (
    <div
      ref={panelRef}
      className={cn(
        "fixed z-40 w-[420px] max-w-[calc(100vw-2rem)] transition-opacity",
        dragging && "cursor-grabbing",
        className,
      )}
      style={
        position
          ? { left: position.x, top: position.y, opacity: 1 }
          : { left: 0, top: 0, opacity: 0 }
      }
    >
      <div className="flex flex-col gap-2">
        <div className="flex w-fit items-center gap-1">
          <div
            className={cn(
              "flex items-center gap-1 rounded-full border border-sky-200/70 bg-white/82 px-2 py-1 text-[11px] text-slate-600 shadow-sm backdrop-blur",
              dragging ? "cursor-grabbing" : "cursor-grab",
            )}
            onPointerDown={handlePointerDown}
          >
            <GripVertical className="size-3 text-slate-500" />
            拖动
          </div>
          <button
            type="button"
            className="inline-flex items-center gap-1 rounded-full border border-sky-200/70 bg-white/82 px-2 py-1 text-[11px] text-slate-600 shadow-sm backdrop-blur hover:bg-white"
            onClick={handleResetPosition}
          >
            <RotateCcw className="size-3" />
            复位
          </button>
        </div>
        <SemanticSearchPanel threadId={threadId} />
      </div>
    </div>
  );
}
