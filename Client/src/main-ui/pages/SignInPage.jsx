import { Link } from 'react-router-dom';
import MainHeader from '../components/Header/MainHeader';

const SignInPage = () => (
  <div className="min-h-screen bg-stone-50">
    <MainHeader />
    <main className="mx-auto max-w-md px-4 py-16">
      <h1 className="font-display text-2xl font-bold text-stone-900">Sign In</h1>
      <p className="mt-2 text-stone-600">Sign in page — coming soon.</p>
      <Link to="/" className="mt-4 inline-block text-primary-600 hover:underline">Back to Home</Link>
    </main>
  </div>
);

export default SignInPage;
