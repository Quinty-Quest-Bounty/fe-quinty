"use client";

import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useState,
} from "react";
import {
  AnimatePresence,
  motion,
  type Transition,
} from "framer-motion";

import { cn } from "@/lib/utils";

interface TextRotateProps {
  texts: string[];
  rotationInterval?: number;
  initial?: any;
  animate?: any;
  exit?: any;
  staggerDuration?: number;
  staggerFrom?: "first" | "last" | "center";
  transition?: Transition;
  mainClassName?: string;
  splitLevelClassName?: string;
  elementLevelClassName?: string;
}

export interface TextRotateRef {
  next: () => void;
  previous: () => void;
  jumpTo: (index: number) => void;
  reset: () => void;
}

const TextRotate = forwardRef<TextRotateRef, TextRotateProps>(
  (
    {
      texts,
      rotationInterval = 2000,
      initial = { y: "100%" },
      animate = { y: 0 },
      exit = { y: "-120%" },
      staggerDuration = 0.025,
      staggerFrom = "last",
      transition = { type: "spring", damping: 30, stiffness: 400 },
      mainClassName,
      splitLevelClassName,
      elementLevelClassName,
    },
    ref
  ) => {
    const [currentIndex, setCurrentIndex] = useState(0);

    const next = useCallback(() => {
      setCurrentIndex((prev) => (prev + 1) % texts.length);
    }, [texts.length]);

    const previous = useCallback(() => {
      setCurrentIndex((prev) => (prev - 1 + texts.length) % texts.length);
    }, [texts.length]);

    const jumpTo = useCallback(
      (index: number) => {
        setCurrentIndex(index % texts.length);
      },
      [texts.length]
    );

    const reset = useCallback(() => {
      setCurrentIndex(0);
    }, []);

    useImperativeHandle(
      ref,
      () => ({
        next,
        previous,
        jumpTo,
        reset,
      }),
      [next, previous, jumpTo, reset]
    );

    useEffect(() => {
      const interval = setInterval(() => {
        next();
      }, rotationInterval);

      return () => clearInterval(interval);
    }, [next, rotationInterval]);

    const currentText = texts[currentIndex];
    const characters = currentText.split("");

    return (
      <span className={cn("inline-flex overflow-hidden", mainClassName)}>
        <AnimatePresence mode="wait">
          <motion.span
            key={currentIndex}
            className={cn("inline-flex", splitLevelClassName)}
          >
            {characters.map((char, i) => {
              const delay =
                staggerFrom === "first"
                  ? i * staggerDuration
                  : staggerFrom === "last"
                  ? (characters.length - 1 - i) * staggerDuration
                  : Math.abs(Math.floor(characters.length / 2) - i) *
                    staggerDuration;

              return (
                <motion.span
                  key={`${currentIndex}-${i}`}
                  initial={initial}
                  animate={animate}
                  exit={exit}
                  transition={{
                    ...transition,
                    delay,
                  }}
                  className={cn("inline-block", elementLevelClassName)}
                >
                  {char === " " ? "\u00A0" : char}
                </motion.span>
              );
            })}
          </motion.span>
        </AnimatePresence>
      </span>
    );
  }
);

TextRotate.displayName = "TextRotate";

export { TextRotate };
