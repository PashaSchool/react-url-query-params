import { useRouter } from "next/router";
import { useCallback, useMemo } from "react";
import type { Capitalize, ParamsConfig } from "../types.utils";
import { upperFirst } from "../utils";

type BatchUrlReturnType<T extends Record<string, readonly string[]>> = {
  set: (values: Partial<{ [K in keyof T]: T[K][number] }>, config?: ParamsConfig) => void;
  clearParams: (config?: ParamsConfig) => void;
} & {
  [K in {
    [Key in keyof T]: {
      [Val in T[Key][number]]: `is${Capitalize<Key & string>}${Capitalize<Val & string>}`;
    }[T[Key][number]];
  }[keyof T]]: boolean;
};

function useBulkUrlParams<const T extends Record<string, readonly string[]>>(config: T): BatchUrlReturnType<T> {
  const router = useRouter();

  type Config = { [K in keyof T]: T[K][number] };

  const navigate = useCallback(
    (query: Record<string, string | undefined>, paramsConfig: ParamsConfig = { replace: false }) => {
      const method = paramsConfig.replace ? router.replace : router.push;
      method({ pathname: router.pathname, query }, undefined, { shallow: true });
    },
    [router],
  );

  const setterFunction = useCallback(
    (values: Partial<Config>, paramsConfig: ParamsConfig = { replace: false }) => {
      const newQuery: Record<string, string> = { ...(router.query as Record<string, string>) };
      Object.entries(values).forEach(([key, value]) => {
        newQuery[key] = value as string;
      });
      navigate(newQuery, paramsConfig);
    },
    [router.query, navigate],
  );

  const capitalizedOptions = useMemo(() => {
    const result = {} as { [key: string]: boolean };

    Object.entries(config).forEach(([key, options]) => {
      const capitalizedKeyName = upperFirst(key);
      // When router is not ready, router.query is {} — all flags default to false.
      const currentValue = router.isReady ? router.query[key] : null;
      const currentStr = typeof currentValue === "string" ? currentValue : null;

      (options as string[]).forEach((option) => {
        const capitalizedOption = upperFirst(option);
        Object.assign(result, {
          [`is${capitalizedKeyName}${capitalizedOption}`]: currentStr === option,
        });
      });
    });

    return result;
  }, [router.isReady, router.query, config]);

  const clearParams = useCallback(
    (paramsConfig: ParamsConfig = { replace: false }) => {
      const newQuery: Record<string, string> = { ...(router.query as Record<string, string>) };
      Object.keys(config).forEach((key) => {
        delete newQuery[key];
      });
      navigate(newQuery, paramsConfig);
    },
    [router.query, config, navigate],
  );

  return {
    clearParams,
    set: setterFunction,
    ...capitalizedOptions,
  } as BatchUrlReturnType<T>;
}

export default useBulkUrlParams;
