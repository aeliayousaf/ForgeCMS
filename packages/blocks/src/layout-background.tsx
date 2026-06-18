import type { CSSProperties, ReactNode } from "react";
import { backgroundSizeToCss, pickBackgroundProps } from "./background.js";

export function LayoutBackground({
  props,
  className,
  style,
  contentClassName,
  contentStyle,
  children,
}: {
  props: Record<string, unknown>;
  className?: string;
  style?: CSSProperties;
  contentClassName?: string;
  contentStyle?: CSSProperties;
  children?: ReactNode;
}) {
  const bg = pickBackgroundProps(props);
  const hasImage = Boolean(bg.backgroundImage);

  if (!hasImage) {
    return (
      <div className={className} style={style}>
        {children}
      </div>
    );
  }

  const parallax = bg.backgroundScroll === "parallax";
  return (
    <div
      className={["fc-bg-layer", parallax ? "fc-bg-layer--parallax" : "", className].filter(Boolean).join(" ")}
      style={style}
    >
      <div
        className="fc-bg-layer__image"
        aria-hidden
        style={{
          backgroundImage: `url(${bg.backgroundImage})`,
          backgroundSize: backgroundSizeToCss(bg.backgroundSize),
          backgroundPosition: bg.backgroundPosition,
        }}
      />
      {bg.backgroundOverlayOpacity > 0 && (
        <div
          className="fc-bg-layer__overlay"
          style={{
            backgroundColor: bg.backgroundOverlay || "#000000",
            opacity: bg.backgroundOverlayOpacity / 100,
          }}
        />
      )}
      <div className={["fc-bg-layer__content", contentClassName].filter(Boolean).join(" ")} style={contentStyle}>
        {children}
      </div>
    </div>
  );
}
