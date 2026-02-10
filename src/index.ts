import { App, ref, withCtx } from "vue";

export type FunctionAsync<RESULT> = () => Promise<RESULT>;

const SymbolRenderOriginal = Symbol("SymbolRenderOriginal");
const SymbolRenderPatch = Symbol("SymbolRenderPatch");
const SymbolRenderFreezeCounter = Symbol("SymbolRenderFreezeCounter");
const SymbolRenderFreezeSnapshot = Symbol("SymbolRenderFreezeSnapshot");

export const PluginFreeze = {
  install(app: App) {
    app.mixin({
      created() {
        const renderMethod = "render";
        const self = this;
        const instance = this._;
        self[SymbolRenderFreezeCounter] = ref(0);
        self[SymbolRenderFreezeSnapshot] = undefined;
        self[SymbolRenderOriginal] = instance[renderMethod];
        self[SymbolRenderPatch] = function (this, ...args) {
          // @ts-ignore ignore
          if (process.env.SERVER) {
            return withCtx(() => {
              return self[SymbolRenderOriginal].call(this, ...args);
            }, instance)();
          } else {
            return self[SymbolRenderOriginal].call(this, ...args);
          }
        };
        instance[renderMethod] = function (this, ...args) {
          if (self[SymbolRenderFreezeCounter].value === 0) {
            return self[SymbolRenderPatch].call(this, ...args);
          }
          if (!self[SymbolRenderFreezeSnapshot]) {
            self[SymbolRenderFreezeSnapshot] = self[SymbolRenderPatch].call(
              this,
              ...args,
            );
          }
          return self[SymbolRenderFreezeSnapshot];
        };
      },
      beforeUnmount() {
        const self = this;
        if (self[SymbolRenderFreezeSnapshot]) {
          self[SymbolRenderFreezeSnapshot] = undefined;
        }
      },
      methods: {
        renderFreeze(freeze: boolean) {
          const self = this;
          if (freeze) {
            if (self[SymbolRenderFreezeCounter].value === 0) {
              self[SymbolRenderFreezeSnapshot] = undefined;
            }
            self[SymbolRenderFreezeCounter].value++;
          } else {
            self[SymbolRenderFreezeCounter].value--;
            if (self[SymbolRenderFreezeCounter].value === 0) {
              self[SymbolRenderFreezeSnapshot] = undefined;
            }
          }
        },
        async renderFreezeScope<RESULT>(
          fn: FunctionAsync<RESULT>,
        ): Promise<RESULT> {
          const self = this;
          try {
            self.renderFreeze(true);
            return await fn();
          } finally {
            self.renderFreeze(false);
          }
        },
      },
    });
  },
};
