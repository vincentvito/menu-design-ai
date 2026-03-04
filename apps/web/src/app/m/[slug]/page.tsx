import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import type { MenuData } from "@/types/menu";

export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
  },
};

export default async function PublicMenuPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const admin = createAdminClient();

  const { data: menu } = await admin
    .from("menus")
    .select("restaurant_name, locale, edited_json, extracted_json, public_published")
    .eq("public_slug", slug)
    .eq("public_published", true)
    .maybeSingle();

  if (!menu || !menu.public_published) {
    notFound();
  }

  const menuData = (menu.edited_json || menu.extracted_json) as MenuData | null;
  if (!menuData || menuData.sections.length === 0) {
    notFound();
  }

  const isArabic = menu.locale === "ar";
  const restaurantName =
    menuData.restaurant_name || menu.restaurant_name || "Restaurant Menu";

  return (
    <main
      dir={isArabic ? "rtl" : "ltr"}
      className="min-h-screen bg-background px-4 py-8 sm:px-6"
    >
      <div className="mx-auto max-w-2xl rounded-2xl border bg-card p-5 shadow-sm sm:p-8">
        <header className={`mb-6 ${isArabic ? "text-right" : "text-left"}`}>
          <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
            Digital Menu
          </p>
          <h1 className="mt-2 text-3xl font-semibold">{restaurantName}</h1>
        </header>

        <div className="space-y-7">
          {menuData.sections.map((section, sectionIndex) => {
            const sectionName = isArabic
              ? section.name_ar || section.name
              : section.name;

            return (
              <section key={`${sectionName}-${sectionIndex}`}>
                <h2 className="border-b pb-2 text-lg font-semibold">
                  {sectionName}
                </h2>
                <ul className="mt-3 space-y-3">
                  {section.items.map((item, itemIndex) => {
                    const itemName = isArabic
                      ? item.name_ar || item.name
                      : item.name;
                    const itemDescription = isArabic
                      ? item.description_ar || item.description
                      : item.description;

                    return (
                      <li key={`${itemName}-${itemIndex}`} className="space-y-1">
                        <div className="flex items-start justify-between gap-3">
                          <p className="font-medium">{itemName}</p>
                          <p className="shrink-0 text-sm font-semibold">
                            {item.price.toFixed(2)} {item.currency}
                          </p>
                        </div>
                        {itemDescription ? (
                          <p className="text-sm text-muted-foreground">
                            {itemDescription}
                          </p>
                        ) : null}
                      </li>
                    );
                  })}
                </ul>
              </section>
            );
          })}
        </div>
      </div>
    </main>
  );
}
