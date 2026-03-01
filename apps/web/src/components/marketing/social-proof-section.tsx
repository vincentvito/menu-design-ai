const stats = [
  { value: "500+", label: "Menus designed" },
  { value: "50+", label: "Restaurant styles" },
  { value: "24h", label: "Average turnaround" },
  { value: "4.9/5", label: "Customer rating" },
];

export function SocialProofSection() {
  return (
    <section className="border-y py-16">
      <div className="mx-auto max-w-5xl px-4 sm:px-6">
        <div className="grid grid-cols-2 gap-8 text-center md:grid-cols-4">
          {stats.map((stat) => (
            <div key={stat.label}>
              <p className="text-3xl font-bold">{stat.value}</p>
              <p className="mt-1 text-sm text-muted-foreground">
                {stat.label}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
