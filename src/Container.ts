export class Container {
  private static INJECT_CLASS = new Map();
  private static INJECT_LIST = Symbol("INJECT_LIST");

  static resolve<T extends { [key: string]: any }>(target: {
    new (...args: any[]): T;
  }): T {
    const targetClass = Reflect.getOwnMetadata(this.INJECT_LIST, target) || [];
    const injectlist = targetClass
      .sort((a: any, b: any) => {
        return a.index - b.index;
      })
      .map((item: any) => {
        return item.inject;
      });

    const instance = new target(...injectlist);

    this.INJECT_CLASS.set(instance, instance);

    return instance;
  }

  static realClass = (target: any) => {
    const cls = Container.resolve(target.constructor);
    const instance = this.INJECT_CLASS.get(cls);
    return instance;
  };

  static Inject(value: any) {
    return (target: any, key: PropertyKey, paramIndex: number) => {
      const injects: any[] =
        Reflect.getOwnMetadata(this.INJECT_LIST, target) || [];

      injects.push({
        key: "constructor",
        index: paramIndex,
        constructorName: target.name,
        name: value.name,
        inject: Container.resolve(value),
      });

      Reflect.defineMetadata(this.INJECT_LIST, injects, target);
    };
  }
}

export const Inject = (value: any) => Container.Inject(value);
export const Resolve = (target: any) => Container.resolve(target);
export const RealClass = (target: any) => Container.resolve(target);
