# React State Management

## State Location
- **Local state**: UI state (open/closed, input values)
- **Lifted state**: Shared between siblings (lift to common parent)
- **Context**: Global app state (theme, auth, locale)
- **External store**: Complex state with many updates (Redux, Zustand)

## Local State
```typescript
function SearchForm() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);

  // Local state is fine for form inputs
  return (
    <form>
      <input value={query} onChange={e => setQuery(e.target.value)} />
    </form>
  );
}
```

## Context API
```typescript
// Create typed context
interface AuthContextType {
  user: User | null;
  login: (credentials: Credentials) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

// Provider
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);

  const login = async (credentials: Credentials) => {
    const user = await authService.login(credentials);
    setUser(user);
  };

  const logout = () => setUser(null);

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

// Custom hook for consumption
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
```

## State Updates
```typescript
// Immutable updates
setItems(items => [...items, newItem]);
setUser(user => ({ ...user, name: newName }));

// Avoid mutations
// ❌ Bad
items.push(newItem);
setItems(items);

// ✅ Good
setItems([...items, newItem]);
```

## Derived State
```typescript
// ❌ Bad: Derived state in useState
const [items, setItems] = useState<Item[]>([]);
const [filteredItems, setFilteredItems] = useState<Item[]>([]);

useEffect(() => {
  setFilteredItems(items.filter(i => i.active));
}, [items]);

// ✅ Good: Calculate during render or useMemo
const filteredItems = useMemo(
  () => items.filter(i => i.active),
  [items]
);
```
