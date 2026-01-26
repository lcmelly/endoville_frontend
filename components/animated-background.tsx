"use client";

import React from "react";
import { Truck } from "lucide-react";
import styles from "./animated-background.module.css";

type Props = {
  children?: React.ReactNode;
  className?: string;
};

export default function AnimatedBackground({ children, className }: Props) {
  return (
    <div className={`${styles.wrap } ${className ?? ""}`}>
      {/* soft blobs */}
      <div className={styles.blobs} aria-hidden="true">
        <span className={styles.blobA} />
        <span className={styles.blobB} />
        <span className={styles.blobC} />
      </div>

      {/* contour lines overlay */}
      <svg
        className={styles.lines}
        viewBox="0 0 1200 800"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        <defs>
          <path
            id="path-top"
            d="M-40,120 C120,20 220,40 340,110 C460,185 570,160 720,120"
          />
          <path
            id="path-mid"
            d="M-60,160 C110,70 240,85 360,145 C500,215 610,195 760,145"
          />
          <path
            id="path-third"
            d="M-80,200 C120,115 260,125 380,185 C520,250 640,235 800,185"
          />
          <path
            id="path-bottom"
            d="M-40,720 C120,650 250,660 380,710 C520,770 650,755 820,700"
          />
          <path
            id="path-last"
            d="M-60,760 C120,700 270,710 420,760 C560,810 700,805 900,750"
          />
        </defs>
        <g fill="none" stroke="rgba(170, 110, 255, 0.45)" strokeWidth="3.5">
          {/* Top-left contour cluster */}
          <path
            className={styles.dash1}
            d="M-40,120 C120,20 220,40 340,110 C460,185 570,160 720,120"
          />
          <path
            className={styles.dash2}
            d="M-60,160 C110,70 240,85 360,145 C500,215 610,195 760,145"
          />
          <path
            className={styles.dash3}
            d="M-80,200 C120,115 260,125 380,185 C520,250 640,235 800,185"
          />

          {/* Bottom-left contour cluster */}
          <path
            className={styles.dash2}
            d="M-40,720 C120,650 250,660 380,710 C520,770 650,755 820,700"
          />
          <path
            className={styles.dash1}
            d="M-60,760 C120,700 270,710 420,760 C560,810 700,805 900,750"
          />
        </g>

        {/* Trucks moving along dotted lines */}
        <g className={styles.truckA} aria-hidden="true" transform="translate(0 -20)">
          <Truck className={styles.truckIcon} size={22} />
          <animateTransform
            attributeName="transform"
            type="scale"
            dur="18s"
            repeatCount="indefinite"
            additive="sum"
            values="1 1; 1 1; -1 1; -1 1"
            keyTimes="0;0.5;0.5;1"
            calcMode="linear"
          />
          <animate
            attributeName="opacity"
            dur="18s"
            repeatCount="indefinite"
            values="1;1;0;0;1;1"
            keyTimes="0;0.48;0.5;0.62;0.64;1"
            calcMode="linear"
          />
          <animateMotion
            dur="18s"
            repeatCount="indefinite"
            rotate="auto"
            keyPoints="0;1;1;0"
            keyTimes="0;0.5;0.62;1"
            calcMode="linear"
          >
            <mpath href="#path-top" />
          </animateMotion>
        </g>
        <g className={styles.truckB} aria-hidden="true" transform="translate(0 -20)">
          <Truck className={styles.truckIcon} size={22}>
            <animate
              attributeName="opacity"
              dur="22s"
              repeatCount="indefinite"
              begin="0.5s"
              values="1;1;0;0;1;1"
              keyTimes="0;0.48;0.5;0.62;0.64;0.75;1"
              calcMode="linear"
            />
          </Truck>
          <animateTransform
            attributeName="transform"
            type="scale"
            dur="22s"
            repeatCount="indefinite"
            begin="0.5s"
            additive="sum"
            values="-1 1; -1 1; 1 1; 1 1"
            keyTimes="0;0.5;0.5;1"
            calcMode="linear"
          />
          <animateMotion
            dur="22s"
            repeatCount="indefinite"
            rotate="auto"
            begin="0.5s"
            keyPoints="1;0;0;1"
            keyTimes="0;0.5;0.63;1"
            calcMode="linear"
          >
            <mpath href="#path-mid" />
          </animateMotion>
        </g>
        <g className={styles.truckC} aria-hidden="true" transform="translate(0 -20)">
          <Truck className={styles.truckIcon} size={22} />
          <animateTransform
            attributeName="transform"
            type="scale"
            dur="26s"
            repeatCount="indefinite"
            additive="sum"
            values="1 1; 1 1; -1 1; -1 1"
            keyTimes="0;0.5;0.5;1"
            calcMode="linear"
          />
          <animate
            attributeName="opacity"
            dur="26s"
            repeatCount="indefinite"
            values="1;1;0;0;1;1"
            keyTimes="0;0.46;0.5;0.61;0.63;1"
            calcMode="linear"
          />
          <animateMotion
            dur="26s"
            repeatCount="indefinite"
            rotate="auto"
            keyPoints="0;1;1;0"
            keyTimes="0;0.5;0.61;1"
            calcMode="linear"
          >
            <mpath href="#path-bottom" />
          </animateMotion>
        </g>
        <g className={styles.truckD} aria-hidden="true" transform="translate(0 -20)">
          <Truck className={styles.truckIcon} size={22} />
          <animateTransform
            attributeName="transform"
            type="scale"
            dur="30s"
            repeatCount="indefinite"
            additive="sum"
            values="1 1; 1 1; -1 1; -1 1"
            keyTimes="0;0.5;0.5;1"
            calcMode="linear"
          />
          <animate
            attributeName="opacity"
            dur="30s"
            repeatCount="indefinite"
            values="1;1;0;0;1;1"
            keyTimes="0;0.49;0.5;0.66;0.68;1"
            calcMode="linear"
          />
          <animateMotion
            dur="30s"
            repeatCount="indefinite"
            rotate="auto"
            keyPoints="0;1;1;0"
            keyTimes="0;0.5;0.66;1"
            calcMode="linear"
          >
            <mpath href="#path-third" />
          </animateMotion>
        </g>
        <g className={styles.truckE} aria-hidden="true" transform="translate(0 -20)">
          <Truck className={styles.truckIcon} size={22} />
          <animateTransform
            attributeName="transform"
            type="scale"
            dur="34s"
            repeatCount="indefinite"
            additive="sum"
            values="1 1; 1 1; -1 1; -1 1"
            keyTimes="0;0.5;0.5;1"
            calcMode="linear"
          />
          <animate
            attributeName="opacity"
            dur="34s"
            repeatCount="indefinite"
            values="1;1;0;0;1;1"
            keyTimes="0;0.45;0.5;0.64;0.66;1"
            calcMode="linear"
          />
          <animateMotion
            dur="34s"
            repeatCount="indefinite"
            rotate="auto"
            keyPoints="0;1;1;0"
            keyTimes="0;0.5;0.64;1"
            calcMode="linear"
          >
            <mpath href="#path-last" />
          </animateMotion>
        </g>
      </svg>

      <div className={styles.content}>{children}</div>
    </div>
  );
}
