// Test file to verify job identification in PR comments
// This should trigger medium/low findings to test triage issue creation

export function testJobIdentification(): unknown {
  // Intentional issues for review:
  // - Missing return type annotation (low)
  // - No error handling (medium)
  const data = fetchSomething();

  return data;
}

async function fetchSomething(): Promise<unknown> {
  // Intentional: no error handling for async operation (medium)
  const response = await fetch('https://api.example.com/data');
  return response.json();
}
