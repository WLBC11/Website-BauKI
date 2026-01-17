// Temporary test modification for ChatContext.js to test different JSON response formats
// This will be used to temporarily modify the sendMessage function for testing

// Add this to the sendMessage function after line 350 to test different response formats:

const testResponses = [
  // Test 1: Standard JSON image response
  '{"type": "image", "imageUrl": "https://via.placeholder.com/400x300/0066cc/ffffff?text=Test+Image+1"}',
  
  // Test 2: Python-style dict image response  
  "{'type': 'image', 'imageUrl': 'https://via.placeholder.com/400x300/cc6600/ffffff?text=Test+Image+2'}",
  
  // Test 3: Text response with type
  '{"type": "text", "text": "Dies ist eine Testnachricht mit dem type-Feld. Die Nachricht sollte normal als Text angezeigt werden."}',
  
  // Test 4: Text response without type
  '{"text": "Dies ist ein Fallback-Text ohne type-Feld. Sollte ebenfalls als normaler Text angezeigt werden."}',
  
  // Test 5: Plain text
  '"Dies ist ein einfacher Text ohne JSON-Struktur. Sollte als normaler Text gerendert werden."',
  
  // Test 6: Invalid JSON
  '{broken json structure that should fallback to text'
];

// Use this counter to cycle through test responses
let testCounter = 0;

// Replace the actual API response with test data:
// Instead of: const parsed = safeParseN8n(response.data.response);
// Use: const parsed = safeParseN8n(testResponses[testCounter++ % testResponses.length]);

console.log("Test responses prepared for JSON parsing verification");