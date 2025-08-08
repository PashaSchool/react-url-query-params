type Capitalize<S extends string> = S extends `${infer F}${infer R}` ? `${Uppercase<F>}${R}` : S;
type QueryParamConfig<T extends string, O extends string> = {
    keyName: T;
    options: O[];
};
type QueryParamHookResult<T extends string, O extends string> = {
    [K in O as `is${Capitalize<T>}${Capitalize<K>}`]: boolean;
} & {
    [K in `set${Capitalize<T>}`]: (value: O) => void;
} & {
    [K in T]: O | null;
} & {
    [K in `toggle${Capitalize<T>}`]: () => void;
};
declare function useUrlParams<T extends string, O extends string>(config: QueryParamConfig<T, O>): QueryParamHookResult<T, O>;

export { useUrlParams };
