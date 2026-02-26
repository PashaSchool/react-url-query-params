import { useRouter } from "next/router";
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
  const router = useRouter();

  // router.isReady is false on the first render during SSR/hydration.
  // When not ready, router.query is {}, so we fall back to null.
  const rawValue = router.isReady ? ((router.query[config.keyName] as string | undefined) ?? null) : null;

  // Validate that the raw value is one of the declared options (guards against manually crafted URLs).
  const currentValue: O | null = rawValue !== null && config.options.includes(rawValue as O) ? (rawValue as O) : null;

  const navigate = useCallback(
    (query: Record<string, string | undefined>, paramsConfig: ParamsConfig = { replace: false }) => {
      const method = paramsConfig.replace ? router.replace : router.push;
      method({ pathname: router.pathname, query }, undefined, { shallow: true });
    },
    [router],
  );

  const setterFunction = useCallback(
    (newValue: O, paramsConfig: ParamsConfig = { replace: false }) => {
      if (!config.options.includes(newValue)) return;
      navigate({ ...(router.query as Record<string, string>), [config.keyName]: newValue }, paramsConfig);
    },
    [config.keyName, config.options, router.query, navigate],
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
      const newQuery = { ...(router.query as Record<string, string>) };
      if (config.keyName in newQuery) {
        delete newQuery[config.keyName];
        navigate(newQuery, paramsConfig);
      }
    },
    [router.query, config.keyName, navigate],
  );

  const capitalizedOptions = useMemo(() => {
    return config.options.reduce(
      (acc, option) => {
        const capitalizedOption = upperFirst(option);
        const capitalizedKeyName = upperFirst(config.keyName);
        return Object.assign(acc, {
          [`is${capitalizedKeyName}${capitalizedOption}`]: currentValue === option,
        });
      },
      {} as { [key: string]: boolean },
    );
  }, [currentValue, config.keyName, config.options]);

  return {
    [config.keyName]: currentValue,
    [`set${upperFirst(config.keyName)}` as const]: setterFunction,
    [`toggle${upperFirst(config.keyName)}` as const]: onToggle,
    [`clear${upperFirst(config.keyName)}` as const]: clearParam,
    ...capitalizedOptions,
  } as QueryParamHookResult<T, O>;
}

export default useUrlParams;
