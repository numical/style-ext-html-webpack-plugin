#TODO
1. Failures with v4 of everything:
    ```bash
    1) Core Functionality (webpack v4.35.2, htmlWebpackPlugin v4.0.0-beta.5, mini-css-extract-plugin v0.7.0) works with html webpack plugin template styles
      - Expected true to be false.
      - Expected '<!doctype html><html><head><meta charset="UTF-8"><style>div { background: blue }</style><link href="styles.css" rel="stylesheet"></head><body><div id="template_content"><script src="index_bundle.js"></script></div></body></html>' to match /<style[\s\S]*background: snow;[\s\S]*<\/style>/.
      - Expected '<!doctype html><html><head><meta charset="UTF-8"><style>div { background: blue }</style><link href="styles.css" rel="stylesheet"></head><body><div id="template_content"><script src="index_bundle.js"></script></div></body></html>' to match /<div id='template_content'>/.
    
    2) Core Functionality (webpack v4.35.2, htmlWebpackPlugin v4.0.0-beta.5, mini-css-extract-plugin v0.7.0) plays happily with other plugins using same html plugin event
      - Expected '<!doctype html><html><head><meta charset="UTF-8"><style>body {
        background: snow;
      }</style></head><body><div id="template_content"><script src="index_bundle.js?ad536122238268c6c186"></script></div></body></html>' to match /<script type="text\/javascript" src="index_bundle.js[?]?[\S]*" async><\/script>/.
    
    3) Custom css RegExp (webpack v4.35.2, htmlWebpackPlugin v4.0.0-beta.5, mini-css-extract-plugin v0.7.0) works with html webpack plugin template styles
      - Expected true to be false.
      - Expected '<!doctype html><html><head><meta charset="UTF-8"><style>div { background: blue }</style><link href="styles.css?qwerty" rel="stylesheet"></head><body><div id="template_content"><script src="index_bundle.js"></script></div></body></html>' to match /<style[\s\S]*background: snow;[\s\S]*<\/style>/.
      - Expected '<!doctype html><html><head><meta charset="UTF-8"><style>div { background: blue }</style><link href="styles.css?qwerty" rel="stylesheet"></head><body><div id="template_content"><script src="index_bundle.js"></script></div></body></html>' to match /<div id='template_content'>/.
    
    4) Custom css RegExp (webpack v4.35.2, htmlWebpackPlugin v4.0.0-beta.5, mini-css-extract-plugin v0.7.0) plays happily with other plugins using same html plugin event
      - Expected '<!doctype html><html><head><meta charset="UTF-8"><style>body {
        background: snow;
      }</style></head><body><div id="template_content"><script src="index_bundle.js?ad536122238268c6c186"></script></div></body></html>' to match /<script type="text\/javascript" src="index_bundle.js[?]?[\S]*" async><\/script>/.
    
    5) Explicitly Setting Position (webpack webpack v4.35.2, htmlWebpackPlugin v4.0.0-beta.5, mini-css-extract-plugin v0.7.0) works with html webpack plugin template styles
      - Expected true to be false.
      - Expected '<!doctype html><html><head><meta charset="UTF-8"><style>div { background: blue }</style><link href="styles.css" rel="stylesheet"></head><body><div id="template_content"><script src="index_bundle.js"></script></div></body></html>' to match /<style[\s\S]*background: snow;[\s\S]*<\/style>/.
      - Expected '<!doctype html><html><head><meta charset="UTF-8"><style>div { background: blue }</style><link href="styles.css" rel="stylesheet"></head><body><div id="template_content"><script src="index_bundle.js"></script></div></body></html>' to match /<div id='template_content'>/.
    ```
1. Multi-entry config for mini-css-extract-plugin
1. Enable HMR tests for mini-css-extract-plugin
1. Update README for mini-css-extract-plugin 
