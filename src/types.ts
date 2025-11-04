type Theme = {
  themeVariables: Record<string, string | Record<string, string>>;
};

export interface PluginOptions {
  className?: string;
  theme?: {
    light?: Theme;
    dark?: Theme;
  };
  cspSafe?: boolean;
}
