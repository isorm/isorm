import { Methods, RequestOption } from "../..";
import { Container } from "../libs/deps";
import { METADATA_PROP_INDEX } from "../metadata";
import { DefineUnderscoreDollar } from "./DefineUnderscoreDollar";

export default function HandleRequests({
    method,
    options,
    path,
  }: {
    method: Methods;
    options?: RequestOption;
    path: string;
  }) {
    DefineUnderscoreDollar();
    return (target: any, propKey: string, descriptor: PropertyDescriptor) => {
      const mtd = descriptor.value;
  
      let classMetadata = Reflect.getOwnMetadata(
        METADATA_PROP_INDEX,
        target,
        propKey
      );
  
      if (!classMetadata) return;
      classMetadata = classMetadata[0];
      const classIndex = globalThis._$?.findIndex(
        (item: any) => item.name === target.constructor.name
      );
  
      const route = {
        options,
        key: propKey,
        path: path ?? "/",
        method,
      };
  
      if (classIndex === -1) {
        const temp = {
          middlewares: [],
          name: target.constructor.name,
          basePath: "/",
          target,
          routes: [route],
        };
        globalThis._$.push(temp);
      } else globalThis._$[Number(classIndex)].routes.push(route);
  
      const index = globalThis._$.findIndex(
        (item: { name: any; }) => item.name === classMetadata.constructorName
      );
  
      if (!globalThis._$[Number(index)]?.target) {
        globalThis._$[Number(index)].target = target;
      }
  
      descriptor.value = (...data: any[]) => {
        const instance = Container.realClass(target);
        let i: string;
        for (i in classMetadata.props) {
          const item = classMetadata.props[`${i}`];
          const index = data.findIndex((_, index) => index === item.index);
          if (index === -1) continue;
          data[Number(index)] = item.attach;
        }
  
        return mtd.apply(instance, data);
      };
    };
  }
  
  