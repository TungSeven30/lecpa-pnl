import { Routes, Route, Link } from 'react-router-dom';

function HomePage() {
  return (
    <div style={{ padding: '2rem', fontFamily: 'system-ui, sans-serif' }}>
      <h1>LeCPA P&L Generator</h1>
      <p>
        Transform client bank statements into professional profit & loss reports
        in minutes.
      </p>
      <nav style={{ marginTop: '1rem' }}>
        <Link to="/login" style={{ color: '#0066cc', textDecoration: 'none' }}>
          Login to get started
        </Link>
      </nav>
    </div>
  );
}

function LoginPage() {
  return (
    <div style={{ padding: '2rem', fontFamily: 'system-ui, sans-serif' }}>
      <h1>Login</h1>
      <p>Magic link authentication coming soon...</p>
      <Link to="/" style={{ color: '#0066cc', textDecoration: 'none' }}>
        Back to home
      </Link>
    </div>
  );
}

function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/login" element={<LoginPage />} />
    </Routes>
  );
}

export default App;
