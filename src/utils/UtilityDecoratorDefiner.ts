import { MetadataKeys } from "./MetadataKeys";

export function UtilityDecoratorDefiner({
  name,
  shortName,
  target,
  key,
  propIndex,
}: {
  propIndex: number;
  target: any;
  key: string;
  shortName: string;
  name: string;
}) {
  type TPropContainer = {
    index: number;
    title: {
      shortName: string;
      name: string;
    };
    methodName: string;
  };

  type TNewContainer = {
    constructor: any;
    constructorName: any;
    props: TPropContainer[];
  };

  const propContainers: TNewContainer[] =
    Reflect.getOwnMetadata(MetadataKeys.METADATA_PROP_INDEX, target, key) || [];

  const newContainer: TNewContainer = {
    constructor: target.constructor,
    constructorName: target.constructor.name,
    props: [],
  };

  const propOfContainer: TPropContainer = {
    index: propIndex,
    methodName: key,
    title: { name, shortName },
  };

  const index = propContainers.findIndex(
    (item: { [key: string]: any }) =>
      item.constructorName === target.constructor.name
  );

  if (index === -1) {
    newContainer.props.push(propOfContainer);
    propContainers.push(newContainer);
  } else propContainers[Number(index)].props.push(propOfContainer);

  Reflect.defineMetadata(
    MetadataKeys.METADATA_PROP_INDEX,
    propContainers,
    target,
    key
  );
}
