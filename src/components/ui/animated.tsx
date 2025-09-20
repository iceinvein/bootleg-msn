import { motion, type HTMLMotionProps, type Variants, cubicBezier } from "framer-motion";
import { forwardRef } from "react";
import { cn } from "@/lib/utils";

// Animation variants for common patterns
export const fadeInUp: Variants = {
	initial: {
		opacity: 0,
		y: 20,
	},
	animate: {
		opacity: 1,
		y: 0,
			transition: {
				duration: 0.3,
				ease: cubicBezier(0.4, 0, 0.2, 1),
			},
	},
	exit: {
		opacity: 0,
		y: -10,
		transition: {
			duration: 0.2,
		},
	},
};

export const fadeInDown: Variants = {
	initial: {
		opacity: 0,
		y: -20,
	},
	animate: {
		opacity: 1,
		y: 0,
			transition: {
				duration: 0.3,
				ease: cubicBezier(0.4, 0, 0.2, 1),
			},
	},
	exit: {
		opacity: 0,
		y: 10,
		transition: {
			duration: 0.2,
		},
	},
};

export const scaleIn: Variants = {
	initial: {
		opacity: 0,
		scale: 0.9,
	},
	animate: {
		opacity: 1,
		scale: 1,
			transition: {
				duration: 0.2,
				ease: cubicBezier(0.4, 0, 0.2, 1),
			},
	},
	exit: {
		opacity: 0,
		scale: 0.95,
		transition: {
			duration: 0.15,
		},
	},
};

export const slideInLeft: Variants = {
	initial: {
		opacity: 0,
		x: -20,
	},
	animate: {
		opacity: 1,
		x: 0,
			transition: {
				duration: 0.3,
				ease: cubicBezier(0.4, 0, 0.2, 1),
			},
	},
	exit: {
		opacity: 0,
		x: -10,
		transition: {
			duration: 0.2,
		},
	},
};

export const slideInRight: Variants = {
	initial: {
		opacity: 0,
		x: 20,
	},
	animate: {
		opacity: 1,
		x: 0,
			transition: {
				duration: 0.3,
				ease: cubicBezier(0.4, 0, 0.2, 1),
			},
	},
	exit: {
		opacity: 0,
		x: 10,
		transition: {
			duration: 0.2,
		},
	},
};

export const bounceIn: Variants = {
	initial: {
		opacity: 0,
		scale: 0.3,
	},
	animate: {
		opacity: 1,
		scale: 1,
			transition: {
				duration: 0.6,
				ease: cubicBezier(0.68, -0.55, 0.265, 1.55),
			},
	},
	exit: {
		opacity: 0,
		scale: 0.9,
		transition: {
			duration: 0.2,
		},
	},
};

export const staggerContainer: Variants = {
	initial: {},
	animate: {
		transition: {
			staggerChildren: 0.1,
		},
	},
	exit: {
		transition: {
			staggerChildren: 0.05,
			staggerDirection: -1,
		},
	},
};

export const staggerItem: Variants = {
	initial: {
		opacity: 0,
		y: 20,
	},
	animate: {
		opacity: 1,
		y: 0,
			transition: {
				duration: 0.3,
				ease: cubicBezier(0.4, 0, 0.2, 1),
			},
	},
	exit: {
		opacity: 0,
		y: -10,
		transition: {
			duration: 0.2,
		},
	},
};

// Animated components
interface AnimatedDivProps extends HTMLMotionProps<"div"> {
	variant?: keyof typeof animationVariants;
}

// Nudge shake animation (classic MSN style)
export const nudgeShake: Variants = {
	initial: {
		x: 0,
		y: 0,
	},
	animate: {
		x: [0, -10, 10, -8, 8, -6, 6, -4, 4, -2, 2, 0],
		y: [0, -5, 5, -4, 4, -3, 3, -2, 2, -1, 1, 0],
		transition: {
			duration: 0.8,
			ease: cubicBezier(0.42, 0, 0.58, 1),
		},
	},
};

// Subtle nudge shake for mobile (less aggressive)
export const nudgeShakeMobile: Variants = {
	initial: {
		x: 0,
		y: 0,
	},
	animate: {
		x: [0, -5, 5, -4, 4, -3, 3, -2, 2, -1, 1, 0],
		y: [0, -2, 2, -2, 2, -1, 1, -1, 1, 0, 0, 0],
		transition: {
			duration: 0.6,
			ease: cubicBezier(0.42, 0, 0.58, 1),
		},
	},
};

const animationVariants = {
	fadeInUp,
	fadeInDown,
	scaleIn,
	slideInLeft,
	slideInRight,
	bounceIn,
	staggerContainer,
	staggerItem,
	nudgeShake,
	nudgeShakeMobile,
};

export const AnimatedDiv = forwardRef<HTMLDivElement, AnimatedDivProps>(
	({ className, variant = "fadeInUp", variants, ...props }, ref) => {
		const selectedVariants = variants || animationVariants[variant];
		
		return (
			<motion.div
				ref={ref}
				className={cn(className)}
				variants={selectedVariants}
				initial="initial"
				animate="animate"
				exit="exit"
				{...props}
			/>
		);
	}
);

AnimatedDiv.displayName = "AnimatedDiv";

// Hover animations
export const hoverScale = {
	scale: 1.02,
} as const;

export const hoverLift = {
	y: -2,
} as const;

export const tapScale = {
	scale: 0.98,
} as const;

// Typing indicator animation
export const typingDots: Variants = {
	initial: {
		opacity: 0.4,
	},
	animate: {
		opacity: 1,
			transition: {
				repeat: Infinity,
				repeatType: "reverse",
				duration: 0.6,
				ease: cubicBezier(0.42, 0, 0.58, 1),
			},
	},
};

// Status indicator pulse
export const statusPulse: Variants = {
	initial: {
		scale: 1,
		opacity: 1,
	},
	animate: {
		scale: [1, 1.1, 1],
		opacity: [1, 0.8, 1],
		transition: {
			duration: 2,
			repeat: Infinity,
			ease: cubicBezier(0.42, 0, 0.58, 1),
		},
	},
};



// Message bubble animations
export const messageBubble: Variants = {
	initial: {
		opacity: 0,
		scale: 0.95,
		y: 10,
	},
	animate: {
		opacity: 1,
		scale: 1,
		y: 0,
			transition: {
				duration: 0.3,
				ease: cubicBezier(0.4, 0, 0.2, 1),
			},
	},
	exit: {
		opacity: 0,
		scale: 0.95,
		y: -5,
		transition: {
			duration: 0.2,
		},
	},
};
