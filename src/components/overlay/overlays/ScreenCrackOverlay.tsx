import { motion, useAnimation } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import { ScreenCrack } from "@/components/effects/ScreenCrack";
import { cn } from "@/lib/utils";
import { overlayActions } from "@/stores/overlays";
import type { ScreenCrackOverlayProps } from "@/types/overlay";

/**
 * Full-screen, non-blocking, 3s cracking glass emote.
 * - No pointer capture (decorative only)
 * - Auto-closes after durationMs (default 3000ms)
 * - Plays /sounds/gun-shot.mp3 if present (fails gracefully if missing)
 */
export function ScreenCrackOverlay({
	className,
	durationMs = 3000,
	impact = { x: 0.5, y: 0.45 },
	shotCount = 3,
	shotIntervalMs = 200,
	shotScheduleMs,
	id,
}: ScreenCrackOverlayProps & { onClose?: () => void; id?: string }) {
	// (Canvas version) no precomputed SVG lines/shards needed
	const schedule = useMemo(() => {
		if (shotScheduleMs && shotScheduleMs.length > 0) return [...shotScheduleMs];
		// Default special burst: immediate, +200ms, +50ms
		if (shotCount === 3) return [0, 300, 450];
		return Array.from({ length: shotCount }, (_, i) => i * shotIntervalMs);
	}, [shotScheduleMs, shotCount, shotIntervalMs]);
	const shotKeys = useMemo(
		() =>
			Array.from({ length: schedule.length }, () =>
				Math.random().toString(36).slice(2),
			),
		[schedule],
	);

	// Schedule N gunshot cracks and play sound + shake each time
	const [visibleCount, setVisibleCount] = useState(0);
	const controls = useAnimation();
	useEffect(() => {
		const playShot = () => {
			try {
				const audio = new Audio("/sounds/gun-shot.mp3");
				audio.volume = 0.6;
				audio.addEventListener("error", () => {
					console.warn("[ScreenCrackOverlay] gun-shot.mp3 missing or invalid");
				});
				void audio.play().catch(() => {});
			} catch {}
		};
		const timers: number[] = [];
		schedule.forEach((ms, i) => {
			const handle = window.setTimeout(() => {
				setVisibleCount((v) => Math.max(v, i + 1));
				playShot();
				void controls.start({
					x: [0, -6, 4, -2, 0],
					y: [0, 2, -1, 1, 0],
					transition: { duration: 0.18, ease: "easeOut" },
				});
			}, ms);
			timers.push(handle);
		});
		return () => {
			for (const t of timers) window.clearTimeout(t);
		};
	}, [schedule, controls]);

	// Compute total duration once (canvas version doesn't have per-shard timings)
	const totalMs = useMemo(() => durationMs, [durationMs]);

	// Auto close after the larger of: provided duration or max shard time (failsafe)
	useEffect(() => {
		const t1 = window.setTimeout(() => {
			if (id) overlayActions.close(id);
			else overlayActions.closeTop();
		}, totalMs);
		// Absolute kill-switch (paranoid safety)
		const t2 = window.setTimeout(
			() => {
				if (id) overlayActions.close(id);
				else overlayActions.closeTop();
			},
			Math.max(totalMs + 1000, 4000),
		);
		return () => {
			window.clearTimeout(t1);
			window.clearTimeout(t2);
		};
	}, [totalMs, id]);

	return (
		<motion.div
			className={cn(
				"pointer-events-none fixed inset-0 select-none",
				`[--impact-x:_${impact.x}] [--impact-y:_${impact.y}]`,
				className,
			)}
			aria-hidden
			animate={controls}
		>
			{/* Impact flash */}
			<motion.div
				className="absolute inset-0"
				initial={{ opacity: 0 }}
				animate={{ opacity: [0, 0.85, 0.2, 0] }}
				transition={{
					duration: 0.35,
					times: [0, 0.15, 0.5, 1],
					ease: "easeOut",
				}}
				style={{
					background:
						"radial-gradient( circle at calc(var(--impact-x)*100%) calc(var(--impact-y)*100%), rgba(255,255,255,0.7), rgba(255,255,255,0.2) 20%, transparent 60% )",
				}}
			/>

			{/* We size it to viewport once; overlay lifetime is ~3s so no resize handling needed */}
			{typeof window !== "undefined"
				? Array.from({ length: visibleCount }).map((_, i) => (
						<ScreenCrack
							key={shotKeys[i]}
							width={window.innerWidth}
							height={window.innerHeight}
							interactive={false}
							randomizeOnMount={true}
							randomizeOnIntervalMs={null}
							style={{ pointerEvents: "none" }}
						/>
					))
				: null}

			{/* Subtle top vignette to sell the glass layer */}
			<motion.div
				className="absolute inset-0"
				initial={{ opacity: 0 }}
				animate={{ opacity: [0.0, 0.15, 0.1, 0] }}
				transition={{ duration: durationMs / 1000, ease: "easeInOut" }}
				style={{
					background:
						"radial-gradient( circle at 50% -10%, rgba(255,255,255,0.10), transparent 60% ), radial-gradient(circle at 50% 110%, rgba(255,255,255,0.08), transparent 60%)",
				}}
			/>

			{/* Sentinel animation – invisible but actually animates a property */}
			<motion.div
				className="absolute inset-0"
				style={{ opacity: 0, pointerEvents: "none" }}
				initial={{ x: 0 }}
				animate={{ x: 1 }}
				transition={{ duration: totalMs / 1000, ease: "linear" }}
				onAnimationComplete={() => {
					if (id) overlayActions.close(id);
					else overlayActions.closeTop();
				}}
			/>
		</motion.div>
	);
}
