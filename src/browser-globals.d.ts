declare const chrome: {
  storage: {
    local: {
      get(key: string, cb: (items: Record<string, unknown>) => void): void;
      set(items: Record<string, unknown>, cb?: () => void): void;
    };
    onChanged: {
      addListener(
        cb: (
          changes: Record<string, { newValue?: unknown; oldValue?: unknown }>,
          areaName: string,
        ) => void,
      ): void;
    };
  };
};
