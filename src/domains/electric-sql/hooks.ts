import { type Row, type ShapeStreamOptions } from "@electric-sql/client";
import { useShape } from "@electric-sql/react";
import { getBaseUrl } from "~/trpc/react";

export function useElectricShape<T extends Row<unknown>>(
  params: Omit<ShapeStreamOptions, "url">,
) {
  return useShape<T>({
    ...params,
    url: `${getBaseUrl()}/api/electric-sql`,
  });
}
