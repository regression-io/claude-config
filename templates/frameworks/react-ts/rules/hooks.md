# React Hooks Rules

## Rules of Hooks
- Only call hooks at the top level (not in loops, conditions, or nested functions)
- Only call hooks from React functions (components or custom hooks)
- Custom hooks must start with `use`

## useState
```typescript
// Type inference works for primitives
const [count, setCount] = useState(0);

// Explicit typing for complex types
const [user, setUser] = useState<User | null>(null);

// Use functional updates for derived state
setCount(prev => prev + 1);
```

## useEffect
```typescript
// Always specify dependencies
useEffect(() => {
  fetchUser(userId).then(setUser);
}, [userId]);

// Cleanup subscriptions
useEffect(() => {
  const subscription = api.subscribe(handleUpdate);
  return () => subscription.unsubscribe();
}, []);

// Avoid useEffect for:
// - Transforming data (use useMemo)
// - Handling events (use event handlers)
// - Initializing state (use initializer function)
```

## useMemo & useCallback
```typescript
// useMemo for expensive calculations
const sortedItems = useMemo(
  () => items.sort((a, b) => a.name.localeCompare(b.name)),
  [items]
);

// useCallback for stable function references
const handleSubmit = useCallback(
  (data: FormData) => {
    submitForm(data);
  },
  [submitForm]
);
```

## Custom Hooks
```typescript
// Extract reusable logic
function useAsync<T>(asyncFn: () => Promise<T>, deps: unknown[] = []) {
  const [state, setState] = useState<{
    data: T | null;
    loading: boolean;
    error: Error | null;
  }>({ data: null, loading: true, error: null });

  useEffect(() => {
    setState(s => ({ ...s, loading: true }));
    asyncFn()
      .then(data => setState({ data, loading: false, error: null }))
      .catch(error => setState({ data: null, loading: false, error }));
  }, deps);

  return state;
}

// Usage
function UserProfile({ userId }: { userId: string }) {
  const { data: user, loading, error } = useAsync(
    () => fetchUser(userId),
    [userId]
  );

  if (loading) return <Spinner />;
  if (error) return <Error message={error.message} />;
  return <UserCard user={user!} />;
}
```
