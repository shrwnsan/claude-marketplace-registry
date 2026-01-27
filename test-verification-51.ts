/**
 * Test file for PR #51 - Verify job-branded title fix
 *
 * This file intentionally contains minor issues to verify:
 * 1. Claude comments use job-branded titles (Job 1/3, Job 2/3, Job 3/3)
 * 2. Workflow comments have CLAUDE_JOB markers
 * 3. JSON payloads contain real data
 *
 * Expected findings:
 * - Missing JSDoc for parameter (low severity)
 * - Unused variable (low severity)
 */

export function verifyJobBrandedTitles(input: string): void {
  // Intentional: missing JSDoc for input parameter
  const unused = "This variable is never used";

  console.log(input);
}

/**
 * Helper function with proper error handling expected
 */
export async function fetchData(url: string): Promise<unknown> {
  // This should pass - has proper error handling
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return response.json();
  } catch (error) {
    console.error('Fetch error:', error);
    throw error;
  }
}
