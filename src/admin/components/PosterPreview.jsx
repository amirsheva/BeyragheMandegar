export default function PosterPreview({src}) {
 if(!src) return null;
 return <img src={src} alt="poster" />;
}
