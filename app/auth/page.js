"use client";
import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "../contexts/AuthContext";
import config, { buildApiUrl } from "../../config";
import "bootstrap/dist/css/bootstrap.min.css";
import "./auth.css";

function AuthPageContent() {
  const [username, setUsername] = useState("");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [mobile, setMobile] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [isSignup, setIsSignup] = useState(false);
  const [loginMethod, setLoginMethod] = useState("password"); // "password" or "otp"
  const [otpSent, setOtpSent] = useState(false);
  const [otpTimer, setOtpTimer] = useState(0);
  const [message, setMessage] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const { login, isAuthenticated } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (isAuthenticated) {
      const redirect = searchParams.get('redirect');
      if (redirect === 'checkout') {
        router.push("/checkout");
      } else if (redirect === 'menu') {
        router.push("/");
      } else {
        router.push("/");
      }
    }
  }, [isAuthenticated, router, searchParams]);

  // OTP Timer countdown
  useEffect(() => {
    let interval = null;
    if (otpTimer > 0) {
      interval = setInterval(() => {
        setOtpTimer(timer => timer - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [otpTimer]);

  const handleSendOtp = async () => {
    if (!mobile || !/^[0-9]{10}$/.test(mobile)) {
      setMessage("Please enter a valid 10-digit mobile number");
      return;
    }

    setMessage("Sending OTP...");

    try {
      const res = await fetch(buildApiUrl(config.api.endpoints.otp.generate), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mobile }),
      });

      const data = await res.json();
      if (res.ok) {
        setOtpSent(true);
        setOtpTimer(300); // 5 minutes
        setMessage(`OTP sent to ${mobile}. ${data.developmentOtp ? `Development OTP: ${data.developmentOtp}` : ""}`);
      } else {
        setMessage(data.message || "Failed to send OTP");
      }
    } catch {
      setMessage("Server error");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("Loading...");

    try {
      let endpoint, body;

      if (isSignup) {
        // Validate required fields for signup
        if (!fullName.trim()) {
          setMessage("Please enter your full name");
          return;
        }
        if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
          setMessage("Please enter a valid email address");
          return;
        }
        if (!mobile || !/^[0-9]{10}$/.test(mobile)) {
          setMessage("Please enter a valid 10-digit mobile number");
          return;
        }

        endpoint = buildApiUrl(config.api.endpoints.auth.signup);
        body = { username, fullName, email, mobile, password };
      } else {
        // Login flow
        if (loginMethod === "password") {
          endpoint = buildApiUrl(config.api.endpoints.auth.login);
          body = { username, password };
        } else {
          // OTP login
          if (!otp) {
            setMessage("Please enter the OTP");
            return;
          }
          endpoint = buildApiUrl(config.api.endpoints.otp.verify);
          body = { mobile, otp };
        }
      }

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (res.ok) {
        if (isSignup) {
          // After signup, switch to sign-in mode
          setMessage("Account created successfully! Please sign in.");
          setIsSignup(false);
          // Clear password field for security
          setPassword("");
        } else {
          // Login flow
          login(data.username || username, data.fullName);
          setMessage(data.message);

          setTimeout(() => {
            const redirect = searchParams.get('redirect');
            if (redirect === 'checkout') {
              router.push("/checkout");
            } else if (redirect === 'menu') {
              router.push("/");
            } else {
              router.push("/");
            }
          }, 800);
        }
      } else {
        setMessage(data.message || "Authentication failed");
      }
    } catch {
      setMessage("Server error");
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h2 className="auth-title">{isSignup ? "Create an Account" : "Sign In"}</h2>

        {/* Login Method Toggle - only for sign in */}
        {!isSignup && (
          <div className="mb-4">
            <label className="form-label fw-bold">Sign in with:</label>
            <div className="d-flex gap-2">
              <button
                type="button"
                className={`btn btn-sm flex-fill`}
                style={{
                  backgroundColor: loginMethod === "password" ? "#dd9933" : "transparent",
                  borderColor: "#dd9933",
                  color: loginMethod === "password" ? "white" : "#dd9933"
                }}
                onClick={() => {
                  setLoginMethod("password");
                  setOtpSent(false);
                  setOtp("");
                  setMessage("");
                }}
              >
                Password
              </button>
              <button
                type="button"
                className={`btn btn-sm flex-fill`}
                style={{
                  backgroundColor: loginMethod === "otp" ? "#dd9933" : "transparent",
                  borderColor: "#dd9933",
                  color: loginMethod === "otp" ? "white" : "#dd9933"
                }}
                onClick={() => {
                  setLoginMethod("otp");
                  setMessage("");
                }}
              >
                OTP
              </button>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* Full Name - only for signup */}
          {isSignup && (
            <div className="mb-3">
              <label htmlFor="fullName" className="form-label fw-bold">
                Full Name
              </label>
              <input
                type="text"
                id="fullName"
                className="form-control"
                placeholder="Enter your full name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required={isSignup}
              />
            </div>
          )}

          {/* Email - only for signup */}
          {isSignup && (
            <div className="mb-3">
              <label htmlFor="email" className="form-label fw-bold">
                Email Address
              </label>
              <input
                type="email"
                id="email"
                className="form-control"
                placeholder="Enter your email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required={isSignup}
              />
            </div>
          )}

          {/* Username - for password login and signup */}
          {(isSignup || loginMethod === "password") && (
            <div className="mb-3">
              <label htmlFor="username" className="form-label fw-bold">
                Username
              </label>
              <input
                type="text"
                id="username"
                className="form-control"
                placeholder="Enter your username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required={isSignup || loginMethod === "password"}
              />
            </div>
          )}

          {/* Mobile Number - for signup and OTP login */}
          {(isSignup || loginMethod === "otp") && (
            <div className="mb-3">
              <label htmlFor="mobile" className="form-label fw-bold">
                Mobile Number
              </label>
              <div className="d-flex gap-2">
                <input
                  type="tel"
                  id="mobile"
                  className="form-control"
                  placeholder="Enter your 10-digit mobile number"
                  value={mobile}
                  onChange={(e) => setMobile(e.target.value)}
                  pattern="[0-9]{10}"
                  maxLength="10"
                  required={isSignup || loginMethod === "otp"}
                />
                {!isSignup && loginMethod === "otp" && (
                  <button
                    type="button"
                    className="btn btn-outline-primary"
                    onClick={handleSendOtp}
                    disabled={otpTimer > 0}
                  >
                    {otpTimer > 0 ? `${Math.floor(otpTimer / 60)}:${(otpTimer % 60).toString().padStart(2, '0')}` : "Send OTP"}
                  </button>
                )}
              </div>
              <small className="text-muted">10 digits only</small>
            </div>
          )}

          {/* OTP Input - for OTP login when OTP is sent */}
          {!isSignup && loginMethod === "otp" && otpSent && (
            <div className="mb-3">
              <label htmlFor="otp" className="form-label fw-bold">
                Enter OTP
              </label>
              <input
                type="text"
                id="otp"
                className="form-control"
                placeholder="Enter 6-digit OTP"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                maxLength="6"
                pattern="[0-9]{6}"
                required
              />
              <small className="text-muted">OTP expires in {Math.floor(otpTimer / 60)}:{(otpTimer % 60).toString().padStart(2, '0')}</small>
            </div>
          )}

          {/* Password - for password login and signup */}
          {(isSignup || loginMethod === "password") && (
            <div className="mb-3">
              <label htmlFor="password" className="form-label fw-bold">
                Password
              </label>
              <div className="password-input-container">
                <input
                  type={showPassword ? "text" : "password"}
                  id="password"
                  className="form-control"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required={isSignup || loginMethod === "password"}
                />
                <button
                  type="button"
                  className="password-toggle-btn"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
                      <line x1="1" y1="1" x2="23" y2="23"/>
                    </svg>
                  ) : (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                      <circle cx="12" cy="12" r="3"/>
                    </svg>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            className="btn w-100 fw-bold"
            style={{ background: "#124f31", color: "#fff" }}
            disabled={!isSignup && loginMethod === "otp" && !otpSent}
          >
            {isSignup ? "Create Account" : 
             loginMethod === "otp" ? "Verify OTP" : "Sign In"}
          </button>
        </form>

        {/* Resend OTP */}
        {!isSignup && loginMethod === "otp" && otpSent && otpTimer === 0 && (
          <div className="text-center mt-2">
            <button
              type="button"
              className="btn btn-link p-0 fw-bold"
              style={{ color: "#124f31", textDecoration: "underline" }}
              onClick={handleSendOtp}
            >
              Resend OTP
            </button>
          </div>
        )}

        {/* Toggle Link */}
        <div className="text-center mt-3">
          {isSignup ? (
            <p className="mb-0">
              Already have an account?{" "}
              <button
                type="button"
                className="btn btn-link p-0 fw-bold"
                style={{ color: "#124f31", textDecoration: "underline" }}
                onClick={() => {
                  setIsSignup(false);
                  setMobile("");
                  setOtp("");
                  setOtpSent(false);
                  setOtpTimer(0);
                  setMessage("");
                }}
              >
                Sign in here
              </button>
            </p>
          ) : (
            <p className="mb-0">
              Don't have an account?{" "}
              <button
                type="button"
                className="btn btn-link p-0 fw-bold"
                style={{ color: "#124f31", textDecoration: "underline" }}
                onClick={() => {
                  setIsSignup(true);
                  setLoginMethod("password");
                  setOtpSent(false);
                  setOtp("");
                  setOtpTimer(0);
                  setMessage("");
                }}
              >
                Create an account
              </button>
            </p>
          )}
        </div>

        {message && (
          <div className="alert alert-info text-center mt-3 p-2">{message}</div>
        )}
      </div>
    </div>
  );
}

export default function AuthPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <AuthPageContent />
    </Suspense>
  );
}
