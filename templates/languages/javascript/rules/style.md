# JavaScript Style Rules

## Naming Conventions
- `camelCase` for variables, functions, methods
- `PascalCase` for classes and constructors
- `UPPER_SNAKE_CASE` for constants
- Descriptive names: `getUserById` not `getUser` or `fetch`

## Modern JavaScript (ES6+)
```javascript
// Use const by default, let when needed, never var
const MAX_RETRIES = 3;
let currentRetry = 0;

// Arrow functions for callbacks
const doubled = items.map(item => item * 2);

// Destructuring
const { name, email } = user;
const [first, ...rest] = items;

// Template literals
const message = `Hello, ${name}!`;

// Spread operator
const merged = { ...defaults, ...options };
const combined = [...arr1, ...arr2];

// Optional chaining and nullish coalescing
const city = user?.address?.city ?? 'Unknown';
```

## Functions
```javascript
// Default parameters
function greet(name = 'World') {
  return `Hello, ${name}!`;
}

// Rest parameters
function sum(...numbers) {
  return numbers.reduce((a, b) => a + b, 0);
}

// Arrow functions for short operations
const double = x => x * 2;
const add = (a, b) => a + b;

// Regular functions for methods and complex logic
function processUser(user) {
  // Complex logic...
}
```

## Objects and Classes
```javascript
// Object shorthand
const name = 'John';
const user = { name, age: 30 };

// Computed property names
const key = 'dynamicKey';
const obj = { [key]: 'value' };

// Classes
class User {
  #privateField;  // Private field

  constructor(name, email) {
    this.name = name;
    this.email = email;
    this.#privateField = 'secret';
  }

  greet() {
    return `Hello, ${this.name}`;
  }
}
```

## Modules
```javascript
// Named exports (preferred)
export function helper() { }
export const CONFIG = { };

// Import
import { helper, CONFIG } from './utils.js';

// Re-export
export { helper } from './utils.js';
```
