"use client";

import { useState, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Upload, FileText, ImageIcon, Loader2, ClipboardPaste } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";

type ProgressStage = {
  id: string;
  label: string;
  detail: string;
  progress: number;
};

const UPLOAD_PROGRESS_STAGES: ProgressStage[] = [
  {
    id: "auth",
    label: "Checking account",
    detail: "Verifying your session before creating the menu.",
    progress: 8,
  },
  {
    id: "create",
    label: "Creating menu record",
    detail: "Setting up your menu workspace.",
    progress: 20,
  },
  {
    id: "uploading",
    label: "Uploading source file",
    detail: "Sending your menu image/PDF for analysis.",
    progress: 38,
  },
  {
    id: "reading",
    label: "Reading menu content",
    detail: "Extracting section titles, items, and descriptions.",
    progress: 58,
  },
  {
    id: "analyzing",
    label: "Analyzing prices",
    detail: "Detecting price values and currency for each item.",
    progress: 74,
  },
  {
    id: "structuring",
    label: "Structuring menu data",
    detail: "Organizing content into clean editable sections.",
    progress: 89,
  },
  {
    id: "finalizing",
    label: "Finalizing",
    detail: "Preparing your menu for review.",
    progress: 100,
  },
];

const PASTE_PROGRESS_STAGES: ProgressStage[] = [
  {
    id: "auth",
    label: "Checking account",
    detail: "Verifying your session before creating the menu.",
    progress: 8,
  },
  {
    id: "create",
    label: "Creating menu record",
    detail: "Setting up your menu workspace.",
    progress: 22,
  },
  {
    id: "reading",
    label: "Reading pasted text",
    detail: "Understanding the menu lines and section boundaries.",
    progress: 52,
  },
  {
    id: "analyzing",
    label: "Analyzing prices",
    detail: "Matching prices and currencies to menu items.",
    progress: 72,
  },
  {
    id: "structuring",
    label: "Structuring menu data",
    detail: "Building editable sections and items.",
    progress: 88,
  },
  {
    id: "finalizing",
    label: "Finalizing",
    detail: "Preparing your menu for review.",
    progress: 100,
  },
];

