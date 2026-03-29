export function SectionTitle({
  eyebrow,
  title,
  description,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
}) {
  return (
    <div className="space-y-2">
      {eyebrow ? (
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-amber-800">
          {eyebrow}
        </p>
      ) : null}
      <h2 className="brand-title text-3xl font-semibold tracking-tight text-stone-950">
        {title}
      </h2>
      {description ? (
        <p className="max-w-3xl text-base leading-7 text-stone-700">
          {description}
        </p>
      ) : null}
    </div>
  );
}
