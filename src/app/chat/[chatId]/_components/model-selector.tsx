import React from "react";
import { Button } from "~/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "~/components/ui/popover";
import { saveChatModel } from "../server-actions/chat-model";
import { AI_MODELS } from "~/app/domains/chat/constants";
import {
  Command,
  CommandEmpty,
  CommandInput,
  CommandItem,
  CommandList,
} from "~/components/ui/command";
import { CheckIcon, ChevronDownIcon } from "lucide-react";
import { cn } from "~/lib/utils";

export const ModelSelector = ({ initialModel }: { initialModel: string }) => {
  const [modelId, _setModelId] = React.useState(initialModel);
  const setModelId = React.useCallback((value: string) => {
    _setModelId(value);
    void saveChatModel(value);
  }, []);

  const selectedModel = React.useMemo(() => {
    return AI_MODELS.find((model) => model.value === modelId);
  }, [modelId]);

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="secondary" className="group">
          <span>{selectedModel?.label}</span>
          <ChevronDownIcon className="transition-transform group-data-[state=open]:rotate-180" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="p-0" align="start">
        <Command>
          <CommandInput placeholder="Search model..." />
          <CommandList>
            <CommandEmpty>No model found.</CommandEmpty>
            {AI_MODELS.map((model) => {
              const isSelected = model.value === modelId;

              const iconKey =
                model.value.split("/").at(0)?.split("-").at(0)?.toLowerCase() ??
                "";

              return (
                <CommandItem
                  key={model.value}
                  value={model.value}
                  onSelect={() => setModelId(model.value)}
                >
                  <div
                    className="size-4 rounded-full bg-cover bg-center"
                    style={{
                      backgroundImage: `url(https://cdn.simpleicons.org/${iconKey})`,
                      backgroundSize: "contain",
                      backgroundRepeat: "no-repeat",
                    }}
                  />

                  <span>{model.label}</span>
                  <CheckIcon
                    className={cn(
                      "ml-auto",
                      isSelected && "visible",
                      !isSelected && "invisible",
                    )}
                  />
                </CommandItem>
              );
            })}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};
