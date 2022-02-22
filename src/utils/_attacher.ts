export const _attacher = (handler: (...handlerProps: any) => any) => {
  return handler as () => {};
};
