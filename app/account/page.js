"use client";
import { useEffect, useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useRouter } from "next/navigation";
import config, { buildApiUrl } from "../../config";

export default function AccountPage() {
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();
  const [accountData, setAccountData] = useState({
    username: "",
    fullName: "",
    email: "",
    mobile: "",
    joinedDate: ""
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/auth");
    } else {
      // Fetch actual user data from backend
      const fetchUserData = async () => {
        try {
          const response = await fetch(buildApiUrl(`/api/auth/profile/${user}`));
          
          if (response.ok) {
            const data = await response.json();
            if (data.success && data.user) {
              setAccountData({
                username: data.user.username || "",
                fullName: data.user.fullName || "",
                email: data.user.email || "",
                mobile: data.user.mobile || "",
                joinedDate: data.user.createdAt ? new Date(data.user.createdAt).toLocaleDateString() : ""
              });
            }
          }
        } catch (error) {
          console.error("Error fetching user data:", error);
        } finally {
          setLoading(false);
        }
      };

      fetchUserData();
    }
  }, [isAuthenticated, router, user]);

  if (!isAuthenticated || loading) {
    return <div>Loading...</div>;
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
                  <label htmlFor="fullName" className="form-label">Full Name</label>
                  <input
                    type="text"
                    className="form-control"
                    id="fullName"
                    value={accountData.fullName}
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
                  <label htmlFor="mobile" className="form-label">Mobile Number</label>
                  <input
                    type="text"
                    className="form-control"
                    id="mobile"
                    value={accountData.mobile}
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
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
