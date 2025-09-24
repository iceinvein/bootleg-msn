import * as React from "react"
import * as DialogPrimitive from "@radix-ui/react-dialog"
import { XIcon } from "lucide-react"
import { motion, AnimatePresence, cubicBezier } from "framer-motion"

import { cn } from "@/lib/utils"

function Dialog({
  children,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Root>) {
  const childrenArray = React.Children.toArray(children);
  return (
    <DialogPrimitive.Root data-slot="dialog" {...props}>
      <AnimatePresence mode="sync">
        {childrenArray}
      </AnimatePresence>
    </DialogPrimitive.Root>
  )
}

function DialogTrigger({
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Trigger>) {
  return <DialogPrimitive.Trigger data-slot="dialog-trigger" {...props} />
}

function DialogPortal({
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Portal>) {
  return <DialogPrimitive.Portal data-slot="dialog-portal" {...props} />
}

function DialogClose({
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Close>) {
  return <DialogPrimitive.Close data-slot="dialog-close" {...props} />
}

function DialogOverlay({
  className,
  glass = false,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Overlay> & {
  glass?: boolean;
}) {
  const backgroundClasses = glass
    ? "backdrop-blur-sm bg-black/20"
    : "bg-black/50";

  return (
    <DialogPrimitive.Overlay
      data-slot="dialog-overlay"
      asChild
      {...props}
    >
      <motion.div
        className={cn("fixed inset-0 z-50", backgroundClasses, className)}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
transition={{ duration: 0.2, ease: cubicBezier(0, 0, 0.58, 1) }}
      />
    </DialogPrimitive.Overlay>
  )
}

// Animation variants for different dialog entrance effects
const dialogVariants = {
  // Clean scale entrance (default) - no jarring morphing
  scale: {
    initial: {
      opacity: 0,
      scale: 0.95,
      y: 4
    },
    animate: {
      opacity: 1,
      scale: 1,
      y: 0,
      transition: {
        duration: 0.2,
ease: cubicBezier(0, 0, 0.58, 1)
      }
    },
    exit: {
      opacity: 0,
      scale: 0.98,
      transition: {
        duration: 0.15,
ease: cubicBezier(0.42, 0, 1, 1)
      }
    }
  },

  // Gentle slide from top - no bounce to avoid jarring
  slideDown: {
    initial: {
      opacity: 0,
      y: -20
    },
    animate: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.25,
ease: cubicBezier(0, 0, 0.58, 1)
      }
    },
    exit: {
      opacity: 0,
      y: -10,
      transition: {
        duration: 0.15,
ease: cubicBezier(0.42, 0, 1, 1)
      }
    }
  },

  // Smooth fade - no morphing effects
  fade: {
    initial: {
      opacity: 0
    },
    animate: {
      opacity: 1,
      transition: {
        duration: 0.2,
ease: cubicBezier(0, 0, 0.58, 1)
      }
    },
    exit: {
      opacity: 0,
      transition: {
        duration: 0.15,
ease: cubicBezier(0.42, 0, 1, 1)
      }
    }
  }
};

function DialogContent({
  className,
  children,
  showCloseButton = true,
  glass = false,
  animationType = "scale",
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Content> & {
  showCloseButton?: boolean;
  glass?: boolean;
  animationType?: "scale" | "slideDown" | "fade";
}) {
  const baseClasses = "fixed top-[50%] left-[50%] z-50 grid w-full max-w-[calc(100%-2rem)] translate-x-[-50%] translate-y-[-50%] gap-4 rounded-lg border p-6 shadow-lg sm:max-w-lg";
  const backgroundClasses = glass
    ? "bg-background/80 backdrop-blur-md border-border"
    : "bg-background";

  return (
    <DialogPortal data-slot="dialog-portal">
      <DialogOverlay glass={glass} />
      <DialogPrimitive.Content
        data-slot="dialog-content"
        asChild
        {...props}
      >
        <motion.div
          className={cn(baseClasses, backgroundClasses, className)}
          variants={dialogVariants[animationType]}
          initial="initial"
          animate="animate"
          exit="exit"
        >
          {/* Close button - positioned absolutely, no animation delays */}
          {showCloseButton && (
            <DialogPrimitive.Close
              data-slot="dialog-close"
              asChild
            >
              <motion.button
                className="ring-offset-background focus:ring-ring absolute top-4 right-4 rounded-xs opacity-70 transition-opacity focus:ring-2 focus:ring-offset-2 focus:outline-hidden disabled:pointer-events-none [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4"
                initial={{ opacity: 0.7 }}
                animate={{ opacity: 0.7 }}
                whileHover={{
                  opacity: 1,
                  scale: 1.05,
                  transition: { duration: 0.15 }
                }}
                whileTap={{
                  scale: 0.95,
                  transition: { duration: 0.1 }
                }}
              >
                <XIcon />
                <span className="sr-only">Close</span>
              </motion.button>
            </DialogPrimitive.Close>
          )}

          {/* Content - simple fade in, no complex animations */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{
              opacity: 1,
              transition: { delay: 0.05, duration: 0.2 }
            }}
            exit={{ opacity: 0, transition: { duration: 0.1 } }}
          >
            {children}
          </motion.div>
        </motion.div>
      </DialogPrimitive.Content>
    </DialogPortal>
  )
}

// Staggered animation container for dialog content
function DialogAnimatedContent({
  children,
  className,
  stagger = 0.1,
  ...props
}: React.ComponentProps<"div"> & {
  stagger?: number;
}) {
  const childrenArray = React.Children.toArray(children);

  return (
    <div className={cn("space-y-4", className)} {...props}>
      {childrenArray.map((child, index) => (
        <motion.div
          key={index}
          initial={{ opacity: 0, y: 20 }}
          animate={{
            opacity: 1,
            y: 0,
            transition: {
              delay: index * stagger,
              duration: 0.3,
              ease: "easeOut"
            }
          }}
          exit={{
            opacity: 0,
            y: -10,
            transition: {
              delay: (childrenArray.length - index - 1) * (stagger * 0.5),
              duration: 0.2
            }
          }}
        >
          {child}
        </motion.div>
      ))}
    </div>
  );
}

function DialogHeader({ className, ...props }: React.ComponentProps<"div">) {
  // Exclude props that conflict with Framer Motion
  const {
    onDrag,
    onDragEnd,
    onDragStart,
    onAnimationStart,
    onAnimationEnd,
    onAnimationIteration,
    ...motionProps
  } = props;

  return (
    <motion.div
      data-slot="dialog-header"
      className={cn("flex flex-col gap-2 text-center sm:text-left", className)}
      initial={{ opacity: 0, y: -10 }}
      animate={{
        opacity: 1,
        y: 0,
        transition: { delay: 0.1, duration: 0.3 }
      }}
      exit={{ opacity: 0, y: -5 }}
      {...motionProps}
    />
  )
}

function DialogFooter({ className, ...props }: React.ComponentProps<"div">) {
  // Exclude props that conflict with Framer Motion
  const {
    onDrag,
    onDragEnd,
    onDragStart,
    onAnimationStart,
    onAnimationEnd,
    onAnimationIteration,
    ...motionProps
  } = props;

  return (
    <motion.div
      data-slot="dialog-footer"
      className={cn(
        "flex flex-col-reverse gap-2 sm:flex-row sm:justify-end",
        className
      )}
      initial={{ opacity: 0, y: 10 }}
      animate={{
        opacity: 1,
        y: 0,
        transition: { delay: 0.3, duration: 0.3 }
      }}
      exit={{ opacity: 0, y: 5 }}
      {...motionProps}
    />
  )
}

function DialogTitle({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Title>) {
  return (
    <DialogPrimitive.Title
      data-slot="dialog-title"
      className={cn("text-lg leading-none font-semibold", className)}
      {...props}
    />
  )
}

function DialogDescription({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Description>) {
  return (
    <DialogPrimitive.Description
      data-slot="dialog-description"
      className={cn("text-muted-foreground text-sm", className)}
      {...props}
    />
  )
}

export {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogAnimatedContent,
  DialogHeader,
  DialogOverlay,
  DialogPortal,
  DialogTitle,
  DialogTrigger,
}
