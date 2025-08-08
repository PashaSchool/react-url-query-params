// src/useUrlParams.ts
import { useSearchParams } from "react-router-dom";
import { useCallback, useMemo } from "react";

// src/utils.ts
var upperFirst = (s) => s ? s[0].toUpperCase() + s.slice(1) : s;

// src/useUrlParams.ts
function useUrlParams(config) {
  const [searchParams, setSearchParams] = useSearchParams();
  const currentValue = searchParams.get(config.keyName);
  const setterFunction = useCallback(
    (newValue) => {
      if (config.options.includes(newValue)) {
        const params = new URLSearchParams(searchParams.toString());
        params.set(config.keyName, newValue);
        setSearchParams([...params]);
      }
    },
    [config.keyName, config.options, searchParams, setSearchParams]
  );
  const onToggle = useCallback(() => {
    if (config.options.length !== 2) {
      console.warn("onToggle is only available when there are exactly two options");
      return;
    }
    let currentOptionIndex = config.options.indexOf(currentValue);
    let nextOption;
    if (currentOptionIndex !== -1) {
      const nextIndex = (currentOptionIndex + 1) % config.options.length;
      nextOption = config.options[nextIndex];
    } else {
      nextOption = config.options[0];
    }
    setterFunction(nextOption);
  }, [config.options, currentValue, setterFunction]);
  const capitalizedOptions = useMemo(() => {
    return config.options.reduce(
      (acc, option) => {
        const capitalizedOption = upperFirst(option);
        const capitalizedKeyName = upperFirst(config.keyName);
        return Object.assign(acc, {
          [`is${capitalizedKeyName}${capitalizedOption}`]: searchParams.get(config.keyName) === option
        });
      },
      {}
    );
  }, [searchParams, config.keyName, config.options]);
  return {
    [config.keyName]: currentValue,
    [`set${upperFirst(config.keyName)}`]: setterFunction,
    [`toggle${upperFirst(config.keyName)}`]: onToggle,
    ...capitalizedOptions
  };
}
var useUrlParams_default = useUrlParams;
export {
  useUrlParams_default as useUrlParams
};
