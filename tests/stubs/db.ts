// Pure unit tests never touch the database. Fail loudly if a test does.
export const db: never = new Proxy({} as never, {
  get(_target, prop) {
    throw new Error(`Unexpected database access in a unit test: ${String(prop)}`);
  },
});
