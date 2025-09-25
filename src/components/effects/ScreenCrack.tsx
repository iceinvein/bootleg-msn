import type React from "react";
import {
	forwardRef,
	useCallback,
	useEffect,
	useImperativeHandle,
	useRef,
} from "react";

export type Point = { x: number; y: number };

export type LineDesc = {
	dx: number;
	dy: number;
	dl: number;
	sx: number;
	sy: number;
	tx: number;
	ty: number;
	mpp: number;
	mpl1: number;
	mpl2: number;
	cma: number;
	cpt: Point;
	bbx1: number;
	bby1: number;
	bbx2: number;
	bby2: number;
	bbwidth: number;
	bbheight: number;
};

export type CrackLine = {
	p1: Point;
	p2: Point;
	desc: LineDesc;
	level: number;
};

export type CrackOverlayProps = {
	width: number;
	height: number;

	style?: React.CSSProperties;

	backgroundImageUrl?: string;

	opacityRefract?: number; // default 0.8
	opacityReflect?: number; // default 0.3
	opacityFractures?: number; // default 0.4
	opacityMainline?: number; // default 0.65
	opacityNoise?: number; // default 1

	interactive?: boolean; // default false
	randomizeOnMount?: boolean; // default true
	randomizeOnIntervalMs?: number | null; // default null

	fixedCenter?: Point;

	debug?: boolean;

	curvatureFactor?: number; // 0..1, default 0.3
	rays?: number; // default 20
	maxRadius?: number; // default min(width, height)

	// Growth animation on mount before settling to static draw
	animateGrowth?: boolean; // default true
	growthMs?: number; // default 200

	onCrack?: (center: Point) => void;
};

export type CrackOverlayHandle = {
	clear: () => void;
	crackAt: (center: Point) => void;
	randomize: () => void;
};

const RAD = Math.PI / 180;

function findPointOnCircle(c: Point, r: number, aDeg: number): Point {
	const a = aDeg * RAD;
	return {
		x: c.x + r * Math.cos(a) - r * Math.sin(a),
		y: c.y + r * Math.sin(a) + r * Math.cos(a),
	};
}

function describeLinePath(p1: Point, p2: Point, cv: number): LineDesc {
	const dx = p2.x - p1.x;
	const dy = p2.y - p1.y;
	const dl = Math.max(1e-6, Math.hypot(dx, dy)); // avoid div by zero

	const sx = dx / dl;
	const sy = dy / dl;

	// Tangent (perpendicular)
	const tx = dy / dl;
	const ty = -dx / dl;

	const cvScaled = 5 * Math.max(0, Math.min(1, cv));

	const mpp = Math.random() * 0.5 + 0.3;
	const mpl1 = dl * mpp;
	const mpl2 = dl - mpl1;

	const ll = Math.log(dl * Math.E);
	const cma = Math.random() * ll * cvScaled - (ll * cvScaled) / 2;

	const cpt: Point = {
		x: p1.x + sx * mpl1 + tx * cma,
		y: p1.y + sy * mpl1 + ty * cma,
	};

	const bbx1 = Math.min(p1.x, p2.x, cpt.x);
	const bby1 = Math.min(p1.y, p2.y, cpt.y);
	const bbx2 = Math.max(p1.x, p2.x, cpt.x);
	const bby2 = Math.max(p1.y, p2.y, cpt.y);
	const bbwidth = bbx2 - bbx1;
	const bbheight = bby2 - bby1;

	return {
		dx,
		dy,
		dl,
		sx,
		sy,
		tx,
		ty,
		mpp,
		mpl1,
		mpl2,
		cma,
		cpt,
		bbx1,
		bby1,
		bbx2,
		bby2,
		bbwidth,
		bbheight,
	};
}

