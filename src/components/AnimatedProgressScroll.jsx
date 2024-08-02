import React, { forwardRef } from "react";
import { motion, useScroll, useSpring, useTransform } from "framer-motion";

const AnimatedProgressScroll = forwardRef(({ container }, ref) => {
  const { scrollYProgress } = useScroll({ container: ref });

  const scaleX = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001,
  });

  const purpleBackground = [
    "#c19ee0",
    "#b185db",
    "#a06cd5",
    "#9163cb",
    "#815ac0",
    "#7251b5",
    "#6247aa",
  ];

  const greenBackground = [
    "#6ede8a",
    "#4ad66d",
    "#2dc653",
    "#25a244",
    "#208b3a",
    "#1a7431",
    "#155d27",
  ];

  const background = useTransform(
    scrollYProgress,
    [0, 0.2, 0.3, 0.4, 0.5, 0.8, 1],
    purpleBackground
  );
  return (
    <motion.div
      style={{
        scaleX,
        transformOrigin: "left",
        background,
        position: "absolute",
        top: 0,
        width: "100%",
        height: "4px",
      }}
    />
  );
});

AnimatedProgressScroll.displayName = "AnimatedProgressScroll";

export default AnimatedProgressScroll;
