// Mock data for ChatGPT clone

export const mockConversations = [
  {
    id: '1',
    title: 'React Component Help',
    messages: [
      {
        id: 'm1',
        role: 'user',
        content: 'How do I create a custom React hook?',
        timestamp: new Date('2025-07-15T10:00:00')
      },
      {
        id: 'm2',
        role: 'assistant',
        content: `Creating a custom React hook is straightforward! Here's a simple example:

\`\`\`javascript
import { useState, useEffect } from 'react';

function useLocalStorage(key, initialValue) {
  const [storedValue, setStoredValue] = useState(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      return initialValue;
    }
  });

  const setValue = (value) => {
    try {
      setStoredValue(value);
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.log(error);
    }
  };

  return [storedValue, setValue];
}
\`\`\`

**Key rules for custom hooks:**
1. Always start the name with "use"
2. Can call other hooks inside
3. Share stateful logic, not state itself`,
        timestamp: new Date('2025-07-15T10:00:30')
      }
    ],
    createdAt: new Date('2025-07-15T10:00:00')
  },
  {
    id: '2',
    title: 'Python Data Analysis',
    messages: [
      {
        id: 'm3',
        role: 'user',
        content: 'What\'s the best way to read a CSV file in Python?',
        timestamp: new Date('2025-07-14T15:30:00')
      },
      {
        id: 'm4',
        role: 'assistant',
        content: `The most common and recommended way is using **pandas**:

\`\`\`python
import pandas as pd

# Basic reading
df = pd.read_csv('your_file.csv')

# With options
df = pd.read_csv('your_file.csv', 
                 delimiter=',',
                 encoding='utf-8',
                 header=0)

print(df.head())
\`\`\`

For simpler cases, you can use the built-in **csv** module:

\`\`\`python
import csv

with open('your_file.csv', 'r') as file:
    reader = csv.reader(file)
    for row in reader:
        print(row)
\`\`\``,
        timestamp: new Date('2025-07-14T15:30:45')
      }
    ],
    createdAt: new Date('2025-07-14T15:30:00')
  },
  {
    id: '3',
    title: 'API Design Best Practices',
    messages: [
      {
        id: 'm5',
        role: 'user',
        content: 'What are REST API best practices?',
        timestamp: new Date('2025-07-13T09:15:00')
      },
      {
        id: 'm6',
        role: 'assistant',
        content: `Here are the essential **REST API best practices**:

## 1. Use Proper HTTP Methods
- **GET** - Retrieve resources
- **POST** - Create new resources
- **PUT** - Update entire resources
- **PATCH** - Partial updates
- **DELETE** - Remove resources

## 2. Use Meaningful URLs
\`\`\`
Good: /api/users/123/orders
Bad:  /api/getOrdersForUser?id=123
\`\`\`

## 3. Return Appropriate Status Codes
- **200** - Success
- **201** - Created
- **400** - Bad Request
- **401** - Unauthorized
- **404** - Not Found
- **500** - Server Error

## 4. Version Your API
\`\`\`
/api/v1/users
/api/v2/users
\`\`\`

## 5. Use Pagination
For large datasets, always implement pagination with limit and offset parameters.`,
        timestamp: new Date('2025-07-13T09:15:30')
      }
    ],
    createdAt: new Date('2025-07-13T09:15:00')
  }
];

export const mockUser = {
  id: 'user1',
  name: 'User',
  email: 'user@example.com',
  avatar: null
};

export const models = [
  { id: 'gpt-4o', name: 'GPT-4o', description: 'Great for most tasks' },
  { id: 'gpt-4', name: 'GPT-4', description: 'Advanced reasoning' },
  { id: 'gpt-3.5', name: 'GPT-3.5', description: 'Fast and efficient' }
];