function findCrackEffectPaths(
	width: number,
	height: number,
	center: Point,
	rays: number,
	curvatureFactor: number,
	maxRadius: number,
): CrackLine[] {
	const imx = 0;
	const imy = 0;
	const imw = width;
	const imh = height;

	const main: Array<Array<{ angle: number; point: Point } | null>> = [[]];
	const lines: CrackLine[] = [];

	let level = 1;
	let maxl = 0;
	let r = 15;

	const clampedRays = Math.max(1, Math.floor(rays));
	const baseAngleStep = 360 / (clampedRays + 1);

	// Seed ring
	while (main[0].length < clampedRays) {
		const a = baseAngleStep * main[0].length + 10;
		const pt2 = findPointOnCircle(center, 5, a);
		main[0].push({ angle: a, point: pt2 });
	}

	// Grow rings
	while (r < maxRadius) {
		main[level] = [];
		for (let i = 0; i < clampedRays; i++) {
			const prev = main[level - 1][i];
			main[level][i] = null;

			if (prev) {
				const { point } = prev;

				if (point.x > imx && point.x < imw && point.y > imy && point.y < imh) {
					let a =
						prev.angle +
						(Math.random() * 10) / clampedRays -
						10 / 2 / clampedRays;
					if (a > 350) a = 350;

					const next = findPointOnCircle(
						center,
						r + (Math.random() * r) / level - r / (level * 2),
						a,
					);

					main[level][i] = { angle: a, point: { x: next.x, y: next.y } };
				} else if (maxl === 0) {
					maxl = level;
				}
			}
		}

		level++;
		// original used: r *= Math.random()*1.5 + (1.5 - 0.5)
		r *= Math.random() * 1.5 + 1.0;
	}

	if (maxl === 0) maxl = level;

	const cv = Math.max(0, Math.min(1, curvatureFactor));

	for (let l = 1; l < level; l++) {
		for (let g = 0; g < clampedRays; g++) {
			const a1 = main[l - 1][g];
			const a2 = main[l][g];

			if (a1 && a2) {
				lines.push({
					p1: { x: a1.point.x, y: a1.point.y },
					p2: { x: a2.point.x, y: a2.point.y },
					desc: describeLinePath(a1.point, a2.point, cv),
					level: l,
				});

				if (Math.random() < 0.6) {
					const n1 = main[l][(g + 1) % clampedRays];
					if (n1) {
						lines.push({
							p1: { x: a2.point.x, y: a2.point.y },
							p2: { x: n1.point.x, y: n1.point.y },
							desc: describeLinePath(a2.point, n1.point, cv),
							level: l,
						});
					}
				}

				if (l < level - 1 && Math.random() < 0.3) {
					const n2 = main[l + 1][(g + 1) % clampedRays];
					if (n2) {
						lines.push({
							p1: { x: a2.point.x, y: a2.point.y },
							p2: { x: n2.point.x, y: n2.point.y },
							desc: describeLinePath(a2.point, n2.point, cv),
							level: l,
						});
					}
				}
			}
		}
	}

	return lines;
}

function rgba(r: number, g: number, b: number, a: number) {
	const aa = Math.max(0, Math.min(1, a));
	return `rgba(${r},${g},${b},${aa})`;
}

function drawRefract(
	ctx: CanvasRenderingContext2D,
	img: HTMLImageElement | null,
	p1: Point,
	p2: Point,
	line: LineDesc,
	alpha: number,
) {
	if (!img) return;

	const tx = line.tx;
	const ty = line.ty;
	const cp = line.cpt;

	const ns = 3;
	const td = 6;

	let x1 = line.bbx1;
	let y1 = line.bby1;
	let w = line.bbwidth + ns * 2;
	let h = line.bbheight + ns * 2;

	ctx.globalAlpha = alpha;

	ctx.save();
	ctx.beginPath();
	ctx.moveTo(p1.x + ns * tx, p1.y + ns * ty);
	ctx.quadraticCurveTo(cp.x, cp.y, p2.x + ns * tx, p2.y + ns * ty);
	ctx.lineTo(p2.x - ns * tx, p2.y - ns * ty);
	ctx.quadraticCurveTo(cp.x, cp.y, p1.x - ns * tx, p1.y - ns * ty);
	ctx.closePath();
	ctx.clip();

	const cw = ctx.canvas.width;
	const ch = ctx.canvas.height;

	if (x1 + td * tx < 0) x1 = -td * tx;
	if (y1 + td * ty < 0) y1 = -td * ty;
	if (w + x1 + td * tx > cw) w = cw - x1 + td * tx;
	if (h + y1 + td * ty > ch) h = ch - y1 + td * ty;

	try {
		ctx.drawImage(img, x1 + td * tx, y1 + td * ty, w, h, x1, y1, w, h);
	} catch {
		// ignore drawImage bounds errors
	}

	ctx.restore();
}

