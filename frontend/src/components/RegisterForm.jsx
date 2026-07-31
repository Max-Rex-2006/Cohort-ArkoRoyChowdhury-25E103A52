import { useState } from "react";
import axios from "axios";
import "../styles/RegisterForm.css";

function RegisterForm() {
  const [name, setName] = useState("");
  const [registrationNo, setRegistrationNo] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [age, setAge] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const response = await axios.post("http://localhost:3001/user", {
        name,
        registration_no: registrationNo,
        email,
        password,
        age,
      });

      console.log(response.data);
      alert("User Registered Successfully!");
    } catch (error) {
      console.log(error.response?.data || error.message);
      alert("Registration Failed!");
    }
  };

  return (
    <div className="page">
      <div className="register-form">
        <h1 className="form-heading">User Registration</h1>

        <form onSubmit={handleSubmit} className="form">
          <input
            type="text"
            placeholder="Enter your name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />

          <input
            type="text"
            placeholder="Enter Registration Number"
            value={registrationNo}
            onChange={(e) => setRegistrationNo(e.target.value)}
          />

          <input
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <input
            type="password"
            placeholder="Enter your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <input
            type="number"
            placeholder="Enter your age"
            value={age}
            onChange={(e) => setAge(e.target.value)}
          />

          <button type="submit">Register</button>
        </form>
      </div>
    </div>
  );
}

export default RegisterForm;
