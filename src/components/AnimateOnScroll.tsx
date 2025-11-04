
'use client';

import { motion, useInView } from 'framer-motion';
import { useRef } from 'react';

type AnimationType = 'fade-in' | 'flip';

interface Props {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  animation?: AnimationType;
}

export function AnimateOnScroll({ children, className, delay = 0, animation = 'fade-in' }: Props) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.2 });

  const animationVariants = {
    'fade-in': {
      hidden: { opacity: 0, y: 30 },
      visible: { opacity: 1, y: 0 },
    },
    'flip': {
      hidden: { opacity: 0, rotateY: -180 },
      visible: { opacity: 1, rotateY: 0 },
    },
  };

  const variants = animationVariants[animation];

  return (
    <motion.div
      ref={ref}
      className={className}
      variants={variants}
      initial="hidden"
      animate={isInView ? 'visible' : 'hidden'}
      transition={{ duration: 0.6, delay }}
    >
      {children}
    </motion.div>
  );
}
