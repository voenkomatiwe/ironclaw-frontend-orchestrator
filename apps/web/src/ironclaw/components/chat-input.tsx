import { ImagePlus, Send, Slash } from "lucide-react";
import { useRef, useState } from "react";
import { Button } from "@/common/components/ui";
import { cn } from "@/common/lib/utils";
import type { IronclawImageAttachment } from "../api-types";
import { SlashCommandMenu } from "./slash-command-menu";

type ChatInputProps = {
  isConnected: boolean;
  isSending: boolean;
  onSend: (text: string, images: IronclawImageAttachment[]) => void;
};

export function ChatInput({ isConnected, isSending, onSend }: ChatInputProps) {
  const [input, setInput] = useState("");
  const [showSlash, setShowSlash] = useState(false);
  const [stagedImages, setStagedImages] = useState<(IronclawImageAttachment & { id: string })[]>([]);
  const fileRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  function readFilesAsImages(files: FileList | null) {
    if (!files?.length) return;
    const cap = 4 - stagedImages.length;
    const slice = Array.from(files).slice(0, Math.max(0, cap));
    for (const file of slice) {
      if (!file.type.startsWith("image/")) continue;
      const reader = new FileReader();
      reader.onload = () => {
        const r = String(reader.result ?? "");
        const base64 = r.includes(",") ? r.split(",")[1]! : r;
        setStagedImages((prev) => [
          ...prev,
          {
            id: crypto.randomUUID(),
            data: base64,
            media_type: file.type || "image/png",
          },
        ]);
      };
      reader.readAsDataURL(file);
    }
  }

  const handleSend = () => {
    const text = input.trim();
    if ((!text && stagedImages.length === 0) || isSending) return;
    onSend(
      text || "(image)",
      stagedImages.map(({ data, media_type }) => ({ data, media_type }))
    );
    setInput("");
    setShowSlash(false);
    setStagedImages([]);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleSlashSelect = (command: string) => {
    setInput(command);
    setShowSlash(false);
    textareaRef.current?.focus();
  };

  const hasContent = input.trim().length > 0 || stagedImages.length > 0;

  return (
    <div className="relative px-4 pt-2 pb-4 md:px-6">
      {showSlash && input.startsWith("/") && (
        <SlashCommandMenu filter={input} onClose={() => setShowSlash(false)} onSelect={handleSlashSelect} />
      )}

      <div className="rounded-2xl border border-border bg-surface-low p-3 shadow-lg">
        {stagedImages.length > 0 && (
          <div className="mb-2 flex flex-wrap gap-2">
            {stagedImages.map((im, i) => (
              <button
                className="flex items-center gap-1.5 rounded-lg border border-border bg-surface-high px-2.5 py-1 text-[11px] text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                key={im.id}
                onClick={() => setStagedImages((s) => s.filter((x) => x.id !== im.id))}
                title="Remove"
                type="button"
              >
                Image {i + 1} ×
              </button>
            ))}
          </div>
        )}

        <textarea
          className="w-full resize-none bg-transparent px-1 text-foreground text-sm placeholder:text-muted-foreground focus:outline-none disabled:opacity-50"
          disabled={!isConnected || isSending}
          onChange={(e) => {
            const v = e.target.value;
            setInput(v);
            setShowSlash(v.startsWith("/"));
          }}
          onKeyDown={handleKeyDown}
          placeholder={isConnected ? "Message IronClaw…" : "Waiting for connection…"}
          ref={textareaRef}
          rows={1}
          value={input}
        />

        <div className="mt-2 flex items-center justify-between border-border/50 border-t pt-2">
          <div className="flex gap-1">
            <input
              accept="image/*"
              className="hidden"
              multiple
              onChange={(e) => {
                readFilesAsImages(e.target.files);
                e.target.value = "";
              }}
              ref={fileRef}
              type="file"
            />
            <Button
              className="bg-surface-high"
              disabled={!isConnected || isSending}
              onClick={() => fileRef.current?.click()}
              size="icon"
              title="Attach images"
              type="button"
              variant="ghost"
            >
              <ImagePlus size={16} />
            </Button>
            <Button
              className="bg-surface-high"
              disabled={!isConnected || isSending}
              onClick={() => {
                setInput("/");
                setShowSlash(true);
                textareaRef.current?.focus();
              }}
              size="icon"
              title="Slash commands"
              type="button"
              variant="ghost"
            >
              <Slash size={16} />
            </Button>
          </div>

          <div className="flex items-center gap-3">
            <button
              className={cn(
                "flex h-9 w-9 items-center justify-center rounded-xl transition-colors",
                hasContent
                  ? "bg-primary text-on-primary-fixed shadow-primary/30 shadow-sm hover:bg-primary/90"
                  : "bg-surface-highest text-muted-foreground"
              )}
              disabled={!isConnected || !hasContent || isSending}
              onClick={handleSend}
              type="button"
            >
              <Send size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
