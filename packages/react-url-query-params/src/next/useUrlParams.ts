"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useMemo } from "react";
import type { Capitalize, ParamsConfig, QueryParamConfig } from "../types.utils";
import { upperFirst } from "../utils";

type QueryParamHookResult<T extends string, O extends string> = {
  [K in O as `is${Capitalize<T>}${Capitalize<K>}`]: boolean;
} & {
  [K in `set${Capitalize<T>}`]: (value: O, config?: ParamsConfig) => void;
} & {
  [K in T]: O | null;
} & {
  [K in `toggle${Capitalize<T>}`]: (config?: ParamsConfig) => void;
} & {
  [K in `clear${Capitalize<T>}`]: (config?: ParamsConfig) => void;
};

function useUrlParams<T extends string, O extends string>(config: QueryParamConfig<T, O>): QueryParamHookResult<T, O> {
  // useSearchParams() requires a <Suspense> boundary above this component.
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const currentValue = searchParams.get(config.keyName) as O | null;

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
    (newValue: O, paramsConfig: ParamsConfig = { replace: false }) => {
      if (config.options.includes(newValue)) {
        const params = new URLSearchParams(searchParams.toString());
        params.set(config.keyName, newValue);
        navigate(params, paramsConfig);
      }
    },
    [config.keyName, config.options, searchParams, navigate],
  );

  const onToggle = useCallback(
    (paramsConfig: ParamsConfig = { replace: false }) => {
      if (config.options.length !== 2) {
        console.warn("onToggle is only available when there are exactly two options");
        return;
      }

      const currentOptionIndex = config.options.indexOf(currentValue as O);
      let nextOption: O;

      if (currentOptionIndex !== -1) {
        const nextIndex = (currentOptionIndex + 1) % config.options.length;
        nextOption = config.options[nextIndex];
      } else {
        nextOption = config.options[0];
      }

      setterFunction(nextOption, paramsConfig);
    },
    [config.options, currentValue, setterFunction],
  );

  const clearParam = useCallback(
    (paramsConfig: ParamsConfig = { replace: false }) => {
      const params = new URLSearchParams(searchParams.toString());
      if (params.has(config.keyName)) {
        params.delete(config.keyName);
        navigate(params, paramsConfig);
      }
    },
    [searchParams, config.keyName, navigate],
  );

  const capitalizedOptions = useMemo(() => {
    return config.options.reduce(
      (acc, option) => {
        const capitalizedOption = upperFirst(option);
        const capitalizedKeyName = upperFirst(config.keyName);
        return Object.assign(acc, {
          [`is${capitalizedKeyName}${capitalizedOption}`]: searchParams.get(config.keyName) === option,
        });
      },
      {} as { [key: string]: boolean },
    );
  }, [searchParams, config.keyName, config.options]);

  return {
    [config.keyName]: currentValue,
    [`set${upperFirst(config.keyName)}` as const]: setterFunction,
    [`toggle${upperFirst(config.keyName)}` as const]: onToggle,
    [`clear${upperFirst(config.keyName)}` as const]: clearParam,
    ...capitalizedOptions,
  } as QueryParamHookResult<T, O>;
}

export default useUrlParams;
