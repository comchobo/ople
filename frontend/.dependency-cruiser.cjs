module.exports = {
  forbidden: [
    {
      name: "no-circular",
      severity: "error",
      from: {},
      to: { circular: true },
    },
    {
      name: "no-unresolved",
      severity: "error",
      from: {},
      to: { couldNotResolve: true },
    },
    {
      name: "components-may-not-import-app",
      severity: "error",
      from: { path: "^components/" },
      to: { path: "^app/" },
    },
    {
      name: "lib-must-remain-domain-agnostic",
      severity: "error",
      from: { path: "^lib/" },
      to: { path: "^(api|app|components|hooks)/" },
    },
    {
      name: "api-may-not-import-ui",
      severity: "error",
      from: { path: "^api/" },
      to: { path: "^(app|components|hooks)/" },
    },
    {
      name: "api-core-runtime-is-private",
      severity: "error",
      from: { pathNot: "^api/" },
      to: {
        path: "^api/core\\.ts$",
        dependencyTypesNot: ["type-only"],
      },
    },
  ],
  options: {
    exclude: "(^|/)(node_modules|\\.venv|dist|outputs)/",
    doNotFollow: { path: "node_modules" },
    tsPreCompilationDeps: true,
    tsConfig: { fileName: "tsconfig.json" },
    enhancedResolveOptions: {
      conditionNames: ["import", "require", "node", "default"],
    },
  },
};
