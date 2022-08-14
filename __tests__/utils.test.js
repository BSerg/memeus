import {floor, ceil, round} from '../src/utils';

test('floor 1.335 must be 1.33', () => {
    expect(floor(1.335)).toBe(1.33);
});

test('ceil 1.335 must be 1.34', () => {
    expect(ceil(1.335)).toBe(1.34);
});

test('round 1.335 must be 1.34', () => {
    expect(round(1.335)).toBe(1.34);
});