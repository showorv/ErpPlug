import { useCallback, useMemo } from "react";
import { useSearchParams } from "react-router";
import type { ListQuery, ListQueryDefinition } from "@erpplug/contracts";

const LIST_KEYS = new Set(["page", "pageSize", "sort", "q"]);
const isListKey = (key: string) => LIST_KEYS.has(key) || key.startsWith("filter.");

/**
 * Keeps a list screen's query in the URL (`?page=2&sort=-createdAt&filter.status=active`), using the
 * endpoint's own definition, so reload, back/forward and shared links all show the same list.
 * Other URL parameters are left alone. A hand-edited, invalid URL falls back to the defaults.
 */
export function useListQueryState<S extends string, F extends string>(
  definition: ListQueryDefinition<S, F>,
): [ListQuery<S, F>, (next: ListQuery<S, F>) => void] {
  const [searchParams, setSearchParams] = useSearchParams();
  const key = searchParams.toString();

  const query = useMemo(() => {
    const result = definition.parse(new URLSearchParams(key), { ignoreUnknown: true });
    return result.success ? result.data : definition.defaults();
  }, [definition, key]);

  const setQuery = useCallback(
    (next: ListQuery<S, F>) => {
      setSearchParams(
        (prev) => {
          const params = new URLSearchParams();
          prev.forEach((value, name) => {
            if (!isListKey(name)) params.append(name, value);
          });
          definition.toSearchParams(next).forEach((value, name) => params.set(name, value));
          return params;
        },
        { replace: true },
      );
    },
    [definition, setSearchParams],
  );

  return [query, setQuery];
}