function drawReflect(
	ctx: CanvasRenderingContext2D,
	p1: Point,
	p2: Point,
	line: LineDesc,
	alpha: number,
) {
	const tx = line.tx;
	const ty = line.ty;
	const dd = line.dl / 3;

	ctx.globalAlpha = alpha;

	const x1 = p1.x + dd * tx;
	const y1 = p1.y + dd * ty;
	const x2 = p1.x - dd * tx;
	const y2 = p1.y - dd * ty;

	const grd = ctx.createLinearGradient(x1, y1, x2, y2);
	grd.addColorStop(0, rgba(255, 255, 255, 0));
	grd.addColorStop(0.5, rgba(255, 255, 255, 0.5));
	grd.addColorStop(1, rgba(255, 255, 255, 0));

	ctx.fillStyle = grd;
	ctx.beginPath();

	ctx.moveTo(p1.x + dd * tx, p1.y + dd * ty);
	ctx.lineTo(p2.x + dd * tx, p2.y + dd * ty);
	ctx.lineTo(p2.x - dd * tx, p2.y - dd * ty);
	ctx.lineTo(p1.x - dd * tx, p1.y - dd * ty);
	ctx.closePath();
	ctx.fill();
}

function drawFractures(
	ctx: CanvasRenderingContext2D,
	p1: Point,
	_p2: Point,
	line: LineDesc,
	alpha: number,
) {
	const { tx, ty, sx, sy, dl, mpp, cma, mpl1, mpl2 } = line;

	const sz = 33;
	const mp = dl / 2;

	ctx.globalAlpha = alpha;
	ctx.lineWidth = 1;

	for (let s = 0; s < dl; ) {
		let c: number;
		if (s < mpp * dl) c = cma * (1 - ((mpl1 - s) / mpl1) ** 2);
		else c = cma * (1 - ((mpl2 - (dl - s)) / mpl2) ** 2);
		c /= 2;

		const p = ((s > mp ? dl - s : s) / mp) ** 2;

		const w = Math.random() * 1 + 1;
		const h1 = sz - Math.random() * p * sz + 1;
		const h2 = sz - Math.random() * p * sz + 1;
		const t = Math.random() * 20 - 10;

		if (Math.random() > p - sz / mp) {
			const a = Math.round(Math.random() * 8 + 4) / 12;
			ctx.fillStyle = rgba(255, 255, 255, a);

			ctx.beginPath();
			ctx.moveTo(p1.x + s * sx + c * tx, p1.y + s * sy + c * ty);
			ctx.lineTo(
				p1.x + (t + s + w / 2) * sx + h1 * tx + c * tx,
				p1.y + (-t + s + w / 2) * sy + h1 * ty + c * ty,
			);
			ctx.lineTo(p1.x + (s + w) * sx + c * tx, p1.y + (s + w) * sy + c * ty);
			ctx.lineTo(
				p1.x + (-t + s + w / 2) * sx - h2 * tx + c * tx,
				p1.y + (t + s + w / 2) * sy - h2 * ty + c * ty,
			);
			ctx.closePath();
			ctx.fill();
		}

		s += mp * (p / 2 + 0.5) || 1; // safe increment
	}
}

