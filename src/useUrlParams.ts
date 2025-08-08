import {useSearchParams} from 'react-router-dom'
import {useCallback, useMemo} from 'react'
import {upperFirst} from './utils'

type Capitalize<S extends string> = S extends `${infer F}${infer R}` ? `${Uppercase<F>}${R}` : S

type QueryParamConfig<T extends string, O extends string> = {
  keyName: T
  options: O[]
}

type QueryParamHookResult<T extends string, O extends string> = {
  [K in O as `is${Capitalize<T>}${Capitalize<K>}`]: boolean
} & {
  [K in `set${Capitalize<T>}`]: (value: O) => void
} & {
  [K in T]: O | null
} & {
  [K in `toggle${Capitalize<T>}`]: () => void
}

function useUrlParams<T extends string, O extends string>(
  config: QueryParamConfig<T, O>,
): QueryParamHookResult<T, O> {
  const [searchParams, setSearchParams] = useSearchParams()
  
  const currentValue = searchParams.get(config.keyName) as O | null
  
  const setterFunction = useCallback(
    (newValue: O) => {
      if (config.options.includes(newValue)) {
        const params = new URLSearchParams(searchParams.toString())
        params.set(config.keyName, newValue)
        
        setSearchParams([...params])
      }
    },
    [config.keyName, config.options, searchParams, setSearchParams],
  )
  
  const onToggle = useCallback(() => {
    if (config.options.length !== 2) {
      console.warn('onToggle is only available when there are exactly two options')
      return
    }
    
    let currentOptionIndex = config.options.indexOf(currentValue as O)
    let nextOption: O;
    
    if (currentOptionIndex !== -1) {
      const nextIndex = (currentOptionIndex + 1) % config.options.length
      
      nextOption = config.options[nextIndex]
    } else {
      nextOption = config.options[0]
    }
    
    setterFunction(nextOption)
  }, [config.options, currentValue, setterFunction])
  
  const capitalizedOptions = useMemo(() => {
    return config.options.reduce(
      (acc, option) => {
        const capitalizedOption = upperFirst(option)
        const capitalizedKeyName = upperFirst(config.keyName)
        
        return Object.assign(acc, {
          [`is${capitalizedKeyName}${capitalizedOption}`]: searchParams.get(config.keyName) === option,
        })
      },
      {} as { [key: string]: boolean },
    )
  }, [searchParams, config.keyName, config.options])
  
  return {
    [config.keyName]: currentValue,
    [`set${upperFirst(config.keyName)}` as const]: setterFunction,
    [`toggle${upperFirst(config.keyName)}` as const]: onToggle,
    ...capitalizedOptions,
  } as QueryParamHookResult<T, O>
}

export default useUrlParams

