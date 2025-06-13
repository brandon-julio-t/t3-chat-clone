import { PaperclipIcon } from "lucide-react";
import React from "react";
import { toast } from "sonner";
import { Button } from "~/components/ui/button";
import { uploadFiles } from "../server-actions/upload-files";
import type { z } from "zod";
import type { sendMessageSchema } from "~/domains/chat/schemas";
import { type AI_MODELS } from "~/domains/chat/constants";

export const InputAttachment = ({
  setAttachmentFiles,
  modelModalities,
}: {
  setAttachmentFiles: (
    files: z.infer<typeof sendMessageSchema>["attachmentFiles"],
  ) => void;
  modelModalities: (typeof AI_MODELS)[number]["modalities"];
}) => {
  const [isLoading, setIsLoading] = React.useState(false);
  const inputFileRef = React.useRef<HTMLInputElement>(null);

  const onFilesInput = async (files: FileList | null) => {
    if (!files?.length) {
      toast.error("No files selected");
      return;
    }

    setIsLoading(true);

    const urls = await uploadFiles(files);

    setAttachmentFiles(
      urls.map((url) => ({
        url: url.downloadUrl,
        contentType: url.contentType,
      })),
    );

    setIsLoading(false);
  };

  const acceptedMimeType = React.useMemo(() => {
    let accept = "";

    if (modelModalities.includes("image")) {
      accept += "image/*,";
    }

    if (modelModalities.includes("file")) {
      accept += "application/pdf";
    }

    return accept;
  }, [modelModalities]);

  if (!acceptedMimeType) {
    return null;
  }

  return (
    <>
      <Button
        type="button"
        variant="secondary"
        size="icon"
        onClick={() => {
          inputFileRef.current?.click();
        }}
        disabled={isLoading}
      >
        <PaperclipIcon />
      </Button>

      <input
        type="file"
        accept={acceptedMimeType}
        multiple
        className="hidden"
        ref={inputFileRef}
        onChange={(e) => onFilesInput(e.target.files)}
      />
    </>
  );
};