function drawMainline(
	ctx: CanvasRenderingContext2D,
	p1: Point,
	p2: Point,
	line: LineDesc,
	alpha: number,
) {
	const { tx, ty, cpt } = line;

	const ns = 0.03;
	let st = 0.14;
	const hl = 0.2;
	const tt = Math.random() * ns * 2 - (ns * 2) / 2;

	ctx.globalAlpha = alpha;
	ctx.lineWidth = 1;

	while (st > 0) {
		const baseLight = 0.75 * (1 - hl * Math.random());
		const a = Math.round(Math.random() * 8 + 4) / 12;
		ctx.strokeStyle = rgba(255, 255, 255, a * baseLight);

		ctx.beginPath();
		ctx.moveTo(p1.x + (st + tt) * tx, p1.y + (st - tt) * ty);
		ctx.quadraticCurveTo(
			cpt.x,
			cpt.y,
			p2.x + (st - tt) * tx,
			p2.y + (st + tt) * ty,
		);
		ctx.stroke();

		st -= 1;
	}
}

function drawNoise(
	ctx: CanvasRenderingContext2D,
	p1: Point,
	_p2: Point,
	line: LineDesc,
	alpha: number,
) {
	const { tx, ty, sx, sy, dl, mpp, cma, mpl1, mpl2 } = line;

	const freq = 0.4;
	// midpoint length not used here
	const dd = dl / 3;
	const step = Math.ceil(dd * (1 - (freq + 0.5) / 1.5) + 1);

	ctx.globalAlpha = alpha;
	ctx.lineWidth = 1;

	for (let s = 0; s < dl; ) {
		let c: number;
		if (s < mpp * dl) c = cma * (1 - ((mpl1 - s) / mpl1) ** 2);
		else c = cma * (1 - ((mpl2 - (dl - s)) / mpl2) ** 2);
		c /= 2;

		for (let t = -dd; t < dd; ) {
			if (Math.random() > Math.abs(t) / dd) {
				let cnt = Math.floor(Math.random() * 4 + 0.5);
				const m = Math.random() * 2 - 1;

				while (cnt >= 0) {
					const a = Math.round(Math.random() * 10 + 2) / 30;
					ctx.strokeStyle = rgba(255, 255, 255, a);

					let pos = Math.floor(Math.random() * 5 + 0.5);

					ctx.beginPath();
					ctx.moveTo(
						p1.x + (s - pos) * sx + (m + t) * tx + c * tx,
						p1.y + (s - pos) * sy + (-m + t) * ty + c * ty,
					);
					ctx.lineTo(
						p1.x + (s + pos) * sx + (-m + t) * tx + c * tx,
						p1.y + (s + pos) * sy + (m + t) * ty + c * ty,
					);
					ctx.stroke();

					cnt--;
					pos++;
				}
			}

			t += Math.random() * step * 2;
		}

		s += Math.random() * step * 4 || 1;
	}
}

function drawDebug(
	ctx: CanvasRenderingContext2D,
	p1: Point,
	p2: Point,
	line: LineDesc,
) {
	const { sx, sy, tx, ty, mpp: _mpp, cma, mpl1, cpt } = line;

	ctx.strokeStyle = rgba(0, 0, 0, 0.4);
	ctx.fillStyle = rgba(0, 0, 0, 0.4);

	ctx.fillRect(p1.x - 1, p1.y - 1, 2, 2);

	ctx.beginPath();
	ctx.moveTo(p1.x, p1.y);
	ctx.lineTo(p2.x, p2.y);
	ctx.stroke();

	ctx.strokeStyle = rgba(200, 0, 0, 0.5);
	ctx.beginPath();
	ctx.moveTo(p1.x + mpl1 * sx, p1.y + mpl1 * sy);
	ctx.lineTo(
		p1.x + mpl1 * sx + (cma / 2) * tx,
		p1.y + mpl1 * sy + (cma / 2) * ty,
	);
	ctx.stroke();

	ctx.beginPath();
	ctx.moveTo(
		p1.x + (mpl1 - 5) * sx + (cma / 2) * tx,
		p1.y + (mpl1 - 5) * sy + (cma / 2) * ty,
	);
	ctx.lineTo(
		p1.x + (mpl1 + 5) * sx + (cma / 2) * tx,
		p1.y + (mpl1 + 5) * sy + (cma / 2) * ty,
	);
	ctx.stroke();

	ctx.fillStyle = rgba(0, 0, 255, 0.6);
	ctx.fillRect(cpt.x - 2, cpt.y - 2, 4, 4);
}

