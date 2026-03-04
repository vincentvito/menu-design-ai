"use client";

import { use, useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  Check,
  CreditCard,
  Download,
  ExternalLink,
  Globe,
  Loader2,
  QrCode,
} from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import {
  activateBasicPackage,
  createMenuPackageCheckout,
} from "@/app/actions/credits";
import { toggleMenuPublish } from "@/app/actions/menu-publication";
import { MENU_PACKAGES } from "@/lib/menu-packages";
import type { MenuPackage } from "@/types/menu";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

type MenuPackageState = {
  restaurant_name: string | null;
  selected_image_id: string | null;
  output_package: MenuPackage | null;
  digital_unlocked: boolean;
  public_slug: string | null;
  public_published: boolean;
  public_visibility: "unlisted";
};

export default function PackagePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: menuId } = use(params);
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();
  const purchaseToastShownRef = useRef(false);

  const [menu, setMenu] = useState<MenuPackageState | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [busyAction, setBusyAction] = useState<string | null>(null);

  const loadMenu = useCallback(async () => {
    const { data } = await supabase
      .from("menus")
      .select(
        [
          "restaurant_name",
          "selected_image_id",
          "output_package",
          "digital_unlocked",
          "public_slug",
          "public_published",
          "public_visibility",
        ].join(", "),
      )
      .eq("id", menuId)
      .single();

    if (!data) {
      setMenu(null);
      setImageUrl(null);
      setLoading(false);
      return;
    }

    const typed = data as unknown as MenuPackageState;
    setMenu(typed);

    if (typed.selected_image_id) {
      const { data: img } = await supabase
        .from("ai_generation_images")
        .select("image_url")
        .eq("id", typed.selected_image_id)
        .single();
      setImageUrl((img as { image_url: string | null } | null)?.image_url ?? null);
    } else {
      setImageUrl(null);
    }

    setLoading(false);
  }, [menuId, supabase]);

  useEffect(() => {
    loadMenu();
  }, [loadMenu]);

  useEffect(() => {
    if (searchParams.get("packagePurchased") === "true" && !purchaseToastShownRef.current) {
      purchaseToastShownRef.current = true;
      toast.success("Payment received. Your package has been unlocked.");
      loadMenu();
    }
  }, [searchParams, loadMenu]);

  const baseUrl = useMemo(() => {
    if (process.env.NEXT_PUBLIC_APP_URL) {
      return process.env.NEXT_PUBLIC_APP_URL;
    }
    if (typeof window !== "undefined") {
      return window.location.origin;
    }
    return "";
  }, []);

  const publicUrl = menu?.public_slug ? `${baseUrl}/m/${menu.public_slug}` : null;
  const basicUnlocked = !!menu && menu.output_package !== null;
  const digitalUnlocked = !!menu?.digital_unlocked;
  const proUnlocked = menu?.output_package === "pro";
  const canDownloadPlainPdf = menu?.output_package === "basic" || menu?.output_package === "pro";

  async function handleActivateBasic() {
    if (!menu?.selected_image_id) {
      toast.error("Please select a design first.");
      router.push(`/menus/${menuId}/results`);
      return;
    }

    setBusyAction("basic");
    const result = await activateBasicPackage(menuId);
    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success("Basic package activated.");
      await loadMenu();
    }
    setBusyAction(null);
  }

  async function handleCheckout(packageType: "digital" | "pro") {
    if (!menu?.selected_image_id) {
      toast.error("Please select a design first.");
      router.push(`/menus/${menuId}/results`);
      return;
    }

    setBusyAction(packageType);
    try {
      const result = await createMenuPackageCheckout(menuId, packageType);
      if (result.error) {
        toast.error(result.error);
      } else if (result.url) {
        window.location.assign(result.url);
        return;
      }
    } catch {
      toast.error("Failed to create checkout session.");
    }
    setBusyAction(null);
  }

  async function handlePublishToggle(nextPublished: boolean) {
    if (!menu) return;

    setBusyAction(nextPublished ? "publish" : "unpublish");
    const result = await toggleMenuPublish(menuId, nextPublished);
    if (result.error) {
      toast.error(result.error);
    } else {
      setMenu((prev) =>
        prev && result.state
          ? {
              ...prev,
              ...result.state,
            }
          : prev,
      );
      toast.success(nextPublished ? "Menu published." : "Menu unpublished.");
    }
    setBusyAction(null);
  }

  async function downloadFromEndpoint(endpoint: string, fallbackName: string) {
    setBusyAction(endpoint);
    try {
      const response = await fetch(endpoint);
      if (!response.ok) {
        let message = "Download failed";
        try {
          const json = (await response.json()) as { error?: string };
          if (json.error) message = json.error;
        } catch {
          // ignore parse errors
        }
        throw new Error(message);
      }

      const blob = await response.blob();
      const downloadUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = downloadUrl;
      a.download =
        response.headers
          .get("content-disposition")
          ?.match(/filename="(.+)"/)?.[1] ?? fallbackName;
      a.click();
      URL.revokeObjectURL(downloadUrl);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Download failed";
      toast.error(message);
    } finally {
      setBusyAction(null);
    }
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-5xl space-y-6">
        <Skeleton className="h-8 w-56" />
        <div className="grid gap-6 md:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-72" />
          ))}
        </div>
      </div>
    );
  }

  if (!menu) {
    return (
      <div className="mx-auto max-w-3xl space-y-4 text-center">
        <h1 className="text-2xl font-bold">Menu not found</h1>
        <Button asChild>
          <Link href="/menus">Back to Menus</Link>
        </Button>
      </div>
    );
  }

  if (!menu.selected_image_id) {
    return (
      <div className="mx-auto max-w-3xl space-y-4 text-center">
        <h1 className="text-2xl font-bold">Pick a design first</h1>
        <p className="text-muted-foreground">
          Select one AI design before choosing a package.
        </p>
        <Button onClick={() => router.push(`/menus/${menuId}/results`)}>
          Go to Design Results
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Choose Your Package</h1>
          <p className="text-muted-foreground">
            {menu.restaurant_name || "Your menu"} &middot; unlock print or digital deliverables
          </p>
        </div>
        <Button variant="outline" onClick={() => router.push(`/menus/${menuId}/results`)}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Results
        </Button>
      </div>

      {imageUrl ? (
        <Card>
          <CardHeader>
            <CardTitle>Selected Design</CardTitle>
          </CardHeader>
          <CardContent>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={imageUrl}
              alt="Selected menu design"
              className="mx-auto aspect-[3/4] max-h-[420px] rounded-lg border object-cover"
            />
          </CardContent>
        </Card>
      ) : null}

      <div className="grid gap-6 md:grid-cols-3">
        {(Object.keys(MENU_PACKAGES) as MenuPackage[]).map((pkgKey) => {
          const pkg = MENU_PACKAGES[pkgKey];
          const isUnlocked =
            pkg.slug === "basic"
              ? basicUnlocked
              : pkg.slug === "digital"
                ? digitalUnlocked
                : proUnlocked;
          const isCurrent = menu.output_package === pkg.slug;

          return (
            <Card
              key={pkg.slug}
              className={isCurrent ? "border-primary shadow-sm" : undefined}
            >
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>{pkg.name}</CardTitle>
                  {isUnlocked ? <Badge>Unlocked</Badge> : null}
                </div>
                <p className="text-2xl font-semibold">{pkg.priceLabel}</p>
                <p className="text-sm text-muted-foreground">{pkg.description}</p>
              </CardHeader>
              <CardContent className="space-y-4">
                <ul className="space-y-2 text-sm text-muted-foreground">
                  {pkg.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>

                {pkg.slug === "basic" ? (
                  <Button
                    className="w-full"
                    variant={isUnlocked ? "outline" : "default"}
                    onClick={handleActivateBasic}
                    disabled={!!busyAction || isUnlocked}
                  >
                    {busyAction === "basic" ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : null}
                    {isUnlocked ? "Basic Active" : "Activate Basic"}
                  </Button>
                ) : (
                  <Button
                    className="w-full"
                    variant={isUnlocked ? "outline" : "default"}
                    disabled={!!busyAction || isUnlocked}
                    onClick={() => handleCheckout(pkg.slug as "digital" | "pro")}
                  >
                    {busyAction === pkg.slug ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <CreditCard className="mr-2 h-4 w-4" />
                    )}
                    {isUnlocked ? `${pkg.name} Unlocked` : `Buy ${pkg.name}`}
                  </Button>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {(canDownloadPlainPdf || digitalUnlocked) && (
        <Card>
          <CardHeader>
            <CardTitle>Downloads</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-3">
            {canDownloadPlainPdf ? (
              <Button
                variant="outline"
                onClick={() =>
                  downloadFromEndpoint(
                    `/api/menus/${menuId}/pdf`,
                    `${menu.restaurant_name || "menu"}-design.pdf`,
                  )
                }
                disabled={!!busyAction}
              >
                {busyAction === `/api/menus/${menuId}/pdf` ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Download className="mr-2 h-4 w-4" />
                )}
                Download PDF
              </Button>
            ) : null}

            {digitalUnlocked && menu.public_published ? (
              <Button
                variant="outline"
                onClick={() =>
                  downloadFromEndpoint(
                    `/api/menus/${menuId}/pdf?includeQr=1`,
                    `${menu.restaurant_name || "menu"}-with-qr-design.pdf`,
                  )
                }
                disabled={!!busyAction}
              >
                {busyAction === `/api/menus/${menuId}/pdf?includeQr=1` ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <QrCode className="mr-2 h-4 w-4" />
                )}
                Download PDF with QR
              </Button>
            ) : null}
          </CardContent>
        </Card>
      )}

      {digitalUnlocked && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5" />
              Digital Menu Publishing
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-md border bg-muted/40 p-4 text-sm">
              <p>
                Status:{" "}
                <span className="font-medium">
                  {menu.public_published ? "Published" : "Unpublished"}
                </span>
              </p>
              <p className="text-muted-foreground">
                Visibility: {menu.public_visibility}
              </p>
            </div>

            {!menu.public_published ? (
              <Button
                onClick={() => handlePublishToggle(true)}
                disabled={!!busyAction}
              >
                {busyAction === "publish" ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Globe className="mr-2 h-4 w-4" />
                )}
                Publish Digital Menu
              </Button>
            ) : (
              <div className="space-y-4">
                {publicUrl ? (
                  <div className="rounded-md border p-3">
                    <p className="text-sm text-muted-foreground">Public URL</p>
                    <a
                      href={publicUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-1 inline-flex items-center gap-1 text-sm font-medium text-primary underline-offset-2 hover:underline"
                    >
                      {publicUrl}
                      <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  </div>
                ) : null}

                <div className="flex flex-wrap gap-3">
                  <Button
                    variant="outline"
                    onClick={() =>
                      downloadFromEndpoint(
                        `/api/menus/${menuId}/qr?format=png`,
                        `${menu.restaurant_name || "menu"}-qr.png`,
                      )
                    }
                    disabled={!!busyAction}
                  >
                    {busyAction === `/api/menus/${menuId}/qr?format=png` ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <QrCode className="mr-2 h-4 w-4" />
                    )}
                    Download QR (PNG)
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() =>
                      downloadFromEndpoint(
                        `/api/menus/${menuId}/qr?format=svg`,
                        `${menu.restaurant_name || "menu"}-qr.svg`,
                      )
                    }
                    disabled={!!busyAction}
                  >
                    {busyAction === `/api/menus/${menuId}/qr?format=svg` ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <QrCode className="mr-2 h-4 w-4" />
                    )}
                    Download QR (SVG)
                  </Button>
                </div>

                <Button
                  variant="ghost"
                  onClick={() => handlePublishToggle(false)}
                  disabled={!!busyAction}
                >
                  {busyAction === "unpublish" ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : null}
                  Unpublish Menu
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
