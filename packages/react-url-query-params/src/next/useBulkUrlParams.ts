"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
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
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  type Config = { [K in keyof T]: T[K][number] };

  const navigate = useCallback(
    (params: URLSearchParams, paramsConfig: ParamsConfig = { replace: false }) => {
      const url = params.size > 0 ? `${pathname}?${params.toString()}` : pathname;
      if (paramsConfig.replace) {
        router.replace(url);
      } else {
        router.push(url);
      }
    },
    [pathname, router],
  );

  const setterFunction = useCallback(
    (values: Partial<Config>, paramsConfig: ParamsConfig = { replace: false }) => {
      const params = new URLSearchParams(searchParams.toString());
      Object.entries(values).forEach(([key, value]) => {
        params.set(key, value as string);
      });
      navigate(params, paramsConfig);
    },
    [searchParams, navigate],
  );

  const capitalizedOptions = useMemo(() => {
    const result = {} as { [key: string]: boolean };

    Object.entries(config).forEach(([key, options]) => {
      const capitalizedKeyName = upperFirst(key);
      const currentValue = searchParams.get(key);

      (options as string[]).forEach((option) => {
        const capitalizedOption = upperFirst(option);
        Object.assign(result, {
          [`is${capitalizedKeyName}${capitalizedOption}`]: currentValue === option,
        });
      });
    });

    return result;
  }, [searchParams, config]);

  const clearParams = useCallback(
    (paramsConfig: ParamsConfig = { replace: false }) => {
      const params = new URLSearchParams(searchParams.toString());
      Object.keys(config).forEach((key) => {
        if (params.has(key)) {
          params.delete(key);
        }
      });
      navigate(params, paramsConfig);
    },
    [searchParams, config, navigate],
  );

  return {
    clearParams,
    set: setterFunction,
    ...capitalizedOptions,
  } as BatchUrlReturnType<T>;
}

export default useBulkUrlParams;
