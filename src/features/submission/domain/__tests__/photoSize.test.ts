import { fitWithin } from '../photoSize';

describe('fitWithin', () => {
  it('limits the width of a landscape photo', () => {
    expect(fitWithin(4000, 3000, 1280)).toEqual({ width: 1280 });
  });

  it('limits the height of a portrait photo', () => {
    expect(fitWithin(3000, 4000, 1280)).toEqual({ height: 1280 });
  });

  it('limits a square photo by its width', () => {
    expect(fitWithin(2000, 2000, 1280)).toEqual({ width: 1280 });
  });

  it('never upscales a small photo', () => {
    expect(fitWithin(1280, 960, 1280)).toBeNull();
    expect(fitWithin(800, 600, 1280)).toBeNull();
  });
});
