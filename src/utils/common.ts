export const enumToArrayValue = (enumValue: { [key: string]: string | number }) => {
  return Object.values(enumValue).filter((value) => typeof value === 'number') as number[];
};
