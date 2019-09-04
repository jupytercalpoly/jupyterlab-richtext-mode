# jupyter-scribe
[![Binder](https://mybinder.org/badge_logo.svg)](https://mybinder.org/v2/gh/jupytercalpoly/jupyterlab-richtext-mode/master?urlpath=lab/tree/notebooks/Demo.ipynb)

An extension that transforms Markdown cells into rich text-editing cells, powered by ProseMirror.

![text in a markdown cell is formatted as a code block and inline math and an image is added all while live rendering](./gif/demo.gif)

## Requirements

* JupyterLab >= 1.0.2


## Contributing

If you would like to contribute to the project, please read our [contributor documentation](https://github.com/jupyterlab/jupyterlab/blob/master/CONTRIBUTING.md).

JupyterLab follows the official [Jupyter Code of Conduct](https://jupyter.org/conduct).

### Ways you can contribute

#### Rich Text Editing

- [ ] Add table support. More info at [#43](https://github.com/jupytercalpoly/jupyterlab-richtext-mode/issues/43).
- [ ] Resolve other issues.

#### UX Improvements

- [ ] Explore per-cell UI. More info at [#44](https://github.com/jupytercalpoly/jupyterlab-richtext-mode/issues/44).

### Install

The `jlpm` command is JupyterLab's pinned version of
[yarn](https://yarnpkg.com/) that is installed with JupyterLab. You may use
`yarn` or `npm` in lieu of `jlpm` below.

```bash
# Clone the repo to your local environment
# Move to wyswiwyg-editor directory
# Install dependencies
npm install
# Build Typescript source
npm run build
# Link your development version of the extension with JupyterLab
jupyter labextension link .
# Rebuild Typescript source after making changes
jlpm build
# Rebuild JupyterLab after making any changes
jupyter lab build
```

You can watch the source directory and run JupyterLab in watch mode to watch for changes in the extension's source and automatically rebuild the extension and application.

```bash
# Watch the source directory in another terminal tab
jlpm watch
# Run jupyterlab in watch mode in one terminal tab
jupyter lab --watch
```


