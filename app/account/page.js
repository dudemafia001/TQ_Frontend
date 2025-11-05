"use client";
import { useEffect, useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useRouter } from "next/navigation";

export default function AccountPage() {
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();
  const [accountData, setAccountData] = useState({
    username: "",
    email: "",
    joinedDate: ""
  });

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/auth");
    } else {
      // Set mock account data - replace with actual API call
      setAccountData({
        username: user || "",
        email: `${user}@example.com`,
        joinedDate: "2024"
      });
    }
  }, [isAuthenticated, router, user]);

  if (!isAuthenticated) {
    return <div>Redirecting...</div>;
  }

  return (
    <div className="container mt-4">
      <div className="row">
        <div className="col-md-8 mx-auto">
          <h1>Account Details</h1>
          <div className="card">
            <div className="card-body">
              <form>
                <div className="mb-3">
                  <label htmlFor="username" className="form-label">Username</label>
                  <input
                    type="text"
                    className="form-control"
                    id="username"
                    value={accountData.username}
                    readOnly
                  />
                </div>
                <div className="mb-3">
                  <label htmlFor="email" className="form-label">Email</label>
                  <input
                    type="email"
                    className="form-control"
                    id="email"
                    value={accountData.email}
                    readOnly
                  />
                </div>
                <div className="mb-3">
                  <label htmlFor="joinedDate" className="form-label">Member Since</label>
                  <input
                    type="text"
                    className="form-control"
                    id="joinedDate"
                    value={accountData.joinedDate}
                    readOnly
                  />
                </div>
                <button 
                  type="button" 
                  className="btn btn-primary"
                  style={{ backgroundColor: "#124f31", borderColor: "#124f31" }}
                >
                  Edit Profile
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
