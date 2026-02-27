{ pkgs, lib, config, inputs, ... }:

{
  packages = [
    pkgs.git
  ];

  languages.javascript = {
    enable = true;
    npm.enable = true;
  };

  languages.typescript.enable = true;

  scripts.dev.exec = "npm run dev";
  scripts.build.exec = "npm run build";
  scripts.start.exec = "npm run start";
  scripts.lint.exec = "npm run lint";

  processes.dev.exec = "npm run dev";

  enterShell = ''
    if [ ! -d node_modules ]; then
      echo "Installing dependencies..."
      npm install
    fi
    echo "FictionGPT dev environment ready"
    node --version
    npm --version
  '';
}