export default function NewMenuPage() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [restaurantName, setRestaurantName] = useState("");
  const [textInput, setTextInput] = useState("");
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [activeTab, setActiveTab] = useState("upload");
  const [isUploadRun, setIsUploadRun] = useState<boolean | null>(null);
  const [progressIndex, setProgressIndex] = useState(0);
  const [progressValue, setProgressValue] = useState(0);

  const supabase = createClient();
  const progressStages = useMemo(() => {
    if (isUploadRun === null) {
      return activeTab === "upload"
        ? UPLOAD_PROGRESS_STAGES
        : PASTE_PROGRESS_STAGES;
    }
    return isUploadRun ? UPLOAD_PROGRESS_STAGES : PASTE_PROGRESS_STAGES;
  }, [activeTab, isUploadRun]);
  const currentStage = progressStages[progressIndex] || progressStages[0];

  const handleFile = useCallback((f: File) => {
    const validTypes = [
      "image/jpeg",
      "image/png",
      "image/webp",
      "application/pdf",
    ];
    if (!validTypes.includes(f.type)) {
      toast.error("Please upload a JPEG, PNG, WebP, or PDF file");
      return;
    }
    if (f.size > 20 * 1024 * 1024) {
      toast.error("File must be under 20MB");
      return;
    }
    setFile(f);
    if (f.type.startsWith("image/")) {
      setPreview(URL.createObjectURL(f));
    } else {
      setPreview(null);
    }
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const isUpload = activeTab === "upload";
    if (isUpload && !file) {
      toast.error("Please upload a menu image or PDF");
      return;
    }
    if (!isUpload && !textInput.trim()) {
      toast.error("Please paste your menu text");
      return;
    }

    const runStages = isUpload ? UPLOAD_PROGRESS_STAGES : PASTE_PROGRESS_STAGES;
    setUploading(true);
    setIsUploadRun(isUpload);
    setProgressIndex(0);
    setProgressValue(runStages[0].progress);
    const setStage = (id: string) => {
      const index = runStages.findIndex((stage) => stage.id === id);
      if (index >= 0) {
        setProgressIndex(index);
        setProgressValue(runStages[index].progress);
      }
    };

    let stageTimer: ReturnType<typeof setInterval> | null = null;
    const stopStageTimer = () => {
      if (!stageTimer) return;
      clearInterval(stageTimer);
      stageTimer = null;
    };

    try {
      setStage("auth");
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        toast.error("Please sign in first");
        router.push("/login");
        return;
      }

      setStage("create");
      const insertData: Record<string, unknown> = {
        user_id: user.id,
        status: "draft",
        restaurant_name: restaurantName || "My Restaurant",
        locale: "en",
        input_method: isUpload ? "upload" : "text_paste",
      };

      if (isUpload && file) {
        insertData.original_filename = file.name;
      } else {
        insertData.raw_text_input = textInput;
      }

      const { data: menu, error } = await supabase
        .from("menus")
        .insert(insertData)
        .select("id")
        .single();

      if (error) {
        toast.error(`Failed to create menu: ${error.message}`);
        return;
      }

      const ingestStageOrder = isUpload
        ? ["uploading", "reading", "analyzing", "structuring"] as const
        : ["reading", "analyzing", "structuring"] as const;
      let ingestStagePointer = 0;
      setStage(ingestStageOrder[0]);
      stageTimer = setInterval(() => {
        ingestStagePointer = Math.min(
          ingestStagePointer + 1,
          ingestStageOrder.length - 1,
        );
        setStage(ingestStageOrder[ingestStagePointer]);
      }, 1300);

      let ingestResponse: Response;
      if (isUpload && file) {
        const formData = new FormData();
        formData.append("file", file);
        ingestResponse = await fetch(`/api/menus/${menu.id}/ingest`, {
          method: "POST",
          body: formData,
        });
      } else {
        ingestResponse = await fetch(`/api/menus/${menu.id}/ingest`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ raw_text_input: textInput }),
        });
      }
      stopStageTimer();
      setStage("finalizing");

      if (!ingestResponse.ok) {
        const body = (await ingestResponse.json().catch(() => ({}))) as {
          error?: string;
        };
        toast.error(
          body.error ||
            "Menu extraction failed. You can continue with manual editing.",
        );
        router.push(`/menus/${menu.id}/edit`);
        return;
      }

      toast.success("Menu extracted! Review your content before styling.");
      router.push(`/menus/${menu.id}/edit`);
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      stopStageTimer();
      setUploading(false);
      setIsUploadRun(null);
    }
  }

  const canSubmit =
    activeTab === "upload" ? !!file : textInput.trim().length > 0;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Create New Menu</h1>
        <p className="text-muted-foreground">
          Upload your existing menu or paste the text — AI will handle the rest
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {uploading && (
          <Card className="border-primary/40 bg-primary/5">
            <CardContent className="space-y-4 pt-6">
              <div className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin text-primary" />
                <p className="font-medium">{currentStage.label}</p>
              </div>
              <p className="text-sm text-muted-foreground">{currentStage.detail}</p>
              <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-primary transition-all duration-500"
                  style={{ width: `${progressValue}%` }}
                />
              </div>
              <div className="grid gap-2 sm:grid-cols-2">
                {progressStages.map((stage, index) => (
                  <div
                    key={stage.id}
                    className={`flex items-center gap-2 text-xs ${
                      index < progressIndex
                        ? "text-primary"
                        : index === progressIndex
                          ? "text-foreground"
                          : "text-muted-foreground"
                    }`}
                  >
                    <span
                      className={`h-2 w-2 rounded-full ${
                        index < progressIndex
                          ? "bg-primary"
                          : index === progressIndex
                            ? "bg-foreground"
                            : "bg-muted-foreground/50"
                      }`}
                    />
                    {stage.label}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Restaurant Details</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Label htmlFor="restaurantName">Restaurant Name</Label>
              <Input
                id="restaurantName"
                placeholder="e.g. Al Mahara Restaurant"
                value={restaurantName}
                onChange={(e) => setRestaurantName(e.target.value)}
                disabled={uploading}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Your Menu</CardTitle>
            <CardDescription>
              Upload a photo/PDF or paste your menu text. AI will extract items,
              prices, and sections.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs
              value={activeTab}
              onValueChange={setActiveTab}
              className="w-full"
            >
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger
                  value="upload"
                  className="flex items-center gap-2"
                  disabled={uploading}
                >
                  <Upload className="h-4 w-4" />
                  Upload File
                </TabsTrigger>
                <TabsTrigger
                  value="paste"
                  className="flex items-center gap-2"
                  disabled={uploading}
                >
                  <ClipboardPaste className="h-4 w-4" />
                  Paste Text
                </TabsTrigger>
              </TabsList>

              <TabsContent value="upload" className="mt-4">
                <div
                  className={`relative flex min-h-[240px] flex-col items-center justify-center rounded-lg border-2 border-dashed transition-colors ${
                    uploading
                      ? "cursor-not-allowed opacity-70"
                      : "cursor-pointer"
                  } ${dragOver ? "border-primary bg-primary/5" : "border-muted-foreground/25 hover:border-primary/50"}`}
                  onDrop={(e) => {
                    e.preventDefault();
                    if (uploading) return;
                    setDragOver(false);
                    const f = e.dataTransfer.files[0];
                    if (f) handleFile(f);
                  }}
                  onDragOver={(e) => {
                    e.preventDefault();
                    if (uploading) return;
                    setDragOver(true);
                  }}
                  onDragLeave={() => setDragOver(false)}
                  onClick={() => {
                    if (uploading) return;
                    document.getElementById("file-input")?.click()
                  }}
                >
                  <input
                    id="file-input"
                    type="file"
                    accept="image/jpeg,image/png,image/webp,application/pdf"
                    className="hidden"
                    disabled={uploading}
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) handleFile(f);
                    }}
                  />

                  {preview ? (
                    <div className="space-y-3 p-4 text-center">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={preview}
                        alt="Menu preview"
                        className="mx-auto max-h-48 rounded-md object-contain"
                      />
                      <p className="text-sm text-muted-foreground">
                        {file?.name} ({(file!.size / 1024 / 1024).toFixed(1)}{" "}
                        MB)
                      </p>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={uploading}
                        onClick={(e) => {
                          e.stopPropagation();
                          setFile(null);
                          setPreview(null);
                        }}
                      >
                        Remove
                      </Button>
                    </div>
                  ) : file ? (
                    <div className="space-y-3 p-4 text-center">
                      <FileText className="mx-auto h-12 w-12 text-muted-foreground" />
                      <p className="text-sm font-medium">{file.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {(file.size / 1024 / 1024).toFixed(1)} MB
                      </p>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={uploading}
                        onClick={(e) => {
                          e.stopPropagation();
                          setFile(null);
                        }}
                      >
                        Remove
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-3 text-center">
                      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                        <Upload className="h-6 w-6 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="font-medium">
                          Drop your menu here or click to browse
                        </p>
                        <p className="text-sm text-muted-foreground">
                          JPEG, PNG, WebP, or PDF up to 20MB
                        </p>
                      </div>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <ImageIcon className="h-3 w-3" />
                          Photos
                        </span>
                        <span className="flex items-center gap-1">
                          <FileText className="h-3 w-3" />
                          PDFs
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="paste" className="mt-4">
                <div className="space-y-3">
                  <Textarea
                    placeholder={`Paste your menu text here...\n\nExample:\nAppetizers\nHummus - Classic chickpea dip - $8\nFalafel - Crispy chickpea fritters - $10\n\nMain Courses\nGrilled Chicken - With rice and salad - $18\nLamb Chops - With roasted vegetables - $25`}
                    className="min-h-[240px] font-mono text-sm"
                    value={textInput}
                    onChange={(e) => setTextInput(e.target.value)}
                    disabled={uploading}
                  />
                  <p className="text-xs text-muted-foreground">
                    Include section names, item names, descriptions, and prices.
                    AI will structure everything automatically.
                  </p>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        <Button
          type="submit"
          size="lg"
          className="w-full"
          disabled={!canSubmit || uploading}
        >
          {uploading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Processing Menu...
            </>
          ) : (
            <>
              <Upload className="mr-2 h-4 w-4" />
              Continue to Menu Review
            </>
          )}
        </Button>
      </form>
    </div>
  );
}
