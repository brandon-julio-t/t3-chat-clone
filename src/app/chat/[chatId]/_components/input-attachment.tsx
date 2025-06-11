import { PaperclipIcon } from "lucide-react";
import React from "react";
import { toast } from "sonner";
import { Button } from "~/components/ui/button";
import { uploadFiles } from "../server-actions/upload-files";
import type { z } from "zod";
import type { sendMessageSchema } from "~/app/domains/chat";

export const InputAttachment = ({
  setAttachmentFiles,
}: {
  setAttachmentFiles: (
    files: z.infer<typeof sendMessageSchema>["attachmentFiles"],
  ) => void;
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
        accept="image/*,application/pdf"
        multiple
        className="hidden"
        ref={inputFileRef}
        onChange={(e) => onFilesInput(e.target.files)}
      />
    </>
  );
};
