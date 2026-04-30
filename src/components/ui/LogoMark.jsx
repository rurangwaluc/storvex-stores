export default function LogoMark({ compact = false }) {
  return (
    <div className="inline-flex items-center">
      <img
        src="/logo.webp"
        alt="Storvex"
        className={
          compact
            ? "h-12 w-auto object-contain sm:h-14"
            : "h-14 w-auto object-contain sm:h-16 lg:h-[72px]"
        }
        draggable="false"
      />
    </div>
  );
}