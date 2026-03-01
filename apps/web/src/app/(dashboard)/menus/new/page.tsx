"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Upload, FileText, Image, Loader2, ClipboardPaste } from "lucide-react";
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

export default function NewMenuPage() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [restaurantName, setRestaurantName] = useState("");
  const [textInput, setTextInput] = useState("");
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [activeTab, setActiveTab] = useState("upload");

  const supabase = createClient();

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

    setUploading(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        toast.error("Please sign in first");
        router.push("/login");
        return;
      }

      // TODO: Replace with real Claude Vision OCR for file uploads
      // For now, create menu with raw input and move to cuisine selection
      const insertData: Record<string, unknown> = {
        user_id: user.id,
        status: "draft",
        restaurant_name: restaurantName || "My Restaurant",
        locale: "en",
        input_method: isUpload ? "upload" : "text_paste",
      };

      if (isUpload && file) {
        insertData.original_filename = file.name;
        // TODO: Upload file to Supabase Storage and store URL
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

      toast.success("Menu created! Now select your cuisine type.");
      router.push(`/menus/${menu.id}/cuisine`);
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setUploading(false);
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
                <TabsTrigger value="upload" className="flex items-center gap-2">
                  <Upload className="h-4 w-4" />
                  Upload File
                </TabsTrigger>
                <TabsTrigger value="paste" className="flex items-center gap-2">
                  <ClipboardPaste className="h-4 w-4" />
                  Paste Text
                </TabsTrigger>
              </TabsList>

              <TabsContent value="upload" className="mt-4">
                <div
                  className={`relative flex min-h-[240px] cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed transition-colors ${dragOver ? "border-primary bg-primary/5" : "border-muted-foreground/25 hover:border-primary/50"}`}
                  onDrop={(e) => {
                    e.preventDefault();
                    setDragOver(false);
                    const f = e.dataTransfer.files[0];
                    if (f) handleFile(f);
                  }}
                  onDragOver={(e) => {
                    e.preventDefault();
                    setDragOver(true);
                  }}
                  onDragLeave={() => setDragOver(false)}
                  onClick={() =>
                    document.getElementById("file-input")?.click()
                  }
                >
                  <input
                    id="file-input"
                    type="file"
                    accept="image/jpeg,image/png,image/webp,application/pdf"
                    className="hidden"
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
                          <Image className="h-3 w-3" />
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
              Creating Menu...
            </>
          ) : (
            <>
              <Upload className="mr-2 h-4 w-4" />
              Continue to Cuisine Selection
            </>
          )}
        </Button>
      </form>
    </div>
  );
}