function drawMainlinePartial(
	ctx: CanvasRenderingContext2D,
	p1: Point,
	line: LineDesc,
	len: number,
	alpha: number,
) {
	const { sx, sy, cpt, dl } = line;
	const L = Math.max(0, Math.min(len, dl));
	const ex = p1.x + sx * L;
	const ey = p1.y + sy * L;
	ctx.globalAlpha = alpha;
	ctx.lineWidth = 1;
	for (let i = 0; i < 2; i++) {
		const a = Math.round(((Math.random() * 8 + 4) / 12) * 100) / 100;
		ctx.strokeStyle = rgba(255, 255, 255, a);
		ctx.beginPath();
		ctx.moveTo(p1.x, p1.y);
		ctx.quadraticCurveTo(cpt.x, cpt.y, ex, ey);
		ctx.stroke();
	}
}

export const ScreenCrack = forwardRef<CrackOverlayHandle, CrackOverlayProps>(
	(
		{
			width,
			height,
			style,
			backgroundImageUrl,
			opacityRefract = 0.8,
			opacityReflect = 0.3,
			opacityFractures = 0.4,
			opacityMainline = 0.65,
			opacityNoise = 1,
			interactive = false,
			randomizeOnMount = true,
			randomizeOnIntervalMs = null,
			fixedCenter,
			debug = false,
			curvatureFactor = 0.3,
			rays = 20,
			maxRadius,
			// growth controls
			animateGrowth = true,
			growthMs = 200,
			onCrack,
		},
		ref,
	) => {
		const refractRef = useRef<HTMLCanvasElement | null>(null);
		const reflectRef = useRef<HTMLCanvasElement | null>(null);
		const fracturesRef = useRef<HTMLCanvasElement | null>(null);
		const mainLineRef = useRef<HTMLCanvasElement | null>(null);
		const noiseRef = useRef<HTMLCanvasElement | null>(null);
		const debugRef = useRef<HTMLCanvasElement | null>(null);

		const imgRef = useRef<HTMLImageElement | null>(null);
		const growthRAF = useRef<number | null>(null);

		useEffect(() => {
			if (!backgroundImageUrl) {
				imgRef.current = null;
				// cancel any running growth animation
				if (growthRAF.current != null) {
					cancelAnimationFrame(growthRAF.current);
					growthRAF.current = null;
				}

				return;
			}
			const img = new Image();
			img.crossOrigin = "anonymous";
			img.onload = () => {
				imgRef.current = img;
			};
			img.src = backgroundImageUrl;
		}, [backgroundImageUrl]);

		useEffect(() => {
			const canvases: Array<HTMLCanvasElement | null> = [
				refractRef.current,
				reflectRef.current,
				fracturesRef.current,
				mainLineRef.current,
				noiseRef.current,
				debugRef.current,
			];
			canvases.forEach((c) => {
				if (c) {
					c.width = width;
					c.height = height;
				}
			});
		}, [width, height]);

		const clearAll = useCallback(() => {
			const canvases: Array<HTMLCanvasElement | null> = [
				refractRef.current,
				reflectRef.current,
				fracturesRef.current,
				mainLineRef.current,
				noiseRef.current,
				debugRef.current,
			];
			canvases.forEach((c) => {
				if (!c) return;
				const ctx = c.getContext("2d");
				if (!ctx) return;
				ctx.clearRect(0, 0, c.width, c.height);
			});
		}, []);

		const renderCrack = useCallback(
			(center: Point) => {
				clearAll();

				const W = width;
				const H = height;
				const paths = findCrackEffectPaths(
					W,
					H,
					center,
					rays,
					curvatureFactor,
					maxRadius ?? Math.min(W, H),
				);

				const img = imgRef.current;

				const ctxRefract = refractRef.current?.getContext("2d") ?? null;
				const ctxReflect = reflectRef.current?.getContext("2d") ?? null;
				const ctxFractures = fracturesRef.current?.getContext("2d") ?? null;
				const ctxMain = mainLineRef.current?.getContext("2d") ?? null;
				const ctxNoise = noiseRef.current?.getContext("2d") ?? null;
				const ctxDebug = debugRef.current?.getContext("2d") ?? null;

				const drawStatic = () => {
					for (const line of paths) {
						if (ctxRefract && opacityRefract > 0) {
							drawRefract(
								ctxRefract,
								img,
								line.p1,
								line.p2,
								line.desc,
								opacityRefract,
							);
						}
						if (ctxReflect && opacityReflect > 0) {
							drawReflect(
								ctxReflect,
								line.p1,
								line.p2,
								line.desc,
								opacityReflect,
							);
						}
						if (ctxFractures && opacityFractures > 0) {
							drawFractures(
								ctxFractures,
								line.p1,
								line.p2,
								line.desc,
								opacityFractures,
							);
						}
						if (ctxMain && opacityMainline > 0) {
							drawMainline(
								ctxMain,
								line.p1,
								line.p2,
								line.desc,
								opacityMainline,
							);
						}
						if (ctxNoise && opacityNoise > 0) {
							drawNoise(ctxNoise, line.p1, line.p2, line.desc, opacityNoise);
						}
						if (debug && ctxDebug) {
							drawDebug(ctxDebug, line.p1, line.p2, line.desc);
						}
					}
					onCrack?.(center);
				};

				if (animateGrowth && ctxMain) {
					const start = performance.now();
					const dur = Math.max(16, growthMs);
					const step = (now: number) => {
						const t = Math.min(1, (now - start) / dur);
						ctxMain.clearRect(0, 0, W, H);
						for (const line of paths) {
							drawMainlinePartial(
								ctxMain,
								line.p1,
								line.desc,
								line.desc.dl * t,
								opacityMainline,
							);
						}
						if (t < 1) {
							growthRAF.current = requestAnimationFrame(step);
						} else {
							growthRAF.current = null;
							// After growth completes, redraw all layers statically
							clearAll();
							// recompute contexts after clear
							const _ctxRefract = refractRef.current?.getContext("2d") ?? null;
							const _ctxReflect = reflectRef.current?.getContext("2d") ?? null;
							const _ctxFractures =
								fracturesRef.current?.getContext("2d") ?? null;
							const _ctxMain = mainLineRef.current?.getContext("2d") ?? null;
							const _ctxNoise = noiseRef.current?.getContext("2d") ?? null;
							const _ctxDebug = debugRef.current?.getContext("2d") ?? null;
							for (const line of paths) {
								if (_ctxRefract && opacityRefract > 0) {
									drawRefract(
										_ctxRefract,
										img,
										line.p1,
										line.p2,
										line.desc,
										opacityRefract,
									);
								}
								if (_ctxReflect && opacityReflect > 0) {
									drawReflect(
										_ctxReflect,
										line.p1,
										line.p2,
										line.desc,
										opacityReflect,
									);
								}
								if (_ctxFractures && opacityFractures > 0) {
									drawFractures(
										_ctxFractures,
										line.p1,
										line.p2,
										line.desc,
										opacityFractures,
									);
								}
								if (_ctxMain && opacityMainline > 0) {
									drawMainline(
										_ctxMain,
										line.p1,
										line.p2,
										line.desc,
										opacityMainline,
									);
								}
								if (_ctxNoise && opacityNoise > 0) {
									drawNoise(
										_ctxNoise,
										line.p1,
										line.p2,
										line.desc,
										opacityNoise,
									);
								}
								if (debug && _ctxDebug) {
									drawDebug(_ctxDebug, line.p1, line.p2, line.desc);
								}
							}
							onCrack?.(center);
						}
					};
					growthRAF.current = requestAnimationFrame(step);
					return;
				}

				// No growth animation; draw statically
				drawStatic();
			},
			[
				clearAll,
				width,
				height,
				rays,
				curvatureFactor,
				maxRadius,
				opacityRefract,
				opacityReflect,
				opacityFractures,
				opacityMainline,
				opacityNoise,
				debug,
				onCrack,
				animateGrowth,
				growthMs,
			],
		);

		useImperativeHandle(
			ref,
			(): CrackOverlayHandle => ({
				clear: clearAll,
				crackAt: (center: Point) => renderCrack(center),
				randomize: () =>
					renderCrack({
						x: Math.floor(Math.random() * width),
						y: Math.floor(Math.random() * height),
					}),
			}),
			[clearAll, renderCrack, width, height],
		);

		useEffect(() => {
			if (!randomizeOnMount) return;
			const center = fixedCenter ?? {
				x: Math.floor(Math.random() * width),
				y: Math.floor(Math.random() * height),
			};
			renderCrack(center);
		}, [randomizeOnMount, fixedCenter, width, height, renderCrack]);

		useEffect(() => {
			if (!randomizeOnIntervalMs) return;
			const id = window.setInterval(() => {
				const center = fixedCenter ?? {
					x: Math.floor(Math.random() * width),
					y: Math.floor(Math.random() * height),
				};
				renderCrack(center);
			}, randomizeOnIntervalMs);
			return () => window.clearInterval(id);
		}, [randomizeOnIntervalMs, renderCrack, fixedCenter, width, height]);

		const handleClick = useCallback(
			(e: React.MouseEvent<HTMLDivElement>) => {
				if (!interactive) return;
				const rect = (
					e.currentTarget as HTMLDivElement
				).getBoundingClientRect();
				const x = e.clientX - rect.left;
				const y = e.clientY - rect.top;
				renderCrack({ x, y });
			},
			[interactive, renderCrack],
		);

		const handleKeyDown = useCallback(
			(e: React.KeyboardEvent<HTMLDivElement>) => {
				if (!interactive) return;
				if (e.key === "Enter" || e.key === " ") {
					// simple center crack on keyboard activation
					renderCrack({ x: Math.floor(width / 2), y: Math.floor(height / 2) });
				}
			},
			[interactive, renderCrack, width, height],
		);

		return (
			<div
				onClick={interactive ? handleClick : undefined}
				onKeyDown={interactive ? handleKeyDown : undefined}
				tabIndex={interactive ? 0 : -1}
				style={{
					position: "absolute",
					inset: "0 auto auto 0",
					width,
					height,
					pointerEvents: interactive ? "auto" : "none",
					...style,
				}}
			>
				<canvas
					ref={refractRef}
					style={{ position: "absolute", left: 0, top: 0 }}
				/>
				<canvas
					ref={reflectRef}
					style={{ position: "absolute", left: 0, top: 0 }}
				/>
				<canvas
					ref={fracturesRef}
					style={{ position: "absolute", left: 0, top: 0 }}
				/>
				<canvas
					ref={mainLineRef}
					style={{ position: "absolute", left: 0, top: 0 }}
				/>
				<canvas
					ref={noiseRef}
					style={{ position: "absolute", left: 0, top: 0 }}
				/>
				{debug ? (
					<canvas
						ref={debugRef}
						style={{ position: "absolute", left: 0, top: 0 }}
					/>
				) : null}
			</div>
		);
	},
);
