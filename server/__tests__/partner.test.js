
const { versions } = require('../services/partner');

const v1Body = [
  {
    id: 1,
    title: 'Write report',
    dueDate: '2026-11-12'
  }
];

const v2Body = {
  data: [
    {
      id: 1,
      title: 'Write report',
      due: '2026-11-12'
    }
  ],
  count: 1
};

const expected = [
  {
    title: 'Write report',
    dueDate: '2026-11-12'
  }
];

describe('Partner API version compatibility', () => {

  test('V1 and V2 produce the same internal data', () => {
    expect(versions.v1.parse(v1Body)).toEqual(expected);

    expect(versions.v2.parse(v2Body)).toEqual(expected);
  });

  test('V1 parser rejects V2 response format', () => {
    expect(() => versions.v1.parse(v2Body)).toThrow(
      'unexpected v1 shape'
    );
  });

  test('V2 parser rejects V1 response format', () => {
    expect(() => versions.v2.parse(v1Body)).toThrow(
      'unexpected v2 shape'
    );
  });

  test('V2 parser rejects malformed data', () => {
    expect(() => versions.v2.parse({
      data: null,
      count: 0
    })).toThrow('unexpected v2 shape');
  });

});
