import { useState, useEffect } from "react";
import { FaGoogle } from "react-icons/fa";
import {
  auth,
  googleProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
} from "../../../firebase";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [user, setUser] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    if (!email || !password) {
      setError("Both fields are required.");
      return;
    }
    try {
      await signInWithEmailAndPassword(auth, email, password);
      console.log("Login successful");
    } catch (err) {
      setError("Invalid email or password.");
    }
  };

  const handleSignup = async () => {
    setError("");
    if (!email || !password) {
      setError("Both fields are required.");
      return;
    }
    try {
      await createUserWithEmailAndPassword(auth, email, password);
      console.log("Signup successful");
      setEmail("");
      setPassword("");
    } catch (err) {
      setError("Signup failed. Email might already be in use.");
    }
  };

  const handleGoogleLogin = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
      console.log("Google sign-in successful");
    } catch (err) {
      setError("Google sign-in failed.");
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="w-full max-w-sm bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-2xl font-bold text-center text-gray-700">
          {user ? `Welcome, ${user.email}` : "Login"}
        </h2>
        {error && (
          <p className="text-red-500 text-sm text-center mt-2">{error}</p>
        )}
        {!user ? (
          <>
            <form onSubmit={handleLogin} className="mt-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-2 mt-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
                  required
                />
              </div>
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700">
                  Password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-2 mt-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
                  required
                />
              </div>
              <button
                type="submit"
                className="w-full mt-4 bg-blue-500 text-white py-2 rounded-lg hover:bg-blue-600 cursor-pointer"
              >
                Login
              </button>
            </form>
            <button
              onClick={handleSignup}
              className="w-full mt-2 bg-green-500 text-white py-2 rounded-lg hover:bg-green-600 cursor-pointer"
            >
              Sign Up
            </button>
            <div className="flex items-center justify-center mt-4">
              <button
                onClick={handleGoogleLogin}
                className="flex items-center gap-2 bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 cursor-pointer"
              >
                <FaGoogle /> Sign in with Google
              </button>
            </div>
          </>
        ) : (
          <p className="text-center text-green-600 mt-4">You are logged in!</p>
        )}
      </div>
    </div>
  );
};

export default Login;
