const expoConfig = require("eslint-config-expo/flat");

module.exports = [
  ...expoConfig,
  {
    ignores: ["dist/*", ".expo/*", "node_modules/*", "backend/*"],
  },
  {
    rules: {
      "react-hooks/purity": "off",
      "react-hooks/immutability": "off",
      "react-hooks/refs": "off",
      "react-hooks/set-state-in-effect": "off",
      "react-hooks/exhaustive-deps": "off",
      "import/no-unresolved": "off",
      "react/no-unescaped-entities": "off",
    },
  },
];
