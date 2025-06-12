import {
  CheckIcon,
  ChevronDownIcon,
  FileIcon,
  ImageIcon,
  TextIcon,
} from "lucide-react";
import React from "react";
import { Button } from "~/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandInput,
  CommandItem,
  CommandList,
} from "~/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "~/components/ui/popover";
import { AI_MODELS } from "~/domains/chat/constants";
import { cn } from "~/lib/utils";

export const ModelSelector = ({
  modelId,
  setModelId,
}: {
  modelId: string;
  setModelId: (value: string) => void;
}) => {
  const [open, setOpen] = React.useState(false);

  const selectedModel = React.useMemo(() => {
    return AI_MODELS.find((model) => model.value === modelId);
  }, [modelId]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="secondary" className="group w-fit grow-0">
          <span>{selectedModel?.label}</span>
          <ChevronDownIcon className="transition-transform group-data-[state=open]:rotate-180" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="p-0" align="start">
        <Command>
          <CommandInput placeholder="Search model..." />
          <CommandList>
            <CommandEmpty>No model found.</CommandEmpty>
            {AI_MODELS.toSorted((a, b) => {
              if (a.value === modelId) {
                return -1;
              }

              if (b.value === modelId) {
                return 1;
              }

              return 0;
            }).map((model) => {
              const isSelected = model.value === modelId;

              const iconKey =
                model.value.split("/").at(0)?.split("-").at(0)?.toLowerCase() ??
                "";

              return (
                <CommandItem
                  key={model.value}
                  value={model.value}
                  onSelect={() => {
                    setModelId(model.value);
                    setOpen(false);
                  }}
                >
                  <CheckIcon
                    className={cn(isSelected ? "visible" : "invisible")}
                  />

                  <div
                    className="size-4 rounded-full bg-cover bg-center"
                    style={{
                      backgroundImage: `url(https://cdn.simpleicons.org/${iconKey})`,
                      backgroundSize: "contain",
                      backgroundRepeat: "no-repeat",
                    }}
                  />

                  <span className="mr-auto">{model.label}</span>

                  {model.modalities.map((modality, index) => {
                    switch (modality) {
                      case "text":
                        return (
                          <TextIcon className="text-neutral-500" key={index} />
                        );
                      case "file":
                        return (
                          <FileIcon className="text-emerald-500" key={index} />
                        );
                      case "image":
                        return (
                          <ImageIcon className="text-blue-500" key={index} />
                        );
                      default:
                        return null;
                    }
                  })}
                </CommandItem>
              );
            })}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};
