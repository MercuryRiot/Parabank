export const dataGenerator = {
  randomAmount: (min: number, max: number): string => {
    return (Math.random() * (max - min) + min).toFixed(2);
  },

  invalidInputs: () => ({
    zero: '0',
    negative: '-50',
    nonNumeric: 'abc$$',
    overLimit: '999999',
  }),
};
