import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "../../../config/env";

export const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [progress, setProgress] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setProgress(true);
    setError(null);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError(error.message);
      setProgress(false);
    } else {
      // alert("Login successful!");
      setTimeout(() => {
        setProgress(false);
        navigate("/");
      }, 1500);
    }
  };

  return (
    <div>
      <section className=" dark:bg-gray-900">
        <div className="flex flex-col items-center justify-center px-6 py-8 mx-auto md:h-screen lg:py-0">
          <div className="w-full bg-white md:mt-0 sm:max-w-md xl:p-0 dark:bg-gray-800 dark:border-gray-700">
            <div className="p-6 text-center space-y-4 md:space-y-6 sm:p-8">
              <h1
                href="#"
                className="text-center mb-6 text-2xl font-black text-blue-600"
              >
                MEducation
              </h1>
              <h1 className="text-xl py-3 font-semibold leading-tight tracking-tight">
                Login to your account
              </h1>
              <form className="space-y-4 md:space-y-6" onSubmit={handleLogin}>
                <div className="text-left">
                  <label
                    htmlFor="email"
                    className="block mb-2 text-sm font-medium text-gray-900 dark:text-white"
                  >
                    Your email
                  </label>
                  <input
                    type="email"
                    name="email"
                    id="email"
                    className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                    placeholder="name@company.com"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
                <div className="text-left">
                  <label
                    htmlFor="password"
                    className="block mb-2 text-sm font-medium text-gray-900 dark:text-white"
                  >
                    Password
                  </label>
                  <input
                    type="password"
                    name="password"
                    id="password"
                    placeholder="••••••••"
                    className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
                {error && <p className="text-red-500 text-sm">{error}</p>}
                <button
                  type="submit"
                  className="w-full my-1 dark:text-white bg-blue-50 text-blue-600 hover:bg-blue-100 focus:bg-blue-200 cursor-pointer font-medium rounded-lg text-sm px-5 py-2.5 text-center flex items-center justify-center"
                  disabled={progress}
                >
                  {progress ? (
                    <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent border-solid rounded-full animate-spin"></div>
                  ) : (
                    "Login"
                  )}
                </button>
                <div className="text-sm my-1 py-1 font-light text-gray-500 dark:text-gray-400">
                  <p>or</p>
                </div>
                <Link to="/signup">
                  <button
                    type="submit"
                    className="w-full dark:text-white  text-blue-600 cursor-pointer font-medium rounded-lg text-sm px-5 py-2.5 text-center"
                  >
                    Create Account
                  </button>
                </Link>
              </form>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
