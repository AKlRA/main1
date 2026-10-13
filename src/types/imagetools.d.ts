// Build-time image transforms (vite-imagetools). Every query ends in `format=webp`.
declare module '*format=webp' {
  const src: string;
  export default src;
}
