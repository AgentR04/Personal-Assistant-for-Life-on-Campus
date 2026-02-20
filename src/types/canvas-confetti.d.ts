declare module "canvas-confetti" {
  interface ConfettiOptions {
    angle?: number;
    spread?: number;
    decay?: number;
    startVelocity?: number;
    elementCount?: number;
    dragFriction?: number;
    duration?: number;
    stagger?: number;
    width?: string;
    height?: string;
    colors?: string[];
    zIndex?: number;
    origin?: {
      x?: number;
      y?: number;
    };
    particleCount?: number;
    ticks?: number;
    shapes?: string[];
    scalar?: number;
    gravity?: number;
    drift?: number;
    disableForReducedMotion?: boolean;
  }

  function confetti(options?: ConfettiOptions): Promise<null>;

  namespace confetti {
    function reset(): void;
  }

  export = confetti;
}
