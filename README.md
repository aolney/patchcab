# 🎛 aolney/patchcab

:warning: **I decided to switch to [DISTRHO/Cardinal](https://github.com/DISTRHO/Cardinal) because it is more feature complete. I'm keeping this repo for future reference in case someone is interested in the build process** :warning:

<img src="https://raw.githubusercontent.com/spectrome/patchcab/main/core/public/assets/preview@2x.png" alt="Patchcab" width="600" height="315" />

## This is a fork of Patchcab

Patchcab is a modular Eurorack style synthesizer made with Web Audio.

Modules are built using [Tone.js Web Audio framework](https://github.com/Tonejs/Tone.js/) and [Svelte Javascript framework](https://github.com/sveltejs/svelte). Patchcab is heavily inspired by [VCV Eurorack Simulator](https://vcvrack.com).

See the [original/main repo](https://github.com/spectrome/patchcab) and its corresponding [hosted site](https://patch.cab) to create, share and remix synths with community made modules.

### Why this fork?

This fork adapts and extends patchcab so it can be embedded in a book I'm working on. 
I expect the UI changes will not be compatible with the original project vision. 

## How to set up and build

```
git clone https://github.com/aolney/patchcab.git
cd patchcab
npm install @patchcab/core
npm install @patchcab/modules
npm install gh-pages --save-dev
npm run build
```

:warning: **Never run `npx patchcab` - it will break things badly** :warning:

## How to deploy

See the `deploy` script in the top level `package.json`.
It is designed to deploy to gh-pages using a custom domain (in my case, olney.ai is the custom domain for aolney.github.io).
You can adapt the URLs and partial paths to your setup.

If you run `npm run deploy`, the scripts will copy relevant files to a new `deploy` directory and then push these to your gh-pages branch.
GitHub will then serve the pages at `your-username.github.io/your-reponame` or at the custom domain you've set up with subdirectory `your-reponame`.
In my case that is `https://olney.ai/patchcab`.

**Make sure to use the `https` prefix or modules won't appear when add them to the screen.**

## Run locally for development

Go to `./core/public`, open a terminal, and run `python3 -m http.server`.
