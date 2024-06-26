import { describe, expectTypeOf, test } from "vitest";

import { IsEntirelyReadonly, IsEntirelyWritable } from "~/src/type-utils";

describe("IsEntirelyReadonly", () => {
  test("returns true if the object is entirely readonly", () => {
    expectTypeOf<
      IsEntirelyReadonly<{ readonly a: string }>
    >().toEqualTypeOf<true>();
  });

  test("returns false if the object is entirely writable", () => {
    expectTypeOf<IsEntirelyReadonly<{ a: string }>>().toEqualTypeOf<false>();
  });

  test("returns false if the object is only partially readonly", () => {
    expectTypeOf<
      IsEntirelyReadonly<{ readonly a: string; b: string }>
    >().toEqualTypeOf<false>();
  });
});

describe("IsEntirelyMutable", () => {
  test("returns true if the object is entirely writable", () => {
    expectTypeOf<
      IsEntirelyWritable<{ a: string; b: number }>
    >().toEqualTypeOf<true>();
  });

  test("returns false if the object is entirely readonly", () => {
    expectTypeOf<
      IsEntirelyWritable<{ readonly a: string; readonly b: number }>
    >().toEqualTypeOf<false>();
  });

  test("returns false if the object is only partially writable", () => {
    expectTypeOf<
      IsEntirelyWritable<{ readonly a: string; b: number }>
    >().toEqualTypeOf<false>();
  });
});
