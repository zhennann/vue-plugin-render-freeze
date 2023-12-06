vue-plugin-render-freeze

## Installation

```sh
npm install vue-plugin-render-freeze
```

## Usage

```js

import VuePluginRenderFreeze from 'vue-plugin-render-freeze';

// install
Vue.use(VuePluginRenderFreeze);

```

You can then use the vue component:

```js
await this.renderFreezeBegin(async () => {
    ... long time operations
});
```

or 

```js
try {
    this.renderFreeze(true);
    ... long time operations
} finally {
    this.renderFreeze(false);
}
```

## License

MIT