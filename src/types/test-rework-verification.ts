// Test file to verify workflow after PR #44 merge
// Testing if simplified instructions result in actual JSON payloads

export interface TestInterface {
  id: string;
  value: number;
}

export function createTestItem(): TestInterface {
  return { id: "test", value: 42 };
}
