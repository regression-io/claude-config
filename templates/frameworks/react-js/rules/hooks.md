# React Hooks Rules (JavaScript)

## Rules of Hooks
- Only call hooks at the top level
- Only call hooks from React functions
- Custom hooks must start with `use`

## useState
```javascript
// Simple state
const [count, setCount] = useState(0);
const [user, setUser] = useState(null);

// Lazy initialization for expensive values
const [data, setData] = useState(() => computeExpensiveValue());

// Functional updates
setCount(prev => prev + 1);
```

## useEffect
```javascript
// Fetch data
useEffect(() => {
  let cancelled = false;

  fetchUser(userId).then(data => {
    if (!cancelled) setUser(data);
  });

  return () => { cancelled = true; };
}, [userId]);

// Event listener
useEffect(() => {
  const handler = (e) => setSize({ width: e.target.innerWidth });
  window.addEventListener('resize', handler);
  return () => window.removeEventListener('resize', handler);
}, []);
```

## useMemo & useCallback
```javascript
// Expensive calculation
const sortedList = useMemo(
  () => items.sort((a, b) => a.name.localeCompare(b.name)),
  [items]
);

// Stable callback reference
const handleClick = useCallback(
  () => { onClick(id); },
  [onClick, id]
);
```

## Custom Hooks
```javascript
// Reusable data fetching
function useFetch(url) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    fetch(url)
      .then(res => res.json())
      .then(data => {
        if (!cancelled) {
          setData(data);
          setLoading(false);
        }
      })
      .catch(err => {
        if (!cancelled) {
          setError(err);
          setLoading(false);
        }
      });

    return () => { cancelled = true; };
  }, [url]);

  return { data, loading, error };
}

// Usage
function UserProfile({ userId }) {
  const { data: user, loading, error } = useFetch(`/api/users/${userId}`);

  if (loading) return <Spinner />;
  if (error) return <Error message={error.message} />;
  return <UserCard user={user} />;
}
```
