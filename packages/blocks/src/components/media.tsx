import { z } from "zod";
import type { BlockDefinition } from "../types.js";

// ----- Image -----
const imageSchema = z.object({
  src: z.string().default(""),
  alt: z.string().default(""),
  caption: z.string().default(""),
});
type ImageProps = z.infer<typeof imageSchema>;

export const imageBlock: BlockDefinition<ImageProps> = {
  type: "image",
  label: "Image",
  category: "media",
  icon: "Image",
  schema: imageSchema,
  defaultProps: { src: "", alt: "", caption: "" },
  editorFields: [
    { key: "src", label: "Image", type: "image" },
    { key: "alt", label: "Alt text", type: "text" },
    { key: "caption", label: "Caption", type: "text" },
  ],
  component: ({ props, className, style }) => (
    <figure className={className} style={{ margin: "1rem auto", maxWidth: 960, padding: "0 1.5rem", ...style }}>
      {props.src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={props.src} alt={props.alt} style={{ width: "100%", borderRadius: "var(--radius,0.5rem)" }} />
      ) : (
        <div style={{ background: "#e2e8f0", height: 240, borderRadius: 8, display: "grid", placeItems: "center", color: "#64748b" }}>
          No image selected
        </div>
      )}
      {props.caption && (
        <figcaption style={{ textAlign: "center", opacity: 0.7, marginTop: "0.5rem" }}>{props.caption}</figcaption>
      )}
    </figure>
  ),
};

// ----- Gallery -----
const gallerySchema = z.object({
  images: z
    .array(z.object({ src: z.string(), alt: z.string().default("") }))
    .default([]),
  columns: z.number().min(1).max(6).default(3),
});
type GalleryProps = z.infer<typeof gallerySchema>;

export const galleryBlock: BlockDefinition<GalleryProps> = {
  type: "gallery",
  label: "Gallery",
  category: "media",
  icon: "Images",
  schema: gallerySchema,
  defaultProps: { images: [], columns: 3 },
  editorFields: [
    { key: "columns", label: "Columns", type: "number" },
    {
      key: "images",
      label: "Images",
      type: "list",
      itemFields: [
        { key: "src", label: "Image", type: "image" },
        { key: "alt", label: "Alt", type: "text" },
      ],
    },
  ],
  component: ({ props, className, style }) => (
    <div
      className={className}
      style={{
        display: "grid",
        gap: "0.75rem",
        gridTemplateColumns: `repeat(${props.columns}, 1fr)`,
        maxWidth: 1080,
        margin: "1rem auto",
        padding: "0 1.5rem",
        ...style,
      }}
    >
      {props.images.length === 0 && <p style={{ opacity: 0.6 }}>No images yet.</p>}
      {props.images.map((img, i) => (
        // eslint-disable-next-line @next/next/no-img-element
        <img key={i} src={img.src} alt={img.alt} style={{ width: "100%", borderRadius: 8, objectFit: "cover", aspectRatio: "1/1" }} />
      ))}
    </div>
  ),
};

// ----- Video -----
const videoSchema = z.object({
  url: z.string().default(""),
  provider: z.enum(["file", "youtube", "vimeo"]).default("youtube"),
});
type VideoProps = z.infer<typeof videoSchema>;

const embedUrl = (props: VideoProps): string => {
  if (props.provider === "youtube") {
    const idMatch = props.url.match(/(?:v=|youtu\.be\/|embed\/)([\w-]{11})/);
    return idMatch ? `https://www.youtube.com/embed/${idMatch[1]}` : props.url;
  }
  if (props.provider === "vimeo") {
    const idMatch = props.url.match(/vimeo\.com\/(\d+)/);
    return idMatch ? `https://player.vimeo.com/video/${idMatch[1]}` : props.url;
  }
  return props.url;
};

export const videoBlock: BlockDefinition<VideoProps> = {
  type: "video",
  label: "Video",
  category: "media",
  icon: "Video",
  schema: videoSchema,
  defaultProps: { url: "", provider: "youtube" },
  editorFields: [
    {
      key: "provider",
      label: "Provider",
      type: "select",
      options: [
        { label: "YouTube", value: "youtube" },
        { label: "Vimeo", value: "vimeo" },
        { label: "File URL", value: "file" },
      ],
    },
    { key: "url", label: "Video URL", type: "text" },
  ],
  component: ({ props, className, style }) => (
    <div className={className} style={{ maxWidth: 960, margin: "1rem auto", padding: "0 1.5rem", ...style }}>
      <div style={{ position: "relative", paddingTop: "56.25%", borderRadius: 8, overflow: "hidden", background: "#000" }}>
        {props.url ? (
          props.provider === "file" ? (
            <video controls src={props.url} style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }} />
          ) : (
            <iframe
              src={embedUrl(props)}
              title="Embedded video"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              style={{ position: "absolute", inset: 0, width: "100%", height: "100%", border: 0 }}
            />
          )
        ) : (
          <div style={{ position: "absolute", inset: 0, display: "grid", placeItems: "center", color: "#94a3b8" }}>
            No video URL
          </div>
        )}
      </div>
    </div>
  ),
};
