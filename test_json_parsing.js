// Test file to verify safeParseN8n function
// This simulates the exact function from ChatContext.js

function safeParseN8n(payload) {
  if (payload && typeof payload === "object") return payload;

  if (typeof payload !== "string") return { type: "text", text: String(payload ?? "") };

  // try proper JSON
  try { return JSON.parse(payload); } catch {}

  // try python-style dict -> json
  try {
    const fixed = payload
      .replace(/\\n/g, "\\n")
      .replace(/\\'/g, "__SQUOTE__")
      .replace(/'/g, '"')
      .replace(/__SQUOTE__/g, "'");
    return JSON.parse(fixed);
  } catch {}

  return { type: "text", text: payload };
}

// Test cases from the review request
const testCases = [
  {
    name: "Standard JSON Format (Double-Quotes)",
    input: '{"type": "image", "imageUrl": "https://example.com/image.jpg"}',
    expected: { type: "image", imageUrl: "https://example.com/image.jpg" }
  },
  {
    name: "Python-Style Dict Format (Single-Quotes)",
    input: "{'type': 'image', 'imageUrl': 'https://example.com/test.png'}",
    expected: { type: "image", imageUrl: "https://example.com/test.png" }
  },
  {
    name: "Text Response with Type",
    input: '{"type": "text", "text": "Das ist eine Testnachricht"}',
    expected: { type: "text", text: "Das ist eine Testnachricht" }
  },
  {
    name: "Text Response without Type (only text property)",
    input: '{"text": "Fallback-Text"}',
    expected: { text: "Fallback-Text" }
  },
  {
    name: "Plain Text (no JSON)",
    input: '"Einfacher Text ohne JSON"',
    expected: "Einfacher Text ohne JSON"
  },
  {
    name: "Invalid Format",
    input: '{broken json',
    expected: { type: "text", text: '{broken json' }
  }
];

console.log("=== Testing safeParseN8n Function ===\n");

testCases.forEach((testCase, index) => {
  console.log(`Test ${index + 1}: ${testCase.name}`);
  console.log(`Input: ${testCase.input}`);
  
  try {
    const result = safeParseN8n(testCase.input);
    console.log(`Output: ${JSON.stringify(result)}`);
    console.log(`Expected: ${JSON.stringify(testCase.expected)}`);
    
    const passed = JSON.stringify(result) === JSON.stringify(testCase.expected);
    console.log(`Status: ${passed ? '✅ PASS' : '❌ FAIL'}`);
    
    if (!passed) {
      console.log(`❌ Mismatch detected!`);
    }
  } catch (error) {
    console.log(`❌ Error: ${error.message}`);
  }
  
  console.log('---\n');
});