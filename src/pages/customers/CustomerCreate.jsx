import { createCustomer } from "../../services/customersApi";
import { useNavigate } from "react-router-dom";
import { useState } from "react";

const CustomerCreate = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: "",
    phone: "",
  });

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await createCustomer(form);
      navigate("/customers");
    } catch (error) {
      console.error("Error creating customer:", error.message);
    }
  };

  return (
    <div>
      <h1 className="text-xl font-bold mb-4">New Customer</h1>
      <form onSubmit={handleSubmit} className="space-y-4 max-w-md">
        <input
          name="name"
          placeholder="Customer Name"
          value={form.name}
          onChange={handleChange}
          className="input"
          required
        />
        <input
          name="phone"
          placeholder="Phone Number"
          value={form.phone}
          onChange={handleChange}
          className="input"
          required
        />
        <button className="btn-primary">Create Customer</button>
      </form>
    </div>
  );
};

export default CustomerCreate;
